#!/usr/bin/env python3
"""
Generate small educational test images for kernel visualization.
These images are designed to clearly show the effects of various kernels.
"""

import numpy as np
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Installing Pillow...")
    import subprocess
    subprocess.check_call(["pip", "install", "Pillow"])
    from PIL import Image


def create_checkerboard(size: int, square_size: int = 8) -> np.ndarray:
    """Create a black and white checkerboard pattern."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    for i in range(size):
        for j in range(size):
            if ((i // square_size) + (j // square_size)) % 2 == 0:
                img[i, j] = [255, 255, 255]
            else:
                img[i, j] = [0, 0, 0]
    return img


def create_vertical_edges(size: int, stripe_width: int = 16) -> np.ndarray:
    """Create vertical stripes - good for showing horizontal edge detection."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    for j in range(size):
        if (j // stripe_width) % 2 == 0:
            img[:, j] = [255, 255, 255]
        else:
            img[:, j] = [0, 0, 0]
    return img


def create_horizontal_edges(size: int, stripe_width: int = 16) -> np.ndarray:
    """Create horizontal stripes - good for showing vertical edge detection."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    for i in range(size):
        if (i // stripe_width) % 2 == 0:
            img[i, :] = [255, 255, 255]
        else:
            img[i, :] = [0, 0, 0]
    return img


def create_diagonal_edges(size: int) -> np.ndarray:
    """Create diagonal pattern - good for showing diagonal edge detection."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    for i in range(size):
        for j in range(size):
            if ((i + j) // 16) % 2 == 0:
                img[i, j] = [255, 255, 255]
    return img


def create_gradient_horizontal(size: int) -> np.ndarray:
    """Create horizontal gradient - good for showing blur and sharpen effects."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    for j in range(size):
        val = int(255 * j / (size - 1))
        img[:, j] = [val, val, val]
    return img


def create_gradient_vertical(size: int) -> np.ndarray:
    """Create vertical gradient."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    for i in range(size):
        val = int(255 * i / (size - 1))
        img[i, :] = [val, val, val]
    return img


def create_single_pixel(size: int) -> np.ndarray:
    """Create single white pixel on black - perfect for showing kernel response."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    center = size // 2
    img[center, center] = [255, 255, 255]
    return img


def create_small_square(size: int, square_size: int = 16) -> np.ndarray:
    """Create a small white square in center - good for edge detection demo."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    center = size // 2
    half = square_size // 2
    img[center-half:center+half, center-half:center+half] = [255, 255, 255]
    return img


def create_circle(size: int, radius: int = None) -> np.ndarray:
    """Create a white circle - good for edge detection on curves."""
    if radius is None:
        radius = size // 4
    img = np.zeros((size, size, 3), dtype=np.uint8)
    center = size // 2
    for i in range(size):
        for j in range(size):
            if (i - center)**2 + (j - center)**2 <= radius**2:
                img[i, j] = [255, 255, 255]
    return img


def create_noise(size: int, density: float = 0.3) -> np.ndarray:
    """Create salt and pepper noise - good for showing blur/smoothing effects."""
    img = np.full((size, size, 3), 128, dtype=np.uint8)  # Gray background
    noise = np.random.random((size, size))
    img[noise < density/2] = [0, 0, 0]  # Pepper
    img[noise > 1 - density/2] = [255, 255, 255]  # Salt
    return img


def create_simple_face(size: int) -> np.ndarray:
    """Create a simple smiley face - recognizable pattern for demos."""
    img = np.full((size, size, 3), 255, dtype=np.uint8)  # White background
    center = size // 2
    
    # Face circle (yellow)
    for i in range(size):
        for j in range(size):
            dist = np.sqrt((i - center)**2 + (j - center)**2)
            if dist <= size * 0.4:
                img[i, j] = [255, 220, 100]  # Yellow
    
    # Eyes (black)
    eye_y = center - size // 8
    eye_x_left = center - size // 6
    eye_x_right = center + size // 6
    eye_radius = size // 16
    
    for i in range(size):
        for j in range(size):
            if (i - eye_y)**2 + (j - eye_x_left)**2 <= eye_radius**2:
                img[i, j] = [0, 0, 0]
            if (i - eye_y)**2 + (j - eye_x_right)**2 <= eye_radius**2:
                img[i, j] = [0, 0, 0]
    
    # Smile (arc)
    smile_center_y = center + size // 8
    for j in range(center - size // 5, center + size // 5):
        y_offset = int(((j - center) / (size // 5))**2 * (size // 10))
        y = smile_center_y + y_offset
        if 0 <= y < size:
            img[y, j] = [0, 0, 0]
            if y + 1 < size:
                img[y+1, j] = [0, 0, 0]
    
    return img


def create_text_pattern(size: int) -> np.ndarray:
    """Create a simple 'T' pattern - clear edges for demonstration."""
    img = np.full((size, size, 3), 255, dtype=np.uint8)  # White background
    
    # Draw T
    bar_width = max(4, size // 16)
    center = size // 2
    
    # Horizontal bar of T
    top = size // 4
    img[top:top+bar_width, size//4:3*size//4] = [0, 0, 0]
    
    # Vertical bar of T
    img[top:3*size//4, center-bar_width//2:center+bar_width//2] = [0, 0, 0]
    
    return img


def main():
    output_dir = Path(__file__).parent.parent / "data" / "educational_images"
    output_dir.mkdir(exist_ok=True)
    
    # Define images to generate
    generators = {
        # Perfect for showing kernel effects
        "checkerboard": create_checkerboard,
        "vertical_stripes": create_vertical_edges,
        "horizontal_stripes": create_horizontal_edges,
        "diagonal_stripes": create_diagonal_edges,
        "gradient_h": create_gradient_horizontal,
        "gradient_v": create_gradient_vertical,
        "single_pixel": create_single_pixel,
        "small_square": create_small_square,
        "circle": create_circle,
        "noise": create_noise,
        "smiley": create_simple_face,
        "letter_t": create_text_pattern,
    }
    
    sizes = [64, 128]
    
    print(f"Generating educational images in {output_dir}")
    
    for name, generator in generators.items():
        for size in sizes:
            img_array = generator(size)
            img = Image.fromarray(img_array, mode='RGB')
            filename = f"{name}_{size}.png"
            img.save(output_dir / filename)
            print(f"  Created: {filename}")
    
    # Also create a metadata file
    metadata = {
        "checkerboard": "Checkerboard pattern - shows blur and edge effects clearly",
        "vertical_stripes": "Vertical stripes - highlights horizontal edge detection (Sobel X)",
        "horizontal_stripes": "Horizontal stripes - highlights vertical edge detection (Sobel Y)",
        "diagonal_stripes": "Diagonal stripes - shows combined edge detection",
        "gradient_h": "Horizontal gradient - perfect for visualizing blur and sharpen",
        "gradient_v": "Vertical gradient - shows vertical processing effects",
        "single_pixel": "Single pixel - reveals kernel impulse response",
        "small_square": "Small square - clean edges for detection demos",
        "circle": "Circle - curved edges for edge detection",
        "noise": "Salt & pepper noise - demonstrates smoothing filters",
        "smiley": "Simple face - recognizable pattern for demos",
        "letter_t": "Letter T - clear sharp edges"
    }
    
    # Write descriptions to a simple text file
    with open(output_dir / "README.md", "w") as f:
        f.write("# Educational Test Images\n\n")
        f.write("Small images designed for kernel convolution visualization.\n\n")
        f.write("## Images\n\n")
        for name, desc in metadata.items():
            f.write(f"- **{name}**: {desc}\n")
        f.write("\n## Sizes\n\n")
        f.write("Each image is available in 64x64 and 128x128 pixels.\n")
        f.write("Small sizes allow pixel-level visualization of kernel effects.\n")
    
    print(f"\nGenerated {len(generators) * len(sizes)} images")
    print(f"Output directory: {output_dir}")


if __name__ == "__main__":
    main()
