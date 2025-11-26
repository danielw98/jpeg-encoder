# JPEGDSP CLI Testing Scripts

## Download Test Images

```powershell
python scripts\download_test_images.py
```

Downloads:
- 4 classic test images (USC-SIPI: peppers, baboon, house, lake)
- 24 Kodak PhotoCD images (kodim01-24)
- Total: ~15 MB

## Batch Encode All Test Images

### Default (Quality 75)
```powershell
.\scripts\test_encode_all.ps1
```

### Custom Quality
```powershell
.\scripts\test_encode_all.ps1 -Quality 90
.\scripts\test_encode_all.ps1 -Quality 50
.\scripts\test_encode_all.ps1 -Quality 95 -OutputDir output/q95
```

**Output:**
- `internals/test_results/*.jpg` - Encoded JPEGs
- `internals/test_results/*.json` - Analysis reports (metrics, entropy, etc.)
- `internals/test_results/*.html` - Visual reports (open in browser)

**Features:**
- Processes all PNG images in `data/standard_test_images/`
- Generates analysis reports with quality metrics (PSNR/MSE)
- Shows compression ratio, file sizes, success rate
- Parallel processing for speed

## Manual Encoding (Single Image)

### Basic encoding
```powershell
.\build\Debug\jpegdsp_cli_encode.exe `
    --input data/standard_test_images/kodim01.png `
    --output test.jpg `
    --quality 85
```

### With full analysis
```powershell
.\build\Debug\jpegdsp_cli_encode.exe `
    --input data/standard_test_images/peppers_512.png `
    --output peppers.jpg `
    --quality 75 `
    --analyze `
    --json peppers_analysis.json `
    --html peppers_report.html
```

**Analyze flag provides:**
- Compression ratio and entropy reduction
- Block-level DCT statistics
- Quantization analysis
- Quality metrics (PSNR/MSE) comparing original vs compressed
- Chroma subsampling statistics (4:2:0)

## Compare Quality Levels

```powershell
# Encode at multiple qualities
.\scripts\test_encode_all.ps1 -Quality 50 -OutputDir output/q50
.\scripts\test_encode_all.ps1 -Quality 75 -OutputDir output/q75
.\scripts\test_encode_all.ps1 -Quality 90 -OutputDir output/q90

# Compare results
Get-ChildItem output\*\*.json | ForEach-Object {
    $j = Get-Content $_ | ConvertFrom-Json
    [PSCustomObject]@{
        Image = $_.BaseName
        Quality = $j.compression.quality
        Ratio = $j.compression.compression_ratio
        PSNR = $j.quality.psnr_db
        Size_KB = $j.compression.compressed_bytes / 1KB
    }
} | Format-Table -AutoSize
```

## Test Specific Images

```powershell
# High-frequency content (challenging for JPEG)
.\build\Debug\jpegdsp_cli_encode.exe `
    --input data/standard_test_images/baboon_512.png `
    --output baboon.jpg --quality 75 --analyze --html baboon.html

# Smooth gradients (JPEG-friendly)
.\build\Debug\jpegdsp_cli_encode.exe `
    --input data/standard_test_images/kodim15.png `
    --output kodim15.jpg --quality 75 --analyze --html kodim15.html
```

## Expected Results

**Quality 75 (typical web quality):**
- Compression ratio: 10-20x
- PSNR: 32-38 dB
- File size: 20-80 KB (512×512 images)

**Quality 90 (high quality):**
- Compression ratio: 5-12x
- PSNR: 36-42 dB
- File size: 40-150 KB

**Quality 50 (low quality):**
- Compression ratio: 20-40x
- PSNR: 28-34 dB
- File size: 10-40 KB
- Visible blocking artifacts

## Troubleshooting

**Encoder not found:**
```powershell
cmake --build build --config Debug
```

**Test images missing:**
```powershell
python scripts\download_test_images.py
```

**OpenCV errors:**
Install OpenCV:
```powershell
# Using vcpkg
vcpkg install opencv:x64-windows
```

## Validation

All 28 test images should encode successfully:
```powershell
.\scripts\test_encode_all.ps1
# Expected: "Successful: 28, Failed: 0"
```
