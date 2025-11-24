#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/Entropy.hpp"
#include "jpegdsp/core/ColorSpace.hpp"
#include "jpegdsp/transforms/DCTTransform.hpp"
#include "jpegdsp/jpeg/Quantization.hpp"

#include <iostream>
#include <vector>
#include <cmath>
#include <cstdlib>


using namespace jpegdsp::core;

namespace
{
    bool closeDouble(double a, double b, double eps = 1e-6)
    {
        return std::fabs(a - b) <= eps;
    }

    bool closeByte(uint8_t a, uint8_t b, uint8_t tol = 2)
    {
        int da = static_cast<int>(a);
        int db = static_cast<int>(b);
        return std::abs(da - db) <= static_cast<int>(tol);
    }

    void runTest(const char* name, bool (*fn)(), int& total, int& failed)
    {
        total++;

        if (!fn())
        {
            failed++;
            std::cerr << "[FAIL] " << name << "\n";
        }
        else
        {
            std::cout << "[PASS] " << name << "\n";
        }
    }
}

// ------------------------------------------------------------
// BlockExtractor tests
// ------------------------------------------------------------

bool test_block_single_8x8()
{
    std::size_t w = 8;
    std::size_t h = 8;

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

    for (std::size_t y = 0; y < 8; y++)
    {
        for (std::size_t x = 0; x < 8; x++)
        {
            float expected = static_cast<float>(y * w + x);
            float got = b.data[y * 8 + x];

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
    std::size_t h = 8;

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

    for (std::size_t y = 0; y < 8; y++)
    {
        for (std::size_t x = 0; x < 8; x++)
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

    for (std::size_t v = 0; v < 8; v++)
    {
        for (std::size_t u = 0; u < 8; u++)
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
    constexpr std::size_t BlockElemCount = N * N;

    // Build a quant table where all entries are 1
    std::array<std::uint16_t, BlockElemCount> ones{};
    for (std::size_t i = 0; i < BlockElemCount; i++)
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
    constexpr std::size_t BlockElemCount = N * N;

    // Any valid table; use luma std at quality 50
    QuantTable qt = QuantTable::makeLumaStd(50);

    jpegdsp::core::Block<float, N> in{};
    jpegdsp::core::Block<std::int16_t, N> q{};
    jpegdsp::core::Block<float, N> recon{};

    // in is already zero-initialized
    Quantizer::quantize(in, qt, q);
    Quantizer::dequantize(q, qt, recon);

    for (std::size_t i = 0; i < BlockElemCount; i++)
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
// Main test runner
// ------------------------------------------------------------

int main()
{
    int total = 0;
    int failed = 0;

    runTest("block_single_8x8",           &test_block_single_8x8,               total, failed);
    runTest("block_16x8_two_blocks",      &test_block_16x8_two_blocks,          total, failed);
    runTest("entropy_constant",           &test_entropy_constant,               total, failed);
    runTest("entropy_two_symbols_equal",  &test_entropy_two_symbols_equal_prob, total, failed);
    runTest("colorspace_roundtrip_basic", &test_colorspace_roundtrip_basic,     total, failed);
    runTest("dct_roundtrip_basic",        &test_dct_roundtrip_basic,            total, failed);
    runTest("dct_constant_block_dc",      &test_dct_constant_block_dc,          total, failed);
    runTest("quant_identity_all_ones",    &test_quant_identity_all_ones,        total, failed);
    runTest("quant_zero_block",           &test_quant_zero_block,               total, failed);

    std::cout << "----------------------------------------\n";
    std::cout << "Tests run:   " << total  << "\n";
    std::cout << "Tests failed:" << failed << "\n";

    return (failed == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
}