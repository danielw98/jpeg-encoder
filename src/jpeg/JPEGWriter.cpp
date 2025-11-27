#include "jpegdsp/jpeg/JPEGWriter.hpp"
#include "jpegdsp/jpeg/JPEGConstants.hpp"
#include "jpegdsp/jpeg/HuffmanTables.hpp"
#include "jpegdsp/jpeg/Quantization.hpp"
#include "jpegdsp/jpeg/BlockEntropyEncoder.hpp"
#include "jpegdsp/jpeg/Huffman.hpp"
#include "jpegdsp/transforms/DCTTransform.hpp"
#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/Constants.hpp"
#include "jpegdsp/core/ColorSpace.hpp"
#include "jpegdsp/core/Downsampler.hpp"
#include "jpegdsp/util/BitWriter.hpp"
#include <stdexcept>
#include <array>

namespace {
    // Standard JPEG zig-zag order (ITU-T.81 Figure A.6)
    // Maps zigzag position to raster-scan position
    // Used for writing DQT tables in zigzag order per ITU-T.81 B.2.4.1
    constexpr std::array<std::size_t, jpegdsp::core::BlockElementCount> ZigZagIndex = {
         0,  1,  8, 16,  9,  2,  3, 10,
        17, 24, 32, 25, 18, 11,  4,  5,
        12, 19, 26, 33, 40, 48, 41, 34,
        27, 20, 13,  6,  7, 14, 21, 28,
        35, 42, 49, 56, 57, 50, 43, 36,
        29, 22, 15, 23, 30, 37, 44, 51,
        58, 59, 52, 45, 38, 31, 39, 46,
        53, 60, 61, 54, 47, 55, 62, 63
    };
}

namespace jpegdsp::jpeg {

// Huffman tables now in HuffmanTables.hpp

std::vector<std::uint8_t> JPEGWriter::encodeGrayscale(const core::Image& img, int quality)
{
    // Validate input
    if (img.channels() != 1)
    {
        throw std::invalid_argument("JPEGWriter::encodeGrayscale requires single-channel grayscale image");
    }

    // Pad to 8x8 MCU grid if needed
    const core::Image* workImg = &img;
    core::Image paddedImg;
    if (img.width() % core::BlockSize != 0 || img.height() % core::BlockSize != 0)
    {
        paddedImg = img.padToMultiple(core::BlockSize, core::BlockSize);
        workImg = &paddedImg;
    }

    // Reset output buffer
    m_buffer.clear();
    m_buffer.reserve(workImg->width() * workImg->height() / 4); // Rough estimate

    // Generate standard luma quantization table
    QuantTable qTable = QuantTable::makeLumaStd(quality);
    const std::uint16_t* quantData = qTable.data();

    // Write JPEG file structure
    writeSOI();
    writeAPP0();
    writeAPP1(static_cast<std::uint16_t>(img.width()), 
              static_cast<std::uint16_t>(img.height())); // Original dimensions
    writeDQT(quantData);
    writeSOF0(img.width(), img.height()); // Use original dimensions (decoder ignores padding)
    
    // Write Huffman tables for luma DC and AC
    writeDHT(HUFFMAN_CLASS_DC, HUFFMAN_DEST_LUMA, 
             StandardHuffmanTables::DC_LUMA_NBITS.data(), 
             StandardHuffmanTables::DC_LUMA_VALS.data(), 
             StandardHuffmanTables::DC_LUMA_VALS.size());
    writeDHT(HUFFMAN_CLASS_AC, HUFFMAN_DEST_LUMA, 
             StandardHuffmanTables::AC_LUMA_NBITS.data(), 
             StandardHuffmanTables::AC_LUMA_VALS.data(), 
             StandardHuffmanTables::AC_LUMA_VALS.size());
    
    writeSOS();
    
    // Write entropy-coded scan data
    // Pass original dimensions so we only encode blocks covering the original image
    writeScanData(*workImg, quantData, img.width(), img.height());
    
    writeEOI();

    return m_buffer;
}

void JPEGWriter::writeMarker(std::uint16_t marker)
{
    writeByte(static_cast<std::uint8_t>(marker >> 8));
    writeByte(static_cast<std::uint8_t>(marker & 0xFF));
}

void JPEGWriter::writeWord(std::uint16_t value)
{
    writeByte(static_cast<std::uint8_t>(value >> 8));
    writeByte(static_cast<std::uint8_t>(value & 0xFF));
}

void JPEGWriter::writeByte(std::uint8_t value)
{
    m_buffer.push_back(value);
}

void JPEGWriter::writeSOI()
{
    writeMarker(MARKER_SOI);
}

void JPEGWriter::writeAPP0()
{
    writeMarker(MARKER_APP0);
    writeWord(APP0_LENGTH); // Segment length (including this length field)
    
    // JFIF identifier (null-terminated)
    writeByte('J');
    writeByte('F');
    writeByte('I');
    writeByte('F');
    writeByte(0x00);
    
    writeWord(0x0101); // JFIF version 1.01
    writeByte(0);      // Density units (0 = no units, aspect ratio only)
    writeWord(1);      // X density
    writeWord(1);      // Y density
    writeByte(0);      // Thumbnail width
    writeByte(0);      // Thumbnail height
}

void JPEGWriter::writeAPP1(std::uint16_t originalWidth, std::uint16_t originalHeight)
{
    writeMarker(MARKER_APP1);
    writeWord(14); // Length: 2 (length) + 8 (identifier) + 2 (width) + 2 (height) = 14
    
    // Custom identifier: "JPEGDSP\0" (8 bytes including null terminator)
    writeByte('J');
    writeByte('P');
    writeByte('E');
    writeByte('G');
    writeByte('D');
    writeByte('S');
    writeByte('P');
    writeByte(0x00);
    
    // Original dimensions (before padding)
    writeWord(originalWidth);
    writeWord(originalHeight);
}

void JPEGWriter::writeDQT(const std::uint16_t* quantTable)
{
    writeMarker(MARKER_DQT);
    writeWord(DQT_LENGTH_8BIT); // Length: 2 + 1 + 64 = 67 bytes
    writeByte(0);  // Precision (0 = 8-bit) | Table ID (0 = luma)
    
    // Write quantization table values in ZIGZAG ORDER (ITU-T.81 B.2.4.1)
    // The quantization table is stored in raster order, but must be written in zigzag order
    for (std::size_t zz = 0; zz < core::BlockElementCount; zz++)
    {
        const std::size_t rasterPos = ZigZagIndex[zz];
        writeByte(static_cast<std::uint8_t>(quantTable[rasterPos]));
    }
}

void JPEGWriter::writeSOF0(std::uint16_t width, std::uint16_t height)
{
    writeMarker(MARKER_SOF0);
    writeWord(11); // Length: 2 + 1 + 2 + 2 + 1 + (1*3) = 11 bytes
    writeByte(PRECISION);  // Sample precision (8 bits per component)
    writeWord(height);
    writeWord(width);
    writeByte(1);  // Number of components (grayscale = 1)
    
    // Component specification (1 component):
    writeByte(COMPONENT_Y);  // Component ID (Y)
    writeByte(SAMPLING_1x1); // Sampling factors: horizontal=1, vertical=1 (no subsampling)
    writeByte(0);  // Quantization table ID (0 = luma table)
}

void JPEGWriter::writeDHT(std::uint8_t tableClass, std::uint8_t tableId,
                          const std::uint8_t* bits, const std::uint8_t* values, std::size_t numValues)
{
    writeMarker(MARKER_DHT);
    writeWord(static_cast<std::uint16_t>(DHT_BASE_LENGTH + numValues)); // Length: 2 + 1 + 16 + numValues
    writeByte((tableClass << 4) | tableId); // Table class (0=DC, 1=AC) | Table ID
    
    // Write 16 bytes of bit lengths
    for (std::size_t i = 0; i < 16; ++i)
    {
        writeByte(bits[i]);
    }
    
    // Write Huffman values
    for (std::size_t i = 0; i < numValues; ++i)
    {
        writeByte(values[i]);
    }
}

void JPEGWriter::writeSOS()
{
    writeMarker(MARKER_SOS);
    writeWord(8); // Length: 2 + 1 + 1 + (1*2) + 3 = 8 bytes
    writeByte(1); // Number of components in scan (grayscale = 1)
    
    // Component selector:
    writeByte(1);  // Component ID (Y)
    writeByte(0x00); // DC table 0, AC table 0
    
    // Spectral selection
    writeByte(0);   // Start of spectral selection (0 for baseline)
    writeByte(63);  // End of spectral selection (63 for baseline)
    writeByte(0);   // Successive approximation (0 for baseline)
}

void JPEGWriter::writeEOI()
{
    writeMarker(MARKER_EOI);
}

void JPEGWriter::writeScanData(const core::Image& img, const std::uint16_t* quantTable,
                                std::size_t origWidth, std::size_t origHeight)
{
    // Create DCT transform and encoder
    transforms::DCT8x8Transform dct;
    HuffmanTable dcLuma(HuffmanTableType::DC_Luma);
    HuffmanTable acLuma(HuffmanTableType::AC_Luma);
    HuffmanEncoder lumaEncoder(dcLuma, acLuma);
    
    // Note: chroma encoders not needed for grayscale - use placeholder
    HuffmanTable dcChroma(HuffmanTableType::DC_Chroma);
    HuffmanTable acChroma(HuffmanTableType::AC_Chroma);
    HuffmanEncoder chromaEncoder(dcChroma, acChroma);
    
    BlockEntropyEncoder entropyEncoder(lumaEncoder, chromaEncoder);
    
    // Bit writer for entropy-coded data
    util::BitWriter bitWriter;
    
    // DC prediction state
    std::int16_t prevDC = 0;
    
    // Create quantization table wrapper directly from input array
    std::array<std::uint16_t, core::BlockElementCount> qTableArray;
    for (std::size_t i = 0; i < core::BlockElementCount; ++i)
    {
        qTableArray[i] = quantTable[i];
    }
    QuantTable qTable(qTableArray);
    
    // Calculate MCU grid based on original dimensions (not padded)
    // Decoder expects ceil(origWidth/8) * ceil(origHeight/8) blocks
    const std::size_t mcuCols = (origWidth + 7) / 8;
    const std::size_t mcuRows = (origHeight + 7) / 8;
    
    // Process blocks in row-major order, only encoding what the decoder expects
    for (std::size_t mcuY = 0; mcuY < mcuRows; ++mcuY)
    {
        for (std::size_t mcuX = 0; mcuX < mcuCols; ++mcuX)
        {
            // Extract 8x8 block from padded image
            core::Block8x8f block;
            for (std::size_t y = 0; y < 8; ++y)
            {
                for (std::size_t x = 0; x < 8; ++x)
                {
                    const std::size_t imgX = mcuX * 8 + x;
                    const std::size_t imgY = mcuY * 8 + y;
                    block.at(x, y) = static_cast<float>(img.at(imgX, imgY, 0)) - 128.0f;
                }
            }
            
            // Forward DCT
            core::Block8x8f dctBlock;
            dct.forward(block, dctBlock);
            
            // Quantize
            core::Block8x8i quantBlock;
            Quantizer::quantize(dctBlock, qTable, quantBlock);
            
            // Entropy encode (ZigZag + RLE + Huffman + DC prediction)
            prevDC = entropyEncoder.encodeLumaBlock(quantBlock, prevDC, bitWriter);
        }
    }
    
    // Flush remaining bits
    bitWriter.flushToByte();
    
    // Append entropy-coded data to output buffer
    const std::vector<std::uint8_t>& scanData = bitWriter.buffer();
    m_buffer.insert(m_buffer.end(), scanData.begin(), scanData.end());
}

// ============================================================================
// YCbCr 4:2:0 color JPEG encoding
// ============================================================================

std::vector<std::uint8_t> JPEGWriter::encodeYCbCr(const core::Image& img, int quality)
{
    // Validate input
    if (img.colorSpace() != core::ColorSpace::RGB || img.channels() != 3)
    {
        throw std::invalid_argument("encodeYCbCr requires RGB image with 3 channels");
    }
    
    // Pad to 16x16 MCU grid if needed (YCbCr 4:2:0 requires 2×2 MCUs of 8×8 luma blocks)
    const core::Image* workImg = &img;
    core::Image paddedImg;
    if (img.width() % 16 != 0 || img.height() % 16 != 0)
    {
        paddedImg = img.padToMultiple(16, 16);
        workImg = &paddedImg;
    }
    
    m_buffer.clear();
    
    // Convert RGB to YCbCr
    using namespace core;
    const Image ycbcr = ColorConverter::RGBtoYCbCr(*workImg);
    
    // Split YCbCr into separate channels
    Image yChannel(ycbcr.width(), ycbcr.height(), ColorSpace::GRAY, 1);
    Image cbChannel(ycbcr.width(), ycbcr.height(), ColorSpace::GRAY, 1);
    Image crChannel(ycbcr.width(), ycbcr.height(), ColorSpace::GRAY, 1);
    
    for (std::size_t y = 0; y < ycbcr.height(); ++y)
    {
        for (std::size_t x = 0; x < ycbcr.width(); ++x)
        {
            yChannel.at(x, y, 0) = ycbcr.at(x, y, 0);
            cbChannel.at(x, y, 0) = ycbcr.at(x, y, 1);
            crChannel.at(x, y, 0) = ycbcr.at(x, y, 2);
        }
    }
    
    // Downsample Cb/Cr to 4:2:0 (half resolution)
    Downsampler downsampler;
    const Image cbcrSubsampled = downsampler.downsample420(cbChannel, crChannel);
    
    // Generate quantization tables
    const QuantTable lumaTable = QuantTable::makeLumaStd(quality);
    const QuantTable chromaTable = QuantTable::makeChromaStd(quality);
    
    std::uint16_t lumaData[core::BlockElementCount];
    std::uint16_t chromaData[core::BlockElementCount];
    
    for (std::size_t i = 0; i < core::BlockElementCount; ++i)
    {
        lumaData[i] = lumaTable.at(i);
        chromaData[i] = chromaTable.at(i);
    }
    
    // Write JPEG structure
    writeSOI();
    writeAPP0();
    writeAPP1(static_cast<std::uint16_t>(img.width()),
              static_cast<std::uint16_t>(img.height())); // Original dimensions
    writeDQT2(lumaData, chromaData); // Write both luma and chroma quantization tables
    writeSOF0Color(static_cast<std::uint16_t>(img.width()), static_cast<std::uint16_t>(img.height())); // Use original dimensions
    
    // Write Huffman tables (DC and AC for both luma and chroma)
    writeDHT(HUFFMAN_CLASS_DC, HUFFMAN_DEST_LUMA,   StandardHuffmanTables::DC_LUMA_NBITS.data(),   StandardHuffmanTables::DC_LUMA_VALS.data(),   12);
    writeDHT(HUFFMAN_CLASS_AC, HUFFMAN_DEST_LUMA,   StandardHuffmanTables::AC_LUMA_NBITS.data(),   StandardHuffmanTables::AC_LUMA_VALS.data(),   162);
    writeDHT(HUFFMAN_CLASS_DC, HUFFMAN_DEST_CHROMA, StandardHuffmanTables::DC_CHROMA_NBITS.data(), StandardHuffmanTables::DC_CHROMA_VALS.data(), 12);
    writeDHT(HUFFMAN_CLASS_AC, HUFFMAN_DEST_CHROMA, StandardHuffmanTables::AC_CHROMA_NBITS.data(), StandardHuffmanTables::AC_CHROMA_VALS.data(), 162);
    
    writeSOSColor();
    
    // Write entropy-coded scan data (interleaved MCU structure)
    // Pass original dimensions so we only encode MCUs covering the original image
    writeScanDataColor(yChannel, cbcrSubsampled, lumaData, chromaData, img.width(), img.height());
    
    writeEOI();
    
    return m_buffer;
}

void JPEGWriter::writeDQT2(const std::uint16_t* lumaTable, const std::uint16_t* chromaTable)
{
    // Write luma quantization table (table ID 0) in ZIGZAG ORDER (ITU-T.81 B.2.4.1)
    writeMarker(MARKER_DQT);
    writeWord(DQT_LENGTH_8BIT); // Length: 2 + 1 + 64 = 67 bytes
    writeByte(0);  // Precision (0 = 8-bit) | Table ID (0 = luma)
    
    for (std::size_t zz = 0; zz < core::BlockElementCount; zz++)
    {
        const std::size_t rasterPos = ZigZagIndex[zz];
        writeByte(static_cast<std::uint8_t>(lumaTable[rasterPos]));
    }
    
    // Write chroma quantization table (table ID 1) in ZIGZAG ORDER
    writeMarker(MARKER_DQT);
    writeWord(DQT_LENGTH_8BIT); // Length: 2 + 1 + 64 = 67 bytes
    writeByte(1);  // Precision (0 = 8-bit) | Table ID (1 = chroma)
    
    for (std::size_t zz = 0; zz < core::BlockElementCount; zz++)
    {
        const std::size_t rasterPos = ZigZagIndex[zz];
        writeByte(static_cast<std::uint8_t>(chromaTable[rasterPos]));
    }
}

void JPEGWriter::writeSOF0Color(std::uint16_t width, std::uint16_t height)
{
    writeMarker(MARKER_SOF0);
    writeWord(17); // Length: 2 + 1 + 2 + 2 + 1 + (3*3) = 17 bytes
    writeByte(8);  // Sample precision (8 bits per component)
    writeWord(height);
    writeWord(width);
    writeByte(3);  // Number of components (YCbCr = 3)
    
    // Component 1: Y (luma)
    writeByte(1);    // Component ID
    writeByte(0x22); // Sampling factors: H=2, V=2 (4:2:0 subsampling)
    writeByte(0);    // Quantization table ID (0 = luma)
    
    // Component 2: Cb (chroma blue)
    writeByte(2);    // Component ID
    writeByte(0x11); // Sampling factors: H=1, V=1
    writeByte(1);    // Quantization table ID (1 = chroma)
    
    // Component 3: Cr (chroma red)
    writeByte(3);    // Component ID
    writeByte(0x11); // Sampling factors: H=1, V=1
    writeByte(1);    // Quantization table ID (1 = chroma)
}

void JPEGWriter::writeSOSColor()
{
    writeMarker(MARKER_SOS);
    writeWord(12); // Length: 2 + 1 + (3*2) + 3 = 12 bytes
    writeByte(3);  // Number of components (YCbCr = 3)
    
    // Component 1: Y
    writeByte(1);  // Component ID
    writeByte(0x00); // DC table 0, AC table 0
    
    // Component 2: Cb
    writeByte(2);  // Component ID
    writeByte(0x11); // DC table 1, AC table 1
    
    // Component 3: Cr
    writeByte(3);  // Component ID
    writeByte(0x11); // DC table 1, AC table 1
    
    writeByte(0);  // Start of spectral selection (0 for baseline)
    writeByte(63); // End of spectral selection (63 for baseline)
    writeByte(0);  // Successive approximation bit positions
}

void JPEGWriter::writeScanDataColor(const core::Image& yChannel, const core::Image& cbcrSubsampled,
                                     const std::uint16_t* lumaTable, const std::uint16_t* chromaTable,
                                     std::size_t origWidth, std::size_t origHeight)
{
    using namespace core;
    using namespace transforms;
    using namespace util;
    
    // Create DCT transform and encoders
    DCT8x8Transform dct;
    
    HuffmanTable dcLuma(HuffmanTableType::DC_Luma);
    HuffmanTable acLuma(HuffmanTableType::AC_Luma);
    HuffmanEncoder lumaEncoder(dcLuma, acLuma);
    
    HuffmanTable dcChroma(HuffmanTableType::DC_Chroma);
    HuffmanTable acChroma(HuffmanTableType::AC_Chroma);
    HuffmanEncoder chromaEncoder(dcChroma, acChroma);
    
    BlockEntropyEncoder entropyEncoder(lumaEncoder, chromaEncoder);
    BitWriter bitWriter;
    
    // Build quantization tables
    std::array<std::uint16_t, core::BlockElementCount> lumaArray;
    std::array<std::uint16_t, core::BlockElementCount> chromaArray;
    for (std::size_t i = 0; i < core::BlockElementCount; ++i)
    {
        lumaArray[i] = lumaTable[i];
        chromaArray[i] = chromaTable[i];
    }
    QuantTable lumaQTable(lumaArray);
    QuantTable chromaQTable(chromaArray);
    
    // DC prediction accumulators
    std::int16_t prevDC_Y = 0;
    std::int16_t prevDC_Cb = 0;
    std::int16_t prevDC_Cr = 0;
    
    // Calculate MCU grid based on original dimensions (not padded)
    // For 4:2:0, each MCU covers 16x16 pixels of the original image
    // Decoder expects ceil(origWidth/16) * ceil(origHeight/16) MCUs
    const std::size_t mcuCols = (origWidth + 15) / 16;
    const std::size_t mcuRows = (origHeight + 15) / 16;
    
    for (std::size_t mcuY = 0; mcuY < mcuRows; ++mcuY)
    {
        for (std::size_t mcuX = 0; mcuX < mcuCols; ++mcuX)
        {
            // Process 4 Y blocks in this MCU (2×2 grid)
            for (std::size_t subY = 0; subY < 2; ++subY)
            {
                for (std::size_t subX = 0; subX < 2; ++subX)
                {
                    const std::size_t blockX = mcuX * 2 + subX;
                    const std::size_t blockY = mcuY * 2 + subY;
                    
                    // Extract 8×8 Y block
                    Block8x8f yBlock;
                    for (std::size_t y = 0; y < 8; ++y)
                    {
                        for (std::size_t x = 0; x < 8; ++x)
                        {
                            const std::size_t imgX = blockX * 8 + x;
                            const std::size_t imgY = blockY * 8 + y;
                            yBlock.at(x, y) = static_cast<float>(yChannel.at(imgX, imgY, 0)) - 128.0f;
                        }
                    }
                    
                    // DCT + quantization
                    Block8x8f dctBlock;
                    dct.forward(yBlock, dctBlock);
                    Block8x8i quantBlock;
                    Quantizer::quantize(dctBlock, lumaQTable, quantBlock);
                    
                    // Entropy encode
                    prevDC_Y = entropyEncoder.encodeLumaBlock(quantBlock, prevDC_Y, bitWriter);
                }
            }
            
            // Process 1 Cb block for this MCU
            Block8x8f cbBlock;
            for (std::size_t y = 0; y < 8; ++y)
            {
                for (std::size_t x = 0; x < 8; ++x)
                {
                    const std::size_t imgX = mcuX * 8 + x;
                    const std::size_t imgY = mcuY * 8 + y;
                    cbBlock.at(x, y) = static_cast<float>(cbcrSubsampled.at(imgX, imgY, 0)) - 128.0f;
                }
            }
            
            Block8x8f dctCbBlock;
            dct.forward(cbBlock, dctCbBlock);
            Block8x8i quantCbBlock;
            Quantizer::quantize(dctCbBlock, chromaQTable, quantCbBlock);
            prevDC_Cb = entropyEncoder.encodeChromaBlock(quantCbBlock, prevDC_Cb, bitWriter);
            
            // Process 1 Cr block for this MCU
            Block8x8f crBlock;
            for (std::size_t y = 0; y < 8; ++y)
            {
                for (std::size_t x = 0; x < 8; ++x)
                {
                    const std::size_t imgX = mcuX * 8 + x;
                    const std::size_t imgY = mcuY * 8 + y;
                    crBlock.at(x, y) = static_cast<float>(cbcrSubsampled.at(imgX, imgY, 1)) - 128.0f;
                }
            }
            
            Block8x8f dctCrBlock;
            dct.forward(crBlock, dctCrBlock);
            Block8x8i quantCrBlock;
            Quantizer::quantize(dctCrBlock, chromaQTable, quantCrBlock);
            prevDC_Cr = entropyEncoder.encodeChromaBlock(quantCrBlock, prevDC_Cr, bitWriter);
        }
    }
    
    // Flush remaining bits
    bitWriter.flushToByte();
    
    // Append entropy-coded data to output buffer
    const std::vector<std::uint8_t>& scanData = bitWriter.buffer();
    m_buffer.insert(m_buffer.end(), scanData.begin(), scanData.end());
}

} // namespace jpegdsp::jpeg
