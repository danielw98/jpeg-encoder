#pragma once
#include "jpegdsp/core/Image.hpp"

namespace jpegdsp::core {

/**
 * @brief Utility functions for image padding
 * 
 * JPEG requires image dimensions to be multiples of block size (8 for grayscale, 16 for color).
 * This class provides padding utilities using edge replication strategy.
 */
class ImagePadding
{
public:
    /**
     * @brief Pad image to nearest multiple of blockSize using edge replication
     * @param img Source image
     * @param blockSize Block size (8 for grayscale, 16 for YCbCr 4:2:0)
     * @return Padded image (or original if already correct size)
     */
    static Image padToMultiple(const Image& img, std::size_t blockSize);
    
    /**
     * @brief Check if image dimensions are multiples of blockSize
     */
    static bool isDimensionValid(const Image& img, std::size_t blockSize) noexcept;
    
    /**
     * @brief Calculate padded dimensions
     */
    static std::pair<std::size_t, std::size_t> getPaddedDimensions(
        std::size_t width, std::size_t height, std::size_t blockSize) noexcept;
};

} // namespace jpegdsp::core
