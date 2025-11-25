#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/Constants.hpp"
#include "../TestFramework.hpp"
#include <iostream>
#include <vector>
#include <cstdlib>

using namespace jpegdsp::core;
using namespace jpegdsp::test;

bool test_block_single_8x8()
{
    std::size_t w = BlockSize;
    std::size_t h = BlockSize;
    Image img(w, h, ColorSpace::GRAY, 1);

    // Fill with simple pattern: value = y * width + x (0..63)
    for (std::size_t y = 0; y < h; ++y)
    {
        for (std::size_t x = 0; x < w; ++x)
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
    for (std::size_t y = 0; y < BlockSize; ++y)
    {
        for (std::size_t x = 0; x < BlockSize; ++x)
        {
            float expected = static_cast<float>(y * w + x);
            float got = b.data[y * BlockSize + x];
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
    std::size_t h = BlockSize;
    Image img(w, h, ColorSpace::GRAY, 1);

    // Pattern: value = y * width + x (0..127)
    for (std::size_t y = 0; y < h; ++y)
    {
        for (std::size_t x = 0; x < w; ++x)
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

    if (b0.at(0, 0) != 0.0f)
    {
        std::cerr << "test_block_16x8_two_blocks: b0(0,0) expected 0, got "
                  << b0.at(0, 0) << "\n";
        return false;
    }

    if (b1.at(0, 0) != 8.0f)
    {
        std::cerr << "test_block_16x8_two_blocks: b1(0,0) expected 8, got "
                  << b1.at(0, 0) << "\n";
        return false;
    }

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

int main()
{
    TestStats stats;

    runTest("block_single_8x8", &test_block_single_8x8, stats);
    runTest("block_16x8_two_blocks", &test_block_16x8_two_blocks, stats);

    stats.printSummary("Block tests");
    return stats.exitCode();
}
