/**
 * @file test_mcu_debug.cpp
 * @brief Debug MCU extraction and encoding to find corruption source
 */

#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/core/ColorSpace.hpp"
#include "jpegdsp/core/Downsampler.hpp"
#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/transforms/DCTTransform.hpp"
#include "jpegdsp/jpeg/Quantization.hpp"
#include <iostream>
#include <iomanip>

using namespace jpegdsp;

void printBlock(const char* name, const core::Block8x8f& block)
{
    std::cout << name << ":\n";
    for (std::size_t y = 0; y < 8; ++y)
    {
        for (std::size_t x = 0; x < 8; ++x)
        {
            std::cout << std::setw(6) << std::fixed << std::setprecision(1) << block.at(x, y) << " ";
        }
        std::cout << "\n";
    }
    std::cout << "\n";
}

int main()
{
    // Create a simple 16×16 RGB image with distinct colors in each quadrant
    core::Image img(16, 16, core::ColorSpace::RGB, 3);
    
    for (std::size_t y = 0; y < 16; ++y)
    {
        for (std::size_t x = 0; x < 16; ++x)
        {
            if (x < 8 && y < 8)
            {
                // Top-left: Red (255, 0, 0)
                img.at(x, y, 0) = 255;
                img.at(x, y, 1) = 0;
                img.at(x, y, 2) = 0;
            }
            else if (x >= 8 && y < 8)
            {
                // Top-right: Green (0, 255, 0)
                img.at(x, y, 0) = 0;
                img.at(x, y, 1) = 255;
                img.at(x, y, 2) = 0;
            }
            else if (x < 8 && y >= 8)
            {
                // Bottom-left: Blue (0, 0, 255)
                img.at(x, y, 0) = 0;
                img.at(x, y, 1) = 0;
                img.at(x, y, 2) = 255;
            }
            else
            {
                // Bottom-right: Yellow (255, 255, 0)
                img.at(x, y, 0) = 255;
                img.at(x, y, 1) = 255;
                img.at(x, y, 2) = 0;
            }
        }
    }
    
    std::cout << "=== Original RGB Image (16×16) ===\n";
    std::cout << "Top-left: Red, Top-right: Green, Bottom-left: Blue, Bottom-right: Yellow\n\n";
    
    // Convert to YCbCr
    const core::Image ycbcr = core::ColorConverter::RGBtoYCbCr(img);
    
    std::cout << "=== After RGB→YCbCr conversion ===\n";
    std::cout << "Sampling top-left corner (should be red):\n";
    std::cout << "  Y=" << (int)ycbcr.at(0, 0, 0) << " Cb=" << (int)ycbcr.at(0, 0, 1) << " Cr=" << (int)ycbcr.at(0, 0, 2) << "\n";
    std::cout << "Sampling top-right corner (should be green):\n";
    std::cout << "  Y=" << (int)ycbcr.at(8, 0, 0) << " Cb=" << (int)ycbcr.at(8, 0, 1) << " Cr=" << (int)ycbcr.at(8, 0, 2) << "\n\n";
    
    // Split into separate channels
    core::Image yChannel(16, 16, core::ColorSpace::GRAY, 1);
    core::Image cbChannel(16, 16, core::ColorSpace::GRAY, 1);
    core::Image crChannel(16, 16, core::ColorSpace::GRAY, 1);
    
    for (std::size_t y = 0; y < 16; ++y)
    {
        for (std::size_t x = 0; x < 16; ++x)
        {
            yChannel.at(x, y, 0) = ycbcr.at(x, y, 0);
            cbChannel.at(x, y, 0) = ycbcr.at(x, y, 1);
            crChannel.at(x, y, 0) = ycbcr.at(x, y, 2);
        }
    }
    
    // Downsample to 4:2:0
    core::Downsampler downsampler;
    const core::Image cbcrSubsampled = downsampler.downsample420(cbChannel, crChannel);
    
    std::cout << "=== After 4:2:0 downsampling ===\n";
    std::cout << "cbcrSubsampled dimensions: " << cbcrSubsampled.width() << "×" << cbcrSubsampled.height() << " (should be 8×8)\n";
    std::cout << "cbcrSubsampled channels: " << cbcrSubsampled.channels() << " (should be 2)\n\n";
    
    // Extract first Y block (top-left, should be red)
    core::Block8x8f yBlock0;
    for (std::size_t y = 0; y < 8; ++y)
    {
        for (std::size_t x = 0; x < 8; ++x)
        {
            yBlock0.at(x, y) = static_cast<float>(yChannel.at(x, y, 0)) - 128.0f;
        }
    }
    
    std::cout << "=== Y Block 0 (top-left, RED area) ===\n";
    std::cout << "Average value: " << (yBlock0.at(0, 0) + 128.0f) << " (before level shift)\n";
    std::cout << "After level shift (-128), first value: " << yBlock0.at(0, 0) << "\n\n";
    
    // Extract Cb block for this MCU
    core::Block8x8f cbBlock;
    for (std::size_t y = 0; y < 8; ++y)
    {
        for (std::size_t x = 0; x < 8; ++x)
        {
            cbBlock.at(x, y) = static_cast<float>(cbcrSubsampled.at(x, y, 0)) - 128.0f;
        }
    }
    
    std::cout << "=== Cb Block (entire MCU, all 4 quadrants) ===\n";
    std::cout << "Value at (0,0) - from RED area: " << (cbBlock.at(0, 0) + 128.0f) << " (before shift)\n";
    std::cout << "Value at (4,0) - from GREEN area: " << (cbBlock.at(4, 0) + 128.0f) << " (before shift)\n\n";
    
    printBlock("Cb Block (level-shifted)", cbBlock);
    
    // Extract Cr block
    core::Block8x8f crBlock;
    for (std::size_t y = 0; y < 8; ++y)
    {
        for (std::size_t x = 0; x < 8; ++x)
        {
            crBlock.at(x, y) = static_cast<float>(cbcrSubsampled.at(x, y, 1)) - 128.0f;
        }
    }
    
    printBlock("Cr Block (level-shifted)", crBlock);
    
    // Apply DCT to see what happens
    transforms::DCT8x8Transform dct;
    core::Block8x8f dctCb, dctCr;
    dct.forward(cbBlock, dctCb);
    dct.forward(crBlock, dctCr);
    
    std::cout << "=== After DCT ===\n";
    std::cout << "Cb DC coefficient: " << dctCb.at(0, 0) << "\n";
    std::cout << "Cr DC coefficient: " << dctCr.at(0, 0) << "\n\n";
    
    // Apply quantization
    const jpeg::QuantTable chromaTable = jpeg::QuantTable::makeChromaStd(90);
    core::Block8x8i quantCb, quantCr;
    jpeg::Quantizer::quantize(dctCb, chromaTable, quantCb);
    jpeg::Quantizer::quantize(dctCr, chromaTable, quantCr);
    
    std::cout << "=== After Quantization (Q=90) ===\n";
    std::cout << "Cb quantized DC: " << quantCb.at(0, 0) << "\n";
    std::cout << "Cr quantized DC: " << quantCr.at(0, 0) << "\n\n";
    
    return 0;
}
