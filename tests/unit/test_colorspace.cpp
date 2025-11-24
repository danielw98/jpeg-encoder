// tests/unit/test_colorspace.cpp
#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/core/ColorSpace.hpp"
#include <iostream>

using namespace jpegdsp::core;

int main()
{
    // 1x1 pixel test: pure red
    Image rgb(1, 1, ColorSpace::RGB, 3);
    rgb.at(0, 0, 0) = 255; // R
    rgb.at(0, 0, 1) = 0;   // G
    rgb.at(0, 0, 2) = 0;   // B

    Image ycbcr = ColorConverter::RGBtoYCbCr(rgb);
    Image rgb2  = ColorConverter::YCbCrtoRGB(ycbcr);

    std::cout << "R=" << int(rgb2.at(0,0,0))
              << " G=" << int(rgb2.at(0,0,1))
              << " B=" << int(rgb2.at(0,0,2)) << "\n";

    return 0;
}
