#include "jpegdsp/api/JPEGEncoder.hpp"
#include "jpegdsp/core/Image.hpp"
#include <iostream>
#include <fstream>

int main()
{
    // Create a simple 64x64 RGB test pattern
    jpegdsp::core::Image img(64, 64, jpegdsp::core::ColorSpace::RGB, 3);
    
    for (size_t y = 0; y < 64; ++y)
    {
        for (size_t x = 0; x < 64; ++x)
        {
            img.at(x, y, 0) = static_cast<uint8_t>((x * 255) / 63);  // R gradient
            img.at(x, y, 1) = static_cast<uint8_t>((y * 255) / 63);  // G gradient
            img.at(x, y, 2) = 128;  // Constant B
        }
    }
    
    try
    {
        auto result = jpegdsp::api::JPEGEncoder::encodeToFile(
            img,
            "test_synthetic.jpg",
            75,
            jpegdsp::api::JPEGEncoder::Format::COLOR_420,
            false
        );
        
        std::cout << "Synthetic image encoded successfully!\n";
        std::cout << "  Size: " << result.compressedBytes << " bytes\n";
        std::cout << "  Ratio: " << result.compressionRatio << "x\n";
        
        return 0;
    }
    catch (const std::exception& e)
    {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}
