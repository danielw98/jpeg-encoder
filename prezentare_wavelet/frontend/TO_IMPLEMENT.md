# TO_IMPLEMENT.md — Comprehensive Improvement Plan

> Goal: Achieve ⭐⭐⭐⭐⭐ across all sections
> Last updated: December 4, 2025

---

## Current Status Overview

| Section | Current | Target | Priority |
|---------|---------|--------|----------|
| Intro | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Done |
| Fourier | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Done |
| Filters | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Done |
| Convolution | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Done |
| Kernels | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Done |
| Wavelets | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Done |
| Mallat | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Done |
| Applications | ⭐⭐⭐ | ⭐⭐⭐⭐ | Low |
| Denoising | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Medium |
| DCT vs Wavelet | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Done |

---

## 🚨 REDUNDANT SLIDES (Mark for Removal/Merge)

| Slide | Issue | Action |
|-------|-------|--------|

---

## 🔴 CRITICAL: Mallat Algorithm Section (Currently ⭐⭐⭐⭐⭐)

### Problem
~~The presentation builds up to Mallat but the payoff is weak. Missing step-by-step visualization.~~
**SIGNIFICANTLY IMPROVED** - New components created with step-by-step visualizations.

### Required New Slides/Components

#### Slide 27: Filter Bank Diagram (NEW)
- [x] Static but clear diagram showing:
  ```
  Signal x[n]
      │
      ├──► [Low-pass h] ──► ↓2 ──► Approximation (cA)
      │
      └──► [High-pass g] ──► ↓2 ──► Detail (cD)
  ```
- [x] Annotate: h = scaling filter, g = wavelet filter
- [x] Show concrete filter coefficients for Haar: h = [1/√2, 1/√2], g = [1/√2, -1/√2]

**✅ IMPLEMENTED** - See `FilterBankView.jsx`

#### Slide 25: 1D Mallat Step-by-Step (NEW - ANIMATED)
- [x] Start with concrete 8-sample signal: [56, 40, 8, 24, 48, 48, 40, 16]
- [x] Animate step 1: Convolution with h filter
- [x] Animate step 2: Downsample (keep even indices)
- [x] Show: 8 samples → 4 approximation + 4 detail
- [x] Animate level 2: Apply to approximation → 2 + 2 + 4
- [x] Final pyramid visualization

**✅ IMPLEMENTED** - See `Mallat1DEduView.jsx`

#### Slide 26: 2D Mallat on Real Image (NEW - ANIMATED)
- [x] Use small image (64×64 or 128×128)
- [x] Show rows-then-columns filtering
- [x] Animate the four quadrants appearing:
  ```
  ┌────┬────┐
  │ LL │ HL │
  ├────┼────┤
  │ LH │ HH │
  └────┴────┘
  ```
- [x] Allow clicking each quadrant to see detail
- [x] Multi-level: Show LL being decomposed recursively

**✅ IMPLEMENTED** - See `MallatUnifiedView.jsx`

#### Slide 29: Reconstruction Demo (NEW)
- [x] Add level selector with visual pyramid
- [x] Show coefficient energy at each level
- [x] Add reconstruction button (inverse transform)
- [x] Perfect reconstruction demonstration

**✅ IMPLEMENTED** - See `ReconstructionView.jsx`

### Backend API Needed
```python
# New endpoints
GET /mallat-1d-steps?signal=[...]&wavelet=haar
  → Returns: {steps: [{level, approx, detail, filter_viz}...]}

GET /mallat-2d-steps?image_id=...&wavelet=haar&level=1
  → Returns: {row_filtered, col_filtered, LL, LH, HL, HH}
```

---

## 🔴 CRITICAL: DCT vs Wavelet / JPEG Section (Currently ⭐⭐⭐⭐⭐)

### Problem
~~Comparison is superficial. Need to show JPEG pipeline step-by-step like the Medium article.~~
**SIGNIFICANTLY IMPROVED** - Full JPEG pipeline visualization implemented with interactive tabs.

### Required New Slides (JPEG/DCT Deep Dive)

#### Slide 38: JPEG Pipeline (Color Space)
- [x] RGB to YCbCr visualization
- [x] Show image split into Y, Cb, Cr channels
- [x] Interactive: Toggle between RGB and YCbCr view
- [x] Explain: "Human eyes more sensitive to luminance (Y) than chrominance (Cb, Cr)"

**✅ IMPLEMENTED** - See `JPEGPipelineView.jsx` - ColorSpaceView stage

#### Slide 38: JPEG Pipeline (Chroma Subsampling)
- [x] Visualize 4:4:4 vs 4:2:2 vs 4:2:0
- [x] Show grid with colored squares representing chroma samples
- [x] Before/after comparison showing minimal visual difference
- [x] Data reduction percentage display

**✅ IMPLEMENTED** - See `JPEGPipelineView.jsx` - ChromaSubsamplingView stage

#### Slide 38: JPEG Pipeline (8×8 Block Division)
- [x] Show image divided into 8×8 blocks grid
- [x] Highlight one block
- [x] Zoom into block showing pixel values (0-255)
- [x] Normalize: subtract 128 → values from -128 to 127

**✅ IMPLEMENTED** - See `JPEGPipelineView.jsx` - BlockDCTView stage

#### Slide 38: JPEG Pipeline (DCT Basis Functions)
- [x] **Generate programmatically:** 8×8 grid of 64 DCT basis patterns
- [x] Top-left = DC (constant), others = increasing frequency
- [x] Frequency increases left→right and top→bottom
- [x] Interactive: Hover to see frequency (u,v) coordinates
- [x] Formula: $DCT(u,v) = \frac{1}{4} C(u) C(v) \sum_{x=0}^{7} \sum_{y=0}^{7} f(x,y) \cos\left[\frac{(2x+1)u\pi}{16}\right] \cos\left[\frac{(2y+1)v\pi}{16}\right]$

**✅ IMPLEMENTED** - See `JPEGPipelineView.jsx` - DCTBasisView stage

#### Slide 38: JPEG Pipeline (DCT Transform)
- [x] Left: Original 8×8 pixel block (grayscale values)
- [x] Right: DCT coefficients (magnitude visualization)
- [x] Show DC coefficient (top-left) is largest
- [x] High frequencies (bottom-right) typically near zero
- [x] Interactive: Select different blocks from image

**✅ IMPLEMENTED** - See `JPEGPipelineView.jsx` - BlockDCTView stage

#### Slide 38: JPEG Pipeline (Quantization)
- [x] Show standard JPEG quantization matrix Q
- [x] Visualize: DCT coefficients / Q = quantized
- [x] Higher divisors at bottom-right (discard high freq)
- [x] Quality slider: Lower quality = larger Q values
- [x] Show many zeros appearing after quantization

**✅ IMPLEMENTED** - See `JPEGPipelineView.jsx` - QuantizationView stage

#### Slide 38: JPEG Pipeline (Zigzag Scan + RLE)
- [x] Animate zigzag path through 8×8 block
- [x] Show resulting 1D sequence
- [x] Highlight runs of zeros
- [x] Show RLE encoding: (value, run_length) pairs
- [x] Entropy: zeros grouped together = better compression

**✅ IMPLEMENTED** - See `JPEGPipelineView.jsx` - ZigzagView stage

#### Slide 39: JPEG Artifacts Demo
- [x] Side-by-side: Original vs JPEG at different quality levels
- [x] Quality slider: 10%, 30%, 50%, 70%, 90%
- [x] Highlight blocking artifacts at low quality
- [ ] PSNR/SSIM metrics displayed (partial)

**✅ IMPLEMENTED** - See `DCTvsWaveletView.jsx`

### Then: Wavelet (JPEG2000) Comparison

#### Slide 39: Wavelet vs DCT Block Structure
- [x] DCT: Fixed 8×8 blocks (show grid lines)
- [x] Wavelet: Global transform (no block boundaries)
- [x] Same image, same compression ratio
- [x] Visual: DCT shows block edges, Wavelet smooth degradation

**✅ IMPLEMENTED** - See `DCTvsWaveletView.jsx`

#### Slide 39: Multi-Resolution Advantage
- [x] JPEG2000 progressive loading demo
- [x] Simulate: Load 10%, 30%, 50%, 100% of data
- [x] Show image quality at each stage
- [x] DCT: All or nothing per block
- [x] Wavelet: Gradually improving everywhere

**✅ IMPLEMENTED** - See `DCTvsWaveletView.jsx` - Progressive mode

### Backend API Needed
```python
# JPEG pipeline endpoints - NOT NEEDED (client-side implementation)
# All DCT/Quantization/Zigzag implemented in JavaScript
```

---

## 🟡 MEDIUM: Fourier Section Improvements

### Slide 4: Theory (Add More Math)
- [x] Add inverse Fourier transform formula
- [x] Euler's formula connection: $e^{i\theta} = \cos\theta + i\sin\theta$
- [x] Parseval's theorem (energy preservation)
- [] Visual: Show sine waves summing to create complex signal

### Slide 5: Demo Improvements
- [ ] Add title/header like other slides
- [ ] Preset function buttons larger or collapsible
- [ ] Add phase spectrum visualization (not just magnitude)
- [ ] Animate frequency components building up the signal

---

## 🟡 MEDIUM: Filters Section Improvements

### Slide 7: Filter Types
- [x] Interactive Butterworth order selector (n=1,2,4,8)
- [x] Show how higher order → sharper cutoff
- [x] Animate frequency response curves (real-time updates when changing order)

### Slide 8: Demo
- [x] Reset to defaults button
- [x] Clearer frequency axis labeling (0, 25, 50, 75, 100 Hz tick labels)
- [x] Band-pass filter option (low + high cutoff)

---

## 🟡 MEDIUM: Convolution Section Improvements

### Slide 11: 1D Convolution Demo
- [x] Add sliding window animation (like 2D kernel demo)
- [x] Show multiplication happening at each position
- [x] Visual: Input × Kernel = Output step by step
- [x] Frame-by-frame controls (step forward/backward, play/pause)
- [x] Dot product visualization overlay showing x, h, x·h, and Σ at each step
- [x] Position slider for manual navigation

**✅ IMPLEMENTED** - Enhanced `ConvolutionView.jsx` with interactive frame-by-frame animation and dot product display

### Slide 12: 2D Convolution Theory
- [ ] Remove redundant matrices (moved to Kernels section)
- [ ] Focus on wavelet connection more explicitly
- [ ] Add: "This is exactly what Mallat does with h and g filters"

---

## 🟡 MEDIUM: Wavelets Section Improvements

### Slide 18: Why Wavelets
- [x] Add Heisenberg boxes visualization
- [x] Show time-frequency tradeoff diagram
- [x] Compare: Fourier = full time, one frequency vs Wavelet = localized both

### Slide 19: Merge Wavelet Families
- [x] Single comprehensive slide with:
  - Tabbed interface (DWT / CWT / Theory)
  - Mathematical definition
  - Filter coefficients for DWT wavelets
  - Key properties and use cases
  - Theory tab with admissibility, scaling equation, QMF

**✅ IMPLEMENTED** - See `WaveletEducationView.jsx`

### Slide 20: Wavelet Playground
- [x] Add frequency domain view toggle
- [x] Show wavelet in both time and frequency

### NEW: Scalogram Slide
- [x] Implement scalogram visualization
- [x] X-axis: time, Y-axis: scale/frequency
- [x] Color: coefficient magnitude
- [x] Compare to Fourier spectrogram

### NEW: Complex Wavelets Slide
- [x] Morlet complex wavelet visualization
- [x] Real + Imaginary parts
- [x] 3D surface plot option
- [x] Phase information extraction

---

## 🟡 MEDIUM: Denoising Section Improvements

### Slide 35: Thresholding Theory
- [ ] Animated visualization of hard vs soft thresholding
- [ ] Show coefficient histogram before/after
- [ ] Universal threshold formula: $\lambda = \sigma\sqrt{2\log n}$

### Slide 36: Demo
- [ ] Fix SNR display issues
- [ ] Add coefficient visualization at each level
- [ ] Show which coefficients get zeroed out
- [ ] BayesShrink option

---

## 🟢 LOW: Applications Section

### Condense to 2 Slides Maximum
- [ ] Slide 31: Biomedical (ECG + EEG combined)
- [ ] Slide 33: Other applications (brief list with icons)
- [ ] Remove detailed points, keep high-level

---

## 🔧 INFRASTRUCTURE / CODE QUALITY

### CSS Refactoring
- [ ] Create `variables.css` with centralized colors
- [ ] Create `components.css` for shared component styles
- [ ] Remove redundant per-page CSS files
- [ ] Implement CSS modules or styled-components

### React Component Refactoring
- [x] Extract `<Graph>` component with Desmos-like interface ✅ `shared/Graph.jsx`
  - HiDPI support
  - Axis labels
  - Multiple series support
  - Consistent styling
  - Grid lines
  - Highlight regions
- [ ] Extract `<MathFormula>` component
- [x] Extract `<AnimationControls>` component ✅ `shared/AnimationControls.jsx`
- [x] Extract `<SlideHeader>` component ✅ `shared/SlideHeader.jsx`
- [x] Refactor FilterBankView to use SVG instead of canvas (crisp text) ✅
- [x] Update MallatUnifiedView to use AnimationControls ✅
- [x] Update Mallat1DEduView to use AnimationControls ✅
- [x] Fix label overflow in Mallat1DEduView (vertical formula layout) ✅
- [x] Fix text rendering in ReconstructionView (HTML overlays) ✅
- [x] Fix text rendering in MallatUnifiedView (HTML overlays) ✅

### Backend Refactoring
- [ ] Move all computation logic to backend
- [ ] Create `/api/compute/` namespace for heavy operations
- [ ] Cache common computations
- [ ] Standardize response format

### GuidedTour Refactoring
- [ ] Split into:
  - `TourContainer.jsx` (navigation, state)
  - `TourSlide.jsx` (individual slide renderer)
  - `TourProgress.jsx` (sidebar)
  - `TourNav.jsx` (footer navigation)
- [ ] Make reusable for other presentations

---

## 📋 IMPLEMENTATION ORDER

### Phase 1: Critical Fixes (Mallat + JPEG)
1. [x] Implement 1D Mallat step-by-step visualization ✅ `PyramidDecompView.jsx`
2. [x] Implement Filter Bank diagram ✅ `FilterBankView.jsx`
3. [x] Implement Reconstruction demo ✅ `ReconstructionView.jsx`
4. [x] Implement 2D Mallat animated decomposition ✅ `MallatUnifiedView.jsx`
5. [x] Create DCT basis patterns generator ✅ `JPEGPipelineView.jsx`
6. [x] Implement JPEG pipeline slides (Color → DCT → Quantize → Zigzag) ✅ `JPEGPipelineView.jsx`
7. [x] Create proper DCT vs Wavelet comparison ✅ `DCTvsWaveletView.jsx`

### Phase 2: Core Improvements
8. [x] Merge redundant wavelet family slides ✅ `WaveletEducationView.jsx`
9. [ ] Add Heisenberg boxes to wavelet theory
10. [ ] Implement scalogram visualization
11. [ ] Fix denoising SNR issues
12. [ ] Add thresholding animation
13. [x] Add sliding window animation to Convolution ✅ `ConvolutionView.jsx`

### Phase 3: Polish
14. [ ] Refactor Graph component
15. [ ] CSS cleanup and centralization
16. [ ] Condense applications section
17. [ ] Add reset buttons where needed
18. [ ] Responsive layout improvements

### Phase 4: Advanced Features
19. [ ] Complex wavelet visualization
20. [ ] 3D surface plots
21. [ ] Progressive JPEG2000 loading demo
22. [ ] Interactive filter bank explorer

---

## ✅ DEFINITION OF DONE

A slide is ⭐⭐⭐⭐⭐ when:
- [ ] Content is mathematically accurate
- [ ] Visualizations are clear and labeled
- [ ] Interactive elements respond smoothly
- [ ] Fits viewport without scrolling
- [ ] Has consistent styling with other slides
- [ ] Mobile-responsive (stretch goal)
- [ ] Animations enhance understanding, don't distract
