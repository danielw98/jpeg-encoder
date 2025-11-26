// test_dc_only.cpp - Test encoding with DC-only blocks (all AC coefficients zero)
#include "../../include/jpegdsp/jpeg/JPEGWriter.hpp"
#include "../../include/jpegdsp/core/Image.hpp"
#include <iostream>
#include <fstream>

using namespace jpegdsp;

int main() {
    std::cout << "=== DC-Only Encoding Test ===\n";
    std::cout << "Creating 16×16 uniform gray image (value=128)\n";
    
    // Create uniform gray image - after DCT, only DC should be non-zero
    core::Image img(16, 16, core::ColorSpace::GRAY, 1);
    for (int y = 0; y < 16; ++y) {
        for (int x = 0; x < 16; ++x) {
            img.at(x, y, 0) = 128; // Uniform value
        }
    }
    
    std::cout << "Encoding grayscale...\n";
    jpeg::JPEGWriter writer;
    auto encoded = writer.encodeGrayscale(img, 90);
    std::cout << "Encoded size: " << encoded.size() << " bytes\n";
    
    std::ofstream out("../tests/outputs/dc_only_test.jpg", std::ios::binary);
    out.write(reinterpret_cast<const char*>(encoded.data()), encoded.size());
    out.close();
    
    std::cout << "Written to dc_only_test.jpg\n";
    std::cout << "(Should be uniform gray - value 128)\n";
    
    // Now try a stepped DC-only test - each 8×8 block has a different constant value
    std::cout << "\n=== Stepped DC-Only Test ===\n";
    std::cout << "Creating 16×16 with 4 blocks of different grays\n";
    
    core::Image img2(16, 16, core::ColorSpace::GRAY, 1);
    // Top-left: 64, Top-right: 128, Bottom-left: 192, Bottom-right: 255
    for (int y = 0; y < 8; ++y) {
        for (int x = 0; x < 8; ++x) {
            img2.at(x, y, 0) = 64;           // TL
            img2.at(x + 8, y, 0) = 128;      // TR
            img2.at(x, y + 8, 0) = 192;      // BL
            img2.at(x + 8, y + 8, 0) = 255;  // BR
        }
    }
    
    std::cout << "Block values:\n";
    std::cout << "  TL: 64  (dark gray)\n";
    std::cout << "  TR: 128 (mid gray)\n";
    std::cout << "  BL: 192 (light gray)\n";
    std::cout << "  BR: 255 (white)\n";
    
    jpeg::JPEGWriter writer2;
    auto encoded2 = writer2.encodeGrayscale(img2, 90);
    std::cout << "Encoded size: " << encoded2.size() << " bytes\n";
    
    std::ofstream out2("../tests/outputs/dc_stepped_test.jpg", std::ios::binary);
    out2.write(reinterpret_cast<const char*>(encoded2.data()), encoded2.size());
    out2.close();
    
    std::cout << "Written to dc_stepped_test.jpg\n";
    std::cout << "(Should show 4 uniform squares with increasing brightness)\n";
    
    return 0;
}
