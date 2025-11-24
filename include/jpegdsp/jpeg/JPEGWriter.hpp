#pragma once
#include <cstdint>
#include <vector>
#include "jpegdsp/core/Image.hpp"

namespace jpegdsp::jpeg {

/**
 * JPEGWriter produces baseline sequential JPEG files.
 * Currently supports grayscale (single-component) images only.
 */
class JPEGWriter
{
public:
    JPEGWriter() = default;

    /**
     * Encodes a grayscale image to baseline JPEG format.
     * 
     * @param img The input image (must be single-channel grayscale)
     * @param quality JPEG quality (1-100, higher = better quality)
     * @return Byte vector containing complete JPEG file
     * @throws std::invalid_argument if image is not grayscale or dimensions not multiples of 8
     */
    std::vector<std::uint8_t> encodeGrayscale(const core::Image& img, int quality = 75);

private:
    std::vector<std::uint8_t> m_buffer;

    void writeMarker(std::uint16_t marker);
    void writeWord(std::uint16_t value);
    void writeByte(std::uint8_t value);
    
    void writeSOI();
    void writeAPP0();
    void writeDQT(const std::uint16_t* quantTable);
    void writeSOF0(std::uint16_t width, std::uint16_t height);
    void writeDHT(std::uint8_t tableClass, std::uint8_t tableId,
                  const std::uint8_t* bits, const std::uint8_t* values, std::size_t numValues);
    void writeSOS();
    void writeEOI();
    
    void writeScanData(const core::Image& img, const std::uint16_t* quantTable);
};

} // namespace jpegdsp::jpeg
