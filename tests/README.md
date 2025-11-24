# JPEGDSP Test Suite

This document describes the automated tests for the **jpegdsp** project.  
The test suite validates each DSP building block and the JPEG encoding pipeline step-by-step,
using small focused tests that prevent regressions and ensure correctness.

The project currently uses:
- A custom lightweight test harness (no external frameworks)
- One executable per test category (`test_core_codec`, `test_entropy`, `test_jpeg_encoder`, etc.)
- PASS / FAIL terminal output
- Exit codes compatible with CTest

This document is updated regularly as new functionality is implemented.

---

# 1. Test Runner Architecture

Each test is a function:

```cpp
bool test_name();
```

The custom `runTest()` helper prints:

```
[PASS] test_name
[FAIL] test_name
```

and increments counters:

```cpp
runTest("test_name", &test_name, total, failed);
```

A summary is printed at the end:

```
Tests run: X
Tests failed: Y
```

The executable returns:
- `0` if all tests pass
- Non-zero if any test fails

This integrates cleanly with **CTest**.

---

# 2. Current Test Coverage (Updated)

This section lists all tests currently implemented and passing.

---

## 2.1 BlockExtractor Tests

**Location:** `tests/unit/test_core_codec.cpp`  
**Module:** `jpegdsp::core::BlockExtractor`

| Test name                     | Purpose                                                              |
|------------------------------|----------------------------------------------------------------------|
| `test_block_single_8x8`      | Extracting a single 8×8 block returns correct values.                |
| `test_block_16x8_two_blocks` | Two horizontal 8×8 blocks are extracted correctly without overlap.   |

---

## 2.2 Entropy Tests

**Location:** `tests/unit/test_core_codec.cpp`  
**Module:** `jpegdsp::core::Entropy`

| Test name                             | Purpose                                  |
|---------------------------------------|------------------------------------------|
| `test_entropy_constant`               | A constant vector must have entropy = 0. |
| `test_entropy_two_symbols_equal_prob` | 50/50 distribution must yield 1.0 bit.  |

---

## 2.3 Color Space Conversion Tests

**Location:** `tests/unit/test_core_codec.cpp`  
**Module:** `jpegdsp::core::ColorConverter`

| Test name                         | Purpose                                                    |
|-----------------------------------|------------------------------------------------------------|
| `test_colorspace_roundtrip_basic` | RGB → YCbCr → RGB round-trip stays within a small error.  |

---

## 2.4 DCT Tests

**Location:** `tests/unit/test_core_codec.cpp`  
**Module:** `jpegdsp::transforms::DCT8x8Transform`

| Test name                    | Purpose                                                           |
|------------------------------|-------------------------------------------------------------------|
| `test_dct_roundtrip_basic`   | Forward + inverse DCT reconstruct original block.                 |
| `test_dct_constant_block_dc` | Constant block yields only DC coefficient.                        |

---

## 2.5 Quantization Tests

**Location:** `tests/unit/test_core_codec.cpp`  
**Module:** `jpegdsp::jpeg::Quantizer`

| Test name                  | Purpose                                                   |
|---------------------------|-----------------------------------------------------------|
| `quant_identity_all_ones` | Quant table of all 1s preserves coefficients exactly.     |
| `quant_zero_block`        | Zero block stays zero after quant/dequant.                |

These tests confirm that **QuantTable**, scaling logic, rounding, and integer packing behave as expected.

---

## 2.6 ZigZag Tests

**Location:** `tests/unit/test_core_codec.cpp`  
**Module:** `jpegdsp::jpeg::ZigZag`

| Test name                  | Purpose                                                   |
|---------------------------|-----------------------------------------------------------|
| `zigzag_identity`         | Round-trip: toZigZag → fromZigZag reconstructs original. |
| `zigzag_known_pattern`    | DC coefficient (0,0) maps to index 0, (7,7) to index 63. |

These tests verify the standard JPEG zig-zag ordering (ITU-T81 Annex K.1) for serializing 8×8 blocks.

---

## 2.7 RLE Tests

**Location:** `tests/unit/test_core_codec.cpp`  
**Module:** `jpegdsp::jpeg::RLE`

| Test name                  | Purpose                                                   |
|---------------------------|-----------------------------------------------------------|
| `rle_all_zeroes`          | All-zero AC coefficients produce single EOB symbol.      |
| `rle_simple`              | Non-zero coefficients with short zero runs encode correctly. |
| `rle_zrl`                 | Runs of 16+ zeros generate ZRL (Zero Run Length) symbols. |
| `rle_trailing_zeroes`     | Trailing zeros after last non-zero emit EOB marker.      |

These tests verify JPEG-compliant AC coefficient run-length encoding.

---

## 2.8 Huffman Tests

**Location:** `tests/unit/test_core_codec.cpp`  
**Module:** `jpegdsp::jpeg::HuffmanTable`, `jpegdsp::jpeg::HuffmanEncoder`

| Test name                       | Purpose                                                        |
|--------------------------------|----------------------------------------------------------------|
| `huffman_dc_luma_table`        | DC luminance table has valid codes for categories 0-11.       |
| `huffman_dc_chroma_table`      | DC chrominance table has valid codes for categories 0-11.     |
| `huffman_ac_luma_table`        | AC luminance table has codes for EOB, ZRL, and common symbols.|
| `huffman_ac_chroma_table`      | AC chrominance table has codes for EOB and ZRL symbols.       |

These tests verify that baseline JPEG Huffman tables (ITU-T81 Annex K.3) are correctly built and accessible. The tests validate:
- All DC categories (0-11) have non-zero code lengths
- Special AC symbols (EOB=0x00, ZRL=0xF0) are present
- Common AC run/size combinations have valid codes

---

# 3. Planned Tests (Upcoming)  

## JPEGEncoder Pipeline Tests
- Small synthetic 16×16 image  
- Structural output validation  
- Block alignment correctness  

---

# 4. Running Tests

Build in Debug:

```
cmake --build build --config Debug
```

Run all tests:

```
ctest --test-dir build -C Debug -V
```

Or run a single test binary:

```
./build/tests/Debug/test_core_codec.exe
```

---

# 5. Notes

As modules mature, tests for:
- Huffman  
- JPEGWriter  
- JPEGEncoder (end-to-end)

will be added incrementally.

This ensures that **every DSP step in the JPEG pipeline is validated in isolation** before integration.

---

End of updated test documentation.