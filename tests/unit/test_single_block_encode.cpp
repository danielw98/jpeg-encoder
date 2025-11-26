/**
 * @file test_single_block_encode.cpp
 * @brief Test encoding a single known 8x8 block through the complete pipeline
 */

#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/jpeg/JPEGWriter.hpp"
#include "jpegdsp/core/Image.hpp"
#include <iostream>
#include <iomanip>
#include <fstream>

using namespace jpegdsp;

int main()
{
    std::cout << "=== Single Block Encoding Test ===\n\n";
    
    // Create an 8x8 grayscale image with a known pattern
    core::Image img(8, 8, core::ColorSpace::GRAY, 1);
    
    std::cout << "Input 8x8 image:\n";
    for (size_t y = 0; y < 8; ++y)
    {
        for (size_t x = 0; x < 8; ++x)
        {
            uint8_t value = static_cast<uint8_t>((x + y) * 16);
            img.at(x, y, 0) = value;
            std::cout << std::setw(4) << (int)value << " ";
        }
        std::cout << "\n";
    }
    
    // Encode with JPEGWriter
    jpeg::JPEGWriter writer;
    auto jpegData = writer.encodeGrayscale(img, 100); // Use quality 100 for minimal quantization
    
    std::cout << "\nEncoded JPEG size: " << jpegData.size() << " bytes\n";
    
    // Save to file
    std::ofstream outFile("../tests/outputs/single_block.jpg", std::ios::binary);
    outFile.write(reinterpret_cast<const char*>(jpegData.data()), jpegData.size());
    outFile.close();
    
    std::cout << "Saved to ../tests/outputs/single_block.jpg\n";
    std::cout << "\n[PASS] Single block encoding completed\n";
    
    return 0;
}
