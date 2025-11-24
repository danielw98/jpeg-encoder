#include "jpegdsp/jpeg/RLE.hpp"

namespace jpegdsp::jpeg
{

std::vector<RLESymbol>
RLE::encodeAC(const std::array<std::int16_t, jpegdsp::core::BlockElementCount>& zz)
{
    std::vector<RLESymbol> out;
    out.reserve(32); // Typical JPEG block has few non-zero values

    std::uint8_t zeroRun = 0;
    std::size_t lastNonZeroIndex = 0;

    // First pass: find the last non-zero coefficient
    for (std::size_t i = jpegdsp::core::BlockElementCount - 1; i >= 1; i--)
    {
        if (zz[i] != 0)
        {
            lastNonZeroIndex = i;
            break;
        }
    }

    // If all AC coefficients are zero, emit EOB
    if (lastNonZeroIndex == 0)
    {
        out.push_back({EOB, 0});
        return out;
    }

    // AC coefficients only: indices 1..lastNonZeroIndex
    for (std::size_t i = 1; i <= lastNonZeroIndex; i++)
    {
        const std::int16_t coeff = zz[i];

        if (coeff == 0)
        {
            zeroRun++;

            // Every 16 zeros → emit ZRL
            if (zeroRun == 16)
            {
                out.push_back({ZRL, 0});
                zeroRun = 0;
            }

            continue;
        }

        // Non-zero coefficient: emit (run, value)
        out.push_back({zeroRun, coeff});
        zeroRun = 0;
    }

    // Note: EOB is not automatically emitted. The caller should add it if needed.
    
    return out;
}

} // namespace jpegdsp::jpeg
