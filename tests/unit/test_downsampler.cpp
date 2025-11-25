/**
 * @file test_downsampler.cpp
 * @brief Unit tests for Downsampler class (YCbCr 4:2:0 chroma subsampling)
 */

#include "jpegdsp/core/Downsampler.hpp"
#include <iostream>
#include <cmath>

using namespace jpegdsp::core;

/**
 * @brief Test helper: Run test and report result
 * @param testName Name of the test
 * @param testFunc Function returning true on pass, false on fail
 * @return Number of failures (0 or 1)
 */
int runTest(const char* testName, bool (*testFunc)())
{
    std::cout << "Running " << testName << "... ";
    const bool passed = testFunc();
    if (passed)
    {
        std::cout << "[PASS]" << std::endl;
        return 0;
    }
    else
    {
        std::cout << "[FAIL]" << std::endl;
        return 1;
    }
}

/**
 * @brief Test basic 4:2:0 downsampling with uniform 2x2 blocks
 * 
 * Input: 16x16 Cb/Cr with uniform 2x2 blocks of values 0, 64, 128, 192
 * Expected output: 8x8 with same values (no averaging needed)
 */
bool test_downsample_420_basic()
{
    // Create 16x16 Cb/Cr images with uniform 2x2 blocks
    Image cb(16, 16, ColorSpace::GRAY, 1);
    Image cr(16, 16, ColorSpace::GRAY, 1);
    
    for (std::size_t y = 0; y < 16; ++y)
    {
        for (std::size_t x = 0; x < 16; ++x)
        {
            // Assign values in 2x2 blocks: 0, 64, 128, 192
            const std::size_t blockX = x / 2;
            const std::size_t blockY = y / 2;
            const Pixel8 value = static_cast<Pixel8>((blockX + blockY * 8) % 4 * 64);
            
            cb.at(x, y, 0) = value;
            cr.at(x, y, 0) = value + 32; // Cr offset by 32
        }
    }
    
    Downsampler downsampler;
    const Image cbcrSubsampled = downsampler.downsample420(cb, cr);
    
    // Verify output dimensions
    if (cbcrSubsampled.width() != 8 || cbcrSubsampled.height() != 8 || cbcrSubsampled.channels() != 2)
    {
        std::cerr << "Output dimensions incorrect: expected 8x8x2, got "
                  << cbcrSubsampled.width() << "x" << cbcrSubsampled.height() << "x" << cbcrSubsampled.channels()
                  << std::endl;
        return false;
    }
    
    // Verify downsampled values match (since 2x2 blocks were uniform)
    for (std::size_t y = 0; y < 8; ++y)
    {
        for (std::size_t x = 0; x < 8; ++x)
        {
            const Pixel8 expectedCb = static_cast<Pixel8>((x + y * 8) % 4 * 64);
            const Pixel8 expectedCr = expectedCb + 32;
            
            const Pixel8 actualCb = cbcrSubsampled.at(x, y, 0);
            const Pixel8 actualCr = cbcrSubsampled.at(x, y, 1);
            
            if (actualCb != expectedCb || actualCr != expectedCr)
            {
                std::cerr << "Value mismatch at (" << x << "," << y << "): "
                          << "expected Cb=" << static_cast<int>(expectedCb) << " Cr=" << static_cast<int>(expectedCr)
                          << ", got Cb=" << static_cast<int>(actualCb) << " Cr=" << static_cast<int>(actualCr)
                          << std::endl;
                return false;
            }
        }
    }
    
    return true;
}

/**
 * @brief Test 4:2:0 downsampling with checkerboard pattern (averaging required)
 * 
 * Input: 16x16 Cb/Cr with alternating 0/255 checkerboard
 * Expected output: 8x8 with all values ~127 (averaged)
 */
bool test_downsample_420_checkerboard()
{
    // Create 16x16 Cb/Cr images with checkerboard pattern
    Image cb(16, 16, ColorSpace::GRAY, 1);
    Image cr(16, 16, ColorSpace::GRAY, 1);
    
    for (std::size_t y = 0; y < 16; ++y)
    {
        for (std::size_t x = 0; x < 16; ++x)
        {
            const Pixel8 valueCb = ((x + y) % 2 == 0) ? 0 : 255;
            const Pixel8 valueCr = ((x + y) % 2 == 0) ? 255 : 0; // Inverted checkerboard
            
            cb.at(x, y, 0) = valueCb;
            cr.at(x, y, 0) = valueCr;
        }
    }
    
    Downsampler downsampler;
    const Image cbcrSubsampled = downsampler.downsample420(cb, cr);
    
    // Verify all output pixels are ~127 (averaged from 0/255 checkerboard)
    // Expected: (0 + 255 + 255 + 0 + 2) / 4 = 127 (with rounding)
    for (std::size_t y = 0; y < 8; ++y)
    {
        for (std::size_t x = 0; x < 8; ++x)
        {
            const Pixel8 actualCb = cbcrSubsampled.at(x, y, 0);
            const Pixel8 actualCr = cbcrSubsampled.at(x, y, 1);
            
            // Allow ±1 tolerance for rounding
            if (std::abs(static_cast<int>(actualCb) - 127) > 1 ||
                std::abs(static_cast<int>(actualCr) - 127) > 1)
            {
                std::cerr << "Checkerboard averaging failed at (" << x << "," << y << "): "
                          << "expected ~127, got Cb=" << static_cast<int>(actualCb)
                          << " Cr=" << static_cast<int>(actualCr)
                          << std::endl;
                return false;
            }
        }
    }
    
    return true;
}

/**
 * @brief Test validation: mismatched Cb/Cr dimensions
 */
bool test_downsample_420_dimension_mismatch()
{
    Image cb(16, 16, ColorSpace::GRAY, 1);
    Image cr(16, 32, ColorSpace::GRAY, 1); // Wrong height
    
    Downsampler downsampler;
    try
    {
        downsampler.downsample420(cb, cr);
        std::cerr << "Expected exception for mismatched dimensions" << std::endl;
        return false;
    }
    catch (const std::invalid_argument&)
    {
        // Expected exception
        return true;
    }
}

/**
 * @brief Test validation: dimensions not multiples of 16
 */
bool test_downsample_420_invalid_dimensions()
{
    Image cb(15, 16, ColorSpace::GRAY, 1); // Width not multiple of 16
    Image cr(15, 16, ColorSpace::GRAY, 1);
    
    Downsampler downsampler;
    try
    {
        downsampler.downsample420(cb, cr);
        std::cerr << "Expected exception for invalid dimensions" << std::endl;
        return false;
    }
    catch (const std::invalid_argument&)
    {
        // Expected exception
        return true;
    }
}

int main()
{
    int failCount = 0;
    
    failCount += runTest("test_downsample_420_basic", test_downsample_420_basic);
    failCount += runTest("test_downsample_420_checkerboard", test_downsample_420_checkerboard);
    failCount += runTest("test_downsample_420_dimension_mismatch", test_downsample_420_dimension_mismatch);
    failCount += runTest("test_downsample_420_invalid_dimensions", test_downsample_420_invalid_dimensions);
    
    if (failCount == 0)
    {
        std::cout << "\nAll Downsampler tests passed!" << std::endl;
    }
    else
    {
        std::cout << "\n" << failCount << " Downsampler test(s) failed." << std::endl;
    }
    
    return (failCount == 0) ? 0 : 1;
}
