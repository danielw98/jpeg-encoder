# Wavelet Presentation Structure

> Content reference for the interactive wavelet presentation
> Last updated: December 4, 2025

**Implementation:** FastAPI backend + Vite/React frontend. See code for details.

---

## Presentation Overview

**36 slides** across **12 sections**, teaching wavelet transforms from Fourier fundamentals to JPEG2000 applications.

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
    - Tăietură bruscă, teoretic perfect dar imposibil fizic
  - **Butterworth:** $|H(f)|^2 = \frac{1}{1 + (f/f_c)^{2n}}$
    - Răspuns maxim plat, ordinul n controlează tranziția
  - **Gaussian:** $H(f) = e^{-f^2/2\sigma^2}$
    - Tranziție netedă, fără oscilații

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
- **Key Points:**
  - Filtru low-pass → Coeficienți de aproximație
  - Filtru high-pass → Coeficienți de detaliu (muchii, texturi)
  - Aplicare recursivă → Multi-resolution analysis
  - Reconstrucție perfectă via QMF filter bank

---

## Section 4: CONVOLUTION (3 slides)

### Slide 10: Theory
- **Title:** Convoluția
- **Content:** "Kernel-ul alunecă peste semnal, calculând suma ponderată."
- **Formula:** $(f * g)[n] = \sum_{k} f[k] \cdot g[n-k]$
- **Key Points:**
  - Baza filtrelor și transformărilor
  - Folosită în rețele neuronale (CNN)
  - Complexitate O(n²) → O(n log n) cu FFT

### Slide 11: Interactive Demo — 1D Convolution
- **Features:**
  - Signal types: chirp, step, triangle
  - Kernel types: moving average, gaussian, derivative, laplacian
  - Kernel size: 3-15
  - Step-by-step animation (kernel sliding)
  - Output signal visualization

### Slide 12: 2D Convolution Theory
- **Title:** Convoluția în Imagini (2D)
- **Formula:** $(I * K)[x,y] = \sum_{i,j} I[x+i, y+j] \cdot K[i,j]$
- **DWT 2D Coefficients:**
  - LL = (Lₓ * Lᵧ)[I] — Aproximare
  - LH = (Lₓ * Hᵧ)[I] — Detalii orizontale
  - HL = (Hₓ * Lᵧ)[I] — Detalii verticale
  - HH = (Hₓ * Hᵧ)[I] — Detalii diagonale
- **Decimation:** ↓2 păstrează pixelii cu indici pari → N/2 × N/2

---

## Section 5: KERNELS (5 slides)

### Slide 13: Section Title
- **Title:** Kernel-uri 2D
- **Subtitle:** Blur, Sharpen, Edge Detection

### Slide 14: Theory
- **Title:** Matrici de Convoluție
- **Formula:** $(I * K)[i,j] = \sum_{m,n} I[i+m, j+n] \cdot K[m,n]$
- **Key Points:**
  - Blur: medierea vecinilor (netezire)
  - Sharpen: amplifică diferențele
  - Edge: detectează contururile

### Slide 15: Kernel Explanations
- **Interactive view showing kernel types and their effects**

### Slide 16: Educational Demo — Pixel-by-Pixel
- **Title:** Demo Educațional: Kernel pas cu pas
- **Features:**
  - **Sprite selection:** Small test images (Mario, Link, mushroom, etc.)
  - **Kernel types:** Box Blur, Gaussian, Sobel X/Y, Sharpen, Laplacian, Identity
  - **Kernel size:** 3×3, 4×4, 5×5
  - **Animation speed:** 50-500ms per pixel
  - **Controls:** Play / Pause / Reset
  - **Visualization:**
    - Input grid with highlight on current pixel region
    - Output grid progressively filled
    - Side panel: region matrix, kernel weights (green=positive, red=negative), result
  - **Edge handling:** Edge replication (not zero padding)

### Slide 17: Demo — Kernels on Real Images
- **Features:**
  - Full image processing
  - Multiple kernel presets
  - Before/after comparison
  - Kernel matrix visualization

---

## Section 6: WAVELETS (5 slides)

### Slide 18: Section Title
- **Title:** Transformata Wavelet
- **Subtitle:** Localizare timp-frecvență

### Slide 19: Theory — Why Wavelets?
- **Title:** De ce Wavelets?
- **Content:** "Wavelets oferă ceea ce Fourier nu poate: localizare simultană."
- **Formula:** $\psi_{a,b}(t) = \frac{1}{\sqrt{|a|}} \psi\left(\frac{t-b}{a}\right)$
- **Key Points:**
  - Știm CE frecvențe și CÂND apar
  - Ideale pentru semnale nestaționare
  - Analiza multi-rezoluție

### Slide 20: Wavelet Families Complete (MERGED)
- **Title:** Familii Wavelet Complete
- **Subtitle:** CWT + DWT + Teorie
- **Three tabs:**
  - **🔬 DWT (Discrete):** Haar, Daubechies, Symlets, Biorthogonal, Coiflets
    - Filter coefficients displayed
    - Vanishing moments, filter length
    - Use cases (Mallat, JPEG2000)
  - **🌊 CWT (Continuous):** Morlet, Mexican Hat, Gaussian, Shannon
    - Mathematical formulas
    - Key properties
  - **📐 Teorie:** Admissibility condition, scaling equation, wavelet equation, QMF filters
- **Each wavelet shows:**
  - Mathematical definition
  - Key points as tags
  - "Best for" use case

### Slide 21: Demo — Wavelet Playground
- **Features:**
  - Wavelet types: Sinusoidă, Haar, Mexican Hat, Morlet
  - **Scale (a):** Controls frequency/width
  - **Shift (b):** Controls position
  - Mathematical equation display
  - Real-time visualization

### Slide 22: Demo — Signal Scanning
- **Visualization of wavelet scanning across signal**

---

## Section 7: MALLAT DECOMPOSITION (5 slides)

### Slide 23: Section Title
- **Title:** Algoritmul Mallat
- **Subtitle:** Descompunere multi-rezoluție rapidă

### Slide 24: Theory — Coefficients & Basis Functions
- **Title:** Coeficienții și Funcțiile de Bază
- **Content:** "Semnalul se proiectează pe funcțiile de scalare φ și wavelet ψ."
- **Formulas:**
  - $c_{j_0,k} = \int x(t) \, \phi_{j_0,k}(t) \, dt$ (coef. aproximare)
  - $d_{j,k} = \int x(t) \, \psi_{j,k}(t) \, dt$ (coef. detaliu)
  - $\phi_{j,k}(t) = 2^{j/2} \, \phi(2^j t - k)$ (funcția de scalare)
  - $\psi_{j,k}(t) = 2^{j/2} \, \psi(2^j t - k)$ (wavelet)
- **Key Points:**
  - φ captează frecvențe joase (structura globală)
  - ψ captează frecvențe înalte (detaliile)
  - Factor 2^(j/2) asigură normalizarea energiei

### Slide 25: Theory — The 4 Subbands
- **Title:** Cele 4 Sub-benzi
- **Visual:** $\begin{bmatrix} LL & HL \\ LH & HH \end{bmatrix}$
- **Key Points:**
  - LL: aproximare (structură globală)
  - LH/HL: muchii orizontale/verticale
  - HH: detalii diagonale, textură

### Slide 26: Demo — Mallat 1D (line)
- **Step-by-step 1D decomposition visualization**

### Slide 27: Demo — Mallat 2D Decomposition
- **Features:**
  - Image selector
  - Wavelet family: Haar, db4, db8, bior2.2, bior4.4, sym4, coif2
  - Decomposition levels: 1-6
  - Visual output: 4-quadrant decomposition
  - Subband highlighting

---

## Section 8: APPLICATIONS (4 slides)

### Slide 28: Section Title
- **Title:** Aplicații Wavelets
- **Subtitle:** Semnale biomedicale și nu numai

### Slide 29: ECG Applications
- **Title:** ECG - Electrocardiograme
- **Content:** "Wavelets sunt ideale pentru analiza ritmului cardiac."
- **Key Points:**
  - Detectare: complexul QRS, aritmii, fibrilații
  - Eliminare: zgomot muscular, interferență electrică
  - Wavelet Morlet/Daubechies pentru QRS

### Slide 30: EEG Applications
- **Title:** EEG - Activitate Cerebrală
- **Content:** "Separarea benzilor de frecvență ale creierului."
- **Formula:** δ < θ < α < β < γ (Benzile EEG 0.5-100 Hz)
- **Key Points:**
  - Delta (0.5-4Hz): somn profund
  - Alpha (8-13Hz): relaxare, ochii închiși
  - Beta (13-30Hz): concentrare activă
  - Aplicații: epilepsie, BCI, monitoring somn

### Slide 31: Other Applications
- **Title:** Alte Aplicații
- **Content:** "Wavelets sunt omniprezente în procesarea semnalelor."
- **Applications:**
  - 🎵 Audio: compresie, noise reduction, fingerprinting
  - 📸 Imagini: JPEG2000, restaurare, super-rezoluție
  - 📊 Finanțe: analiza volatilității, detectare trenduri
  - 🌊 Seismologie: detectare cutremure, analiza undelor
  - 🔬 Astronomie: analiza semnalelor cosmice

---

## Section 9: DENOISING (3 slides)

### Slide 32: Section Title
- **Title:** Denoising Wavelet
- **Subtitle:** Eliminarea zgomotului inteligent

### Slide 33: Theory — Thresholding
- **Content:** Hard vs Soft thresholding
- **Features explained:**
  - Hard: set to zero if below threshold
  - Soft: shrink towards zero

### Slide 34: Demo — Denoising
- **Features:**
  - Add synthetic noise (Gaussian, sigma controllable)
  - Wavelet selection
  - Decomposition levels: 1-6
  - Threshold mode: Hard / Soft
  - Noise sigma slider
  - Before/After comparison with PSNR metric

---

## Section 10: COMPARISON (3 slides)

### Slide 35: Section Title
- **Title:** DCT vs Wavelet
- **Subtitle:** JPEG vs JPEG2000

### Slide 36: Theory — Direct Comparison
- **Title:** Comparație Directă
- **DCT (JPEG):**
  - Blocuri 8×8 fixe
  - Artefacte de bloc vizibile
  - Decodare tot sau nimic
  - Mai rapid, mai simplu
- **Wavelet (JPEG2000):**
  - Transformare globală
  - Degradare graduală, uniformă
  - Scalabilitate: rezoluții multiple
  - Calitate superioară la compresie mare

### Slide 37: Demo — Comparison
- **Features:**
  - Quality slider: 1-100
  - Wavelet selection for JPEG2000 simulation
  - Side-by-side: DCT (JPEG) vs Wavelet (JPEG2000)
  - PSNR and compression ratio metrics
  - Visual artifact comparison

---

## Section 11: FINAL (1 slide)

### Slide 38: Thank You
- **Title:** Mulțumesc!
- **Subtitle:** Întrebări?
- **Button:** ← Înapoi la pagina principală

---

## Navigation Features

### Progress Sidebar (Left)
- Vertical icons for each section
- Active section highlighted with sub-slide dots
- Clickable to jump to any section

### Navigation Footer
- ← Anterior / Următor →
- Slide counter: "X / 38"

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| → or Space | Next slide |
| ← | Previous slide |
| Esc | Close tour |

### URL Hash
Each slide has unique ID in URL hash (e.g., `#fourier-demo`). Browser back/forward supported.

---

## Section Colors

| Section | Color |
|---------|-------|
| Intro | `#00d4ff` |
| Fourier | `#ffd93d` |
| Filters | `#ff6b6b` |
| Convolution | `#c9b1ff` |
| Kernels | `#ff9f43` |
| Wavelets | `#00d4ff` |
| Mallat | `#ffd700` |
| Applications | `#ff6b9d` |
| Denoise | `#00d4ff` |
| Compare | `#ffd93d` |
| Final | `#00d4ff` |
