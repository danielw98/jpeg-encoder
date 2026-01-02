# 3. Algoritmul JPEG și rolul DSP

Standardul JPEG (Joint Photographic Experts Group), definit în ITU-T T.81 [1], este cel mai utilizat format de compresie pentru imagini fotografice. Acest capitol detaliază fiecare etapă a pipeline-ului de codare conform specificației [11].

## 3.1 Preprocesare

### Conversia spațiului de culoare: RGB la YCbCr

Imaginile sunt capturate în format RGB (Red, Green, Blue), dar pentru compresie eficientă se convertesc la **YCbCr** [3]:

- **Y** (Luminanță) - strălucirea percepută, corespunzătoare vederii monocromatice
- **Cb** (Crominanță albastră) - diferența față de componenta albastră
- **Cr** (Crominanță roșie) - diferența față de componenta roșie

**Formula de conversie (ITU-R BT.601)** [3]:

$$
\begin{bmatrix} Y \\ Cb \\ Cr \end{bmatrix} = 
\begin{bmatrix} 0.299 & 0.587 & 0.114 \\ -0.169 & -0.331 & 0.500 \\ 0.500 & -0.419 & -0.081 \end{bmatrix}
\begin{bmatrix} R \\ G \\ B \end{bmatrix} +
\begin{bmatrix} 0 \\ 128 \\ 128 \end{bmatrix}
$$

**Motivație:** Sistemul vizual uman este mult mai sensibil la luminanță decât la crominanță [6, p. 442]. Aceasta permite subsampling agresiv pe canalele de culoare fără pierdere vizuală semnificativă.

### Subsampling cromatic

JPEG reduce rezoluția canalelor Cb și Cr exploatând insensibilitatea ochiului la detaliile de culoare [8]:

| Format | Raport Y:Cb:Cr | Descriere | Economie date |
|--------|----------------|-----------|---------------|
| 4:4:4 | 1:1:1 | Fără subsampling | 0% |
| 4:2:2 | 2:1:1 | Subsampling orizontal | 33% |
| 4:2:0 | 4:1:1 | Subsampling orizontal și vertical | 50% |

Formatul **4:2:0** este cel mai frecvent utilizat, oferind un compromis excelent între calitate și compresie. În acest format, pentru fiecare 4 pixeli luminanță există câte un singur pixel Cb și Cr.

## 3.2 Transformarea DCT

### Partiționarea în blocuri 8×8

Imaginea este divizată în blocuri de 8×8 pixeli [1, sec. 4.2]. Această dimensiune reprezintă un compromis optim între:

- **Eficiența compresiei** - blocuri mai mari ar concentra energia mai bine
- **Artefactele de blocking** - blocuri mai mari ar produce discontinuități mai vizibile
- **Complexitatea computațională** - 8×8 permite optimizări hardware eficiente

Valorile pixelilor sunt centrate la zero scăzând 128 (level shift), convertind intervalul [0, 255] în [-128, 127].

### Forward DCT

Fiecare bloc 8×8 este transformat folosind DCT-II 2D [1, Anexa A]:

$$
F(u,v) = \frac{1}{4} \alpha(u) \alpha(v) \sum_{x=0}^{7} \sum_{y=0}^{7} f(x,y) \cos\left[\frac{(2x+1)u\pi}{16}\right] \cos\left[\frac{(2y+1)v\pi}{16}\right]
$$

unde $\alpha(0) = 1/\sqrt{2}$ și $\alpha(k) = 1$ pentru $k > 0$.

**Rezultat:** Matricea 8×8 de pixeli spațiali este transformată într-o matrice 8×8 de coeficienți frecvențiali. Coeficientul F(0,0) reprezintă valoarea medie (DC), iar ceilalți reprezintă variații de frecvență crescătoare (AC).

### Cuantizarea

Coeficienții DCT sunt împărțiți la valorile dintr-o **matrice de cuantizare** și rotunjiți [1, sec. 4.3.1]:

$$
F_q(u,v) = \text{round}\left(\frac{F(u,v)}{Q(u,v)}\right)
$$

Matricile standard pentru luminanță și crominanță sunt definite în Anexa K a specificației [1]. Caracteristici importante:

- Valori mici în colțul stânga-sus (păstrează frecvențele joase)
- Valori mari în dreapta-jos (cuantizează agresiv frecvențele înalte)
- Scalare cu factorul de calitate Q (1-100)

Matricea de cuantizare pentru luminanță (Q=50) are valori de la 16 (poziția DC) până la 121 (frecvențe înalte). Prima linie conține valorile: 16, 11, 10, 16, 24, 40, 51, 61. Ultima linie: 72, 92, 95, 98, 112, 100, 103, 99.

### Scanarea Zig-Zag

Coeficienții cuantizați sunt reordonați într-o secvență 1D folosind pattern-ul zig-zag [1, Fig. 5]. Acest pattern traversează matricea diagonal, grupând:

- Coeficienții de frecvență joasă (nenuli) la început
- Coeficienții de frecvență înaltă (adesea zero) la sfârșit

Această reordonare creează secvențe lungi de zerouri consecutive, ideale pentru codare RLE.

## 3.3 Codare entropică

### Codarea coeficientului DC (DPCM)

Coeficientul DC variază lent între blocuri adiacente datorită corelației spațiale. Se codează **diferența** față de blocul anterior folosind DPCM (Differential Pulse Code Modulation) [1, sec. F.1.2.1]:

$$
\Delta DC_i = DC_i - DC_{i-1}
$$

Diferențele au în general valori mai mici decât valorile absolute, necesitând mai puțini biți pentru codare.

### Codarea coeficienților AC (RLE)

Coeficienții AC sunt codați folosind **Run-Length Encoding** [1, sec. F.1.2.2]:

- Se numără zerourile consecutive (run length)
- Se codează perechea (RRRRSSSS, value) unde RRRR = run length, SSSS = category

**Simboluri speciale:**

- **EOB** (End of Block) - indică că restul coeficienților sunt zero
- **ZRL** (Zero Run Length) - reprezintă 16 zerouri consecutive

### Codarea Huffman

Simbolurile RLE sunt codate folosind **coduri Huffman** cu lungime variabilă [1, Anexa K.3]. Principiul Huffman: simbolurile frecvente primesc coduri scurte, simbolurile rare primesc coduri lungi.

| Categorie | Interval valori | Biți necesari |
|-----------|-----------------|---------------|
| 0 | 0 | 0 |
| 1 | -1, 1 | 1 |
| 2 | -3..-2, 2..3 | 2 |
| 3 | -7..-4, 4..7 | 3 |
| ... | ... | ... |
| 11 | -2047..-1024, 1024..2047 | 11 |

### Structura fișierului JPEG (JFIF)

Formatul JFIF (JPEG File Interchange Format) [2] definește structura completă a fișierului:

| Marker | Cod hex | Descriere |
|--------|---------|-----------|
| SOI | FF D8 | Start of Image |
| APP0 | FF E0 | JFIF application marker |
| DQT | FF DB | Define Quantization Table(s) |
| SOF0 | FF C0 | Start of Frame (baseline DCT) |
| DHT | FF C4 | Define Huffman Table(s) |
| SOS | FF DA | Start of Scan (date comprimate) |
| EOI | FF D9 | End of Image |

Între SOS și EOI se află datele comprimate (entropy-coded data), reprezentând secvența de biți Huffman.

\newpage
