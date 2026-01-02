# 6. Concluzii și direcții viitoare

## 6.1 Sinteza conceptelor

Implementarea encoder-ului JPEG a ilustrat modul în care tehnicile de procesare digitală a semnalelor permit compresia eficientă a imaginilor:

**Transformata DCT** [7] separă informația esențială de cea redundantă, concentrând energia în coeficienții de frecvență joasă. Această proprietate de compactare energetică este fundamentul compresiei lossy.

**Cuantizarea adaptivă** [1, Anexa K] exploatează modelul HVS (Human Visual System) al percepției umane. Sistemul vizual este mai sensibil la frecvențele joase și la luminanță, permițând cuantizare agresivă pe frecvențele înalte și pe crominanță.

**Codarea Huffman** [1, 11] optimizează reprezentarea statistică a simbolurilor. Alocarea codurilor scurte simbolurilor frecvente reduce semnificativ numărul de biți necesari.

**Subsampling-ul cromatic** exploatează sensibilitatea redusă a ochiului la detaliile de culoare, reducând volumul de date cu până la 50% fără degradare perceptibilă semnificativă.

## 6.2 Direcții viitoare

### JPEG2000 și transformata wavelet

Standardul JPEG2000 (ISO 15444) folosește **transformata wavelet discretă** (DWT) în locul DCT:

| Aspect | JPEG (DCT) | JPEG2000 (Wavelet) |
|--------|-----------|-------------------|
| Unitate procesare | Blocuri 8×8 fixe | Imaginea completă |
| Artefacte tipice | Blocking | Blur ușor |
| Scalabilitate | Limitată | Excelentă (progressive) |
| Complexitate | Scăzută | Ridicată |
| Adopție | Universală | Nișă (medical, arhive) |

JPEG2000 oferă compresie superioară și scalabilitate nativă, dar complexitatea computațională și lipsa suportului în browsere au limitat adopția.

### Extensii posibile ale proiectului

- **Decoder JPEG** - Implementarea pipeline-ului invers (IDCT, dequantizare)
- **Progressive JPEG** - Încărcare în straturi succesive de detaliu [1]
- **JPEG lossless** - Modul predicțional fără pierderi pentru aplicații medicale
- **Accelerare GPU** - Paralelizarea DCT pe CUDA/OpenCL
- **Codare neuronală** - Rețele autoencoder end-to-end [13]

### Tendințe în compresia imaginilor

Formatele moderne (HEIF, AVIF, WebP) folosesc tehnici din codarea video:

- **Predicție intra-frame** avansată
- **Transformări variabile** (4×4, 8×8, 16×16, 32×32)
- **Codare aritmetică** (eficiență superioară Huffman)
- **Filtrare in-loop** pentru reducerea artefactelor

## 6.3 Concluzie finală

JPEG rămâne, la peste 30 de ani de la standardizare [1], cel mai utilizat format de imagine din lume. Succesul său demonstrează eleganța cu care concepte matematice fundamentale (seria Fourier, DCT) pot fi aplicate pentru a rezolva probleme practice de compresie.

Procesarea digitală a semnalelor nu este doar o disciplină academică, ci fundamentul tehnologiilor care definesc era digitală: streaming video 4K, recunoaștere vocală, imagistică medicală, comunicații wireless 5G, și multe altele.

Înțelegerea acestor fundamente oferă o bază solidă pentru explorarea domeniilor emergente: compresie video next-gen (HEVC, AV1, VVC), codare neuronală, și noi paradigme de reprezentare și procesare a informației vizuale.

\newpage
