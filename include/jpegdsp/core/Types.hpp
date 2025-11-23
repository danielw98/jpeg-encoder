#pragma once
#include <cstdint>

namespace jpegdsp::core {

using Pixel8 = std::uint8_t;

enum class ColorSpace {
    RGB,
    YCbCr,
    GRAY
};

} // namespace jpegdsp::core

namespace jpegdsp::jpeg {

enum class Component {
    Y,
    Cb,
    Cr
};

} // namespace jpegdsp::jpeg
