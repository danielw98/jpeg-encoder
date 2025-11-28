# Wavelet Presentation - Interactive DSP Education

Interactive presentation teaching **wavelet transforms** for image processing, from Fourier fundamentals through JPEG2000 compression.

## Tech Stack

- **Frontend**: React 18 + Vite (port 3000)
- **Backend**: FastAPI + PyWavelets (port 8000)
- **Visualization**: Canvas-based plots, KaTeX for math

## Quick Start

### 1. Backend (Python FastAPI)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend (React + Vite)

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** → Click "🎯 Start Tour"

## Project Structure

```
prezentare_wavelet/
├── backend/
│   ├── main.py              # FastAPI endpoints (Fourier, filters, wavelets, kernels)
│   └── requirements.txt     # pywt, numpy, pillow, fastapi
│
├── frontend/
│   └── src/
│       ├── App.jsx          # Main app with sidebar navigation
│       ├── components/
│       │   ├── GuidedTour.jsx         # 🎯 Main presentation (35 slides)
│       │   ├── FourierView.jsx        # FFT demo
│       │   ├── FiltersView.jsx        # Digital filters (LP/HP)
│       │   ├── ConvolutionView.jsx    # 1D convolution animation
│       │   ├── KernelsView.jsx        # 2D kernel effects
│       │   ├── KernelsEducationalView.jsx  # Pixel-by-pixel convolution
│       │   ├── WaveletPlayground.jsx  # Scale/shift explorer
│       │   ├── WaveletEducationView.jsx    # Wavelet families
│       │   ├── WaveletBasisView.jsx   # Basis functions
│       │   ├── DecomposeView.jsx      # Mallat 2D (LL/LH/HL/HH)
│       │   ├── DenoiseView.jsx        # Wavelet thresholding
│       │   └── CompareView.jsx        # DCT vs Wavelet comparison
│       └── styles/
│           ├── tour.css               # Slide styling
│           └── KernelsEducational.css # Kernel demo styles
│
├── data/                    # Test images (peppers, lena, etc.)
│
└── PRESENTATION_STRUCTURE.md  # Full slide reference
```

## Presentation Sections (35 slides)

| Section | Slides | Content |
|---------|--------|---------|
| Intro | 1-2 | Title, Table of Contents |
| Fourier | 3-5 | FFT theory + interactive demo |
| Filters | 6-9 | Digital filters, wavelet connection |
| Convolution | 10-12 | 1D/2D convolution, DWT coefficients |
| Kernels | 13-17 | Blur, sharpen, edge detection, pixel-by-pixel demo |
| Wavelets | 18-20 | Scale/shift playground |
| Theory | 21-22 | Wavelet families education |
| Basis | 23-25 | Haar, Daubechies, Biorthogonal |
| Decompose | 26-28 | Mallat 2D decomposition |
| Denoise | 29-31 | Wavelet thresholding |
| Compare | 32-35 | DCT vs Wavelet, conclusion |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `→` / `Space` | Next slide |
| `←` | Previous slide |
| `Esc` | Exit tour |

## API Endpoints

```
GET /fourier/function?expression=sin(2*pi*5*t)
GET /filter?type=lowpass&cutoff=30&shape=butterworth
GET /decompose-sample/{image_id}?wavelet=db4&levels=3
GET /denoise-sample/{image_id}?mode=soft&levels=4
GET /compare-sample/{image_id}?quality=50
GET /sprites
GET /sprite-pixels/{sprite_id}
```

## Key Features

- **Interactive Fourier demo**: Custom expressions, FFT visualization
- **Filter playground**: Ideal/Butterworth/Gaussian LP/HP filters
- **Pixel-by-pixel convolution**: Step through kernel operations
- **Edge replication**: Proper boundary handling (not zero padding)
- **Wavelet families**: Haar, Morlet, Daubechies, Biorthogonal
- **DCT vs Wavelet**: Visual artifact comparison

## Development

See `PRESENTATION_STRUCTURE.md` for detailed slide reference and component documentation.
