# jpegdsp – Educational JPEG Encoder with DSP Focus

## Overview

`jpegdsp` is an educational **baseline JPEG encoder** written in modern C++17, designed as a comprehensive demonstration of **Digital Signal Processing (DSP) techniques** applied to **information compression**. The project serves as both a learning platform for understanding frequency-domain transforms and a research testbed for exploring DSP applications in multimedia processing.

### Research Context

This project explores the fundamental role of DSP in modern information compression, specifically focusing on:

- **Transform-based compression**: How frequency-domain representations (DCT, FFT, wavelets) enable efficient data reduction
- **JPEG as a DSP application**: The complete pipeline from spatial-domain images to entropy-coded bitstreams
- **Quantization and perceptual coding**: How human perception informs lossy compression strategies
- **Entropy coding theory**: Information-theoretic limits and practical encoding schemes

The codebase demonstrates how DSP principles—originally developed for signal analysis and communication systems—underpin virtually all modern multimedia compression standards (JPEG, MP3, H.264, etc.).

### Broader DSP Applications

Beyond image compression, this project contextualizes DSP techniques used across diverse domains:

- **Audio processing**: MDCT in MP3/AAC, speech codecs (Opus), noise reduction, equalization
- **Medical imaging**: MRI reconstruction, ultrasound processing, CT scan filtering
- **Communications**: OFDM in Wi-Fi/LTE, channel equalization, software-defined radio
- **Computer vision**: Edge detection (Sobel, Canny), feature extraction, image enhancement
- **Scientific computing**: Spectral analysis, sensor fusion, adaptive filtering

## JPEG Encoding Pipeline

The project implements the complete **baseline sequential JPEG** encoding process:

### 1. Color Space Conversion
- **RGB → YCbCr**: Separates luminance (Y) from chrominance (Cb, Cr)
- Enables chroma subsampling (4:4:4, 4:2:2, 4:2:0) for perceptual compression
- Implemented in `jpegdsp::core::ColorConverter`

### 2. Block Extraction
- Divides image into **8×8 pixel blocks** (JPEG's fundamental processing unit)
- Each channel processed independently
- `jpegdsp::core::BlockExtractor` handles tiling (assumes dimensions are multiples of 8)

### 3. Discrete Cosine Transform (DCT)
- **Forward DCT-II** converts spatial pixels to frequency coefficients
- Concentrates image energy in low-frequency (top-left) coefficients
- `jpegdsp::transforms::DCT8x8Transform` implements the separable 2D DCT
- **Why DCT over FFT?** DCT produces real-valued output, better decorrelation for natural images, basis vectors aligned with human visual response

### 4. Quantization
- **Lossy step**: Divides DCT coefficients by quantization table values
- Higher frequencies (less perceptually important) quantized more coarsely
- Quality parameter scales standard JPEG luminance/chrominance tables
- Implemented in `jpegdsp::jpeg::Quantizer` using `QuantTable::makeLumaStd(quality)`

### 5. Entropy Coding
- **ZigZag ordering** (`jpegdsp::jpeg::ZigZag`): Scans 8×8 block from low to high frequency
- **DC prediction**: Current DC - previous DC (reduces dynamic range)
- **Run-Length Encoding** (`jpegdsp::jpeg::RLE`): Compresses runs of zero AC coefficients
- **Huffman coding** (`jpegdsp::jpeg::HuffmanEncoder`): Variable-length codes based on ITU-T.81 Annex K.3 tables
- **Byte-stuffing**: 0xFF → 0xFF 0x00 for marker disambiguation
- Integrated in `jpegdsp::jpeg::BlockEntropyEncoder` (block-level pipeline)

### 6. Bitstream Writing
- **JFIF format**: SOI → APP0 → DQT → SOF0 → DHT → SOS → [scan data] → EOI
- `jpegdsp::jpeg::JPEGWriter`: Formats markers and entropy-coded data
- `jpegdsp::util::BitWriter`: Bit-level writing with automatic byte-stuffing

## Architecture

The codebase follows a **layered namespace design** emphasizing modularity and testability:

### Core DSP Primitives (`jpegdsp::core`)
- **`Image`**: Multi-channel pixel buffer with `ColorSpace` metadata (RGB, YCbCr, GRAY)
- **`Block<T, N>`**: Generic N×N block with type `T` (floats for DCT, int16 for quantized)
  - `Block8x8f` = `Block<float, 8>` for DCT coefficients
  - `Block8x8i` = `Block<int16_t, 8>` for quantized values
- **`BlockExtractor`**: Extracts 8×8 tiles from images
- **`ColorConverter`**: RGB ↔ YCbCr transformations
- **`Entropy`**: Shannon entropy calculation for analysis

### Transform Layer (`jpegdsp::transforms`)
- **`ITransform2D<T, N>`**: Generic interface for N×N transforms
- **`DCT8x8Transform`**: Forward/inverse DCT-II implementation
- Designed for extensibility: Future `WaveletTransform` for JPEG2000-style encoding

### JPEG Logic (`jpegdsp::jpeg`)
- **`QuantTable`**: Standard JPEG quantization matrices with quality scaling
- **`Quantizer`**: Quantization/dequantization operations
- **`ZigZag`**: Zig-zag scan order conversion
- **`RLE`**: Run-length encoding for AC coefficients
- **`HuffmanTable`** / **`HuffmanEncoder`**: ITU-T.81 Huffman tables and encoding
- **`BlockEntropyEncoder`**: Combines ZigZag → RLE → Huffman for a single block
- **`JPEGWriter`**: Bitstream formatter (JFIF markers + entropy data)
- **`JPEGEncoder`**: High-level pipeline orchestrator

### Analysis & Instrumentation (`jpegdsp::analysis`)
- **`PipelineObserver`**: Observer pattern for debugging/visualization
  - `onBlockDCT()`: Triggered after DCT of each block (with coordinates, component Y/Cb/Cr)
  - `onEntropyStage()`: Entropy measurements at different stages
- Enables DCT coefficient heatmaps, entropy plots, compression ratio tracking

### Utilities (`jpegdsp::util`)
- **`BitWriter`**: Bit-level stream writing with JPEG byte-stuffing
- **`FileIO`**: Image loading/saving (PPM, PGM support)
- **`Timer`**: Performance measurement

## Future Vision: Web Application

The project is designed to scale into a **Dockerized web application** for interactive DSP experimentation:

### Current Capabilities
- **Grayscale JPEG encoding**: Baseline sequential (SOF0) with standard quantization/Huffman tables
- **YCbCr 4:2:0 color JPEG encoding**: RGB → YCbCr conversion, 2×2 chroma downsampling, interleaved MCU structure
- **Complete entropy coding**: ZigZag scan, run-length encoding, Huffman coding, DC prediction, byte-stuffing
- **Transform implementations**: DCT-II (8×8 blocks) with forward/inverse operations
- **Quantization**: Standard JPEG luma/chroma tables with quality scaling (1-100)
- **Test suite**: 9 test executables with 100% pass rate (unit + integration tests)

### Planned Features
- **Browser-based interface**: Upload images, adjust compression parameters in real-time
- **Parameter controls**:
  - Quality slider (1-100)
  - Chroma subsampling mode (4:4:4, 4:2:2, 4:2:0)
  - Transform selection (DCT, future wavelet options)
  - Custom quantization tables
- **Visualizations**:
  - Side-by-side original/compressed comparison
  - DCT coefficient heatmaps per block
  - Entropy progression graph (pixels → DCT → quantized → bitstream)
  - PSNR / SSIM quality metrics
  - Frequency spectrum analysis
- **Educational annotations**:
  - Inline explanations of DCT basis functions
  - Interactive demos showing how quantization affects image quality
  - Tooltips describing DSP concepts (aliasing, frequency response, etc.)
- **RESTful API**: Programmatic access for batch processing and research workflows

### Technical Stack (Planned)
- **Backend**: C++ core library exposed via REST API (Crow or similar)
- **Frontend**: React-based UI with interactive canvas/SVG visualizations
- **Containerization**: Docker for reproducible deployment
- **Storage**: Optional PostgreSQL for compression experiments and user-uploaded datasets

This aligns with the research goal of making DSP concepts accessible through hands-on experimentation, demonstrating how abstract mathematical transforms translate to practical compression performance.

## Building and Testing

### Prerequisites
- CMake 3.16+
- C++17 compiler (MSVC, GCC, or Clang)
- Windows PowerShell / Bash terminal

### Build Instructions
```powershell
# Initial CMake configuration (from project root)
cmake -B build

# Build Debug configuration
cmake --build build --config Debug

# Build Release
cmake --build build --config Release
```

### Running Tests
```powershell
# All tests via CTest (verbose output)
ctest --test-dir build -C Debug -V

# Single test executable directly
.\build\tests\Debug\test_dct.exe

# Quick build + test script
.\build_and_run_tests.bat
```

### Test Structure
The project uses a **custom test harness** (no external frameworks):
- Each test is a `bool test_name()` function returning `true` on pass
- `runTest()` helper prints `[PASS]` / `[FAIL]` and counts failures
- Exit code: 0 = all pass, non-zero = failures
- Test binaries:
  - `test_dct`: Block extraction, DCT round-trip, quantization
  - `test_entropy`: Entropy calculation correctness
  - `test_colorspace`: RGB ↔ YCbCr conversion
  - `test_core_codec`: Integration tests (Huffman, BitWriter, BlockEntropyEncoder, JPEGWriter)

See `tests/README.md` for detailed test coverage matrix.

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

## Coding Conventions

- **C++17 features**: RAII, structured bindings, std::optional, constexpr
- **Namespace structure**: Fully qualified nested namespaces (`jpegdsp::core`, `jpegdsp::jpeg`)
- **Brace style**: Allman (braces on new line)
- **Constants**: Use `BlockSize` and `BlockElementCount` from `jpegdsp/core/Constants.hpp`
- **Loops**: Post-increment (`i++`) for consistency with classic C++ style
- **Error handling**: Exceptions for invalid input, `noexcept` on simple getters
- **Memory management**: RAII everywhere, no raw `new`/`delete`

## Key DSP Concepts Demonstrated

### 1. Frequency-Domain Representation
The **DCT** (Discrete Cosine Transform) is the heart of JPEG compression. It transforms spatial pixel data into frequency coefficients, revealing which frequencies carry the most image information. Natural images tend to have most energy in low frequencies (smooth regions), making DCT ideal for compression.

**Mathematical intuition**: DCT decomposes the 8×8 block into a weighted sum of 64 basis patterns (cosine waves at different frequencies). High-frequency basis patterns (rapid oscillations) correspond to edges and texture, which are less perceptually critical and thus more aggressively quantized.

### 2. Quantization as Information Reduction
Quantization is where **lossy compression** happens. By dividing DCT coefficients by quantization table values (larger for high frequencies), we discard fine details imperceptible to human vision. This is based on psychovisual research: the human eye is less sensitive to high-frequency luminance changes and fine color variations.

The **quality parameter** scales the quantization table—higher quality = smaller divisors = more detail retained.

### 3. Entropy Coding as Lossless Compression
After quantization, **entropy coding** (ZigZag + RLE + Huffman) compresses the coefficient stream without further quality loss:
- **ZigZag**: Orders coefficients by increasing frequency, grouping zeros together
- **RLE**: Represents runs of zeros compactly (e.g., "0,0,0,0,0,7" → "(5 zeros), 7")
- **Huffman**: Assigns shorter bit codes to frequent symbols (EOB, small AC values)

This exploits statistical redundancy: quantized high-frequency coefficients are mostly zero, so RLE is highly effective.

### 4. DC Prediction (DPCM)
JPEG encodes the **difference** between consecutive DC coefficients (the average brightness of each 8×8 block). Adjacent blocks tend to have similar DC values, so `dc[i] - dc[i-1]` has lower magnitude and thus requires fewer bits. This is a simple form of **Differential Pulse Code Modulation (DPCM)**, a classic DSP technique.

## Extensions and Future Work

### 1. Wavelet-Based Compression (JPEG2000)
Replace DCT with **Discrete Wavelet Transform (DWT)**:
- Multi-resolution analysis (pyramid decomposition)
- Better edge preservation than block-based DCT
- Implement `WaveletTransform : ITransform2D` and swap into pipeline

### 2. Chroma Subsampling
Currently configured via `JPEGEncoderConfig::subsampleChroma` but not implemented:
- 4:2:0 subsampling reduces Cb/Cr resolution by 2× in each dimension
- Exploits human eye's lower sensitivity to color detail

### 3. Adaptive Quantization
- Vary quantization table based on local image complexity
- Allocate more bits to complex regions (edges, texture)
- Research direction: perceptual quality metrics (SSIM, MS-SSIM)

### 4. Progressive JPEG
- Encode image in multiple scans (coarse → fine)
- Requires spectral selection and successive approximation modes

### 5. Parallel Processing
- Blocks are independent → trivial parallelization with OpenMP/TBB
- Web worker threads for browser-based encoding

## References and Standards

- **ITU-T Recommendation T.81** (ISO/IEC 10918-1): JPEG standard specification
- **ITU-T.81 Annex K**: Huffman table specifications
- **JFIF (JPEG File Interchange Format)**: File format wrapper for JPEG bitstreams
- Wallace, G. K. (1992). *The JPEG Still Picture Compression Standard*. IEEE Transactions on Consumer Electronics.
- Pennebaker, W. B., & Mitchell, J. L. (1992). *JPEG: Still Image Data Compression Standard*. Springer.

## License

Educational project for research purposes. See `LICENSE` file for details.

---

**Developed as part of research in Digital Signal Processing and Information Compression.**
