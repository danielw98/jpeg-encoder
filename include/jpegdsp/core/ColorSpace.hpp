#pragma once
#include "Image.hpp"

namespace jpegdsp::core {

class ColorConverter {
public:
    static Image RGBtoYCbCr(const Image& rgb);
    static Image YCbCrtoRGB(const Image& ycbcr);
};

} // namespace jpegdsp::core
