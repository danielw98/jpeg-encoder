#pragma once
#include <cstdint>
#include <vector>
#include "jpegdsp/core/Image.hpp"

namespace jpegdsp::jpeg {

/**
 * JPEGWriter produces baseline sequential JPEG files.
 * Supports grayscale (single-component) and YCbCr 4:2:0 color images.
 */
class JPEGWriter
{
public:
    JPEGWriter() = default;

    /**
     * Encodes a grayscale image to baseline JPEG format.
     * 
     * Automatically pads images to 8x8 block boundaries using edge replication
     * if dimensions are not multiples of 8. The SOF0 marker will contain
     * padded dimensions.
     * 
     * @param img The input image (must be single-channel grayscale)
     * @param quality JPEG quality (1-100, higher = better quality)
     * @return Byte vector containing complete JPEG file
     * @throws std::invalid_argument if image is not grayscale
     */
    std::vector<std::uint8_t> encodeGrayscale(const core::Image& img, int quality = 75);

    /**
     * Encodes an RGB image to YCbCr 4:2:0 baseline JPEG format.
     * 
     * Automatically pads images to 16x16 MCU boundaries using edge replication
     * if dimensions are not multiples of 16. The SOF0 marker will contain
     * padded dimensions.
     * 
     * Converts RGB to YCbCr, downsamples Cb/Cr to half resolution (4:2:0),
     * and encodes with interleaved MCU structure (2×2 Y blocks + 1 Cb + 1 Cr per MCU).
     * 
     * @param img The input image (must be RGB with 3 channels)
     * @param quality JPEG quality (1-100, higher = better quality)
     * @return Byte vector containing complete JPEG file
     * @throws std::invalid_argument if image is not RGB
     */
    std::vector<std::uint8_t> encodeYCbCr(const core::Image& img, int quality = 75);

private:
    std::vector<std::uint8_t> m_buffer;

    void writeMarker(std::uint16_t marker);
    void writeWord(std::uint16_t value);
    void writeByte(std::uint8_t value);
    
    void writeSOI();
    void writeAPP0();
    void writeAPP1(std::uint16_t originalWidth, std::uint16_t originalHeight);
    void writeDQT(const std::uint16_t* quantTable);
    void writeDQT2(const std::uint16_t* lumaTable, const std::uint16_t* chromaTable);
    void writeSOF0(std::uint16_t width, std::uint16_t height);
    void writeSOF0Color(std::uint16_t width, std::uint16_t height);
    void writeDHT(std::uint8_t tableClass, std::uint8_t tableId,
                  const std::uint8_t* bits, const std::uint8_t* values, std::size_t numValues);
    void writeSOS();
    void writeSOSColor();
    void writeEOI();
    
    void writeScanData(const core::Image& img, const std::uint16_t* quantTable);
    void writeScanDataColor(const core::Image& yChannel, const core::Image& cbcrSubsampled,
                             const std::uint16_t* lumaTable, const std::uint16_t* chromaTable);
};

} // namespace jpegdsp::jpeg
