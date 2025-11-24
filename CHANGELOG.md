# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **JPEGWriter module**:
  - Baseline sequential grayscale JPEG encoder (`encodeGrayscale()`)
  - Complete JFIF file structure: SOI → APP0 → DQT → SOF0 → DHT → SOS → scan data → EOI
  - Automatic marker writing (writeSOI, writeAPP0, writeDQT, writeSOF0, writeDHT, writeSOS, writeEOI)
  - Integration with DCT, quantization, and BlockEntropyEncoder for full pipeline
  - Standard JPEG quantization tables via `QuantTable::makeLumaStd(quality)`
  - Standard Huffman tables for luma DC and AC encoding
  - 1 unit test: `test_jpegwriter_small_grayscale` (validates markers and structure)
- BitWriter enhancements:
  - Implemented JPEG-style byte-stuffing (0xFF → 0xFF 0x00)
  - Added `flushToByte()` method for padding to byte boundaries
  - Added `buffer()` accessor for retrieving encoded bytes
  - Changed from ostream-based to vector-based for better testing
  - Added 3 unit tests (single byte, cross-boundary, byte-stuffing)
- BlockEntropyEncoder module:
  - Block-level entropy encoder combining ZigZag, RLE, and Huffman
  - `encodeLumaBlock()` for luma blocks with DC prediction
  - `encodeChromaBlock()` for chroma blocks with DC prediction
  - Encapsulates complete entropy coding pipeline per 8×8 block
  - Added 2 unit tests (constant block, DC prediction)
- Huffman coding module:
  - Complete baseline JPEG Huffman tables (ITU-T.81 Annex K.3)
  - AC luminance and chrominance tables
  - DC luminance and chrominance tables
  - `HuffmanTableType` enum for table selection
  - `categoryDC()` helper function for DC coefficient encoding
- Huffman unit tests:
  - DC luma/chroma table validation (categories 0-11)
  - AC luma/chroma table validation (EOB, ZRL, common symbols)
  - 4 new tests added to `test_core_codec.cpp`

### Changed
- Updated `HuffmanTable` class to support all four baseline table types
- Refactored DC encoding to use `categoryDC()` helper function
- Enhanced test documentation with Huffman, BitWriter, BlockEntropyEncoder, and JPEGWriter sections
- BitWriter API changed from ostream to internal vector buffer
- **JPEGWriter API redesigned**: Removed old `writeHeader()` / `beginScan()` / `endScan()` stub methods, replaced with complete `encodeGrayscale()` implementation

## [0.1.0] - 2025-11-24

### Added
- Core DSP components:
  - `Image` class for multi-channel pixel buffers with ColorSpace metadata
  - `BlockExtractor` for extracting 8×8 blocks from images
  - `Entropy` utilities for Shannon entropy calculation
  - `ColorConverter` for RGB ↔ YCbCr color space transformations
- Transform layer:
  - `DCT8x8Transform` implementing forward/inverse DCT-II
  - `ITransform2D` interface for generic N×N transforms
- JPEG encoding components:
  - `Quantizer` with standard JPEG quantization tables
  - Quality-based table scaling (1-100)
  - `ZigZag` ordering compliant with ITU-T.81 Annex K.1
  - `RLE` (Run-Length Encoding) for AC coefficients
- Analysis layer:
  - `PipelineObserver` pattern for DCT visualization and entropy tracking
- Centralized constants:
  - `Constants.hpp` with `BlockSize` (8) and `BlockElementCount` (64)
- Comprehensive test suite:
  - BlockExtractor tests (block extraction, boundary checks)
  - Entropy tests (constant vectors, probability distributions)
  - ColorSpace tests (RGB ↔ YCbCr round-trip accuracy)
  - DCT tests (transform round-trip, DC coefficient validation)
  - Quantization tests (identity tables, zero blocks)
  - ZigZag tests (ordering correctness, known patterns)
  - RLE tests (zero runs, ZRL symbols, EOB markers)

### Changed
- Refactored all magic numbers (8, 64) to use centralized constants
- Renamed main test file from `test_dct.cpp` to `test_core_codec.cpp` to reflect broader coverage

### Infrastructure
- CMake build system with Debug/Release configurations
- CTest integration for automated testing
- Custom lightweight test harness (no external dependencies)
- Git-based version control

[Unreleased]: https://github.com/danielw98/jpeg-encoder/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/danielw98/jpeg-encoder/releases/tag/v0.1.0
