#pragma once
#include <vector>
#include "Types.hpp"

namespace jpegdsp::core {

class Image {
public:
    Image() = default;
    Image(std::size_t width, std::size_t height,
          ColorSpace colorSpace, std::size_t channels);

    std::size_t width() const noexcept { return m_width; }
    std::size_t height() const noexcept { return m_height; }
    std::size_t channels() const noexcept { return m_channels; }
    ColorSpace colorSpace() const noexcept { return m_colorSpace; }

    Pixel8* data() noexcept { return m_buffer.data(); }
    const Pixel8* data() const noexcept { return m_buffer.data(); }
    
    // Get raw byte vector (for entropy calculation, serialization, etc.)
    const std::vector<Pixel8>& toBytes() const noexcept { return m_buffer; }

    Pixel8& at(std::size_t x, std::size_t y, std::size_t c);
    const Pixel8& at(std::size_t x, std::size_t y, std::size_t c) const;

private:
    std::size_t m_width = 0;
    std::size_t m_height = 0;
    std::size_t m_channels = 0;
    ColorSpace m_colorSpace = ColorSpace::RGB;
    std::vector<Pixel8> m_buffer;
};

} // namespace jpegdsp::core
