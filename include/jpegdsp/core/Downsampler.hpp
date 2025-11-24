/**
 * @file Downsampler.hpp
 * @brief Chroma downsampling for YCbCr 4:2:0 JPEG encoding
 * 
 * Provides 2×2 averaging to reduce Cb/Cr resolution for 4:2:0 subsampling,
 * halving both width and height of chroma channels.
 */

#ifndef JPEGDSP_CORE_DOWNSAMPLER_HPP
#define JPEGDSP_CORE_DOWNSAMPLER_HPP

#include "Image.hpp"

namespace jpegdsp::core
{
    /**
     * @class Downsampler
     * @brief Chroma subsampling for YCbCr 4:2:0 encoding
     * 
     * Implements 2×2 averaging to reduce Cb/Cr resolution by half in both
     * dimensions, supporting JPEG 4:2:0 chroma subsampling. Input dimensions
     * must be multiples of 16 (2 MCUs of 8×8 blocks).
     */
    class Downsampler
    {
    public:
        /**
         * @brief Downsample Cb/Cr channels from 4:4:4 to 4:2:0
         * 
         * Reduces chroma resolution by 2× in both dimensions using 2×2 averaging.
         * Input images must have width/height as multiples of 16.
         * 
         * @param cb Input Cb channel (full resolution, ColorSpace::GRAY)
         * @param cr Input Cr channel (full resolution, ColorSpace::GRAY)
         * @return Image Interleaved Cb/Cr at half resolution (width/2, height/2, 2 channels)
         * @throws std::invalid_argument if dimensions not multiples of 16 or images different sizes
         * 
         * @example
         * // Given Y, Cb, Cr all 32×32
         * Downsampler downsampler;
         * Image cbcrSubsampled = downsampler.downsample420(cb, cr); // Returns 16×16×2
         */
        Image downsample420(const Image& cb, const Image& cr) const;

    private:
        /**
         * @brief Compute 2×2 average of 4 pixels
         * @param p00 Top-left pixel
         * @param p01 Top-right pixel
         * @param p10 Bottom-left pixel
         * @param p11 Bottom-right pixel
         * @return Averaged pixel value (rounded)
         */
        static Pixel8 average2x2(Pixel8 p00, Pixel8 p01, Pixel8 p10, Pixel8 p11) noexcept;
    };
}

#endif // JPEGDSP_CORE_DOWNSAMPLER_HPP
