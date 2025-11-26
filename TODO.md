# Future Enhancements TODO

## Phase 2: Decoder (Priority: HIGH)
**Estimated effort:** 1-2 weeks

- [ ] Inverse DCT (DCT-III)
- [ ] Huffman decoder (symbol lookup tables)
- [ ] Inverse quantization
- [ ] Inverse zigzag scan
- [ ] YCbCr → RGB conversion
- [ ] Chroma upsampling (4:2:0 → 4:4:4)
- [ ] Marker parsing and validation
- [ ] Integration tests (encode → decode → compare)

## Phase 3: Enhanced Color Support (Priority: MEDIUM)
**Estimated effort:** 1 week

- [ ] 4:2:2 chroma subsampling (horizontal 2:1)
- [ ] 4:4:4 chroma subsampling (no subsampling)
- [ ] MCU structure refactoring for variable sampling
- [ ] Update CLI to support `--chroma 420|422|444` flag
- [ ] Test images for each chroma format

## Phase 4: Advanced JPEG Features (Priority: MEDIUM)
**Estimated effort:** 1 month

- [ ] Progressive JPEG (SOF2)
  - [ ] Spectral selection (frequency bands)
  - [ ] Successive approximation (bit planes)
  - [ ] Multi-scan encoding
- [ ] Optimized Huffman tables (two-pass encoding)
  - [ ] Symbol frequency counting
  - [ ] Huffman tree generation
  - [ ] Custom DHT segment writing
- [ ] Restart markers (DRI/RST0-RST7)
  - [ ] MCU restart interval configuration
  - [ ] Error resilience testing
- [ ] EXIF metadata support (APP1)
  - [ ] TIFF header parsing/writing
  - [ ] Common EXIF tags (camera, GPS, orientation)
  - [ ] Thumbnail embedding

## Phase 5: Image Processing Extensions (Priority: LOW)
**Estimated effort:** 2-3 weeks

### OpenCV Integration
- [x] Add OpenCV as optional dependency (use `find_package(OpenCV)`)
- [ ] Create `jpegdsp::imgproc` namespace for image processing
- [ ] Wrapper functions for common operations

### Filtering & Enhancement
- [ ] **Spatial Filters** (via convolution)
  - [ ] Gaussian blur (noise reduction before JPEG encoding)
  - [ ] Sharpening kernels (unsharp mask)
  - [ ] Mean/median filters
  - [ ] Custom kernel convolution
- [ ] **Edge Detection**
  - [ ] Sobel operator (gradient magnitude)
  - [ ] Canny edge detector
  - [ ] Laplacian
- [ ] **Frequency Domain**
  - [ ] 2D FFT/IFFT (frequency analysis)
  - [ ] Frequency-domain filtering
  - [ ] DCT-based denoising (soft thresholding)
- [ ] **Morphological Operations**
  - [ ] Erosion/dilation
  - [ ] Opening/closing
  - [ ] Hit-or-miss transform
- [ ] **Color Processing**
  - [ ] Histogram equalization
  - [ ] Color space conversions (HSV, LAB, etc.)
  - [ ] White balance adjustment
  - [ ] Gamma correction

### Analysis Tools
- [ ] **Quality Metrics**
  - [ ] PSNR (Peak Signal-to-Noise Ratio)
  - [ ] SSIM (Structural Similarity Index)
  - [ ] MSE (Mean Squared Error)
  - [ ] Perceptual quality metrics
- [ ] **DCT Coefficient Analysis**
  - [ ] Visualize DCT coefficients per block
  - [ ] Energy distribution plots
  - [ ] Quantization impact visualization
- [ ] **Compression Analysis**
  - [ ] Bit rate vs. quality curves
  - [ ] Rate-distortion optimization
  - [ ] Huffman symbol frequency analysis

### CLI Enhancements
- [ ] `--preprocess <filter>` flag (e.g., `--preprocess gaussian_blur`)
- [ ] `--compare <reference.jpg>` (compute PSNR/SSIM)
- [ ] `--analyze` mode (output DCT/entropy stats)
- [ ] `--batch <directory>` (process multiple images)
- [ ] Progress bars for long operations

### Integration Examples
```cpp
// Example: Denoise → JPEG encode
Image img = ImageIO::load("noisy.png");
Image denoised = imgproc::gaussianBlur(img, 5, 1.5);  // 5x5 kernel, σ=1.5
auto result = JPEGEncoder::encode(denoised, 85);

// Example: Edge-preserving encoding
Image edges = imgproc::cannyEdges(img, 50, 150);
Image masked = imgproc::blend(img, edges, 0.3);  // Overlay edges
JPEGEncoder::encodeToFile(masked, "output.jpg", 90);

// Example: Quality assessment
Image original = ImageIO::load("input.png");
auto encoded = JPEGEncoder::encode(original, 75);
Image decoded = JPEGDecoder::decode(encoded.jpegData);
double psnr = imgproc::computePSNR(original, decoded);
double ssim = imgproc::computeSSIM(original, decoded);
```

## Phase 6: Performance Optimization (Priority: LOW)
**Estimated effort:** 2 months

- [ ] SIMD DCT (SSE/AVX on x86, NEON on ARM)
- [ ] Parallel block processing (OpenMP or std::thread)
- [ ] Cache-friendly memory layout
- [ ] Huffman table lookup optimization (pre-computed codes)
- [ ] Profiling and bottleneck identification
- [ ] Benchmark suite (compare with libjpeg-turbo)

**Expected speedup:** 5-10× faster encoding

## Phase 7: Validation & Testing (Priority: HIGH - Continuous)
**Estimated effort:** Ongoing

- [x] Synthetic test image suite (14 images)
- [x] CLI validation script (4 test categories)
- [ ] **Real-world test images**
  - [ ] Download Kodak PhotoCD suite (24 images)
  - [ ] USC-SIPI image database
  - [ ] JPEG AI validation set
- [ ] **Conformance testing**
  - [ ] Compare output with libjpeg-turbo (byte-level)
  - [ ] Validate with IJG's jpeg-test suite
  - [ ] Cross-platform testing (Windows, Linux, macOS)
- [ ] **Fuzzing**
  - [ ] Fuzz encoder with random/malformed inputs
  - [ ] Fuzz decoder with corrupted JPEGs
  - [ ] AFL/libFuzzer integration
- [ ] **Unit test expansion**
  - [ ] Edge cases (1×1, 17×17, 4097×4097 images)
  - [ ] Extreme quality levels (1, 100)
  - [ ] Grayscale vs. color edge cases
  - [ ] Invalid input handling

## Dependencies Roadmap

### Current Dependencies
- [x] nlohmann/json (header-only, CMake FetchContent)
- [x] stb_image.h (header-only, PPM/PGM/PNG loading)

### Future Optional Dependencies
- [ ] **OpenCV** (image processing)
  - Installation: `vcpkg install opencv` or system package
  - CMake: `find_package(OpenCV REQUIRED)`
  - Use: Wrapped in `#ifdef JPEGDSP_USE_OPENCV`
- [ ] **libjpeg-turbo** (reference comparison)
  - Use only for validation, not production code
  - Compare encoding output for correctness
- [ ] **Google Benchmark** (performance testing)
  - Micro-benchmarks for DCT, quantization, Huffman
  - Track performance regressions

## Documentation TODO

- [ ] Add Doxygen comments to all public APIs
- [ ] Architecture deep-dive (pipeline flow diagrams)
- [ ] JPEG format tutorial (for beginners)
- [ ] Performance tuning guide
- [ ] Contribution guidelines
- [ ] Code style guide (clang-format config)

## Build System TODO

- [ ] Add CMake presets (Debug, Release, RelWithDebInfo)
- [ ] Support vcpkg for dependency management
- [ ] Add Clang/GCC build configurations
- [ ] CI/CD pipeline (GitHub Actions)
  - [ ] Build on Windows/Linux/macOS
  - [ ] Run all tests
  - [ ] Code coverage reports (gcov/lcov)
  - [ ] Static analysis (clang-tidy)
- [ ] Package as shared library (.dll/.so)
- [ ] NuGet/Conan package generation

## Research Applications

- [ ] **Rate-Distortion Optimization**
  - Lagrangian multiplier tuning
  - Optimal quantization table generation
- [ ] **Machine Learning Integration**
  - CNN-based quantization matrix prediction
  - Perceptual quality optimization
  - Super-resolution pre-processing
- [ ] **HDR JPEG**
  - Extended bit depth (10-bit, 12-bit)
  - Tone mapping integration
- [ ] **JPEG XL Exploration**
  - Study next-gen codec features
  - Compare with baseline JPEG

---

## Quick Wins (Can Implement Now)

1. ✅ **PNG input support via stb_image** (DONE)
2. ✅ **Test image generation** (DONE)
3. ✅ **CLI validation script** (DONE)
4. [ ] **Batch encoding** (`--batch <dir>` flag)
5. [ ] **Progress output** (`--verbose` flag)
6. [ ] **Reference comparison** (encode with jpegdsp + libjpeg, compare sizes)

---

## Notes

- **OpenCV Integration Strategy:**
  - Make OpenCV **optional** via CMake option: `option(JPEGDSP_USE_OPENCV "Enable OpenCV features" OFF)`
  - Guard all OpenCV code with `#ifdef JPEGDSP_USE_OPENCV`
  - Document installation: `cmake -DJPEGDSP_USE_OPENCV=ON ..`
  - Provide fallback implementations where possible

- **Priority Guidelines:**
  - **Phase 2 (Decoder):** Critical for validation and round-trip testing
  - **Phase 7 (Validation):** Run continuously alongside development
  - **Phase 5 (Image Processing):** Nice-to-have, but not core JPEG functionality
  - **Phase 6 (Performance):** Optimize only after correctness is proven

- **Code Quality:**
  - Keep modules decoupled (imgproc should not depend on jpeg)
  - Maintain test coverage >90%
  - Document complex algorithms with references to papers/standards
  - Follow existing naming conventions (PascalCase for classes, camelCase for functions)
