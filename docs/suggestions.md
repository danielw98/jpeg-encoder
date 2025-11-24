# JPEGWriter Architectural Improvement Suggestions

## Overview

This document outlines potential improvements to the `JPEGWriter` module following the implementation of YCbCr 4:2:0 color JPEG encoding. The suggestions prioritize **code maintainability**, **extensibility for future JPEG modes** (progressive, hierarchical, lossless), and **testability**.

---

## 1. Component Struct for Modular SOF0/SOS Construction

### Current Issue
SOF0 (Start of Frame) and SOS (Start of Scan) markers currently have duplicated logic for component specification. The grayscale `writeSOF0()` and color `writeSOF0Color()` methods hardcode component parameters inline, making it difficult to extend to other modes (e.g., 4:2:2 subsampling, progressive).

### Proposed Solution
Introduce a `ComponentSpec` struct to encapsulate component metadata:

```cpp
namespace jpegdsp::jpeg {

/**
 * @brief Component specification for SOF0 and SOS markers
 */
struct ComponentSpec
{
    std::uint8_t id;              // Component ID (1=Y, 2=Cb, 3=Cr)
    std::uint8_t samplingFactors; // High nibble=H, low nibble=V (e.g., 0x22 = H2V2)
    std::uint8_t quantTableId;    // Quantization table selector (0=luma, 1=chroma)
    std::uint8_t dcTableId;       // DC Huffman table ID
    std::uint8_t acTableId;       // AC Huffman table ID
};

}
```

### Implementation Example
```cpp
// Replace writeSOF0Color() with:
void JPEGWriter::writeSOF0(std::uint16_t width, std::uint16_t height,
                            const std::vector<ComponentSpec>& components)
{
    writeMarker(SOF0);
    const std::uint16_t length = 8 + 3 * static_cast<std::uint16_t>(components.size());
    writeWord(length);
    writeByte(8);  // Sample precision
    writeWord(height);
    writeWord(width);
    writeByte(static_cast<std::uint8_t>(components.size()));
    
    for (const auto& comp : components)
    {
        writeByte(comp.id);
        writeByte(comp.samplingFactors);
        writeByte(comp.quantTableId);
    }
}

// Usage in encodeYCbCr():
std::vector<ComponentSpec> components = {
    {1, 0x22, 0, 0, 0},  // Y: H2V2, luma quant, luma DC/AC Huffman
    {2, 0x11, 1, 1, 1},  // Cb: H1V1, chroma quant, chroma DC/AC Huffman
    {3, 0x11, 1, 1, 1}   // Cr: H1V1, chroma quant, chroma DC/AC Huffman
};
writeSOF0(img.width(), img.height(), components);
```

### Benefits
- **Single SOF0 method** handles grayscale, 4:4:4, 4:2:0, 4:2:2, 4:1:1 subsampling
- **Declarative component configuration** improves readability
- **Easy to extend** for progressive JPEG (SOF2) or hierarchical (SOF5)

---

## 2. Inheritance Refactoring: JPEGWriterBase + Derived Classes

### Current Issue
`encodeGrayscale()` and `encodeYCbCr()` share significant code (SOI, APP0, DQT, EOI writing) but have divergent implementations for SOF0, SOS, and scan data. As more encoding modes are added (e.g., progressive, lossless), this duplication will grow.

### Proposed Solution
Refactor `JPEGWriter` into a base class with virtual methods for mode-specific logic:

```cpp
namespace jpegdsp::jpeg {

/**
 * @brief Base class for JPEG encoding with common marker writing
 */
class JPEGWriterBase
{
protected:
    std::vector<std::uint8_t> m_buffer;
    
    // Common marker methods (non-virtual)
    void writeSOI();
    void writeAPP0();
    void writeEOI();
    void writeMarker(std::uint16_t marker);
    void writeWord(std::uint16_t value);
    void writeByte(std::uint8_t value);
    
    // Mode-specific hooks (virtual)
    virtual void writeQuantizationTables(int quality) = 0;
    virtual void writeFrameHeader(std::uint16_t width, std::uint16_t height) = 0;
    virtual void writeHuffmanTables() = 0;
    virtual void writeScanHeader() = 0;
    virtual void writeScanData(const core::Image& img, int quality) = 0;
    
public:
    virtual ~JPEGWriterBase() = default;
    
    /**
     * @brief Template method pattern for encoding pipeline
     */
    std::vector<std::uint8_t> encode(const core::Image& img, int quality)
    {
        m_buffer.clear();
        writeSOI();
        writeAPP0();
        writeQuantizationTables(quality);
        writeFrameHeader(img.width(), img.height());
        writeHuffmanTables();
        writeScanHeader();
        writeScanData(img, quality);
        writeEOI();
        return m_buffer;
    }
};

/**
 * @brief Grayscale baseline JPEG encoder
 */
class JPEGWriterGrayscale : public JPEGWriterBase
{
protected:
    void writeQuantizationTables(int quality) override;
    void writeFrameHeader(std::uint16_t width, std::uint16_t height) override;
    void writeHuffmanTables() override;
    void writeScanHeader() override;
    void writeScanData(const core::Image& img, int quality) override;
};

/**
 * @brief YCbCr 4:2:0 baseline JPEG encoder
 */
class JPEGWriterYCbCr : public JPEGWriterBase
{
protected:
    void writeQuantizationTables(int quality) override;
    void writeFrameHeader(std::uint16_t width, std::uint16_t height) override;
    void writeHuffmanTables() override;
    void writeScanHeader() override;
    void writeScanData(const core::Image& img, int quality) override;
};

}
```

### Benefits
- **Eliminates code duplication** for SOI, APP0, EOI, marker utilities
- **Template Method pattern** provides clear encoding pipeline structure
- **Easy to add new modes**:
  - `JPEGWriterProgressive` for SOF2 (progressive DCT)
  - `JPEGWriterLossless` for SOF3 (lossless predictive)
- **Better separation of concerns**: Each derived class focuses on mode-specific logic

### Migration Strategy
1. Keep current `JPEGWriter` as-is for backward compatibility
2. Introduce new classes in `include/jpegdsp/jpeg/JPEGWriterV2.hpp`
3. Add deprecation warnings to `encodeGrayscale()` / `encodeYCbCr()`
4. Phase out old API in next major version

---

## 3. Enhanced Validation Tests

### Current Gap
Existing tests validate marker presence (SOI, DQT, SOF0, SOS, EOI) but don't verify:
- **Marker order correctness** (JFIF mandates specific sequence)
- **MCU structure** (e.g., 4:2:0 should have 6 blocks per MCU, not 4)
- **Huffman table completeness** (all 16 bit-length values present)
- **Quantization table validity** (no zero values, reasonable range)

### Proposed Tests

#### Test 1: Marker Sequence Validation
```cpp
bool test_jpegwriter_marker_order()
{
    Image img(16, 16, ColorSpace::RGB, 3);
    // ...fill image...
    
    JPEGWriter writer;
    std::vector<std::uint8_t> jpeg = writer.encodeYCbCr(img, 75);
    
    // Expected marker order: SOI → APP0 → DQT(luma) → DQT(chroma) → SOF0 → DHT(×4) → SOS → scan → EOI
    std::vector<std::uint16_t> expectedMarkers = {
        0xFFD8, // SOI
        0xFFE0, // APP0
        0xFFDB, // DQT (luma)
        0xFFDB, // DQT (chroma)
        0xFFC0, // SOF0
        0xFFC4, // DHT (DC luma)
        0xFFC4, // DHT (AC luma)
        0xFFC4, // DHT (DC chroma)
        0xFFC4, // DHT (AC chroma)
        0xFFDA  // SOS
    };
    
    std::size_t markerIdx = 0;
    for (std::size_t i = 0; i < jpeg.size() - 1 && markerIdx < expectedMarkers.size(); ++i)
    {
        if (jpeg[i] == 0xFF && jpeg[i+1] != 0x00)
        {
            std::uint16_t marker = (static_cast<std::uint16_t>(jpeg[i]) << 8) | jpeg[i+1];
            if (marker != expectedMarkers[markerIdx])
            {
                std::cerr << "Marker order mismatch at index " << markerIdx
                          << ": expected 0x" << std::hex << expectedMarkers[markerIdx]
                          << ", got 0x" << marker << std::dec << "\n";
                return false;
            }
            ++markerIdx;
        }
    }
    
    return markerIdx == expectedMarkers.size();
}
```

#### Test 2: MCU Block Count Validation
```cpp
bool test_jpegwriter_mcu_structure()
{
    // 16×16 image = 1 MCU for 4:2:0
    // Expected: 4 Y blocks + 1 Cb block + 1 Cr block = 6 blocks total
    // Each block produces ~10-50 bytes after entropy coding (rough estimate)
    
    Image img(16, 16, ColorSpace::RGB, 3);
    // ...fill with known pattern...
    
    JPEGWriter writer;
    std::vector<std::uint8_t> jpeg = writer.encodeYCbCr(img, 75);
    
    // Locate SOS marker, skip 12 bytes (SOS header), then measure scan data
    // Scan data ends at EOI (0xFFD9)
    // For a 16×16 image with 6 blocks/MCU, expect ~60-300 bytes of entropy-coded data
    
    // (Detailed implementation would parse scan data length)
    // This is a placeholder for the concept
    
    return true; // Replace with actual logic
}
```

#### Test 3: SOF0 Component Validation
```cpp
bool test_jpegwriter_sof0_components()
{
    Image img(16, 16, ColorSpace::RGB, 3);
    // ...fill image...
    
    JPEGWriter writer;
    std::vector<std::uint8_t> jpeg = writer.encodeYCbCr(img, 75);
    
    // Locate SOF0 marker (0xFFC0), parse header
    // Expected structure:
    // - Length: 17 (2 + 1 + 2 + 2 + 1 + 9)
    // - Precision: 8
    // - Height: 16
    // - Width: 16
    // - Number of components: 3
    // - Component 1: ID=1, H2V2 (0x22), quant table 0
    // - Component 2: ID=2, H1V1 (0x11), quant table 1
    // - Component 3: ID=3, H1V1 (0x11), quant table 1
    
    // (Implementation would parse SOF0 segment)
    
    return true; // Replace with actual parsing logic
}
```

### Benefits
- **Catches subtle bugs** in marker generation
- **Validates JPEG compliance** beyond basic marker presence
- **Improves confidence** in decoder compatibility

---

## 4. Progressive JPEG Roadmap

### Current State
Only baseline sequential (SOF0) is implemented. Progressive JPEG (SOF2) offers better perceptual quality at low bitrates via successive approximation.

### Implementation Steps

#### Step 1: Scan Decomposition
Progressive JPEG requires multiple scans:
- **Spectral selection**: DC-only scan, then AC coefficients in bands (0-5, 6-63, etc.)
- **Successive approximation**: High-order bits first, then refinement scans

```cpp
struct ProgressiveScanSpec
{
    std::vector<std::uint8_t> componentIds;  // Which components (Y, Cb, Cr)
    std::uint8_t spectralStart;              // Start coefficient (0 = DC)
    std::uint8_t spectralEnd;                // End coefficient (63 = last AC)
    std::uint8_t successiveApproxHigh;       // Bit position high
    std::uint8_t successiveApproxLow;        // Bit position low
};
```

#### Step 2: Coefficient Buffering
Unlike sequential JPEG (which encodes blocks immediately), progressive mode requires:
- **Full-image DCT coefficient buffer** (Width × Height × 64 coefficients)
- Multiple passes over the buffer for each scan

```cpp
class ProgressiveEncoder
{
private:
    std::vector<Block8x8i> m_coefficientBuffer;  // Store all quantized blocks
    
public:
    void bufferCoefficients(const core::Image& img, int quality);
    void writeScan(const ProgressiveScanSpec& spec, util::BitWriter& writer);
};
```

#### Step 3: SOF2 Marker
Replace `writeSOF0()` with `writeSOF2()` for progressive mode:
```cpp
void JPEGWriterProgressive::writeFrameHeader(std::uint16_t width, std::uint16_t height)
{
    writeMarker(0xFFC2);  // SOF2 instead of SOF0
    // ...rest of header same as SOF0...
}
```

### Benefits
- **Better web performance**: Progressive JPEGs load incrementally (low-res → high-res)
- **Research potential**: Compare compression efficiency vs. baseline
- **Demonstrates advanced DSP**: Multi-pass encoding, bit-plane coding

---

## 5. Huffman Table Optimization

### Current Limitation
Standard JPEG Huffman tables (ITU-T.81 Annex K.3) are used for all images. Custom tables tailored to specific image statistics can improve compression by 5-15%.

### Proposed Enhancement
Implement **two-pass encoding**:
1. **Pass 1**: Collect symbol frequency statistics from quantized coefficients
2. **Generate optimal Huffman tables** using a priority queue (Huffman algorithm)
3. **Pass 2**: Encode with optimized tables

```cpp
class OptimizedHuffmanTable
{
public:
    /**
     * @brief Generate optimal Huffman table from symbol frequencies
     * @param frequencies Map of symbol → count
     * @return HuffmanTable with optimized code lengths
     */
    static HuffmanTable fromFrequencies(const std::map<std::uint8_t, std::uint32_t>& frequencies);
};

// Usage:
std::map<std::uint8_t, std::uint32_t> dcFrequencies;
std::map<std::uint8_t, std::uint32_t> acFrequencies;
// ...collect frequencies during first pass...

HuffmanTable optimizedDC = OptimizedHuffmanTable::fromFrequencies(dcFrequencies);
HuffmanTable optimizedAC = OptimizedHuffmanTable::fromFrequencies(acFrequencies);
```

### Trade-offs
- **Pros**: Better compression ratio, demonstrates Huffman algorithm implementation
- **Cons**: Slower encoding (two-pass), larger file header (custom tables), potential decoder incompatibility

---

## 6. Chroma Subsampling Flexibility

### Current Limitation
Only 4:2:0 (2×2 downsampling) is implemented for color JPEGs. Some applications need:
- **4:4:4**: No subsampling (archival quality, graphics)
- **4:2:2**: Horizontal subsampling only (video formats like MPEG-2)
- **4:1:1**: Aggressive subsampling (low-bitrate scenarios)

### Proposed API
```cpp
enum class ChromaSubsampling
{
    Chroma444,  // No subsampling (Y, Cb, Cr all full resolution)
    Chroma422,  // Horizontal 2× subsampling
    Chroma420,  // 2×2 subsampling
    Chroma411   // Horizontal 4× subsampling
};

std::vector<std::uint8_t> JPEGWriter::encodeYCbCr(const core::Image& img,
                                                    int quality,
                                                    ChromaSubsampling subsampling = ChromaSubsampling::Chroma420);
```

### Downsampler Enhancements
```cpp
class Downsampler
{
public:
    Image downsample420(const Image& cb, const Image& cr) const;  // Existing
    Image downsample422(const Image& cb, const Image& cr) const;  // New: horizontal only
    Image downsample411(const Image& cb, const Image& cr) const;  // New: 4× horizontal
};
```

### SOF0 Sampling Factor Updates
```cpp
// 4:2:2 sampling factors:
// Y: H2V1 (0x21)
// Cb/Cr: H1V1 (0x11)

// 4:1:1 sampling factors:
// Y: H4V1 (0x41)
// Cb/Cr: H1V1 (0x11)
```

---

## 7. Error Handling and Validation

### Current Gaps
- **No dimension validation** for 4:4:4 mode (only requires multiple-of-8, not multiple-of-16)
- **No input sanitization** for quality parameter (values outside 1-100 crash)
- **No colorspace mismatch detection** (calling `encodeGrayscale()` on RGB image throws exception, but message could be clearer)

### Proposed Improvements

#### Input Validation Utility
```cpp
namespace jpegdsp::jpeg {

class JPEGValidator
{
public:
    /**
     * @brief Validate image dimensions for given subsampling mode
     * @throws std::invalid_argument if dimensions invalid
     */
    static void validateDimensions(std::size_t width, std::size_t height,
                                     ChromaSubsampling subsampling);
    
    /**
     * @brief Clamp quality to valid range [1, 100]
     */
    static int clampQuality(int quality);
    
    /**
     * @brief Validate colorspace matches encoding mode
     * @throws std::invalid_argument if mismatch
     */
    static void validateColorSpace(const core::Image& img, ColorSpace expected);
};

}
```

#### Usage in encodeYCbCr()
```cpp
std::vector<std::uint8_t> JPEGWriter::encodeYCbCr(const core::Image& img, int quality)
{
    // Validate inputs
    JPEGValidator::validateColorSpace(img, ColorSpace::RGB);
    JPEGValidator::validateDimensions(img.width(), img.height(), ChromaSubsampling::Chroma420);
    quality = JPEGValidator::clampQuality(quality);
    
    // ...rest of encoding...
}
```

---

## Summary of Priority Recommendations

| Priority | Suggestion | Effort | Impact |
|----------|-----------|--------|--------|
| **High** | Component Struct (§1) | Low | Immediate extensibility for 4:2:2, progressive |
| **High** | Validation Tests (§3) | Medium | Catches compliance bugs, improves reliability |
| **Medium** | Inheritance Refactoring (§2) | High | Long-term maintainability, reduces duplication |
| **Medium** | Chroma Subsampling Flexibility (§6) | Low | Adds common JPEG modes (4:2:2, 4:4:4) |
| **Low** | Progressive JPEG (§4) | Very High | Research value, web performance (non-critical) |
| **Low** | Huffman Optimization (§5) | High | Better compression (diminishing returns) |
| **Low** | Error Handling (§7) | Low | User experience improvement |

---

## Implementation Sequence (Suggested)

1. **Phase 1: Quick Wins** (1-2 weeks)
   - Add `ComponentSpec` struct (§1)
   - Implement marker sequence validation test (§3)
   - Add input validation utility (§7)

2. **Phase 2: Mode Extensions** (2-3 weeks)
   - Implement 4:2:2 and 4:4:4 subsampling (§6)
   - Add SOF0 component validation test (§3)

3. **Phase 3: Architectural Refactor** (4-6 weeks)
   - Introduce `JPEGWriterBase` inheritance hierarchy (§2)
   - Migrate existing code to new API
   - Deprecate old methods

4. **Phase 4: Advanced Features** (8+ weeks)
   - Progressive JPEG implementation (§4)
   - Optimal Huffman table generation (§5)

---

## Conclusion

The current `JPEGWriter` implementation is **functionally complete** for baseline sequential grayscale and YCbCr 4:2:0 encoding. The above suggestions focus on:
- **Short-term**: Improving testability and adding common JPEG modes (4:2:2, 4:4:4)
- **Medium-term**: Refactoring for maintainability as the codebase grows
- **Long-term**: Exploring advanced JPEG features (progressive, optimized Huffman)

Prioritize based on project goals: if this is purely educational, **§1 (Component Struct)** and **§3 (Validation Tests)** provide the best learning value. If preparing for production use, **§2 (Inheritance)** and **§7 (Error Handling)** are critical.
