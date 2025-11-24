# jpegdsp – C++ DSP-Oriented JPEG Encoder

This project is an educational baseline JPEG encoder written in modern C++ (C++17),
with a strong focus on **Digital Signal Processing (DSP)** concepts: DCT-based
compression, entropy analysis, and extensible transforms (future wavelets / JPEG2000-like).

---

## Core C++ API

All public C++ headers live under `include/jpegdsp/`.

### Namespace layout

- `jpegdsp::core` – basic image structures and operations (pixels, color spaces, blocks, entropy).
- `jpegdsp::transforms` – transform interfaces and implementations (DCT now, wavelets later).
- `jpegdsp::jpeg` – JPEG-specific logic (quantization, zig-zag, RLE, Huffman, encoder).
- `jpegdsp::analysis` – hooks and observers for visualization and entropy logging.
- `jpegdsp::util` – small utilities (timing, bit writer, file I/O wrappers).

---

## 1. Core module (`jpegdsp::core`)

### 1.1 `Image`

**Header:** `include/jpegdsp/core/Image.hpp`  
**Namespace:** `jpegdsp::core`

The `Image` class owns a simple, tightly-packed image buffer in **interleaved**
layout (`RGBRGB...`), suitable for low-level DSP work.

```cpp
namespace jpegdsp::core {

class Image {
public:
    Image() = default;

    Image(std::size_t width,
          std::size_t height,
          ColorSpace colorSpace,
          std::size_t channels);

    std::size_t width() const noexcept;
    std::size_t height() const noexcept;
    std::size_t channels() const noexcept;
    ColorSpace  colorSpace() const noexcept;

    Pixel8*       data() noexcept;
    const Pixel8* data() const noexcept;

    Pixel8& at(std::size_t x, std::size_t y, std::size_t c);
    const Pixel8& at(std::size_t x, std::size_t y, std::size_t c) const;

private:
    std::size_t m_width    = 0;
    std::size_t m_height   = 0;
    std::size_t m_channels = 0;
    ColorSpace  m_colorSpace = ColorSpace::RGB;
    std::vector<Pixel8> m_buffer;
};

} // namespace jpegdsp::core
