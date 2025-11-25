#pragma once
#include <cstddef>

namespace jpegdsp::core
{
    // Block dimensions
    inline constexpr std::size_t BlockSize = 8;                    // 8x8 JPEG blocks
    inline constexpr std::size_t BlockElementCount = BlockSize * BlockSize; // 64 coefficients
    
    // Pixel value constants
    inline constexpr int MAX_PIXEL_VALUE = 255;                    // 8-bit pixel maximum
    inline constexpr int MIN_PIXEL_VALUE = 0;                      // 8-bit pixel minimum
    inline constexpr int JPEG_LEVEL_SHIFT = 128;                   // DC level shift for DCT (centers values around 0)
    
    // Bitstream constants
    inline constexpr int BITS_PER_BYTE = 8;                        // Bits in a byte
    
    // RLE constants
    inline constexpr int ZRL_RUN_LENGTH = 16;                      // Zero run length for ZRL symbol
}
