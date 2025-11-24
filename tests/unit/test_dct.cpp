#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/Constants.hpp"
#include "jpegdsp/transforms/DCTTransform.hpp"
#include <iostream>
#include <cmath>
#include <cstdlib>

using namespace jpegdsp::core;

namespace
{
    bool closeFloat(float a, float b, float eps = 1e-3f)
    {
        return std::fabs(a - b) <= eps;
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

bool test_dct_roundtrip_basic()
{
    jpegdsp::transforms::DCT8x8Transform dct;

    Block8x8f input{};
    Block8x8f coeffs{};
    Block8x8f recon{};

    // Fill with a simple pattern: f(x,y) = x + 2*y
    for (std::size_t y = 0; y < BlockSize; ++y)
    {
        for (std::size_t x = 0; x < BlockSize; ++x)
        {
            input.at(x, y) = static_cast<float>(x + 2 * y);
        }
    }

    dct.forward(input, coeffs);
    dct.inverse(coeffs, recon);

    for (std::size_t y = 0; y < BlockSize; ++y)
    {
        for (std::size_t x = 0; x < BlockSize; ++x)
        {
            if (!closeFloat(input.at(x, y), recon.at(x, y)))
            {
                std::cerr << "test_dct_roundtrip_basic: mismatch at ("
                          << x << ", " << y << "): expected "
                          << input.at(x, y) << ", got " << recon.at(x, y) << "\n";
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
    for (std::size_t y = 0; y < BlockSize; ++y)
    {
        for (std::size_t x = 0; x < BlockSize; ++x)
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

    for (std::size_t v = 0; v < BlockSize; ++v)
    {
        for (std::size_t u = 0; u < BlockSize; ++u)
        {
            if (u == 0 && v == 0) continue; // Skip DC
            if (std::fabs(coeffs.at(u, v)) > 1e-3f)
            {
                std::cerr << "test_dct_constant_block_dc: AC(" << u << "," << v
                          << ") expected ≈0, got " << coeffs.at(u, v) << "\n";
                return false;
            }
        }
    }

    return true;
}

int main()
{
    int total = 0;
    int failed = 0;

    runTest("dct_roundtrip_basic", &test_dct_roundtrip_basic, total, failed);
    runTest("dct_constant_block_dc", &test_dct_constant_block_dc, total, failed);

    std::cout << "----------------------------------------\n";
    std::cout << "DCT tests run:   " << total << "\n";
    std::cout << "DCT tests failed:" << failed << "\n";

    return (failed == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
}
