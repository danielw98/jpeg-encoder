# jpegdsp

A baseline JPEG encoder in C++17 for exploring DSP techniques in image compression.

## Recent Changes (Phase 1 Refactor)

**Code Quality Improvements (November 2025):**
- **Eliminated magic numbers**: Created `JPEGConstants.hpp`, `DCTConstants.hpp`, `HuffmanTables.hpp` with all JPEG/DCT constants
- **Centralized test framework**: All 10 tests now use `tests/TestFramework.hpp` (eliminates 150+ lines of duplicate test harness code)
- **Removed duplicates**: 158 lines of duplicate Huffman table definitions eliminated
- **Self-documenting code**: All constants reference ITU-T.81 standard sections
- **100% test pass rate**: All tests validated after refactor, bit-identical JPEG output

See `internals/PHASE1_COMPLETE.md` for detailed refactor summary and `internals/REFACTOR_ROADMAP.md` for future phases.

## What This Is

Educational JPEG codec implementing the complete ITU-T.81 baseline sequential encoding pipeline. Focus is on clean code structure and demonstrating how frequency-domain transforms enable lossy compression.

**Research goal**: Understand how DSP concepts (DCT, quantization, entropy coding) combine to achieve compression, and explore trade-offs between compression ratio and perceptual quality.

## Encoding Pipeline

Standard JPEG baseline sequential (ITU-T.81):

1. **Color space conversion**: RGB → YCbCr (ITU-R BT.601)
2. **Block extraction**: Image split into 8×8 tiles
3. **DCT**: Spatial domain → frequency domain (forward DCT-II)
4. **Quantization**: Lossy step, divides coefficients by quality-scaled tables
5. **Entropy coding**: ZigZag scan, DC prediction, RLE, Huffman encoding
6. **Bitstream**: JFIF markers (SOI, APP0, DQT, SOF0, DHT, SOS, EOI)

**Two encoding modes:**
- Grayscale: Single luminance channel, 1 quantization table, 2 Huffman tables (DC/AC luma)
- YCbCr 4:2:0: Full color, 2×2 chroma subsampling, 2 quantization tables, 4 Huffman tables (DC/AC luma, DC/AC chroma)

## Code Structure

Modular design with clean separation between DSP primitives and JPEG-specific logic:

**`jpegdsp::core`** – DSP primitives
- `Image`: Multi-channel pixel buffer (RGB/YCbCr/GRAY)
- `Block<T, N>`: Generic N×N blocks (`Block8x8f` for DCT, `Block8x8i` for quantized)
- `BlockExtractor`: 8×8 tiling
- `ColorConverter`: RGB ↔ YCbCr (ITU-R BT.601)
- `Downsampler`: 4:2:0 chroma subsampling (2×2 averaging)
- `Entropy`: Shannon entropy calculation

**`jpegdsp::jpeg`** – JPEG encoding
- `JPEGConstants`: JPEG markers, segment lengths, component IDs, sampling factors (ITU-T.81)
- `HuffmanTables`: Standard Huffman tables (ITU-T.81 Annex K.3)
- `QuantTable`, `Quantizer`: Standard JPEG quantization tables
- `ZigZag`: Zig-zag scan reordering
- `RLE`: Run-length encoding for AC coefficients
- `HuffmanTable`, `HuffmanEncoder`: Huffman encoding with standard tables
- `BlockEntropyEncoder`: ZigZag → RLE → Huffman per block
- `JPEGWriter`: JFIF marker formatting + bitstream generation

**`jpegdsp::transforms`** – Generic transform interface
- `DCTConstants`: DCT-II mathematical constants (scale factors, alpha values, pi)
- `ITransform2D<T, N>`: Transform interface (extensible to wavelets)
- `DCT8x8Transform`: Forward/inverse DCT-II

**`jpegdsp::analysis`** – Instrumentation
- `PipelineObserver`: Hooks for DCT visualization and entropy tracking
- `Entropy`: Information-theoretic metrics

**`jpegdsp::util`** – I/O utilities
- `BitWriter`: Bit-level packing with byte-stuffing
- `FileIO`: PPM/PGM loading/saving

## Current Status

**Implemented:**
- Grayscale JPEG encoding (baseline sequential SOF0)
- YCbCr 4:2:0 color JPEG encoding with 2×2 chroma subsampling
- Full entropy coding pipeline (ZigZag, RLE, Huffman, DC prediction, byte-stuffing)
- DCT-II transform (forward/inverse, <0.01 round-trip error)
- Standard JPEG quantization tables with quality scaling [1-100]
- 9 test executables, 100% pass rate

**Missing (next priorities):**
- Analysis export API: Extract DCT coefficients, entropy metrics per stage
- Web UI: Image upload, side-by-side comparison, DCT heatmaps, entropy panel
- Non-multiple-of-8 image dimensions (need padding logic)
- Progressive JPEG (SOF2)
- Custom quantization tables

## Building and Testing

**Prerequisites:**
- CMake 3.16+
- C++17 compiler (MSVC/GCC/Clang)

**Dependencies:**
- [nlohmann/json](https://github.com/nlohmann/json) - JSON serialization (header-only, fetched automatically via CMake)

**Build:**
```powershell
cmake -B build
cmake --build build --config Debug
```

**Run tests:**
```powershell
ctest --test-dir build -C Debug --output-on-failure
# or verbose mode
ctest --test-dir build -C Debug -V
# or use batch script
.\build_and_run_tests.bat
```

**Test Framework:**
All tests use a centralized framework (`tests/TestFramework.hpp`) providing:
- `TestStats`: Tracks passed/failed tests with summary reporting
- `runTest()`: Executes test functions with consistent `[PASS]`/`[FAIL]` output
- Assertion helpers: `assertEqual()`, `assertClose()`, `assertTrue()`, `assertFalse()`
- Floating-point comparison: `closeFloat()`, `closeDouble()` with epsilon tolerance

**Example test structure:**
```cpp
#include "../TestFramework.hpp"
using namespace jpegdsp::test;

bool test_my_feature() {
    // Test logic
    return assertEqual(expected, actual, "feature description");
}

int main() {
    TestStats stats;
    runTest("my_feature", &test_my_feature, stats);
    stats.printSummary("My test suite");
    return stats.exitCode();  // 0 on success, 1 on failure
}
```

**Test suite (10 executables):**
- `test_block`: Block data structure and extraction
- `test_dct`: DCT transform, round-trip accuracy (<0.01 error)
- `test_colorspace`: RGB ↔ YCbCr conversion validation
- `test_quantization`: Quantization table generation and scaling
- `test_jpegwriter`: Grayscale + YCbCr 4:2:0 JPEG generation, marker validation
- `test_downsampler`: 4:2:0 chroma subsampling (2×2 averaging)
- `test_imagepadding`: Arbitrary dimension padding to 8/16-pixel multiples
- `test_core_codec`: Integration tests (Huffman, BitWriter, BlockEntropyEncoder, full pipeline)
- `test_entropy`: Shannon entropy calculation
- `test_jpeg_encoder`: High-level API + JSON serialization validation

**Current test coverage:**
- ✅ Core DSP primitives (blocks, DCT, quantization, entropy)
- ✅ JPEG encoding pipeline (ZigZag, RLE, Huffman, DC prediction, byte-stuffing)
- ✅ Color conversion and chroma subsampling
- ✅ Bitstream generation (markers, segments, payload)
- ✅ API + JSON serialization
- ⚠️ **Missing**: Constant header validation, marker byte sequence tests, edge cases (1×1, 17×17 images)

## Command-Line Interface

**jpegdsp_cli_encode** - JPEG encoder for automation and language bindings

```powershell
# Basic usage
.\build\Debug\jpegdsp_cli_encode.exe --input image.ppm --output image.jpg --quality 85

# Grayscale encoding
.\build\Debug\jpegdsp_cli_encode.exe --input image.pgm --output image.jpg --format grayscale

# JSON output for programmatic use
.\build\Debug\jpegdsp_cli_encode.exe --input image.ppm --output image.jpg --json
```

**Options:**
- `--input <path>` - Input image (PPM/PGM/PNG format)
- `--output <path>` - Output JPEG file
- `--quality <1-100>` - Quality level (default: 75)
- `--format <mode>` - `grayscale` or `color_420` (default: color_420)
- `--json` - Output JSON encoding statistics to stdout

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

Use from C#/Python/other languages via `Process.Start()` for easy integration.
- `test_core_codec`: Integration (Huffman, BitWriter, BlockEntropyEncoder)
- `test_entropy`: Shannon entropy calculation
- `test_jpeg_encoder`: High-level encoder interface

## Project Structure

```
jpegdsp/
├── include/jpegdsp/       # Public headers
│   ├── core/              # DSP primitives (Image, Block, Entropy)
│   ├── transforms/        # DCT, wavelets (future)
│   ├── jpeg/              # JPEG-specific encoding logic
│   ├── analysis/          # Observers for visualization
│   └── util/              # I/O, BitWriter, timers
├── src/                   # Implementation files (mirrors include/)
├── tests/                 # Unit and integration tests
│   ├── unit/              # Module-specific tests
│   └── integration/       # Full pipeline tests
├── examples/              # Sample programs
│   ├── encode_basic.cpp   # Minimal JPEG encoding example
│   ├── visualize_dct.cpp  # DCT coefficient visualization
│   └── entropy_comparison.cpp  # Entropy analysis at each stage
├── data/                  # Test images and reference outputs
├── ui/web/                # Future web interface (placeholder)
└── CMakeLists.txt         # Build configuration
```

## Code Conventions

- Nested namespaces: `jpegdsp::core`, `jpegdsp::jpeg`, etc.
- Constants: Use `BlockSize`, `BlockElementCount` from `jpegdsp/core/Constants.hpp`
  - JPEG/JFIF constants in `jpegdsp/jpeg/JPEGConstants.hpp` (markers, segment lengths, sampling factors)
  - DCT constants in `jpegdsp/transforms/DCTConstants.hpp` (scale factors, alpha values)
  - Huffman tables in `jpegdsp/jpeg/HuffmanTables.hpp` (ITU-T.81 Annex K.3)
- Exceptions for invalid input, `noexcept` on getters
- RAII everywhere, no raw `new`/`delete`
- Test framework: Use `tests/TestFramework.hpp` for all new tests

## Key Techniques

**DCT (Discrete Cosine Transform)**: Converts 8×8 spatial blocks to frequency domain. Natural images concentrate energy in low frequencies (smooth regions), making high-frequency coefficients compressible.

**Quantization**: Lossy step. Divides DCT coefficients by table values (larger for high frequencies). Human vision is less sensitive to high-frequency changes, so coarse quantization there causes minimal perceptual loss.

**Entropy coding**: Lossless final stage. ZigZag scan orders coefficients low→high frequency (groups zeros), RLE compresses zero runs, Huffman assigns shorter codes to frequent symbols.

**DC prediction (DPCM)**: Encode `dc[i] - dc[i-1]` instead of absolute DC. Adjacent blocks have similar brightness, so differences are small.

## Possible Extensions

- **Wavelet transforms**: Replace DCT with DWT for JPEG2000-style encoding (better edge preservation)
- **Progressive JPEG**: Multi-scan encoding (spectral selection, successive approximation)
- **Adaptive quantization**: Vary table per region based on complexity
- **4:2:2 subsampling**: Half horizontal chroma resolution (alternative to 4:2:0)
- **Custom Huffman tables**: Two-pass encoding to optimize tables per image
- **Parallel encoding**: Blocks are independent, easy parallelization

## References

- ITU-T Recommendation T.81 (ISO/IEC 10918-1): JPEG specification
- ITU-T.81 Annex K: Huffman table specifications
- JFIF (JPEG File Interchange Format) specification
- Wallace, G. K. (1992). *The JPEG Still Picture Compression Standard*. IEEE Transactions on Consumer Electronics.

---

Educational project exploring DSP applications in image compression.
