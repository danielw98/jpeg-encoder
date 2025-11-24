#pragma once
#include <array>
#include <cstddef>
#include <cstdint>
#include <vector>
#include "Constants.hpp"
#include "Image.hpp"

namespace jpegdsp::core {

template<typename T, std::size_t N>
struct Block
{
    std::array<T, N * N> data{};

    T& at(std::size_t x, std::size_t y)
    {
        return data[y * N + x];
    }

    const T& at(std::size_t x, std::size_t y) const
    {
        return data[y * N + x];
    }
};

using Block8x8f = Block<float, BlockSize>;
using Block8x8i = Block<std::int16_t, BlockSize>;

class BlockExtractor
{
public:
    // Assumes single-channel image, width/height multiples of BlockSize.
    static std::vector<Block8x8f> extractBlocks(const Image& plane);
};

} // namespace jpegdsp::core