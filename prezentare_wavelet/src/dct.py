"""
DCT Transform Implementation for JPEG-style compression

Used for comparison with wavelet transforms.
"""
import numpy as np
from typing import Tuple
from scipy.fftpack import dct, idct


def DCT2D(block: np.ndarray) -> np.ndarray:
    """
    2D Type-II DCT on a block.
    
    Args:
        block: 2D array (typically 8x8)
        
    Returns:
        DCT coefficients
    """
    return dct(dct(block.T, norm='ortho').T, norm='ortho')


def IDCT2D(coeffs: np.ndarray) -> np.ndarray:
    """
    Inverse 2D DCT.
    
    Args:
        coeffs: DCT coefficients
        
    Returns:
        Reconstructed block
    """
    return idct(idct(coeffs.T, norm='ortho').T, norm='ortho')


def block_dct(image: np.ndarray, block_size: int = 8) -> np.ndarray:
    """
    Apply block-based DCT to entire image (JPEG-style).
    
    Args:
        image: Grayscale image
        block_size: Block size (default 8x8 for JPEG)
        
    Returns:
        Image of DCT coefficients (same shape as input)
    """
    img = image.astype(np.float64)
    h, w = img.shape
    
    # Pad to multiple of block_size
    pad_h = (block_size - h % block_size) % block_size
    pad_w = (block_size - w % block_size) % block_size
    if pad_h or pad_w:
        img = np.pad(img, ((0, pad_h), (0, pad_w)), mode='edge')
    
    result = np.zeros_like(img)
    
    for i in range(0, img.shape[0], block_size):
        for j in range(0, img.shape[1], block_size):
            block = img[i:i+block_size, j:j+block_size]
            # Shift by 128 (JPEG convention)
            result[i:i+block_size, j:j+block_size] = DCT2D(block - 128)
    
    return result[:h, :w]


def block_idct(coeffs: np.ndarray, block_size: int = 8) -> np.ndarray:
    """
    Inverse block-based DCT.
    
    Args:
        coeffs: DCT coefficient image
        block_size: Block size
        
    Returns:
        Reconstructed image
    """
    img = coeffs.astype(np.float64)
    h, w = img.shape
    
    # Pad to multiple of block_size
    pad_h = (block_size - h % block_size) % block_size
    pad_w = (block_size - w % block_size) % block_size
    if pad_h or pad_w:
        img = np.pad(img, ((0, pad_h), (0, pad_w)), mode='constant')
    
    result = np.zeros_like(img)
    
    for i in range(0, img.shape[0], block_size):
        for j in range(0, img.shape[1], block_size):
            block = img[i:i+block_size, j:j+block_size]
            # Add back 128
            result[i:i+block_size, j:j+block_size] = IDCT2D(block) + 128
    
    return np.clip(result[:h, :w], 0, 255)


def quantize_dct(coeffs: np.ndarray, quality: int = 50, block_size: int = 8) -> np.ndarray:
    """
    Quantize DCT coefficients using JPEG-style quantization table.
    
    Args:
        coeffs: DCT coefficient image
        quality: JPEG quality (1-100)
        block_size: Block size
        
    Returns:
        Quantized coefficients (integers)
    """
    # Standard JPEG luminance quantization table
    Q50 = np.array([
        [16, 11, 10, 16, 24, 40, 51, 61],
        [12, 12, 14, 19, 26, 58, 60, 55],
        [14, 13, 16, 24, 40, 57, 69, 56],
        [14, 17, 22, 29, 51, 87, 80, 62],
        [18, 22, 37, 56, 68, 109, 103, 77],
        [24, 35, 55, 64, 81, 104, 113, 92],
        [49, 64, 78, 87, 103, 121, 120, 101],
        [72, 92, 95, 98, 112, 100, 103, 99]
    ], dtype=np.float64)
    
    # Scale by quality
    if quality < 50:
        scale = 5000 / quality
    else:
        scale = 200 - 2 * quality
    
    Q = np.clip(np.floor((Q50 * scale + 50) / 100), 1, 255)
    
    # Apply quantization block by block
    img = coeffs.astype(np.float64)
    h, w = img.shape
    
    pad_h = (block_size - h % block_size) % block_size
    pad_w = (block_size - w % block_size) % block_size
    if pad_h or pad_w:
        img = np.pad(img, ((0, pad_h), (0, pad_w)), mode='constant')
    
    result = np.zeros_like(img)
    
    for i in range(0, img.shape[0], block_size):
        for j in range(0, img.shape[1], block_size):
            block = img[i:i+block_size, j:j+block_size]
            result[i:i+block_size, j:j+block_size] = np.round(block / Q)
    
    return result[:h, :w].astype(np.int16)


def dequantize_dct(quantized: np.ndarray, quality: int = 50, block_size: int = 8) -> np.ndarray:
    """Inverse of quantize_dct"""
    Q50 = np.array([
        [16, 11, 10, 16, 24, 40, 51, 61],
        [12, 12, 14, 19, 26, 58, 60, 55],
        [14, 13, 16, 24, 40, 57, 69, 56],
        [14, 17, 22, 29, 51, 87, 80, 62],
        [18, 22, 37, 56, 68, 109, 103, 77],
        [24, 35, 55, 64, 81, 104, 113, 92],
        [49, 64, 78, 87, 103, 121, 120, 101],
        [72, 92, 95, 98, 112, 100, 103, 99]
    ], dtype=np.float64)
    
    if quality < 50:
        scale = 5000 / quality
    else:
        scale = 200 - 2 * quality
    
    Q = np.clip(np.floor((Q50 * scale + 50) / 100), 1, 255)
    
    img = quantized.astype(np.float64)
    h, w = img.shape
    
    pad_h = (block_size - h % block_size) % block_size
    pad_w = (block_size - w % block_size) % block_size
    if pad_h or pad_w:
        img = np.pad(img, ((0, pad_h), (0, pad_w)), mode='constant')
    
    result = np.zeros_like(img)
    
    for i in range(0, img.shape[0], block_size):
        for j in range(0, img.shape[1], block_size):
            block = img[i:i+block_size, j:j+block_size]
            result[i:i+block_size, j:j+block_size] = block * Q
    
    return result[:h, :w]
