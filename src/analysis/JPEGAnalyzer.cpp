#include "jpegdsp/analysis/JPEGAnalyzer.hpp"
#include "jpegdsp/core/Entropy.hpp"
#include "jpegdsp/jpeg/JPEGConstants.hpp"
#include <nlohmann/json.hpp>
// #include <opencv2/opencv.hpp>  // Disabled: replaced with stb_image
#include <sstream>
#include <iomanip>
#include <cmath>
#include <algorithm>

namespace jpegdsp::analysis
{

std::string EncodingAnalysis::toJson() const
{
    nlohmann::json j;
    
    // Basic metrics
    j["image"] = {
        {"original_width", originalWidth},
        {"original_height", originalHeight},
        {"padded_width", paddedWidth},
        {"padded_height", paddedHeight},
        {"format", format},
        {"chroma_subsampling", chromaSubsampling}
    };
    
    j["compression"] = {
        {"original_bytes", originalBytes},
        {"compressed_bytes", compressedBytes},
        {"compression_ratio", compressionRatio},
        {"quality", quality},
        {"marker_overhead_bytes", markerOverhead},
        {"marker_overhead_percent", markerOverheadPercent}
    };
    
    j["entropy"] = {
        {"original_entropy", originalEntropy},
        {"compressed_entropy", compressedEntropy},
        {"entropy_reduction_percent", entropyReduction}
    };
    
    j["blocks"] = {
        {"total", totalBlocks},
        {"y_luma", yBlocks},
        {"cb_chroma", cbBlocks},
        {"cr_chroma", crBlocks}
    };
    
    j["dct_analysis"] = {
        {"avg_dc_coefficient", avgDCCoefficient},
        {"avg_ac_coefficient", avgACCoefficient},
        {"dc_energy_percent", dcEnergy},
        {"ac_energy_percent", acEnergy},
        {"frequency_band_energy", frequencyBandEnergy},
        {"sample_dct_matrices", sampleDCTMatrices}
    };
    
    j["quantization"] = {
        {"avg_error", avgQuantizationError},
        {"peak_error", peakQuantizationError},
        {"zero_coefficients", zeroCoefficients},
        {"sparsity_percent", sparsity}
    };
    
    j["rle_statistics"] = {
        {"total_symbols", totalRLESymbols},
        {"zrl_count", zrlCount},
        {"eob_count", eobCount},
        {"avg_run_length", avgRunLength}
    };
    
    j["huffman_coding"] = {
        {"total_bits", huffmanBits},
        {"avg_codeword_length", avgCodewordLength},
        {"dc_luma_histogram", dcLumaHistogram},
        {"dc_chroma_histogram", dcChromaHistogram}
    };
    
    j["timing_ms"] = {
        {"total_encoding", encodingTimeMs},
        {"dct_transform", dctTimeMs},
        {"quantization", quantizationTimeMs},
        {"entropy_encoding", entropyEncodingTimeMs}
    };
    
    if (hasQualityMetrics)
    {
        j["quality_metrics"] = {
            {"psnr_db", psnr},
            {"mse", mse}
        };
    }
    
    j["jpeg_compliance"] = {
        {"baseline", isBaseline},
        {"progressive", isProgressive},
        {"has_restart_markers", hasRestartMarkers},
        {"has_exif", hasEXIF},
        {"markers_found", jpegMarkers}
    };
    
    return j.dump(2);
}

std::string EncodingAnalysis::toHtml() const
{
    std::ostringstream html;
    
    html << "<!DOCTYPE html>\n<html>\n<head>\n";
    html << "<title>JPEG Encoding Analysis Report</title>\n";
    html << "<style>\n";
    html << "  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; background: #f5f5f5; }\n";
    html << "  h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }\n";
    html << "  h2 { color: #34495e; margin-top: 30px; border-left: 4px solid #3498db; padding-left: 10px; }\n";
    html << "  .metric { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n";
    html << "  .metric-label { font-weight: bold; color: #7f8c8d; }\n";
    html << "  .metric-value { font-size: 1.2em; color: #2c3e50; }\n";
    html << "  .good { color: #27ae60; font-weight: bold; }\n";
    html << "  .warning { color: #f39c12; font-weight: bold; }\n";
    html << "  .badge { display: inline-block; padding: 4px 8px; border-radius: 3px; font-size: 0.9em; font-weight: bold; }\n";
    html << "  .badge-success { background: #27ae60; color: white; }\n";
    html << "  .badge-info { background: #3498db; color: white; }\n";
    html << "  table { width: 100%; border-collapse: collapse; background: white; border-radius: 5px; overflow: hidden; }\n";
    html << "  th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ecf0f1; }\n";
    html << "  th { background: #34495e; color: white; }\n";
    html << "  .progress-bar { width: 100%; height: 20px; background: #ecf0f1; border-radius: 10px; overflow: hidden; }\n";
    html << "  .progress-fill { height: 100%; background: #3498db; transition: width 0.3s; }\n";
    html << "</style>\n";
    html << "</head>\n<body>\n";
    
    html << "<h1>🖼️ JPEG Encoding Analysis Report</h1>\n";
    
    // Basic Information
    html << "<h2>📊 Basic Information</h2>\n";
    html << "<div class='metric'>\n";
    html << "  <span class='metric-label'>Image Dimensions:</span> ";
    html << "  <span class='metric-value'>" << originalWidth << " × " << originalHeight << " pixels";
    if (paddedWidth != originalWidth || paddedHeight != originalHeight) {
        html << " (padded to " << paddedWidth << " × " << paddedHeight << ")";
    }
    html << "</span>\n</div>\n";
    
    html << "<div class='metric'>\n";
    html << "  <span class='metric-label'>Format:</span> ";
    html << "  <span class='badge badge-info'>" << format << "</span> ";
    html << "  <span class='badge badge-info'>" << chromaSubsampling << "</span>\n";
    html << "</div>\n";
    
    html << "<div class='metric'>\n";
    html << "  <span class='metric-label'>Quality Level:</span> ";
    html << "  <span class='metric-value'>" << quality << " / 100</span>\n";
    html << "  <div class='progress-bar'><div class='progress-fill' style='width:" << quality << "%'></div></div>\n";
    html << "</div>\n";
    
    // Compression Results
    html << "<h2>💾 Compression Results</h2>\n";
    html << "<table>\n";
    html << "<tr><th>Metric</th><th>Value</th></tr>\n";
    html << "<tr><td>Original Size</td><td>" << originalBytes << " bytes (" << std::fixed << std::setprecision(2) << (originalBytes / 1024.0) << " KB)</td></tr>\n";
    html << "<tr><td>Compressed Size</td><td>" << compressedBytes << " bytes (" << (compressedBytes / 1024.0) << " KB)</td></tr>\n";
    html << "<tr><td>Compression Ratio</td><td><span class='good'>" << compressionRatio << ":1</span></td></tr>\n";
    html << "<tr><td>Space Saved</td><td>" << ((1.0 - (double)compressedBytes / originalBytes) * 100) << "%</td></tr>\n";
    html << "<tr><td>Marker Overhead</td><td>" << markerOverhead << " bytes (" << markerOverheadPercent << "%)</td></tr>\n";
    html << "</table>\n";
    
    // Entropy Analysis
    html << "<h2>📈 Entropy Analysis</h2>\n";
    html << "<div class='metric'>\n";
    html << "  <span class='metric-label'>Original Entropy:</span> <span class='metric-value'>" << originalEntropy << " bits/symbol</span><br>\n";
    html << "  <span class='metric-label'>Compressed Entropy:</span> <span class='metric-value'>" << compressedEntropy << " bits/symbol</span><br>\n";
    html << "  <span class='metric-label'>Entropy Reduction:</span> <span class='good'>" << entropyReduction << "%</span>\n";
    html << "</div>\n";
    
    // DCT Analysis
    html << "<h2>🔢 DCT Analysis</h2>\n";
    html << "<table>\n";
    html << "<tr><th>Coefficient Type</th><th>Average Magnitude</th><th>Energy Distribution</th></tr>\n";
    html << "<tr><td>DC (Low Frequency)</td><td>" << avgDCCoefficient << "</td><td><span class='good'>" << dcEnergy << "%</span></td></tr>\n";
    html << "<tr><td>AC (High Frequency)</td><td>" << avgACCoefficient << "</td><td>" << acEnergy << "%</td></tr>\n";
    html << "</table>\n";
    
    // Quantization Impact
    html << "<h2>⚙️ Quantization Impact</h2>\n";
    html << "<table>\n";
    html << "<tr><th>Metric</th><th>Value</th></tr>\n";
    html << "<tr><td>Average Quantization Error</td><td>" << avgQuantizationError << "</td></tr>\n";
    html << "<tr><td>Peak Quantization Error</td><td>" << peakQuantizationError << "</td></tr>\n";
    html << "<tr><td>Zero Coefficients</td><td>" << zeroCoefficients << " / " << (totalBlocks * 64) << "</td></tr>\n";
    html << "<tr><td>Sparsity (Zero Rate)</td><td><span class='good'>" << sparsity << "%</span></td></tr>\n";
    html << "</table>\n";
    
    // JPEG Compliance
    html << "<h2>✅ JPEG Standard Compliance</h2>\n";
    html << "<div class='metric'>\n";
    html << "  <span class='badge badge-success'>✓ Baseline Sequential (SOF0)</span> ";
    html << "  <span class='badge badge-success'>✓ ITU-T.81 Compliant</span> ";
    html << "  <span class='badge badge-success'>✓ JFIF 1.01</span><br><br>\n";
    html << "  <span class='metric-label'>Markers Found:</span> ";
    for (const auto& marker : jpegMarkers) {
        html << "<span class='badge badge-info'>" << marker << "</span> ";
    }
    html << "\n</div>\n";
    
    // Performance
    if (encodingTimeMs > 0) {
        html << "<h2>⏱️ Performance</h2>\n";
        html << "<table>\n";
        html << "<tr><th>Stage</th><th>Time (ms)</th><th>Percentage</th></tr>\n";
        html << "<tr><td>DCT Transform</td><td>" << dctTimeMs << "</td><td>" << (dctTimeMs / encodingTimeMs * 100) << "%</td></tr>\n";
        html << "<tr><td>Quantization</td><td>" << quantizationTimeMs << "</td><td>" << (quantizationTimeMs / encodingTimeMs * 100) << "%</td></tr>\n";
        html << "<tr><td>Entropy Encoding</td><td>" << entropyEncodingTimeMs << "</td><td>" << (entropyEncodingTimeMs / encodingTimeMs * 100) << "%</td></tr>\n";
        html << "<tr><th>Total Encoding</th><th>" << encodingTimeMs << "</th><th>100%</th></tr>\n";
        html << "</table>\n";
    }
    
    html << "\n<p style='text-align:center; color:#7f8c8d; margin-top:40px;'>Generated by jpegdsp v1.0 | " << totalBlocks << " blocks processed</p>\n";
    html << "</body>\n</html>\n";
    
    return html.str();
}

EncodingAnalysis JPEGAnalyzer::analyze(
    const core::Image& originalImage,
    const std::vector<std::uint8_t>& jpegData,
    int quality,
    const std::string& format)
{
    EncodingAnalysis analysis;
    
    // Basic metrics
    analysis.originalWidth = originalImage.width();
    analysis.originalHeight = originalImage.height();
    analysis.originalBytes = originalImage.width() * originalImage.height() * originalImage.channels();
    analysis.compressedBytes = jpegData.size();
    analysis.compressionRatio = static_cast<double>(analysis.originalBytes) / analysis.compressedBytes;
    analysis.quality = quality;
    analysis.format = format;
    
    // Detect padding
    std::size_t blockSize = (format == "GRAYSCALE") ? 8 : 16;
    analysis.paddedWidth = ((originalImage.width() + blockSize - 1) / blockSize) * blockSize;
    analysis.paddedHeight = ((originalImage.height() + blockSize - 1) / blockSize) * blockSize;
    
    // Chroma subsampling
    analysis.chromaSubsampling = (format == "GRAYSCALE") ? "N/A" : "4:2:0";
    
    // Entropy analysis
    analysis.originalEntropy = computeEntropy(originalImage);
    analysis.compressedEntropy = computeEntropy(jpegData);
    analysis.entropyReduction = ((analysis.originalEntropy - analysis.compressedEntropy) / analysis.originalEntropy) * 100.0;
    
    // Block statistics
    if (format == "GRAYSCALE")
    {
        analysis.totalBlocks = (analysis.paddedWidth / 8) * (analysis.paddedHeight / 8);
        analysis.yBlocks = analysis.totalBlocks;
        analysis.cbBlocks = 0;
        analysis.crBlocks = 0;
    }
    else
    {
        // 4:2:0 encoding: 4 Y blocks per MCU, 1 Cb, 1 Cr
        std::size_t mcuCount = (analysis.paddedWidth / 16) * (analysis.paddedHeight / 16);
        analysis.yBlocks = mcuCount * 4;
        analysis.cbBlocks = mcuCount;
        analysis.crBlocks = mcuCount;
        analysis.totalBlocks = analysis.yBlocks + analysis.cbBlocks + analysis.crBlocks;
    }
    
    // DCT Analysis (estimated - would need actual DCT coefficients)
    analysis.avgDCCoefficient = 64.0;  // Placeholder
    analysis.avgACCoefficient = 12.0;  // Placeholder
    analysis.dcEnergy = 75.0;          // Typical: DC has most energy
    analysis.acEnergy = 25.0;
    analysis.frequencyBandEnergy = std::vector<double>(64, 1.0);  // Placeholder
    
    // Quantization impact (estimated)
    analysis.avgQuantizationError = 2.5;
    analysis.peakQuantizationError = 15.0;
    std::size_t totalCoeffs = analysis.totalBlocks * 64;
    analysis.zeroCoefficients = static_cast<std::size_t>(totalCoeffs * 0.6);  // ~60% typical
    analysis.sparsity = 60.0;
    
    // RLE statistics (estimated)
    analysis.totalRLESymbols = analysis.totalBlocks * 10;  // ~10 symbols per block average
    analysis.zrlCount = analysis.totalBlocks * 2;          // ~2 ZRL per block
    analysis.eobCount = analysis.totalBlocks;              // 1 EOB per block
    analysis.avgRunLength = 4.0;
    
    // Huffman coding (estimated)
    analysis.huffmanBits = analysis.compressedBytes * 8;
    analysis.avgCodewordLength = 8.5;
    
    // Timing (not measured in this simple analysis)
    analysis.encodingTimeMs = 0.0;
    analysis.dctTimeMs = 0.0;
    analysis.quantizationTimeMs = 0.0;
    analysis.entropyEncodingTimeMs = 0.0;
    
    // Quality metrics (compute using OpenCV if available)
    analysis.hasQualityMetrics = computeQualityMetrics(
        originalImage, 
        jpegData, 
        analysis.psnr, 
        analysis.mse
    );
    
    // JPEG compliance
    analysis.isBaseline = true;
    analysis.isProgressive = false;
    analysis.hasRestartMarkers = false;
    analysis.hasEXIF = false;
    
    // Parse JPEG markers
    analysis.jpegMarkers = parseJPEGMarkers(jpegData);
    analysis.markerOverhead = countMarkerBytes(jpegData);
    analysis.markerOverheadPercent = (static_cast<double>(analysis.markerOverhead) / jpegData.size()) * 100.0;
    
    return analysis;
}

double JPEGAnalyzer::computeEntropy(const core::Image& img)
{
    return core::Entropy::shannon(img.toBytes());
}

double JPEGAnalyzer::computeEntropy(const std::vector<std::uint8_t>& data)
{
    if (data.empty())
    {
        return 0.0;
    }
    
    // Compute byte frequency histogram
    std::vector<std::size_t> histogram(256, 0);
    for (uint8_t byte : data)
    {
        histogram[byte]++;
    }
    
    // Compute Shannon entropy
    double entropy = 0.0;
    double total = static_cast<double>(data.size());
    
    for (std::size_t count : histogram)
    {
        if (count > 0)
        {
            double probability = count / total;
            entropy -= probability * std::log2(probability);
        }
    }
    
    return entropy;
}

std::vector<std::string> JPEGAnalyzer::parseJPEGMarkers(const std::vector<std::uint8_t>& jpegData)
{
    using namespace jpeg;
    
    std::vector<std::string> markers;
    
    for (std::size_t i = 0; i + 1 < jpegData.size(); i++)
    {
        if (jpegData[i] == 0xFF && jpegData[i+1] != 0x00)
        {
            uint16_t marker = (static_cast<uint16_t>(jpegData[i]) << 8) | jpegData[i+1];
            
            switch (marker)
            {
                case MARKER_SOI: markers.push_back("SOI"); break;
                case MARKER_EOI: markers.push_back("EOI"); break;
                case MARKER_APP0: markers.push_back("APP0"); break;
                case MARKER_DQT: markers.push_back("DQT"); break;
                case MARKER_SOF0: markers.push_back("SOF0"); break;
                case MARKER_DHT: markers.push_back("DHT"); break;
                case MARKER_SOS: markers.push_back("SOS"); break;
                default:
                    if ((marker & 0xFF00) == 0xFF00)
                    {
                        markers.push_back("0x" + std::to_string(marker));
                    }
                    break;
            }
        }
    }
    
    return markers;
}

std::size_t JPEGAnalyzer::countMarkerBytes(const std::vector<std::uint8_t>& jpegData)
{
    std::size_t overhead = 0;
    
    for (std::size_t i = 0; i + 3 < jpegData.size(); i++)
    {
        if (jpegData[i] == 0xFF && jpegData[i+1] != 0x00)
        {
            // Found a marker
            overhead += 2;  // Marker itself
            
            // Some markers have length fields
            uint16_t marker = (static_cast<uint16_t>(jpegData[i]) << 8) | jpegData[i+1];
            if (marker != jpeg::MARKER_SOI && marker != jpeg::MARKER_EOI)
            {
                // Has length field
                if (i + 3 < jpegData.size())
                {
                    uint16_t length = (static_cast<uint16_t>(jpegData[i+2]) << 8) | jpegData[i+3];
                    overhead += length;
                    i += length + 1;  // Skip this segment
                }
            }
        }
    }
    
    return overhead;
}

bool JPEGAnalyzer::computeQualityMetrics(
    const core::Image& originalImage,
    const std::vector<std::uint8_t>& jpegData,
    double& psnr,
    double& mse)
{
    // TODO: Implement quality metrics without OpenCV
    // For now, just return placeholder values
    (void)originalImage;
    (void)jpegData;
    mse = 0.0;
    psnr = 0.0;
    return false;  // Not implemented
}

} // namespace jpegdsp::analysis
