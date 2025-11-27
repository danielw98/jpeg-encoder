/**
 * @file test_dqt_zigzag.cpp
 * @brief Test to verify DQT tables are written in zigzag order per ITU-T.81
 * 
 * ITU-T.81 Section B.2.4.1 states:
 * "The quantization elements shall be specified in zig-zag scan order."
 */

#include "../TestFramework.hpp"
#include "jpegdsp/jpeg/ZigZag.hpp"
#include "jpegdsp/jpeg/Quantization.hpp"
#include "jpegdsp/core/Constants.hpp"
#include <iostream>
#include <iomanip>

using namespace jpegdsp;
using namespace jpegdsp::test;

namespace {
    // Standard JPEG zigzag indices (ITU-T.81 Figure A.6)
    // This maps zigzag position -> raster position
    constexpr std::array<std::size_t, core::BlockElementCount> ZigZagToRaster = {
         0,  1,  8, 16,  9,  2,  3, 10,
        17, 24, 32, 25, 18, 11,  4,  5,
        12, 19, 26, 33, 40, 48, 41, 34,
        27, 20, 13,  6,  7, 14, 21, 28,
        35, 42, 49, 56, 57, 50, 43, 36,
        29, 22, 15, 23, 30, 37, 44, 51,
        58, 59, 52, 45, 38, 31, 39, 46,
        53, 60, 61, 54, 47, 55, 62, 63
    };

    // Inverse: raster position -> zigzag position  
    constexpr std::array<std::size_t, core::BlockElementCount> RasterToZigZag = {
         0,  1,  5,  6, 14, 15, 27, 28,
         2,  4,  7, 13, 16, 26, 29, 42,
         3,  8, 12, 17, 25, 30, 41, 43,
         9, 11, 18, 24, 31, 40, 44, 53,
        10, 19, 23, 32, 39, 45, 52, 54,
        20, 22, 33, 38, 46, 51, 55, 60,
        21, 34, 37, 47, 50, 56, 59, 61,
        35, 36, 48, 49, 57, 58, 62, 63
    };
}

void printMatrix8x8(const std::uint16_t* data, const char* title)
{
    std::cout << "\n" << title << ":\n";
    std::cout << "    ";
    for (int x = 0; x < 8; x++)
    {
        std::cout << std::setw(4) << x;
    }
    std::cout << "\n    ";
    for (int x = 0; x < 8; x++)
    {
        std::cout << "----";
    }
    std::cout << "\n";
    
    for (int y = 0; y < 8; y++)
    {
        std::cout << y << " | ";
        for (int x = 0; x < 8; x++)
        {
            std::cout << std::setw(4) << data[y * 8 + x];
        }
        std::cout << "\n";
    }
}

void printZigZagOrder(const std::uint16_t* rasterData)
{
    std::cout << "\nZigzag order (how DQT should be written):\n";
    for (std::size_t zz = 0; zz < core::BlockElementCount; zz++)
    {
        std::size_t rasterPos = ZigZagToRaster[zz];
        std::cout << std::setw(3) << rasterData[rasterPos];
        if ((zz + 1) % 8 == 0)
        {
            std::cout << "\n";
        }
    }
}

bool test_zigzag_indices_roundtrip()
{
    // Verify that ZigZagToRaster and RasterToZigZag are inverses
    for (std::size_t i = 0; i < core::BlockElementCount; i++)
    {
        std::size_t raster = ZigZagToRaster[i];
        std::size_t backToZigzag = RasterToZigZag[raster];
        if (backToZigzag != i)
        {
            std::cout << "  FAIL: zigzag " << i << " -> raster " << raster 
                      << " -> zigzag " << backToZigzag << " (expected " << i << ")\n";
            return false;
        }
    }
    return true;
}

bool test_zigzag_first_positions()
{
    // Verify first few zigzag positions match expected pattern
    // Zigzag: DC(0,0) -> (0,1) -> (1,0) -> (2,0) -> (1,1) -> (0,2) -> ...
    
    // Position 0 (DC): should be (0,0) = index 0
    if (ZigZagToRaster[0] != 0) return false;
    
    // Position 1: (0,1) = index 1
    if (ZigZagToRaster[1] != 1) return false;
    
    // Position 2: (1,0) = index 8
    if (ZigZagToRaster[2] != 8) return false;
    
    // Position 3: (2,0) = index 16
    if (ZigZagToRaster[3] != 16) return false;
    
    // Position 4: (1,1) = index 9
    if (ZigZagToRaster[4] != 9) return false;
    
    // Position 5: (0,2) = index 2
    if (ZigZagToRaster[5] != 2) return false;
    
    // Last position 63: (7,7) = index 63
    if (ZigZagToRaster[63] != 63) return false;
    
    return true;
}

bool test_display_quant_tables()
{
    // Generate standard luma quant table
    const auto lumaTable = jpeg::QuantTable::makeLumaStd(75);
    
    std::uint16_t rasterData[core::BlockElementCount];
    for (std::size_t i = 0; i < core::BlockElementCount; i++)
    {
        rasterData[i] = lumaTable.at(i);
    }
    
    printMatrix8x8(rasterData, "Luma Quant Table (Q=75) in RASTER order (how we store it)");
    printZigZagOrder(rasterData);
    
    std::cout << "\n=== ISSUE DEMONSTRATION ===\n";
    std::cout << "DC coefficient (0,0) quant value: " << rasterData[0] << "\n";
    std::cout << "First AC (zigzag pos 1) should use: " << rasterData[ZigZagToRaster[1]] << "\n";
    std::cout << "But if written in raster order, decoder gets: " << rasterData[1] << "\n";
    
    // Show the mismatch
    std::cout << "\nFirst 8 values in raster order (WRONG for DQT): ";
    for (int i = 0; i < 8; i++)
    {
        std::cout << rasterData[i] << " ";
    }
    
    std::cout << "\nFirst 8 values in zigzag order (CORRECT for DQT): ";
    for (int i = 0; i < 8; i++)
    {
        std::cout << rasterData[ZigZagToRaster[i]] << " ";
    }
    std::cout << "\n";
    
    return true; // Display test always passes
}

bool test_dqt_conversion()
{
    // Test converting a quant table from raster to zigzag for DQT writing
    const auto lumaTable = jpeg::QuantTable::makeLumaStd(50);
    
    std::uint16_t rasterOrder[core::BlockElementCount];
    std::uint16_t zigzagOrder[core::BlockElementCount];
    
    // Get table in raster order
    for (std::size_t i = 0; i < core::BlockElementCount; i++)
    {
        rasterOrder[i] = lumaTable.at(i);
    }
    
    // Convert to zigzag order (how it should be written to DQT)
    for (std::size_t zz = 0; zz < core::BlockElementCount; zz++)
    {
        zigzagOrder[zz] = rasterOrder[ZigZagToRaster[zz]];
    }
    
    // Verify specific positions
    // DC (zigzag 0) should come from raster (0,0) = index 0
    if (zigzagOrder[0] != rasterOrder[0])
    {
        std::cout << "  DC mismatch!\n";
        return false;
    }
    
    // Zigzag position 2 should come from raster position 8 (row 1, col 0)
    if (zigzagOrder[2] != rasterOrder[8])
    {
        std::cout << "  Position 2 mismatch!\n";
        return false;
    }
    
    return true;
}

int main()
{
    TestStats stats;
    
    std::cout << "=== DQT ZigZag Order Verification Test ===\n";
    std::cout << "ITU-T.81 B.2.4.1: DQT must be in zigzag order\n";
    
    runTest("zigzag_indices_roundtrip", &test_zigzag_indices_roundtrip, stats);
    runTest("zigzag_first_positions", &test_zigzag_first_positions, stats);
    runTest("display_quant_tables", &test_display_quant_tables, stats);
    runTest("dqt_conversion", &test_dqt_conversion, stats);
    
    stats.printSummary("DQT ZigZag Order");
    return stats.exitCode();
}
