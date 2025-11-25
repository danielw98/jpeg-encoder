// tests/unit/test_colorspace.cpp
#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/core/ColorSpace.hpp"
#include "../TestFramework.hpp"
#include <iostream>

using namespace jpegdsp::core;
using namespace jpegdsp::test;

bool test_colorspace_roundtrip_red()
{
    // 1x1 pixel test: pure red
    Image rgb(1, 1, ColorSpace::RGB, 3);
    rgb.at(0, 0, 0) = 255; // R
    rgb.at(0, 0, 1) = 0;   // G
    rgb.at(0, 0, 2) = 0;   // B

    Image ycbcr = ColorConverter::RGBtoYCbCr(rgb);
    Image rgb2  = ColorConverter::YCbCrtoRGB(ycbcr);

    uint8_t r = rgb2.at(0, 0, 0);
    uint8_t g = rgb2.at(0, 0, 1);
    uint8_t b = rgb2.at(0, 0, 2);
    
    std::cout << "  RGB roundtrip: R=" << int(r) << " G=" << int(g) << " B=" << int(b) << "\n";
    
    // Allow tolerance of ±2 for color conversion rounding
    return (r >= 253 && r <= 255) && (g <= 2) && (b <= 2);
}

int main()
{
    TestStats stats;
    
    runTest("colorspace_roundtrip_red", &test_colorspace_roundtrip_red, stats);
    
    stats.printSummary("ColorSpace tests");
    return stats.exitCode();
}
