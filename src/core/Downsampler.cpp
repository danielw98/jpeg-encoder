/**
 * @file Downsampler.cpp
 * @brief Implementation of chroma downsampling for YCbCr 4:2:0 JPEG encoding
 */

#include "jpegdsp/core/Downsampler.hpp"
#include <stdexcept>

namespace jpegdsp::core
{
    Image Downsampler::downsample420(const Image& cb, const Image& cr) const
    {
        // Validate inputs
        if (cb.width() != cr.width() || cb.height() != cr.height())
        {
            throw std::invalid_argument("Cb and Cr images must have identical dimensions");
        }
        
        if (cb.channels() != 1 || cr.channels() != 1)
        {
            throw std::invalid_argument("Cb and Cr must be single-channel (GRAY) images");
        }
        
        if (cb.width() % 16 != 0 || cb.height() % 16 != 0)
        {
            throw std::invalid_argument("Image dimensions must be multiples of 16 for 4:2:0 subsampling");
        }
        
        const std::size_t outWidth = cb.width() / 2;
        const std::size_t outHeight = cb.height() / 2;
        
        // Create output image: interleaved Cb/Cr at half resolution
        Image cbcrSubsampled(outWidth, outHeight, ColorSpace::GRAY, 2);
        
        // Perform 2×2 averaging
        for (std::size_t y = 0; y < outHeight; ++y)
        {
            for (std::size_t x = 0; x < outWidth; ++x)
            {
                const std::size_t srcX = x * 2;
                const std::size_t srcY = y * 2;
                
                // Sample 2×2 block from Cb
                const Pixel8 cb00 = cb.at(srcX, srcY, 0);
                const Pixel8 cb01 = cb.at(srcX + 1, srcY, 0);
                const Pixel8 cb10 = cb.at(srcX, srcY + 1, 0);
                const Pixel8 cb11 = cb.at(srcX + 1, srcY + 1, 0);
                
                // Sample 2×2 block from Cr
                const Pixel8 cr00 = cr.at(srcX, srcY, 0);
                const Pixel8 cr01 = cr.at(srcX + 1, srcY, 0);
                const Pixel8 cr10 = cr.at(srcX, srcY + 1, 0);
                const Pixel8 cr11 = cr.at(srcX + 1, srcY + 1, 0);
                
                // Compute averages and store interleaved
                cbcrSubsampled.at(x, y, 0) = average2x2(cb00, cb01, cb10, cb11);
                cbcrSubsampled.at(x, y, 1) = average2x2(cr00, cr01, cr10, cr11);
            }
        }
        
        return cbcrSubsampled;
    }
    
    Pixel8 Downsampler::average2x2(Pixel8 p00, Pixel8 p01, Pixel8 p10, Pixel8 p11) noexcept
    {
        // Compute average with rounding: (p00 + p01 + p10 + p11 + 2) / 4
        const std::uint16_t sum = static_cast<std::uint16_t>(p00) +
                                   static_cast<std::uint16_t>(p01) +
                                   static_cast<std::uint16_t>(p10) +
                                   static_cast<std::uint16_t>(p11);
        return static_cast<Pixel8>((sum + 2) / 4);
    }
}
