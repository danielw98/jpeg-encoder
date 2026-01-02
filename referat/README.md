# Referat: Tehnici DSP în Compresia Imaginilor

Academic paper for Master's TCSI Research course.

## Structure

| File | Chapter | Content |
|------|---------|---------|
| `01_introducere.md` | 1 | Introduction, motivation |
| `02_fundamente_teoretice.md` | 2 | Fourier, DCT, sampling theory |
| `03_algoritmul_jpeg.md` | 3 | JPEG pipeline with DSP focus |
| `04_alte_aplicatii.md` | 4 | Other DSP applications |
| `05_proiect_demonstrativ.md` | 5 | Project architecture & results |
| `06_concluzii.md` | 6 | Conclusions |
| `07_bibliografie.md` | 7 | IEEE-style bibliography |

## Build to Word

### Option 1: PowerShell Script
```powershell
cd referat
.\build_referat.ps1
```

This creates `referat_complet.md` and optionally `referat.docx` (if Pandoc installed).

### Option 2: Manual Pandoc
```powershell
# Install Pandoc: winget install --id JohnMacFarlane.Pandoc
pandoc 00_main.md 01_introducere.md 02_fundamente_teoretice.md 03_algoritmul_jpeg.md 04_alte_aplicatii.md 05_proiect_demonstrativ.md 06_concluzii.md 07_bibliografie.md -o referat.docx
```

### Option 3: Copy-Paste
Open each file in order and paste into Word.

## Adding Figures

Placeholders marked with `<!-- FIGURI: description -->`.

1. Take screenshots from web UI (http://localhost:3000)
2. Save to `referat/figures/`
3. Replace placeholders with: `![Caption](figures/filename.png)`

## Estimated Length

~12 pages (3600 words at 300 words/page)

| Chapter | Pages |
|---------|-------|
| Introducere | 1 |
| Fundamente teoretice | 3-4 |
| Algoritmul JPEG | 4 |
| Alte aplicații | 1.5-2 |
| Proiect demonstrativ | 2 |
| Concluzii | 0.5 |
| Bibliografie | 1 |

## TODO

- [ ] Add screenshots from web UI
- [ ] Insert actual compression results table
- [ ] Review mathematical formulas in Word
- [ ] Add student name and date
