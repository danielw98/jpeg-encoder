#include "jpegdsp/jpeg/JPEGWriter.hpp"
#include "jpegdsp/jpeg/Quantization.hpp"
#include "jpegdsp/jpeg/BlockEntropyEncoder.hpp"
#include "jpegdsp/jpeg/Huffman.hpp"
#include "jpegdsp/transforms/DCTTransform.hpp"
#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/Constants.hpp"
#include "jpegdsp/util/BitWriter.hpp"
#include <stdexcept>
#include <array>

namespace jpegdsp::jpeg {

// JPEG markers
static constexpr std::uint16_t SOI  = 0xFFD8;  // Start of Image
static constexpr std::uint16_t EOI  = 0xFFD9;  // End of Image
static constexpr std::uint16_t APP0 = 0xFFE0;  // Application segment 0 (JFIF)
static constexpr std::uint16_t DQT  = 0xFFDB;  // Define Quantization Table
static constexpr std::uint16_t SOF0 = 0xFFC0;  // Start of Frame (Baseline DCT)
static constexpr std::uint16_t DHT  = 0xFFC4;  // Define Huffman Table
static constexpr std::uint16_t SOS  = 0xFFDA;  // Start of Scan

// Standard JPEG Huffman tables (from ITU-T.81 Annex K.3)
static const std::array<std::uint8_t, 16> STD_DC_LUMINANCE_NBITS = {
    0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0
};
static const std::array<std::uint8_t, 12> STD_DC_LUMINANCE_VALS = {
    0,1,2,3,4,5,6,7,8,9,10,11
};
static const std::array<std::uint8_t, 16> STD_AC_LUMINANCE_NBITS = {
    0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,125
};
static const std::array<std::uint8_t,162> STD_AC_LUMINANCE_VALS = {
    0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,
    0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,
    0x22,0x71,0x14,0x32,0x81,0x91,0xa1,0x08,
    0x23,0x42,0xb1,0xc1,0x15,0x52,0xd1,0xf0,
    0x24,0x33,0x62,0x72,0x82,0x09,0x0a,0x16,
    0x17,0x18,0x19,0x1a,0x25,0x26,0x27,0x28,
    0x29,0x2a,0x34,0x35,0x36,0x37,0x38,0x39,
    0x3a,0x43,0x44,0x45,0x46,0x47,0x48,0x49,
    0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,
    0x5a,0x63,0x64,0x65,0x66,0x67,0x68,0x69,
    0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,
    0x7a,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
    0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,
    0x99,0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,
    0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,
    0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,
    0xc6,0xc7,0xc8,0xc9,0xca,0xd2,0xd3,0xd4,
    0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xe1,0xe2,
    0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,
    0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
    0xf9,0xfa
};

std::vector<std::uint8_t> JPEGWriter::encodeGrayscale(const core::Image& img, int quality)
{
    // Validate input
    if (img.channels() != 1)
    {
        throw std::invalid_argument("JPEGWriter::encodeGrayscale requires single-channel grayscale image");
    }
    if (img.width() % core::BlockSize != 0 || img.height() % core::BlockSize != 0)
    {
        throw std::invalid_argument("Image dimensions must be multiples of 8");
    }

    // Reset output buffer
    m_buffer.clear();
    m_buffer.reserve(img.width() * img.height() / 4); // Rough estimate

    // Generate standard luma quantization table
    QuantTable qTable = QuantTable::makeLumaStd(quality);
    const std::uint16_t* quantData = qTable.data();

    // Write JPEG file structure
    writeSOI();
    writeAPP0();
    writeDQT(quantData);
    writeSOF0(static_cast<std::uint16_t>(img.width()),
              static_cast<std::uint16_t>(img.height()));
    
    // Write Huffman tables for luma DC and AC
    writeDHT(0, 0, STD_DC_LUMINANCE_NBITS.data(), STD_DC_LUMINANCE_VALS.data(), STD_DC_LUMINANCE_VALS.size());
    writeDHT(1, 0, STD_AC_LUMINANCE_NBITS.data(), STD_AC_LUMINANCE_VALS.data(), STD_AC_LUMINANCE_VALS.size());
    
    writeSOS();
    
    // Write entropy-coded scan data
    writeScanData(img, quantData);
    
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
    writeMarker(SOI);
}

void JPEGWriter::writeAPP0()
{
    writeMarker(APP0);
    writeWord(16); // Segment length (including this length field)
    
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

void JPEGWriter::writeDQT(const std::uint16_t* quantTable)
{
    writeMarker(DQT);
    writeWord(67); // Length: 2 + 1 + 64 = 67 bytes
    writeByte(0);  // Precision (0 = 8-bit) | Table ID (0 = luma)
    
    // Write quantization table values
    for (std::size_t i = 0; i < core::BlockElementCount; ++i)
    {
        writeByte(static_cast<std::uint8_t>(quantTable[i]));
    }
}

void JPEGWriter::writeSOF0(std::uint16_t width, std::uint16_t height)
{
    writeMarker(SOF0);
    writeWord(11); // Length: 2 + 1 + 2 + 2 + 1 + (1*3) = 11 bytes
    writeByte(8);  // Sample precision (8 bits per component)
    writeWord(height);
    writeWord(width);
    writeByte(1);  // Number of components (grayscale = 1)
    
    // Component specification (1 component):
    writeByte(1);  // Component ID (Y)
    writeByte(0x11); // Sampling factors: horizontal=1, vertical=1 (no subsampling)
    writeByte(0);  // Quantization table ID (0 = luma table)
}

void JPEGWriter::writeDHT(std::uint8_t tableClass, std::uint8_t tableId,
                          const std::uint8_t* bits, const std::uint8_t* values, std::size_t numValues)
{
    writeMarker(DHT);
    writeWord(static_cast<std::uint16_t>(19 + numValues)); // Length: 2 + 1 + 16 + numValues
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
    writeMarker(SOS);
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
    writeMarker(EOI);
}

void JPEGWriter::writeScanData(const core::Image& img, const std::uint16_t* quantTable)
{
    // Create DCT transform and encoder
    transforms::DCT8x8Transform dct;
    HuffmanTable dcLuma(HuffmanTableType::DC_Luma);
    HuffmanTable acLuma(HuffmanTableType::AC_Luma);
    HuffmanEncoder lumaEncoder(acLuma, dcLuma);
    
    // Note: chroma encoders not needed for grayscale - use placeholder
    HuffmanTable dcChroma(HuffmanTableType::DC_Chroma);
    HuffmanTable acChroma(HuffmanTableType::AC_Chroma);
    HuffmanEncoder chromaEncoder(acChroma, dcChroma);
    
    BlockEntropyEncoder entropyEncoder(lumaEncoder, chromaEncoder);
    
    // Extract 8x8 blocks from image
    std::vector<core::Block8x8f> blocks = core::BlockExtractor::extractBlocks(img);
    
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
    
    // Process each block
    for (std::size_t b = 0; b < blocks.size(); ++b)
    {
        // Forward DCT
        core::Block8x8f dctBlock;
        dct.forward(blocks[b], dctBlock);
        
        // Quantize
        core::Block8x8i quantBlock;
        Quantizer::quantize(dctBlock, qTable, quantBlock);
        
        // Entropy encode (ZigZag + RLE + Huffman + DC prediction)
        prevDC = entropyEncoder.encodeLumaBlock(quantBlock, prevDC, bitWriter);
    }
    
    // Flush remaining bits
    bitWriter.flushToByte();
    
    // Append entropy-coded data to output buffer
    const std::vector<std::uint8_t>& scanData = bitWriter.buffer();
    m_buffer.insert(m_buffer.end(), scanData.begin(), scanData.end());
}

} // namespace jpegdsp::jpeg
