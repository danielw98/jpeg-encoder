/**
 * @file test_grayscale_simple.cpp
 * @brief Test grayscale encoding to isolate color issues
 */

#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/jpeg/JPEGWriter.hpp"
#include <iostream>
#include <fstream>

int main()
{
    using namespace jpegdsp;
    
    // Create a 256×256 test pattern to diagnose transpose
    // Top half: horizontal gradient (value = x)
    // Bottom half: vertical gradient (value = y - 128)
    core::Image img(256, 256, core::ColorSpace::GRAY, 1);
    for (std::size_t y = 0; y < 256; ++y)
    {
        for (std::size_t x = 0; x < 256; ++x)
        {
            if (y < 128)
            {
                // Top half: horizontal gradient
                img.at(x, y, 0) = static_cast<std::uint8_t>(x);
            }
            else
            {
                // Bottom half: vertical gradient
                img.at(x, y, 0) = static_cast<std::uint8_t>(y - 128);
            }
        }
    }
    
    std::cout << "Created 256×256 test pattern\n";
    std::cout << "  Top half: horizontal gradient (left=black, right=white)\n";
    std::cout << "  Bottom half: vertical gradient (top=black, bottom=white)\n\n";
    
    // Encode
    jpeg::JPEGWriter writer;
    const auto jpegData = writer.encodeGrayscale(img, 90);
    
    std::cout << "Encoded to " << jpegData.size() << " bytes\n";
    
    // Write to file
    std::ofstream out("../tests/outputs/grayscale_test.jpg", std::ios::binary);
    out.write(reinterpret_cast<const char*>(jpegData.data()), jpegData.size());
    out.close();
    
    std::cout << "Written to grayscale_test.jpg\n";
    std::cout << "Should show a horizontal gradient from dark to light.\n";
    
    return 0;
}
