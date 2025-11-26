#include "jpegdsp/util/FileIO.hpp"
#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
#include <stdexcept>
#include <cstring>

namespace jpegdsp::util {

// stb_image implementation - supports JPG, PNG, BMP, TGA, GIF, PSD, HDR, PIC
jpegdsp::core::Image ImageIO::loadImage(const std::string& path)
{
    int width, height, channels;
    
    // First probe to see how many channels the image has
    if (!stbi_info(path.c_str(), &width, &height, &channels))
    {
        throw std::runtime_error("ImageIO::loadImage: Failed to get image info from " + path + 
                                 " (" + std::string(stbi_failure_reason()) + ")");
    }
    
    // Determine desired output format
    int desiredChannels = (channels == 1) ? 1 : 3;
    
    // Load with conversion to desired format
    unsigned char* data = stbi_load(path.c_str(), &width, &height, &channels, desiredChannels);
    
    if (!data)
    {
        throw std::runtime_error("ImageIO::loadImage: Failed to load image from " + path + 
                                 " (" + std::string(stbi_failure_reason()) + ")");
    }
    
    // Set up color space
    core::ColorSpace colorSpace = (desiredChannels == 1) ? core::ColorSpace::GRAY : core::ColorSpace::RGB;
    
    // Create Image object
    core::Image img(static_cast<size_t>(width), 
                    static_cast<size_t>(height), 
                    colorSpace, 
                    desiredChannels);
    
    // Copy pixel data (stb_image has already converted to desired channel count)
    for (int y = 0; y < height; y++)
    {
        for (int x = 0; x < width; x++)
        {
            for (int c = 0; c < desiredChannels; c++)
            {
                img.at(x, y, c) = data[(y * width + x) * desiredChannels + c];
            }
        }
    }
    
    stbi_image_free(data);
    return img;
}

void ImageIO::savePNG(const jpegdsp::core::Image& image,
                      const std::string& path)
{
    (void)image;
    (void)path;
    throw std::runtime_error("ImageIO::savePNG: Not implemented yet");
}

} // namespace jpegdsp::util
