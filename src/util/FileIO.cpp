#include "jpegdsp/util/FileIO.hpp"

namespace jpegdsp::util {

// TODO: implement using stb_image / stb_image_write or libpng

jpegdsp::core::Image ImageIO::loadImage(const std::string& path) {
    (void)path;
    return jpegdsp::core::Image{};
}

void ImageIO::savePNG(const jpegdsp::core::Image& image,
                      const std::string& path) {
    (void)image;
    (void)path;
}

} // namespace jpegdsp::util
