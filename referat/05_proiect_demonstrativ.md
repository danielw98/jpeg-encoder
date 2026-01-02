# 5. Proiect demonstrativ: JPEG Encoder

Pentru a ilustra conceptele prezentate, am implementat un encoder JPEG complet în C++, cu o interfață web pentru vizualizare.

**Demo online:** https://sem1-cercetare.danielwagner.ro  
**Cod sursă:** https://github.com/danielw98/jpeg-encoder

## 5.1 Arhitectura implementării

Proiectul **jpegdsp** este organizat modular:

- **Core** - Image, Block8x8, ColorSpace, Entropy
- **Transforms** - DCT-II forward/inverse cu tabele cosinus precalculate
- **JPEG** - Quantization, ZigZag, RLE, Huffman, JPEGWriter
- **API** - Interfață simplificată JPEGEncoder

**Pipeline-ul de codare:** Încărcare → RGB→YCbCr → Subsampling 4:2:0 → Blocuri 8×8 → Level shift → DCT → Cuantizare → Zig-Zag → DPCM/RLE → Huffman → JFIF output.

## 5.2 Interfața web

**Stack:** C++17 encoder, Node.js/Express backend (port 3001), React/TypeScript frontend (port 3000).

**Funcționalități:** comparație original vs comprimat, vizualizare pipeline, heatmap DCT, grafic calitate vs compresie, 30+ metrici de analiză.

## 5.3 Rezultate experimentale

Rezultate pe imagini USC-SIPI [16]:

| Imagine | Original | Q=75 | Q=50 | Q=25 |
|---------|----------|------|------|------|
| Baboon 512×512 | 768 KB | 65 KB (11.8×) | 40 KB (19.2×) | 24 KB (32×) |
| Peppers 512×512 | 768 KB | 48 KB (16×) | 31 KB (24.8×) | 19 KB (40.4×) |
| Lena 512×512 | 768 KB | 52 KB (14.8×) | 34 KB (22.6×) | 21 KB (36.6×) |

**Distribuția energiei DCT:** DC conține 65-75% din energie, AC joasă 20-28%, AC medie 4-8%, AC înaltă 1-3% [7, 12].

## 5.4 Validare

Imaginile generate sunt compatibile cu vizualizatoare standard și libjpeg-turbo [15]. Proiectul include 42 teste automatizate cu 100% succes.

\newpage
