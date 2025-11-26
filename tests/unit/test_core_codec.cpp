#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/Entropy.hpp"
#include "jpegdsp/core/ColorSpace.hpp"
#include "jpegdsp/core/Constants.hpp"
#include "jpegdsp/transforms/DCTTransform.hpp"
#include "jpegdsp/jpeg/Quantization.hpp"
#include "jpegdsp/jpeg/ZigZag.hpp"
#include "jpegdsp/jpeg/RLE.hpp"
#include "jpegdsp/jpeg/Huffman.hpp"
#include "jpegdsp/jpeg/BlockEntropyEncoder.hpp"
#include "jpegdsp/jpeg/JPEGWriter.hpp"
#include "jpegdsp/util/BitWriter.hpp"
#include "../TestFramework.hpp"

#include <iostream>
#include <vector>
#include <cmath>
#include <cstdlib>


using namespace jpegdsp::core;
using namespace jpegdsp::test;

namespace
{
    bool closeByte(uint8_t a, uint8_t b, uint8_t tol = 2)
    {
        int da = static_cast<int>(a);
        int db = static_cast<int>(b);
        return std::abs(da - db) <= static_cast<int>(tol);
    }
}

// ------------------------------------------------------------
// BlockExtractor tests
// ------------------------------------------------------------

bool test_block_single_8x8()
{
    std::size_t w = jpegdsp::core::BlockSize;
    std::size_t h = jpegdsp::core::BlockSize;

    Image img(w, h, ColorSpace::GRAY, 1);

    // Fill with simple pattern: value = y * width + x (0..63)
    for (std::size_t y = 0; y < h; y++)
    {
        for (std::size_t x = 0; x < w; x++)
        {
            img.at(x, y, 0) = static_cast<Pixel8>(y * w + x);
        }
    }

    std::vector<Block8x8f> blocks = BlockExtractor::extractBlocks(img);

    if (blocks.size() != 1)
    {
        std::cerr << "test_block_single_8x8: expected 1 block, got "
                  << blocks.size() << "\n";
        return false;
    }

    const Block8x8f& b = blocks[0];

    for (std::size_t y = 0; y < jpegdsp::core::BlockSize; y++)
    {
        for (std::size_t x = 0; x < jpegdsp::core::BlockSize; x++)
        {
            float expected = static_cast<float>(y * w + x);
            float got = b.data[y * jpegdsp::core::BlockSize + x];

            if (got != expected)
            {
                std::cerr << "test_block_single_8x8: mismatch at ("
                          << x << ", " << y << "): expected "
                          << expected << ", got " << got << "\n";
                return false;
            }
        }
    }

    return true;
}

bool test_block_16x8_two_blocks()
{
    std::size_t w = 16;
    std::size_t h = jpegdsp::core::BlockSize;

    Image img(w, h, ColorSpace::GRAY, 1);

    // Pattern: value = y * width + x (0..127)
    for (std::size_t y = 0; y < h; y++)
    {
        for (std::size_t x = 0; x < w; x++)
        {
            img.at(x, y, 0) = static_cast<Pixel8>(y * w + x);
        }
    }

    std::vector<Block8x8f> blocks = BlockExtractor::extractBlocks(img);

    if (blocks.size() != 2)
    {
        std::cerr << "test_block_16x8_two_blocks: expected 2 blocks, got "
                  << blocks.size() << "\n";
        return false;
    }

    const Block8x8f& b0 = blocks[0];
    const Block8x8f& b1 = blocks[1];

    // Block 0: x in [0,7], top-left (0,0) → img(0,0) = 0
    if (b0.at(0, 0) != 0.0f)
    {
        std::cerr << "test_block_16x8_two_blocks: b0(0,0) expected 0, got "
                  << b0.at(0, 0) << "\n";
        return false;
    }

    // Block 1: x in [8,15], top-left (0,0) → img(8,0) = 8
    if (b1.at(0, 0) != 8.0f)
    {
        std::cerr << "test_block_16x8_two_blocks: b1(0,0) expected 8, got "
                  << b1.at(0, 0) << "\n";
        return false;
    }

    // Sample: (3,4) in block 1 -> global (11,4) -> 4*16 + 11 = 75
    float expected = 4.0f * 16.0f + 11.0f;
    float got = b1.at(3, 4);

    if (got != expected)
    {
        std::cerr << "test_block_16x8_two_blocks: b1(3,4) expected "
                  << expected << ", got " << got << "\n";
        return false;
    }

    return true;
}

// ------------------------------------------------------------
// Entropy tests
// ------------------------------------------------------------

bool test_entropy_constant()
{
    std::vector<uint8_t> data(16, 42); // all same value
    double H = Entropy::shannon(data);

    if (!closeDouble(H, 0.0))
    {
        std::cerr << "test_entropy_constant: expected H=0, got " << H << "\n";
        return false;
    }

    return true;
}

bool test_entropy_two_symbols_equal_prob()
{
    std::vector<uint8_t> data;

    // 8 zeros, 8 ones → p(0)=0.5, p(1)=0.5 → H = 1 bit
    data.reserve(16);
    for (int i = 0; i < 8; i++)
    {
        data.push_back(0);
    }
    for (int i = 0; i < 8; i++)
    {
        data.push_back(1);
    }

    double H = Entropy::shannon(data);

    if (!closeDouble(H, 1.0))
    {
        std::cerr << "test_entropy_two_symbols_equal_prob: expected H=1, got "
                  << H << "\n";
        return false;
    }

    return true;
}

// ------------------------------------------------------------
// Color space tests
// ------------------------------------------------------------

bool test_colorspace_roundtrip_basic()
{
    Image rgb(2, 1, ColorSpace::RGB, 3);

    // Pixel 0: red
    rgb.at(0, 0, 0) = 255;
    rgb.at(0, 0, 1) = 0;
    rgb.at(0, 0, 2) = 0;

    // Pixel 1: some arbitrary color
    rgb.at(1, 0, 0) = 10;
    rgb.at(1, 0, 1) = 200;
    rgb.at(1, 0, 2) = 50;

    Image ycbcr = ColorConverter::RGBtoYCbCr(rgb);
    Image rgb2 = ColorConverter::YCbCrtoRGB(ycbcr);

    // Check each channel with a small tolerance (rounding errors allowed)
    for (std::size_t x = 0; x < 2; x++)
    {
        for (std::size_t c = 0; c < 3; c++)
        {
            uint8_t orig = rgb.at(x, 0, c);
            uint8_t recon = rgb2.at(x, 0, c);

            if (!closeByte(orig, recon, 2))
            {
                std::cerr << "test_colorspace_roundtrip_basic: mismatch at pixel "
                          << x << ", channel " << c
                          << " orig=" << static_cast<int>(orig)
                          << " recon=" << static_cast<int>(recon) << "\n";
                return false;
            }
        }
    }

    return true;
}

// ------------------------------------------------------------
// DCT tests
// ------------------------------------------------------------

bool test_dct_roundtrip_basic()
{
    jpegdsp::transforms::DCT8x8Transform dct;

    Block8x8f input{};
    Block8x8f coeffs{};
    Block8x8f recon{};

    // Fill with a simple pattern: f(x,y) = x + 2*y
    for (std::size_t y = 0; y < 8; y++)
    {
        for (std::size_t x = 0; x < 8; x++)
        {
            input.at(x, y) = static_cast<float>(x + 2 * y);
        }
    }

    dct.forward(input, coeffs);
    dct.inverse(coeffs, recon);

    for (std::size_t y = 0; y < jpegdsp::core::BlockSize; y++)
    {
        for (std::size_t x = 0; x < jpegdsp::core::BlockSize; x++)
        {
            float orig = input.at(x, y);
            float val = recon.at(x, y);

            if (std::fabs(orig - val) > 1e-3f)
            {
                std::cerr << "test_dct_roundtrip_basic: mismatch at ("
                          << x << ", " << y << ") orig=" << orig
                          << " recon=" << val << "\n";
                return false;
            }
        }
    }

    return true;
}

bool test_dct_constant_block_dc()
{
    jpegdsp::transforms::DCT8x8Transform dct;

    Block8x8f input{};
    Block8x8f coeffs{};

    float C = 10.0f;

    for (std::size_t y = 0; y < 8; y++)
    {
        for (std::size_t x = 0; x < 8; x++)
        {
            input.at(x, y) = C;
        }
    }

    dct.forward(input, coeffs);

    // For orthonormal DCT-II with our scaling, DC = 8 * C, all AC ≈ 0
    float expectedDC = 8.0f * C;
    float dc = coeffs.at(0, 0);

    if (std::fabs(dc - expectedDC) > 1e-3f)
    {
        std::cerr << "test_dct_constant_block_dc: expected DC="
                  << expectedDC << ", got " << dc << "\n";
        return false;
    }

    for (std::size_t v = 0; v < jpegdsp::core::BlockSize; v++)
    {
        for (std::size_t u = 0; u < jpegdsp::core::BlockSize; u++)
        {
            if (u == 0 && v == 0)
            {
                continue;
            }

            float ac = coeffs.at(u, v);

            if (std::fabs(ac) > 1e-3f)
            {
                std::cerr << "test_dct_constant_block_dc: AC(" << u << "," << v
                          << ") expected ~0, got " << ac << "\n";
                return false;
            }
        }
    }

    return true;
}

// ------------------------------------------------------------
// Quantization tests
// ------------------------------------------------------------

bool test_quant_identity_all_ones()
{
    using jpegdsp::jpeg::QuantTable;
    using jpegdsp::jpeg::Quantizer;

    constexpr std::size_t N = jpegdsp::core::BlockSize;

    // Build a quant table where all entries are 1
    std::array<std::uint16_t, jpegdsp::core::BlockElementCount> ones{};
    for (std::size_t i = 0; i < jpegdsp::core::BlockElementCount; i++)
    {
        ones[i] = 1;
    }

    QuantTable qt(ones);

    jpegdsp::core::Block<float, N> in{};
    jpegdsp::core::Block<std::int16_t, N> q{};
    jpegdsp::core::Block<float, N> recon{};

    // Fill the input block with some integer-valued pattern
    for (std::size_t y = 0; y < N; y++)
    {
        for (std::size_t x = 0; x < N; x++)
        {
            float v = static_cast<float>(x + y * 2);
            in.at(x, y) = v;
        }
    }

    Quantizer::quantize(in, qt, q);
    Quantizer::dequantize(q, qt, recon);

    for (std::size_t y = 0; y < N; y++)
    {
        for (std::size_t x = 0; x < N; x++)
        {
            float orig = in.at(x, y);
            float val = recon.at(x, y);

            if (std::fabs(orig - val) > 1e-3f)
            {
                std::cerr << "test_quant_identity_all_ones: mismatch at ("
                          << x << ", " << y << ") orig=" << orig
                          << " recon=" << val << "\n";
                return false;
            }
        }
    }

    return true;
}

bool test_quant_zero_block()
{
    using jpegdsp::jpeg::QuantTable;
    using jpegdsp::jpeg::Quantizer;

    constexpr std::size_t N = jpegdsp::core::BlockSize;

    // Any valid table; use luma std at quality 50
    QuantTable qt = QuantTable::makeLumaStd(50);

    jpegdsp::core::Block<float, N> in{};
    jpegdsp::core::Block<std::int16_t, N> q{};
    jpegdsp::core::Block<float, N> recon{};

    // in is already zero-initialized
    Quantizer::quantize(in, qt, q);
    Quantizer::dequantize(q, qt, recon);

    for (std::size_t i = 0; i < jpegdsp::core::BlockElementCount; i++)
    {
        if (q.data[i] != 0)
        {
            std::cerr << "test_quant_zero_block: expected q=0 at index "
                      << i << ", got " << q.data[i] << "\n";
            return false;
        }

        if (std::fabs(recon.data[i]) > 1e-6f)
        {
            std::cerr << "test_quant_zero_block: expected recon≈0 at index "
                      << i << ", got " << recon.data[i] << "\n";
            return false;
        }
    }

    return true;
}

// ------------------------------------------------------------
// ZigZag tests
// ------------------------------------------------------------


bool test_zigzag_identity()
{
    jpegdsp::core::Block<std::int16_t, jpegdsp::core::BlockSize> block{};
    for (std::size_t i = 0; i < jpegdsp::core::BlockElementCount; i++)
    {
        block.data[i] = static_cast<std::int16_t>(i);
    }

    auto zz = jpegdsp::jpeg::ZigZag::toZigZag(block);
    auto restored = jpegdsp::jpeg::ZigZag::fromZigZag(zz);

    for (std::size_t i = 0; i < jpegdsp::core::BlockElementCount; i++)
    {
        if (restored.data[i] != block.data[i])
        {
            return false;
        }
    }
    return true;
}

bool test_zigzag_known_pattern()
{
    jpegdsp::core::Block<std::int16_t, jpegdsp::core::BlockSize> block{};
    block.at(0,0) = 100;
    block.at(7,7) = 55;

    auto zz = jpegdsp::jpeg::ZigZag::toZigZag(block);

    // Index 0 should be (0,0)
    if (zz[0] != 100)
    {
        return false;
    }

    // The last zigzag element (index 63) is (7,7)
    if (zz[jpegdsp::core::BlockElementCount - 1] != 55)
    {
        return false;
    }

    return true;
}

// ------------------------------------------------------------
// RLE tests
// ------------------------------------------------------------

bool test_rle_all_zeroes()
{
    std::array<std::int16_t, jpegdsp::core::BlockElementCount> zz{};
    auto out = jpegdsp::jpeg::RLE::encodeAC(zz);

    if (out.size() != 1) return false;
    return (out[0].run == jpegdsp::jpeg::EOB && out[0].value == 0);
}

bool test_rle_simple()
{
    std::array<std::int16_t, jpegdsp::core::BlockElementCount> zz{};
    zz[1] = 5;   // No leading zeros
    zz[5] = 3;   // Three zeros then 3 (at indices 2,3,4)

    auto out = jpegdsp::jpeg::RLE::encodeAC(zz);

    // Should be: (0,5), (3,3), EOB
    if (out.size() != 3) {
        std::cerr << "test_rle_simple: expected size=3, got " << out.size() << "\n";
        return false;
    }
    if (out[0].run != 0 || out[0].value != 5) {
        std::cerr << "test_rle_simple: out[0] expected (0,5), got (" << (int)out[0].run << "," << out[0].value << ")\n";
        return false;
    }
    if (out[1].run != 3 || out[1].value != 3) {
        std::cerr << "test_rle_simple: out[1] expected (3,3), got (" << (int)out[1].run << "," << out[1].value << ")\n";
        return false;
    }
    if (out[2].run != jpegdsp::jpeg::EOB || out[2].value != 0) {
        std::cerr << "test_rle_simple: out[2] expected (EOB,0), got (" << (int)out[2].run << "," << out[2].value << ")\n";
        return false;
    }
    return true;
}

bool test_rle_zrl()
{
    std::array<std::int16_t, jpegdsp::core::BlockElementCount> zz{};
    // 16 zeros then a non-zero
    zz[17] = 7;

    auto out = jpegdsp::jpeg::RLE::encodeAC(zz);

    // Should be: ZRL (16 zeros), (0,7), EOB
    if (out.size() != 3) return false;

    bool hasZRL = (out[0].run == jpegdsp::jpeg::ZRL && out[0].value == 0);
    bool next = (out[1].run == 0 && out[1].value == 7);
    bool hasEOB = (out[2].run == jpegdsp::jpeg::EOB && out[2].value == 0);

    return hasZRL && next && hasEOB;
}

bool test_rle_trailing_zeroes()
{
    std::array<std::int16_t, jpegdsp::core::BlockElementCount> zz{};
    zz[1] = 1;
    zz[5] = 2;  // Then all remaining zeros

    auto out = jpegdsp::jpeg::RLE::encodeAC(zz);
    
    // EOB is now automatically emitted by encodeAC (per ITU-T.81)

    if (!(out.size() == 3)) {
        std::cerr << "test_rle_trailing_zeroes: expected size=3, got " << out.size() << "\n";
        return false;
    }
    if (!(out[0].run == 0 && out[0].value == 1)) {
        std::cerr << "test_rle_trailing_zeroes: out[0] expected (0,1), got (" << (int)out[0].run << "," << out[0].value << ")\n";
        return false;
    }
    if (!(out[1].run == 3 && out[1].value == 2)) {
        std::cerr << "test_rle_trailing_zeroes: out[1] expected (3,2), got (" << (int)out[1].run << "," << out[1].value << ")\n";
        return false;
    }
    if (!(out[2].run == jpegdsp::jpeg::EOB && out[2].value == 0)) {
        std::cerr << "test_rle_trailing_zeroes: out[2] expected (EOB,0), got (" << (int)out[2].run << "," << out[2].value << ")\n";
        return false;
    }

    return true;
}


// ------------------------------------------------------------
// BitWriter tests
// ------------------------------------------------------------

bool test_bitwriter_single_byte()
{
    jpegdsp::util::BitWriter bw;
    
    // Write 8 bits: 10101010b = 0xAA
    bw.writeBits(0xAA, 8);
    
    const auto& buf = bw.buffer();
    if (buf.size() != 1)
    {
        std::cerr << "test_bitwriter_single_byte: expected 1 byte, got " << buf.size() << "\n";
        return false;
    }
    
    if (buf[0] != 0xAA)
    {
        std::cerr << "test_bitwriter_single_byte: expected 0xAA, got 0x" 
                  << std::hex << (int)buf[0] << std::dec << "\n";
        return false;
    }
    
    return true;
}

bool test_bitwriter_cross_byte_boundary()
{
    jpegdsp::util::BitWriter bw;
    
    // Write 5 bits: 11010b = 0x1A (only lower 5 bits)
    // Write 7 bits: 0101010b = 0x2A (only lower 7 bits)
    // Result should be: 11010 010 | 1010 xxxx after flush
    // = 11010010 | 10101111 (with padding 1s)
    // = 0xD2, then after flush with padding
    
    bw.writeBits(0x1A, 5);  // 11010
    bw.writeBits(0x2A, 7);  // 0101010
    bw.flushToByte();       // Flush remaining 4 bits with padding
    
    const auto& buf = bw.buffer();
    if (buf.size() != 2)
    {
        std::cerr << "test_bitwriter_cross_byte_boundary: expected 2 bytes, got " << buf.size() << "\n";
        return false;
    }
    
    // First byte: 11010 + 010 (first 3 bits of second write) = 11010010 = 0xD2
    if (buf[0] != 0xD2)
    {
        std::cerr << "test_bitwriter_cross_byte_boundary: byte 0 expected 0xD2, got 0x" 
                  << std::hex << (int)buf[0] << std::dec << "\n";
        return false;
    }
    
    // Second byte: 1010 (remaining 4 bits) + 1111 (padding) = 10101111 = 0xAF
    if (buf[1] != 0xAF)
    {
        std::cerr << "test_bitwriter_cross_byte_boundary: byte 1 expected 0xAF, got 0x" 
                  << std::hex << (int)buf[1] << std::dec << "\n";
        return false;
    }
    
    return true;
}

bool test_bitwriter_byte_stuffing_ff()
{
    jpegdsp::util::BitWriter bw;
    
    // Write 0xFF byte, should become 0xFF 0x00 in output
    bw.writeBits(0xFF, 8);
    
    const auto& buf = bw.buffer();
    if (buf.size() != 2)
    {
        std::cerr << "test_bitwriter_byte_stuffing_ff: expected 2 bytes (0xFF + stuffed 0x00), got " 
                  << buf.size() << "\n";
        return false;
    }
    
    if (buf[0] != 0xFF)
    {
        std::cerr << "test_bitwriter_byte_stuffing_ff: byte 0 expected 0xFF, got 0x" 
                  << std::hex << (int)buf[0] << std::dec << "\n";
        return false;
    }
    
    if (buf[1] != 0x00)
    {
        std::cerr << "test_bitwriter_byte_stuffing_ff: byte 1 expected 0x00 (stuffing), got 0x" 
                  << std::hex << (int)buf[1] << std::dec << "\n";
        return false;
    }
    
    return true;
}


// ------------------------------------------------------------
// Huffman tests
// ------------------------------------------------------------

bool test_huffman_dc_luma_table()
{
    jpegdsp::jpeg::HuffmanTable dcLuma(jpegdsp::jpeg::HuffmanTableType::DC_Luma);
    
    // Test that categories 0-11 have valid codes
    for (uint8_t cat = 0; cat <= 11; cat++)
    {
        const auto& code = dcLuma.codeFor(cat);
        if (code.length == 0)
        {
            std::cerr << "test_huffman_dc_luma_table: category " << (int)cat << " has no code\n";
            return false;
        }
    }
    
    return true;
}

bool test_huffman_dc_chroma_table()
{
    jpegdsp::jpeg::HuffmanTable dcChroma(jpegdsp::jpeg::HuffmanTableType::DC_Chroma);
    
    // Test that categories 0-11 have valid codes
    for (uint8_t cat = 0; cat <= 11; cat++)
    {
        const auto& code = dcChroma.codeFor(cat);
        if (code.length == 0)
        {
            std::cerr << "test_huffman_dc_chroma_table: category " << (int)cat << " has no code\n";
            return false;
        }
    }
    
    return true;
}

bool test_huffman_ac_luma_table()
{
    jpegdsp::jpeg::HuffmanTable acLuma(jpegdsp::jpeg::HuffmanTableType::AC_Luma);
    
    // Test EOB symbol (0x00)
    const auto& eob = acLuma.codeFor(0x00);
    if (eob.length == 0)
    {
        std::cerr << "test_huffman_ac_luma_table: EOB symbol has no code\n";
        return false;
    }
    
    // Test ZRL symbol (0xF0)
    const auto& zrl = acLuma.codeFor(0xF0);
    if (zrl.length == 0)
    {
        std::cerr << "test_huffman_ac_luma_table: ZRL symbol has no code\n";
        return false;
    }
    
    // Test common AC symbols: (0,1), (0,2), (1,1), (3,2)
    const auto& ac01 = acLuma.codeFor(0x01); // run=0, size=1
    if (ac01.length == 0)
    {
        std::cerr << "test_huffman_ac_luma_table: (0,1) symbol has no code\n";
        return false;
    }
    
    const auto& ac32 = acLuma.codeFor(0x32); // run=3, size=2
    if (ac32.length == 0)
    {
        std::cerr << "test_huffman_ac_luma_table: (3,2) symbol has no code\n";
        return false;
    }
    
    return true;
}

bool test_huffman_ac_chroma_table()
{
    jpegdsp::jpeg::HuffmanTable acChroma(jpegdsp::jpeg::HuffmanTableType::AC_Chroma);
    
    // Test EOB symbol (0x00)
    const auto& eob = acChroma.codeFor(0x00);
    if (eob.length == 0)
    {
        std::cerr << "test_huffman_ac_chroma_table: EOB symbol has no code\n";
        return false;
    }
    
    // Test ZRL symbol (0xF0)
    const auto& zrl = acChroma.codeFor(0xF0);
    if (zrl.length == 0)
    {
        std::cerr << "test_huffman_ac_chroma_table: ZRL symbol has no code\n";
        return false;
    }
    
    return true;
}


// ------------------------------------------------------------
// BlockEntropyEncoder tests
// ------------------------------------------------------------

bool test_entropyencoder_constant_block_luma()
{
    // Create Huffman tables
    jpegdsp::jpeg::HuffmanTable dcLuma(jpegdsp::jpeg::HuffmanTableType::DC_Luma);
    jpegdsp::jpeg::HuffmanTable acLuma(jpegdsp::jpeg::HuffmanTableType::AC_Luma);
    jpegdsp::jpeg::HuffmanTable dcChroma(jpegdsp::jpeg::HuffmanTableType::DC_Chroma);
    jpegdsp::jpeg::HuffmanTable acChroma(jpegdsp::jpeg::HuffmanTableType::AC_Chroma);

    jpegdsp::jpeg::HuffmanEncoder lumaEnc(dcLuma, acLuma);
    jpegdsp::jpeg::HuffmanEncoder chromaEnc(dcChroma, acChroma);

    jpegdsp::jpeg::BlockEntropyEncoder encoder(lumaEnc, chromaEnc);

    // Create a constant block (DC=10, all AC=0)
    jpegdsp::core::Block<std::int16_t, jpegdsp::core::BlockSize> block{};
    for (std::size_t i = 0; i < jpegdsp::core::BlockElementCount; i++)
    {
        block.data[i] = 10;
    }

    jpegdsp::util::BitWriter bw;
    std::int16_t prevDC = 0;

    // Encode the block
    std::int16_t newDC = encoder.encodeLumaBlock(block, prevDC, bw);

    // Verify DC prediction
    if (newDC != 10)
    {
        std::cerr << "test_entropyencoder_constant_block_luma: expected DC=10, got " << newDC << "\n";
        return false;
    }

    // Verify that bits were written
    bw.flushToByte();
    const auto& buf = bw.buffer();
    if (buf.empty())
    {
        std::cerr << "test_entropyencoder_constant_block_luma: buffer is empty\n";
        return false;
    }

    // For a constant block, we expect some encoded output
    // The actual size depends on Huffman codes and byte-stuffing,
    // but it should be non-zero and reasonable (not enormous)
    if (buf.size() > 100)
    {
        std::cerr << "test_entropyencoder_constant_block_luma: unexpected large buffer size " 
                  << buf.size() << "\n";
        return false;
    }

    return true;
}

bool test_entropyencoder_two_blocks_dc_prediction()
{
    // Create Huffman tables
    jpegdsp::jpeg::HuffmanTable dcLuma(jpegdsp::jpeg::HuffmanTableType::DC_Luma);
    jpegdsp::jpeg::HuffmanTable acLuma(jpegdsp::jpeg::HuffmanTableType::AC_Luma);
    jpegdsp::jpeg::HuffmanTable dcChroma(jpegdsp::jpeg::HuffmanTableType::DC_Chroma);
    jpegdsp::jpeg::HuffmanTable acChroma(jpegdsp::jpeg::HuffmanTableType::AC_Chroma);

    jpegdsp::jpeg::HuffmanEncoder lumaEnc(dcLuma, acLuma);
    jpegdsp::jpeg::HuffmanEncoder chromaEnc(dcChroma, acChroma);

    jpegdsp::jpeg::BlockEntropyEncoder encoder(lumaEnc, chromaEnc);

    // First block: DC=10
    jpegdsp::core::Block<std::int16_t, jpegdsp::core::BlockSize> block1{};
    block1.at(0, 0) = 10;

    // Second block: DC=13
    jpegdsp::core::Block<std::int16_t, jpegdsp::core::BlockSize> block2{};
    block2.at(0, 0) = 13;

    jpegdsp::util::BitWriter bw;
    std::int16_t prevDC = 0;

    // Encode first block
    prevDC = encoder.encodeLumaBlock(block1, prevDC, bw);
    if (prevDC != 10)
    {
        std::cerr << "test_entropyencoder_two_blocks_dc_prediction: first block DC expected 10, got " 
                  << prevDC << "\n";
        return false;
    }

    // Encode second block (DC diff should be 13 - 10 = 3)
    prevDC = encoder.encodeLumaBlock(block2, prevDC, bw);
    if (prevDC != 13)
    {
        std::cerr << "test_entropyencoder_two_blocks_dc_prediction: second block DC expected 13, got " 
                  << prevDC << "\n";
        return false;
    }

    // Verify that bits were written
    bw.flushToByte();
    const auto& buf = bw.buffer();
    if (buf.empty())
    {
        std::cerr << "test_entropyencoder_two_blocks_dc_prediction: buffer is empty\n";
        return false;
    }

    // We encoded two blocks, so buffer should have some reasonable size
    if (buf.size() < 2)
    {
        std::cerr << "test_entropyencoder_two_blocks_dc_prediction: buffer too small ("
                  << buf.size() << " bytes)\n";
        return false;
    }

    return true;
}

// ------------------------------------------------------------
// JPEGWriter tests
// ------------------------------------------------------------

bool test_jpegwriter_small_grayscale()
{
    // Create 16x16 grayscale image with gradient
    const std::size_t w = 16;
    const std::size_t h = 16;
    Image img(w, h, ColorSpace::GRAY, 1);

    // Fill with gradient pattern
    for (std::size_t y = 0; y < h; ++y)
    {
        for (std::size_t x = 0; x < w; ++x)
        {
            img.at(x, y, 0) = static_cast<Pixel8>((x + y) * 8);
        }
    }

    // Encode to JPEG
    jpegdsp::jpeg::JPEGWriter writer;
    std::vector<std::uint8_t> jpegData;

    try
    {
        jpegData = writer.encodeGrayscale(img, 75);
    }
    catch (const std::exception& e)
    {
        std::cerr << "test_jpegwriter_small_grayscale: exception during encoding: "
                  << e.what() << "\n";
        return false;
    }

    // Validate buffer size
    if (jpegData.size() < 100)
    {
        std::cerr << "test_jpegwriter_small_grayscale: buffer too small: "
                  << jpegData.size() << " bytes\n";
        return false;
    }

    // Check SOI marker (0xFF 0xD8)
    if (jpegData.size() < 2 || jpegData[0] != 0xFF || jpegData[1] != 0xD8)
    {
        std::cerr << "test_jpegwriter_small_grayscale: missing SOI marker\n";
        return false;
    }

    // Check EOI marker (0xFF 0xD9) at end
    std::size_t sz = jpegData.size();
    if (sz < 2 || jpegData[sz - 2] != 0xFF || jpegData[sz - 1] != 0xD9)
    {
        std::cerr << "test_jpegwriter_small_grayscale: missing EOI marker\n";
        return false;
    }

    // Search for required markers in the stream
    bool foundDQT = false;
    bool foundSOF0 = false;
    bool foundSOS = false;

    for (std::size_t i = 0; i < sz - 1; ++i)
    {
        if (jpegData[i] == 0xFF)
        {
            std::uint8_t marker = jpegData[i + 1];
            if (marker == 0xDB) foundDQT = true;  // DQT
            if (marker == 0xC0) foundSOF0 = true; // SOF0
            if (marker == 0xDA) foundSOS = true;  // SOS
        }
    }

    if (!foundDQT)
    {
        std::cerr << "test_jpegwriter_small_grayscale: missing DQT marker\n";
        return false;
    }
    if (!foundSOF0)
    {
        std::cerr << "test_jpegwriter_small_grayscale: missing SOF0 marker\n";
        return false;
    }
    if (!foundSOS)
    {
        std::cerr << "test_jpegwriter_small_grayscale: missing SOS marker\n";
        return false;
    }

    return true;
}


// ------------------------------------------------------------
// Main test runner
// ------------------------------------------------------------

int main()
{
    TestStats stats;

    // BlockExtractor tests
    runTest("block_single_8x8",           &test_block_single_8x8,               stats);
    runTest("block_16x8_two_blocks",      &test_block_16x8_two_blocks,          stats);

    // Entropy tests
    runTest("entropy_constant",           &test_entropy_constant,               stats);
    runTest("entropy_two_symbols_equal",  &test_entropy_two_symbols_equal_prob, stats);

    // ColorSpace tests
    runTest("colorspace_roundtrip_basic", &test_colorspace_roundtrip_basic,     stats);

    // DCT tests
    runTest("dct_roundtrip_basic",        &test_dct_roundtrip_basic,            stats);
    runTest("dct_constant_block_dc",      &test_dct_constant_block_dc,          stats);

    // Quantization tests
    runTest("quant_identity_all_ones",    &test_quant_identity_all_ones,        stats);
    runTest("quant_zero_block",           &test_quant_zero_block,               stats);

    // ZigZag tests
    runTest("zigzag_identity",            &test_zigzag_identity,                stats);
    runTest("zigzag_known_pattern",       &test_zigzag_known_pattern,           stats);

    // RLE tests
    runTest("rle_all_zeroes",             &test_rle_all_zeroes,                 stats);
    runTest("rle_simple",                 &test_rle_simple,                     stats);
    runTest("rle_zrl",                    &test_rle_zrl,                        stats);
    runTest("rle_trailing_zeroes",        &test_rle_trailing_zeroes,            stats);

    // BitWriter tests
    runTest("bitwriter_single_byte",      &test_bitwriter_single_byte,          stats);
    runTest("bitwriter_cross_byte",       &test_bitwriter_cross_byte_boundary,  stats);
    runTest("bitwriter_byte_stuffing",    &test_bitwriter_byte_stuffing_ff,     stats);

    // Huffman tests
    runTest("huffman_dc_luma_table",      &test_huffman_dc_luma_table,          stats);
    runTest("huffman_dc_chroma_table",    &test_huffman_dc_chroma_table,        stats);
    runTest("huffman_ac_luma_table",      &test_huffman_ac_luma_table,          stats);
    runTest("huffman_ac_chroma_table",    &test_huffman_ac_chroma_table,        stats);

    // BlockEntropyEncoder tests
    runTest("entropyenc_constant_block",  &test_entropyencoder_constant_block_luma,     stats);
    runTest("entropyenc_dc_prediction",   &test_entropyencoder_two_blocks_dc_prediction, stats);

    // JPEGWriter tests
    runTest("jpegwriter_small_grayscale", &test_jpegwriter_small_grayscale,              stats);

    stats.printSummary("Core codec tests");
    return stats.exitCode();
}