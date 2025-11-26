#pragma once
#include "jpegdsp/core/Image.hpp"
#include <vector>
#include <cstdint>
#include <string>
#include <map>

namespace jpegdsp::analysis {

/**
 * @brief Detailed analysis result for web UI visualization
 * 
 * Contains comprehensive statistics about the encoding process
 * for display in dashboards and analysis reports.
 */
struct EncodingAnalysis
{
    // === Basic Metrics ===
    std::size_t originalWidth;
    std::size_t originalHeight;
    std::size_t paddedWidth;
    std::size_t paddedHeight;
    std::size_t originalBytes;
    std::size_t compressedBytes;
    double compressionRatio;
    int quality;
    std::string format;
    
    // === Entropy Analysis ===
    double originalEntropy;        // Shannon entropy of original image
    double compressedEntropy;      // Entropy of JPEG bitstream
    double entropyReduction;       // Percentage reduction in entropy
    
    // === Block Statistics ===
    std::size_t totalBlocks;       // Total number of 8×8 blocks processed
    std::size_t yBlocks;           // Y (luma) blocks
    std::size_t cbBlocks;          // Cb (chroma blue) blocks
    std::size_t crBlocks;          // Cr (chroma red) blocks
    
    // === DCT Coefficient Analysis ===
    double avgDCCoefficient;       // Average DC coefficient magnitude
    double avgACCoefficient;       // Average AC coefficient magnitude
    double dcEnergy;               // Energy in DC coefficients (% of total)
    double acEnergy;               // Energy in AC coefficients (% of total)
    std::vector<double> frequencyBandEnergy;  // Energy in each frequency band (8×8 grid)
    
    // === Quantization Impact ===
    double avgQuantizationError;   // Average quantization error per coefficient
    double peakQuantizationError;  // Peak quantization error
    std::size_t zeroCoefficients;  // Number of coefficients quantized to zero
    double sparsity;               // Percentage of zero coefficients
    
    // === RLE Statistics ===
    std::size_t totalRLESymbols;   // Total RLE symbols generated
    std::size_t zrlCount;          // Zero Run Length (ZRL) symbols
    std::size_t eobCount;          // End of Block (EOB) symbols
    double avgRunLength;           // Average run length of zeros
    
    // === Huffman Coding Statistics ===
    std::size_t huffmanBits;       // Total bits in Huffman-coded data
    double avgCodewordLength;      // Average Huffman codeword length
    std::map<int, int> dcLumaHistogram;   // DC luma value distribution
    std::map<int, int> dcChromaHistogram; // DC chroma value distribution
    
    // === Timing Information ===
    double encodingTimeMs;         // Total encoding time in milliseconds
    double dctTimeMs;              // DCT transform time
    double quantizationTimeMs;     // Quantization time
    double entropyEncodingTimeMs;  // Huffman encoding time
    
    // === Quality Metrics (if reference available) ===
    bool hasQualityMetrics;        // Whether quality metrics are computed
    double psnr;                   // Peak Signal-to-Noise Ratio (dB)
    double mse;                    // Mean Squared Error
    
    // === JPEG Standard Compliance ===
    bool isBaseline;               // Is baseline JPEG (SOF0)
    bool isProgressive;            // Is progressive JPEG (SOF2)
    bool hasRestartMarkers;        // Has restart markers (DRI/RST)
    bool hasEXIF;                  // Has EXIF metadata (APP1)
    std::string chromaSubsampling; // "4:2:0", "4:2:2", or "4:4:4"
    
    // === Marker Information ===
    std::vector<std::string> jpegMarkers;  // List of JPEG markers found
    std::size_t markerOverhead;            // Bytes used for markers/headers
    double markerOverheadPercent;          // Marker overhead as % of file size
    
    /**
     * @brief Serialize to JSON for web API
     */
    std::string toJson() const;
    
    /**
     * @brief Generate HTML report for web UI
     */
    std::string toHtml() const;
};

/**
 * @brief Analyzer for JPEG encoding process
 * 
 * Computes detailed statistics and metrics about the encoding
 * process for visualization and validation.
 */
class JPEGAnalyzer
{
public:
    /**
     * @brief Analyze a JPEG encoding result
     * @param originalImage Original input image
     * @param jpegData Encoded JPEG bitstream
     * @param quality Quality level used
     * @param format Encoding format used
     * @return Comprehensive analysis result
     */
    static EncodingAnalysis analyze(
        const core::Image& originalImage,
        const std::vector<std::uint8_t>& jpegData,
        int quality,
        const std::string& format
    );
    
private:
    static double computeEntropy(const core::Image& img);
    static double computeEntropy(const std::vector<std::uint8_t>& data);
    static std::vector<std::string> parseJPEGMarkers(const std::vector<std::uint8_t>& jpegData);
    static std::size_t countMarkerBytes(const std::vector<std::uint8_t>& jpegData);
};

} // namespace jpegdsp::analysis
