#!/usr/bin/env python3
"""
Generate synthetic test images for JPEG encoder validation

Creates various test patterns:
- Solid colors
- Gradients
- Checkerboards
- Frequency patterns (horizontal/vertical lines)
- Complex patterns (for DCT testing)

All images are 512x512 pixels in PPM format (P6 binary).
"""

import os
import struct
import math
from pathlib import Path

def write_ppm(filename, width, height, rgb_data):
    """Write RGB image data to PPM P6 binary format"""
    with open(filename, 'wb') as f:
        # PPM header
        header = f"P6\n{width} {height}\n255\n"
        f.write(header.encode('ascii'))
        # RGB pixel data
        f.write(bytes(rgb_data))

def write_pgm(filename, width, height, gray_data):
    """Write grayscale image data to PGM P5 binary format"""
    with open(filename, 'wb') as f:
        # PGM header
        header = f"P5\n{width} {height}\n255\n"
        f.write(header.encode('ascii'))
        # Grayscale pixel data
        f.write(bytes(gray_data))

def generate_solid_color(width, height, r, g, b):
    """Generate solid color image"""
    return [val for _ in range(width * height) for val in (r, g, b)]

def generate_gradient_horizontal(width, height):
    """Generate horizontal gradient (black to white)"""
    rgb = []
    for y in range(height):
        for x in range(width):
            val = int(255 * x / (width - 1))
            rgb.extend([val, val, val])
    return rgb

def generate_gradient_vertical(width, height):
    """Generate vertical gradient"""
    rgb = []
    for y in range(height):
        val = int(255 * y / (height - 1))
        for x in range(width):
            rgb.extend([val, val, val])
    return rgb

def generate_checkerboard(width, height, square_size=32):
    """Generate checkerboard pattern"""
    rgb = []
    for y in range(height):
        for x in range(width):
            # Determine if black or white square
            is_black = ((x // square_size) + (y // square_size)) % 2 == 0
            val = 0 if is_black else 255
            rgb.extend([val, val, val])
    return rgb

def generate_frequency_horizontal(width, height, frequency=16):
    """Generate horizontal line pattern (tests vertical DCT frequencies)"""
    rgb = []
    for y in range(height):
        val = int(127.5 + 127.5 * math.sin(2 * math.pi * y / frequency))
        for x in range(width):
            rgb.extend([val, val, val])
    return rgb

def generate_frequency_vertical(width, height, frequency=16):
    """Generate vertical line pattern (tests horizontal DCT frequencies)"""
    rgb = []
    for y in range(height):
        for x in range(width):
            val = int(127.5 + 127.5 * math.sin(2 * math.pi * x / frequency))
            rgb.extend([val, val, val])
    return rgb

def generate_complex_pattern(width, height):
    """Generate complex pattern with multiple frequencies"""
    rgb = []
    for y in range(height):
        for x in range(width):
            # Combination of multiple frequencies
            val1 = 127.5 + 63.75 * math.sin(2 * math.pi * x / 32)
            val2 = 127.5 + 63.75 * math.cos(2 * math.pi * y / 32)
            val = int((val1 + val2) / 2)
            rgb.extend([val, val, val])
    return rgb

def generate_color_bars(width, height):
    """Generate SMPTE-style color bars"""
    rgb = []
    colors = [
        (255, 255, 255),  # White
        (255, 255, 0),    # Yellow
        (0, 255, 255),    # Cyan
        (0, 255, 0),      # Green
        (255, 0, 255),    # Magenta
        (255, 0, 0),      # Red
        (0, 0, 255),      # Blue
        (0, 0, 0),        # Black
    ]
    
    bar_width = width // len(colors)
    
    for y in range(height):
        for x in range(width):
            bar_index = min(x // bar_width, len(colors) - 1)
            rgb.extend(colors[bar_index])
    
    return rgb

def generate_grayscale_ramp(width, height):
    """Generate 8-level grayscale ramp (good for quantization testing)"""
    gray = []
    levels = [0, 36, 73, 109, 146, 182, 219, 255]
    step_width = width // len(levels)
    
    for y in range(height):
        for x in range(width):
            level_index = min(x // step_width, len(levels) - 1)
            gray.append(levels[level_index])
    
    return gray

def main():
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    test_images_dir = project_root / "data" / "test_images"
    
    # Create directory if it doesn't exist
    test_images_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Generating test images in: {test_images_dir}")
    
    # Standard dimensions
    width, height = 512, 512
    
    # Generate test images
    tests = [
        ("solid_red.ppm", generate_solid_color(width, height, 255, 0, 0)),
        ("solid_green.ppm", generate_solid_color(width, height, 0, 255, 0)),
        ("solid_blue.ppm", generate_solid_color(width, height, 0, 0, 255)),
        ("solid_white.ppm", generate_solid_color(width, height, 255, 255, 255)),
        ("solid_black.ppm", generate_solid_color(width, height, 0, 0, 0)),
        ("gradient_horizontal.ppm", generate_gradient_horizontal(width, height)),
        ("gradient_vertical.ppm", generate_gradient_vertical(width, height)),
        ("checkerboard_32.ppm", generate_checkerboard(width, height, 32)),
        ("checkerboard_64.ppm", generate_checkerboard(width, height, 64)),
        ("frequency_h16.ppm", generate_frequency_horizontal(width, height, 16)),
        ("frequency_v16.ppm", generate_frequency_vertical(width, height, 16)),
        ("complex_pattern.ppm", generate_complex_pattern(width, height)),
        ("color_bars.ppm", generate_color_bars(width, height)),
    ]
    
    for filename, rgb_data in tests:
        filepath = test_images_dir / filename
        write_ppm(filepath, width, height, rgb_data)
        print(f"  Created: {filename} ({width}×{height})")
    
    # Generate grayscale test images
    grayscale_tests = [
        ("grayscale_ramp.pgm", generate_grayscale_ramp(width, height)),
    ]
    
    for filename, gray_data in grayscale_tests:
        filepath = test_images_dir / filename
        write_pgm(filepath, width, height, gray_data)
        print(f"  Created: {filename} ({width}×{height})")
    
    print(f"\nGenerated {len(tests) + len(grayscale_tests)} test images")
    print(f"Total directory size: ~{(len(tests) * width * height * 3 + len(grayscale_tests) * width * height) // 1024} KB")

if __name__ == "__main__":
    main()
