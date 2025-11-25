/**
 * @file HuffmanTables.hpp
 * @brief Standard JPEG Huffman table specifications (ITU-T.81 Annex K.3)
 * 
 * This header defines the canonical Huffman tables used for baseline JPEG
 * entropy encoding. These tables are specified in ITU-T.81 Annex K.3 and
 * are used by virtually all JPEG encoders for compatibility.
 * 
 * Four standard tables are provided:
 * - DC Luminance (Y component)
 * - AC Luminance (Y component)
 * - DC Chrominance (Cb/Cr components)
 * - AC Chrominance (Cb/Cr components)
 * 
 * Each table consists of two parts:
 * 1. Bit lengths (NBITS): 16 bytes specifying how many codes of each length
 * 2. Values (VALS): Symbols associated with each Huffman code
 * 
 * References:
 * - ITU-T.81 Annex K.3: "Default Huffman tables"
 * - https://www.w3.org/Graphics/JPEG/itu-t81.pdf (pages 149-155)
 */

#pragma once
#include <array>
#include <cstdint>

namespace jpegdsp::jpeg
{
    /**
     * @brief Standard Huffman tables for baseline JPEG encoding
     * 
     * These tables provide default Huffman coding specifications that work
     * well for typical photographic images. Custom tables can be generated
     * for specific images but are rarely used in practice due to overhead.
     */
    struct StandardHuffmanTables
    {
        // ====================================================================
        // DC Luminance Table (ITU-T.81 Table K.3)
        // ====================================================================
        // Used for encoding DC coefficients of Y (luma) component.
        // DC coefficients are encoded as categories (0-11) representing
        // the number of bits needed to encode the coefficient magnitude.
        
        /**
         * @brief DC Luminance bit lengths
         * 
         * Format: NBITS[i] = number of codes with length i+1
         * Example: NBITS[4] = 5 means 5 codes have length 5 bits
         * 
         * Total codes: sum(NBITS) = 12 (categories 0-11)
         */
        static inline constexpr std::array<std::uint8_t, 16> DC_LUMA_NBITS = {
            0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0
        };
        
        /**
         * @brief DC Luminance symbol values
         * 
         * Symbols 0-11 represent DC difference categories:
         * - Category 0: difference = 0
         * - Category k: difference requires k bits to encode
         */
        static inline constexpr std::array<std::uint8_t, 12> DC_LUMA_VALS = {
            0,1,2,3,4,5,6,7,8,9,10,11
        };
        
        
        // ====================================================================
        // AC Luminance Table (ITU-T.81 Table K.5)
        // ====================================================================
        // Used for encoding AC coefficients of Y (luma) component.
        // AC coefficients are encoded as (run, size) pairs where:
        // - run: number of preceding zero coefficients (0-15)
        // - size: category of the non-zero coefficient (0-10)
        
        /**
         * @brief AC Luminance bit lengths
         * 
         * This table is optimized for typical photographic images where
         * most AC coefficients are zero or small values.
         * 
         * Special symbols:
         * - 0x00 (EOB): End of Block (all remaining coefficients are zero)
         * - 0xF0 (ZRL): Zero Run Length (16 consecutive zeros)
         */
        static inline constexpr std::array<std::uint8_t, 16> AC_LUMA_NBITS = {
            0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,125
        };
        
        /**
         * @brief AC Luminance symbol values
         * 
         * 162 symbols encoding (run, size) combinations:
         * - High nibble: zero run length (0-15)
         * - Low nibble: coefficient size category (0-10)
         * 
         * Example: 0x23 = run of 2 zeros, coefficient needs 3 bits
         */
        static inline constexpr std::array<std::uint8_t, 162> AC_LUMA_VALS = {
            0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,
            0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,
            0x22,0x71,0x14,0x32,0x81,0x91,0xa1,0x08,
            0x23,0x42,0xb1,0xc1,0x15,0x52,0xd1,0xf0,
            0x24,0x33,0x62,0x72,0x82,0x09,0x0a,0x16,
            0x17,0x18,0x19,0x1a,0x25,0x26,0x27,0x28,
            0x29,0x2a,0x34,0x35,0x36,0x37,0x38,0x39,
            0x3a,0x43,0x44,0x45,0x46,0x47,0x48,0x49,
            0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,
            0x5a,0x63,0x64,0x65,0x66,0x67,0x68,0x69,
            0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,
            0x7a,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
            0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,
            0x99,0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,
            0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,
            0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,
            0xc6,0xc7,0xc8,0xc9,0xca,0xd2,0xd3,0xd4,
            0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xe1,0xe2,
            0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,
            0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
            0xf9,0xfa
        };
        
        
        // ====================================================================
        // DC Chrominance Table (ITU-T.81 Table K.4)
        // ====================================================================
        // Used for encoding DC coefficients of Cb/Cr (chroma) components.
        // Chroma DC coefficients typically have different statistics than
        // luma, hence separate tables.
        
        /**
         * @brief DC Chrominance bit lengths
         * 
         * Similar structure to DC luma, but optimized for chroma statistics.
         */
        static inline constexpr std::array<std::uint8_t, 16> DC_CHROMA_NBITS = {
            0,3,1,1,1,1,1,1,1,1,1,0,0,0,0,0
        };
        
        /**
         * @brief DC Chrominance symbol values
         * 
         * Categories 0-11 for chroma DC differences.
         */
        static inline constexpr std::array<std::uint8_t, 12> DC_CHROMA_VALS = {
            0,1,2,3,4,5,6,7,8,9,10,11
        };
        
        
        // ====================================================================
        // AC Chrominance Table (ITU-T.81 Table K.6)
        // ====================================================================
        // Used for encoding AC coefficients of Cb/Cr (chroma) components.
        // Chroma AC coefficients tend to be sparser than luma due to
        // subsampling and natural smoothness of color channels.
        
        /**
         * @brief AC Chrominance bit lengths
         * 
         * Optimized for chroma AC statistics (typically more zeros).
         */
        static inline constexpr std::array<std::uint8_t, 16> AC_CHROMA_NBITS = {
            0,2,1,2,4,4,3,4,7,5,4,4,0,1,2,119
        };
        
        /**
         * @brief AC Chrominance symbol values
         * 
         * 162 (run, size) combinations for chroma AC coefficients.
         */
        static inline constexpr std::array<std::uint8_t, 162> AC_CHROMA_VALS = {
            0x00,0x01,0x02,0x03,0x11,0x04,0x05,0x21,
            0x31,0x06,0x12,0x41,0x51,0x07,0x61,0x71,
            0x13,0x22,0x32,0x81,0x08,0x14,0x42,0x91,
            0xa1,0xb1,0xc1,0x09,0x23,0x33,0x52,0xf0,
            0x15,0x62,0x72,0xd1,0x0a,0x16,0x24,0x34,
            0xe1,0x25,0xf1,0x17,0x18,0x19,0x1a,0x26,
            0x27,0x28,0x29,0x2a,0x35,0x36,0x37,0x38,
            0x39,0x3a,0x43,0x44,0x45,0x46,0x47,0x48,
            0x49,0x4a,0x53,0x54,0x55,0x56,0x57,0x58,
            0x59,0x5a,0x63,0x64,0x65,0x66,0x67,0x68,
            0x69,0x6a,0x73,0x74,0x75,0x76,0x77,0x78,
            0x79,0x7a,0x82,0x83,0x84,0x85,0x86,0x87,
            0x88,0x89,0x8a,0x92,0x93,0x94,0x95,0x96,
            0x97,0x98,0x99,0x9a,0xa2,0xa3,0xa4,0xa5,
            0xa6,0xa7,0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,
            0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xc2,0xc3,
            0xc4,0xc5,0xc6,0xc7,0xc8,0xc9,0xca,0xd2,
            0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,
            0xe2,0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,
            0xea,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
            0xf9,0xfa
        };
    };
    
    
    // ========================================================================
    // Legacy Naming (for backwards compatibility)
    // ========================================================================
    // These aliases allow existing code to continue using old names
    
    using STD_DC_LUMINANCE_NBITS = StandardHuffmanTables;
    using STD_AC_LUMINANCE_NBITS = StandardHuffmanTables;
    using STD_DC_CHROMINANCE_NBITS = StandardHuffmanTables;
    using STD_AC_CHROMINANCE_NBITS = StandardHuffmanTables;
    
} // namespace jpegdsp::jpeg
