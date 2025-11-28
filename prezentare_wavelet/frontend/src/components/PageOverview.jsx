import { LaTeXBlock } from './LaTeX'

const PAGE_INFO = [
  {
    id: 'intro',
    icon: '🎯',
    title: 'Introducere',
    description: 'Prezentare generală a transformatei wavelet și obiectivele cursului',
    preview: 'De la Fourier la Wavelet: o călătorie prin analiza timp-frecvență'
  },
  {
    id: 'fourier',
    icon: '📊',
    title: 'Transformata Fourier',
    description: 'Descompunerea semnalelor în componente de frecvență',
    math: String.raw`F(\omega) = \int f(t) e^{-i\omega t} dt`,
    preview: 'Fundamentele analizei spectrale'
  },
  {
    id: 'filters',
    icon: '🔧',
    title: 'Filtre Digitale',
    description: 'Low-pass și High-pass: separarea frecvențelor',
    preview: 'Cum filtrăm semnalele pentru a extrage informații specifice'
  },
  {
    id: 'convolution',
    icon: '🔄',
    title: 'Convoluție',
    description: 'Operația fundamentală în procesarea semnalelor',
    math: String.raw`(f * g)[n] = \sum_k f[k] \cdot g[n-k]`,
    preview: 'Baza matematică pentru toate filtrele'
  },
  {
    id: 'playground',
    icon: '🎮',
    title: 'Wavelet Playground',
    description: 'Experimentează interactiv cu transformări wavelet',
    math: String.raw`\psi_{a,b}(t) = \frac{1}{\sqrt{a}} \psi\left(\frac{t-b}{a}\right)`,
    preview: 'Învață prin experimentare directă'
  },
  {
    id: 'wavelet-theory',
    icon: '🎓',
    title: 'Teorie Wavelets',
    description: 'Familia de wavelets și proprietățile lor matematice',
    preview: 'Haar, Morlet, Daubechies, Mexican Hat și altele'
  },
  {
    id: 'wavelet-basis',
    icon: '🌊',
    title: 'Baze Wavelet',
    description: 'Funcțiile de scalare și wavelet fundamentale',
    preview: 'Cum se construiesc bazele pentru transformata wavelet'
  },
  {
    id: 'decompose',
    icon: '🔬',
    title: 'Descompunere 2D',
    description: 'Algoritmul Mallat pentru imagini',
    preview: 'LL, LH, HL, HH - subbenzile multi-rezoluție'
  },
  {
    id: 'denoise',
    icon: '🔇',
    title: 'Denoising',
    description: 'Eliminarea zgomotului prin thresholding wavelet',
    math: String.raw`\eta(x,\lambda) = \text{sign}(x) \cdot \max(|x|-\lambda, 0)`,
    preview: 'Soft vs Hard thresholding'
  },
  {
    id: 'compare',
    icon: '⚖️',
    title: 'DCT vs Wavelet',
    description: 'JPEG vs JPEG2000 - comparație practică',
    preview: 'Blocking artifacts vs degradare smoothă'
  }
]

export default function PageOverview({ onNavigate, onClose }) {
  return (
    <div className="page-overview-overlay">
      <div className="page-overview-container">
        <div className="page-overview-header">
          <h2>📚 Cuprins Prezentare</h2>
          <p>Selectează o secțiune pentru a naviga direct</p>
          <button className="overview-close" onClick={onClose}>×</button>
        </div>
        
        <div className="page-overview-grid">
          {PAGE_INFO.map((page, index) => (
            <div 
              key={page.id}
              className="page-card"
              onClick={() => {
                onNavigate(page.id)
                onClose()
              }}
            >
              <div className="page-card-number">{index + 1}</div>
              <div className="page-card-icon">{page.icon}</div>
              <h3>{page.title}</h3>
              <p className="page-card-description">{page.description}</p>
              {page.math && (
                <div className="page-card-math">
                  <LaTeXBlock math={page.math} />
                </div>
              )}
              <p className="page-card-preview">{page.preview}</p>
            </div>
          ))}
        </div>
        
        <div className="page-overview-footer">
          <button className="overview-start-btn" onClick={() => {
            onNavigate('intro')
            onClose()
          }}>
            🚀 Începe de la început
          </button>
        </div>
      </div>
    </div>
  )
}
