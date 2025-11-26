/**
 * @file test_solid_red_debug.cpp
 * @brief Create solid red 16x16 and trace entire encoding
 */

#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/core/ColorSpace.hpp"
#include "jpegdsp/jpeg/JPEGWriter.hpp"
#include <iostream>
#include <fstream>
#include <iomanip>

int main()
{
    using namespace jpegdsp;
    
    // Create solid red 16×16
    core::Image img(16, 16, core::ColorSpace::RGB, 3);
    for (std::size_t y = 0; y < 16; ++y)
    {
        for (std::size_t x = 0; x < 16; ++x)
        {
            img.at(x, y, 0) = 255; // R
            img.at(x, y, 1) = 0;   // G
            img.at(x, y, 2) = 0;   // B
        }
    }
    
    std::cout << "Created solid red 16×16 RGB image\n";
    std::cout << "Sample pixels:\n";
    std::cout << "  (0,0): R=" << (int)img.at(0,0,0) << " G=" << (int)img.at(0,0,1) << " B=" << (int)img.at(0,0,2) << "\n";
    std::cout << "  (15,15): R=" << (int)img.at(15,15,0) << " G=" << (int)img.at(15,15,1) << " B=" << (int)img.at(15,15,2) << "\n\n";
    
    // Encode
    jpeg::JPEGWriter writer;
    const auto jpegData = writer.encodeYCbCr(img, 90);
    
    std::cout << "Encoded to " << jpegData.size() << " bytes\n";
    
    // Write to file
    std::ofstream out("../tests/outputs/solid_red_debug.jpg", std::ios::binary);
    out.write(reinterpret_cast<const char*>(jpegData.data()), jpegData.size());
    out.close();
    
    std::cout << "Written to solid_red_debug.jpg\n";
    std::cout << "This should display as pure red. If it's corrupted, the bug persists.\n";
    
    return 0;
}
