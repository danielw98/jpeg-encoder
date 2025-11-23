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

} // namespace jpegdsp::core
