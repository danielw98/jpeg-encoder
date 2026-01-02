# 1. Introducere

## Ce este procesarea digitală a semnalelor?

**Procesarea digitală a semnalelor** (Digital Signal Processing - DSP) reprezintă domeniul care se ocupă cu analiza, modificarea și sinteza semnalelor reprezentate în formă discretă [4]. Spre deosebire de procesarea analogică, DSP oferă precizie, repetabilitate și flexibilitate în implementare, permițând algoritmi complecși care ar fi imposibil de realizat în domeniul analog [5, p. 1-3].

Un semnal poate fi definit ca orice mărime fizică care variază în timp, spațiu sau altă variabilă independentă. În contextul DSP, semnalele sunt eșantionate și cuantizate pentru a fi reprezentate numeric, permițând procesarea lor pe sisteme de calcul.

## Relevanța DSP pentru compresia datelor

Compresia datelor este una dintre cele mai importante aplicații ale DSP [6, cap. 7]. Principiul fundamental care stă la baza compresiei este **redundanța** - informația care poate fi eliminată fără pierderi semnificative de calitate perceptuală.

DSP permite identificarea și exploatarea a două tipuri de redundanță:

- **Redundanța statistică** - pattern-uri repetitive în date care pot fi codate eficient
- **Redundanța perceptuală** - informație pe care sistemul vizual/auditiv uman nu o poate percepe

Transformările din domeniul frecvențelor (Fourier, DCT, wavelets) sunt instrumente fundamentale DSP care permit separarea informației esențiale de cea redundantă [4, cap. 13].

## De la Fourier la JPEG

Parcursul conceptual de la analiza Fourier la standardul JPEG ilustrează evoluția tehnicilor DSP:

| An | Dezvoltare | Semnificație |
|----|------------|--------------|
| 1822 | Transformata Fourier | Analiză teoretică a frecvențelor |
| 1965 | FFT (Cooley-Tukey) [9] | Calcul eficient pe calculatoare |
| 1974 | DCT (Ahmed et al.) [7] | Optimizat pentru semnale finite |
| 1992 | JPEG (ITU-T T.81) [1] | Standard industrial |

**Transformata Fourier** a demonstrat că orice semnal poate fi descompus în componente sinusoidale. **Transformata Discretă a Cosinusului (DCT)** a optimizat această idee pentru semnale finite, concentrând energia în mai puțini coeficienți [7]. **JPEG** a standardizat aplicarea DCT pentru compresia imaginilor, devenind cel mai utilizat format de imagine din lume [8].

Acest referat explorează fundamentele matematice ale acestor transformări, implementarea lor în algoritmul JPEG, și demonstrează conceptele printr-un encoder JPEG funcțional dezvoltat în C++.

\newpage
