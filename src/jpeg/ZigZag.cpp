#include "jpegdsp/jpeg/ZigZag.hpp"
#include "jpegdsp/core/Constants.hpp"

namespace {
    // Standard JPEG zig-zag order (Figure A.6, ITU-T.81)
    // Maps zigzag position i to raster-scan position
    // out[zigzag_pos] = block.data[ZigZagIndex[zigzag_pos]]
    constexpr std::array<std::size_t, jpegdsp::core::BlockElementCount> ZigZagIndex
    {
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
    
std::array<std::int16_t, jpegdsp::core::BlockElementCount> ZigZag::toZigZag(const jpegdsp::core::Block<std::int16_t, jpegdsp::core::BlockSize>& block)
{
    std::array<std::int16_t, jpegdsp::core::BlockElementCount> out{};

    constexpr std::size_t N = jpegdsp::core::BlockSize;

    for (std::size_t i = 0; i < jpegdsp::core::BlockElementCount; i++)
    {
        const std::size_t pos = ZigZagIndex[i];
        const std::size_t x = pos % N;
        const std::size_t y = pos / N;

        out[i] = block.data[pos];
    }

    return out;
}

jpegdsp::core::Block<std::int16_t, jpegdsp::core::BlockSize> ZigZag::fromZigZag(const std::array<std::int16_t, jpegdsp::core::BlockElementCount>& zz)
{
    jpegdsp::core::Block<std::int16_t, jpegdsp::core::BlockSize> block{};

    for (std::size_t i = 0; i < jpegdsp::core::BlockElementCount; i++)
    {
        const std::size_t pos = ZigZagIndex[i];
        block.data[pos] = zz[i];
    }

    return block;
}

} // namespace jpegdsp::jpeg

