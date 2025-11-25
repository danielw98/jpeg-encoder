#include "jpegdsp/api/JPEGEncoder.hpp"
#include "jpegdsp/core/Image.hpp"
#include "../TestFramework.hpp"
#include <nlohmann/json.hpp>
#include <iostream>
#include <cstdlib>

using namespace jpegdsp;
using namespace jpegdsp::test;

// ---------------------------------------------------------------------
// Test: JSON serialization of encode result
// ---------------------------------------------------------------------
bool test_json_serialization()
{
    // Create small test image (8×8 grayscale)
    core::Image img(8, 8, core::ColorSpace::GRAY, 1);
    
    // Fill with simple gradient
    for (size_t y = 0; y < 8; ++y)
    {
        for (size_t x = 0; x < 8; ++x)
        {
            img.at(x, y, 0) = static_cast<uint8_t>((x + y) * 16);
        }
    }
    
    // Encode with api::JPEGEncoder
    auto result = api::JPEGEncoder::encode(img, 75, api::JPEGEncoder::Format::GRAYSCALE);
    
    // Get JSON representation
    std::string jsonStr = result.toJson();
    
    // Parse JSON back
    nlohmann::json j = nlohmann::json::parse(jsonStr);
    
    // Verify JSON structure and values
    if (j["original_width"] != 8)
    {
        std::cerr << "JSON original_width mismatch\n";
        return false;
    }
    
    if (j["original_height"] != 8)
    {
        std::cerr << "JSON original_height mismatch\n";
        return false;
    }
    
    if (j["padded_width"] != 8)  // Already multiple of 8
    {
        std::cerr << "JSON padded_width mismatch\n";
        return false;
    }
    
    if (j["padded_height"] != 8)
    {
        std::cerr << "JSON padded_height mismatch\n";
        return false;
    }
    
    if (j["original_bytes"] != 64)  // 8×8×1
    {
        std::cerr << "JSON original_bytes mismatch\n";
        return false;
    }
    
    if (j["compressed_bytes"] != result.compressedBytes)
    {
        std::cerr << "JSON compressed_bytes mismatch\n";
        return false;
    }
    
    if (j["compression_ratio"] <= 0.0)
    {
        std::cerr << "JSON compression_ratio should be > 0\n";
        return false;
    }
    
    if (j["quality"] != 75)
    {
        std::cerr << "JSON quality mismatch\n";
        return false;
    }
    
    if (j["format"] != "GRAYSCALE")
    {
        std::cerr << "JSON format mismatch\n";
        return false;
    }
    
    return true;
}

// ---------------------------------------------------------------------
// Test: JSON serialization with color image
// ---------------------------------------------------------------------
bool test_json_color_encoding()
{
    // Create small RGB image (16×16)
    core::Image img(16, 16, core::ColorSpace::RGB, 3);
    
    // Fill with simple pattern
    for (size_t y = 0; y < 16; ++y)
    {
        for (size_t x = 0; x < 16; ++x)
        {
            img.at(x, y, 0) = static_cast<uint8_t>(x * 16);
            img.at(x, y, 1) = static_cast<uint8_t>(y * 16);
            img.at(x, y, 2) = static_cast<uint8_t>((x + y) * 8);
        }
    }
    
    // Encode with COLOR_420 format
    auto result = api::JPEGEncoder::encode(img, 85, api::JPEGEncoder::Format::COLOR_420);
    
    // Get JSON and parse
    nlohmann::json j = nlohmann::json::parse(result.toJson());
    
    // Verify
    if (j["format"] != "COLOR_420")
    {
        std::cerr << "JSON format should be COLOR_420\n";
        return false;
    }
    
    if (j["quality"] != 85)
    {
        std::cerr << "JSON quality mismatch\n";
        return false;
    }
    
    if (j["original_width"] != 16 || j["original_height"] != 16)
    {
        std::cerr << "JSON dimensions mismatch\n";
        return false;
    }
    
    if (j["original_bytes"] != 768)  // 16×16×3
    {
        std::cerr << "JSON original_bytes mismatch (expected 768)\n";
        return false;
    }
    
    return true;
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------
int main()
{
    TestStats stats;
    
    std::cout << "======================================\n";
    std::cout << "JPEG Encoder + JSON API Tests\n";
    std::cout << "======================================\n";
    
    runTest("test_json_serialization", test_json_serialization, stats);
    runTest("test_json_color_encoding", test_json_color_encoding, stats);
    
    std::cout << "======================================\n";
    stats.printSummary("JPEG Encoder API tests");
    return stats.exitCode();
}
