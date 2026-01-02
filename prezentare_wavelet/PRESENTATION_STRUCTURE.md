# Wavelet Presentation Structure

> Content reference for the interactive wavelet presentation
> Last updated: December 4, 2025

**Implementation:** FastAPI backend + Vite/React frontend. See code for details.

---

## Presentation Overview

**40 slides** across **11 sections**, teaching wavelet transforms from Fourier fundamentals to JPEG2000 applications.

---

## Section 1: INTRO (2 slides)

### Slide 1: Title
- **Title:** Wavelets în Procesarea Imaginilor
- **Subtitle:** O călătorie de la Fourier la JPEG2000
- **Type:** Opening splash

### Slide 2: Table of Contents
- **Title:** Cuprins
- **Subtitle:** Ce vom învăța astăzi
- **Chapters (clickable navigation):**
  - 📊 Transformata Fourier — Analiza spectrală a semnalelor
  - 🔧 Filtre Digitale — Separarea frecvențelor
  - 🔄 Convoluția — Operația fundamentală
  - 🔲 Kernel-uri 2D — Blur, Sharpen, Edge Detection
  - 🌊 Transformata Wavelet — Teorie, familii și demo-uri
  - ⭐ Algoritmul Mallat — 1D → 2D → Multi-nivel (pas cu pas)
  - 🏥 Aplicații Wavelets — ECG, EEG și altele
  - 🔇 Denoising — Eliminarea zgomotului
  - ⚖️ DCT vs Wavelet — JPEG vs JPEG2000

---

## Section 2: FOURIER (3 slides)

### Slide 3: Section Title
- **Title:** Transformata Fourier
- **Subtitle:** Analiza spectrală a semnalelor

### Slide 4: Theory
- **Title:** Descompunere în Frecvențe
- **Content:** "Fourier ne spune CE frecvențe există, dar nu CÂND apar."
- **Formula:** $F(\omega) = \int_{-\infty}^{\infty} f(t) \cdot e^{-i\omega t} \, dt$
- **Key Points:**
  - Orice semnal = sumă de sinusoide
  - Perfect pentru semnale staționare
  - Pierde informația temporală

### Slide 5: Interactive Demo — Fourier
- **Features:**
  - Signal presets: sine, chirp, gaussian pulse, square wave
  - Custom expression input
  - Time domain + Frequency spectrum visualization
  - Real-time FFT computation

---

## Section 3: FILTERS (4 slides)

### Slide 6: Section Title
- **Title:** Filtre Digitale
- **Subtitle:** Separarea frecvențelor

### Slide 7: Theory — Filter Types
- **Title:** Filtre în Domeniul Frecvență
- **Content:** Three filter types with formulas:
  - **Ideal:** $H_{LP}(f) = \begin{cases} 1 & |f| \leq f_c \\ 0 & |f| > f_c \end{cases}$
  - **Butterworth:** $|H(f)|^2 = \frac{1}{1 + (f/f_c)^{2n}}$
  - **Gaussian:** $H(f) = e^{-f^2/2\sigma^2}$

### Slide 8: Interactive Demo — Filters
- **Features:**
  - Signal presets (5Hz+50Hz, chirp, etc.)
  - Filter type: lowpass / highpass
  - Filter shape: ideal / butterworth / gaussian
  - Cutoff frequency slider
  - Original + filtered signal comparison

### Slide 9: Connection to Wavelets
- **Title:** Conexiunea cu Wavelets
- **Content:** Filter banks sunt fundamentul transformatei wavelet discrete
- **Formula:** Low-pass (h) → Aproximare (LL), High-pass (g) → Detalii (LH, HL, HH)

---

## Section 4: CONVOLUTION (3 slides)

### Slide 10: Theory
- **Title:** Convoluția
- **Content:** "Kernel-ul alunecă peste semnal, calculând suma ponderată."
- **Formula:** $(f * g)[n] = \sum_{k} f[k] \cdot g[n-k]$

### Slide 11: Interactive Demo — 1D Convolution
- **Features:**
  - Signal types: chirp, step, triangle
  - Kernel types: moving average, gaussian, derivative, laplacian
  - Step-by-step animation (kernel sliding)
  - Dot product visualization

### Slide 12: 2D Convolution Theory
- **Title:** Convoluția în Imagini (2D)
- **Formula:** $(I * K)[x,y] = \sum_{i,j} I[x+i, y+j] \cdot K[i,j]$
- **DWT 2D Coefficients:** LL, LH, HL, HH

---

## Section 5: KERNELS (4 slides)

### Slide 13: Section Title
- **Title:** Kernel-uri 2D
- **Subtitle:** Blur, Sharpen, Edge Detection

### Slide 14: Theory
- **Title:** Matrici de Convoluție
- **Content:** Convoluția 2D aplică o matrice (kernel) peste fiecare pixel.

### Slide 15: Educational Demo — Pixel-by-Pixel
- **Title:** Demo Educațional: Kernel pas cu pas
- **Features:**
  - Sprite selection
  - Kernel types: Box Blur, Gaussian, Sobel, Sharpen
  - Animation speed control
  - Input/Output grid visualization

### Slide 16: Demo — Kernels on Real Images
- **Features:**
  - Full image processing
  - Multiple kernel presets
  - Before/after comparison

---

## Section 6: WAVELETS (5 slides)

### Slide 17: Section Title
- **Title:** Transformata Wavelet
- **Subtitle:** Localizare timp-frecvență

### Slide 18: Theory — Why Wavelets?
- **Title:** De ce Wavelets?
- **Content:** "Wavelets oferă ceea ce Fourier nu poate: localizare simultană."
- **Formula:** $\psi_{a,b}(t) = \frac{1}{\sqrt{|a|}} \psi\left(\frac{t-b}{a}\right)$

### Slide 19: Wavelet Families Complete
- **Title:** Familii Wavelet
- **Subtitle:** CWT + DWT + Teorie
- **Tabs:** DWT (Discrete), CWT (Continuous), Teorie

### Slide 20: Demo — Wavelet Playground
- **Features:**
  - Wavelet types: Sinusoidă, Haar, Mexican Hat, Morlet
  - Scale (a) and Shift (b) controls
  - Real-time visualization

### Slide 21: Demo — Signal Scanning
- **Title:** Demo: Scanarea Semnalului
- **Visualization:** Wavelet scanning across signal

---

## Section 7: MALLAT DECOMPOSITION (8 slides)

### Slide 22: Section Title
- **Title:** Algoritmul Mallat
- **Subtitle:** Descompunere multi-rezoluție rapidă

### Slide 23: Theory — Coefficients & Basis Functions
- **Title:** Coeficienții și Funcțiile de Bază
- **Content:** Proiecția pe funcții de scalare φ și wavelet ψ.

### Slide 24: Theory — The 4 Subbands
- **Title:** Cele 4 Sub-benzi
- **Visual:** Matrix of LL, HL, LH, HH

### Slide 25: Demo — Mallat 1D (line)
- **Title:** Demo: Mallat 1D (linie)
- **Features:** Step-by-step 1D decomposition visualization

### Slide 26: Demo — Mallat 2D Decomposition
- **Title:** Demo: Descompunere Mallat 2D
- **Features:**
  - Educational mode (8x8 patch)
  - Full image mode (Pyramid)
  - Step-by-step animation

### Slide 27: Filter Bank Diagram
- **Title:** Banca de Filtre Wavelet
- **Features:**
  - Animated signal flow
  - Analysis and Synthesis banks
  - Filter coefficients (Haar/DB4)

### Slide 28: Pyramid Decomposition
- **Title:** Descompunere Piramidală
- **Features:**
  - Recursive decomposition of LL band
  - Visualization of levels

### Slide 29: Reconstruction Demo
- **Title:** Reconstrucție Perfectă
- **Features:**
  - Decomposition -> Reconstruction pipeline
  - Error metrics (MSE, PSNR)
  - Lossless verification

---

## Section 8: APPLICATIONS (4 slides)

### Slide 30: Section Title
- **Title:** Aplicații Wavelets
- **Subtitle:** Semnale biomedicale și nu numai

### Slide 31: ECG Applications
- **Title:** ECG - Electrocardiograme
- **Content:** Detectare QRS, eliminare zgomot.

### Slide 32: EEG Applications
- **Title:** EEG - Activitate Cerebrală
- **Content:** Separarea benzilor de frecvență (Delta, Theta, Alpha, Beta).

### Slide 33: Other Applications
- **Title:** Alte Aplicații
- **Content:** Audio, Imagini, Finanțe, Seismologie.

---

## Section 9: DENOISING (3 slides)

### Slide 34: Section Title
- **Title:** Denoising Wavelet
- **Subtitle:** Eliminarea zgomotului inteligent

### Slide 35: Theory — Thresholding
- **Title:** Teorie: Thresholding
- **Content:** Hard vs Soft thresholding visualization.

### Slide 36: Demo — Denoising
- **Title:** Demo: Denoising Practic
- **Features:** Real-time denoising with adjustable threshold.

---

## Section 10: COMPARISON (4 slides)

### Slide 37: Section Title
- **Title:** DCT vs Wavelet
- **Subtitle:** JPEG vs JPEG2000

### Slide 38: JPEG Pipeline
- **Title:** Pipeline-ul JPEG (DCT)
- **Features:**
  - Color Space (RGB -> YCbCr)
  - Subsampling
  - 8x8 Block Division
  - DCT Basis Functions
  - Quantization
  - Zigzag Scan

### Slide 39: DCT vs Wavelet Comparison
- **Title:** DCT vs Wavelet: Comparație
- **Features:**
  - Side-by-side artifact comparison
  - Progressive loading demo (JPEG2000 feature)

### Slide 40: Comparison Theory
- **Title:** Comparație Directă
- **Content:** Pros/Cons list for DCT vs Wavelet.
