#pragma once
#include <cstddef>

namespace jpegdsp::core
{
    inline constexpr std::size_t BlockSize = 8;                    // 8x8 JPEG blocks
    inline constexpr std::size_t BlockElementCount = BlockSize * BlockSize; // 64 coefficients
}
