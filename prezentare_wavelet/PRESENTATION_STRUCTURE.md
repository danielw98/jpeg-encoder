# Wavelet Presentation Structure

> Comprehensive reference for the interactive wavelet presentation
> Last updated: November 29, 2025

## Overview

This presentation teaches **wavelet transforms** for image processing, building from Fourier fundamentals through to practical applications like JPEG2000. It consists of:

- **FastAPI Backend** (port 8000): Python-based signal/image processing APIs
- **Vite/React Frontend** (port 3000): Interactive slides with embedded demos
- **31 slides** across 11 sections

---

## Architecture

```
prezentare_wavelet/
├── backend/
│   └── main.py          # FastAPI server (pywt, numpy, PIL)
├── frontend/
│   └── src/
│       ├── components/  # React view components
│       └── styles/      # CSS modules
└── data/                # Test images (peppers, lena, etc.)
```

### Key Files

| File | Purpose |
|------|---------|
| `GuidedTour.jsx` | Main presentation controller, defines all 31 slides in `SLIDES` array |
| `tour.css` | Styling for slides, navigation, progress sidebar |
| `FourierView.jsx` | Interactive Fourier transform demo |
| `FiltersView.jsx` | Digital filters visualization (low-pass, high-pass) |
| `ConvolutionView.jsx` | 1D convolution animation |
| `KernelsView.jsx` | 2D kernel effects on images |
| `KernelsEducationalView.jsx` | **Pixel-by-pixel** convolution demo (slide 16) |
| `WaveletPlayground.jsx` | Interactive scale/shift wavelet explorer |
| `WaveletEducationView.jsx` | Wavelet families theory and comparison |
| `WaveletBasisView.jsx` | Wavelet basis functions (Haar, Daubechies, etc.) |
| `DecomposeView.jsx` | 2D Mallat decomposition (LL, LH, HL, HH) |
| `DenoiseView.jsx` | Wavelet thresholding for noise removal |
| `CompareView.jsx` | DCT (JPEG) vs Wavelet (JPEG2000) comparison |

---

## Slide Reference

### Section 1: INTRO (Slides 1-2)

| # | ID | Type | Title | Description |
|---|-----|------|-------|-------------|
| 1 | `intro-title` | Title | Wavelets în Procesarea Imaginilor | Opening splash with subtitle "O călătorie de la Fourier la JPEG2000" |
| 2 | `intro-toc` | Table of Contents | Cuprins | Clickable chapter list with icons, navigates to sections |

### Section 2: FOURIER (Slides 3-5)

| # | ID | Type | Title | Description |
|---|-----|------|-------|-------------|
| 3 | `fourier-title` | Title | Transformata Fourier | Section opener |
| 4 | `fourier-theory` | Theory | Descompunere în Frecvențe | Formula F(ω), key points about frequency analysis |
| 5 | `fourier-demo` | Interactive | Demo Interactiv: Fourier | **FourierView.jsx** - Time domain → Frequency domain visualization |

**FourierView Features:**
- Preset signals (sine, chirp, gaussian pulse, square wave)
- Custom expression input
- Time domain + Frequency spectrum canvas plots
- Real-time FFT computation via API

### Section 3: FILTERS (Slides 6-9)

| # | ID | Type | Title | Description |
|---|-----|------|-------|-------------|
| 6 | `filters-title` | Title | Filtre Digitale | Section opener |
| 7 | `filters-theory` | Theory (Detailed) | Filtre în Domeniul Frecvență | Three filter types: Ideal, Butterworth, Gaussian with formulas |
| 8 | `filters-demo` | Interactive | Demo Interactiv: Filtre | **FiltersView.jsx** - Apply filters to signals |
| 9 | `filters-wavelets` | Connection | Conexiunea cu Wavelets | Bridge slide: filter banks → wavelet decomposition |

**FiltersView Features:**
- Signal presets (5Hz+50Hz, chirp, etc.)
- Filter type selector (lowpass/highpass)
- Filter shape (ideal/butterworth/gaussian)
- Cutoff frequency slider
- Original + filtered signal comparison
- Frequency spectrum overlay

### Section 4: CONVOLUTION (Slides 10-12)

| # | ID | Type | Title | Description |
|---|-----|------|-------|-------------|
| 10 | `conv-title` | Theory | Convoluția | Definition, formula, key points |
| 11 | `conv-demo` | Embed | Demo: Convoluție 1D | **ConvolutionView.jsx** - Animated 1D convolution |
| 12 | `conv-2d` | Theory-Visual | Convoluția în Imagini (2D) | 2D formula + DWT 2D coefficients (LL, LH, HL, HH) with decimation explanation |

**ConvolutionView Features:**
- Signal generator (chirp, step, triangle)
- Kernel selection (moving average, gaussian, derivative, laplacian)
- Variable kernel size (3-15)
- Step-by-step animation showing kernel sliding
- Output signal visualization

**Slide 12 Special Content:**
- DWT 2D coefficient grid showing LL (approximation), LH (horizontal), HL (vertical), HH (diagonal)
- Decimation formula: ↓2 keeps even-indexed pixels → N/2 × N/2 output

### Section 5: KERNELS (Slides 13-17)

| # | ID | Type | Title | Description |
|---|-----|------|-------|-------------|
| 13 | `kernels-title` | Title | Kernel-uri 2D | Section opener |
| 14 | `kernels-theory` | Theory | Matrici de Convoluție | 2D convolution formula, blur/sharpen/edge points |
| 15 | `kernels-explanation` | Embed | Explicații Kernel-uri | **KernelsView.jsx** with `explanationOnly=true` |
| 16 | `kernels-edu` | Embed | Demo Educațional: Kernel pas cu pas | **KernelsEducationalView.jsx** - Pixel-by-pixel convolution |
| 17 | `kernels-demo` | Embed | Demo: Kernel-uri pe Imagini Reale | **KernelsView.jsx** - Full image kernel effects |

**KernelsEducationalView (Slide 16) Features:**
- **Sprite selection**: Small test images (Mario, Link, mushroom, etc.)
- **Kernel types**: Box Blur, Gaussian, Sobel X/Y, Sharpen, Laplacian, Identity
- **Kernel size slider**: 3×3, 4×4, 5×5 (NO 6×6)
- **Animation speed**: 50-500ms per pixel
- **Play/Pause/Reset controls**
- **Two pixel grids**: Input (with highlight) and Output (progressively filled)
- **Side panel calculation display**:
  - Region matrix (pixels under kernel) with grayscale values
  - Kernel matrix with weights (green=positive, red=negative)
  - Result pixel with computed value
- **Edge replication**: Border pixels use replicated edge values (not zero padding)

**KernelsView Features:**
- Full image processing
- Kernel matrix visualization with LaTeX
- Before/after comparison
- Multiple kernel presets

### Section 6: WAVELETS PLAYGROUND (Slides 18-20)

| # | ID | Type | Title | Description |
|---|-----|------|-------|-------------|
| 18 | `wavelet-title` | Title | Transformata Wavelet | Section opener |
| 19 | `wavelet-theory` | Theory | De ce Wavelets? | Localization advantages, ψ formula |
| 20 | `wavelet-demo` | Embed | Demo: Wavelet Playground | **WaveletPlayground.jsx** |

**WaveletPlayground Features:**
- Wavelet types: Sinusoidă, Haar, Mexican Hat, Morlet
- **Scale (a)** slider: Controls frequency/width
- **Shift (b)** slider: Controls position
- Mathematical equation display for each wavelet
- Real-time wavelet visualization on canvas

### Section 7: WAVELET THEORY (Slides 21-22)

| # | ID | Type | Title | Description |
|---|-----|------|-------|-------------|
| 21 | `theory-title` | Title | Teorie Wavelets | Section opener |
| 22 | `theory-demo` | Embed | Demo: Teorie Wavelets | **WaveletEducationView.jsx** |

**WaveletEducationView Features:**
- Detailed wavelet family cards: Haar, Morlet, Daubechies, Biorthogonal
- Mathematical definitions (ψ, φ functions)
- Properties list for each wavelet
- Applications and advantages/disadvantages
- Interactive wavelet selection with live visualization

### Section 8: WAVELET BASIS (Slides 23-25)

| # | ID | Type | Title | Description |
|---|-----|------|-------|-------------|
| 23 | `basis-title` | Title | Baze Wavelet | Section opener |
| 24 | `basis-theory` | Theory | Familii Wavelet | Admissibility condition, Haar/Daubechies/Biorthogonal |
| 25 | `basis-demo` | Embed | Demo: Baze Wavelet | **WaveletBasisView.jsx** |

**WaveletBasisView Features:**
- Wavelet family dropdown (db1-db10, sym2-sym8, coif1-coif5, bior, rbio)
- Basis function plots (φ scaling, ψ wavelet)
- Filter coefficient visualization (lowpass, highpass)
- API-driven data from pywt library

### Section 9: DECOMPOSITION (Slides 26-28)

| # | ID | Type | Title | Description |
|---|-----|------|-------|-------------|
| 26 | `decomp-title` | Title | Descompunere 2D | Section opener |
| 27 | `decomp-theory` | Theory | Cele 4 Sub-benzi | LL/LH/HL/HH matrix, descriptions |
| 28 | `decomp-demo` | Embed | Demo: Descompunere | **DecomposeView.jsx** |

**DecomposeView Features:**
- Image selector from sample images
- Wavelet family selector (Haar, db4, db8, bior2.2, bior4.4, sym4, coif2)
- Decomposition levels (1-6)
- Visual output: 4-quadrant decomposition image
- Highlighting of LL (approximation) and detail subbands

### Section 10: DENOISING (Slides 29-31)

| # | ID | Type | Title | Description |
|---|-----|------|-------|-------------|
| 29 | `denoise-title` | Title | Denoising Wavelet | Section opener |
| 30 | `denoise-theory` | Theory | Thresholding | Soft thresholding formula, hard vs soft |
| 31 | `denoise-demo` | Embed | Demo: Denoising | **DenoiseView.jsx** |

**DenoiseView Features:**
- Add synthetic noise (Gaussian, sigma controllable)
- Wavelet selection
- Decomposition levels (1-6)
- Threshold mode: Hard vs Soft
- Noise sigma slider
- Before/After comparison with PSNR metric

### Section 11: COMPARISON (Slides 32-34)

| # | ID | Type | Title | Description |
|---|-----|------|-------|-------------|
| 32 | `compare-title` | Title | DCT vs Wavelet | Section opener |
| 33 | `compare-theory` | Comparison | Comparație Directă | Side-by-side DCT vs Wavelet bullet points |
| 34 | `compare-demo` | Embed | Demo: Comparație | **CompareView.jsx** |

**CompareView Features:**
- Quality slider (1-100)
- Wavelet selection for JPEG2000 simulation
- Side-by-side: DCT (JPEG) vs Wavelet (JPEG2000)
- PSNR and compression ratio metrics
- Visual artifact comparison

### Section 12: FINAL (Slide 35)

| # | ID | Type | Title | Description |
|---|-----|------|-------|-------------|
| 35 | `final` | Final | Felicitări! | Completion message with "Explorează Liber" button |

---

## Navigation

### Progress Sidebar (Left)
- Vertical list of section icons
- Active section highlighted with dots for sub-slides
- Clickable to jump to any section

### Navigation Footer
- **← Anterior**: Go to previous slide
- **Slide counter**: "X / 35"
- **Keyboard hint**: "← → sau Space pentru navigare"
- **Următor →**: Go to next slide

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `→` or `Space` | Next slide |
| `←` | Previous slide |
| `Esc` | Close tour, return to main app |

### URL Hash Navigation
Each slide has a unique ID reflected in the URL hash (e.g., `#fourier-demo`). Supports browser back/forward navigation.

---

## Styling Reference

### CSS Files
- `tour.css`: Main tour styles (slides, navigation, progress bar)
- `KernelsEducational.css`: Pixel-by-pixel demo styles

### Key CSS Classes
| Class | Purpose |
|-------|---------|
| `.tour-fullscreen` | Full-viewport container |
| `.tour-progress` | Left sidebar section buttons |
| `.tour-slide` | Main slide content area |
| `.slide-title`, `.slide-theory`, `.slide-embed` | Slide type layouts |
| `.kernels-educational` | Educational demo container |
| `.edu-side-panel` | Right sidebar (300px) in kernel demo |
| `.pixel-grid` | Input/output pixel display |
| `.calc-info` | Calculation display (stacked matrices + result) |

### Color Palette
| Section | Color |
|---------|-------|
| Intro | `#00d4ff` |
| Fourier | `#ffd93d` |
| Filters | `#ff6b6b` |
| Convolution | `#c9b1ff` |
| Kernels | `#ff9f43` |
| Wavelets | `#00d4ff` |
| Theory | `#ffd93d` |
| Basis | `#ff6b6b` |
| Decompose | `#c9b1ff` |
| Denoise | `#00d4ff` |
| Compare | `#ffd93d` |
| Final | `#2ecc71` |

---

## Backend API Reference

### Signal Processing
| Endpoint | Description |
|----------|-------------|
| `GET /fourier/function?expression=...` | Compute FFT of expression |
| `GET /filter?...` | Apply frequency filter |
| `GET /convolution?...` | 1D convolution |

### Wavelet Operations
| Endpoint | Description |
|----------|-------------|
| `GET /wavelet-families` | List available wavelet families |
| `GET /wavelet-basis?wavelet=db4` | Get basis functions |
| `GET /decompose-sample/{id}?wavelet=&levels=` | 2D Mallat decomposition |
| `GET /denoise-sample/{id}?...` | Wavelet denoising |
| `GET /compare-sample/{id}?quality=&wavelet=` | DCT vs Wavelet comparison |

### Kernel Operations
| Endpoint | Description |
|----------|-------------|
| `GET /sprites` | List available test sprites |
| `GET /sprite-pixels/{id}` | Get raw pixel data for sprite |
| `GET /kernel-apply?...` | Apply 2D kernel to image |

---

## Running the Presentation

### Start Backend
```powershell
cd prezentare_wavelet/backend
python -m uvicorn main:app --reload --port 8000
```

### Start Frontend
```powershell
cd prezentare_wavelet/frontend
npm run dev
```

### Access
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

---

## Development Notes

### Adding a New Slide
1. Add slide object to `SLIDES` array in `GuidedTour.jsx`
2. If new type, add rendering logic in the JSX
3. If embedded view, create component and add to `EmbeddedView` switch

### Modifying Kernel Demo (Slide 16)
- Component: `KernelsEducationalView.jsx`
- Styles: `KernelsEducational.css`
- Key state: `kernelSize`, `selectedKernel`, `animationPos`, `outputPixels`
- Sidebar width: `.edu-side-panel { width: 300px }`
- Kernel sizes: 3×3, 4×4, 5×5 (slider min=3, max=5)

### Known Configurations
- Max kernel size in educational view: **5×5** (no 6×6)
- Edge handling: **Edge replication** (not zero padding)
- Animation default speed: 200ms per pixel
