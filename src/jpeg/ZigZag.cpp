#include "jpegdsp/jpeg/ZigZag.hpp"

namespace {
    // Standard JPEG zig-zag order (Annex K.1, ITU-T81)
    constexpr std::array<std::size_t, 64> ZigZagIndex
    {
        0,  1,  5,  6, 14, 15, 27, 28,
        2,  4,  7, 13, 16, 26, 29, 42,
        3,  8, 12, 17, 25, 30, 41, 43,
        9, 11, 18, 24, 31, 40, 44, 53,
       10, 19, 23, 32, 39, 45, 52, 54,
       20, 22, 33, 38, 46, 51, 55, 60,
       21, 34, 37, 47, 50, 56, 59, 61,
       35, 36, 48, 49, 57, 58, 62, 63
    };
}

namespace jpegdsp::jpeg {
    
std::array<std::int16_t, 64> ZigZag::toZigZag(const jpegdsp::core::Block<std::int16_t, 8>& block)
{
    std::array<std::int16_t, 64> out{};

    constexpr std::size_t N = jpegdsp::core::BlockSize; // should be 8

    for (std::size_t i = 0; i < 64; i++)
    {
        const std::size_t pos = ZigZagIndex[i];
        const std::size_t x = pos % N;
        const std::size_t y = pos / N;

        out[i] = block.data[pos];
    }

    return out;
}

jpegdsp::core::Block<std::int16_t, 8> ZigZag::fromZigZag(const std::array<std::int16_t, 64>& zz)
{
    jpegdsp::core::Block<std::int16_t, 8> block{};

    for (std::size_t i = 0; i < 64; i++)
    {
        const std::size_t pos = ZigZagIndex[i];
        block.data[pos] = zz[i];
    }

    return block;
}

} // namespace jpegdsp::jpeg

