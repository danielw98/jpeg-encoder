# jpegdsp

A baseline JPEG encoder in C++17 for exploring DSP techniques in image compression.

## What This Is

Educational JPEG codec implementing the complete ITU-T.81 baseline sequential encoding pipeline. Focus is on clean code structure and demonstrating how frequency-domain transforms enable lossy compression.

**Research goal**: Understand how DSP concepts (DCT, quantization, entropy coding) combine to achieve compression, and explore trade-offs between compression ratio and perceptual quality.

## Current Status

**Core Encoder: 100% Complete**
- Grayscale JPEG encoding (baseline sequential SOF0)
- YCbCr 4:2:0 color JPEG encoding with 2×2 chroma subsampling
- Full entropy coding pipeline (ZigZag, RLE, Huffman, DC prediction, byte-stuffing)
- DCT-II transform (forward/inverse, <0.01 round-trip error)
- Standard JPEG quantization tables with quality scaling [1-100]
- Automatic MCU padding with edge replication (supports arbitrary dimensions)
- CLI tool for batch encoding (PNG/PPM/PGM input)
- 15 test executables, 100% pass rate

**Analysis Layer: ~30% Complete**
- `PipelineObserver` interface exists
- `Entropy::calculate()` works
- **Missing:** `BlockAnalyzer`, `EntropyProfiler`, JSON export

**Web UI: Planned**
- ASP.NET Core + Razor Pages
- Docker containerization
- Integration via CLI shelling

## Encoding Pipeline

Standard JPEG baseline sequential (ITU-T.81):

1. **Color space conversion**: RGB → YCbCr (ITU-R BT.601)
2. **Block extraction**: Image split into 8×8 tiles
3. **DCT**: Spatial domain → frequency domain (forward DCT-II)
4. **Quantization**: Lossy step, divides coefficients by quality-scaled tables
5. **Entropy coding**: ZigZag scan, DC prediction, RLE, Huffman encoding
6. **Bitstream**: JFIF markers (SOI, APP0, DQT, SOF0, DHT, SOS, EOI)

**Two encoding modes:**
- **Grayscale**: Single luminance channel, 1 quantization table, 2 Huffman tables (DC/AC luma)
- **YCbCr 4:2:0**: Full color, 2×2 chroma subsampling, 2 quantization tables, 4 Huffman tables (DC/AC luma, DC/AC chroma)

## Code Structure

Modular design with clean separation between DSP primitives and JPEG-specific logic:

```
jpegdsp/
├── include/jpegdsp/           # Public headers
│   ├── core/                  # DSP primitives
│   │   ├── Image.hpp          # Multi-channel pixel buffer
│   │   ├── Block.hpp          # Generic N×N blocks (Block8x8f, Block8x8i)
│   │   ├── ColorSpace.hpp     # RGB ↔ YCbCr conversion
│   │   ├── Downsampler.hpp    # 4:2:0 chroma subsampling
│   │   ├── Entropy.hpp        # Shannon entropy calculation
│   │   ├── ImagePadding.hpp   # MCU boundary padding
│   │   └── Constants.hpp      # BlockSize, BlockElementCount
│   │
│   ├── transforms/            # Transform interfaces
│   │   ├── ITransform2D.hpp   # Generic transform interface
│   │   ├── DCTTransform.hpp   # Forward/inverse DCT-II
│   │   └── DCTConstants.hpp   # Scale factors, alpha values
│   │
│   ├── jpeg/                  # JPEG encoding
│   │   ├── JPEGWriter.hpp     # JFIF marker + bitstream generation
│   │   ├── JPEGEncoder.hpp    # High-level encoding API
│   │   ├── JPEGConstants.hpp  # Markers, segment lengths (ITU-T.81)
│   │   ├── HuffmanTables.hpp  # Standard tables (Annex K.3)
│   │   ├── Huffman.hpp        # Huffman encoder
│   │   ├── Quantization.hpp   # Quantization tables + scaling
│   │   ├── ZigZag.hpp         # Zig-zag scan reordering
│   │   ├── RLE.hpp            # Run-length encoding
│   │   └── BlockEntropyEncoder.hpp  # Per-block entropy coding
│   │
│   ├── analysis/              # Instrumentation
│   │   ├── PipelineObserver.hpp   # Hooks for visualization
│   │   └── JPEGAnalyzer.hpp       # Analysis utilities
│   │
│   └── util/                  # I/O utilities
│       ├── BitWriter.hpp      # Bit-level packing + byte-stuffing
│       ├── FileIO.hpp         # PPM/PGM/PNG loading
│       └── Timer.hpp          # Performance measurement
│
├── src/                       # Implementation files (mirrors include/)
│   ├── core/
│   ├── transforms/
│   ├── jpeg/
│   ├── analysis/
│   ├── util/
│   ├── cli/                   # CLI tool implementation
│   └── api/                   # High-level API
│
├── tests/                     # Test suite
│   ├── TestFramework.hpp      # Centralized test harness
│   ├── unit/                  # Unit tests (21 test files)
│   └── integration/           # Full pipeline tests
│
├── examples/                  # Sample programs
│   ├── encode_basic.cpp       # Minimal JPEG encoding
│   ├── visualize_dct.cpp      # DCT coefficient visualization
│   ├── entropy_comparison.cpp # Entropy at each stage
│   └── api_demo.cpp           # High-level API usage
│
├── scripts/                   # Automation
│   ├── test_encode_all.ps1    # Batch encoding script
│   ├── generate_test_images.py
│   ├── download_test_images.py
│   └── validate_cli.py
│
├── data/                      # Test data
│   ├── test_images/           # Generated test patterns
│   ├── standard_test_images/  # Kodak dataset, baboon, etc.
│   └── reference_outputs/     # Expected outputs
│
└── ui/web/                    # Web interface (coming soon)
```

## Module Details

### `jpegdsp::core` – DSP Primitives
- `Image`: Multi-channel pixel buffer (RGB/YCbCr/GRAY), row-major storage
- `Block<T, N>`: Generic N×N blocks (`Block8x8f` for DCT, `Block8x8i` for quantized)
- `BlockExtractor`: Extract 8×8 tiles from Image
- `ColorConverter`: RGB ↔ YCbCr (ITU-R BT.601 coefficients)
- `Downsampler`: 4:2:0 chroma subsampling (2×2 box averaging)
- `Entropy`: Shannon entropy calculation for compression analysis
- `ImagePadding`: Edge replication to MCU boundaries

### `jpegdsp::transforms` – Transform Interface
- `ITransform2D<T, N>`: Generic transform interface (extensible to wavelets)
- `DCT8x8Transform`: Orthonormal DCT-II, precomputed cosine table
- `DCTConstants`: Mathematical constants (π, scale factors, alpha values)

### `jpegdsp::jpeg` – JPEG Encoding
- `JPEGWriter`: JFIF marker formatting + scan data generation
- `JPEGConstants`: All JPEG markers and segment constants (ITU-T.81)
- `HuffmanTables`: Standard DC/AC tables for luma and chroma (Annex K.3)
- `HuffmanTable`, `HuffmanEncoder`: Canonical Huffman encoding
- `QuantTable`, `Quantizer`: Standard tables with quality [1-100] scaling
- `ZigZag`: Zig-zag scan reordering (low→high frequency)
- `RLE`: Run-length encoding with ZRL and EOB symbols
- `BlockEntropyEncoder`: Complete per-block pipeline (ZigZag → RLE → Huffman)

### `jpegdsp::analysis` – Instrumentation
- `PipelineObserver`: Hooks for DCT visualization, entropy tracking
- `JPEGAnalyzer`: Analysis utilities (planned expansion)

### `jpegdsp::util` – Utilities
- `BitWriter`: Bit-level packing with JPEG byte-stuffing (0xFF → 0xFF 0x00)
- `FileIO`: Load PNG/PPM/PGM via stb_image
- `Timer`: High-resolution performance measurement

## Building and Testing

**Prerequisites:**
- CMake 3.16+
- C++17 compiler (MSVC/GCC/Clang)

**Dependencies:**
- [stb_image](https://github.com/nothings/stb) - Image loading (included in `external/`)
- [nlohmann/json](https://github.com/nlohmann/json) - JSON serialization (fetched via CMake)

**Build:**
```powershell
cmake -B build
cmake --build build --config Debug
```

**Run tests:**
```powershell
ctest --test-dir build -C Debug --output-on-failure
```

**Test Suite (15+ executables):**
| Test | Description |
|------|-------------|
| `test_block` | Block data structure and extraction |
| `test_dct` | DCT transform, round-trip accuracy (<0.01 error) |
| `test_colorspace` | RGB ↔ YCbCr conversion validation |
| `test_quantization` | Quantization table generation and scaling |
| `test_jpegwriter` | Grayscale + YCbCr JPEG marker validation |
| `test_downsampler` | 4:2:0 chroma subsampling |
| `test_jpeg_padding` | Arbitrary dimension padding |
| `test_core_codec` | Integration (Huffman, BitWriter, RLE, full pipeline) |
| `test_entropy` | Shannon entropy calculation |
| `test_jpeg_encoder` | High-level API + JSON serialization |
| `test_zigzag_verify` | Zig-zag scan correctness |
| `test_solid_color` | Solid color encoding |
| `test_single_block_encode` | Single block encoding verification |
| `test_mcu_debug` | MCU structure debugging |
| `test_jpeg_pipeline` | Full pipeline integration |

**Test Framework:**
All tests use `tests/TestFramework.hpp`:
```cpp
#include "../TestFramework.hpp"
using namespace jpegdsp::test;

bool test_my_feature() {
    return assertEqual(expected, actual, "description");
}

int main() {
    TestStats stats;
    runTest("my_feature", &test_my_feature, stats);
    stats.printSummary("My test suite");
    return stats.exitCode();
}
```

## Command-Line Interface

**jpegdsp_cli_encode** - JPEG encoder for automation and language bindings

```powershell
# Basic color encoding
.\build\Debug\jpegdsp_cli_encode.exe --input image.png --output image.jpg --quality 85

# Grayscale encoding
.\build\Debug\jpegdsp_cli_encode.exe --input image.png --output image.jpg --format grayscale

# JSON output for programmatic use
.\build\Debug\jpegdsp_cli_encode.exe --input image.png --output image.jpg --json
```

**Options:**
| Option | Description |
|--------|-------------|
| `--input <path>` | Input image (PNG/PPM/PGM) |
| `--output <path>` | Output JPEG file |
| `--quality <1-100>` | Quality level (default: 75) |
| `--format <mode>` | `grayscale` or `color_420` (default: color_420) |
| `--json` | Output JSON encoding statistics |
| `--analyze` | Generate analysis report |
| `--html <path>` | Generate HTML report |

**JSON Output Example:**
```json
{
  "original_width": 512,
  "original_height": 512,
  "padded_width": 512,
  "padded_height": 512,
  "original_bytes": 786432,
  "compressed_bytes": 35421,
  "compression_ratio": 22.2,
  "quality": 85,
  "format": "COLOR_420"
}
```

## Batch Processing

```powershell
# Encode all test images at quality 75
powershell -ExecutionPolicy Bypass -File .\scripts\test_encode_all.ps1 -Quality 75

# Encode at quality 100 (maximum quality)
powershell -ExecutionPolicy Bypass -File .\scripts\test_encode_all.ps1 -Quality 100 -OutputDir "output_q100"
```

## Typical Compression Results

| Image Type | Quality 75 | Quality 100 |
|------------|------------|-------------|
| Smooth gradients | 10-15x | 2-3x |
| Natural photos (Kodak) | 8-12x | 1.8-2.1x |
| High-detail textures | 3-5x | 0.7-1.1x |

## Key DSP Techniques

**DCT (Discrete Cosine Transform)**: Converts 8×8 spatial blocks to frequency domain. Natural images concentrate energy in low frequencies (smooth regions), making high-frequency coefficients compressible.

**Quantization**: Lossy step. Divides DCT coefficients by table values (larger for high frequencies). Human vision is less sensitive to high-frequency changes, so coarse quantization there causes minimal perceptual loss.

**Entropy Coding**: Lossless final stage. ZigZag scan orders coefficients low→high frequency (groups zeros), RLE compresses zero runs, Huffman assigns shorter codes to frequent symbols.

**DC Prediction (DPCM)**: Encode `dc[i] - dc[i-1]` instead of absolute DC. Adjacent blocks have similar brightness, so differences are small.

**Chroma Subsampling (4:2:0)**: Human vision has lower color resolution than luminance resolution. Cb/Cr channels are downsampled 2:1 in both dimensions, reducing color data by 75%.

## Roadmap

### Phase 1: Core Encoder ✅ Complete
- [x] Grayscale encoding (SOF0)
- [x] YCbCr 4:2:0 color encoding
- [x] Standard Huffman tables (ITU-T.81 Annex K.3)
- [x] Quality scaling [1-100]
- [x] CLI tool with PNG/PPM/PGM support
- [x] Comprehensive test suite (15+ tests)
- [x] Automatic MCU padding

### Phase 2: Web Interface 🚧 In Progress
- [ ] ASP.NET Core backend (C#)
- [ ] Razor Pages frontend
- [ ] Image upload and encoding
- [ ] Side-by-side quality comparison
- [ ] Docker containerization

### Phase 3: Analysis Tools
- [ ] DCT coefficient heatmaps
- [ ] Entropy analysis per pipeline stage
- [ ] Block-level quality metrics
- [ ] Compression statistics dashboard
- [ ] JSON export API

### Future Extensions
- [ ] Progressive JPEG (SOF2)
- [ ] 4:2:2 and 4:4:4 chroma formats
- [ ] Optimized Huffman tables (two-pass encoding)
- [ ] JPEG decoder (inverse pipeline)
- [ ] Wavelet transforms (JPEG2000-style)

## Implementation Completeness

**Status: ~90% of baseline sequential JPEG encoder**

✅ **Implemented:**
- Baseline DCT encoding (SOF0) - ITU-T.81 Annex A
- Grayscale + YCbCr 4:2:0 color
- Standard quantization tables with quality scaling
- Standard Huffman tables (ITU-T.81 Annex K.3)
- Full entropy pipeline (ZigZag, DC prediction, RLE, Huffman)
- JFIF 1.01 markers
- Image padding (arbitrary dimensions → 8/16-pixel multiples)
- CLI tool with PNG/PPM/PGM input
- JSON API for integration

❌ **Not Implemented:**
- JPEG decoder (inverse pipeline)
- Progressive JPEG (SOF2)
- 4:2:2 and 4:4:4 chroma formats
- Optimized Huffman tables (two-pass encoding)
- Restart markers (error resilience)
- EXIF metadata (APP1)
- Arithmetic coding (SOF9/SOF10)
- Lossless mode (SOF3)

## Code Conventions

- Nested namespaces: `jpegdsp::core`, `jpegdsp::jpeg`, `jpegdsp::transforms`
- Constants from dedicated headers:
  - `core/Constants.hpp`: BlockSize, BlockElementCount
  - `jpeg/JPEGConstants.hpp`: JPEG markers, segment lengths
  - `transforms/DCTConstants.hpp`: DCT scale factors
  - `jpeg/HuffmanTables.hpp`: Standard Huffman tables
- Exceptions for invalid input, `noexcept` on getters
- RAII everywhere, no raw `new`/`delete`
- One class per header in `include/jpegdsp/<module>/<Class>.hpp`

## References

- ITU-T Recommendation T.81 (ISO/IEC 10918-1): JPEG specification
- ITU-T.81 Annex K: Huffman table specifications
- JFIF (JPEG File Interchange Format) specification
- Wallace, G. K. (1992). *The JPEG Still Picture Compression Standard*. IEEE Transactions on Consumer Electronics.

---

Educational project exploring DSP applications in image compression.
