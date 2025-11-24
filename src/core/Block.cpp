#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/Constants.hpp"
#include <stdexcept>

namespace jpegdsp::core {

std::vector<Block8x8f> BlockExtractor::extractBlocks(const Image& plane)
{
    if (plane.channels() != 1)
    {
        throw std::invalid_argument("BlockExtractor::extractBlocks: expected single-channel image");
    }

    std::size_t w = plane.width();
    std::size_t h = plane.height();

    if (w % BlockSize != 0 || h % BlockSize != 0)
    {
        throw std::invalid_argument("BlockExtractor::extractBlocks: width/height must be multiples of BlockSize");
    }

    std::size_t blocksX = w / BlockSize;
    std::size_t blocksY = h / BlockSize;

    std::vector<Block8x8f> blocks;
    blocks.reserve(blocksX * blocksY);

    for (std::size_t by = 0; by < blocksY; by++)
    {
        for (std::size_t bx = 0; bx < blocksX; bx++)
        {
            Block8x8f block{};

            for (std::size_t y = 0; y < BlockSize; y++)
            {
                for (std::size_t x = 0; x < BlockSize; x++)
                {
                    std::size_t imgX = bx * BlockSize + x;
                    std::size_t imgY = by * BlockSize + y;

                    block.at(x, y) = static_cast<float>(plane.at(imgX, imgY, 0));
                }
            }

            blocks.push_back(block);
        }
    }

    return blocks;
}

} // namespace jpegdsp::core