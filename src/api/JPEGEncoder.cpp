#include "jpegdsp/api/JPEGEncoder.hpp"
#include "jpegdsp/jpeg/JPEGEncoder.hpp"
#include "jpegdsp/jpeg/JPEGTypes.hpp"
#include "jpegdsp/core/ImagePadding.hpp"
#include "jpegdsp/core/ColorSpace.hpp"
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <iomanip>

namespace jpegdsp::api {

std::string JPEGEncoder::EncodeResult::toString() const
{
    std::ostringstream oss;
    oss << "JPEG Encoding Result:\n"
        << "  Original dimensions: " << originalWidth << "×" << originalHeight << "\n"
        << "  Padded dimensions:   " << paddedWidth << "×" << paddedHeight << "\n"
        << "  Original size:       " << originalBytes << " bytes\n"
        << "  Compressed size:     " << compressedBytes << " bytes\n"
        << "  Compression ratio:   " << std::fixed << std::setprecision(2) 
        << compressionRatio << "x\n";
    return oss.str();
}

JPEGEncoder::Format JPEGEncoder::autoDetectFormat(const core::Image& img)
{
    if (img.channels() == 1 && img.colorSpace() == core::ColorSpace::GRAY)
    {
        return Format::GRAYSCALE;
    }
    return Format::COLOR_420;
}

JPEGEncoder::EncodeResult JPEGEncoder::encode(
    const core::Image& img,
    int quality,
    Format format)
{
    using namespace core;
    
    // Validate input
    if (img.width() == 0 || img.height() == 0)
    {
        throw std::invalid_argument("JPEGEncoder::encode: Image dimensions cannot be zero");
    }
    
    if (quality < 1 || quality > 100)
    {
        throw std::invalid_argument("JPEGEncoder::encode: Quality must be in range [1-100]");
    }
    
    EncodeResult result;
    result.originalWidth = img.width();
    result.originalHeight = img.height();
    
    // Prepare image for encoding
    Image imageToEncode = img;
    
    // Auto-detect format and convert if needed
    if (format == Format::GRAYSCALE && img.channels() != 1)
    {
        // User wants grayscale but image is color - convert
        if (img.colorSpace() == ColorSpace::RGB)
        {
            // Extract luminance channel (Y = 0.299*R + 0.587*G + 0.114*B)
            Image gray(img.width(), img.height(), ColorSpace::GRAY, 1);
            for (size_t y = 0; y < img.height(); ++y)
            {
                for (size_t x = 0; x < img.width(); ++x)
                {
                    double R = img.at(x, y, 0);
                    double G = img.at(x, y, 1);
                    double B = img.at(x, y, 2);
                    gray.at(x, y, 0) = static_cast<Pixel8>(0.299 * R + 0.587 * G + 0.114 * B);
                }
            }
            imageToEncode = gray;
        }
        else
        {
            throw std::invalid_argument("JPEGEncoder::encode: Cannot convert from " 
                                        "this color space to grayscale");
        }
    }
    else if (format == Format::COLOR_420)
    {
        // Color encoding with 4:2:0 subsampling
        if (img.colorSpace() != ColorSpace::RGB)
        {
            throw std::invalid_argument("JPEGEncoder::encode: Color encoding requires RGB input");
        }
        
        if (img.channels() != 3)
        {
            throw std::invalid_argument("JPEGEncoder::encode: Color encoding requires 3-channel image");
        }
    }
    
    // Create encoder with config (uses jpeg::JPEGEncoder internally)
    jpeg::JPEGEncoderConfig config;
    config.quality = quality;
    config.subsampleChroma = (format == Format::COLOR_420);
    
    jpeg::JPEGEncoder encoder(config);
    
    // Encode image (jpeg::JPEGEncoder handles padding internally)
    result.jpegData = encoder.encode(imageToEncode);
    
    // Calculate padded dimensions based on format
    if (format == Format::GRAYSCALE)
    {
        auto [w, h] = core::ImagePadding::getPaddedDimensions(imageToEncode.width(), imageToEncode.height(), 8);
        result.paddedWidth = w;
        result.paddedHeight = h;
    }
    else // COLOR_420
    {
        auto [w, h] = core::ImagePadding::getPaddedDimensions(imageToEncode.width(), imageToEncode.height(), 16);
        result.paddedWidth = w;
        result.paddedHeight = h;
    }
    
    // Calculate statistics
    result.originalBytes = img.width() * img.height() * img.channels();
    result.compressedBytes = result.jpegData.size();
    result.compressionRatio = static_cast<double>(result.originalBytes) / result.compressedBytes;
    
    return result;
}

JPEGEncoder::EncodeResult JPEGEncoder::encodeToFile(
    const core::Image& img,
    const std::string& filename,
    int quality,
    Format format)
{
    // Encode image
    EncodeResult result = encode(img, quality, format);
    
    // Write to file
    std::ofstream outFile(filename, std::ios::binary);
    if (!outFile)
    {
        throw std::runtime_error("JPEGEncoder::encodeToFile: Failed to open file: " + filename);
    }
    
    outFile.write(reinterpret_cast<const char*>(result.jpegData.data()), 
                  result.jpegData.size());
    
    if (!outFile)
    {
        throw std::runtime_error("JPEGEncoder::encodeToFile: Failed to write to file: " + filename);
    }
    
    outFile.close();
    
    return result;
}

} // namespace jpegdsp::api
