#include "jpegdsp/core/Image.hpp"
#include <stdexcept>

namespace jpegdsp::core {

Image::Image(std::size_t width, std::size_t height,
             ColorSpace colorSpace, std::size_t channels)
    : m_width(width),
      m_height(height),
      m_channels(channels),
      m_colorSpace(colorSpace),
      m_buffer(width * height * channels)
{}

Pixel8& Image::at(std::size_t x, std::size_t y, std::size_t c) {
    if (x >= m_width || y >= m_height || c >= m_channels) {
        throw std::out_of_range("Image::at");
    }
    return m_buffer[(y * m_width + x) * m_channels + c];
}

const Pixel8& Image::at(std::size_t x, std::size_t y, std::size_t c) const {
    if (x >= m_width || y >= m_height || c >= m_channels) {
        throw std::out_of_range("Image::at");
    }
    return m_buffer[(y * m_width + x) * m_channels + c];
}

Image Image::padToMultiple(std::size_t blockWidth, std::size_t blockHeight) const
{
    // Calculate padded dimensions
    const std::size_t paddedWidth = ((m_width + blockWidth - 1) / blockWidth) * blockWidth;
    const std::size_t paddedHeight = ((m_height + blockHeight - 1) / blockHeight) * blockHeight;
    
    // If already aligned, return copy
    if (paddedWidth == m_width && paddedHeight == m_height) {
        return *this;
    }
    
    // Create padded image
    Image padded(paddedWidth, paddedHeight, m_colorSpace, m_channels);
    
    // Copy original content and replicate edges
    for (std::size_t y = 0; y < paddedHeight; ++y) {
        for (std::size_t x = 0; x < paddedWidth; ++x) {
            // Clamp coordinates to original image bounds (edge replication)
            const std::size_t srcX = (x < m_width) ? x : (m_width - 1);
            const std::size_t srcY = (y < m_height) ? y : (m_height - 1);
            
            for (std::size_t c = 0; c < m_channels; ++c) {
                padded.at(x, y, c) = this->at(srcX, srcY, c);
            }
        }
    }
    
    return padded;
}

} // namespace jpegdsp::core
