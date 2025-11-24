#pragma once
#include <cstdint>
#include <vector>
#include <array>
#include "jpegdsp/core/Constants.hpp"

namespace jpegdsp::jpeg
{

struct RLESymbol
{
    std::uint8_t run;     // Number of leading zeros
    std::int16_t value;   // Coefficient value (can be negative)
};

// JPEG-specific symbol values
inline constexpr std::uint8_t ZRL = 15; // Run=15, value=0 => Zero Run Length
inline constexpr std::uint8_t EOB = 0;  // Run=0, value=0  => End Of Block

class RLE
{
public:
    // Encodes only AC coefficients (zig-zag indices 1..63)
    static std::vector<RLESymbol>
    encodeAC(const std::array<std::int16_t, jpegdsp::core::BlockElementCount>& zz);
};

} // namespace jpegdsp::jpeg