# 📜 Script Prezentare: Wavelets în Procesarea Imaginilor

> **Durată totală:** ~60 minute  
> **Număr slide-uri:** 40+ (modul ghidat)  
> **Public țintă:** Studenți/Cercetători familiari cu procesarea semnalelor  
> **URL prezentare:** `http://localhost:3000` → Click "📖 Start Guide"

---

## 🎯 Pregătire Înainte de Prezentare

### Verificări tehnice:
- [ ] Backend pornit: `cd backend && uvicorn main:app --reload`
- [ ] Frontend pornit: `cd frontend && npm run dev`
- [ ] Accesează `http://localhost:3000` și verifică că funcționează
- [ ] Browser în modul fullscreen (F11)
- [ ] Click pe "📖 Start Guide" pentru modul ghidat

### Echipament:
- [ ] Microfon funcțional (dacă e online)
- [ ] Al doilea monitor pentru notițe (opțional)
- [ ] Apă la îndemână

---

## ⏱️ Timing General

| Secțiune | Durată | Slide-uri | Timp cumulat |
|----------|--------|-----------|--------------|
| 1. Introducere | 3 min | 1-2 | 0:03 |
| 2. Fourier | 5 min | 3-5 | 0:08 |
| 3. Filtre Digitale | 6 min | 6-9 | 0:14 |
| 4. Convoluție | 5 min | 10-12 | 0:19 |
| 5. Kernels 2D | 7 min | 13-16 | 0:26 |
| 6. Wavelets | 10 min | 17-24 | 0:36 |
| 7. Algoritmul Mallat | 10 min | 25-32 | 0:46 |
| 8. Aplicații ⭐ | 6-8 min | 33-36 | 0:54 |
| 9. Denoising | 4 min | 37-39 | 0:58 |
| 10. DCT vs Wavelet | 5 min | 40-44 | 1:03 |
| 11. Concluzii + Q&A | 2+ min | 45 | 1:05+ |

> **Notă:** Secțiunea 8 (Aplicații) e flexibilă - poți extinde discuția despre BCI, MRI, sau alte domenii care te pasionează!

---

# 📋 SCRIPT DETALIAT PE SLIDE-URI

---

## 🎯 SECȚIUNEA 1: INTRODUCERE (3 minute)

### Slide 1: `intro-title` — Titlu
**⏱️ Durată: 1 minut**

**CE APARE:** Ecran de titlu cu "Wavelets în Procesarea Imaginilor"

**CE SPUI:**
> "Bună ziua și bine ați venit! Astăzi vom explora lumea fascinantă a transformatelor wavelet - de la fundamente teoretice până la aplicații practice în compresie și procesarea imaginilor.
>
> Vom începe de la transformata Fourier - pe care probabil o cunoașteți deja - și vom construi pas cu pas intuiția pentru wavelets, culminând cu comparația dintre JPEG și JPEG2000."

**ACȚIUNI:** Click pe săgeata → pentru a trece la următorul slide

---

### Slide 2: `intro-toc` — Cuprins
**⏱️ Durată: 2 minute**

**CE APARE:** Lista de capitole cu iconițe colorate

**CE SPUI:**
> "Iată ce vom parcurge astăzi:
>
> 1. **Transformata Fourier** - recapitulare rapidă despre cum descompunem semnale în frecvențe
> 2. **Filtre Digitale** - cum separăm frecvențele înalte de cele joase
> 3. **Convoluția** - operația fundamentală din spatele filtrelor
> 4. **Kernels 2D** - aplicarea convoluției pe imagini (blur, sharpen, edge detection)
> 5. **Transformata Wavelet** - vedeta prezentării de astăzi
> 6. **Algoritmul Mallat** - implementarea eficientă a wavelet-urilor
> 7. **Aplicații medicale** - ECG, EEG
> 8. **Denoising** - eliminarea zgomotului
> 9. **DCT vs Wavelet** - de ce JPEG2000 e mai bun decât JPEG la compresii mari"

**PONT:** Poți da click pe orice capitol pentru a sări direct acolo (dar nu o face acum!)

---

## 📊 SECȚIUNEA 2: FOURIER (5 minute)

### Slide 3: `fourier-title` — Titlu Secțiune
**⏱️ Durată: 30 secunde**

**CE SPUI:**
> "Să începem cu ceva familiar: Transformata Fourier."

---

### Slide 4: `fourier-theory` — Teorie Fourier
**⏱️ Durată: 2 minute**

**CE APARE:** Formula Fourier + principiu + cutii Heisenberg

**CE SPUI:**
> "Fourier ne spune că **orice semnal poate fi descompus într-o sumă de sinusoide** de diferite frecvențe.
>
> Formula integrală de aici arată cum calculăm coeficienții pentru fiecare frecvență ω.
>
> **Dar există o problemă fundamentală:** Fourier ne spune CE frecvențe există în semnal, dar **nu ne spune CÂND apar acele frecvențe**.
>
> Pentru un semnal staționar (care nu se schimbă în timp), asta e perfect. Dar pentru muzică, vorbire, sau semnale ECG - unde frecvențele se schimbă constant - Fourier pierde informație critică.
>
> Vizualizați în minte: dacă ați asculta o melodie, Fourier vă spune că melodia conține note de DO, RE, MI... dar nu vă spune ORDINEA lor!"

**INDICAȚIE VIZUALĂ:** Arată spre cutiile Heisenberg dacă apar - explică compromisul timp-frecvență

---

### Slide 5: `fourier-demo` — Demo Interactiv
**⏱️ Durată: 2.5 minute**

**CE APARE:** Grafic interactiv cu semnal + spectru FFT

**CE DEMONSTREZI:**
1. **Selectează "Sinusoidă"** (presetul simplu)
   > "O sinusoidă pură are o singură frecvență - vedeți un singur vârf în spectru."

2. **Selectează "Chirp"** (frecvență crescătoare)
   > "Un chirp are frecvența care crește în timp. Spectrul arată TOATE frecvențele prezente, dar nu vedem evoluția temporală."

3. **Selectează "Gaussian Pulse"**
   > "Un puls gaussian e localizat în timp, dar spectrul e larg - nu știm CÂND a apărut pulsul din spectru."

4. **Încheie cu "Square Wave"**
   > "O undă pătrată conține armonici - frecvențele fundamentale și multiplii ei."

**TRANZIȚIE:**
> "Acum că am văzut limitările Fourier, să vedem cum putem separa frecvențele folosind filtre."

---

## 🔧 SECȚIUNEA 3: FILTRE DIGITALE (6 minute)

### Slide 6: `filters-title` — Titlu Secțiune
**⏱️ Durată: 20 secunde**

**CE SPUI:**
> "Filtrele digitale - instrumentele care separă frecvențele înalte de cele joase."

---

### Slide 7: `filters-theory` — Teorie Filtre
**⏱️ Durată: 2 minute**

**CE APARE:** Trei tipuri de filtre cu formule + grafice

**CE SPUI:**
> "Există trei tipuri principale de filtre:
>
> 1. **Filtrul Ideal** - taie brusc la frecvența de cutoff. Matematic perfect, dar imposibil de implementat în practică (ar necesita un impuls de răspuns infinit).
>
> 2. **Filtrul Butterworth** - tranziție lină, fără oscilații în banda de trecere. Foarte popular în practică.
>
> 3. **Filtrul Gaussian** - cel mai neted, fără overshoot. Folosit mult în procesarea imaginilor.
>
> Fiecare filtru are un **trade-off** între cât de abrupt taie frecvențele și cât de 'curat' e răspunsul în domeniul timp."

---

### Slide 8: `filters-demo` — Demo Interactiv Filtre
**⏱️ Durată: 2.5 minute**

**CE APARE:** Grafic cu semnal original + filtrat + controale

**CE DEMONSTREZI:**
1. **Alege semnalul "5Hz + 50Hz"**
   > "Avem un semnal compus din două frecvențe: 5Hz (lent) și 50Hz (rapid)."

2. **Setează filtru Low-pass, cutoff ~20Hz**
   > "Filtrul low-pass păstrează doar frecvențele joase. Vedeți cum componenta de 50Hz dispare, rămâne doar sinusoida lentă de 5Hz."

3. **Schimbă la High-pass**
   > "High-pass face invers - păstrează frecvențele înalte, elimină pe cele joase."

4. **Modifică forma filtrului** (ideal → butterworth → gaussian)
   > "Observați diferența în tranziție - filtrul ideal taie brusc, Gaussian e cel mai neted."

---

### Slide 9: `filters-wavelets` — Conexiunea cu Wavelets
**⏱️ Durată: 1 minute**

**CE APARE:** Diagrama filter bank

**CE SPUI:**
> "Și acum vine revelația importantă: **wavelets sunt esențialmente o bancă de filtre!**
>
> Aplicăm un filtru low-pass (h) pentru a obține aproximarea (frecvențe joase) și un filtru high-pass (g) pentru detalii (frecvențe înalte).
>
> Această idee simplă - separare în low și high - aplicată recursiv, este baza algoritmului Mallat pe care îl vom vedea mai târziu."

---

## 🔄 SECȚIUNEA 4: CONVOLUȚIE (5 minute)

### Slide 10: `conv-title` — Teorie Convoluție
**⏱️ Durată: 2 minute**

**CE APARE:** Formula convoluției + explicație

**CE SPUI:**
> "Convoluția este **operația fundamentală** din spatele filtrelor, rețelelor neuronale, și transformatelor.
>
> Ideea e simplă: luăm un kernel mic (o fereastră de valori) și îl 'alunecăm' peste semnal. La fiecare poziție, calculăm **suma ponderată** - înmulțim element cu element și adunăm.
>
> Formula arată exact asta: parcurgem toate pozițiile k, înmulțim semnalul f cu kernel-ul g inversat, și adunăm.
>
> **De ce e importantă?**
> - Filtrele = convoluție cu un kernel specific
> - CNN-urile = convoluții învățate automat
> - DWT = convoluție cu filtre wavelet"

---

### Slide 11: `conv-demo` — Demo Convoluție 1D
**⏱️ Durată: 2 minute**

**CE APARE:** Animație cu kernel alunecând peste semnal

**CE DEMONSTREZI:**
1. **Alege semnalul "Step"** și kernel **"Moving Average"**
   > "Vedeți cum kernelul alunecă pas cu pas. La fiecare poziție calculăm media vecinilor - asta netezește muchiile abrupte."

2. **Schimbă la kernel "Derivative"**
   > "Kernelul derivativă [-1, 0, 1] detectează SCHIMBĂRILE în semnal. Unde semnalul e constant, rezultatul e zero. La tranziții, avem vârf."

3. **Folosește "Play" pentru animație completă**
   > "Observați produsul punct cu punct (dot product) și cum se formează semnalul de ieșire."

---

### Slide 12: `conv-2d` — Convoluție 2D
**⏱️ Durată: 1 minut**

**CE APARE:** Formula 2D + diagrama subbenzilor DWT

**CE SPUI:**
> "În 2D, principiul e același - kernelul alunecă peste imagine în ambele direcții.
>
> Pentru wavelet 2D, aplicăm filtre pe rânduri și apoi pe coloane, obținând **4 sub-benzi**:
> - **LL** (Low-Low): aproximarea - imaginea mică, blur
> - **LH** (Low-High): detalii orizontale
> - **HL** (High-Low): detalii verticale  
> - **HH** (High-High): detalii diagonale
>
> După fiecare etapă, facem **decimare** (păstrăm doar pixelii pari) - imaginea devine de 4 ori mai mică!"

---

## 🔲 SECȚIUNEA 5: KERNELS 2D (7 minute)

### Slide 13: `kernels-title` — Titlu Secțiune
**⏱️ Durată: 20 secunde**

**CE SPUI:**
> "Acum să vedem convoluția în acțiune pe imagini reale!"

---

### Slide 14: `kernels-theory` — Teorie Kernels
**⏱️ Durată: 1.5 minute**

**CE APARE:** Formula + explicații pentru blur/sharpen/edge

**CE SPUI:**
> "Un kernel 2D e o matrice mică (de obicei 3×3 sau 5×5) care definește operația.
>
> - **Blur (Box/Gaussian)**: mediază vecinii → netezește imaginea
> - **Sharpen**: amplifică diferențele față de vecini → accentuează detaliile  
> - **Edge Detection (Sobel)**: detectează gradientul → evidențiază contururile
>
> Aceleași kerneluri sunt folosite și în rețelele neuronale convoluționale, doar că acolo valorile sunt învățate automat!"

---

### Slide 15: `kernels-edu` — Demo Educațional Pixel-by-Pixel
**⏱️ Durată: 3 minute** ⭐ SLIDE IMPORTANT

**CE APARE:** Animație pas cu pas cu calcul vizibil

**CE DEMONSTREZI:**
1. **Alege un sprite simplu** (de ex. "mario_star")
   > "Vom vedea exact cum se calculează fiecare pixel de ieșire."

2. **Selectează kernel "Box Blur 3×3"**
   > "Box blur face media celor 9 vecini. Vedeți matricea de greutăți - toate sunt 1/9."

3. **Apasă Play** sau **Step** pentru a vedea animația
   > "La fiecare poziție, suprapunem kernelul peste pixeli, înmulțim, adunăm, și obținem valoarea nouă.
   >
   > Observați cum marginile devin mai estompate - asta e efectul de blur."

4. **Schimbă la "Sobel X"**
   > "Sobel detectează muchii. Valorile negative și pozitive din kernel evidențiază tranziții de intensitate."

**PONT:** Folosește butonul "Step" pentru a merge manual și a explica fiecare pas

---

### Slide 16: `kernels-demo` — Kernels pe Imagini Reale
**⏱️ Durată: 2 minute**

**CE APARE:** Imagine completă cu diferite kerneluri

**CE DEMONSTREZI:**
1. **Selectează imaginea "Lena" sau "Peppers"**

2. **Aplică în succesiune:**
   - Gaussian Blur → "Netezire elegantă"
   - Sharpen → "Detalii accentuate"
   - Sobel → "Doar contururile"
   - Emboss → "Efect 3D"

> "Vedeți cum același principiu - convoluție cu kernel - produce efecte complet diferite în funcție de valorile din matrice."

---

## 🌊 SECȚIUNEA 6: WAVELETS (10 minute) ⭐ SECȚIUNEA PRINCIPALĂ

### Slide 17: `wavelet-title` — Titlu Secțiune
**⏱️ Durată: 30 secunde**

**CE SPUI:**
> "Acum intrăm în subiectul principal: Transformata Wavelet - soluția la problemele lui Fourier!"

---

### Slide 18: `wavelet-theory` — De ce Wavelets?
**⏱️ Durată: 2 minute**

**CE APARE:** Formula wavelet + comparație cu Fourier

**CE SPUI:**
> "Wavelets rezolvă problema fundamentală a lui Fourier: ne spun **atât CE frecvențe** există, **cât și CÂND** apar.
>
> Formula arată că un wavelet are doi parametri:
> - **a** (scala) - controlează frecvența: a mic = frecvență înaltă, a mare = frecvență joasă
> - **b** (translația) - controlează poziția în timp
>
> Waveletul 'mamă' ψ(t) este scalat și translatat pentru a scana tot semnalul.
>
> **Analogie muzicală:** Dacă Fourier vă spune 'melodia conține DO, RE, MI', wavelets vă spun 'la secunda 1 e DO, la secunda 2 e RE, la secunda 3 e MI'!"

---

### Slide 19: `wavelet-families` — Familii Wavelet
**⏱️ Durată: 2 minute**

**CE APARE:** Tab-uri cu DWT, CWT, Teorie

**CE DEMONSTREZI:**
1. **Tab DWT (Discrete)**
   > "Waveleturile discrete sunt cele folosite în practică - Haar, Daubechies, Symlets.
   > - **Haar** - cel mai simplu, treaptă
   > - **Daubechies** - cele mai populare, db4 e standardul pentru JPEG2000"

2. **Tab CWT (Continuous)**
   > "Continuous wavelets sunt folosite pentru analiză detaliată:
   > - **Morlet** - sinusoidă modulată gaussian, excelent pentru analiza timp-frecvență
   > - **Mexican Hat** - a doua derivată a gaussianei"

3. **Tab Teorie** (opțional, dacă ai timp)
   > "Aici sunt condițiile matematice pe care trebuie să le îndeplinească un wavelet valid."

---

### Slide 20: `wavelet-demo` — Wavelet Playground
**⏱️ Durată: 2 minute** ⭐ DEMO INTERACTIV

**CE APARE:** Wavelet cu controale pentru scalare și translație

**CE DEMONSTREZI:**
1. **Alege "Sinusoidă"** ca wavelet
   > "Acesta e similar cu Fourier - o sinusoidă simplă."

2. **Modifică SCALA (a)**
   > "Scala mică = wavelet comprimat = frecvență înaltă.
   > Scala mare = wavelet extins = frecvență joasă."

3. **Modifică TRANSLAȚIA (b)**
   > "Translația mută waveletul în timp - așa 'scanăm' semnalul."

4. **Schimbă la "Mexican Hat"**
   > "Acesta e un wavelet real, folosit în practică. Observați forma caracteristică."

5. **Schimbă la "Morlet"**
   > "Morlet combină sinusoida cu o anvelopă gaussiană - cel mai folosit pentru analiză CWT."

---

### Slide 21: `wavelet-scan` — Demo Scanare Semnal
**⏱️ Durată: 1.5 minute**

**CE APARE:** Animație cu wavelet scanând semnalul

**CE DEMONSTREZI:**
1. **Lasă animația să ruleze**
   > "Vedeți cum waveletul se mișcă de-a lungul semnalului. La fiecare poziție calculăm corelația - cât de bine se potrivește waveletul cu semnalul local."

2. **Arată coeficienții rezultați**
   > "Coeficienții mari apar acolo unde waveletul se potrivește bine cu semnalul - adică acolo unde găsim frecvența pe care o căutăm."

---

### Slide 22: `heisenberg-boxes` — Compromisul Timp-Frecvență
**⏱️ Durată: 1.5 minute**

**CE APARE:** Vizualizare cutii Heisenberg pentru STFT vs Wavelet

**CE SPUI:**
> "Acesta e principiul incertitudinii Heisenberg aplicat la semnale.
>
> - **STFT (Fourier cu fereastră)**: cutii de aceeași dimensiune - rezoluție fixă în timp și frecvență
> - **Wavelet**: cutii adaptive - la frecvențe joase avem rezoluție bună în frecvență, la frecvențe înalte avem rezoluție bună în timp
>
> Acest comportament adaptiv face wavelets ideale pentru semnale cu evenimente rapide (tranziții) și componente lente (trenduri) simultan."

**ACȚIUNI:** Schimbă între modurile de vizualizare dacă sunt disponibile

---

### Slide 23: `scalogram` — Scalograma CWT
**⏱️ Durată: 1 minute**

**CE APARE:** Harta 2D timp-scală

**CE SPUI:**
> "Scalograma e reprezentarea vizuală a transformatei wavelet continue.
> - Axa X = timp
> - Axa Y = scala (inversul frecvenței)
> - Culoarea = magnitudinea coeficientului
>
> Zonele 'fierbinți' arată unde semnalul conține energie la acea frecvență și acel moment."

---

### Slide 24: `complex-wavelet` — Wavelet Complex
**⏱️ Durată: 30 secunde (opțional, poate fi sărit)

**CE SPUI:**
> "Wavelets complexe, ca Morlet, ne dau atât magnitudinea cât și faza. Util pentru analiză avansată, dar nu intrăm în detalii acum."

---

## ⭐ SECȚIUNEA 7: ALGORITMUL MALLAT (10 minute)

### Slide 25: `decomp-title` — Titlu Secțiune
**⏱️ Durată: 30 secunde**

**CE SPUI:**
> "Acum vedem cum implementăm wavelet-urile eficient: Algoritmul Mallat - esența transformatei wavelet discrete."

---

### Slide 26: `decomp-intro` — Coeficienți și Funcții de Bază
**⏱️ Durată: 1.5 minute**

**CE APARE:** Formule pentru φ (scalare) și ψ (wavelet)

**CE SPUI:**
> "Mallat a arătat că orice semnal se poate exprima folosind două funcții:
> - **φ (phi)** - funcția de scalare - captează frecvențele joase, structura globală
> - **ψ (psi)** - waveletul - captează frecvențele înalte, detaliile
>
> Indicele j reprezintă nivelul (scala), iar k reprezintă translația.
>
> Factorul 2^(j/2) asigură că energia e conservată la fiecare nivel."

---

### Slide 27: `decomp-theory` — Cele 4 Sub-benzi
**⏱️ Durată: 1 minute**

**CE APARE:** Matricea LL, HL, LH, HH

**CE SPUI:**
> "În 2D, descompunerea produce 4 sub-benzi:
> - **LL** - aproximarea (blur) - conține cea mai mare parte din energie
> - **LH** - detalii orizontale (muchii orizontale)
> - **HL** - detalii verticale (muchii verticale)
> - **HH** - detalii diagonale (textură, zgomot)
>
> La compresia JPEG2000, coeficienții mici din LH, HL, HH sunt eliminați - ei conțin detalii fine pe care ochiul nu le observă."

---

### Slide 28: `mallat-1d-edu` — Demo Mallat 1D
**⏱️ Durată: 2 minute** ⭐ DEMO IMPORTANT

**CE APARE:** Vizualizare pas cu pas a descompunerii 1D

**CE DEMONSTREZI:**
1. **Alege un semnal simplu** (ex: "Step" sau semnal custom)

2. **Rulează animația**
   > "Vedem cum semnalul trece prin filtrul low-pass (h) și high-pass (g).
   >
   > După filtrare, facem **decimare** - păstrăm doar eșantioanele pare. Asta reduce dimensiunea la jumătate.
   >
   > Rezultatul: coeficienți de aproximare (cA) și coeficienți de detaliu (cD)."

3. **Arată mai multe niveluri** (dacă e posibil)
   > "Procesul se repetă recursiv pe aproximare - obținem o descompunere piramidală."

---

### Slide 29: `decomp-demo` — Demo Mallat 2D
**⏱️ Durată: 2 minute** ⭐ DEMO CHEIE

**CE APARE:** Descompunere imagine 2D cu animație

**CE DEMONSTREZI:**
1. **Modul educațional (patch 8×8)**
   > "Pe un patch mic vedem exact cum se aplică filtrele. Întâi pe rânduri, apoi pe coloane."

2. **Modul full image**
   > "Pe imagine completă vedem rezultatul vizual:
   > - Colțul din stânga-sus = LL (miniatura imaginii)
   > - Restul = detalii pe diferite direcții"

3. **Mai multe niveluri**
   > "La nivelul 2, descompunem și LL-ul - obținem piramida completă."

---

### Slide 30: `filter-bank` — Banca de Filtre
**⏱️ Durată: 1 minute**

**CE APARE:** Diagrama de flux a filtrelor

**CE SPUI:**
> "Asta e schema completă a algoritmului Mallat:
>
> **Analiză (descompunere):** semnal → filtre h,g → decimare → coeficienți
>
> **Sinteză (reconstrucție):** coeficienți → upsampling → filtre inverse → semnal recuperat
>
> Dacă filtrele sunt alese corect (condiția de reconstrucție perfectă), semnalul recuperat e IDENTIC cu originalul!"

---

### Slide 31: `pyramid-decomp` — Descompunere Piramidală
**⏱️ Durată: 1 minute**

**CE APARE:** Piramida multi-nivel

**CE SPUI:**
> "Aplicând recursiv pe LL, obținem piramida completă.
>
> - Nivel 1: LL1, LH1, HL1, HH1
> - Nivel 2: LL2, LH2, HL2, HH2 (din LL1)
> - Nivel 3: și așa mai departe...
>
> JPEG2000 folosește de obicei 5-6 niveluri de descompunere."

---

### Slide 32: `reconstruction` — Reconstrucție Perfectă
**⏱️ Durată: 1 minute**

**CE APARE:** Demo reconstrucție cu metrici

**CE DEMONSTREZI:**
> "Haideți să verificăm că reconstrucția e perfectă."

1. **Arată PSNR/MSE**
   > "PSNR infinit sau MSE = 0 înseamnă reconstrucție fără pierderi."

2. **Compară imaginile**
   > "Original vs Reconstruit - identice pixel cu pixel!"

---

## 🏥 SECȚIUNEA 8: APLICAȚII (6-8 minute)

### Slide 33: `applications-title` — Titlu
**⏱️ Durată: 30 secunde**

**CE SPUI:**
> "Acum să vedem de ce wavelets sunt atât de importante în practică - și vă promit că lista e impresionantă. De la medicină la finanțe, de la imagini la semnale seismice - wavelets sunt peste tot."

---

### Slide 34: `applications-ecg` — ECG
**⏱️ Durată: 2 minute**

**CE APARE:** Puncte despre analiza ECG

**CE SPUI (conversațional, alege ce te inspiră):**
> "În cardiologie, wavelets au revoluționat modul în care analizăm inima.

**Puncte de discuție liberă:**
- **Detectarea bătăilor:** "Complexul QRS - acel vârf caracteristic din ECG - are o formă foarte specifică. Wavelets precum Daubechies 'se potrivesc' perfect cu această formă, detectând fiecare bătaie chiar și în semnale zgomotoase."

- **Monitorizare Holter:** "Când purtați un monitor cardiac 24-48 ore, wavelets procesează automat milioane de bătăi, detectând anomalii pe care un medic le-ar rata."

- **Aritmii și fibrilații:** "Fibrilația atrială afectează milioane de oameni - wavelets pot detecta aceste neregularități subtile din forma undei."

- **Zgomotul muscular:** "Când pacientul se mișcă, mușchii generează semnale electrice care 'acoperă' ECG-ul. Wavelets separă inteligent semnalul cardiac de zgomot."

---

### Slide 35: `applications-eeg` — EEG
**⏱️ Durată: 2-3 minute** ⭐ SECȚIUNE EXTINSĂ

**CE APARE:** Benzile de frecvență EEG

**CE SPUI (mai liber, alege subiecte care te pasionează):**

> "EEG-ul - electroencefalograma - măsoară activitatea electrică a creierului. Și aici wavelets sunt fundamentale."

**Benzile de frecvență (poți detalia):**
- **Delta (0.5-4 Hz):** "Somnul profund. Când dormiți, creierul vostru produce unde lente și ample. Medicina somnului folosește wavelets pentru a determina fazele somnului automat."

- **Theta (4-8 Hz):** "Starea de relaxare, meditație, visare cu ochii deschiși. Studiile de mindfulness analizează theta cu wavelets."

- **Alpha (8-13 Hz):** "Când închideți ochii și vă relaxați, creierul generează unde alpha. E semnul clasic al unui creier treaz dar calm."

- **Beta (13-30 Hz):** "Concentrare, rezolvare de probleme, anxietate. Când dați un examen, creierul vostru e plin de beta."

- **Gamma (30+ Hz):** "Procesare cognitivă complexă, insight-uri. Când aveți acel moment de 'aha!' - asta e gamma."

**Aplicații EEG extinse (alege ce vrei să detaliezi):**

🧠 **Brain-Computer Interface (BCI):**
> "Acesta e unul din cele mai fascinante domenii! Imaginați-vă: o persoană paralizată care își controlează un braț robotic doar cu gândirea. Cum funcționează?
>
> Creierul produce pattern-uri electrice diferite când VĂ IMAGINAȚI că mișcați mâna stângă vs dreapta. Wavelets extrag aceste pattern-uri în timp real, le clasifică, și traduc gândul în acțiune.
>
> Sistemele BCI moderne folosesc wavelets pentru că avem nevoie de LOCALIZARE ÎN TIMP - trebuie să știm CÂND a apărut intenția de mișcare, nu doar ce frecvențe sunt prezente."

🎮 **Gaming și realitate virtuală:**
> "Există deja căști EEG pentru gaming care detectează concentrarea, relaxarea, sau chiar expresii faciale - toate procesate cu wavelets."

💤 **Medicina somnului:**
> "Laboratoarele de somn folosesc wavelets pentru a segmenta automat nopțile în faze de somn - REM, non-REM, treziri. Un somnolog verifică apoi rezultatele, dar wavelets fac 90% din muncă."

⚡ **Detectarea epilepsiei:**
> "Crizele epileptice au semnături caracteristice - unde anormale care apar brusc. Wavelets pot detecta aceste crize chiar înainte să apară simptomele clinice, oferind avertismente vitale pentru pacienți."

---

### Slide 36: `applications-other` — Alte Aplicații
**⏱️ Durată: 2-3 minute** ⭐ SECȚIUNE EXTINSĂ

**CE SPUI (alege domeniile care te interesează):**

> "Lista aplicațiilor wavelet e aproape nesfârșită. Haideți să explorăm câteva:"

🏥 **MRI și Imagistică Medicală:**
> "RMN-ul - Rezonanța Magnetică - produce cantități enorme de date. Wavelets comprimă aceste date fără pierdere de informație diagnostică importantă. 
>
> Mai mult, wavelets ajută la RECONSTRUCȚIE - putem face RMN-uri mai rapide (deci mai confortabile pentru pacient) și apoi reconstruim imaginea completă matematic.
>
> În radiologie, wavelets detectează tumori, leziuni, și anomalii subtile pe care ochiul uman le-ar putea rata."

📷 **JPEG2000 și Compresie de Imagine:**
> "Vom vedea asta în detaliu mai târziu, dar pe scurt: JPEG2000 folosește wavelets în loc de DCT, oferind compresie mai bună la rate mici - fără blocuri urâte."

🔊 **Audio și Muzică:**
> "Shazam - aplicația care recunoaște melodii - folosește o variantă de wavelets pentru 'amprente audio'. Noise cancellation din căștile voastre? Tot wavelets. Compresie audio? Wavelets."

📈 **Finanțe și Tranzacționare:**
> "Traderii algoritmici folosesc wavelets pentru a detecta trend-uri și volatilitate pe piețe. Wavelets separă 'zgomotul' zilnic de trend-urile pe termen lung."

🌍 **Seismologie:**
> "Detectarea cutremurelor, analiza undelor seismice, predicția replicilor - toate folosesc wavelets. Când are loc un cutremur în Japonia, stațiile seismice din toată lumea analizează datele cu wavelets."

🛰️ **Sateliți și Telecomunicații:**
> "FBI-ul a standardizat compresie wavelet pentru amprente digitale. NASA folosește wavelets pentru imagini satelit. HDTV și streaming video beneficiază de wavelets."

🔬 **Fizică și Inginerie:**
> "Detectarea defectelor în materiale, analiza vibrațiilor în motoare, procesarea radar - wavelets sunt instrumentul universal."

**CONCLUZIE SECȚIUNE:**
> "Practic, oriunde aveți un semnal care variază în timp și frecvență - wavelets sunt probabil cea mai bună unealtă de analiză. Iar faptul că sunt computațional eficiente (O(n) cu Mallat!) le face practice pentru aplicații în timp real."

---

## 🔇 SECȚIUNEA 9: DENOISING (4 minute)

### Slide 37: `denoise-title` — Titlu
**⏱️ Durată: 20 secunde**

**CE SPUI:**
> "O aplicație practică importantă: eliminarea zgomotului cu wavelets."

---

### Slide 38: `denoise-theory` — Teorie Thresholding
**⏱️ Durată: 1.5 minute**

**CE APARE:** Diagrama hard vs soft thresholding

**CE SPUI:**
> "Ideea e simplă și elegantă:
>
> 1. Descompunem semnalul în coeficienți wavelet
> 2. Coeficienții **mici** sunt probabil **zgomot** → îi eliminăm
> 3. Coeficienții **mari** sunt probabil **semnal real** → îi păstrăm
> 4. Reconstruim
>
> Două metode de thresholding:
> - **Hard:** coeficienții sub prag = 0, restul rămân neschimbați
> - **Soft:** coeficienții sub prag = 0, restul sunt 'micșorați' spre zero
>
> Soft thresholding produce rezultate mai netede, fără artefacte."

---

### Slide 39: `denoise-demo` — Demo Denoising
**⏱️ Durată: 2 minute** ⭐ DEMO VIZUAL

**CE APARE:** Imagine cu zgomot + controale

**CE DEMONSTREZI:**
1. **Adaugă zgomot** (slider)
   > "Adăugăm zgomot gaussian - vedeți cum se degradează imaginea."

2. **Aplică denoising** 
   > "Acum aplicăm thresholding wavelet."

3. **Ajustează pragul**
   > "Prag mic = păstrăm mai mult detaliu, dar și zgomot.
   > Prag mare = eliminăm zgomotul, dar pierdem și detalii.
   >
   > Trebuie găsit un echilibru."

4. **Compară rezultatele**
   > "Observați cum denoising-ul wavelet păstrează muchiile mult mai bine decât un simplu blur!"

---

## ⚖️ SECȚIUNEA 10: DCT VS WAVELET (5 minute)

### Slide 40: `compare-title` — Titlu
**⏱️ Durată: 20 secunde**

**CE SPUI:**
> "Și acum, marea întrebare: de ce JPEG2000 în loc de JPEG? DCT vs Wavelet!"

---

### Slide 41: `jpeg-pipeline` — Pipeline JPEG
**⏱️ Durată: 1.5 minute**

**CE APARE:** Diagrama pipeline JPEG

**CE SPUI:**
> "JPEG folosește DCT (Discrete Cosine Transform) pe blocuri de 8×8 pixeli.
>
> Pipeline-ul:
> 1. RGB → YCbCr (spațiu de culoare perceptual)
> 2. Subsampling crominață (ochiul e mai puțin sensibil la culoare)
> 3. Împărțire în blocuri 8×8
> 4. DCT pe fiecare bloc
> 5. Cuantizare (aici se pierde informație!)
> 6. Scanare zigzag + codare entropică
>
> **Problema:** blocurile sunt procesate independent → la compresii mari apar artefacte de bloc vizibile!"

---

### Slide 42: `dct-vs-wavelet` — Comparație Vizuală
**⏱️ Durată: 1.5 minute** ⭐ DEMO COMPARATIV

**CE APARE:** Imagini side-by-side DCT vs Wavelet

**CE DEMONSTREZI:**
1. **Setează compresie moderată (~50%)**
   > "La compresie moderată, ambele arată bine."

2. **Crește compresia (~90%)**
   > "La compresie agresivă, JPEG arată blocuri clare (blocking artifacts).
   > JPEG2000/Wavelet degradează mai uniform, fără blocuri vizibile."

3. **Zoom pe o margine**
   > "Vedeți marginea pătrătoasă la DCT vs marginea netedă la wavelet."

---

### Slide 43: `compare-theory` — Comparație Directă
**⏱️ Durată: 1 minute**

**CE APARE:** Tabel comparativ

**CE SPUI:**
> "Rezumând:
>
> **DCT (JPEG):**
> ✅ Mai rapid, mai simplu
> ✅ Universal suportat
> ❌ Artefacte de bloc la compresii mari
> ❌ Fără scalabilitate
>
> **Wavelet (JPEG2000):**
> ✅ Calitate superioară la compresii mari
> ✅ Scalabilitate (rezoluții multiple în același fișier)
> ✅ Regiuni de interes (ROI) - compresie selectivă
> ❌ Mai lent, mai complex
> ❌ Suport mai limitat (dar crește!)"

---

### Slide 44: `compare-demo` — Demo Final
**⏱️ Durată: 1 minute**

**CE DEMONSTREZI:**
> "Ultimul demo: comparație directă pe imaginea voastră preferată.
>
> Ajustați calitatea și observați diferențele. La ~10% calitate, JPEG e aproape inutilizabil, în timp ce wavelet păstrează structura principală a imaginii."

---

## 🎬 SECȚIUNEA 11: FINAL (1+ minute)

### Slide 45: `final` — Concluzii
**⏱️ Durată: 1 minut + Q&A**

**CE SPUI:**
> "Să recapitulăm ce am învățat astăzi:
>
> 1. **Fourier** ne arată frecvențele, dar pierde informația temporală
> 2. **Wavelets** rezolvă asta - ne dau atât CE cât și CÂND
> 3. **Algoritmul Mallat** face wavelets practice și eficiente
> 4. **Aplicații:** de la ECG la JPEG2000, wavelets sunt omniprezente
> 5. **JPEG2000 bate JPEG** la compresii mari datorită transformatei wavelet
>
> Vă mulțumesc pentru atenție! Întrebări?"

---

# 📝 SFATURI GENERALE

## Gestionarea timpului:
- Dacă rămâi în urmă: sari peste slide-urile opționale (Scalogram, Complex Wavelet, Applications-Other)
- Dacă ai timp în plus: fă mai multe demo-uri interactive

## Întrebări frecvente:
1. **"De ce nu se folosește JPEG2000 peste tot?"**
   > "Adopție lentă din cauza brevetelor (acum expirate), complexității implementării, și inerției industriei. Dar câștigă teren în medicină, sateliți, și arhivare."

2. **"Care wavelet e cel mai bun?"**
   > "Depinde de aplicație. Daubechies db4 e un compromis bun. Haar e cel mai simplu pentru educație. Morlet pentru analiză timp-frecvență."

3. **"Pot wavelets să înlocuiască CNN-urile?"**
   > "Nu, dar se complementează. Wavelets pot fi primul strat de feature extraction, sau pot fi integrate în arhitectura CNN."

## Probleme tehnice:
- **Backend căzut:** Repornește cu `uvicorn main:app --reload`
- **Frontend blocat:** Refresh browser (F5)
- **Grafice nu se încarcă:** Verifică consola browser (F12)

---

# ✅ CHECKLIST FINAL

Înainte de prezentare:
- [ ] Am testat toate demo-urile
- [ ] Am pregătit exemple de backup (imagini)
- [ ] Am citit scriptul o dată
- [ ] Am verificat timing-ul (cronometrat)
- [ ] Am pregătit răspunsuri pentru întrebări

După prezentare:
- [ ] Am notat întrebările primite
- [ ] Am salvat feedback-ul
- [ ] Am identificat ce pot îmbunătăți

---

**Succes la prezentare! 🎓🌊**
