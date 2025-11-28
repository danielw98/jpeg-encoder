"""
Wavelet Denoising Implementation

Implements soft/hard thresholding for noise removal.
"""
import numpy as np
import pywt
from typing import Literal, Optional


def threshold_coeffs(coeffs, threshold: float, mode: Literal['soft', 'hard'] = 'soft'):
    """
    Apply thresholding to wavelet coefficients.
    
    Args:
        coeffs: PyWavelets coefficient structure
        threshold: Threshold value
        mode: 'soft' (shrinkage) or 'hard' (keep or zero)
        
    Returns:
        Thresholded coefficients
    """
    result = [coeffs[0]]  # Keep LL (approximation) unchanged
    
    for detail_coeffs in coeffs[1:]:
        thresholded = []
        for c in detail_coeffs:
            if mode == 'soft':
                # Soft thresholding: shrink towards zero
                thresholded.append(pywt.threshold(c, threshold, mode='soft'))
            else:
                # Hard thresholding: keep or zero
                thresholded.append(pywt.threshold(c, threshold, mode='hard'))
        result.append(tuple(thresholded))
    
    return result


def estimate_noise_sigma(image: np.ndarray) -> float:
    """
    Estimate noise standard deviation using MAD (Median Absolute Deviation)
    of finest-scale diagonal wavelet coefficients.
    
    Args:
        image: Noisy image
        
    Returns:
        Estimated noise sigma
    """
    coeffs = pywt.wavedec2(image, 'db4', level=1)
    # HH subband at finest scale
    HH = coeffs[1][2]
    # MAD estimator
    sigma = np.median(np.abs(HH)) / 0.6745
    return sigma


def compute_threshold(sigma: float, n_samples: int, method: str = 'universal') -> float:
    """
    Compute denoising threshold.
    
    Args:
        sigma: Noise standard deviation
        n_samples: Number of samples (pixels)
        method: 'universal' (VisuShrink), 'sure', 'bayes'
        
    Returns:
        Threshold value
    """
    if method == 'universal':
        # Universal threshold (VisuShrink)
        return sigma * np.sqrt(2 * np.log(n_samples))
    elif method == 'sure':
        # SURE threshold (simplified)
        return sigma * np.sqrt(2 * np.log(n_samples)) * 0.8
    elif method == 'bayes':
        # BayesShrink (simplified)
        return sigma * np.sqrt(2 * np.log(n_samples)) * 0.6
    else:
        return sigma * np.sqrt(2 * np.log(n_samples))


def wavelet_denoise(
    image: np.ndarray,
    wavelet: str = 'db4',
    level: int = 4,
    threshold: Optional[float] = None,
    threshold_mode: Literal['soft', 'hard'] = 'soft',
    threshold_method: str = 'universal'
) -> dict:
    """
    Denoise image using wavelet thresholding.
    
    Args:
        image: Noisy grayscale image
        wavelet: Wavelet to use
        level: Decomposition levels
        threshold: Manual threshold (if None, estimate automatically)
        threshold_mode: 'soft' or 'hard'
        threshold_method: 'universal', 'sure', or 'bayes'
        
    Returns:
        Dictionary with:
        - 'denoised': Denoised image
        - 'sigma': Estimated noise sigma
        - 'threshold': Threshold used
        - 'snr_improvement': Estimated SNR improvement in dB
    """
    img = image.astype(np.float64)
    
    # Estimate noise
    sigma = estimate_noise_sigma(img)
    
    # Compute threshold if not provided
    if threshold is None:
        threshold = compute_threshold(sigma, img.size, threshold_method)
    
    # Decompose
    coeffs = pywt.wavedec2(img, wavelet, level=level)
    
    # Threshold
    coeffs_thresh = threshold_coeffs(coeffs, threshold, threshold_mode)
    
    # Reconstruct
    denoised = pywt.waverec2(coeffs_thresh, wavelet)
    
    # Trim to original size (waverec2 may add pixels)
    denoised = denoised[:img.shape[0], :img.shape[1]]
    
    # Estimate SNR improvement
    # Assuming noise power reduced by thresholding
    noise_power_before = sigma ** 2
    residual = img - denoised
    noise_power_after = np.var(residual)
    snr_improvement = 10 * np.log10(noise_power_before / max(noise_power_after, 1e-10))
    
    return {
        'denoised': np.clip(denoised, 0, 255).astype(np.uint8),
        'sigma': sigma,
        'threshold': threshold,
        'snr_improvement': snr_improvement,
        'coeffs_original': coeffs,
        'coeffs_thresholded': coeffs_thresh
    }


def add_gaussian_noise(image: np.ndarray, sigma: float = 25) -> np.ndarray:
    """Add Gaussian noise to image for testing"""
    noisy = image.astype(np.float64) + np.random.normal(0, sigma, image.shape)
    return np.clip(noisy, 0, 255).astype(np.uint8)


def snr(original: np.ndarray, noisy: np.ndarray) -> float:
    """Calculate Signal-to-Noise Ratio in dB"""
    signal_power = np.mean(original.astype(np.float64) ** 2)
    noise_power = np.mean((original.astype(np.float64) - noisy.astype(np.float64)) ** 2)
    return 10 * np.log10(signal_power / max(noise_power, 1e-10))
