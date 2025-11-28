"""
Presentation Script - Wavelet vs DCT

This script provides speaker notes and timing for the presentation.
Can also automate slide transitions and demo launches.

Usage:
    python presentation_runner.py [--mode notes|interactive|auto]
"""
import time
import subprocess
import sys
from pathlib import Path


# Presentation structure with timing and notes
PRESENTATION = {
    "title": "Waveleți și extensia unei librării JPEG bazate pe DCT",
    "author": "Alexandra",
    "duration_minutes": 20,
    
    "sections": [
        {
            "id": 1,
            "title": "Motivație: De ce waveleți?",
            "duration": 120,  # seconds
            "notes": """
            NOTIȚE PENTRU VORBITOR:
            
            - Începe cu întrebarea: "De ce să schimbăm ceva ce funcționează?"
            - Menționează librăria JPEG existentă în C++
            - Subliniază limitările: blocking artifacts, fără multi-rezoluție
            - NU aruncăm DCT la gunoi - extindem arhitectura
            
            DEMO: Arată o imagine comprimată cu blocking vizibil
            """,
            "demo": None
        },
        {
            "id": 2,
            "title": "Fourier, STFT și problema windowing-ului",
            "duration": 180,
            "notes": """
            NOTIȚE PENTRU VORBITOR:
            
            - Fourier clasic: ce frecvențe, nu UNDE
            - STFT: fereastră glisantă - compromis timp/frecvență
            - Arată spectrograma vs spectru simplu
            - Problema: fereastră FIXĂ = rezoluție constantă
            
            ANIMAȚIE: scene_fourier_vs_wavelet.py -> STFTSpectrogram
            """,
            "animation": "STFTSpectrogram"
        },
        {
            "id": 3,
            "title": "Waveleți: ideea intuitivă",
            "duration": 180,
            "notes": """
            NOTIȚE PENTRU VORBITOR:
            
            - Wavelet = "undă mică" cu suport finit
            - Scalare (a) și translație (b)
            - Rezoluție ADAPTIVĂ vs fixă
            - Comparație: grilă uniformă STFT vs grilă adaptivă wavelet
            
            ANIMAȚIE: scene_fourier_vs_wavelet.py -> FourierVsWavelet
            
            - Menționează incertitudinea Heisenberg
            - Aria pe planul timp-frecvență e constantă, dar distribuită inteligent
            """,
            "animation": "FourierVsWavelet"
        },
        {
            "id": 4,
            "title": "Mallat și băncile de filtre",
            "duration": 180,
            "notes": """
            NOTIȚE PENTRU VORBITOR:
            
            1D:
            - Filtru trece-jos (H0) → aproximări
            - Filtru trece-sus (H1) → detalii
            - Decimare cu 2
            
            2D:
            - Aplică pe linii, apoi pe coloane
            - 4 subbenzi: LL, LH, HL, HH
            - Multi-level: recursiv pe LL
            
            ANIMAȚIE: scene_mallat_decomposition.py -> FilterBank, MallatDecomposition
            """,
            "animation": "MallatDecomposition"
        },
        {
            "id": 5,
            "title": "JPEG vs JPEG2000",
            "duration": 150,
            "notes": """
            NOTIȚE PENTRU VORBITOR:
            
            JPEG (DCT):
            - Blocuri 8×8
            - Artefacte de bloc la compresie mare
            
            JPEG2000 (DWT):
            - Întreaga imagine sau tile-uri mari
            - Multi-rezoluție
            - Artefacte "blur", nu blocuri
            - Compresie progresivă
            
            DEMO: Arată aceeași imagine comprimată cu ambele metode
            """,
            "demo": "comparison_images"
        },
        {
            "id": 6,
            "title": "Aplicații: Medicină, Fizică, Denoising",
            "duration": 120,
            "notes": """
            NOTIȚE PENTRU VORBITOR:
            
            Medicină:
            - ECG/EEG: detectare evenimente tranzitorii
            - Imagistică: compresie, denoising
            
            Fizica cuantică:
            - Funcții de undă localizate
            - Analiza semnalelor experimentale
            
            Denoising:
            - Semnal = câțiva coeficienți mari
            - Zgomot = mulți coeficienți mici
            - Threshold și reconstituire
            
            ANIMAȚIE: scene_denoising.py -> WaveletDenoising
            """,
            "animation": "WaveletDenoising"
        },
        {
            "id": 7,
            "title": "Extinderea librăriei C++",
            "duration": 120,
            "notes": """
            NOTIȚE PENTRU VORBITOR:
            
            Arhitectura:
            - ITransform2D ca interfață generică
            - DCTTransform și WaveletTransform
            
            Integrare:
            - DWT pe întreaga imagine sau tile-uri mari
            - Cuantizare separată pe subbenzi
            - Parametri: --transform=wavelet, --levels=3
            
            Arată cod sau diagrama UML
            """,
            "demo": "code_architecture"
        },
        {
            "id": 8,
            "title": "Demo interactiv și concluzii",
            "duration": 150,
            "notes": """
            NOTIȚE PENTRU VORBITOR:
            
            DEMO LIVE:
            1. Deschide aplicația Streamlit
            2. Încarcă o imagine
            3. Arată decompoziția Mallat
            4. Arată denoising cu slider pentru threshold
            5. Compară DCT vs wavelet la același bitrate
            
            CONCLUZII:
            - Waveleții nu sunt magie
            - Extensie naturală a transformatelor în frecvență
            - Integrare în arhitectura existentă
            
            ÎNTREBĂRI?
            """,
            "demo": "streamlit_app"
        }
    ]
}


def print_section_notes(section: dict):
    """Print speaker notes for a section"""
    print("\n" + "="*70)
    print(f"SECȚIUNEA {section['id']}: {section['title']}")
    print(f"Durată: {section['duration']//60}:{section['duration']%60:02d}")
    print("="*70)
    print(section['notes'])
    
    if section.get('animation'):
        print(f"\n🎬 ANIMAȚIE: {section['animation']}")
    if section.get('demo'):
        print(f"\n💻 DEMO: {section['demo']}")


def run_interactive():
    """Interactive presentation mode with manual advancing"""
    print(f"\n{'#'*70}")
    print(f"# {PRESENTATION['title']}")
    print(f"# Autor: {PRESENTATION['author']}")
    print(f"# Durată estimată: {PRESENTATION['duration_minutes']} minute")
    print('#'*70)
    
    for section in PRESENTATION['sections']:
        print_section_notes(section)
        input("\n[Apasă ENTER pentru secțiunea următoare...]")
    
    print("\n" + "="*70)
    print("PREZENTARE COMPLETĂ!")
    print("="*70)


def run_auto():
    """Automatic mode with timed transitions"""
    print("MODUL AUTOMAT - prezentarea avansează automat")
    
    for section in PRESENTATION['sections']:
        print_section_notes(section)
        print(f"\nUrmătoarea secțiune în {section['duration']} secunde...")
        time.sleep(section['duration'])
    
    print("\nPREZENTARE COMPLETĂ!")


def print_all_notes():
    """Print all notes at once for review"""
    print(f"# {PRESENTATION['title']}")
    print(f"# Autor: {PRESENTATION['author']}\n")
    
    for section in PRESENTATION['sections']:
        print_section_notes(section)


def launch_streamlit():
    """Launch the Streamlit demo app"""
    app_path = Path(__file__).parent.parent / "app" / "main.py"
    subprocess.Popen(["streamlit", "run", str(app_path)])
    print(f"Streamlit app launched: {app_path}")


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Presentation runner")
    parser.add_argument(
        "--mode", "-m",
        choices=["notes", "interactive", "auto", "demo"],
        default="notes",
        help="Presentation mode"
    )
    args = parser.parse_args()
    
    if args.mode == "notes":
        print_all_notes()
    elif args.mode == "interactive":
        run_interactive()
    elif args.mode == "auto":
        run_auto()
    elif args.mode == "demo":
        launch_streamlit()


if __name__ == "__main__":
    main()
