"""
Wavelet Transform Implementation using Mallat Algorithm

Supports:
- 2D DWT/IDWT with configurable wavelet (5/3, 9/7, db4, etc.)
- Multi-level decomposition
- Subband extraction (LL, LH, HL, HH)
"""
import numpy as np
import pywt
from typing import Tuple, List, Optional
from dataclasses import dataclass


@dataclass
class WaveletCoeffs:
    """Container for 2D wavelet decomposition coefficients"""
    LL: np.ndarray  # Approximation (low-low)
    LH: np.ndarray  # Horizontal details (low-high)
    HL: np.ndarray  # Vertical details (high-low)
    HH: np.ndarray  # Diagonal details (high-high)
    
    def as_tuple(self) -> Tuple[np.ndarray, Tuple[np.ndarray, np.ndarray, np.ndarray]]:
        """Convert to PyWavelets format"""
        return (self.LL, (self.LH, self.HL, self.HH))
    
    @classmethod
    def from_pywt(cls, coeffs: Tuple) -> 'WaveletCoeffs':
        """Create from PyWavelets format"""
        LL, (LH, HL, HH) = coeffs
        return cls(LL=LL, LH=LH, HL=HL, HH=HH)


def DWT2D(image: np.ndarray, wavelet: str = 'db4', level: int = 1) -> List[WaveletCoeffs]:
    """
    2D Discrete Wavelet Transform using Mallat algorithm.
    
    Args:
        image: 2D grayscale image (float, 0-255 or 0-1)
        wavelet: Wavelet name ('db4', 'bior5.3', 'bior4.4' for 9/7-like)
        level: Number of decomposition levels
        
    Returns:
        List of WaveletCoeffs for each level (index 0 = finest detail)
    """
    # Normalize to float if needed
    img = image.astype(np.float64)
    
    # PyWavelets multi-level decomposition
    coeffs = pywt.wavedec2(img, wavelet, level=level)
    
    # Convert to our format
    # coeffs[0] = final LL, coeffs[1:] = (LH, HL, HH) tuples from coarse to fine
    result = []
    for i in range(1, len(coeffs)):
        LH, HL, HH = coeffs[i]
        result.append(WaveletCoeffs(
            LL=coeffs[i-1] if i == 1 else None,  # Only store LL at coarsest level
            LH=LH, HL=HL, HH=HH
        ))
    
    # Store final LL in first element
    if result:
        result[0].LL = coeffs[0]
    
    return result


def IDWT2D(coeffs: List[WaveletCoeffs], wavelet: str = 'db4') -> np.ndarray:
    """
    Inverse 2D DWT - reconstruct image from wavelet coefficients.
    
    Args:
        coeffs: List of WaveletCoeffs from DWT2D
        wavelet: Must match the wavelet used in DWT2D
        
    Returns:
        Reconstructed image as 2D numpy array
    """
    # Convert back to PyWavelets format
    pywt_coeffs = [coeffs[0].LL]
    for c in coeffs:
        pywt_coeffs.append((c.LH, c.HL, c.HH))
    
    return pywt.waverec2(pywt_coeffs, wavelet)


def mallat_decompose(image: np.ndarray, wavelet: str = 'bior4.4', levels: int = 3) -> dict:
    """
    Mallat 2D decomposition with visualization-friendly output.
    
    Args:
        image: Input grayscale image
        wavelet: 'bior4.4' ≈ 9/7 (lossy), 'bior2.2' ≈ 5/3 (lossless)
        levels: Number of decomposition levels
        
    Returns:
        Dictionary with:
        - 'coeffs': Raw PyWavelets coefficients
        - 'subbands': Dict mapping 'LL', 'LH1', 'HL1', 'HH1', etc. to arrays
        - 'composite': Single image showing all subbands arranged spatially
    """
    img = image.astype(np.float64)
    coeffs = pywt.wavedec2(img, wavelet, level=levels)
    
    subbands = {'LL': coeffs[0]}
    for i, (LH, HL, HH) in enumerate(coeffs[1:], 1):
        level = levels - i + 1
        subbands[f'LH{level}'] = LH
        subbands[f'HL{level}'] = HL
        subbands[f'HH{level}'] = HH
    
    # Create composite visualization
    composite = create_subband_composite(coeffs)
    
    return {
        'coeffs': coeffs,
        'subbands': subbands,
        'composite': composite
    }


def mallat_reconstruct(coeffs, wavelet: str = 'bior4.4') -> np.ndarray:
    """Reconstruct image from Mallat decomposition"""
    return pywt.waverec2(coeffs, wavelet)


def create_subband_composite(coeffs) -> np.ndarray:
    """
    Create a single image showing all subbands arranged like:
    
    +--------+--------+
    |   LL   |   LH   |
    +--------+--------+
    |   HL   |   HH   |
    +--------+--------+
    
    For multi-level, LL is recursively decomposed.
    """
    # Start from coarsest level
    LL = coeffs[0]
    
    for LH, HL, HH in coeffs[1:]:
        # Normalize subbands for visualization
        LH_norm = normalize_for_display(LH)
        HL_norm = normalize_for_display(HL)
        HH_norm = normalize_for_display(HH)
        LL_norm = normalize_for_display(LL)
        
        # Combine into quad
        top = np.hstack([LL_norm, LH_norm])
        bottom = np.hstack([HL_norm, HH_norm])
        LL = np.vstack([top, bottom])
    
    return LL


def normalize_for_display(arr: np.ndarray) -> np.ndarray:
    """Normalize array to 0-255 range for display"""
    arr = arr.astype(np.float64)
    if arr.max() == arr.min():
        return np.zeros_like(arr)
    return 255 * (arr - arr.min()) / (arr.max() - arr.min())


# Predefined wavelet configurations
WAVELET_CONFIGS = {
    '5/3': {
        'wavelet': 'bior2.2',
        'description': 'Integer 5/3 wavelet (lossless, used in JPEG2000)',
        'lossless': True
    },
    '9/7': {
        'wavelet': 'bior4.4', 
        'description': 'CDF 9/7 wavelet (lossy, high quality, used in JPEG2000)',
        'lossless': False
    },
    'haar': {
        'wavelet': 'haar',
        'description': 'Haar wavelet (simplest, good for education)',
        'lossless': True
    },
    'db4': {
        'wavelet': 'db4',
        'description': 'Daubechies 4 (good general purpose)',
        'lossless': False
    }
}
