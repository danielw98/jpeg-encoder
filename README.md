# JPEG Encoder - DSP Image Compression

Educational JPEG encoder demonstrating Digital Signal Processing techniques in image compression.

**Live Demo:** https://sem1-cercetare.danielwagner.ro  
**Paper:** See `referat/` for academic documentation (Romanian)

## Features

- Complete ITU-T T.81 baseline JPEG encoder in C++17
- YCbCr 4:2:0 color encoding with DCT-II transform
- Web UI for interactive visualization (React + Node.js)
- Quality vs compression analysis tools

## Quick Start

### Build C++ Encoder
```bash
cd build
cmake ..
cmake --build . --config Release
```

### Run Web UI
```bash
# Backend
cd ui/backend && npm install && npm run dev

# Frontend (new terminal)
cd ui/frontend && npm install && npm run dev
```

Open http://localhost:3000

### CLI Usage
```bash
./jpegdsp_cli_encode --input image.png --output out.jpg --quality 75
```

## Project Structure

```
├── include/jpegdsp/    # C++ headers (core, transforms, jpeg)
├── src/                # C++ implementation
├── ui/
│   ├── backend/        # Node.js API server
│   └── frontend/       # React visualization
├── referat/            # Academic paper (Romanian)
└── data/               # Test images
```

## Architecture

The encoder follows the standard JPEG pipeline:

1. RGB → YCbCr color conversion
2. 4:2:0 chroma subsampling
3. 8×8 block DCT transform
4. Quantization with quality scaling
5. Zig-zag scan + RLE + Huffman coding
6. JFIF bitstream generation

## References

- ITU-T T.81 (JPEG Standard)
- Ahmed et al., "Discrete Cosine Transform" (1974)
- Wallace, "The JPEG Still Picture Compression Standard" (1991)

## Author

Daniel Wagner - Master ETTI, Research Course TCSI 2025-2026
