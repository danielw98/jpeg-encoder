#pragma once
#include <string>
#include "jpegdsp/core/Image.hpp"

namespace jpegdsp::util {

class ImageIO {
public:
    static jpegdsp::core::Image loadImage(const std::string& path);
    static void savePNG(const jpegdsp::core::Image& image,
                        const std::string& path);
};

} // namespace jpegdsp::util
