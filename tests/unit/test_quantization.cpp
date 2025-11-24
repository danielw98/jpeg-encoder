#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/Constants.hpp"
#include "jpegdsp/jpeg/Quantization.hpp"
#include <iostream>
#include <array>
#include <cmath>
#include <cstdlib>

using namespace jpegdsp::core;
using namespace jpegdsp::jpeg;

namespace
{
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

bool test_quant_identity_all_ones()
{
    std::array<std::uint16_t, BlockElementCount> ones{};
    for (std::size_t i = 0; i < BlockElementCount; ++i)
    {
        ones[i] = 1;
    }
    QuantTable qt(ones);

    Block8x8f in{};
    Block8x8i q{};
    Block8x8f recon{};

    for (std::size_t y = 0; y < BlockSize; ++y)
    {
        for (std::size_t x = 0; x < BlockSize; ++x)
        {
            in.at(x, y) = static_cast<float>(x + y);
        }
    }

    Quantizer::quantize(in, qt, q);
    Quantizer::dequantize(q, qt, recon);

    for (std::size_t y = 0; y < BlockSize; ++y)
    {
        for (std::size_t x = 0; x < BlockSize; ++x)
        {
            if (std::fabs(in.at(x, y) - recon.at(x, y)) > 1e-3f)
            {
                std::cerr << "test_quant_identity_all_ones: mismatch at ("
                          << x << ", " << y << ")\n";
                return false;
            }
        }
    }

    return true;
}

bool test_quant_zero_block()
{
    QuantTable qt = QuantTable::makeLumaStd(50);

    Block8x8f in{};
    Block8x8i q{};
    Block8x8f recon{};

    Quantizer::quantize(in, qt, q);
    Quantizer::dequantize(q, qt, recon);

    for (std::size_t i = 0; i < BlockElementCount; ++i)
    {
        if (q.data[i] != 0)
        {
            std::cerr << "test_quant_zero_block: quantized[" << i << "] expected 0, got "
                      << q.data[i] << "\n";
            return false;
        }

        if (std::fabs(recon.data[i]) > 1e-6f)
        {
            std::cerr << "test_quant_zero_block: reconstructed[" << i << "] expected ≈0, got "
                      << recon.data[i] << "\n";
            return false;
        }
    }

    return true;
}

int main()
{
    int total = 0;
    int failed = 0;

    runTest("quant_identity_all_ones", &test_quant_identity_all_ones, total, failed);
    runTest("quant_zero_block", &test_quant_zero_block, total, failed);

    std::cout << "----------------------------------------\n";
    std::cout << "Quantization tests run:   " << total << "\n";
    std::cout << "Quantization tests failed:" << failed << "\n";

    return (failed == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
}
