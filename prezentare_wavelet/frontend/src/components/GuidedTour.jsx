import { useState, useEffect, useCallback, useRef } from 'react'
import { LaTeXBlock } from './LaTeX'

// Import the actual view components for full embedding
import FourierView from './FourierView'
import FiltersView from './FiltersView'
import ConvolutionView from './ConvolutionView'
import KernelsView from './KernelsView'
import KernelsEducationalView from './KernelsEducationalView'
import WaveletPlayground from './WaveletPlayground'
import WaveletScanDemo from './WaveletScanDemo'
import WaveletEducationView from './WaveletEducationView'
import HeisenbergBoxesView from './HeisenbergBoxesView'
import ScalogramView from './ScalogramView'
import ComplexWaveletView from './ComplexWaveletView'
import WaveletBasisView from './WaveletBasisView'
import DenoiseView from './DenoiseView'
import DenoiseTheoryView from './DenoiseTheoryView'
import CompareView from './CompareView'
import Mallat1DEduView from './Mallat1DEduView'
import MallatUnifiedView from './MallatUnifiedView'
import FilterBankView from './FilterBankView'
import PyramidDecompView from './PyramidDecompView'
import ReconstructionView from './ReconstructionView'
import JPEGPipelineView from './JPEGPipelineView'
import DCTvsWaveletView from './DCTvsWaveletView'

import '../styles/tour.css'

const API_BASE = '/api'

// =====================================================
// SLIDE DEFINITIONS - Theory slides + Full embedded views
// =====================================================

const SLIDES = [
  // ===== INTRO =====
  {
    id: 'intro-title',
    section: 'intro',
    type: 'title',
    icon: '🎯',
    title: 'Wavelets în Procesarea Imaginilor',
    subtitle: 'O călătorie de la Fourier la JPEG2000',
    color: '#00d4ff'
  },
  {
    id: 'intro-toc',
    section: 'intro',
    type: 'toc',
    icon: '📋',
    title: 'Cuprins',
    subtitle: 'Ce vom învăța astăzi',
    chapters: [
      { icon: '📊', title: 'Transformata Fourier', desc: 'Analiza spectrală a semnalelor', sectionId: 'fourier' },
      { icon: '🔧', title: 'Filtre Digitale', desc: 'Separarea frecvențelor', sectionId: 'filters' },
      { icon: '🔄', title: 'Convoluția', desc: 'Operația fundamentală', sectionId: 'convolution' },
      { icon: '🔲', title: 'Kernel-uri 2D', desc: 'Blur, Sharpen, Edge Detection', sectionId: 'kernels' },
      { icon: '🌊', title: 'Transformata Wavelet', desc: 'Teorie, familii și demo-uri', sectionId: 'wavelets' },
      { icon: '⭐', title: 'Algoritmul Mallat', desc: '1D → 2D → Multi-nivel (pas cu pas)', sectionId: 'decompose' },
      { icon: '🏥', title: 'Aplicații Wavelets', desc: 'ECG, EEG și altele', sectionId: 'applications' },
      { icon: '🔇', title: 'Denoising', desc: 'Eliminarea zgomotului', sectionId: 'denoise' },
      { icon: '⚖️', title: 'DCT vs Wavelet', desc: 'JPEG vs JPEG2000', sectionId: 'compare' }
    ],
    color: '#00d4ff'
  },

  // ===== FOURIER =====
  {
    id: 'fourier-title',
    section: 'fourier',
    type: 'title',
    icon: '📊',
    title: 'Transformata Fourier',
    subtitle: 'Analiza spectrală a semnalelor',
    color: '#ffd93d'
  },
  {
    id: 'fourier-theory',
    section: 'fourier',
    type: 'fourier-theory-enhanced',
    icon: '📊',
    title: 'Descompunere în Frecvențe',
    content: 'Fourier ne spune CE frecvențe există, dar nu CÂND apar.',
    points: [
      'Orice semnal = sumă de sinusoide',
      'Perfect pentru semnale staționare',
      'Pierde informația temporală'
    ],
    color: '#ffd93d'
  },
  {
    id: 'fourier-demo',
    section: 'fourier',
    type: 'fourier-interactive',
    icon: '📊',
    title: 'Demo Interactiv: Fourier',
    color: '#ffd93d'
  },

  // ===== FILTERS =====
  {
    id: 'filters-title',
    section: 'filters',
    type: 'title',
    icon: '🔧',
    title: 'Filtre Digitale',
    subtitle: 'Separarea frecvențelor',
    color: '#ff6b6b'
  },
  {
    id: 'filters-theory',
    section: 'filters',
    type: 'filters-theory-detailed',
    icon: '🔧',
    title: 'Filtre în Domeniul Frecvență',
    color: '#ff6b6b'
  },
  {
    id: 'filters-demo',
    section: 'filters',
    type: 'filters-interactive',
    icon: '🔧',
    title: 'Demo Interactiv: Filtre',
    color: '#ff6b6b'
  },
  {
    id: 'filters-wavelets',
    section: 'filters',
    type: 'filters-wavelet-connection',
    icon: '🔧',
    title: 'Conexiunea cu Wavelets',
    color: '#ff6b6b'
  },

  // ===== CONVOLUTION =====
  {
    id: 'conv-title',
    section: 'convolution',
    type: 'theory',
    icon: '🔄',
    title: 'Convoluția',
    content: 'Kernel-ul alunecă peste semnal, calculând suma ponderată.',
    math: String.raw`(f * g)[n] = \sum_{k} f[k] \cdot g[n-k]`,
    mathLabel: 'Definiția convoluției 1D',
    points: [
      'Baza filtrelor și transformărilor',
      'Folosită în rețele neuronale (CNN)',
      'Complexitate O(n²) → O(n log n) cu FFT'
    ],
    color: '#c9b1ff'
  },
  {
    id: 'conv-demo',
    section: 'convolution',
    type: 'embed',
    embedType: 'convolution',
    icon: '🔄',
    title: 'Demo: Convoluție 1D',
    color: '#c9b1ff'
  },
  {
    id: 'conv-2d',
    section: 'convolution',
    type: 'theory-visual',
    icon: '🔄',
    title: 'Convoluția în Imagini (2D)',
    content: 'Convoluția 2D extinde principiul 1D la imagini. Un kernel alunecă peste imagine, calculând suma ponderată a vecinilor.',
    math: String.raw`(I * K)[x,y] = \sum_{i,j} I[x+i, y+j] \cdot K[i,j]`,
    mathLabel: 'Convoluție 2D',
    dwt2d: {
      title: 'DWT 2D - Descompunere pe Rânduri și Coloane',
      description: 'Aplică filtre low-pass (L) și high-pass (H) în ambele direcții:',
      coefficients: [
        { name: 'LL', formula: String.raw`LL = (L_x * L_y)[I]`, desc: 'Aproximare' },
        { name: 'LH', formula: String.raw`LH = (L_x * H_y)[I]`, desc: 'Detalii orizontale' },
        { name: 'HL', formula: String.raw`HL = (H_x * L_y)[I]`, desc: 'Detalii verticale' },
        { name: 'HH', formula: String.raw`HH = (H_x * H_y)[I]`, desc: 'Detalii diagonale' }
      ],
      subsampling: String.raw`\text{Decimare (}\downarrow 2\text{): păstrăm doar pixelii cu indici pari} \Rightarrow \text{imagine de } \frac{N}{2} \times \frac{N}{2}`
    },
    color: '#c9b1ff'
  },

  // ===== KERNELS =====
  {
    id: 'kernels-title',
    section: 'kernels',
    type: 'title',
    icon: '🔲',
    title: 'Kernel-uri 2D',
    subtitle: 'Blur, Sharpen, Edge Detection',
    color: '#ff9f43'
  },
  {
    id: 'kernels-theory',
    section: 'kernels',
    type: 'theory',
    icon: '🔲',
    title: 'Matrici de Convoluție',
    content: 'Convoluția 2D aplică o matrice (kernel) peste fiecare pixel al imaginii. Fiecare pixel rezultat este suma ponderată a vecinilor săi, folosind valorile din kernel.',
    math: String.raw`(I * K)[i,j] = \sum_{m,n} I[i+m, j+n] \cdot K[m,n]`,
    mathLabel: 'Convoluție 2D: Imagine * Kernel',
    points: [
      'Blur: medierea vecinilor (netezire)',
      'Sharpen: amplifică diferențele',
      'Edge: detectează contururile'
    ],
    color: '#ff9f43'
  },
  {
    id: 'kernels-edu',
    section: 'kernels',
    type: 'embed',
    embedType: 'kernels-edu',
    icon: '🎓',
    title: 'Demo Educațional: Kernel pas cu pas',
    color: '#ff9f43'
  },
  {
    id: 'kernels-demo',
    section: 'kernels',
    type: 'embed',
    embedType: 'kernels',
    icon: '🔲',
    title: 'Demo: Kernel-uri pe Imagini Reale',
    color: '#ff9f43'
  },

  // ===== WAVELETS PLAYGROUND =====
  {
    id: 'wavelet-title',
    section: 'wavelets',
    type: 'title',
    icon: '🌊',
    title: 'Transformata Wavelet',
    subtitle: 'Localizare timp-frecvență',
    color: '#00d4ff'
  },
  {
    id: 'wavelet-theory',
    section: 'wavelets',
    type: 'theory',
    icon: '🌊',
    title: 'De ce Wavelets?',
    content: 'Wavelets oferă ceea ce Fourier nu poate: localizare simultană.',
    math: String.raw`\psi_{a,b}(t) = \frac{1}{\sqrt{|a|}} \psi\left(\frac{t-b}{a}\right)`,
    mathLabel: 'Wavelet cu scalare a, translație b',
    points: [
      'Știm CE frecvențe și CÂND apar',
      'Ideale pentru semnale nestaționare',
      'Analiza multi-rezoluție'
    ],
    color: '#00d4ff'
  },
  {
    id: 'wavelet-families',
    section: 'wavelets',
    type: 'embed',
    embedType: 'wavelet-theory',
    icon: '📚',
    title: 'Familii Wavelet',
    subtitle: 'CWT + DWT + Teorie',
    color: '#00d4ff'
  },
  {
    id: 'wavelet-demo',
    section: 'wavelets',
    type: 'embed',
    embedType: 'playground',
    icon: '🎮',
    title: 'Demo: Wavelet Playground',
    color: '#00d4ff'
  },
  {
    id: 'wavelet-scan',
    section: 'wavelets',
    type: 'embed',
    embedType: 'wavelet-scan',
    icon: '🔍',
    title: 'Demo: Scanarea Semnalului',
    color: '#00d4ff'
  },
  {
    id: 'heisenberg-boxes',
    section: 'wavelets',
    type: 'embed',
    embedType: 'heisenberg',
    icon: '📦',
    title: 'Compromisul Timp-Frecvență',
    subtitle: 'Vizualizare Heisenberg',
    color: '#00d4ff'
  },
  {
    id: 'scalogram',
    section: 'wavelets',
    type: 'embed',
    embedType: 'scalogram',
    icon: '🌈',
    title: 'Scalograma (CWT)',
    subtitle: 'Vizualizare Timp-Scală',
    color: '#00d4ff'
  },
  {
    id: 'complex-wavelet',
    section: 'wavelets',
    type: 'embed',
    embedType: 'complex-wavelet',
    icon: '🌀',
    title: 'Wavelet Complex',
    subtitle: 'Magnitudine și Fază',
    color: '#00d4ff'
  },

  // ===== DECOMPOSITION - ALGORITMUL MALLAT =====
  {
    id: 'decomp-title',
    section: 'decompose',
    type: 'title',
    icon: '⭐',
    title: 'Algoritmul Mallat',
    subtitle: 'Descompunere multi-rezoluție rapidă',
    color: '#ffd700'
  },
  {
    id: 'decomp-intro',
    section: 'decompose',
    type: 'theory',
    icon: '🎯',
    title: 'Coeficienții și Funcțiile de Bază',
    content: 'Semnalul se proiectează pe funcțiile de scalare φ și wavelet ψ.',
    math: String.raw`\begin{aligned} c_{j_0,k} &= \int x(t) \, \phi_{j_0,k}(t) \, dt \quad &\text{(coef. aproximare)} \\[1em] d_{j,k} &= \int x(t) \, \psi_{j,k}(t) \, dt \quad &\text{(coef. detaliu)} \\[1.5em] \phi_{j,k}(t) &= 2^{j/2} \, \phi(2^j t - k) \quad &\text{(funcția de scalare)} \\[1em] \psi_{j,k}(t) &= 2^{j/2} \, \psi(2^j t - k) \quad &\text{(wavelet)} \end{aligned}`,
    mathLabel: 'j = nivel (scală), k = translație',
    points: [
      'φ captează frecvențe joase (structura globală)',
      'ψ captează frecvențe înalte (detaliile)',
      'Factor 2^(j/2) asigură normalizarea energiei'
    ],
    color: '#ffd700'
  },
  {
    id: 'decomp-theory',
    section: 'decompose',
    type: 'theory',
    icon: '🔬',
    title: 'Cele 4 Sub-benzi',
    content: 'Imaginea se descompune în aproximare + 3 direcții de detaliu.',
    math: String.raw`\begin{bmatrix} LL & HL \\ LH & HH \end{bmatrix}`,
    mathLabel: 'Subbenzile rezultate',
    points: [
      'LL: aproximare (structură globală)',
      'LH/HL: muchii orizontale/verticale',
      'HH: detalii diagonale, textură'
    ],
    color: '#ffd700'
  },
  {
    id: 'mallat-1d-edu',
    section: 'decompose',
    type: 'embed',
    embedType: 'mallat-1d',
    icon: '📊',
    title: 'Demo: Mallat 1D (linie)',
    color: '#ffd700'
  },
  {
    id: 'decomp-demo',
    section: 'decompose',
    type: 'embed',
    embedType: 'mallat-unified',
    icon: '🖼️',
    title: 'Demo: Descompunere Mallat 2D',
    color: '#ffd700'
  },
  {
    id: 'filter-bank',
    section: 'decompose',
    type: 'embed',
    embedType: 'filter-bank',
    icon: '🔀',
    title: 'Banca de Filtre Wavelet',
    color: '#ffd700'
  },
  {
    id: 'pyramid-decomp',
    section: 'decompose',
    type: 'embed',
    embedType: 'pyramid-decomp',
    icon: '🔺',
    title: 'Descompunere Piramidală',
    color: '#ffd700'
  },
  {
    id: 'reconstruction',
    section: 'decompose',
    type: 'embed',
    embedType: 'reconstruction',
    icon: '🔄',
    title: 'Reconstrucție Perfectă',
    color: '#ffd700'
  },

  // ===== WAVELET APPLICATIONS =====
  {
    id: 'applications-title',
    section: 'applications',
    type: 'title',
    icon: '🏥',
    title: 'Aplicații Wavelets',
    subtitle: 'Semnale biomedicale și nu numai',
    color: '#ff6b9d'
  },
  {
    id: 'applications-ecg',
    section: 'applications',
    type: 'theory',
    icon: '❤️',
    title: 'ECG - Electrocardiograme',
    content: 'Wavelets sunt ideale pentru analiza ritmului cardiac.',
    points: [
      '✅ Detectare: complexul QRS, aritmii, fibrilații',
      '✅ Eliminare: zgomot muscular, interferență electrică',
      '🔬 Wavelet Morlet/Daubechies pentru QRS'
    ],
    color: '#ff6b9d'
  },
  {
    id: 'applications-eeg',
    section: 'applications',
    type: 'theory',
    icon: '🧠',
    title: 'EEG - Activitate Cerebrală',
    content: 'Separarea benzilor de frecvență ale creierului.',
    math: String.raw`\delta < \theta < \alpha < \beta < \gamma`,
    mathLabel: 'Benzile EEG (0.5-100 Hz)',
    points: [
      '🔹 Delta (0.5-4Hz): somn profund',
      '🔹 Alpha (8-13Hz): relaxare, ochii închiși',
      '🔹 Beta (13-30Hz): concentrare activă',
      '🧪 Aplicații: epilepsie, BCI, monitoring somn'
    ],
    color: '#ff6b9d'
  },
  {
    id: 'applications-other',
    section: 'applications',
    type: 'theory',
    icon: '🌍',
    title: 'Alte Aplicații',
    content: 'Wavelets sunt omniprezente în procesarea semnalelor.',
    points: [
      '🎵 Audio: compresie, noise reduction, fingerprinting',
      '📸 Imagini: JPEG2000, restaurare, super-rezoluție', 
      '📊 Finanțe: analiza volatilității, detectare trenduri',
      '🌊 Seismologie: detectare cutremure, analiza undelor',
      '🔬 Astronomie: analiza semnalelor cosmice'
    ],
    color: '#ff6b9d'
  },

  // ===== DENOISING =====
  {
    id: 'denoise-title',
    section: 'denoise',
    type: 'title',
    icon: '🔇',
    title: 'Denoising Wavelet',
    subtitle: 'Eliminarea zgomotului inteligent',
    color: '#00d4ff'
  },
  {
    id: 'denoise-theory',
    section: 'denoise',
    type: 'embed',
    embedType: 'denoise-theory',
    icon: '📚',
    title: 'Teorie: Thresholding',
    color: '#00d4ff'
  },
  {
    id: 'denoise-demo',
    section: 'denoise',
    type: 'embed',
    embedType: 'denoise',
    icon: '🔇',
    title: 'Demo: Denoising Practic',
    color: '#00d4ff'
  },

  // ===== COMPARISON =====
  {
    id: 'compare-title',
    section: 'compare',
    type: 'title',
    icon: '⚖️',
    title: 'DCT vs Wavelet',
    subtitle: 'JPEG vs JPEG2000',
    color: '#ffd93d'
  },
  {
    id: 'jpeg-pipeline',
    section: 'compare',
    type: 'embed',
    embedType: 'jpeg-pipeline',
    icon: '📷',
    title: 'Pipeline-ul JPEG (DCT)',
    color: '#ff9f43'
  },
  {
    id: 'dct-vs-wavelet',
    section: 'compare',
    type: 'embed',
    embedType: 'dct-vs-wavelet',
    icon: '⚡',
    title: 'DCT vs Wavelet: Comparație',
    color: '#00d4ff'
  },
  {
    id: 'compare-theory',
    section: 'compare',
    type: 'comparison',
    icon: '⚖️',
    title: 'Comparație Directă',
    dct: [
      'Blocuri 8×8 fixe',
      'Artefacte de bloc vizibile',
      'Decodare tot sau nimic',
      'Mai rapid, mai simplu'
    ],
    wavelet: [
      'Transformare globală',
      'Degradare graduală, uniformă',
      'Scalabilitate: rezoluții multiple',
      'Calitate superioară la compresie mare'
    ],
    color: '#ffd93d'
  },
  {
    id: 'compare-demo',
    section: 'compare',
    type: 'embed',
    embedType: 'compare',
    icon: '⚖️',
    title: 'Demo: Comparație',
    color: '#ffd93d'
  },

  // ===== FINAL =====
  {
    id: 'final',
    section: 'final',
    type: 'final',
    icon: '🙏',
    title: 'Mulțumesc!',
    subtitle: 'Întrebări?',
    color: '#00d4ff'
  }
]

// Get unique sections for progress bar
const SECTIONS = (() => {
  const seen = new Set()
  return SLIDES.filter(s => {
    if (seen.has(s.section)) return false
    seen.add(s.section)
    return true
  }).map(s => ({
    id: s.section,
    icon: s.icon,
    color: s.color,
    startIdx: SLIDES.findIndex(sl => sl.section === s.section),
    count: SLIDES.filter(sl => sl.section === s.section).length
  }))
})()

// =====================================================
// EMBEDDED VIEW RENDERER - Full views like individual pages
// =====================================================

function EmbeddedView({ embedType, api, imageId, sampleImages, onImageChange }) {
  const viewProps = { 
    api, 
    imageId, 
    sampleImages, 
    onImageChange 
  }

  switch (embedType) {
    case 'fourier':
      return <FourierView api={api} compact={true} />
    case 'filters':
      return <FiltersView api={api} compact={true} />
    case 'convolution':
      return <ConvolutionView compact={true} />
    case 'kernels':
      return <KernelsView {...viewProps} compact={true} />
    case 'kernels-edu':
      return <KernelsEducationalView api={api} compact={true} />
    case 'playground':
      return <WaveletPlayground compact={true} />
    case 'wavelet-scan':
      return <WaveletScanDemo compact={true} />
    case 'heisenberg':
      return <HeisenbergBoxesView compact={true} />
    case 'scalogram':
      return <ScalogramView compact={true} />
    case 'complex-wavelet':
      return <ComplexWaveletView compact={true} />
    case 'wavelet-theory':
      return <WaveletEducationView api={api} compact={true} />
    case 'wavelet-basis':
      return <WaveletBasisView api={api} compact={true} />
    case 'mallat-1d':
      return <Mallat1DEduView compact={true} />
    case 'mallat-unified':
      return <MallatUnifiedView compact={true} />
    case 'filter-bank':
      return <FilterBankView compact={true} />
    case 'pyramid-decomp':
      return <PyramidDecompView compact={true} />
    case 'reconstruction':
      return <ReconstructionView compact={true} />
    case 'denoise-theory':
      return <DenoiseTheoryView compact={true} />
    case 'denoise':
      return <DenoiseView {...viewProps} compact={true} />
    case 'compare':
      return <CompareView {...viewProps} compact={true} />
    case 'jpeg-pipeline':
      return <JPEGPipelineView compact={true} />
    case 'dct-vs-wavelet':
      return <DCTvsWaveletView compact={true} />
    default:
      return <div className="demo-placeholder">View: {embedType}</div>
  }
}

// =====================================================
// MAIN TOUR COMPONENT
// =====================================================

export default function GuidedTour({ onClose, onNavigate, selectedImage = 'peppers_512', sampleImages = [] }) {
  // Initialize from URL hash if present
  const getInitialSlide = () => {
    const hash = window.location.hash.slice(1) // Remove '#'
    if (hash) {
      const idx = SLIDES.findIndex(s => s.id === hash)
      if (idx >= 0) return idx
    }
    return 0
  }
  
  const [currentIdx, setCurrentIdx] = useState(getInitialSlide)
  const [localImage, setLocalImage] = useState(selectedImage)
  const containerRef = useRef(null)

  const slide = SLIDES[currentIdx]
  const isFirst = currentIdx === 0
  const isLast = currentIdx === SLIDES.length - 1

  // Find current section index
  const sectionIdx = SECTIONS.findIndex(s => s.id === slide.section)

  // Update URL hash when slide changes
  useEffect(() => {
    window.location.hash = slide.id
  }, [slide.id])

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      const idx = SLIDES.findIndex(s => s.id === hash)
      if (idx >= 0 && idx !== currentIdx) {
        setCurrentIdx(idx)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [currentIdx])

  const handleNext = useCallback(() => {
    if (!isLast) setCurrentIdx(currentIdx + 1)
  }, [currentIdx, isLast])

  const handlePrev = useCallback(() => {
    if (!isFirst) setCurrentIdx(currentIdx - 1)
  }, [currentIdx, isFirst])

  const handleSectionClick = (sectionId) => {
    const idx = SLIDES.findIndex(s => s.section === sectionId)
    if (idx >= 0) setCurrentIdx(idx)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      // Don't capture keys if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return
      }
      
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleNext, handlePrev, onClose])

  // Auto-focus for keyboard
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  return (
    <div className="tour-fullscreen" ref={containerRef} tabIndex={0}>
      {/* Close button */}
      <button className="tour-close-btn" onClick={onClose}>×</button>

      {/* Progress bar - sections (now vertical left sidebar) */}
      <div className="tour-progress">
        {SECTIONS.map((sec, idx) => (
          <button
            key={sec.id}
            className={`tour-section-btn ${idx === sectionIdx ? 'active' : ''} ${idx < sectionIdx ? 'completed' : ''}`}
            onClick={() => handleSectionClick(sec.id)}
            title={sec.id}
            style={{ '--sec-color': sec.color }}
          >
            <span className="sec-icon">{sec.icon}</span>
            {idx === sectionIdx && (
              <div className="sec-dots">
                {Array(sec.count).fill(0).map((_, i) => (
                  <span 
                    key={i} 
                    className={`sec-dot ${currentIdx === sec.startIdx + i ? 'active' : ''}`}
                  />
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Main content area (slide + nav) */}
      <div className="tour-main">
        {/* Main slide content */}
        <div className="tour-slide" style={{ '--slide-color': slide.color }}>
        
        {/* TITLE SLIDE */}
        {slide.type === 'title' && (
          <div className="slide-title">
            <div className="slide-icon">{slide.icon}</div>
            <h1>{slide.title}</h1>
            <h2>{slide.subtitle}</h2>
          </div>
        )}

        {/* TABLE OF CONTENTS SLIDE */}
        {slide.type === 'toc' && (
          <div className="slide-toc">
            <div className="toc-header">
              <span className="toc-icon">{slide.icon}</span>
              <h1>{slide.title}</h1>
              <h2>{slide.subtitle}</h2>
            </div>
            <div className="toc-grid">
              {slide.chapters.map((ch, i) => (
                <div 
                  key={i} 
                  className="toc-item clickable"
                  onClick={() => ch.sectionId && handleSectionClick(ch.sectionId)}
                >
                  <span className="toc-item-icon">{ch.icon}</span>
                  <div className="toc-item-text">
                    <span className="toc-item-title">{ch.title}</span>
                    <span className="toc-item-desc">{ch.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* THEORY SLIDE */}
        {slide.type === 'theory' && (
          <div className="slide-theory">
            <div className="slide-header">
              <span className="slide-icon-sm">{slide.icon}</span>
              <h1>{slide.title}</h1>
            </div>
            {slide.content && <p className="slide-content">{slide.content}</p>}
            {slide.math && (
              <div className="slide-math">
                <div className="math-formula"><LaTeXBlock math={slide.math} /></div>
                <span className="math-label">{slide.mathLabel}</span>
              </div>
            )}
            {slide.points && (
              <ul className="slide-points">
                {slide.points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
          </div>
        )}

        {/* FOURIER THEORY ENHANCED SLIDE - Multiple formulas */}
        {slide.type === 'fourier-theory-enhanced' && (
          <div className="slide-fourier-theory-enhanced">
            <div className="slide-header">
              <span className="slide-icon-sm">{slide.icon}</span>
              <h1>{slide.title}</h1>
            </div>
            {slide.content && <p className="slide-content">{slide.content}</p>}
            
            {/* Main Fourier formulas grid */}
            <div className="fourier-formulas-grid">
              <div className="formula-card">
                <h4>Transformata Fourier</h4>
                <div className="math-formula">
                  <LaTeXBlock math={String.raw`F(\omega) = \int_{-\infty}^{\infty} f(t) \cdot e^{-i\omega t} \, dt`} />
                </div>
                <p className="formula-desc">Descompune semnalul în componente de frecvență</p>
              </div>
              
              <div className="formula-card">
                <h4>Transformata Inversă</h4>
                <div className="math-formula">
                  <LaTeXBlock math={String.raw`f(t) = \frac{1}{2\pi} \int_{-\infty}^{\infty} F(\omega) \cdot e^{i\omega t} \, d\omega`} />
                </div>
                <p className="formula-desc">Reconstituie semnalul din spectrul său</p>
              </div>
              
              <div className="formula-card euler">
                <h4>Formula lui Euler</h4>
                <div className="math-formula">
                  <LaTeXBlock math={String.raw`e^{i\theta} = \cos\theta + i\sin\theta`} />
                </div>
                <p className="formula-desc">Conectează exponențiala complexă cu sinusoide</p>
              </div>
              
              <div className="formula-card parseval">
                <h4>Teorema lui Parseval</h4>
                <div className="math-formula">
                  <LaTeXBlock math={String.raw`\int_{-\infty}^{\infty} |f(t)|^2 dt = \frac{1}{2\pi} \int_{-\infty}^{\infty} |F(\omega)|^2 d\omega`} />
                </div>
                <p className="formula-desc">Energia se conservă între domenii</p>
              </div>
            </div>
            
            {slide.points && (
              <ul className="slide-points compact">
                {slide.points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
          </div>
        )}

        {/* THEORY-VISUAL SLIDE (e.g. 2D convolution with kernel matrices) */}
        {slide.type === 'theory-visual' && (
          <div className="slide-theory-visual">
            <div className="slide-header compact">
              <span className="slide-icon-sm">{slide.icon}</span>
              <h1>{slide.title}</h1>
            </div>
            {slide.content && <p className="slide-content compact">{slide.content}</p>}
            {slide.math && (
              <div className="slide-math compact">
                <div className="math-formula"><LaTeXBlock math={slide.math} /></div>
                {slide.mathLabel && <span className="math-label">{slide.mathLabel}</span>}
              </div>
            )}
            {slide.kernels && (
              <div className="kernel-matrix-grid">
                {slide.kernels.map((k, i) => (
                  <div key={i} className="kernel-card">
                    <h4>{k.name}</h4>
                    <div className="kernel-matrix">
                      <LaTeXBlock math={k.matrix} />
                    </div>
                    <p>{k.desc}</p>
                  </div>
                ))}
              </div>
            )}
            {slide.dwt2d && (
              <div className="dwt2d-section">
                <h3>{slide.dwt2d.title}</h3>
                <p className="dwt2d-desc">{slide.dwt2d.description}</p>
                <div className="dwt2d-coefficients">
                  {slide.dwt2d.coefficients.map((c, i) => (
                    <div key={i} className="dwt2d-coeff">
                      <span className="coeff-name">{c.name}</span>
                      <div className="coeff-formula"><LaTeXBlock math={c.formula} /></div>
                      <span className="coeff-desc">{c.desc}</span>
                    </div>
                  ))}
                </div>
                {slide.dwt2d.subsampling && (
                  <div className="dwt2d-subsampling">
                    <LaTeXBlock math={slide.dwt2d.subsampling} />
                  </div>
                )}
              </div>
            )}
            {slide.waveletConnection && (
              <div className="wavelet-connection-box">
                <h4>🔗 Legătura cu Wavelets</h4>
                <p>{slide.waveletConnection.text}</p>
                <div className="math-formula small">
                  <LaTeXBlock math={slide.waveletConnection.math} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPARISON SLIDE */}
        {slide.type === 'comparison' && (
          <div className="slide-comparison">
            <div className="slide-header">
              <span className="slide-icon-sm">{slide.icon}</span>
              <h1>{slide.title}</h1>
            </div>
            <div className="comparison-grid">
              <div className="comp-col dct">
                <h3>DCT (JPEG)</h3>
                <ul>{slide.dct.map((item, i) => <li key={i}>{item}</li>)}</ul>
              </div>
              <div className="comp-vs">VS</div>
              <div className="comp-col wavelet">
                <h3>Wavelet (JPEG2000)</h3>
                <ul>{slide.wavelet.map((item, i) => <li key={i}>{item}</li>)}</ul>
              </div>
            </div>
          </div>
        )}

        {/* EMBEDDED FULL VIEW SLIDE */}
        {slide.type === 'embed' && (
          <div className="slide-embed">
            <div className="embed-wrapper">
              <EmbeddedView 
                embedType={slide.embedType} 
                api={API_BASE} 
                imageId={localImage}
                sampleImages={sampleImages}
                onImageChange={setLocalImage}
              />
            </div>
          </div>
        )}

        {/* FILTERS THEORY SLIDE - Mathematical formulas */}
        {slide.type === 'filters-theory-detailed' && (
          <div className="slide-filters-theory">
            <div className="slide-header">
              <span className="slide-icon-sm">{slide.icon}</span>
              <h1>{slide.title}</h1>
            </div>
            <p className="slide-content">
              Filtrele digitale separă componentele de frecvență din semnal.
              <strong> Low-pass</strong> păstrează frecvențele joase, <strong>High-pass</strong> păstrează frecvențele înalte,
              <strong> Band-pass</strong> păstrează doar un interval de frecvențe.
            </p>
            <div className="filters-formulas-grid">
              <div className="formula-card">
                <h3>🎯 Filtrul Ideal</h3>
                <div className="math-formula">
                  <LaTeXBlock math={String.raw`H_{LP}(f) = \begin{cases} 1 & |f| \leq f_c \\ 0 & |f| > f_c \end{cases}`} />
                </div>
                <p className="formula-desc">Tăietură bruscă la f<sub>c</sub>. Teoretic perfect, dar imposibil de realizat.</p>
              </div>
              <div className="formula-card butterworth">
                <h3>🔔 Filtrul Butterworth</h3>
                <div className="math-formula">
                  <LaTeXBlock math={String.raw`|H(f)|^2 = \frac{1}{1 + \left(\frac{f}{f_c}\right)^{2n}}`} />
                </div>
                <p className="formula-desc">
                  Ordinul <strong>n</strong> controlează abruptitatea: n=1 lent, n=8 aproape ideal.
                </p>
              </div>
              <div className="formula-card">
                <h3>📊 Filtrul Gaussian</h3>
                <div className="math-formula">
                  <LaTeXBlock math={String.raw`H(f) = e^{-\frac{f^2}{2\sigma^2}}`} />
                </div>
                <p className="formula-desc">Tranziție netedă, fără oscilații. σ ≈ lățimea benzii.</p>
              </div>
            </div>
          </div>
        )}

        {/* FOURIER INTERACTIVE SLIDE - Demo with plots */}
        {slide.type === 'fourier-interactive' && (
          <div className="slide-fourier-interactive">
            <div className="slide-header compact">
              <span className="slide-icon-sm">{slide.icon}</span>
              <h1>{slide.title}</h1>
            </div>
            <div className="fourier-demo-wrapper">
              <FourierView api={API_BASE} compact={true} />
            </div>
          </div>
        )}

        {/* FILTERS INTERACTIVE SLIDE - Demo with plots */}
        {slide.type === 'filters-interactive' && (
          <div className="slide-filters-interactive">
            <div className="slide-header compact">
              <span className="slide-icon-sm">{slide.icon}</span>
              <h1>{slide.title}</h1>
            </div>
            <div className="filters-demo-wrapper">
              <FiltersView api={API_BASE} compact={true} />
            </div>
          </div>
        )}

        {/* FILTERS-WAVELET CONNECTION SLIDE */}
        {slide.type === 'filters-wavelet-connection' && (
          <div className="slide-theory wavelet-connection">
            <div className="slide-header">
              <span className="slide-icon-sm">🔗</span>
              <h1>{slide.title}</h1>
            </div>
            <p className="slide-content">
              <strong>Filter banks</strong> sunt fundamentul transformatei wavelet discrete! 
              Fiecare nivel de descompunere folosește o pereche de filtre complementare.
            </p>
            <div className="slide-math">
              <div className="math-formula">
                <LaTeXBlock math={String.raw`\text{Low-pass (h)} \rightarrow \text{Aproximare (LL)} \quad \text{High-pass (g)} \rightarrow \text{Detalii (LH, HL, HH)}`} />
              </div>
              <span className="math-label">Descompunerea wavelet = filtrare + subsampling</span>
            </div>
            <ul className="slide-points">
              <li><strong>Filtru low-pass (h)</strong> → Coeficienți de aproximație - ce rămâne la frecvențe joase</li>
              <li><strong>Filtru high-pass (g)</strong> → Coeficienți de detaliu - muchii, texturi, zgomot</li>
              <li><strong>Aplicare recursivă</strong> → Multi-resolution analysis (MRA) pe mai multe nivele</li>
              <li><strong>Reconstrucție perfectă</strong> → Filtrele (h, g) formează o bancă de filtre QMF</li>
            </ul>
            <div className="slide-math">
              <div className="math-formula small">
                <LaTeXBlock math={String.raw`a[n] = \sum_k h[k] \cdot x[2n - k] \quad d[n] = \sum_k g[k] \cdot x[2n - k]`} />
              </div>
            </div>
          </div>
        )}

        {/* FINAL SLIDE */}
        {slide.type === 'final' && (
          <div className="slide-final">
            <div className="slide-icon large">{slide.icon}</div>
            <h1>{slide.title}</h1>
            <h2>{slide.subtitle}</h2>
            <button className="btn-explore" onClick={onClose}>
              ← Înapoi la pagina principală
            </button>
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="tour-nav">
        <button 
          className="nav-btn prev" 
          onClick={handlePrev}
          disabled={isFirst}
        >
          ← Anterior
        </button>
        
        <div className="nav-center">
          <span className="slide-counter">{currentIdx + 1} / {SLIDES.length}</span>
        </div>
        
        <button 
          className="nav-btn next" 
          onClick={handleNext}
          disabled={isLast}
        >
          {isLast ? '✓ Final' : 'Următor →'}
        </button>
      </div>
      </div>
    </div>
  )
}
