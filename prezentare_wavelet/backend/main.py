"""
FastAPI Backend for Wavelet Presentation

Provides APIs for:
- Wavelet decomposition (Mallat)
- DCT comparison
- Denoising
- Image quality metrics
- Signal processing demos (Fourier, filters, wavelets)
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path
import numpy as np
from PIL import Image
import pywt
import io
import base64
import os

# Path to test images
TEST_IMAGES_DIR = Path(__file__).parent.parent.parent / "data" / "standard_test_images"

app = FastAPI(
    title="Wavelet DSP API",
    description="Backend for wavelet vs DCT interactive presentation",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:3002", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Models
# ============================================================================

class WaveletParams(BaseModel):
    wavelet: str = "db4"
    levels: int = 3

class DenoiseParams(BaseModel):
    wavelet: str = "db4"
    levels: int = 4
    threshold: Optional[float] = None
    mode: str = "soft"  # soft or hard

class DCTParams(BaseModel):
    quality: int = 50
    block_size: int = 8


# ============================================================================
# Utility Functions
# ============================================================================

def image_to_base64(img_array: np.ndarray) -> str:
    """Convert numpy array to base64 PNG string"""
    if img_array.dtype != np.uint8:
        img_array = np.clip(img_array, 0, 255).astype(np.uint8)
    img = Image.fromarray(img_array)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()


def load_image_from_upload(file: UploadFile) -> np.ndarray:
    """Load uploaded image as grayscale numpy array"""
    contents = file.file.read()
    img = Image.open(io.BytesIO(contents)).convert('L')
    return np.array(img, dtype=np.float64)


def normalize_for_display(arr: np.ndarray) -> np.ndarray:
    """Normalize array to 0-255 for display"""
    if arr.max() == arr.min():
        return np.zeros_like(arr, dtype=np.uint8)
    normalized = 255 * (arr - arr.min()) / (arr.max() - arr.min())
    return normalized.astype(np.uint8)


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    return {"message": "Wavelet DSP API", "status": "running"}


@app.get("/api/wavelets")
async def list_wavelets():
    """List available wavelets"""
    return {
        "wavelets": [
            {"id": "haar", "name": "Haar", "description": "Simplest wavelet, good for education"},
            {"id": "db4", "name": "Daubechies 4", "description": "Good general purpose"},
            {"id": "db8", "name": "Daubechies 8", "description": "Smoother, more coefficients"},
            {"id": "bior2.2", "name": "Biorthogonal 5/3", "description": "JPEG2000 lossless"},
            {"id": "bior4.4", "name": "Biorthogonal 9/7", "description": "JPEG2000 lossy"},
            {"id": "sym4", "name": "Symlet 4", "description": "Near-symmetric"},
            {"id": "coif2", "name": "Coiflet 2", "description": "Nearly symmetric"}
        ]
    }


@app.post("/api/decompose")
async def decompose_image(
    file: UploadFile = File(...),
    wavelet: str = "db4",
    levels: int = 3
):
    """
    Perform 2D wavelet decomposition on uploaded image.
    Returns subbands as base64 images.
    """
    try:
        # Load image
        img_array = load_image_from_upload(file)
        
        # Perform decomposition
        coeffs = pywt.wavedec2(img_array, wavelet, level=levels)
        
        # Extract subbands
        subbands = {}
        
        # LL (approximation at coarsest level)
        ll = coeffs[0]
        subbands["LL"] = {
            "image": image_to_base64(normalize_for_display(ll)),
            "shape": list(ll.shape),
            "min": float(ll.min()),
            "max": float(ll.max()),
            "mean": float(ll.mean())
        }
        
        # Detail subbands at each level
        for i, (lh, hl, hh) in enumerate(coeffs[1:], 1):
            level = levels - i + 1
            subbands[f"LH{level}"] = {
                "image": image_to_base64(normalize_for_display(lh)),
                "shape": list(lh.shape),
                "energy": float(np.sum(lh**2))
            }
            subbands[f"HL{level}"] = {
                "image": image_to_base64(normalize_for_display(hl)),
                "shape": list(hl.shape),
                "energy": float(np.sum(hl**2))
            }
            subbands[f"HH{level}"] = {
                "image": image_to_base64(normalize_for_display(hh)),
                "shape": list(hh.shape),
                "energy": float(np.sum(hh**2))
            }
        
        # Create composite visualization
        composite = create_wavelet_composite(coeffs)
        
        return {
            "success": True,
            "original_shape": list(img_array.shape),
            "wavelet": wavelet,
            "levels": levels,
            "subbands": subbands,
            "composite": image_to_base64(composite)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def create_wavelet_composite(coeffs) -> np.ndarray:
    """Create composite image showing all subbands"""
    # Start from coarsest level
    result = normalize_for_display(coeffs[0])
    
    for lh, hl, hh in coeffs[1:]:
        lh_norm = normalize_for_display(lh)
        hl_norm = normalize_for_display(hl)
        hh_norm = normalize_for_display(hh)
        
        # Combine into quad
        top = np.hstack([result, lh_norm])
        bottom = np.hstack([hl_norm, hh_norm])
        result = np.vstack([top, bottom])
    
    return result


@app.post("/api/reconstruct")
async def reconstruct_image(
    file: UploadFile = File(...),
    wavelet: str = "db4",
    levels: int = 3,
    keep_levels: int = 3
):
    """
    Decompose and reconstruct image, optionally dropping detail levels.
    Useful for demonstrating progressive reconstruction.
    """
    try:
        img_array = load_image_from_upload(file)
        
        # Decompose
        coeffs = pywt.wavedec2(img_array, wavelet, level=levels)
        
        # Zero out higher detail levels if requested
        if keep_levels < levels:
            for i in range(1, levels - keep_levels + 1):
                coeffs[i] = tuple(np.zeros_like(c) for c in coeffs[i])
        
        # Reconstruct
        reconstructed = pywt.waverec2(coeffs, wavelet)
        reconstructed = reconstructed[:img_array.shape[0], :img_array.shape[1]]
        
        # Calculate metrics
        mse = np.mean((img_array - reconstructed) ** 2)
        psnr = 10 * np.log10(255**2 / mse) if mse > 0 else float('inf')
        
        return {
            "success": True,
            "original": image_to_base64(normalize_for_display(img_array)),
            "reconstructed": image_to_base64(normalize_for_display(reconstructed)),
            "mse": float(mse),
            "psnr": float(psnr),
            "levels_used": keep_levels
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/denoise")
async def denoise_image(
    file: UploadFile = File(...),
    wavelet: str = "db4",
    levels: int = 4,
    threshold: Optional[float] = None,
    mode: str = "soft",
    add_noise: bool = False,
    noise_sigma: float = 25
):
    """
    Perform wavelet denoising.
    Optionally adds noise first for demonstration.
    """
    try:
        img_array = load_image_from_upload(file)
        original = img_array.copy()
        
        # Add noise if requested
        if add_noise:
            np.random.seed(42)
            noise = np.random.normal(0, noise_sigma, img_array.shape)
            img_array = np.clip(img_array + noise, 0, 255)
        
        # Decompose
        coeffs = pywt.wavedec2(img_array, wavelet, level=levels)
        
        # Estimate noise and compute threshold if not provided
        hh = coeffs[-1][2]  # Finest HH
        sigma = np.median(np.abs(hh)) / 0.6745
        if threshold is None:
            threshold = sigma * np.sqrt(2 * np.log(img_array.size))
        
        # Threshold detail coefficients
        thresholded = [coeffs[0]]
        for lh, hl, hh in coeffs[1:]:
            thresholded.append((
                pywt.threshold(lh, threshold, mode=mode),
                pywt.threshold(hl, threshold, mode=mode),
                pywt.threshold(hh, threshold, mode=mode)
            ))
        
        # Reconstruct
        denoised = pywt.waverec2(thresholded, wavelet)
        denoised = np.clip(denoised[:img_array.shape[0], :img_array.shape[1]], 0, 255)
        
        # Calculate metrics
        if add_noise:
            snr_before = 10 * np.log10(np.mean(original**2) / np.mean((original - img_array)**2))
            snr_after = 10 * np.log10(np.mean(original**2) / np.mean((original - denoised)**2))
        else:
            snr_before = None
            snr_after = None
        
        return {
            "success": True,
            "original": image_to_base64(normalize_for_display(original)),
            "noisy": image_to_base64(normalize_for_display(img_array)) if add_noise else None,
            "denoised": image_to_base64(normalize_for_display(denoised)),
            "estimated_sigma": float(sigma),
            "threshold_used": float(threshold),
            "snr_before": float(snr_before) if snr_before else None,
            "snr_after": float(snr_after) if snr_after else None,
            "snr_improvement": float(snr_after - snr_before) if snr_before else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/compare-dct")
async def compare_dct_wavelet(
    file: UploadFile = File(...),
    quality: int = 50,
    wavelet: str = "bior4.4",
    levels: int = 4
):
    """
    Compare DCT (JPEG-style) vs Wavelet compression at similar quality.
    """
    from scipy.fftpack import dct, idct
    
    try:
        img_array = load_image_from_upload(file)
        
        # === DCT Compression (JPEG-style) ===
        block_size = 8
        h, w = img_array.shape
        
        # Pad to block size
        pad_h = (block_size - h % block_size) % block_size
        pad_w = (block_size - w % block_size) % block_size
        padded = np.pad(img_array, ((0, pad_h), (0, pad_w)), mode='edge')
        
        # Standard quantization matrix
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
        
        # Process blocks
        dct_result = np.zeros_like(padded)
        for i in range(0, padded.shape[0], block_size):
            for j in range(0, padded.shape[1], block_size):
                block = padded[i:i+block_size, j:j+block_size] - 128
                # 2D DCT
                dct_block = dct(dct(block.T, norm='ortho').T, norm='ortho')
                # Quantize
                quantized = np.round(dct_block / Q)
                # Dequantize
                dequantized = quantized * Q
                # Inverse DCT
                idct_block = idct(idct(dequantized.T, norm='ortho').T, norm='ortho') + 128
                dct_result[i:i+block_size, j:j+block_size] = idct_block
        
        dct_result = np.clip(dct_result[:h, :w], 0, 255)
        
        # === Wavelet Compression ===
        coeffs = pywt.wavedec2(img_array, wavelet, level=levels)
        
        # Threshold to achieve similar compression
        # (simplified - real JPEG2000 uses sophisticated bit allocation)
        threshold = (100 - quality) * 0.3
        
        thresholded = [coeffs[0]]
        for lh, hl, hh in coeffs[1:]:
            thresholded.append((
                pywt.threshold(lh, threshold, mode='soft'),
                pywt.threshold(hl, threshold, mode='soft'),
                pywt.threshold(hh, threshold, mode='soft')
            ))
        
        wavelet_result = pywt.waverec2(thresholded, wavelet)
        wavelet_result = np.clip(wavelet_result[:h, :w], 0, 255)
        
        # Calculate metrics
        mse_dct = np.mean((img_array - dct_result) ** 2)
        mse_wav = np.mean((img_array - wavelet_result) ** 2)
        
        psnr_dct = 10 * np.log10(255**2 / mse_dct) if mse_dct > 0 else float('inf')
        psnr_wav = 10 * np.log10(255**2 / mse_wav) if mse_wav > 0 else float('inf')
        
        return {
            "success": True,
            "original": image_to_base64(normalize_for_display(img_array)),
            "dct_result": image_to_base64(normalize_for_display(dct_result)),
            "wavelet_result": image_to_base64(normalize_for_display(wavelet_result)),
            "quality": quality,
            "metrics": {
                "dct": {"mse": float(mse_dct), "psnr": float(psnr_dct)},
                "wavelet": {"mse": float(mse_wav), "psnr": float(psnr_wav)}
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/signal-demo")
async def signal_demo(
    frequency: float = 5.0,
    samples: int = 256,
    noise_level: float = 0.3
):
    """
    Generate 1D signal demo data for wavelet visualization.
    """
    t = np.linspace(0, 1, samples)
    
    # Generate signal
    signal = np.sin(2 * np.pi * frequency * t) + 0.5 * np.sin(2 * np.pi * frequency * 2 * t)
    
    # Add noise
    np.random.seed(42)
    noisy = signal + np.random.normal(0, noise_level, samples)
    
    # Wavelet decomposition
    coeffs = pywt.wavedec(noisy, 'db4', level=4)
    
    # Denoise
    threshold = noise_level * np.sqrt(2 * np.log(samples))
    denoised_coeffs = [coeffs[0]] + [pywt.threshold(c, threshold, mode='soft') for c in coeffs[1:]]
    denoised = pywt.waverec(denoised_coeffs, 'db4')[:samples]
    
    return {
        "t": t.tolist(),
        "signal": signal.tolist(),
        "noisy": noisy.tolist(),
        "denoised": denoised.tolist(),
        "coefficients": {
            "approximation": coeffs[0].tolist(),
            "details": [c.tolist() for c in coeffs[1:]]
        }
    }


# ============================================================================
# Sample Images API
# ============================================================================

@app.get("/api/sample-images")
async def list_sample_images():
    """List available sample images from standard_test_images"""
    # Friendly names for standard test images
    FRIENDLY_NAMES = {
        "peppers_512": "🌶️ Peppers",
        "baboon_512": "🐒 Baboon (Mandrill)",
        "lake_512": "🏞️ Lake",
        "house_512": "🏠 House",
        # Official Kodak PhotoCD descriptions from r0k.us/graphics/kodak/PhotoCD_credits.txt
        "kodim01": "Kodak 01 - Stone Building",
        "kodim02": "Kodak 02 - Red Door",
        "kodim03": "Kodak 03 - Hats",
        "kodim04": "Kodak 04 - Portrait Girl in Red",
        "kodim05": "Kodak 05 - Motocross Bikes",
        "kodim06": "Kodak 06 - Sailboat at Anchor",
        "kodim07": "Kodak 07 - Shuttered Windows",
        "kodim08": "Kodak 08 - Market Place",
        "kodim09": "Kodak 09 - Sailboats Spinnakers",
        "kodim10": "Kodak 10 - Off-shore Sailboat Race",
        "kodim11": "Kodak 11 - Sailboat at Pier",
        "kodim12": "Kodak 12 - Couple on Beach",
        "kodim13": "Kodak 13 - Mountain Stream",
        "kodim14": "Kodak 14 - White Water Rafters",
        "kodim15": "Kodak 15 - Girl Painted Face",
        "kodim16": "Kodak 16 - Tropical Key",
        "kodim17": "Kodak 17 - Monument Cologne",
        "kodim18": "Kodak 18 - Model Black Dress",
        "kodim19": "Kodak 19 - Lighthouse Maine",
        "kodim20": "Kodak 20 - P51 Mustang",
        "kodim21": "Kodak 21 - Portland Head Light",
        "kodim22": "Kodak 22 - Barn and Pond",
        "kodim23": "Kodak 23 - Two Macaws",
        "kodim24": "Kodak 24 - Mountain Chalet",
    }
    
    images = []
    if TEST_IMAGES_DIR.exists():
        for f in sorted(TEST_IMAGES_DIR.glob("*.png")):
            stem = f.stem
            name = FRIENDLY_NAMES.get(stem, stem.replace("_", " ").title())
            images.append({
                "id": stem,
                "name": name,
                "filename": f.name
            })
    return {"images": images}


@app.get("/api/sample-images/{image_id}")
async def get_sample_image(image_id: str):
    """Get a sample image as base64"""
    img_path = TEST_IMAGES_DIR / f"{image_id}.png"
    if not img_path.exists():
        raise HTTPException(status_code=404, detail=f"Image {image_id} not found")
    
    img = Image.open(img_path).convert('L')
    img_array = np.array(img, dtype=np.float64)
    
    return {
        "id": image_id,
        "image": image_to_base64(normalize_for_display(img_array)),
        "shape": list(img_array.shape)
    }


@app.get("/api/sample-images/{image_id}/raw")
async def get_sample_image_raw(image_id: str):
    """Get raw image file"""
    img_path = TEST_IMAGES_DIR / f"{image_id}.png"
    if not img_path.exists():
        raise HTTPException(status_code=404, detail=f"Image {image_id} not found")
    return FileResponse(img_path, media_type="image/png")


# ============================================================================
# Sprite Images API (Educational - small pixel art for kernel demos)
# ============================================================================

SPRITE_IMAGES_DIR = Path(__file__).parent.parent.parent / "data" / "sprite_images"

@app.get("/api/sprite-images")
async def list_sprite_images():
    """List available sprite images for educational kernel demos"""
    SPRITE_NAMES = {
        "block": "🟨 Question Block",
        "heart": "❤️ Heart",
        "star": "⭐ Star",
        "coin": "🪙 Coin",
        "mushroom": "🍄 Mushroom",
        "ghost": "👻 Ghost",
        "tree": "🌲 Tree",
        "sword": "⚔️ Sword",
        "potion": "🧪 Potion",
        "checker_color": "🎨 Color Checker",
        "rainbow": "🌈 Rainbow",
        "smiley": "😊 Smiley",
    }
    
    images = []
    if SPRITE_IMAGES_DIR.exists():
        for f in sorted(SPRITE_IMAGES_DIR.glob("*.png")):
            stem = f.stem
            # Parse name_size format
            parts = stem.rsplit("_", 1)
            if len(parts) == 2:
                name, size = parts[0], parts[1]
                friendly = SPRITE_NAMES.get(name, name.replace("_", " ").title())
                images.append({
                    "id": stem,
                    "name": f"{friendly} ({size}×{size})",
                    "baseName": name,
                    "size": int(size),
                    "filename": f.name
                })
    return {"images": images}


@app.get("/api/sprite-images/{image_id}")
async def get_sprite_image(image_id: str, scale_to: int = 512):
    """
    Get a sprite image scaled to display size using nearest neighbor.
    Preserves pixel art crisp edges.
    """
    img_path = SPRITE_IMAGES_DIR / f"{image_id}.png"
    if not img_path.exists():
        raise HTTPException(status_code=404, detail=f"Sprite {image_id} not found")
    
    img = Image.open(img_path).convert('RGB')
    original_size = img.size[0]  # Assume square
    
    # Scale with nearest neighbor to preserve pixel art
    if scale_to and scale_to != original_size:
        img = img.resize((scale_to, scale_to), Image.Resampling.NEAREST)
    
    # Convert to base64
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    return {
        "id": image_id,
        "image": img_base64,
        "originalSize": original_size,
        "displaySize": scale_to,
        "shape": [scale_to, scale_to, 3]
    }


@app.get("/api/sprite-images/{image_id}/pixels")
async def get_sprite_pixels(image_id: str):
    """
    Get raw pixel data for a sprite (unscaled).
    Returns the actual pixel values for educational visualization.
    """
    img_path = SPRITE_IMAGES_DIR / f"{image_id}.png"
    if not img_path.exists():
        raise HTTPException(status_code=404, detail=f"Sprite {image_id} not found")
    
    img = Image.open(img_path).convert('RGB')
    pixels = np.array(img)
    
    return {
        "id": image_id,
        "size": img.size[0],
        "pixels": pixels.tolist()  # 3D array: [row][col][rgb]
    }


# ============================================================================
# Fourier Transform API
# ============================================================================

@app.get("/api/fourier/function")
async def fourier_function(
    expression: str = "sin(2*pi*5*t) + sin(2*pi*12*t)",
    samples: int = 512,
    duration: float = 1.0
):
    """
    Compute Fourier transform of a mathematical expression.
    Supports: sin, cos, exp, pi, abs, sqrt, t (time variable)
    """
    from numpy import sin, cos, exp, pi, abs, sqrt
    
    try:
        t = np.linspace(0, duration, samples)
        
        # Evaluate expression safely
        allowed_names = {
            "sin": np.sin, "cos": np.cos, "exp": np.exp,
            "pi": np.pi, "abs": np.abs, "sqrt": np.sqrt,
            "t": t
        }
        signal = eval(expression, {"__builtins__": {}}, allowed_names)
        
        # Compute FFT
        fft = np.fft.fft(signal)
        freqs = np.fft.fftfreq(samples, duration / samples)
        
        # Only positive frequencies
        pos_mask = freqs >= 0
        freqs_pos = freqs[pos_mask]
        magnitude = np.abs(fft[pos_mask]) * 2 / samples
        phase = np.angle(fft[pos_mask])
        
        return {
            "success": True,
            "expression": expression,
            "time": {
                "t": t.tolist(),
                "signal": signal.tolist()
            },
            "frequency": {
                "f": freqs_pos.tolist(),
                "magnitude": magnitude.tolist(),
                "phase": phase.tolist()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error evaluating expression: {str(e)}")


@app.get("/api/fourier/image")
async def fourier_image_sample(image_id: str = "lena_512"):
    """Compute 2D Fourier transform of a sample image"""
    img_path = TEST_IMAGES_DIR / f"{image_id}.png"
    if not img_path.exists():
        # Try without _512 suffix
        img_path = TEST_IMAGES_DIR / f"{image_id}.png"
        if not img_path.exists():
            raise HTTPException(status_code=404, detail=f"Image {image_id} not found")
    
    img = Image.open(img_path).convert('L')
    img_array = np.array(img, dtype=np.float64)
    
    # Compute 2D FFT
    fft2 = np.fft.fft2(img_array)
    fft2_shifted = np.fft.fftshift(fft2)
    
    # Magnitude spectrum (log scale for visibility)
    magnitude = np.log1p(np.abs(fft2_shifted))
    phase = np.angle(fft2_shifted)
    
    return {
        "success": True,
        "original": image_to_base64(normalize_for_display(img_array)),
        "magnitude": image_to_base64(normalize_for_display(magnitude)),
        "phase": image_to_base64(normalize_for_display(phase)),
        "shape": list(img_array.shape)
    }


# ============================================================================
# Filter Visualization API  
# ============================================================================

@app.get("/api/filters/lowpass")
async def lowpass_filter_demo(
    cutoff_hz: float = 30.0,
    filter_type: str = "ideal",
    samples: int = 256,
    max_freq_hz: float = 100.0
):
    """
    Demonstrate low-pass filter in frequency domain.
    cutoff_hz: Cutoff frequency in Hz
    max_freq_hz: Maximum frequency to display (Hz)
    Types: ideal, butterworth, gaussian
    """
    # Work in Hz directly
    freqs_hz = np.linspace(0, max_freq_hz, samples)
    
    if filter_type == "ideal":
        response = np.where(freqs_hz <= cutoff_hz, 1.0, 0.0)
    elif filter_type == "butterworth":
        order = 4
        epsilon = 1e-10
        response = 1 / np.sqrt(1 + (freqs_hz / (cutoff_hz + epsilon)) ** (2 * order))
    elif filter_type == "gaussian":
        sigma = cutoff_hz / 2
        response = np.exp(-(freqs_hz ** 2) / (2 * sigma ** 2 + 1e-10))
    else:
        response = np.where(freqs_hz <= cutoff_hz, 1.0, 0.0)
    
    # Impulse response (inverse FFT of frequency response)
    full_response = np.concatenate([response, response[::-1][1:-1]])
    impulse = np.real(np.fft.ifft(full_response))
    impulse = np.fft.fftshift(impulse)
    t_impulse = np.linspace(-1, 1, len(impulse))
    
    return {
        "type": filter_type,
        "cutoff_hz": cutoff_hz,
        "frequency": {
            "f": freqs_hz.tolist(),  # Already in Hz
            "response": response.tolist()
        },
        "impulse": {
            "t": t_impulse.tolist(),
            "h": impulse.tolist()
        }
    }


@app.get("/api/filters/highpass")
async def highpass_filter_demo(
    cutoff_hz: float = 30.0,
    filter_type: str = "ideal",
    samples: int = 256,
    max_freq_hz: float = 100.0
):
    """
    Demonstrate high-pass filter in frequency domain.
    cutoff_hz: Cutoff frequency in Hz
    """
    # Work in Hz directly
    freqs_hz = np.linspace(0, max_freq_hz, samples)
    
    if filter_type == "ideal":
        response = np.where(freqs_hz >= cutoff_hz, 1.0, 0.0)
    elif filter_type == "butterworth":
        order = 4
        epsilon = 1e-10
        response = 1 / np.sqrt(1 + (cutoff_hz / (freqs_hz + epsilon)) ** (2 * order))
    elif filter_type == "gaussian":
        sigma = cutoff_hz / 2
        response = 1 - np.exp(-(freqs_hz ** 2) / (2 * sigma ** 2 + 1e-10))
    else:
        response = np.where(freqs_hz >= cutoff_hz, 1.0, 0.0)
    
    # Impulse response
    full_response = np.concatenate([response, response[::-1][1:-1]])
    impulse = np.real(np.fft.ifft(full_response))
    impulse = np.fft.fftshift(impulse)
    t_impulse = np.linspace(-1, 1, len(impulse))
    
    return {
        "type": filter_type,
        "cutoff_hz": cutoff_hz,
        "frequency": {
            "f": freqs_hz.tolist(),  # Already in Hz
            "response": response.tolist()
        },
        "impulse": {
            "t": t_impulse.tolist(),
            "h": impulse.tolist()
        }
    }


@app.get("/api/filters/bandpass")
async def bandpass_filter_demo(
    low_cutoff: float = 0.2,
    high_cutoff: float = 0.5,
    filter_type: str = "ideal",
    samples: int = 256
):
    """Demonstrate band-pass filter"""
    freqs = np.linspace(0, 1, samples)
    
    if filter_type == "ideal":
        response = np.where((freqs >= low_cutoff) & (freqs <= high_cutoff), 1.0, 0.0)
    elif filter_type == "butterworth":
        order = 4
        center = (low_cutoff + high_cutoff) / 2
        bandwidth = high_cutoff - low_cutoff
        epsilon = 1e-10
        response = 1 / np.sqrt(1 + ((freqs - center) / (bandwidth / 2 + epsilon)) ** (2 * order))
    else:
        response = np.where((freqs >= low_cutoff) & (freqs <= high_cutoff), 1.0, 0.0)
    
    return {
        "type": filter_type,
        "low_cutoff": low_cutoff,
        "high_cutoff": high_cutoff,
        "frequency": {
            "f": freqs.tolist(),
            "response": response.tolist()
        }
    }


@app.get("/api/filters/apply-signal")
async def apply_filter_to_signal(
    expression: str = "sin(2*pi*5*t) + sin(2*pi*20*t) + sin(2*pi*50*t)",
    filter_type: str = "lowpass",
    cutoff_hz: float = 30.0,
    samples: int = 512
):
    """
    Apply a filter to a signal and show before/after.
    cutoff_hz: Cutoff frequency in Hz (samples over 1 second, so sample_rate = samples)
    """
    from numpy import sin, cos, exp, pi
    
    try:
        # samples over 1 second means sample_rate = samples
        sample_rate = samples
        
        t = np.linspace(0, 1, samples)
        allowed_names = {"sin": np.sin, "cos": np.cos, "exp": np.exp, "pi": np.pi, "t": t}
        signal = eval(expression, {"__builtins__": {}}, allowed_names)
        
        # FFT
        fft = np.fft.fft(signal)
        freqs_normalized = np.fft.fftfreq(samples)  # Normalized: 1.0 = sample_rate
        freqs_hz = freqs_normalized * sample_rate    # Convert to Hz
        
        # Create filter (compare in Hz)
        if filter_type == "lowpass":
            filt = np.abs(freqs_hz) <= cutoff_hz
        elif filter_type == "highpass":
            filt = np.abs(freqs_hz) >= cutoff_hz
        else:
            filt = np.ones_like(freqs_hz, dtype=bool)
        
        # Apply filter
        filtered_fft = fft * filt
        filtered_signal = np.real(np.fft.ifft(filtered_fft))
        
        # Magnitude spectra (positive frequencies only)
        mag_original = np.abs(fft[:samples//2]) * 2 / samples
        mag_filtered = np.abs(filtered_fft[:samples//2]) * 2 / samples
        freqs_hz_pos = freqs_hz[:samples//2]  # Already in Hz
        
        return {
            "success": True,
            "time": {
                "t": t.tolist(),
                "original": signal.tolist(),
                "filtered": filtered_signal.tolist()
            },
            "frequency": {
                "f": freqs_hz_pos.tolist(),  # Already in Hz
                "original_magnitude": mag_original.tolist(),
                "filtered_magnitude": mag_filtered.tolist()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# Wavelet Basis Visualization
# ============================================================================

@app.get("/api/wavelet-basis")
async def wavelet_basis(wavelet: str = "db4", samples: int = 128):
    """Get wavelet and scaling function for visualization"""
    try:
        wav = pywt.Wavelet(wavelet)
        
        # Get wavelet and scaling functions
        phi, psi, x = wav.wavefun(level=8)
        
        # Resample to requested number of samples
        indices = np.linspace(0, len(x) - 1, samples).astype(int)
        
        return {
            "wavelet": wavelet,
            "name": wav.name,
            "family": wav.family_name,
            "x": x[indices].tolist(),
            "scaling_function": phi[indices].tolist(),  # φ (phi) - low-pass
            "wavelet_function": psi[indices].tolist(),  # ψ (psi) - high-pass
            "properties": {
                "filter_length": wav.dec_len,
                "symmetry": wav.symmetry,
                "orthogonal": wav.orthogonal,
                "biorthogonal": wav.biorthogonal
            },
            "filters": {
                "dec_lo": wav.dec_lo.tolist(),  # Decomposition low-pass
                "dec_hi": wav.dec_hi.tolist(),  # Decomposition high-pass
                "rec_lo": wav.rec_lo.tolist(),  # Reconstruction low-pass
                "rec_hi": wav.rec_hi.tolist()   # Reconstruction high-pass
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/wavelet-families")
async def wavelet_families():
    """List all available wavelet families"""
    families = {}
    for family in pywt.families():
        wavelets = pywt.wavelist(family)
        families[family] = {
            "name": family,
            "wavelets": wavelets,
            "description": get_family_description(family)
        }
    return families


def get_family_description(family: str) -> str:
    descriptions = {
        "haar": "Simplest wavelet, discontinuous, good for sharp transitions",
        "db": "Daubechies - compact support, orthogonal, varying smoothness",
        "sym": "Symlets - near-symmetric Daubechies wavelets",
        "coif": "Coiflets - symmetric scaling function, good for signal features",
        "bior": "Biorthogonal - symmetric, used in JPEG2000",
        "rbio": "Reverse biorthogonal wavelets",
        "dmey": "Discrete Meyer wavelet - smooth in frequency domain",
        "gaus": "Gaussian wavelets - continuous wavelet analysis",
        "mexh": "Mexican hat wavelet - second derivative of Gaussian",
        "morl": "Morlet wavelet - complex wavelet for time-frequency analysis"
    }
    return descriptions.get(family, "")


# ============================================================================
# Decompose with Sample Image (no upload needed)
# ============================================================================

@app.get("/api/decompose-sample/{image_id}")
async def decompose_sample_image(
    image_id: str,
    wavelet: str = "db4",
    levels: int = 3
):
    """Decompose a sample image without upload"""
    img_path = TEST_IMAGES_DIR / f"{image_id}.png"
    if not img_path.exists():
        raise HTTPException(status_code=404, detail=f"Image {image_id} not found")
    
    img = Image.open(img_path).convert('L')
    img_array = np.array(img, dtype=np.float64)
    
    # Perform decomposition
    coeffs = pywt.wavedec2(img_array, wavelet, level=levels)
    
    # Extract subbands
    subbands = {}
    ll = coeffs[0]
    subbands["LL"] = {
        "image": image_to_base64(normalize_for_display(ll)),
        "shape": list(ll.shape),
        "energy": float(np.sum(ll**2))
    }
    
    for i, (lh, hl, hh) in enumerate(coeffs[1:], 1):
        level = levels - i + 1
        for name, arr in [("LH", lh), ("HL", hl), ("HH", hh)]:
            subbands[f"{name}{level}"] = {
                "image": image_to_base64(normalize_for_display(arr)),
                "shape": list(arr.shape),
                "energy": float(np.sum(arr**2))
            }
    
    composite = create_wavelet_composite(coeffs)
    
    return {
        "success": True,
        "image_id": image_id,
        "original": image_to_base64(normalize_for_display(img_array)),
        "original_shape": list(img_array.shape),
        "wavelet": wavelet,
        "levels": levels,
        "subbands": subbands,
        "composite": image_to_base64(composite)
    }


@app.get("/api/compare-sample/{image_id}")
async def compare_sample_image(
    image_id: str,
    quality: int = 50,
    wavelet: str = "bior4.4",
    levels: int = 4
):
    """Compare DCT vs Wavelet on a sample image"""
    from scipy.fftpack import dct, idct
    
    img_path = TEST_IMAGES_DIR / f"{image_id}.png"
    if not img_path.exists():
        raise HTTPException(status_code=404, detail=f"Image {image_id} not found")
    
    img = Image.open(img_path).convert('L')
    img_array = np.array(img, dtype=np.float64)
    
    # DCT compression (same as before)
    block_size = 8
    h, w = img_array.shape
    pad_h = (block_size - h % block_size) % block_size
    pad_w = (block_size - w % block_size) % block_size
    padded = np.pad(img_array, ((0, pad_h), (0, pad_w)), mode='edge')
    
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
    
    dct_result = np.zeros_like(padded)
    for i in range(0, padded.shape[0], block_size):
        for j in range(0, padded.shape[1], block_size):
            block = padded[i:i+block_size, j:j+block_size] - 128
            dct_block = dct(dct(block.T, norm='ortho').T, norm='ortho')
            quantized = np.round(dct_block / Q)
            dequantized = quantized * Q
            idct_block = idct(idct(dequantized.T, norm='ortho').T, norm='ortho') + 128
            dct_result[i:i+block_size, j:j+block_size] = idct_block
    
    dct_result = np.clip(dct_result[:h, :w], 0, 255)
    
    # Wavelet compression
    coeffs = pywt.wavedec2(img_array, wavelet, level=levels)
    threshold = (100 - quality) * 0.3
    
    thresholded = [coeffs[0]]
    for lh, hl, hh in coeffs[1:]:
        thresholded.append((
            pywt.threshold(lh, threshold, mode='soft'),
            pywt.threshold(hl, threshold, mode='soft'),
            pywt.threshold(hh, threshold, mode='soft')
        ))
    
    wavelet_result = pywt.waverec2(thresholded, wavelet)
    wavelet_result = np.clip(wavelet_result[:h, :w], 0, 255)
    
    # Metrics
    mse_dct = np.mean((img_array - dct_result) ** 2)
    mse_wav = np.mean((img_array - wavelet_result) ** 2)
    psnr_dct = 10 * np.log10(255**2 / mse_dct) if mse_dct > 0 else float('inf')
    psnr_wav = 10 * np.log10(255**2 / mse_wav) if mse_wav > 0 else float('inf')
    
    return {
        "success": True,
        "image_id": image_id,
        "original": image_to_base64(normalize_for_display(img_array)),
        "dct_result": image_to_base64(normalize_for_display(dct_result)),
        "wavelet_result": image_to_base64(normalize_for_display(wavelet_result)),
        "quality": quality,
        "metrics": {
            "dct": {"mse": float(mse_dct), "psnr": float(psnr_dct)},
            "wavelet": {"mse": float(mse_wav), "psnr": float(psnr_wav)}
        }
    }


@app.get("/api/denoise-sample/{image_id}")
async def denoise_sample_image(
    image_id: str,
    wavelet: str = "db4",
    levels: int = 4,
    threshold: Optional[float] = None,
    mode: str = "soft",
    add_noise: bool = True,
    noise_sigma: float = 25
):
    """Denoise a sample image without upload"""
    img_path = TEST_IMAGES_DIR / f"{image_id}.png"
    if not img_path.exists():
        raise HTTPException(status_code=404, detail=f"Image {image_id} not found")
    
    img = Image.open(img_path).convert('L')
    img_array = np.array(img, dtype=np.float64)
    original = img_array.copy()
    
    # Add noise if requested
    if add_noise:
        np.random.seed(42)
        noise = np.random.normal(0, noise_sigma, img_array.shape)
        img_array = np.clip(img_array + noise, 0, 255)
    
    # Decompose
    coeffs = pywt.wavedec2(img_array, wavelet, level=levels)
    
    # Estimate noise and compute threshold if not provided
    hh = coeffs[-1][2]  # Finest HH
    sigma = np.median(np.abs(hh)) / 0.6745
    if threshold is None:
        threshold = sigma * np.sqrt(2 * np.log(img_array.size))
    
    # Threshold detail coefficients
    thresholded = [coeffs[0]]
    for lh, hl, hh in coeffs[1:]:
        thresholded.append((
            pywt.threshold(lh, threshold, mode=mode),
            pywt.threshold(hl, threshold, mode=mode),
            pywt.threshold(hh, threshold, mode=mode)
        ))
    
    # Reconstruct
    denoised = pywt.waverec2(thresholded, wavelet)
    denoised = np.clip(denoised[:img_array.shape[0], :img_array.shape[1]], 0, 255)
    
    # Calculate metrics
    if add_noise:
        snr_before = 10 * np.log10(np.mean(original**2) / np.mean((original - img_array)**2))
        snr_after = 10 * np.log10(np.mean(original**2) / np.mean((original - denoised)**2))
    else:
        snr_before = None
        snr_after = None
    
    return {
        "success": True,
        "image_id": image_id,
        "original": image_to_base64(normalize_for_display(original)),
        "noisy": image_to_base64(normalize_for_display(img_array)) if add_noise else None,
        "denoised": image_to_base64(normalize_for_display(denoised)),
        "estimated_sigma": float(sigma),
        "threshold_used": float(threshold),
        "snr_before": float(snr_before) if snr_before else None,
        "snr_after": float(snr_after) if snr_after else None,
        "snr_improvement": float(snr_after - snr_before) if snr_before else None
    }


# ============================================================================
# Image Kernels / Convolution API
# ============================================================================

# Predefined kernels
KERNELS = {
    "identity": {
        "name": "Identity",
        "description": "No change - passes through the original image",
        "matrix": [[0, 0, 0], [0, 1, 0], [0, 0, 0]]
    },
    "blur_box": {
        "name": "Box Blur",
        "description": "Simple averaging blur - each pixel becomes average of neighbors",
        "matrix": [[1/9, 1/9, 1/9], [1/9, 1/9, 1/9], [1/9, 1/9, 1/9]]
    },
    "blur_gaussian": {
        "name": "Gaussian Blur",
        "description": "Weighted blur - center pixels have more influence (σ≈1)",
        "matrix": [[1/16, 2/16, 1/16], [2/16, 4/16, 2/16], [1/16, 2/16, 1/16]]
    },
    "sharpen": {
        "name": "Sharpen",
        "description": "Enhances edges by amplifying differences from neighbors",
        "matrix": [[0, -1, 0], [-1, 5, -1], [0, -1, 0]]
    },
    "sharpen_strong": {
        "name": "Strong Sharpen",
        "description": "More aggressive sharpening with diagonal neighbors",
        "matrix": [[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]]
    },
    "edge_laplacian": {
        "name": "Laplacian Edge",
        "description": "Detects edges in all directions using second derivative",
        "matrix": [[0, -1, 0], [-1, 4, -1], [0, -1, 0]]
    },
    "edge_laplacian_diag": {
        "name": "Laplacian (Diagonal)",
        "description": "Laplacian including diagonal neighbors",
        "matrix": [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]]
    },
    "edge_sobel_x": {
        "name": "Sobel X (Vertical edges)",
        "description": "Detects vertical edges using horizontal gradient",
        "matrix": [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
    },
    "edge_sobel_y": {
        "name": "Sobel Y (Horizontal edges)",
        "description": "Detects horizontal edges using vertical gradient",
        "matrix": [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
    },
    "edge_prewitt_x": {
        "name": "Prewitt X",
        "description": "Simpler vertical edge detection",
        "matrix": [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]]
    },
    "edge_prewitt_y": {
        "name": "Prewitt Y",
        "description": "Simpler horizontal edge detection",
        "matrix": [[-1, -1, -1], [0, 0, 0], [1, 1, 1]]
    },
    "emboss": {
        "name": "Emboss",
        "description": "Creates 3D shadow effect - highlights edges with direction",
        "matrix": [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]]
    },
    "emboss_strong": {
        "name": "Strong Emboss",
        "description": "More pronounced emboss effect",
        "matrix": [[-2, -2, 0], [-2, 6, 0], [0, 0, 0]]
    },
    "outline": {
        "name": "Outline",
        "description": "Extracts object outlines",
        "matrix": [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]]
    }
}


@app.get("/api/kernels")
async def list_kernels():
    """List all available convolution kernels"""
    return {
        "kernels": [
            {"id": k, "name": v["name"], "description": v["description"]}
            for k, v in KERNELS.items()
        ]
    }


@app.get("/api/kernels/{kernel_id}")
async def get_kernel(kernel_id: str):
    """Get details of a specific kernel"""
    if kernel_id not in KERNELS:
        raise HTTPException(status_code=404, detail=f"Kernel {kernel_id} not found")
    
    kernel = KERNELS[kernel_id]
    return {
        "id": kernel_id,
        "name": kernel["name"],
        "description": kernel["description"],
        "matrix": kernel["matrix"],
        "size": len(kernel["matrix"])
    }


@app.get("/api/kernels/apply/{image_id}")
async def apply_kernel_to_image(
    image_id: str,
    kernel_id: str = "blur_gaussian",
    strength: float = 1.0,
    grayscale: bool = False,
    kernel_size: int = 3
):
    """
    Apply a convolution kernel to a sample image (color or grayscale).
    Strength interpolates between original (0) and full kernel effect (1+).
    kernel_size: 3, 4, or 5 - will resize kernel accordingly
    """
    from scipy.ndimage import convolve
    
    # Validate kernel
    if kernel_id not in KERNELS:
        raise HTTPException(status_code=404, detail=f"Kernel {kernel_id} not found")
    
    # Load image
    img_path = TEST_IMAGES_DIR / f"{image_id}.png"
    if not img_path.exists():
        raise HTTPException(status_code=404, detail=f"Image {image_id} not found")
    
    # Load as color or grayscale
    if grayscale:
        img = Image.open(img_path).convert('L')
        img_array = np.array(img, dtype=np.float64)
        is_color = False
    else:
        img = Image.open(img_path).convert('RGB')
        img_array = np.array(img, dtype=np.float64)
        is_color = True
    
    # Get kernel matrix and resize if needed
    kernel_data = KERNELS[kernel_id]
    base_matrix = np.array(kernel_data["matrix"], dtype=np.float64)
    
    # Resize kernel if requested
    if kernel_size != 3:
        kernel_matrix = resize_kernel(base_matrix, kernel_size)
    else:
        kernel_matrix = base_matrix
    
    # Apply convolution
    if is_color:
        # Apply to each channel
        result_channels = []
        for c in range(3):
            convolved = convolve(img_array[:,:,c], kernel_matrix, mode='reflect')
            
            # For edge detection kernels, take absolute value and normalize
            if 'edge' in kernel_id or 'laplacian' in kernel_id or kernel_id == 'outline':
                convolved = np.abs(convolved)
                if convolved.max() > 0:
                    convolved = convolved / convolved.max() * 255
            
            # Interpolate with original based on strength
            if strength != 1.0:
                channel_result = img_array[:,:,c] * (1 - strength) + convolved * strength
            else:
                channel_result = convolved
            
            result_channels.append(np.clip(channel_result, 0, 255))
        
        result = np.stack(result_channels, axis=2).astype(np.uint8)
        original_display = img_array.astype(np.uint8)
    else:
        convolved = convolve(img_array, kernel_matrix, mode='reflect')
        
        # For edge detection kernels, take absolute value and normalize
        if 'edge' in kernel_id or 'laplacian' in kernel_id or kernel_id == 'outline':
            convolved = np.abs(convolved)
            if convolved.max() > 0:
                convolved = convolved / convolved.max() * 255
        
        # Interpolate with original based on strength
        if strength != 1.0:
            result = img_array * (1 - strength) + convolved * strength
        else:
            result = convolved
        
        result = np.clip(result, 0, 255).astype(np.uint8)
        original_display = normalize_for_display(img_array)
    
    return {
        "success": True,
        "image_id": image_id,
        "kernel_id": kernel_id,
        "kernel_name": kernel_data["name"],
        "kernel_matrix": kernel_matrix.tolist(),
        "kernel_size": kernel_size,
        "strength": strength,
        "is_color": is_color,
        "original": image_to_base64(original_display),
        "result": image_to_base64(result),
        "shape": list(img_array.shape)
    }


def resize_kernel(kernel: np.ndarray, new_size: int) -> np.ndarray:
    """Resize a 3x3 kernel to a larger size while preserving behavior"""
    if new_size == 3:
        return kernel
    
    # For blur kernels, create uniform or gaussian distribution
    center_val = kernel[1, 1]
    edge_val = kernel[0, 1] if kernel[0, 1] != 0 else kernel[1, 0]
    corner_val = kernel[0, 0]
    
    # Check if it's an averaging kernel (blur)
    is_blur = np.allclose(kernel.sum(), 1.0)
    
    # Check if it's an edge detection kernel
    is_edge = np.allclose(kernel.sum(), 0.0)
    
    if is_blur:
        # Create larger blur kernel
        if np.allclose(kernel, kernel[0, 0]):  # Box blur
            return np.ones((new_size, new_size)) / (new_size * new_size)
        else:  # Gaussian-like
            from scipy.ndimage import zoom
            sigma = new_size / 3.0
            ax = np.linspace(-(new_size - 1) / 2., (new_size - 1) / 2., new_size)
            gauss = np.exp(-0.5 * np.square(ax) / np.square(sigma))
            kernel_2d = np.outer(gauss, gauss)
            return kernel_2d / kernel_2d.sum()
    elif is_edge:
        # Scale edge detection kernel
        new_kernel = np.zeros((new_size, new_size))
        center = new_size // 2
        
        # Copy pattern from 3x3 kernel scaled
        for i in range(3):
            for j in range(3):
                # Map 3x3 positions to larger kernel
                ni = int(i * (new_size - 1) / 2)
                nj = int(j * (new_size - 1) / 2)
                new_kernel[ni, nj] = kernel[i, j]
        
        # Fill center
        new_kernel[center, center] = -new_kernel.sum() + kernel[1, 1]
        return new_kernel
    else:
        # For other kernels (sharpen, emboss), use interpolation
        from scipy.ndimage import zoom
        scale = new_size / 3.0
        new_kernel = zoom(kernel, scale, order=1)
        # Ensure it's the right size
        new_kernel = new_kernel[:new_size, :new_size]
        return new_kernel


@app.get("/api/kernels/apply-custom/{image_id}")
async def apply_custom_kernel(
    image_id: str,
    k00: float = 0, k01: float = 0, k02: float = 0,
    k10: float = 0, k11: float = 1, k12: float = 0,
    k20: float = 0, k21: float = 0, k22: float = 0
):
    """Apply a custom 3x3 kernel to an image"""
    from scipy.ndimage import convolve
    
    # Load image
    img_path = TEST_IMAGES_DIR / f"{image_id}.png"
    if not img_path.exists():
        raise HTTPException(status_code=404, detail=f"Image {image_id} not found")
    
    img = Image.open(img_path).convert('L')
    img_array = np.array(img, dtype=np.float64)
    
    # Build kernel from parameters
    kernel_matrix = np.array([
        [k00, k01, k02],
        [k10, k11, k12],
        [k20, k21, k22]
    ], dtype=np.float64)
    
    # Apply convolution
    result = convolve(img_array, kernel_matrix, mode='reflect')
    result = np.clip(result, 0, 255)
    
    return {
        "success": True,
        "image_id": image_id,
        "kernel_matrix": kernel_matrix.tolist(),
        "original": image_to_base64(normalize_for_display(img_array)),
        "result": image_to_base64(normalize_for_display(result)),
        "shape": list(img_array.shape)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
