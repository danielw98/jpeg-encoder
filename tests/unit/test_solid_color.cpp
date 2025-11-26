/**
 * @file test_solid_color.cpp
 * @brief Test encoding of solid color images to isolate the bug
 */

#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/jpeg/JPEGWriter.hpp"
#include "jpegdsp/util/FileIO.hpp"
#include "../TestFramework.hpp"
#include <fstream>

using namespace jpegdsp;

bool test_solid_red_16x16()
{
    // Create a solid red 16×16 image
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
    
    // Encode to JPEG
    jpeg::JPEGWriter writer;
    const auto jpegData = writer.encodeYCbCr(img, 90);
    
    // Write to file for visual inspection
    std::ofstream out("../tests/outputs/solid_red_16x16.jpg", std::ios::binary);
    out.write(reinterpret_cast<const char*>(jpegData.data()), jpegData.size());
    out.close();
    
    return jpegData.size() > 0;
}

bool test_solid_colors_32x32()
{
    // Create 32×32 image with 4 solid color quadrants
    core::Image img(32, 32, core::ColorSpace::RGB, 3);
    
    for (std::size_t y = 0; y < 32; ++y)
    {
        for (std::size_t x = 0; x < 32; ++x)
        {
            if (x < 16 && y < 16)
            {
                // Top-left: Red
                img.at(x, y, 0) = 255;
                img.at(x, y, 1) = 0;
                img.at(x, y, 2) = 0;
            }
            else if (x >= 16 && y < 16)
            {
                // Top-right: Green
                img.at(x, y, 0) = 0;
                img.at(x, y, 1) = 255;
                img.at(x, y, 2) = 0;
            }
            else if (x < 16 && y >= 16)
            {
                // Bottom-left: Blue
                img.at(x, y, 0) = 0;
                img.at(x, y, 1) = 0;
                img.at(x, y, 2) = 255;
            }
            else
            {
                // Bottom-right: Yellow
                img.at(x, y, 0) = 255;
                img.at(x, y, 1) = 255;
                img.at(x, y, 2) = 0;
            }
        }
    }
    
    // Encode to JPEG
    jpeg::JPEGWriter writer;
    const auto jpegData = writer.encodeYCbCr(img, 90);
    
    // Write to file for visual inspection
    std::ofstream out("../tests/outputs/solid_colors_32x32.jpg", std::ios::binary);
    out.write(reinterpret_cast<const char*>(jpegData.data()), jpegData.size());
    out.close();
    
    return jpegData.size() > 0;
}

bool test_grayscale_gradient_16x16()
{
    // Create simple grayscale gradient
    core::Image img(16, 16, core::ColorSpace::GRAY, 1);
    for (std::size_t y = 0; y < 16; ++y)
    {
        for (std::size_t x = 0; x < 16; ++x)
        {
            img.at(x, y, 0) = static_cast<std::uint8_t>(x * 16); // 0, 16, 32, ..., 240
        }
    }
    
    // Encode to JPEG
    jpeg::JPEGWriter writer;
    const auto jpegData = writer.encodeGrayscale(img, 90);
    
    // Write to file for visual inspection
    std::ofstream out("../tests/outputs/grayscale_gradient_16x16.jpg", std::ios::binary);
    out.write(reinterpret_cast<const char*>(jpegData.data()), jpegData.size());
    out.close();
    
    return jpegData.size() > 0;
}

int main()
{
    using namespace jpegdsp::test;
    TestStats stats;
    
    runTest("solid_red_16x16", test_solid_red_16x16, stats);
    runTest("solid_colors_32x32", test_solid_colors_32x32, stats);
    runTest("grayscale_gradient_16x16", test_grayscale_gradient_16x16, stats);
    
    stats.printSummary("Solid Color Tests");
    return stats.exitCode();
}
