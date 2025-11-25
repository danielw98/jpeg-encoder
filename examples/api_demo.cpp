#include "jpegdsp/api/JPEGEncoder.hpp"
#include "jpegdsp/core/Image.hpp"
#include <iostream>
#include <cstdlib>

using namespace jpegdsp;

int main()
{
    try
    {
        // Create test image with arbitrary dimensions (not multiple of 8 or 16)
        const size_t width = 100;
        const size_t height = 75;
        
        std::cout << "Creating " << width << "×" << height << " RGB test image...\n";
        
        core::Image img(width, height, core::ColorSpace::RGB, 3);
        
        // Fill with gradient pattern
        for (size_t y = 0; y < height; ++y)
        {
            for (size_t x = 0; x < width; ++x)
            {
                img.at(x, y, 0) = static_cast<uint8_t>((x * 255) / width);       // R: horizontal gradient
                img.at(x, y, 1) = static_cast<uint8_t>((y * 255) / height);      // G: vertical gradient
                img.at(x, y, 2) = static_cast<uint8_t>(((x + y) * 255) / (width + height)); // B: diagonal
            }
        }
        
        std::cout << "\n=== Encoding Grayscale (Quality 75) ===\n";
        auto grayResult = api::JPEGEncoder::encodeToFile(
            img, 
            "output_api_gray.jpg", 
            75, 
            api::JPEGEncoder::Format::GRAYSCALE
        );
        std::cout << grayResult.toString();
        
        std::cout << "\n=== Encoding Color 4:2:0 (Quality 75) ===\n";
        auto colorResult = api::JPEGEncoder::encodeToFile(
            img, 
            "output_api_color.jpg", 
            75, 
            api::JPEGEncoder::Format::COLOR_420
        );
        std::cout << colorResult.toString();
        
        std::cout << "\n=== Encoding Color 4:2:0 (Quality 95) ===\n";
        auto hqResult = api::JPEGEncoder::encodeToFile(
            img, 
            "output_api_color_hq.jpg", 
            95, 
            api::JPEGEncoder::Format::COLOR_420
        );
        std::cout << hqResult.toString();
        
        std::cout << "\nAll images saved successfully!\n";
        std::cout << "Note: Original dimensions (100×75) were automatically padded:\n";
        std::cout << "  - Grayscale: Padded to 104×80 (multiple of 8)\n";
        std::cout << "  - Color:     Padded to 112×80 (multiple of 16)\n";
        
        return EXIT_SUCCESS;
    }
    catch (const std::exception& e)
    {
        std::cerr << "Error: " << e.what() << "\n";
        return EXIT_FAILURE;
    }
}
