/**
 * @file DCTConstants.hpp
 * @brief Constants for Discrete Cosine Transform (DCT-II) computation
 * 
 * This header defines mathematical constants used in the 8×8 DCT-II forward
 * and inverse transforms. The orthonormal DCT-II is used in JPEG baseline
 * encoding to decorrelate spatial pixel data into frequency coefficients.
 * 
 * References:
 * - ITU-T.81 Annex A: DCT definition
 * - ISO/IEC 13818-2 (MPEG-2): DCT normalization
 * - "Discrete Cosine Transform" (Rao & Yip, 1990)
 * 
 * DCT-II Formula (Orthonormal):
 *   C(u,v) = 1/4 * α(u) α(v) Σx Σy f(x,y) cos((2x+1)uπ/16) cos((2y+1)vπ/16)
 * 
 * Where:
 *   α(0) = 1/√2
 *   α(k) = 1 for k > 0
 */

#pragma once
#include <cmath>

namespace jpegdsp::transforms
{
    // ========================================================================
    // DCT Normalization Constants
    // ========================================================================
    
    /**
     * @brief DCT scale factor for 2D transform
     * 
     * The 2D DCT-II requires a 1/4 scaling factor derived from the separable
     * 1D transforms (1/√N for each dimension, where N=8):
     *   (1/√8) * (1/√8) = 1/8 ≈ 0.125
     * 
     * However, the orthonormal DCT uses α(u)α(v) normalization, which
     * incorporates an additional √2 factor for DC (u=0 or v=0) coefficients.
     * The combined scale factor is 1/4 = 0.25.
     */
    inline constexpr double DCT_SCALE = 0.25;
    
    /**
     * @brief Normalization factor α(0) for DC component
     * 
     * For the DC coefficient (u=0 or v=0), the orthonormal DCT uses:
     *   α(0) = 1/√2 ≈ 0.7071067811865475
     * 
     * This ensures energy preservation and orthogonality of basis functions.
     */
    inline constexpr double DCT_ALPHA_ZERO = 0.7071067811865475244;  // 1/√2
    
    /**
     * @brief Normalization factor α(k) for AC components (k > 0)
     * 
     * For all non-DC coefficients:
     *   α(k) = 1.0
     */
    inline constexpr double DCT_ALPHA_NONZERO = 1.0;
    
    
    // ========================================================================
    // DCT Basis Function Constants
    // ========================================================================
    
    /**
     * @brief Denominator for DCT basis function cosine argument
     * 
     * The DCT-II basis functions use:
     *   cos((2x + 1) * u * π / 16)
     * 
     * The denominator 16 = 2 * BlockSize (where BlockSize = 8).
     * This appears in both forward and inverse DCT computations.
     * 
     * Mathematical origin:
     *   cos((2x + 1) * u * π / (2N)) where N = 8
     */
    inline constexpr double DCT_BLOCK_SIZE_DOUBLE = 16.0;  // 2 * 8
    
    /**
     * @brief Pi constant for trigonometric calculations
     * 
     * High-precision value of π used in DCT basis function precomputation:
     *   cos((2x + 1) * u * π / 16)
     * 
     * Precision: 20 decimal places (sufficient for double arithmetic).
     */
    inline constexpr double PI = 3.14159265358979323846;
    
    
    // ========================================================================
    // Alternative Normalization (for reference, not used)
    // ========================================================================
    // Some DCT implementations use different normalization schemes.
    // These are provided for documentation but not used in this codebase.
    
    /**
     * @brief Alternative normalization: 1/√N (not used)
     * 
     * Some DCT formulations use:
     *   α(0) = 1/√N, α(k) = √(2/N) for k > 0
     * 
     * This is NOT used in the current implementation but documented for
     * reference when comparing with other JPEG codecs.
     */
    // inline constexpr double DCT_ALT_ALPHA_ZERO = 0.35355339059327376;  // 1/√8
    // inline constexpr double DCT_ALT_ALPHA_NONZERO = 0.5;  // √(2/8)
    
    
    // ========================================================================
    // Helper Functions (inline for zero overhead)
    // ========================================================================
    
    /**
     * @brief Get normalization factor α(k) based on coefficient index
     * 
     * @param k Coefficient index (0 for DC, 1-7 for AC)
     * @return Normalization factor (1/√2 for k=0, 1.0 otherwise)
     */
    inline constexpr double getAlpha(std::size_t k) noexcept
    {
        return (k == 0) ? DCT_ALPHA_ZERO : DCT_ALPHA_NONZERO;
    }
    
} // namespace jpegdsp::transforms
