#include "jpegdsp/core/ImagePadding.hpp"
#include "jpegdsp/core/Constants.hpp"
#include <algorithm>

namespace jpegdsp::core {

bool ImagePadding::isDimensionValid(const Image& img, std::size_t blockSize) noexcept
{
    return (img.width() % blockSize == 0) && (img.height() % blockSize == 0);
}

std::pair<std::size_t, std::size_t> ImagePadding::getPaddedDimensions(
    std::size_t width, std::size_t height, std::size_t blockSize) noexcept
{
    auto roundUp = [blockSize](std::size_t value) -> std::size_t {
        return ((value + blockSize - 1) / blockSize) * blockSize;
    };
    
    return {roundUp(width), roundUp(height)};
}

Image ImagePadding::padToMultiple(const Image& img, std::size_t blockSize)
{
    // Check if padding is needed
    if (isDimensionValid(img, blockSize))
    {
        return img; // Return copy of original
    }
    
    // Calculate padded dimensions
    auto [paddedWidth, paddedHeight] = getPaddedDimensions(img.width(), img.height(), blockSize);
    
    // Create padded image
    Image padded(paddedWidth, paddedHeight, img.colorSpace(), img.channels());
    
    // Copy original image data
    for (std::size_t y = 0; y < img.height(); ++y)
    {
        for (std::size_t x = 0; x < img.width(); ++x)
        {
            for (std::size_t c = 0; c < img.channels(); ++c)
            {
                padded.at(x, y, c) = img.at(x, y, c);
            }
        }
    }
    
    // Replicate right edge (fill columns beyond original width)
    if (paddedWidth > img.width())
    {
        std::size_t lastCol = img.width() - 1;
        for (std::size_t y = 0; y < img.height(); ++y)
        {
            for (std::size_t x = img.width(); x < paddedWidth; ++x)
            {
                for (std::size_t c = 0; c < img.channels(); ++c)
                {
                    padded.at(x, y, c) = img.at(lastCol, y, c);
                }
            }
        }
    }
    
    // Replicate bottom edge (fill rows beyond original height)
    if (paddedHeight > img.height())
    {
        std::size_t lastRow = img.height() - 1;
        for (std::size_t y = img.height(); y < paddedHeight; ++y)
        {
            for (std::size_t x = 0; x < paddedWidth; ++x)
            {
                for (std::size_t c = 0; c < img.channels(); ++c)
                {
                    // Use last valid row, but current x (which may be from edge replication)
                    std::size_t srcX = std::min(x, img.width() - 1);
                    padded.at(x, y, c) = img.at(srcX, lastRow, c);
                }
            }
        }
    }
    
    return padded;
}

} // namespace jpegdsp::core
