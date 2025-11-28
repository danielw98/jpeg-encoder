#!/usr/bin/env python3
"""
Download pixel art sprites for educational kernel visualization.
Sources: OpenGameArt.org public domain sprites
"""

import urllib.request
import os
from pathlib import Path

# Create output directory
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "sprite_images"
OUTPUT_DIR.mkdir(exist_ok=True)

# Simple colored test patterns we'll generate (since downloading sprites requires authentication)
# Let's create our own clean pixel art patterns instead

try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("Installing Pillow and numpy...")
    import subprocess
    subprocess.check_call(["pip", "install", "Pillow", "numpy"])
    from PIL import Image
    import numpy as np


def create_mario_style_block(size):
    """Create a Mario-style question block pattern."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    
    # Yellow/orange base
    img[:, :] = [255, 200, 50]
    
    # Border (dark brown)
    border = max(1, size // 16)
    img[:border, :] = [100, 50, 0]
    img[-border:, :] = [100, 50, 0]
    img[:, :border] = [100, 50, 0]
    img[:, -border:] = [100, 50, 0]
    
    # Question mark in center (simplified)
    center = size // 2
    q_size = size // 4
    # Top of ?
    img[center-q_size:center-q_size//2, center-q_size//2:center+q_size//2] = [50, 25, 0]
    # Right side
    img[center-q_size//2:center, center+q_size//4:center+q_size//2] = [50, 25, 0]
    # Dot
    img[center+q_size//4:center+q_size//2, center-border:center+border] = [50, 25, 0]
    
    return img


def create_heart(size):
    """Create a pixel heart."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    img[:, :] = [230, 230, 230]  # Light gray background
    
    # Heart shape (red)
    heart_color = [255, 50, 50]
    
    # Using parametric approach scaled to size
    for i in range(size):
        for j in range(size):
            # Normalize to -1 to 1
            x = (j - size/2) / (size/2) * 1.3
            y = (size/2 - i) / (size/2) * 1.3  # Flip y
            
            # Heart equation: (x^2 + y^2 - 1)^3 - x^2 * y^3 < 0
            if (x*x + y*y - 1)**3 - x*x * y**3 < 0:
                img[i, j] = heart_color
    
    return img


def create_star(size):
    """Create a pixel star."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    img[:, :] = [20, 20, 40]  # Dark blue background
    
    center = size // 2
    
    # 5-pointed star
    import math
    star_color = [255, 255, 100]
    
    for i in range(size):
        for j in range(size):
            x = j - center
            y = center - i
            
            if x == 0 and y == 0:
                img[i, j] = star_color
                continue
                
            angle = math.atan2(y, x)
            dist = math.sqrt(x*x + y*y)
            
            # Star radius varies with angle
            r = size * 0.4 * (0.5 + 0.5 * abs(math.cos(2.5 * angle)))
            
            if dist < r:
                img[i, j] = star_color
    
    return img


def create_coin(size):
    """Create a pixel coin."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    img[:, :] = [100, 150, 255]  # Sky blue background
    
    center = size // 2
    radius = size // 2 - max(2, size // 8)
    
    # Gold coin
    for i in range(size):
        for j in range(size):
            dist = np.sqrt((i - center)**2 + (j - center)**2)
            if dist <= radius:
                # Gradient for 3D effect
                if dist <= radius * 0.7:
                    img[i, j] = [255, 220, 50]  # Bright gold
                else:
                    img[i, j] = [200, 160, 30]  # Darker gold edge
    
    return img


def create_mushroom(size):
    """Create a Mario-style mushroom."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    img[:, :] = [135, 206, 235]  # Sky blue
    
    center = size // 2
    
    # Cap (red with white spots)
    cap_top = size // 4
    cap_bottom = size // 2 + size // 8
    cap_radius = size // 3
    
    for i in range(cap_top, cap_bottom):
        for j in range(size):
            dist = abs(j - center)
            if dist < cap_radius * (1 - (i - cap_top) / (cap_bottom - cap_top) * 0.3):
                img[i, j] = [255, 50, 50]  # Red
    
    # White spots on cap
    spot_radius = size // 10
    spots = [(cap_top + size//8, center - size//6), (cap_top + size//8, center + size//6)]
    for sy, sx in spots:
        for i in range(size):
            for j in range(size):
                if (i - sy)**2 + (j - sx)**2 < spot_radius**2:
                    img[i, j] = [255, 255, 255]
    
    # Stem (white/beige)
    stem_top = cap_bottom - size // 16
    stem_bottom = size - size // 8
    stem_width = size // 4
    
    for i in range(stem_top, stem_bottom):
        for j in range(center - stem_width, center + stem_width):
            img[i, j] = [255, 240, 220]
    
    return img


def create_ghost(size):
    """Create a Pac-Man style ghost."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    img[:, :] = [20, 20, 50]  # Dark background
    
    center = size // 2
    
    # Ghost body (cyan)
    ghost_color = [100, 255, 255]
    
    # Top dome
    dome_radius = size // 3
    for i in range(size // 4, size // 2 + size // 8):
        for j in range(size):
            dist = np.sqrt((j - center)**2 + (i - size//3)**2)
            if dist < dome_radius:
                img[i, j] = ghost_color
    
    # Body rectangle
    for i in range(size // 2, 3 * size // 4):
        for j in range(center - dome_radius, center + dome_radius):
            img[i, j] = ghost_color
    
    # Wavy bottom
    wave_height = size // 8
    for j in range(center - dome_radius, center + dome_radius):
        wave = int(wave_height * (0.5 + 0.5 * np.sin((j - center) * np.pi / (size // 8))))
        for i in range(3 * size // 4, 3 * size // 4 + wave):
            if i < size:
                img[i, j] = ghost_color
    
    # Eyes (white with blue pupils)
    eye_y = size // 3
    eye_left = center - size // 8
    eye_right = center + size // 8
    eye_radius = size // 10
    
    for ex in [eye_left, eye_right]:
        for i in range(size):
            for j in range(size):
                dist = np.sqrt((i - eye_y)**2 + (j - ex)**2)
                if dist < eye_radius:
                    img[i, j] = [255, 255, 255]
                if dist < eye_radius // 2:
                    img[i, j] = [50, 50, 200]
    
    return img


def create_tree(size):
    """Create a simple pixel tree."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    img[:, :] = [135, 206, 235]  # Sky blue
    
    center = size // 2
    
    # Tree trunk (brown)
    trunk_width = size // 8
    trunk_top = 2 * size // 3
    for i in range(trunk_top, size):
        for j in range(center - trunk_width, center + trunk_width):
            img[i, j] = [100, 60, 20]
    
    # Leaves (green triangle)
    for i in range(size // 6, trunk_top + size // 8):
        width = int((trunk_top - i) * 0.8)
        for j in range(center - width, center + width):
            if 0 <= j < size:
                img[i, j] = [34, 139, 34]  # Forest green
    
    return img


def create_sword(size):
    """Create a pixel sword."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    img[:, :] = [50, 50, 80]  # Dark background
    
    center = size // 2
    
    # Blade (silver gradient)
    blade_width = size // 8
    for i in range(size // 8, 2 * size // 3):
        for j in range(center - blade_width, center + blade_width):
            # Gradient
            brightness = 200 + int(30 * (1 - abs(j - center) / blade_width))
            img[i, j] = [brightness, brightness, brightness + 20]
    
    # Point
    for i in range(size // 16, size // 8):
        width = blade_width * (i - size // 16) // (size // 16)
        for j in range(center - width, center + width + 1):
            img[i, j] = [220, 220, 240]
    
    # Guard (gold)
    guard_y = 2 * size // 3
    for i in range(guard_y, guard_y + size // 8):
        for j in range(center - size // 3, center + size // 3):
            img[i, j] = [255, 200, 50]
    
    # Handle (brown)
    for i in range(guard_y + size // 8, size - size // 8):
        for j in range(center - size // 12, center + size // 12):
            img[i, j] = [80, 40, 20]
    
    # Pommel (gold)
    for i in range(size - size // 8, size - size // 16):
        for j in range(center - size // 8, center + size // 8):
            img[i, j] = [255, 200, 50]
    
    return img


def create_potion(size):
    """Create a pixel potion bottle."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    img[:, :] = [40, 40, 60]  # Dark background
    
    center = size // 2
    
    # Bottle neck (dark glass)
    neck_width = size // 10
    for i in range(size // 8, size // 3):
        for j in range(center - neck_width, center + neck_width):
            img[i, j] = [80, 100, 80]
    
    # Cork (brown)
    for i in range(size // 16, size // 8):
        for j in range(center - neck_width - 1, center + neck_width + 1):
            img[i, j] = [139, 90, 43]
    
    # Bottle body (glass with liquid)
    body_top = size // 3
    body_bottom = size - size // 8
    
    for i in range(body_top, body_bottom):
        # Width increases then stays constant
        progress = (i - body_top) / (body_bottom - body_top)
        if progress < 0.3:
            width = int(neck_width + (size // 4 - neck_width) * progress / 0.3)
        else:
            width = size // 4
        
        for j in range(center - width, center + width):
            # Glass outline
            if abs(j - center) > width - 2:
                img[i, j] = [100, 130, 100]
            # Liquid (red/purple potion)
            elif i > body_top + (body_bottom - body_top) * 0.2:
                img[i, j] = [200, 50, 150]
            else:
                img[i, j] = [60, 80, 60]  # Empty space
    
    return img


def create_checkerboard_colored(size):
    """Checkerboard with colors instead of B&W."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    square = max(2, size // 8)
    
    colors = [
        [255, 100, 100],  # Red
        [100, 255, 100],  # Green
        [100, 100, 255],  # Blue
        [255, 255, 100],  # Yellow
    ]
    
    for i in range(size):
        for j in range(size):
            idx = ((i // square) + (j // square)) % 4
            img[i, j] = colors[idx]
    
    return img


def create_gradient_rainbow(size):
    """Rainbow gradient."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    
    for j in range(size):
        # HSV to RGB (simplified)
        hue = j / size * 360
        if hue < 60:
            r, g, b = 255, int(255 * hue / 60), 0
        elif hue < 120:
            r, g, b = int(255 * (120 - hue) / 60), 255, 0
        elif hue < 180:
            r, g, b = 0, 255, int(255 * (hue - 120) / 60)
        elif hue < 240:
            r, g, b = 0, int(255 * (240 - hue) / 60), 255
        elif hue < 300:
            r, g, b = int(255 * (hue - 240) / 60), 0, 255
        else:
            r, g, b = 255, 0, int(255 * (360 - hue) / 60)
        
        img[:, j] = [r, g, b]
    
    return img


def create_face_simple(size):
    """Simple smiley face with few colors."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    img[:, :] = [255, 255, 200]  # Light yellow background
    
    center = size // 2
    face_radius = size // 2 - 2
    
    # Yellow face circle
    for i in range(size):
        for j in range(size):
            dist = np.sqrt((i - center)**2 + (j - center)**2)
            if dist <= face_radius:
                img[i, j] = [255, 220, 80]
    
    # Eyes (black)
    eye_y = center - size // 6
    eye_offset = size // 5
    eye_size = max(1, size // 12)
    
    for i in range(eye_y - eye_size, eye_y + eye_size):
        for j in range(center - eye_offset - eye_size, center - eye_offset + eye_size):
            img[i, j] = [0, 0, 0]
        for j in range(center + eye_offset - eye_size, center + eye_offset + eye_size):
            img[i, j] = [0, 0, 0]
    
    # Smile (black arc)
    smile_y = center + size // 8
    smile_width = size // 4
    for j in range(center - smile_width, center + smile_width):
        y_offset = int(((j - center) / smile_width) ** 2 * (size // 8))
        y = smile_y + y_offset
        if 0 <= y < size:
            img[y, j] = [0, 0, 0]
            if y + 1 < size:
                img[y + 1, j] = [0, 0, 0]
    
    return img


# Generate all sprites at different sizes
generators = {
    "block": create_mario_style_block,
    "heart": create_heart,
    "star": create_star,
    "coin": create_coin,
    "mushroom": create_mushroom,
    "ghost": create_ghost,
    "tree": create_tree,
    "sword": create_sword,
    "potion": create_potion,
    "checker_color": create_checkerboard_colored,
    "rainbow": create_gradient_rainbow,
    "smiley": create_face_simple,
}

# Only 16x16 and 32x32 - 64x64 is too large for pixel-level demo
sizes = [16, 32]

print(f"Generating sprite images in {OUTPUT_DIR}")

for name, generator in generators.items():
    for size in sizes:
        try:
            img_array = generator(size)
            img = Image.fromarray(img_array.astype(np.uint8), mode='RGB')
            filename = f"{name}_{size}.png"
            img.save(OUTPUT_DIR / filename)
            print(f"  Created: {filename}")
        except Exception as e:
            print(f"  Error creating {name}_{size}: {e}")

print(f"\nGenerated {len(generators) * len(sizes)} sprite images")
print(f"Output directory: {OUTPUT_DIR}")
