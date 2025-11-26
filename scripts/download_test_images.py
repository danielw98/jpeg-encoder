#!/usr/bin/env python3
"""
Download standard JPEG test images from public datasets.

Standard test images commonly used in image compression research:
- Lena (512x512) - Classic test image
- Baboon (512x512) - High frequency content
- Peppers (512x512) - Color test
- Barbara (512x512) - Complex textures
- Kodak dataset - Professional photographs
"""

import os
import sys
import urllib.request
from pathlib import Path

# Target directory
DATA_DIR = Path(__file__).parent.parent / "data" / "standard_test_images"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Standard test images with direct download URLs
TEST_IMAGES = {
    "lena_512.png": "https://sipi.usc.edu/database/preview/misc/4.2.04.png",
    "peppers_512.png": "https://sipi.usc.edu/database/preview/misc/4.2.07.png",
    "baboon_512.png": "https://sipi.usc.edu/database/preview/misc/4.2.03.png",
    "house_512.png": "https://sipi.usc.edu/database/preview/misc/4.1.05.png",
    "lake_512.png": "https://sipi.usc.edu/database/preview/misc/4.1.07.png",
}

# Kodak dataset (24 high-quality photos, commonly used for JPEG testing)
KODAK_BASE_URL = "http://r0k.us/graphics/kodak/kodak/"
KODAK_IMAGES = [f"kodim{i:02d}.png" for i in range(1, 25)]

def download_file(url, dest_path):
    """Download file with progress indication and retry logic."""
    max_retries = 3
    timeout = 30
    
    for attempt in range(max_retries):
        try:
            print(f"Downloading {dest_path.name}...", end=" ", flush=True)
            
            # Use urlopen with timeout instead of urlretrieve for better control
            import socket
            socket.setdefaulttimeout(timeout)
            
            with urllib.request.urlopen(url, timeout=timeout) as response:
                data = response.read()
                dest_path.write_bytes(data)
            
            print(f"✓ ({len(data) // 1024} KB)")
            return True
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"⏳ Retry {attempt + 1}/{max_retries}...", end=" ", flush=True)
            else:
                print(f"✗ Failed: {e}")
                return False
    
    return False

def main():
    print("=" * 70)
    print("Downloading Standard JPEG Test Images")
    print("=" * 70)
    print()
    
    success_count = 0
    total_count = 0
    
    # Download classic test images
    print("📥 Classic Test Images (USC-SIPI Database)")
    print("-" * 70)
    for filename, url in TEST_IMAGES.items():
        dest = DATA_DIR / filename
        if dest.exists():
            print(f"Skipping {filename} (already exists)")
            success_count += 1
        else:
            if download_file(url, dest):
                success_count += 1
        total_count += 1
    
    print()
    
    # Download Kodak dataset
    print("📥 Kodak PhotoCD Dataset (24 images)")
    print("-" * 70)
    for filename in KODAK_IMAGES:
        dest = DATA_DIR / filename
        url = KODAK_BASE_URL + filename
        if dest.exists():
            print(f"Skipping {filename} (already exists)")
            success_count += 1
        else:
            if download_file(url, dest):
                success_count += 1
        total_count += 1
    
    print()
    print("=" * 70)
    print(f"✅ Downloaded {success_count}/{total_count} images")
    print(f"📁 Location: {DATA_DIR}")
    print("=" * 70)
    
    # Create README
    readme_path = DATA_DIR / "README.md"
    with open(readme_path, "w") as f:
        f.write("""# Standard JPEG Test Images

This directory contains standard test images commonly used in JPEG compression research.

## Classic Test Images (USC-SIPI Database)

- **lena_512.png** - Classic "Lena" test image (512×512)
- **peppers_512.png** - Bell peppers with varied colors (512×512)
- **baboon_512.png** - Baboon face with high-frequency detail (512×512)
- **house_512.png** - House exterior (512×512)
- **lake_512.png** - Lake scene (512×512)

Source: USC-SIPI Image Database  
http://sipi.usc.edu/database/

## Kodak PhotoCD Dataset

24 high-quality photographic images (kodim01.png through kodim24.png, 768×512).

Widely used in image compression research as a standard benchmark.

Source: Kodak Lossless True Color Image Suite  
http://r0k.us/graphics/kodak/

## Usage

```powershell
# Encode with analysis
.\\build\\Debug\\jpegdsp_cli_encode.exe --input data/standard_test_images/lena_512.png --output lena.jpg --analyze --html lena_report.html

# Batch encode all images
Get-ChildItem data/standard_test_images/*.png | ForEach-Object {
    $out = "internals/$($_.BaseName).jpg"
    .\\build\\Debug\\jpegdsp_cli_encode.exe --input $_.FullName --output $out --quality 85
}
```

## Citation

If using these images in research:

```
@misc{usc-sipi-database,
  title={The USC-SIPI Image Database},
  author={Signal and Image Processing Institute, University of Southern California},
  url={http://sipi.usc.edu/database/}
}

@misc{kodak-dataset,
  title={Kodak Lossless True Color Image Suite},
  url={http://r0k.us/graphics/kodak/}
}
```
""")
    
    print(f"📝 Created README: {readme_path}")
    
    return 0 if success_count == total_count else 1

if __name__ == "__main__":
    sys.exit(main())
