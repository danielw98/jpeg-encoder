#include "jpegdsp/jpeg/JPEGWriter.hpp"
#include "jpegdsp/core/Image.hpp"
#include "../TestFramework.hpp"
#include <iostream>

using namespace jpegdsp;
using namespace jpegdsp::test;

// Helper to verify APP1 marker with original dimensions
bool verifyAPP1Marker(const std::vector<std::uint8_t>& jpegData, 
                      std::uint16_t expectedWidth, std::uint16_t expectedHeight)
{
    for (size_t i = 0; i < jpegData.size() - 14; ++i)
    {
        if (jpegData[i] == 0xFF && jpegData[i+1] == 0xE1)
        {
            if (jpegData[i+4] != 'J' || jpegData[i+5] != 'P' || 
                jpegData[i+6] != 'E' || jpegData[i+7] != 'G' ||
                jpegData[i+8] != 'D' || jpegData[i+9] != 'S' ||
                jpegData[i+10] != 'P' || jpegData[i+11] != 0x00)
            {
                std::cerr << "APP1 identifier mismatch\n";
                return false;
            }
            
            std::uint16_t width = (jpegData[i+12] << 8) | jpegData[i+13];
            std::uint16_t height = (jpegData[i+14] << 8) | jpegData[i+15];
            
            if (width != expectedWidth || height != expectedHeight)
            {
                std::cerr << "APP1 dimensions mismatch\n";
                return false;
            }
            return true;
        }
    }
    std::cerr << "APP1 marker not found\n";
    return false;
}

bool test_grayscale_padding_app1()
{
    core::Image grayImg(13, 17, core::ColorSpace::GRAY, 1);
    for (std::size_t y = 0; y < 17; ++y)
        for (std::size_t x = 0; x < 13; ++x)
            grayImg.at(x, y, 0) = static_cast<uint8_t>((x * 10 + y * 10) % 256);
    
    jpeg::JPEGWriter writer;
    auto jpegData = writer.encodeGrayscale(grayImg, 75);
    return verifyAPP1Marker(jpegData, 13, 17);
}

bool test_rgb_padding_app1()
{
    core::Image rgbImg(100, 75, core::ColorSpace::RGB, 3);
    for (std::size_t y = 0; y < 75; ++y)
        for (std::size_t x = 0; x < 100; ++x)
        {
            rgbImg.at(x, y, 0) = static_cast<uint8_t>((x * 255) / 100);
            rgbImg.at(x, y, 1) = static_cast<uint8_t>((y * 255) / 75);
            rgbImg.at(x, y, 2) = 128;
        }
    
    jpeg::JPEGWriter writer;
    auto jpegData = writer.encodeYCbCr(rgbImg, 75);
    return verifyAPP1Marker(jpegData, 100, 75);
}

bool test_aligned_image_app1()
{
    core::Image alignedImg(64, 48, core::ColorSpace::RGB, 3);
    for (std::size_t y = 0; y < 48; ++y)
        for (std::size_t x = 0; x < 64; ++x)
        {
            alignedImg.at(x, y, 0) = static_cast<uint8_t>(x * 4);
            alignedImg.at(x, y, 1) = static_cast<uint8_t>(y * 5);
            alignedImg.at(x, y, 2) = 200;
        }
    
    jpeg::JPEGWriter writer;
    auto jpegData = writer.encodeYCbCr(alignedImg, 75);
    return verifyAPP1Marker(jpegData, 64, 48);
}

int main()
{
    TestStats stats;
    
    runTest("Grayscale padding APP1", test_grayscale_padding_app1, stats);
    runTest("RGB padding APP1", test_rgb_padding_app1, stats);
    runTest("Aligned image APP1", test_aligned_image_app1, stats);
    
    stats.printSummary("JPEG padding tests");
    return stats.exitCode();
}
