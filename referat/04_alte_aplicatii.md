# 4. Alte aplicații DSP

Procesarea digitală a semnalelor se regăsește în aproape toate domeniile tehnologice moderne [4].

## 4.1 Compresie audio: MP3 și MDCT

Formatul **MP3** folosește **MDCT** (Modified Discrete Cosine Transform) [4, cap. 11], o variantă DCT optimizată pentru ferestre suprapuse. MP3 exploatează **mascarea auditivă**: sunete puternice maschează sunete slabe din frecvențe apropiate.

| Aspect | JPEG | MP3 |
|--------|------|-----|
| Transformare | DCT 2D (8×8) | MDCT 1D (576 samples) |
| Mascare | Vizuală | Auditivă |
| Compresie | 10:1 - 20:1 | 10:1 - 12:1 |

## 4.2 Imagistică medicală

DSP este esențial în reconstrucția imaginilor medicale [6, cap. 5]:

- **RMN:** Transformata Fourier 2D/3D inversă reconstruiește imaginea din spațiul K
- **CT:** Filtered Back-Projection (FBP) combină proiecții din multiple unghiuri
- **Ecografie:** Beamforming digital focalizează fasciculul ultrasonic

## 4.3 Filtre și detecția muchiilor

Filtrele digitale sunt blocuri fundamentale [5, cap. 5-7]: low-pass (blur, denoising), high-pass (edge detection), gradient (Sobel, Prewitt).

Algoritmul **Canny** [10] combină: filtrare Gaussian, calcul gradient, non-maximum suppression, hysteresis thresholding.

## 4.4 Comunicații digitale

DSP în comunicații [4]: OFDM (WiFi, 4G/5G) folosește FFT/IFFT, filtre adaptive pentru egalizare, codare vocală (AMR, Opus).

\newpage
