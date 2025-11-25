/**
 * @file JPEGConstants.hpp
 * @brief Centralized constants for JPEG encoding (ITU-T.81 standard)
 * 
 * This header defines all JPEG markers, segment lengths, and encoding
 * parameters as named constants. Replaces magic numbers scattered throughout
 * the codebase for better maintainability and clarity.
 * 
 * References:
 * - ITU-T.81 (JPEG Standard): https://www.w3.org/Graphics/JPEG/itu-t81.pdf
 * - Section B.1: Marker assignments
 * - Annex K.3: Huffman table specifications
 */

#pragma once
#include <cstddef>
#include <cstdint>

namespace jpegdsp::jpeg
{
    // ========================================================================
    // JPEG Markers (ITU-T.81 Table B.1)
    // ========================================================================
    // All JPEG markers start with 0xFF followed by a type byte.
    // These are used to delimit segments in the JPEG bitstream.
    
    /// Start of Image - First marker in every JPEG file
    inline constexpr std::uint16_t MARKER_SOI  = 0xFFD8;
    
    /// End of Image - Final marker in every JPEG file
    inline constexpr std::uint16_t MARKER_EOI  = 0xFFD9;
    
    /// Application Segment 0 - Contains JFIF header
    inline constexpr std::uint16_t MARKER_APP0 = 0xFFE0;
    
    /// Define Quantization Table - Specifies quantization matrices
    inline constexpr std::uint16_t MARKER_DQT  = 0xFFDB;
    
    /// Start of Frame (Baseline DCT) - Image dimensions and components
    inline constexpr std::uint16_t MARKER_SOF0 = 0xFFC0;
    
    /// Define Huffman Table - Specifies Huffman coding tables
    inline constexpr std::uint16_t MARKER_DHT  = 0xFFC4;
    
    /// Start of Scan - Begins entropy-coded data
    inline constexpr std::uint16_t MARKER_SOS  = 0xFFDA;
    
    // Additional markers (not yet used, but defined for completeness)
    inline constexpr std::uint16_t MARKER_DRI  = 0xFFDD;  // Define Restart Interval
    inline constexpr std::uint16_t MARKER_RST0 = 0xFFD0;  // Restart marker 0
    inline constexpr std::uint16_t MARKER_RST7 = 0xFFD7;  // Restart marker 7
    
    
    // ========================================================================
    // JPEG Segment Lengths (in bytes, including 2-byte length field)
    // ========================================================================
    
    /// APP0 (JFIF) segment length: 2 (length) + 5 (JFIF\0) + 9 (version, density, thumbnail)
    inline constexpr std::uint16_t APP0_LENGTH = 16;
    
    /// DQT segment length for single 8-bit table: 2 (length) + 1 (table ID) + 64 (data)
    inline constexpr std::uint16_t DQT_LENGTH_8BIT = 67;
    
    /// DHT base segment length: 2 (length) + 1 (table class/ID) + 16 (bit lengths)
    /// Actual length = DHT_BASE_LENGTH + number of Huffman values
    inline constexpr std::uint16_t DHT_BASE_LENGTH = 19;
    
    /// SOF0 base segment length: 2 (length) + 1 (precision) + 2 (height) + 2 (width) + 1 (components)
    /// Actual length = SOF0_BASE_LENGTH + 3 * numComponents
    inline constexpr std::uint16_t SOF0_BASE_LENGTH = 8;
    
    /// SOS base segment length: 2 (length) + 1 (numComponents)
    /// Actual length = SOS_BASE_LENGTH + 2 * numComponents + 3 (spectral selection)
    inline constexpr std::uint16_t SOS_BASE_LENGTH = 6;
    
    
    // ========================================================================
    // Chroma Subsampling Factors
    // ========================================================================
    // These define how chroma (Cb/Cr) components are subsampled relative
    // to luma (Y) in YCbCr color encoding.
    
    /// 4:4:4 - No subsampling (full resolution chroma)
    inline constexpr std::size_t SUBSAMPLE_NONE = 1;
    
    /// 4:2:2 - Horizontal subsampling only (half width chroma)
    inline constexpr std::size_t SUBSAMPLE_HORIZONTAL = 2;
    
    /// 4:2:0 - Both directions subsampled (half width, half height chroma)
    inline constexpr std::size_t SUBSAMPLE_BOTH = 2;
    
    
    // ========================================================================
    // Huffman Table Identifiers (ITU-T.81 Annex C)
    // ========================================================================
    
    /// DC Huffman table class
    inline constexpr int HUFFMAN_CLASS_DC = 0;
    
    /// AC Huffman table class
    inline constexpr int HUFFMAN_CLASS_AC = 1;
    
    /// Luma (Y) component table destination
    inline constexpr int HUFFMAN_DEST_LUMA = 0;
    
    /// Chroma (Cb/Cr) component table destination
    inline constexpr int HUFFMAN_DEST_CHROMA = 1;
    
    
    // ========================================================================
    // Component Identifiers (ITU-T.81 Annex B.2.2)
    // ========================================================================
    
    /// Y (luma) component ID
    inline constexpr std::uint8_t COMPONENT_Y  = 1;
    
    /// Cb (blue-difference chroma) component ID
    inline constexpr std::uint8_t COMPONENT_CB = 2;
    
    /// Cr (red-difference chroma) component ID
    inline constexpr std::uint8_t COMPONENT_CR = 3;
    
    
    // ========================================================================
    // Sampling Factors (for SOF0 marker)
    // ========================================================================
    // Format: Hi * 16 + Vi (horizontal and vertical sampling factors)
    
    /// 2×2 sampling (used for Y in 4:2:0)
    inline constexpr std::uint8_t SAMPLING_2x2 = 0x22;
    
    /// 2×1 sampling (used for Y in 4:2:2)
    inline constexpr std::uint8_t SAMPLING_2x1 = 0x21;
    
    /// 1×1 sampling (used for Cb/Cr in 4:2:0/4:2:2, and all in 4:4:4)
    inline constexpr std::uint8_t SAMPLING_1x1 = 0x11;
    
    
    // ========================================================================
    // Miscellaneous JPEG Constants
    // ========================================================================
    
    /// JPEG baseline precision (8 bits per sample)
    inline constexpr std::uint8_t PRECISION = 8;
    
    /// JFIF version (1.01)
    inline constexpr std::uint8_t JFIF_VERSION_MAJOR = 1;
    inline constexpr std::uint8_t JFIF_VERSION_MINOR = 1;
    
    /// Density units: 0 = no units (aspect ratio only)
    inline constexpr std::uint8_t DENSITY_NONE = 0;
    
    /// Density units: 1 = dots per inch
    inline constexpr std::uint8_t DENSITY_DPI = 1;
    
    /// Density units: 2 = dots per cm
    inline constexpr std::uint8_t DENSITY_DPCM = 2;
    
    /// Default X/Y density (1:1 aspect ratio)
    inline constexpr std::uint16_t DEFAULT_DENSITY = 1;
    
    /// Byte stuffing marker (inserted after 0xFF in entropy-coded data)
    inline constexpr std::uint8_t STUFF_BYTE = 0x00;
    
    
    // ========================================================================
    // MCU (Minimum Coded Unit) Sizes
    // ========================================================================
    // MCU size depends on chroma subsampling mode and block size
    
    /// MCU width for 4:4:4 (1 block)
    inline constexpr std::size_t MCU_WIDTH_444 = 8;
    
    /// MCU width for 4:2:2 (2 blocks horizontally)
    inline constexpr std::size_t MCU_WIDTH_422 = 16;
    
    /// MCU width for 4:2:0 (2 blocks horizontally)
    inline constexpr std::size_t MCU_WIDTH_420 = 16;
    
    /// MCU height for 4:4:4 (1 block)
    inline constexpr std::size_t MCU_HEIGHT_444 = 8;
    
    /// MCU height for 4:2:2 (1 block vertically)
    inline constexpr std::size_t MCU_HEIGHT_422 = 8;
    
    /// MCU height for 4:2:0 (2 blocks vertically)
    inline constexpr std::size_t MCU_HEIGHT_420 = 16;
    
} // namespace jpegdsp::jpeg
