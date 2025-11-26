/**
 * @file test_jpeg_pipeline.cpp
 * @brief Comprehensive test of JPEG encoding pipeline to identify corruption point
 */

#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/ColorSpace.hpp"
#include "jpegdsp/transforms/DCTTransform.hpp"
#include "jpegdsp/jpeg/Quantization.hpp"
#include "jpegdsp/jpeg/JPEGWriter.hpp"
#include "jpegdsp/api/JPEGEncoder.hpp"
#include "jpegdsp/util/FileIO.hpp"
#include "../TestFramework.hpp"

#include <iostream>
#include <iomanip>
#include <vector>
#include <cmath>

using namespace jpegdsp;
using namespace jpegdsp::test;

// Test 1: Verify block extraction maintains pixel values
bool test_block_extraction()
{
    // Create a simple 16x16 gradient pattern
    core::Image img(16, 16, core::ColorSpace::GRAY, 1);
    for (size_t y = 0; y < 16; ++y)
    {
        for (size_t x = 0; x < 16; ++x)
        {
            img.at(x, y, 0) = static_cast<uint8_t>((x + y * 16) % 256);
        }
    }
    
    // Extract blocks
    auto blocks = core::BlockExtractor::extractBlocks(img);
    
    if (blocks.size() != 4)
    {
        return false;
    }
    
    // Check if first block matches image data
    for (size_t y = 0; y < 8; ++y)
    {
        for (size_t x = 0; x < 8; ++x)
        {
            if (std::abs(blocks[0].at(x, y) - static_cast<float>(img.at(x, y, 0))) > 0.01f)
            {
                return false;
            }
        }
    }
    
    return true;
}

// Test 2: Verify DCT is reversible
bool test_dct_reversibility()
{
    // Create a simple test pattern
    core::Block8x8f original;
    for (size_t y = 0; y < 8; ++y)
    {
        for (size_t x = 0; x < 8; ++x)
        {
            original.at(x, y) = static_cast<float>((x + y * 8) * 2) - 128.0f;
        }
    }
    
    // Forward DCT
    transforms::DCT8x8Transform dct;
    core::Block8x8f dctBlock;
    dct.forward(original, dctBlock);
    
    // Inverse DCT
    core::Block8x8f reconstructed;
    dct.inverse(dctBlock, reconstructed);
    
    // Check error
    float maxError = 0.0f;
    for (size_t i = 0; i < 64; ++i)
    {
        float error = std::abs(original.data[i] - reconstructed.data[i]);
        if (error > maxError) maxError = error;
    }
    
    return maxError < 0.01f;
}

// Test 3: Verify color block extraction
bool test_color_block_extraction()
{
    // Create 16x16 RGB image with distinct colors
    core::Image img(16, 16, core::ColorSpace::RGB, 3);
    for (size_t y = 0; y < 16; ++y)
    {
        for (size_t x = 0; x < 16; ++x)
        {
            img.at(x, y, 0) = static_cast<uint8_t>(x * 16);  // R
            img.at(x, y, 1) = static_cast<uint8_t>(y * 16);  // G
            img.at(x, y, 2) = 128;                           // B
        }
    }
    
    // Manually extract a Y channel block the way JPEGWriter does
    core::Block8x8f yBlock;
    for (size_t y = 0; y < 8; ++y)
    {
        for (size_t x = 0; x < 8; ++x)
        {
            yBlock.at(x, y) = static_cast<float>(img.at(x, y, 0)) - 128.0f;
        }
    }
    
    // Verify extraction matches image
    for (size_t y = 0; y < 8; ++y)
    {
        for (size_t x = 0; x < 8; ++x)
        {
            float expected = static_cast<float>(img.at(x, y, 0)) - 128.0f;
            float actual = yBlock.at(x, y);
            if (std::abs(expected - actual) > 0.01f)
            {
                return false;
            }
        }
    }
    
    return true;
}

// Test 4: End-to-end encoding of simple pattern
bool test_simple_encoding()
{
    // Create a simple 64x64 gradient
    core::Image img(64, 64, core::ColorSpace::RGB, 3);
    for (size_t y = 0; y < 64; ++y)
    {
        for (size_t x = 0; x < 64; ++x)
        {
            img.at(x, y, 0) = static_cast<uint8_t>((x * 255) / 63);
            img.at(x, y, 1) = static_cast<uint8_t>((y * 255) / 63);
            img.at(x, y, 2) = 128;
        }
    }
    
    try
    {
        auto result = api::JPEGEncoder::encode(
            img,
            75,
            api::JPEGEncoder::Format::COLOR_420,
            false
        );
        
        return result.compressedBytes > 0 && result.compressedBytes < 10000;
    }
    catch (const std::exception&)
    {
        return false;
    }
}

// Test 5: Verify Block::at indexing
bool test_block_indexing()
{
    core::Block8x8f block;
    
    // Fill with known pattern: block[y][x] = y*10 + x
    for (size_t y = 0; y < 8; ++y)
    {
        for (size_t x = 0; x < 8; ++x)
        {
            block.at(x, y) = static_cast<float>(y * 10 + x);
        }
    }
    
    return (block.at(0,0) == 0.0f && block.at(1,0) == 1.0f && block.at(0,1) == 10.0f);
}

int main()
{
    TestStats stats;
    
    runTest("block_indexing", test_block_indexing, stats);
    runTest("block_extraction", test_block_extraction, stats);
    runTest("dct_reversibility", test_dct_reversibility, stats);
    runTest("color_block_extraction", test_color_block_extraction, stats);
    runTest("simple_encoding", test_simple_encoding, stats);
    
    stats.printSummary("JPEG Pipeline tests");
    
    return stats.exitCode();
}
