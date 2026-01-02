# JPEGDSP Web UI

Modern web interface for the JPEG encoder with DSP visualization.

## Architecture

```
ui/
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── server.ts          # Main server (port 3001)
│   │   ├── routes/
│   │   │   ├── health.ts      # GET /api/health
│   │   │   ├── encode.ts      # POST /api/encode
│   │   │   └── images.ts      # GET /api/images
│   │   └── services/
│   │       └── encoder.ts     # CLI wrapper
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/          # React + TypeScript + Vite
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── ImageUpload.tsx
    │   │   ├── EncodingOptions.tsx
    │   │   ├── SampleImages.tsx
    │   │   └── ResultsPanel.tsx
    │   └── hooks/
    │       └── useEncoder.ts
    ├── package.json
    └── vite.config.ts
```

## Quick Start

### Prerequisites

1. Build the C++ encoder:
```powershell
cd ..\..\build
cmake --build . --config Debug
```

2. Verify CLI is available:
```powershell
.\Debug\jpegdsp_cli_encode.exe --help
```

### Start Backend (Terminal 1)

```powershell
cd ui/backend
npm install
npm run dev
```

Backend runs at http://localhost:3001

### Start Frontend (Terminal 2)

```powershell
cd ui/frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check, CLI availability |
| `/api/encode` | POST | Upload and encode image |
| `/api/encode/sample` | POST | Encode a sample image |
| `/api/images` | GET | List available sample images |
| `/api/images/:name` | GET | Get image as base64 |

### POST /api/encode

Encode an uploaded image.

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `image`: File (PNG/PPM/PGM)
  - `quality`: Number (1-100, default: 75)
  - `format`: String ("color_420" | "grayscale")
  - `analyze`: Boolean (true for detailed analysis)

**Response:**
```json
{
  "success": true,
  "outputUrl": "/outputs/abc123.jpg",
  "originalWidth": 512,
  "originalHeight": 512,
  "compressedBytes": 7321,
  "compressionRatio": 107.42,
  "analysis": {
    "entropy": { ... },
    "blocks": { ... },
    "dctAnalysis": { ... },
    "quantization": { ... },
    "rleStatistics": { ... },
    "huffmanCoding": { ... }
  }
}
```

### POST /api/encode/sample

Encode a sample image from the test images directory.

**Request:**
```json
{
  "imageName": "baboon_512.png",
  "quality": 75,
  "format": "color_420",
  "analyze": true
}
```

## Development

### Backend

Uses `tsx` for TypeScript execution with hot reload:
```powershell
npm run dev     # Development with watch
npm run build   # Compile to JavaScript
npm start       # Run compiled code
```

### Frontend

Uses Vite for fast development:
```powershell
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview production build
```

The Vite dev server proxies `/api/*` to the backend at port 3001.

## Features

### Implemented
- [x] Image upload (drag & drop, file picker)
- [x] Quality slider (1-100)
- [x] Format selection (Color 4:2:0, Grayscale)
- [x] Compression statistics
- [x] Detailed analysis display
- [x] Sample image quick buttons
- [x] JPEG download

### Planned
- [ ] Original vs. compressed comparison view
- [ ] DCT coefficient visualization
- [ ] Quantization matrix editor
- [ ] Quality vs. size chart
- [ ] Pipeline step visualization
- [ ] Link to wavelet presentation

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Multer
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: CSS (no framework, custom design)
