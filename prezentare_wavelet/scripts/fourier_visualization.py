"""
Fourier Frequency Visualization

This script demonstrates how an image is composed of different frequency components
by decomposing it using 2D FFT and showing the magnitude spectrum.
Also shows the 2D DCT basis functions that make up any 8x8 block.
"""

import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from pathlib import Path
from scipy.fftpack import dct, idct

# Path to test images (relative to scripts/ -> prezentare_wavelet -> data)
IMAGES_DIR = Path(__file__).parent.parent / "data" / "standard_test_images"


def generate_dct_basis(N: int = 8) -> np.ndarray:
    """
    Generate all N×N 2D DCT basis functions.
    
    Each basis function B(u,v) represents a specific frequency component.
    The top-left (0,0) is the DC component (constant).
    Moving right increases horizontal frequency.
    Moving down increases vertical frequency.
    
    Returns:
        basis: Array of shape (N, N, N, N) where basis[u, v] is the (u,v) basis image
    """
    basis = np.zeros((N, N, N, N))
    
    for u in range(N):
        for v in range(N):
            # Create basis function for frequency (u, v)
            for x in range(N):
                for y in range(N):
                    # DCT-II basis function formula
                    basis[u, v, x, y] = (
                        np.cos((2*x + 1) * u * np.pi / (2*N)) *
                        np.cos((2*y + 1) * v * np.pi / (2*N))
                    )
    
    return basis


def visualize_dct_basis(N: int = 8):
    """
    Visualize the NxN DCT basis functions as a grid.
    
    This shows the "building blocks" that combine to form any image block.
    """
    basis = generate_dct_basis(N)
    
    fig, axes = plt.subplots(N, N, figsize=(10, 10))
    fig.suptitle(f"{N}×{N} DCT Basis Functions\n(Building blocks of image compression)", 
                 fontsize=14, fontweight='bold')
    
    for u in range(N):
        for v in range(N):
            ax = axes[u, v]
            # Normalize to [0, 1] for display
            b = basis[u, v]
            b_norm = (b - b.min()) / (b.max() - b.min() + 1e-10)
            ax.imshow(b_norm, cmap='gray', interpolation='nearest')
            ax.axis('off')
    
    # Add frequency labels
    fig.text(0.5, 0.02, 'Horizontal Frequency →', ha='center', fontsize=12)
    fig.text(0.02, 0.5, '← Vertical Frequency', va='center', rotation='vertical', fontsize=12)
    
    plt.tight_layout(rect=[0.03, 0.03, 1, 0.95])
    return fig


def decompose_block_into_basis(block: np.ndarray, N: int = 8):
    """
    Show how a single block is decomposed into DCT basis functions.
    
    Args:
        block: An NxN image block
        N: Block size
    
    Returns:
        coefficients: DCT coefficients
        weighted_basis: Each basis function scaled by its coefficient
    """
    # Compute 2D DCT
    coefficients = dct(dct(block.T, norm='ortho').T, norm='ortho')
    
    # Get basis functions
    basis = generate_dct_basis(N)
    
    # Weight each basis by its coefficient
    weighted_basis = np.zeros((N, N, N, N))
    for u in range(N):
        for v in range(N):
            weighted_basis[u, v] = coefficients[u, v] * basis[u, v]
    
    return coefficients, weighted_basis


def visualize_block_decomposition(image: np.ndarray, block_x: int = 0, block_y: int = 0, N: int = 8):
    """
    Visualize how a specific block from the image decomposes into basis functions.
    """
    # Extract block
    y_start = block_y * N
    x_start = block_x * N
    block = image[y_start:y_start+N, x_start:x_start+N].copy()
    
    # Shift to center around zero (standard DCT preprocessing)
    block_shifted = block - 128
    
    # Decompose
    coefficients, weighted_basis = decompose_block_into_basis(block_shifted, N)
    
    # Create visualization
    fig = plt.figure(figsize=(16, 8))
    
    # Left side: Original block (enlarged)
    ax_orig = fig.add_subplot(1, 3, 1)
    ax_orig.imshow(block, cmap='gray', interpolation='nearest', vmin=0, vmax=255)
    ax_orig.set_title(f"Original Block\n(position {block_x}, {block_y})", fontsize=12)
    ax_orig.axis('off')
    
    # Middle: DCT coefficients
    ax_coef = fig.add_subplot(1, 3, 2)
    # Log scale for better visualization
    coef_display = np.log1p(np.abs(coefficients))
    im = ax_coef.imshow(coef_display, cmap='hot', interpolation='nearest')
    ax_coef.set_title("DCT Coefficients\n(log magnitude)", fontsize=12)
    ax_coef.axis('off')
    plt.colorbar(im, ax=ax_coef, fraction=0.046)
    
    # Right: Weighted basis functions grid
    ax_basis = fig.add_subplot(1, 3, 3)
    
    # Create a composite image showing all weighted basis
    # Arrange in a grid with small gaps
    gap = 1
    composite = np.ones(((N + gap) * N - gap, (N + gap) * N - gap)) * 0.5  # gray background
    
    for u in range(N):
        for v in range(N):
            wb = weighted_basis[u, v]
            # Normalize for display
            wb_norm = (wb - wb.min()) / (wb.max() - wb.min() + 1e-10)
            y_pos = u * (N + gap)
            x_pos = v * (N + gap)
            composite[y_pos:y_pos+N, x_pos:x_pos+N] = wb_norm
    
    ax_basis.imshow(composite, cmap='gray', interpolation='nearest')
    ax_basis.set_title("Weighted Basis Functions\n(coefficient × basis)", fontsize=12)
    ax_basis.axis('off')
    
    fig.suptitle("Block Decomposition into DCT Basis Functions", fontsize=14, fontweight='bold')
    plt.tight_layout()
    return fig


def visualize_progressive_basis_reconstruction(image: np.ndarray, block_x: int = 5, block_y: int = 5, N: int = 8):
    """
    Show progressive reconstruction by adding basis functions in zigzag order.
    """
    # Extract block
    y_start = block_y * N
    x_start = block_x * N
    block = image[y_start:y_start+N, x_start:x_start+N].copy()
    block_shifted = block - 128
    
    # Compute DCT
    coefficients = dct(dct(block_shifted.T, norm='ortho').T, norm='ortho')
    basis = generate_dct_basis(N)
    
    # Zigzag order for 8x8
    zigzag_order = [
        (0,0), (0,1), (1,0), (2,0), (1,1), (0,2), (0,3), (1,2),
        (2,1), (3,0), (4,0), (3,1), (2,2), (1,3), (0,4), (0,5),
        (1,4), (2,3), (3,2), (4,1), (5,0), (6,0), (5,1), (4,2),
        (3,3), (2,4), (1,5), (0,6), (0,7), (1,6), (2,5), (3,4),
        (4,3), (5,2), (6,1), (7,0), (7,1), (6,2), (5,3), (4,4),
        (3,5), (2,6), (1,7), (2,7), (3,6), (4,5), (5,4), (6,3),
        (7,2), (7,3), (6,4), (5,5), (4,6), (3,7), (4,7), (5,6),
        (6,5), (7,4), (7,5), (6,6), (5,7), (6,7), (7,6), (7,7)
    ]
    
    # Show reconstruction at different stages
    stages = [1, 3, 6, 10, 15, 21, 36, 64]  # Number of coefficients to include
    
    fig, axes = plt.subplots(2, len(stages), figsize=(16, 5))
    fig.suptitle("Progressive Reconstruction by Adding Basis Functions (Zigzag Order)", 
                 fontsize=14, fontweight='bold')
    
    for idx, num_coef in enumerate(stages):
        # Reconstruct with first num_coef coefficients
        reconstruction = np.zeros((N, N))
        for i in range(min(num_coef, len(zigzag_order))):
            u, v = zigzag_order[i]
            reconstruction += coefficients[u, v] * basis[u, v]
        
        # Add back the 128 offset
        reconstruction += 128
        
        # Show reconstruction
        axes[0, idx].imshow(reconstruction, cmap='gray', vmin=0, vmax=255, interpolation='nearest')
        axes[0, idx].set_title(f"{num_coef} coef{'s' if num_coef > 1 else ''}")
        axes[0, idx].axis('off')
        
        # Show which coefficients are included
        mask = np.zeros((N, N))
        for i in range(min(num_coef, len(zigzag_order))):
            u, v = zigzag_order[i]
            mask[u, v] = 1
        axes[1, idx].imshow(mask, cmap='Blues', interpolation='nearest', vmin=0, vmax=1)
        axes[1, idx].set_title("Used coeffs")
        axes[1, idx].axis('off')
    
    plt.tight_layout()
    return fig


def load_image(name: str = "baboon_512.png") -> np.ndarray:
    """Load an image as grayscale numpy array"""
    img_path = IMAGES_DIR / name
    img = Image.open(img_path).convert('L')
    return np.array(img, dtype=np.float64)


def compute_fft(image: np.ndarray) -> tuple:
    """
    Compute 2D FFT of an image.
    
    Returns:
        fft_shifted: Complex FFT with zero frequency centered
        magnitude: Log-scaled magnitude spectrum for visualization
        phase: Phase spectrum
    """
    # 2D FFT
    fft = np.fft.fft2(image)
    
    # Shift zero frequency to center
    fft_shifted = np.fft.fftshift(fft)
    
    # Magnitude spectrum (log scale for better visualization)
    magnitude = np.log1p(np.abs(fft_shifted))
    
    # Phase spectrum
    phase = np.angle(fft_shifted)
    
    return fft_shifted, magnitude, phase


def create_frequency_mask(shape: tuple, freq_range: tuple, mask_type: str = "band") -> np.ndarray:
    """
    Create a frequency mask for filtering.
    
    Args:
        shape: Image shape (height, width)
        freq_range: (low, high) frequency range as fraction of max frequency (0-1)
        mask_type: "low", "high", or "band"
    
    Returns:
        mask: Binary mask array
    """
    rows, cols = shape
    center_row, center_col = rows // 2, cols // 2
    
    # Create distance matrix from center
    y, x = np.ogrid[:rows, :cols]
    distance = np.sqrt((x - center_col)**2 + (y - center_row)**2)
    
    # Normalize distance (max distance is half the diagonal)
    max_dist = np.sqrt(center_row**2 + center_col**2)
    distance_norm = distance / max_dist
    
    low, high = freq_range
    
    if mask_type == "low":
        mask = distance_norm <= high
    elif mask_type == "high":
        mask = distance_norm >= low
    else:  # band
        mask = (distance_norm >= low) & (distance_norm <= high)
    
    return mask.astype(np.float64)


def reconstruct_from_frequencies(fft_shifted: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """
    Reconstruct image from selected frequency components.
    
    Args:
        fft_shifted: Shifted FFT of original image
        mask: Frequency mask (1 = keep, 0 = remove)
    
    Returns:
        Reconstructed image
    """
    # Apply mask
    filtered_fft = fft_shifted * mask
    
    # Inverse shift and FFT
    fft_unshifted = np.fft.ifftshift(filtered_fft)
    reconstructed = np.fft.ifft2(fft_unshifted)
    
    return np.real(reconstructed)


def visualize_frequency_decomposition(image: np.ndarray, num_bands: int = 5):
    """
    Decompose and visualize image by frequency bands.
    
    Shows how different frequency ranges contribute to the image.
    """
    fft_shifted, magnitude, phase = compute_fft(image)
    
    # Create frequency bands
    bands = []
    band_labels = []
    
    for i in range(num_bands):
        low = i / num_bands
        high = (i + 1) / num_bands
        
        mask = create_frequency_mask(image.shape, (low, high), "band")
        reconstructed = reconstruct_from_frequencies(fft_shifted, mask)
        
        bands.append(reconstructed)
        if i == 0:
            band_labels.append(f"DC + Very Low\n(0-{high:.0%})")
        elif i == num_bands - 1:
            band_labels.append(f"High Freq\n({low:.0%}-100%)")
        else:
            band_labels.append(f"Band {i+1}\n({low:.0%}-{high:.0%})")
    
    # Visualization
    fig, axes = plt.subplots(2, num_bands + 1, figsize=(16, 7))
    fig.suptitle("Fourier Frequency Decomposition of Image", fontsize=14, fontweight='bold')
    
    # Top row: Original, Magnitude Spectrum, then frequency bands
    axes[0, 0].imshow(image, cmap='gray')
    axes[0, 0].set_title("Original Image")
    axes[0, 0].axis('off')
    
    axes[1, 0].imshow(magnitude, cmap='hot')
    axes[1, 0].set_title("Magnitude Spectrum\n(log scale)")
    axes[1, 0].axis('off')
    
    # Frequency bands
    for i, (band, label) in enumerate(zip(bands, band_labels)):
        # Show the band contribution
        ax = axes[0, i + 1]
        # Normalize each band for display
        band_norm = band - band.min()
        if band_norm.max() > 0:
            band_norm = band_norm / band_norm.max() * 255
        ax.imshow(band_norm, cmap='gray')
        ax.set_title(label)
        ax.axis('off')
        
        # Show the mask
        mask = create_frequency_mask(image.shape, (i/num_bands, (i+1)/num_bands), "band")
        axes[1, i + 1].imshow(mask, cmap='gray')
        axes[1, i + 1].set_title(f"Mask {i+1}")
        axes[1, i + 1].axis('off')
    
    plt.tight_layout()
    return fig


def visualize_progressive_reconstruction(image: np.ndarray):
    """
    Show progressive reconstruction by adding frequency bands one by one.
    """
    fft_shifted, magnitude, _ = compute_fft(image)
    
    num_steps = 6
    fig, axes = plt.subplots(2, num_steps, figsize=(15, 6))
    fig.suptitle("Progressive Reconstruction: Adding Frequency Bands", fontsize=14, fontweight='bold')
    
    for i in range(num_steps):
        # Cumulative frequency range
        freq_cutoff = (i + 1) / num_steps
        mask = create_frequency_mask(image.shape, (0, freq_cutoff), "low")
        
        reconstructed = reconstruct_from_frequencies(fft_shifted, mask)
        
        # Show reconstruction
        axes[0, i].imshow(reconstructed, cmap='gray', vmin=0, vmax=255)
        axes[0, i].set_title(f"0-{freq_cutoff:.0%} freq")
        axes[0, i].axis('off')
        
        # Show mask
        axes[1, i].imshow(mask, cmap='gray')
        axes[1, i].set_title(f"Low-pass {freq_cutoff:.0%}")
        axes[1, i].axis('off')
    
    plt.tight_layout()
    return fig


def visualize_frequency_importance(image: np.ndarray):
    """
    Show what happens when we remove low vs high frequencies.
    """
    fft_shifted, magnitude, _ = compute_fft(image)
    
    fig, axes = plt.subplots(2, 4, figsize=(14, 7))
    fig.suptitle("Frequency Importance: Low vs High Frequencies", fontsize=14, fontweight='bold')
    
    # Original and spectrum
    axes[0, 0].imshow(image, cmap='gray')
    axes[0, 0].set_title("Original")
    axes[0, 0].axis('off')
    
    axes[1, 0].imshow(magnitude, cmap='hot')
    axes[1, 0].set_title("Frequency Spectrum")
    axes[1, 0].axis('off')
    
    # Low frequencies only (structure/brightness)
    low_mask = create_frequency_mask(image.shape, (0, 0.1), "low")
    low_freq = reconstruct_from_frequencies(fft_shifted, low_mask)
    axes[0, 1].imshow(low_freq, cmap='gray', vmin=0, vmax=255)
    axes[0, 1].set_title("Low Freq Only (0-10%)\nStructure & Brightness")
    axes[0, 1].axis('off')
    axes[1, 1].imshow(low_mask, cmap='gray')
    axes[1, 1].set_title("Low-pass Mask")
    axes[1, 1].axis('off')
    
    # Mid frequencies (main details)
    mid_mask = create_frequency_mask(image.shape, (0, 0.3), "low")
    mid_freq = reconstruct_from_frequencies(fft_shifted, mid_mask)
    axes[0, 2].imshow(mid_freq, cmap='gray', vmin=0, vmax=255)
    axes[0, 2].set_title("Low+Mid Freq (0-30%)\nMain Details")
    axes[0, 2].axis('off')
    axes[1, 2].imshow(mid_mask, cmap='gray')
    axes[1, 2].set_title("Low+Mid Mask")
    axes[1, 2].axis('off')
    
    # High frequencies only (edges/texture)
    high_mask = create_frequency_mask(image.shape, (0.3, 1.0), "band")
    high_freq = reconstruct_from_frequencies(fft_shifted, high_mask)
    # Normalize for display
    high_freq_norm = high_freq - high_freq.min()
    high_freq_norm = high_freq_norm / high_freq_norm.max() * 255
    axes[0, 3].imshow(high_freq_norm, cmap='gray')
    axes[0, 3].set_title("High Freq Only (30-100%)\nEdges & Texture")
    axes[0, 3].axis('off')
    axes[1, 3].imshow(high_mask, cmap='gray')
    axes[1, 3].set_title("High-pass Mask")
    axes[1, 3].axis('off')
    
    plt.tight_layout()
    return fig


def main():
    """Main visualization demo"""
    print("Loading baboon image...")
    image = load_image("baboon_512.png")
    print(f"Image shape: {image.shape}")
    
    print("\n1. DCT Basis Functions (8×8)")
    print("   The building blocks that combine to form any image block")
    fig0 = visualize_dct_basis(N=8)
    
    print("\n2. Block Decomposition into Basis")
    print("   How a single 8×8 block is represented as weighted sum of basis functions")
    fig1 = visualize_block_decomposition(image, block_x=12, block_y=10)
    
    print("\n3. Progressive Basis Reconstruction")
    print("   Adding basis functions one by one in zigzag order")
    fig2 = visualize_progressive_basis_reconstruction(image, block_x=12, block_y=10)
    
    print("\n4. Frequency Band Decomposition (whole image)")
    print("   Shows how different frequency ranges contribute to the image")
    fig3 = visualize_frequency_decomposition(image, num_bands=5)
    
    print("\n5. Progressive Reconstruction (whole image)")
    print("   Shows how the image builds up as we add more frequencies")
    fig4 = visualize_progressive_reconstruction(image)
    
    print("\n6. Frequency Importance")
    print("   Shows what low vs high frequencies contain")
    fig5 = visualize_frequency_importance(image)
    
    plt.show()


if __name__ == "__main__":
    main()
