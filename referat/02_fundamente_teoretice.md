# 2. Fundamente teoretice DSP

## 2.1 Transformata Fourier

Transformata Fourier reprezintă unul dintre cele mai importante instrumente matematice în procesarea semnalelor [5, cap. 2]. Descompune un semnal în componentele sale frecvențiale.

**Transformata Fourier continuă:**

$$
X(f) = \int_{-\infty}^{\infty} x(t) \cdot e^{-j2\pi ft} \, dt
$$

**Transformata Fourier Discretă (DFT)** pentru semnale digitale [5, cap. 8]:

$$
X[k] = \sum_{n=0}^{N-1} x[n] \cdot e^{-j2\pi kn/N}
$$

Complexitatea DFT este O(N²). Algoritmul **FFT** (Cooley-Tukey, 1965) [9] reduce la O(N log N).

**Limitări pentru imagini:** coeficienți complecși, discontinuități la margini, nu exploatează simetria [12].

## 2.2 Transformata Discretă a Cosinusului (DCT)

**DCT-II** (varianta JPEG) [7] transformă N eșantioane în N coeficienți frecvențiali:

$$
X[k] = \alpha(k) \sum_{n=0}^{N-1} x[n] \cdot \cos\left[\frac{\pi(2n+1)k}{2N}\right]
$$

Pentru JPEG, DCT 2D pe blocuri 8×8 [1, Anexa A]:

$$
F(u,v) = \frac{1}{4} \alpha(u) \alpha(v) \sum_{x=0}^{7} \sum_{y=0}^{7} f(x,y) \cos\left[\frac{(2x+1)u\pi}{16}\right] \cos\left[\frac{(2y+1)v\pi}{16}\right]
$$

**Compactarea energiei:** DCT concentrează 60-80% din energie în coeficientul DC [12, p. 150].

**Avantaje față de DFT:** coeficienți reali, compactare energetică superioară, continuitate la margini.

## 2.3 Noțiuni DSP conexe

**Teorema Nyquist-Shannon** [4, p. 31]: frecvența de eșantionare trebuie să fie cel puțin dublul frecvenței maxime: $f_s \geq 2 \cdot f_{max}$

**Cuantizarea** [6, p. 475] mapează valori continue la niveluri discrete. Este sursa principală de pierdere în compresia lossy.

**Filtre digitale** [5, cap. 5-7]: low-pass (blur), high-pass (edge detection), band-pass (extragere caracteristici).

\newpage

\newpage
