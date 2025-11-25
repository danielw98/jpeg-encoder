# JPEG Test Image Dataset

Test images for validating the jpegdsp JPEG encoder implementation.

## Synthetic Test Images

Generated using `scripts/generate_test_images.py`. All images are **512×512 pixels** in uncompressed PPM/PGM format.

### Solid Colors
Test basic encoding with minimal entropy.

- `solid_red.ppm` - Pure red (#FF0000)
- `solid_green.ppm` - Pure green (#00FF00)
- `solid_blue.ppm` - Pure blue (#0000FF)
- `solid_white.ppm` - Pure white (#FFFFFF)
- `solid_black.ppm` - Pure black (#000000)

**Expected behavior:**
- Extremely high compression ratios (>100:1)
- All DCT coefficients near zero except DC
- Single quantized DC coefficient per block

### Gradients
Test smooth transitions and low-frequency content.

- `gradient_horizontal.ppm` - Left (black) to right (white) gradient
- `gradient_vertical.ppm` - Top (black) to bottom (white) gradient

**Expected behavior:**
- High compression ratios (50-100:1)
- Low-frequency DCT coefficients dominate
- Quality degradation most visible at high compression

### Checkerboards
Test high-frequency content and block artifacts.

- `checkerboard_32.ppm` - 32×32 pixel squares
- `checkerboard_64.ppm` - 64×64 pixel squares

**Expected behavior:**
- Lower compression ratios (10-30:1)
- High-frequency DCT coefficients significant
- Block artifacts visible at low quality
- 32px squares align with 8×8 DCT blocks (cleaner encoding)

### Frequency Patterns
Test specific DCT frequency responses.

- `frequency_h16.ppm` - Horizontal lines (16px period, tests vertical DCT frequencies)
- `frequency_v16.ppm` - Vertical lines (16px period, tests horizontal DCT frequencies)

**Expected behavior:**
- Energy concentrated in specific DCT frequency bins
- 16px period = 2 cycles per 8×8 block → strong AC coefficients
- Good test for zigzag scan and quantization behavior

### Complex Patterns
Test combined frequencies and real-world-like complexity.

- `complex_pattern.ppm` - Combination of multiple sinusoidal frequencies
- `color_bars.ppm` - SMPTE-style color bars (8 colors: W/Y/C/G/M/R/B/K)

**Expected behavior:**
- Moderate compression (20-40:1)
- Multiple DCT frequencies active
- Color bars test chroma subsampling (4:2:0)

### Grayscale Tests
Test single-channel encoding.

- `grayscale_ramp.pgm` - 8-level grayscale ramp (tests quantization)

**Expected behavior:**
- Very high compression (>80:1)
- Only DC and low-frequency AC coefficients
- Quantization levels should remain distinct

## Usage

### Generate Test Images

```powershell
python scripts/generate_test_images.py
```

Output: 14 test images in `data/test_images/` (~3.5 MB total)

### Encode All Test Images

```powershell
# Create output directory
New-Item -ItemType Directory -Force data/test_outputs

# Encode all PPM images (color)
Get-ChildItem data/test_images/*.ppm | ForEach-Object {
    $basename = $_.BaseName
    .\build\Debug\jpegdsp_cli_encode.exe `
        --input $_.FullName `
        --output "data\test_outputs\$basename.jpg" `
        --quality 75 `
        --format color_420
}

# Encode PGM images (grayscale)
Get-ChildItem data/test_images/*.pgm | ForEach-Object {
    $basename = $_.BaseName
    .\build\Debug\jpegdsp_cli_encode.exe `
        --input $_.FullName `
        --output "data\test_outputs\$basename.jpg" `
        --quality 75 `
        --format grayscale
}
```

### Run Validation Tests

```powershell
python scripts/validate_cli.py
```

This script:
1. Encodes all test images
2. Validates JPEG marker structure (SOI, APP0, DQT, SOF0, DHT, SOS, EOI)
3. Tests quality scaling (Q10 < Q50 < Q90 file sizes)
4. Validates JSON output format
5. Tests error handling (missing files, invalid arguments)

## Validation Checklist

When testing new features or refactoring:

- [ ] All test images encode without errors
- [ ] Output JPEGs have correct markers (validate with hex editor or `validate_cli.py`)
- [ ] Compression ratios are reasonable:
  - Solid colors: >100:1
  - Gradients: 50-100:1
  - Checkerboards: 10-30:1
  - Complex patterns: 20-40:1
- [ ] Quality scaling works: Higher quality → Larger file size
- [ ] JSON output contains all required fields
- [ ] Grayscale images encode to 1-channel JPEG
- [ ] Color images encode to 3-channel YCbCr with 4:2:0 subsampling

## Adding Real-World Test Images

To add photographic test images (e.g., Kodak PhotoCD suite):

1. Download images (PNG/JPEG format)
2. Convert to PPM using ImageMagick:
   ```powershell
   magick input.png -resize 512x512 -compress none output.ppm
   ```
3. Place in `data/test_images/`
4. Document source and license in this README

**Recommended test suites:**
- Kodak PhotoCD (24 images, public domain)
- USC-SIPI Image Database (standard test images)
- JPEG AI validation set (if open source)

## Reference Outputs

To compare jpegdsp output with a reference encoder (e.g., libjpeg):

```powershell
# Encode with libjpeg-turbo
cjpeg -quality 75 -outfile data/reference_outputs/test.jpg data/test_images/test.ppm

# Encode with jpegdsp
.\build\Debug\jpegdsp_cli_encode.exe `
    --input data/test_images/test.ppm `
    --output data/test_outputs/test.jpg `
    --quality 75

# Compare file sizes and visual quality
# (Note: Bit-identical output not expected due to quantization table differences)
```

## Known Limitations

Current test image constraints:
- All synthetic images are 512×512 (multiples of 16 for 4:2:0)
- No images test padding behavior (use 511×511 or odd dimensions)
- No extreme high-frequency content (white noise, texture)
- No color edge cases (saturated colors, color gradients)

## Future Test Coverage

Planned additions:
- [ ] Non-multiple-of-16 dimensions (test padding)
- [ ] Extreme aspect ratios (1×512, 512×1)
- [ ] Very small images (8×8, 16×16)
- [ ] Very large images (4096×4096)
- [ ] Photographic content (natural scenes)
- [ ] Text and line art (sharp edges)
- [ ] Saturated colors and color gradients
- [ ] Random noise (worst-case entropy)
