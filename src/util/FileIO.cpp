#include "jpegdsp/util/FileIO.hpp"
#include <stdexcept>
#include <cstring>

// Choose image loading backend
#ifdef JPEGDSP_USE_OPENCV
    #include <opencv2/opencv.hpp>
#else
    // stb_image: Load images (PPM, PGM, PNG, JPEG)
    #define STB_IMAGE_IMPLEMENTATION
    #define STBI_ONLY_PNG
    #define STBI_ONLY_PNM  // PPM, PGM
    #include "stb_image.h"
#endif

namespace jpegdsp::util {

#ifdef JPEGDSP_USE_OPENCV

// OpenCV implementation - supports all common formats (JPG, PNG, BMP, TIFF, WebP, etc.)
jpegdsp::core::Image ImageIO::loadImage(const std::string& path) {
    cv::Mat mat = cv::imread(path, cv::IMREAD_UNCHANGED);
    
    if (mat.empty()) {
        throw std::runtime_error("ImageIO::loadImage: Failed to load image from " + path);
    }
    
    // Determine color space and channels
    int channels = mat.channels();
    core::ColorSpace colorSpace;
    
    if (channels == 1) {
        colorSpace = core::ColorSpace::GRAY;
    } else if (channels == 3) {
        // OpenCV loads as BGR, convert to RGB
        cv::cvtColor(mat, mat, cv::COLOR_BGR2RGB);
        colorSpace = core::ColorSpace::RGB;
    } else if (channels == 4) {
        // BGRA → RGB (ignore alpha)
        cv::cvtColor(mat, mat, cv::COLOR_BGRA2RGB);
        channels = 3;
        colorSpace = core::ColorSpace::RGB;
    } else {
        throw std::runtime_error("ImageIO::loadImage: Unsupported channel count: " + 
                                 std::to_string(channels));
    }
    
    // Ensure 8-bit depth
    if (mat.depth() != CV_8U) {
        mat.convertTo(mat, CV_8U);
    }
    
    // Create Image object
    core::Image img(static_cast<size_t>(mat.cols), 
                    static_cast<size_t>(mat.rows), 
                    colorSpace, 
                    channels);
    
    // Copy pixel data
    for (int y = 0; y < mat.rows; ++y) {
        for (int x = 0; x < mat.cols; ++x) {
            if (channels == 1) {
                img.at(x, y, 0) = mat.at<uint8_t>(y, x);
            } else {
                for (int c = 0; c < channels; ++c) {
                    img.at(x, y, c) = mat.at<cv::Vec3b>(y, x)[c];
                }
            }
        }
    }
    
    return img;
}

#else

// stb_image implementation - supports PPM, PGM, PNG
jpegdsp::core::Image ImageIO::loadImage(const std::string& path) {
    int width, height, channels;
    
    // Load image using stb_image
    unsigned char* data = stbi_load(path.c_str(), &width, &height, &channels, 0);
    
    if (!data) {
        throw std::runtime_error("ImageIO::loadImage: Failed to load image from " + path + 
                                 " - " + std::string(stbi_failure_reason()));
    }
    
    // Determine color space based on channels
    core::ColorSpace colorSpace;
    if (channels == 1) {
        colorSpace = core::ColorSpace::GRAY;
    } else if (channels == 3 || channels == 4) {
        colorSpace = core::ColorSpace::RGB;
        channels = 3;  // Ignore alpha if present
    } else {
        stbi_image_free(data);
        throw std::runtime_error("ImageIO::loadImage: Unsupported channel count: " + 
                                 std::to_string(channels));
    }
    
    // Create Image object
    core::Image img(static_cast<size_t>(width), 
                    static_cast<size_t>(height), 
                    colorSpace, 
                    channels);
    
    // Copy pixel data
    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            for (int c = 0; c < channels; ++c) {
                int srcIdx = (y * width + x) * (channels == 3 ? channels : (channels == 1 ? 1 : 4)) + c;
                img.at(x, y, c) = data[srcIdx];
            }
        }
    }
    
    // Free stb_image data
    stbi_image_free(data);
    
    return img;
}

#endif

void ImageIO::savePNG(const jpegdsp::core::Image& image,
                      const std::string& path) {
    (void)image;
    (void)path;
    throw std::runtime_error("ImageIO::savePNG: Not implemented yet");
}

} // namespace jpegdsp::util
