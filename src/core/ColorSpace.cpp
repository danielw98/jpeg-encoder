#include "jpegdsp/core/ColorSpace.hpp"

namespace jpegdsp::core {

// TODO: implement RGB <-> YCbCr conversion

Image ColorConverter::RGBtoYCbCr(const Image& rgb) {
    (void)rgb;
    return Image{};
}

Image ColorConverter::YCbCrtoRGB(const Image& ycbcr) {
    (void)ycbcr;
    return Image{};
}

} // namespace jpegdsp::core
