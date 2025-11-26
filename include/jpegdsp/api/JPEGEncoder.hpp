#pragma once
#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/analysis/JPEGAnalyzer.hpp"
#include <vector>
#include <cstdint>
#include <string>
#include <optional>

namespace jpegdsp::api {

/**
 * @brief High-level JPEG encoding API
 * 
 * Simplified interface for JPEG encoding that handles all complexity internally:
 * - Automatic image padding to required dimensions
 * - Color space conversion
 * - Chroma subsampling
 * 
 * This API is designed for CLI tools and web applications.
 */
class JPEGEncoder
{
public:
    /**
     * @brief Encoding format options
     */
    enum class Format
    {
        GRAYSCALE,      // Single-channel, no color
        COLOR_420       // YCbCr with 4:2:0 chroma subsampling
    };
    
    /**
     * @brief Encoding result with metadata
     */
    struct EncodeResult
    {
        std::vector<std::uint8_t> jpegData;     // Compressed JPEG bitstream
        std::size_t originalWidth;              // Original image width
        std::size_t originalHeight;             // Original image height
        std::size_t paddedWidth;                // Padded width (multiple of 8 or 16)
        std::size_t paddedHeight;               // Padded height (multiple of 8 or 16)
        std::size_t originalBytes;              // Uncompressed size
        std::size_t compressedBytes;            // JPEG size
        double compressionRatio;                // originalBytes / compressedBytes
        Format format;                          // Encoding format used
        int quality;                            // Quality level [1-100]
        
        // Optional detailed analysis (only populated if analyze=true)
        std::optional<analysis::EncodingAnalysis> analysis;
        
        std::string toString() const;
        std::string toJson(bool includeAnalysis = false) const;  // JSON serialization for CLI/web
    };
    
    /**
     * @brief Encode image to JPEG
     * @param img Source image (any size, will be padded automatically)
     * @param quality Quality level [1-100], higher = better quality
     * @param format Output format (grayscale or color)
     * @param analyze If true, perform detailed analysis and populate EncodeResult::analysis
     * @return Encoding result with JPEG data and metadata
     * @throws std::invalid_argument if image is invalid
     */
    static EncodeResult encode(
        const core::Image& img,
        int quality = 75,
        Format format = Format::COLOR_420,
        bool analyze = false
    );
    
    /**
     * @brief Encode and save JPEG to file
     * @param img Source image
     * @param filename Output filename
     * @param quality Quality level [1-100]
     * @param format Output format
     * @param analyze If true, perform detailed analysis
     * @return Encoding result
     * @throws std::runtime_error if file cannot be written
     */
    static EncodeResult encodeToFile(
        const core::Image& img,
        const std::string& filename,
        int quality = 75,
        Format format = Format::COLOR_420,
        bool analyze = false
    );
    
private:
    static Format autoDetectFormat(const core::Image& img);
};

} // namespace jpegdsp::api
