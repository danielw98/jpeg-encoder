
# JPEGDSP Test Suite

This document describes the automated tests for the **jpegdsp** project.  
The test suite validates each DSP building block and the JPEG encoding pipeline step-by-step, using small focused tests that prevent regressions and ensure correctness.

The project currently uses:
- A custom lightweight test harness (no external frameworks)
- One executable per test category (`test_dct`, `test_entropy`, `test_jpeg_encoder`, etc.)
- PASS / FAIL terminal output
- Exit codes compatible with CTest

This document will be updated as new modules and tests are added.

---

# 1. Test Runner Architecture

Each test is a function:

```cpp
bool test_name();
```

The custom `runTest()` helper prints:

```text
[PASS] test_name
[FAIL] test_name
```

and increments counters:

```cpp
runTest("test_name", &test_name, total, failed);
```

A summary is printed at the end:

```text
Tests run: X
Tests failed: Y
```

The executable returns:
- `0` if all tests pass  
- non-zero if any test fails  

This allows seamless integration with CTest.

---

# 2. Current Test Coverage

This section describes all currently implemented tests.

---

## 2.1 BlockExtractor Tests

**Location:** `tests/unit/test_dct.cpp`  
**Module:** `jpegdsp::core::BlockExtractor`

| Test name                     | Purpose                                                              |
|------------------------------|----------------------------------------------------------------------|
| `test_block_single_8x8`      | Ensures extracting a single 8×8 block returns correct values.       |
| `test_block_16x8_two_blocks` | Ensures extracting two horizontal 8×8 blocks preserves all pixels.  |

### Validates:
- Correct block tiling  
- Left-to-right / top-to-bottom ordering  
- No off-by-one errors  
- Correct mapping of image pixels to block positions  

---

## 2.2 Entropy Tests

**Location:** `tests/unit/test_dct.cpp`  
**Module:** `jpegdsp::core::Entropy`

| Test name                             | Purpose                                  |
|---------------------------------------|------------------------------------------|
| `test_entropy_constant`               | Constant vector must have entropy = 0.   |
| `test_entropy_two_symbols_equal_prob` | 50/50 distribution must have entropy=1. |

### Validates:
- Correct Shannon entropy formula  
- Accurate probability estimation  
- Numerical stability  

---

## 2.3 Color Space Conversion Tests

**Location:** `tests/unit/test_dct.cpp`  
**Module:** `jpegdsp::core::ColorConverter`

| Test name                        | Purpose                                                    |
|----------------------------------|------------------------------------------------------------|
| `test_colorspace_roundtrip_basic` | RGB → YCbCr → RGB round-trip stays within a small error. |

### Validates:
- RGB↔YCbCr equations  
- Proper rounding and clamping  
- Approximate reversibility of the transform  

---

## 2.4 DCT (Discrete Cosine Transform) Tests

**Location:** `tests/unit/test_dct.cpp`  
**Module:** `jpegdsp::transforms::DCT8x8Transform`

| Test name                    | Purpose                                                           |
|------------------------------|-------------------------------------------------------------------|
| `test_dct_roundtrip_basic`   | DCT + inverse DCT reconstructs the original block (± tolerance). |
| `test_dct_constant_block_dc` | Constant block produces only DC, AC coefficients ≈ 0.            |

### Validates:
- Correct orthonormal DCT-II implementation  
- Correct inverse transform  
- Proper α(u) scaling and cosine table usage  
- Numerical consistency and stability  

---

# 3. Planned Tests (Upcoming)

These tests will be added when new modules are implemented.

## 3.1 ZigZag Tests (Planned)

- `test_zigzag_forward_identity`  
- `test_zigzag_forward_known_pattern`  
- `test_zigzag_inverse_identity`  
- `test_zigzag_inverse_known_pattern`

### Validates:
- Correct zig-zag ordering of 8×8 coefficients  
- Reversibility of forward/inverse zig-zag

---

## 3.2 RLE (Run-Length Encoding) Tests (Planned)

- `test_rle_all_zeroes`  
- `test_rle_simple_sequence`  
- `test_rle_multiple_zero_runs`

### Validates:
- Accurate AC run-length encoding  
- Proper handling of zero runs  

---

## 3.3 Quantization Tests (Planned)

- `test_quantize_basic`  
- `test_inverse_quantize_basic`  
- `test_quantization_rounding`

### Validates:
- Correct application of quantization tables  
- Correct inverse quantization  
- Rounding behavior

---

## 3.4 Huffman Encoder Tests (Planned)

- `test_huffman_generate_tables`  
- `test_huffman_encode_dc`  
- `test_huffman_encode_ac`  
- `test_huffman_bitstream_consistency`

### Validates:
- Proper construction and use of Huffman tables  
- Correct JPEG-style bitstream encoding  

---

## 3.5 JPEGEncoder Pipeline Tests (Planned)

- `test_jpegencoder_small_image`  
- `test_jpegencoder_block_alignment`  
- `test_jpegencoder_output_structure`

### Validates:
- End-to-end JPEG pipeline behavior  
- Correct handling of image dimensions and blocks  
- Basic structural validity of output JPEG

---

# 4. Running Tests

Build the project in Debug mode:

```bash
cmake --build build --config Debug
```

Run all tests via CTest:

```bash
ctest --test-dir build -C Debug -V
```

Or run a specific test binary directly, for example:

```bash
./build/tests/Debug/test_dct.exe
```

---
