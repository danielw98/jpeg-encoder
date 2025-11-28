"""
Image Quality Metrics

PSNR, SSIM, SNR for comparing compression/denoising quality.
"""
import numpy as np
from typing import Tuple


def psnr(original: np.ndarray, compressed: np.ndarray, max_val: float = 255.0) -> float:
    """
    Peak Signal-to-Noise Ratio.
    
    Args:
        original: Original image
        compressed: Compressed/reconstructed image
        max_val: Maximum pixel value (255 for 8-bit)
        
    Returns:
        PSNR in dB (higher is better, typical: 25-50 dB)
    """
    mse = np.mean((original.astype(np.float64) - compressed.astype(np.float64)) ** 2)
    if mse == 0:
        return float('inf')
    return 10 * np.log10((max_val ** 2) / mse)


def ssim(
    original: np.ndarray,
    compressed: np.ndarray,
    window_size: int = 11,
    k1: float = 0.01,
    k2: float = 0.03,
    L: float = 255.0
) -> float:
    """
    Structural Similarity Index (simplified implementation).
    
    Args:
        original: Original image
        compressed: Compressed/reconstructed image
        window_size: Local window size
        k1, k2: Stability constants
        L: Dynamic range
        
    Returns:
        SSIM value (0-1, higher is better)
    """
    C1 = (k1 * L) ** 2
    C2 = (k2 * L) ** 2
    
    img1 = original.astype(np.float64)
    img2 = compressed.astype(np.float64)
    
    # Use global statistics (simplified)
    mu1 = np.mean(img1)
    mu2 = np.mean(img2)
    sigma1_sq = np.var(img1)
    sigma2_sq = np.var(img2)
    sigma12 = np.mean((img1 - mu1) * (img2 - mu2))
    
    numerator = (2 * mu1 * mu2 + C1) * (2 * sigma12 + C2)
    denominator = (mu1**2 + mu2**2 + C1) * (sigma1_sq + sigma2_sq + C2)
    
    return numerator / denominator


def ssim_map(
    original: np.ndarray,
    compressed: np.ndarray,
    window_size: int = 11
) -> np.ndarray:
    """
    Compute local SSIM map for visualization.
    """
    from scipy.ndimage import uniform_filter
    
    C1 = (0.01 * 255) ** 2
    C2 = (0.03 * 255) ** 2
    
    img1 = original.astype(np.float64)
    img2 = compressed.astype(np.float64)
    
    mu1 = uniform_filter(img1, window_size)
    mu2 = uniform_filter(img2, window_size)
    
    sigma1_sq = uniform_filter(img1**2, window_size) - mu1**2
    sigma2_sq = uniform_filter(img2**2, window_size) - mu2**2
    sigma12 = uniform_filter(img1*img2, window_size) - mu1*mu2
    
    numerator = (2*mu1*mu2 + C1) * (2*sigma12 + C2)
    denominator = (mu1**2 + mu2**2 + C1) * (sigma1_sq + sigma2_sq + C2)
    
    return numerator / denominator


def snr(signal: np.ndarray, noisy: np.ndarray) -> float:
    """
    Signal-to-Noise Ratio.
    
    Args:
        signal: Clean signal/image
        noisy: Noisy signal/image
        
    Returns:
        SNR in dB
    """
    signal_power = np.mean(signal.astype(np.float64) ** 2)
    noise = noisy.astype(np.float64) - signal.astype(np.float64)
    noise_power = np.mean(noise ** 2)
    
    if noise_power == 0:
        return float('inf')
    return 10 * np.log10(signal_power / noise_power)


def mse(original: np.ndarray, compressed: np.ndarray) -> float:
    """Mean Squared Error"""
    return np.mean((original.astype(np.float64) - compressed.astype(np.float64)) ** 2)


def mae(original: np.ndarray, compressed: np.ndarray) -> float:
    """Mean Absolute Error"""
    return np.mean(np.abs(original.astype(np.float64) - compressed.astype(np.float64)))


def compression_ratio(original_size: int, compressed_size: int) -> float:
    """Compression ratio (higher = more compression)"""
    return original_size / compressed_size


def bits_per_pixel(compressed_size_bytes: int, width: int, height: int) -> float:
    """Bits per pixel"""
    return (compressed_size_bytes * 8) / (width * height)


def compare_images(original: np.ndarray, compressed: np.ndarray) -> dict:
    """
    Compute all metrics for image comparison.
    
    Returns:
        Dictionary with all metrics
    """
    return {
        'psnr': psnr(original, compressed),
        'ssim': ssim(original, compressed),
        'mse': mse(original, compressed),
        'mae': mae(original, compressed)
    }
