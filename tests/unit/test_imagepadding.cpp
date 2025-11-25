#include "jpegdsp/core/ImagePadding.hpp"
#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/core/Constants.hpp"
#include <iostream>
#include <cstdlib>

using namespace jpegdsp;

// ---------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------
static int failedTests = 0;

static void runTest(const char* testName, bool (*testFunc)())
{
    std::cout << "Running " << testName << "... ";
    if (testFunc())
    {
        std::cout << "[PASS]\n";
    }
    else
    {
        std::cout << "[FAIL]\n";
        failedTests++;
    }
}

// ---------------------------------------------------------------------
// Test: No padding needed (already valid dimensions)
// ---------------------------------------------------------------------
bool test_no_padding_needed()
{
    // Create 64×64 grayscale image (already multiple of 8)
    core::Image img(64, 64, core::ColorSpace::GRAY, 1);
    
    // Fill with test pattern
    for (size_t y = 0; y < img.height(); ++y)
        for (size_t x = 0; x < img.width(); ++x)
            img.at(x, y, 0) = static_cast<uint8_t>((x + y) % 256);
    
    // Pad to multiple of 8
    core::Image padded = core::ImagePadding::padToMultiple(img, 8);
    
    // Should return same dimensions
    if (padded.width() != 64 || padded.height() != 64)
    {
        std::cerr << "Expected 64×64, got " << padded.width() << "×" << padded.height() << "\n";
        return false;
    }
    
    // Verify data unchanged
    for (size_t y = 0; y < img.height(); ++y)
    {
        for (size_t x = 0; x < img.width(); ++x)
        {
            if (padded.at(x, y, 0) != img.at(x, y, 0))
            {
                std::cerr << "Pixel mismatch at (" << x << ", " << y << ")\n";
                return false;
            }
        }
    }
    
    return true;
}

// ---------------------------------------------------------------------
// Test: Padding width only (63×64 → 64×64)
// ---------------------------------------------------------------------
bool test_pad_width_only()
{
    // Create 63×64 grayscale image
    core::Image img(63, 64, core::ColorSpace::GRAY, 1);
    
    // Fill with test pattern
    for (size_t y = 0; y < img.height(); ++y)
        for (size_t x = 0; x < img.width(); ++x)
            img.at(x, y, 0) = static_cast<uint8_t>(x);
    
    // Pad to multiple of 8
    core::Image padded = core::ImagePadding::padToMultiple(img, 8);
    
    // Should be 64×64
    if (padded.width() != 64 || padded.height() != 64)
    {
        std::cerr << "Expected 64×64, got " << padded.width() << "×" << padded.height() << "\n";
        return false;
    }
    
    // Verify original pixels unchanged
    for (size_t y = 0; y < img.height(); ++y)
    {
        for (size_t x = 0; x < img.width(); ++x)
        {
            if (padded.at(x, y, 0) != img.at(x, y, 0))
            {
                std::cerr << "Original pixel mismatch at (" << x << ", " << y << ")\n";
                return false;
            }
        }
    }
    
    // Verify right edge replicated (column 63 should equal column 62)
    for (size_t y = 0; y < img.height(); ++y)
    {
        if (padded.at(63, y, 0) != padded.at(62, y, 0))
        {
            std::cerr << "Edge replication failed at y=" << y << "\n";
            return false;
        }
    }
    
    return true;
}

// ---------------------------------------------------------------------
// Test: Padding height only (64×63 → 64×64)
// ---------------------------------------------------------------------
bool test_pad_height_only()
{
    // Create 64×63 grayscale image
    core::Image img(64, 63, core::ColorSpace::GRAY, 1);
    
    // Fill with test pattern
    for (size_t y = 0; y < img.height(); ++y)
        for (size_t x = 0; x < img.width(); ++x)
            img.at(x, y, 0) = static_cast<uint8_t>(y);
    
    // Pad to multiple of 8
    core::Image padded = core::ImagePadding::padToMultiple(img, 8);
    
    // Should be 64×64
    if (padded.width() != 64 || padded.height() != 64)
    {
        std::cerr << "Expected 64×64, got " << padded.width() << "×" << padded.height() << "\n";
        return false;
    }
    
    // Verify original pixels unchanged
    for (size_t y = 0; y < img.height(); ++y)
    {
        for (size_t x = 0; x < img.width(); ++x)
        {
            if (padded.at(x, y, 0) != img.at(x, y, 0))
            {
                std::cerr << "Original pixel mismatch at (" << x << ", " << y << ")\n";
                return false;
            }
        }
    }
    
    // Verify bottom edge replicated (row 63 should equal row 62)
    for (size_t x = 0; x < img.width(); ++x)
    {
        if (padded.at(x, 63, 0) != padded.at(x, 62, 0))
        {
            std::cerr << "Edge replication failed at x=" << x << "\n";
            return false;
        }
    }
    
    return true;
}

// ---------------------------------------------------------------------
// Test: Padding both dimensions (100×100 → 104×104)
// ---------------------------------------------------------------------
bool test_pad_both_dimensions()
{
    // Create 100×100 RGB image
    core::Image img(100, 100, core::ColorSpace::RGB, 3);
    
    // Fill with gradient
    for (size_t y = 0; y < img.height(); ++y)
    {
        for (size_t x = 0; x < img.width(); ++x)
        {
            img.at(x, y, 0) = static_cast<uint8_t>(x * 2);       // R
            img.at(x, y, 1) = static_cast<uint8_t>(y * 2);       // G
            img.at(x, y, 2) = static_cast<uint8_t>((x + y) % 256); // B
        }
    }
    
    // Pad to multiple of 8
    core::Image padded = core::ImagePadding::padToMultiple(img, 8);
    
    // Should be 104×104 (next multiple of 8)
    if (padded.width() != 104 || padded.height() != 104)
    {
        std::cerr << "Expected 104×104, got " << padded.width() << "×" << padded.height() << "\n";
        return false;
    }
    
    // Verify original pixels unchanged
    for (size_t y = 0; y < img.height(); ++y)
    {
        for (size_t x = 0; x < img.width(); ++x)
        {
            for (size_t c = 0; c < img.channels(); ++c)
            {
                if (padded.at(x, y, c) != img.at(x, y, c))
                {
                    std::cerr << "Original pixel mismatch at (" << x << ", " << y << ", ch" << c << ")\n";
                    return false;
                }
            }
        }
    }
    
    // Verify right edge replicated
    for (size_t y = 0; y < img.height(); ++y)
    {
        for (size_t c = 0; c < img.channels(); ++c)
        {
            if (padded.at(100, y, c) != padded.at(99, y, c) ||
                padded.at(101, y, c) != padded.at(99, y, c) ||
                padded.at(102, y, c) != padded.at(99, y, c) ||
                padded.at(103, y, c) != padded.at(99, y, c))
            {
                std::cerr << "Right edge replication failed at y=" << y << ", ch=" << c << "\n";
                return false;
            }
        }
    }
    
    // Verify bottom edge replicated
    for (size_t x = 0; x < img.width(); ++x)
    {
        for (size_t c = 0; c < img.channels(); ++c)
        {
            if (padded.at(x, 100, c) != padded.at(x, 99, c) ||
                padded.at(x, 101, c) != padded.at(x, 99, c) ||
                padded.at(x, 102, c) != padded.at(x, 99, c) ||
                padded.at(x, 103, c) != padded.at(x, 99, c))
            {
                std::cerr << "Bottom edge replication failed at x=" << x << ", ch=" << c << "\n";
                return false;
            }
        }
    }
    
    // Verify corner replicated correctly (should use edge-replicated values)
    for (size_t y = 100; y < 104; ++y)
    {
        for (size_t x = 100; x < 104; ++x)
        {
            for (size_t c = 0; c < img.channels(); ++c)
            {
                if (padded.at(x, y, c) != padded.at(99, 99, c))
                {
                    std::cerr << "Corner replication failed at (" << x << ", " << y << ", ch" << c << ")\n";
                    return false;
                }
            }
        }
    }
    
    return true;
}

// ---------------------------------------------------------------------
// Test: isDimensionValid()
// ---------------------------------------------------------------------
bool test_is_dimension_valid()
{
    core::Image img64x64(64, 64, core::ColorSpace::GRAY, 1);
    core::Image img63x64(63, 64, core::ColorSpace::GRAY, 1);
    core::Image img64x63(64, 63, core::ColorSpace::GRAY, 1);
    core::Image img100x100(100, 100, core::ColorSpace::GRAY, 1);
    
    if (!core::ImagePadding::isDimensionValid(img64x64, 8))
    {
        std::cerr << "64×64 should be valid for blockSize=8\n";
        return false;
    }
    
    if (core::ImagePadding::isDimensionValid(img63x64, 8))
    {
        std::cerr << "63×64 should be invalid for blockSize=8\n";
        return false;
    }
    
    if (core::ImagePadding::isDimensionValid(img64x63, 8))
    {
        std::cerr << "64×63 should be invalid for blockSize=8\n";
        return false;
    }
    
    if (core::ImagePadding::isDimensionValid(img100x100, 8))
    {
        std::cerr << "100×100 should be invalid for blockSize=8\n";
        return false;
    }
    
    if (!core::ImagePadding::isDimensionValid(img64x64, 16))
    {
        std::cerr << "64×64 should be valid for blockSize=16\n";
        return false;
    }
    
    if (core::ImagePadding::isDimensionValid(img64x64, 24))
    {
        std::cerr << "64×64 should be invalid for blockSize=24\n";
        return false;
    }
    
    return true;
}

// ---------------------------------------------------------------------
// Test: getPaddedDimensions()
// ---------------------------------------------------------------------
bool test_get_padded_dimensions()
{
    auto [w1, h1] = core::ImagePadding::getPaddedDimensions(64, 64, 8);
    if (w1 != 64 || h1 != 64)
    {
        std::cerr << "64×64 → expected 64×64, got " << w1 << "×" << h1 << "\n";
        return false;
    }
    
    auto [w2, h2] = core::ImagePadding::getPaddedDimensions(63, 64, 8);
    if (w2 != 64 || h2 != 64)
    {
        std::cerr << "63×64 → expected 64×64, got " << w2 << "×" << h2 << "\n";
        return false;
    }
    
    auto [w3, h3] = core::ImagePadding::getPaddedDimensions(100, 100, 8);
    if (w3 != 104 || h3 != 104)
    {
        std::cerr << "100×100 → expected 104×104, got " << w3 << "×" << h3 << "\n";
        return false;
    }
    
    auto [w4, h4] = core::ImagePadding::getPaddedDimensions(97, 33, 16);
    if (w4 != 112 || h4 != 48)
    {
        std::cerr << "97×33 → expected 112×48, got " << w4 << "×" << h4 << "\n";
        return false;
    }
    
    return true;
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------
int main()
{
    std::cout << "======================================\n";
    std::cout << "ImagePadding Unit Tests\n";
    std::cout << "======================================\n";
    
    runTest("test_no_padding_needed", test_no_padding_needed);
    runTest("test_pad_width_only", test_pad_width_only);
    runTest("test_pad_height_only", test_pad_height_only);
    runTest("test_pad_both_dimensions", test_pad_both_dimensions);
    runTest("test_is_dimension_valid", test_is_dimension_valid);
    runTest("test_get_padded_dimensions", test_get_padded_dimensions);
    
    std::cout << "======================================\n";
    if (failedTests == 0)
    {
        std::cout << "All tests passed!\n";
        return EXIT_SUCCESS;
    }
    else
    {
        std::cout << failedTests << " test(s) failed.\n";
        return EXIT_FAILURE;
    }
}
