import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import LaTeX, { LaTeXBlock } from './LaTeX'

// Wavelet definitions with math and properties
const WAVELET_INFO = {
  haar: {
    name: 'Haar',
    fullName: 'Alfred Haar (1909)',
    category: 'Orthogonal',
    icon: '📐',
    color: '#00d9ff',
    description: 'Cel mai simplu wavelet - o funcție pas. Primul wavelet descoperit, fundația teoriei moderne.',
    math: {
      psi: String.raw`\psi(t) = \begin{cases} 1 & 0 \le t < \frac{1}{2} \\ -1 & \frac{1}{2} \le t < 1 \\ 0 & \text{altfel} \end{cases}`,
      phi: String.raw`\phi(t) = \begin{cases} 1 & 0 \le t < 1 \\ 0 & \text{altfel} \end{cases}`,
    },
    properties: [
      'Suport compact: [0, 1]',
      'Discontinuu (sare între valori)',
      'Ortogonal și ortonormal',
      'Simetric față de t = 0.5',
      'Un singur moment de anulare',
      'Filtru cu 2 coeficienți: [1, 1]/√2'
    ],
    applications: [
      'Detectarea rapidă a muchiilor',
      'Compresie simplă în timp real',
      'Analiza semnalelor cu tranziții bruște',
      'Fundament pedagogic pentru wavelets'
    ],
    advantages: ['Extrem de rapid (O(n))', 'Implementare trivială', 'Bun pentru semnale discontinue'],
    disadvantages: ['Discontinuu → artefacte', 'Localizare frecvențială slabă', 'Nu e neted']
  },
  
  morlet: {
    name: 'Morlet',
    fullName: 'Jean Morlet (1982)',
    category: 'Continuous',
    icon: '🌊',
    color: '#ff6b9d',
    description: 'Sinusoidă modulată de un Gaussian. Excelent pentru analiza timp-frecvență.',
    math: {
      psi: String.raw`\psi(t) = \pi^{-1/4} \cdot e^{i\omega_0 t} \cdot e^{-t^2/2}`,
      note: 'ω₀ ≈ 5-6 pentru a satisface condiția de admisibilitate'
    },
    properties: [
      'Wavelet complex (parte reală + imaginară)',
      'Suport infinit (decadere Gaussiană)',
      'Nu e ortogonal',
      'Foarte bună localizare timp-frecvență',
      'Parametru ω₀ controlează oscilațiile',
      'Satisface principiul incertitudinii Heisenberg'
    ],
    applications: [
      'Analiza semnalelor seismice',
      'Procesarea semnalelor EEG/ECG',
      'Detectarea caracteristicilor în serii temporale',
      'Analiza muzicală și vocală'
    ],
    advantages: ['Localizare optimală timp-frecvență', 'Interpretare fizică clară', 'Standard în geofizică'],
    disadvantages: ['Suport infinit → trunchiere', 'Nu permite reconstrucție exactă', 'Doar CWT, nu DWT']
  },

  gaussian: {
    name: 'Gaussian',
    fullName: 'Derivate ale funcției Gauss',
    category: 'Continuous',
    icon: '📊',
    color: '#00ff88',
    description: 'Familie de wavelets obținute din derivatele succesive ale funcției Gaussiene.',
    math: {
      psi_n: String.raw`\psi_n(t) = C_n \cdot \frac{d^n}{dt^n}\left[e^{-t^2/2}\right]`,
      examples: String.raw`\psi_1(t) = -t \cdot e^{-t^2/2}, \quad \psi_2(t) = (t^2-1) \cdot e^{-t^2/2}`
    },
    properties: [
      'Ordinul n determină forma',
      'n=1: prima derivată (DOG)',
      'n=2: Mexican Hat (vezi separat)',
      'Netezime infinită (C∞)',
      'Simetrie: par pentru n par, impar pentru n impar',
      'Momente de anulare cresc cu n'
    ],
    applications: [
      'Detectarea muchiilor la diferite scale',
      'Analiza multi-scală a imaginilor',
      'Filtrare derivativă netedă',
      'Computer vision și recunoaștere pattern'
    ],
    advantages: ['Familie matematică elegantă', 'Netezime maximă', 'Control precis al derivatelor'],
    disadvantages: ['Suport infinit', 'Nu ortogonal', 'Costisitor computațional']
  },

  mexican_hat: {
    name: 'Mexican Hat',
    fullName: 'Ricker Wavelet / Marr Wavelet',
    category: 'Continuous',
    icon: '🎩',
    color: '#ffaa00',
    description: 'A doua derivată a Gaussienei. Formă de pălărie mexicană - negativ în centru, pozitiv pe margini.',
    math: {
      psi: String.raw`\psi(t) = \frac{2}{\sqrt{3}} \pi^{-1/4} (1 - t^2) e^{-t^2/2}`,
      normalized: String.raw`\psi(t) = (1 - t^2) e^{-t^2/2} \text{ (nenormalizat)}`
    },
    properties: [
      'Derivata a 2-a a Gaussienei',
      'Simetric (funcție pară)',
      'Un lob central negativ, două laterale pozitive',
      'Integrala = 0 (condiție wavelet)',
      'Integrala lui t·ψ(t) = 0 (moment de anulare)',
      'Laplacian of Gaussian (LoG) în 2D'
    ],
    applications: [
      'Detectare blob/muchii în imagini',
      'Scale-space în computer vision',
      'Analiza seismică (wavelet Ricker)',
      'Detectarea caracteristicilor la scale multiple'
    ],
    advantages: ['Interpretare intuitivă', 'Excelent pentru detectare caracteristici', 'Simetric'],
    disadvantages: ['Suport infinit', 'Nu ortogonal', 'Bandă limitată de frecvențe']
  },

  shannon: {
    name: 'Shannon',
    fullName: 'Sinc Wavelet',
    category: 'Continuous',
    icon: '📡',
    color: '#9d4edd',
    description: 'Wavelet ideal în frecvență - brick-wall în domeniul frecvență, sinc în timp.',
    math: {
      psi: String.raw`\psi(t) = \text{sinc}\left(\frac{t}{2}\right) \cos\left(\frac{3\pi t}{2}\right) = \frac{\sin(\pi t) - \sin(\pi t/2)}{\pi t}`,
      frequency: String.raw`\Psi(\omega) = \text{rect}\left(\frac{\omega - 3\pi/2}{\pi}\right)`
    },
    properties: [
      'Localizare perfectă în frecvență',
      'Suport infinit în timp (decadere lentă)',
      'Bandă de frecvențe ideală [π, 2π]',
      'Ortogonal în sens continuu',
      'Conectat cu teorema eșantionării',
      'Funcție sinc modulată'
    ],
    applications: [
      'Analiză teoretică',
      'Separare ideală a benzilor de frecvență',
      'Studiul limitelor fundamentale',
      'Referință pentru comparație'
    ],
    advantages: ['Separare perfectă în frecvență', 'Fundament teoretic solid', 'Ortogonal'],
    disadvantages: ['Decadere lentă în timp (problematic)', 'Nu realizabil fizic perfect', 'Artefacte Gibbs']
  },

  meyer: {
    name: 'Meyer',
    fullName: 'Yves Meyer (1985)',
    category: 'Orthogonal',
    icon: '🏆',
    color: '#06d6a0',
    description: 'Wavelet ortogonal cu decadere rapidă. Compromis elegant între timp și frecvență.',
    math: {
      psi: String.raw`\Psi(\omega) \text{ definit prin funcție auxiliară } \nu(x)`,
      construction: String.raw`\nu(x) \text{ neted}, \quad \nu(x)^2 + \nu(1-x)^2 = 1`
    },
    properties: [
      'Infinit derivabil (C∞)',
      'Ortogonal și complet',
      'Decadere rapidă O(1/|t|^N) pentru orice N',
      'Suport compact în frecvență',
      'Construcție în domeniul frecvență',
      'Aproximabil numeric (FIR Meyer)'
    ],
    applications: [
      'Analiză de înaltă calitate',
      'Când trebuie ortogonalitate + netezime',
      'Referință teoretică',
      'Aplicații științifice precise'
    ],
    advantages: ['Ortogonal și foarte neted', 'Decadere rapidă', 'Proprietăți matematice excelente'],
    disadvantages: ['Suport infinit în timp', 'Complex de implementat exact', 'Aproximările FIR sunt lungi']
  }
}

// Wavelet computation functions (client-side for responsiveness)
const computeWavelet = (type, t, params = {}) => {
  const { omega0 = 5, order = 2 } = params
  
  switch(type) {
    case 'haar':
      return t.map(ti => {
        if (ti >= 0 && ti < 0.5) return 1
        if (ti >= 0.5 && ti < 1) return -1
        return 0
      })
    
    case 'morlet':
      return t.map(ti => {
        const gaussian = Math.exp(-ti * ti / 2)
        return gaussian * Math.cos(omega0 * ti)  // Real part only
      })
    
    case 'gaussian':
      // First derivative of Gaussian (DOG)
      return t.map(ti => -ti * Math.exp(-ti * ti / 2))
    
    case 'mexican_hat':
      // Second derivative of Gaussian
      return t.map(ti => {
        const norm = 2 / (Math.sqrt(3) * Math.pow(Math.PI, 0.25))
        return norm * (1 - ti * ti) * Math.exp(-ti * ti / 2)
      })
    
    case 'shannon':
      return t.map(ti => {
        if (Math.abs(ti) < 0.0001) return 1
        const sinc1 = Math.sin(Math.PI * ti) / (Math.PI * ti)
        const sinc2 = Math.sin(Math.PI * ti / 2) / (Math.PI * ti / 2)
        return 2 * (sinc1 - sinc2 * 0.5) * Math.cos(1.5 * Math.PI * ti)
      })
    
    case 'meyer':
      // Simplified Meyer approximation
      return t.map(ti => {
        const x = Math.abs(ti)
        if (x > 4) return 0
        const env = Math.exp(-x * x / 4)
        return env * Math.sin(2 * Math.PI * ti * 0.5) * (1 - x / 4)
      })
    
    default:
      return t.map(() => 0)
  }
}

// Compute scaling function for applicable wavelets
const computeScaling = (type, t) => {
  switch(type) {
    case 'haar':
      return t.map(ti => (ti >= 0 && ti < 1) ? 1 : 0)
    default:
      return null // Many continuous wavelets don't have scaling functions
  }
}

// Generate frequency response
const computeFrequencyResponse = (psi, sampleRate = 512) => {
  // Simple DFT magnitude
  const N = psi.length
  const magnitude = []
  const freq = []
  
  for (let k = 0; k < N / 2; k++) {
    let re = 0, im = 0
    for (let n = 0; n < N; n++) {
      const angle = 2 * Math.PI * k * n / N
      re += psi[n] * Math.cos(angle)
      im -= psi[n] * Math.sin(angle)
    }
    magnitude.push(Math.sqrt(re * re + im * im) / N)
    freq.push(k * sampleRate / N)
  }
  
  return { freq, magnitude }
}

export default function WaveletEducationView({ api }) {
  const [selectedWavelet, setSelectedWavelet] = useState('haar')
  const [scale, setScale] = useState(1)
  const [translation, setTranslation] = useState(0)
  const [morletOmega, setMorletOmega] = useState(5)
  const [animating, setAnimating] = useState(false)
  
  const canvasMainRef = useRef()
  const canvasScaledRef = useRef()
  const canvasFreqRef = useRef()
  const animationRef = useRef()

  const info = WAVELET_INFO[selectedWavelet]

  // Generate time array
  const generateTimeArray = useCallback((samples = 512, range = 8) => {
    const t = []
    for (let i = 0; i < samples; i++) {
      t.push(-range / 2 + (i / samples) * range)
    }
    return t
  }, [])

  // Draw main wavelet
  const drawMainWavelet = useCallback(() => {
    const canvas = canvasMainRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    const width = canvas.width
    const height = canvas.height
    const margin = 50
    
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, width, height)
    
    // Generate wavelet
    const t = generateTimeArray(512, 8)
    const psi = computeWavelet(selectedWavelet, t, { omega0: morletOmega })
    const phi = computeScaling(selectedWavelet, t)
    
    // Grid
    ctx.strokeStyle = '#1a1a3a'
    ctx.lineWidth = 1
    
    // Horizontal center line
    const centerY = height / 2
    ctx.beginPath()
    ctx.moveTo(margin, centerY)
    ctx.lineTo(width - margin, centerY)
    ctx.stroke()
    
    // Vertical center line (axis of symmetry at t=0)
    const centerX = width / 2
    ctx.strokeStyle = '#3a3a5a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(centerX, margin)
    ctx.lineTo(centerX, height - margin)
    ctx.stroke()
    
    // Symmetry axis highlight
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 1
    ctx.setLineDash([8, 4])
    ctx.beginPath()
    ctx.moveTo(centerX, margin + 35)
    ctx.lineTo(centerX, height - margin - 10)
    ctx.stroke()
    ctx.setLineDash([])
    
    // Symmetry axis label
    ctx.fillStyle = '#00ff88'
    ctx.font = '10px sans-serif'
    ctx.fillText('t=0', centerX + 3, margin + 45)
    
    // Draw scaling function if exists
    if (phi) {
      const maxPhi = Math.max(...phi.map(Math.abs), 0.1)
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      
      for (let i = 0; i < t.length; i++) {
        const x = margin + ((t[i] + 4) / 8) * (width - 2 * margin)
        const y = centerY - (phi[i] / maxPhi) * (height / 2 - margin) * 0.8
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }
    
    // Draw wavelet
    const maxPsi = Math.max(...psi.map(Math.abs), 0.1)
    ctx.strokeStyle = info.color
    ctx.lineWidth = 3
    ctx.beginPath()
    
    for (let i = 0; i < t.length; i++) {
      const x = margin + ((t[i] + 4) / 8) * (width - 2 * margin)
      const y = centerY - (psi[i] / maxPsi) * (height / 2 - margin) * 0.8
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    
    // Axis labels
    ctx.fillStyle = '#8888aa'
    ctx.font = '12px sans-serif'
    ctx.fillText('t', width - margin + 5, centerY + 5)
    ctx.fillText('ψ(t)', margin - 30, margin)
    ctx.fillText('0', centerX - 10, centerY + 20)
    ctx.fillText('-4', margin, centerY + 20)
    ctx.fillText('4', width - margin - 10, centerY + 20)
    
  }, [selectedWavelet, morletOmega, info, generateTimeArray])

  // Draw scaled/translated wavelet
  const drawScaledWavelet = useCallback(() => {
    const canvas = canvasScaledRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    const width = canvas.width
    const height = canvas.height
    const margin = 50
    
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, width, height)
    
    // Generate original and scaled wavelets
    const t = generateTimeArray(512, 16)
    const psiOriginal = computeWavelet(selectedWavelet, t, { omega0: morletOmega })
    
    // Scaled and translated: psi((t - b) / a) / sqrt(a)
    const psiScaled = t.map(ti => {
      const tScaled = (ti - translation) / scale
      const idx = Math.floor((tScaled + 8) / 16 * 512)
      if (idx < 0 || idx >= 512) return 0
      return psiOriginal[idx] / Math.sqrt(scale)
    })
    
    const centerY = height / 2
    const centerX = margin + ((0 + 8) / 16) * (width - 2 * margin) // t=0 position
    
    // Grid - horizontal axis
    ctx.strokeStyle = '#3a3a5a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(margin, centerY)
    ctx.lineTo(width - margin, centerY)
    ctx.stroke()
    
    // Vertical axis at t=0 (symmetry axis of original)
    ctx.strokeStyle = '#3a3a5a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(centerX, margin)
    ctx.lineTo(centerX, height - margin)
    ctx.stroke()
    
    // Highlight symmetry axis
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 1
    ctx.setLineDash([8, 4])
    ctx.beginPath()
    ctx.moveTo(centerX, margin + 30)
    ctx.lineTo(centerX, height - margin - 10)
    ctx.stroke()
    ctx.setLineDash([])
    
    // Label for symmetry axis
    ctx.fillStyle = '#00ff88'
    ctx.font = '10px sans-serif'
    ctx.fillText('t=0', centerX + 3, margin + 40)
    
    // Draw original (faded)
    const maxOrig = Math.max(...psiOriginal.map(Math.abs), 0.1)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    for (let i = 0; i < t.length; i++) {
      const x = margin + ((t[i] + 8) / 16) * (width - 2 * margin)
      const y = centerY - (psiOriginal[i] / maxOrig) * (height / 2 - margin) * 0.7
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])
    
    // Draw scaled
    const maxScaled = Math.max(...psiScaled.map(Math.abs), 0.1)
    ctx.strokeStyle = info.color
    ctx.lineWidth = 3
    ctx.beginPath()
    for (let i = 0; i < t.length; i++) {
      const x = margin + ((t[i] + 8) / 16) * (width - 2 * margin)
      const y = centerY - (psiScaled[i] / maxScaled) * (height / 2 - margin) * 0.7
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    
    // Translation marker (b)
    const bX = margin + ((translation + 8) / 16) * (width - 2 * margin)
    ctx.strokeStyle = '#ffaa00'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(bX, margin)
    ctx.lineTo(bX, height - margin)
    ctx.stroke()
    ctx.setLineDash([])
    
    // b label with clear styling
    ctx.fillStyle = '#ffaa00'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText(`b = ${translation.toFixed(1)}`, bX + 5, margin + 15)
    
    // Axis labels
    ctx.fillStyle = '#8888aa'
    ctx.font = '12px sans-serif'
    ctx.fillText('t', width - margin + 5, centerY + 5)
    ctx.fillText('ψ(t)', margin - 30, margin)
    
  }, [selectedWavelet, scale, translation, morletOmega, info, generateTimeArray])

  // Draw frequency response
  const drawFrequencyResponse = useCallback(() => {
    const canvas = canvasFreqRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    const width = canvas.width
    const height = canvas.height
    const margin = 50
    
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, width, height)
    
    const t = generateTimeArray(512, 8)
    const psi = computeWavelet(selectedWavelet, t, { omega0: morletOmega })
    const { freq, magnitude } = computeFrequencyResponse(psi, 64)
    
    // Normalize
    const maxMag = Math.max(...magnitude)
    
    // Grid
    ctx.strokeStyle = '#1a1a3a'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = margin + (i * (height - 2 * margin)) / 4
      ctx.beginPath()
      ctx.moveTo(margin, y)
      ctx.lineTo(width - margin, y)
      ctx.stroke()
    }
    
    // Draw magnitude
    ctx.strokeStyle = '#9d4edd'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    const maxFreqShow = 20
    for (let i = 0; i < freq.length && freq[i] <= maxFreqShow; i++) {
      const x = margin + (freq[i] / maxFreqShow) * (width - 2 * margin)
      const y = height - margin - (magnitude[i] / maxMag) * (height - 2 * margin) * 0.9
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    
    // Fill under curve
    ctx.fillStyle = 'rgba(157, 78, 221, 0.2)'
    ctx.lineTo(width - margin, height - margin)
    ctx.lineTo(margin, height - margin)
    ctx.fill()
    
    // Labels
    ctx.fillStyle = '#9d4edd'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('|Ψ(ω)| - Răspuns în frecvență', margin, 25)
    
    ctx.fillStyle = '#8888aa'
    ctx.font = '12px sans-serif'
    ctx.fillText('Frecvență (Hz)', width / 2 - 40, height - 10)
    
  }, [selectedWavelet, morletOmega, generateTimeArray])

  // Animation for scale/translation
  const startAnimation = () => {
    if (animating) {
      cancelAnimationFrame(animationRef.current)
      setAnimating(false)
      return
    }
    
    setAnimating(true)
    let phase = 0
    
    const animate = () => {
      phase += 0.02
      setScale(1 + Math.sin(phase) * 0.5 + 0.5) // Scale: 0.5 to 2
      setTranslation(Math.sin(phase * 0.7) * 3) // Translation: -3 to 3
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Redraw when parameters change
  useEffect(() => {
    drawMainWavelet()
    drawScaledWavelet()
    drawFrequencyResponse()
  }, [drawMainWavelet, drawScaledWavelet, drawFrequencyResponse])

  return (
    <div className="wavelet-education-view">
      {/* Wavelet Selector */}
      <div className="panel">
        <h2>🎓 Wavelets Fundamentale</h2>
        <p className="subtitle">Selectează un wavelet pentru a explora proprietățile și matematica</p>
        
        <div className="wavelet-selector">
          {Object.entries(WAVELET_INFO).map(([key, w]) => (
            <button
              key={key}
              className={`wavelet-card ${selectedWavelet === key ? 'active' : ''}`}
              onClick={() => setSelectedWavelet(key)}
              style={{ '--card-color': w.color }}
            >
              <span className="wavelet-icon">{w.icon}</span>
              <span className="wavelet-name">{w.name}</span>
              <span className="wavelet-category">{w.category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Wavelet Display */}
      <div className="panel" style={{ borderLeftColor: info.color }}>
        <div className="wavelet-header">
          <div className="wavelet-title">
            <span className="wavelet-icon-large">{info.icon}</span>
            <div>
              <h2 style={{ color: info.color }}>{info.name} Wavelet</h2>
              <p className="wavelet-origin">{info.fullName}</p>
            </div>
          </div>
          <span className="wavelet-badge" style={{ background: info.color }}>{info.category}</span>
        </div>
        
        <p className="wavelet-description">{info.description}</p>
        
        {/* LaTeX formula for wavelet function */}
        {info.math?.psi && (
          <div className="formula-display" style={{ textAlign: 'center', margin: '1rem 0', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
            <LaTeXBlock math={info.math.psi} />
          </div>
        )}
        
        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: info.color }}>━━ ψ(t) Wavelet</span>
          <span style={{ color: '#00ff88' }}>╌╌ φ(t) Scaling</span>
          <span style={{ color: '#00ff88' }}>┊ t=0 (ax de simetrie)</span>
        </div>
        
        <div className="plot-container">
          <canvas ref={canvasMainRef} width={800} height={300} />
        </div>
        
        {selectedWavelet === 'morlet' && (
          <div className="control-group inline">
            <label>Parametru ω₀: {morletOmega}</label>
            <input
              type="range"
              min="3"
              max="10"
              step="0.5"
              value={morletOmega}
              onChange={e => setMorletOmega(parseFloat(e.target.value))}
            />
          </div>
        )}
      </div>

      {/* Mathematical Definition */}
      <div className="panel math-panel">
        <h3>📐 Definiție Matematică</h3>
        
        <div className="math-definitions">
          {info.math.psi && (
            <div className="math-block primary">
              <span className="math-label">Wavelet:</span>
              <LaTeXBlock math={info.math.psi} />
            </div>
          )}
          
          {info.math.phi && (
            <div className="math-block secondary">
              <span className="math-label">Scalare:</span>
              <LaTeXBlock math={info.math.phi} />
            </div>
          )}
          
          {info.math.psi_n && (
            <div className="math-block primary">
              <span className="math-label">Wavelet (ordin n):</span>
              <LaTeXBlock math={info.math.psi_n} />
            </div>
          )}
          
          {info.math.examples && (
            <div className="math-block secondary">
              <span className="math-label">Exemple:</span>
              <LaTeXBlock math={info.math.examples} />
            </div>
          )}
          
          {info.math.normalized && (
            <div className="math-block secondary">
              <span className="math-label">Formă alternativă:</span>
              <LaTeXBlock math={info.math.normalized} />
            </div>
          )}
          
          {info.math.construction && (
            <div className="math-block secondary">
              <span className="math-label">Construcție:</span>
              <LaTeXBlock math={info.math.construction} />
            </div>
          )}
          
          {info.math.note && (
            <p className="math-note">{info.math.note}</p>
          )}
          
          {info.math.frequency && (
            <div className="math-block tertiary">
              <span className="math-label">Frecvență:</span>
              <LaTeXBlock math={info.math.frequency} />
            </div>
          )}
        </div>
        
        <div className="transform-formula">
          <h4>Transformata Wavelet Continuă (CWT):</h4>
          <div className="math-block highlight">
            <LaTeXBlock math={String.raw`W(a,b) = \int_{-\infty}^{\infty} f(t) \cdot \frac{1}{\sqrt{a}} \cdot \psi^*\left(\frac{t-b}{a}\right) dt`} />
          </div>
          <p className="formula-explanation">
            unde <LaTeX math="a" /> = scalare (dilatare), <LaTeX math="b" /> = translație (poziție în timp)
          </p>
        </div>
      </div>

      {/* Scaling and Translation Demo */}
      <div className="panel">
        <h3>🎛️ Scalare și Translație Interactivă</h3>
        
        <div className="controls-row">
          <div className="control-group">
            <label>Scalare (a): {scale.toFixed(2)}</label>
            <input
              type="range"
              min="0.2"
              max="3"
              step="0.1"
              value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
            />
            <div className="range-labels">
              <span>Comprimat</span>
              <span>Expandat</span>
            </div>
          </div>
          
          <div className="control-group">
            <label>Translație (b): {translation.toFixed(2)}</label>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={translation}
              onChange={e => setTranslation(parseFloat(e.target.value))}
            />
            <div className="range-labels">
              <span>Stânga</span>
              <span>Dreapta</span>
            </div>
          </div>
          
          <button 
            className={`animate-btn ${animating ? 'active' : ''}`}
            onClick={startAnimation}
          >
            {animating ? '⏹️ Stop' : '▶️ Animație'}
          </button>
        </div>
        
        {/* LaTeX formula display */}
        <div className="formula-display" style={{ textAlign: 'center', marginBottom: '1rem', padding: '0.5rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
          <LaTeX math={`\\psi_{${scale.toFixed(1)},${translation.toFixed(1)}}(t) = \\frac{1}{\\sqrt{${scale.toFixed(1)}}} \\cdot \\psi\\left(\\frac{t - ${translation.toFixed(1)}}{${scale.toFixed(1)}}\\right)`} />
        </div>
        
        {/* Parameter badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(0, 217, 255, 0.15)', border: '1px solid rgba(0, 217, 255, 0.4)', color: '#00d9ff' }}>
            <LaTeX math={`a = ${scale.toFixed(2)}`} />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(scalare)</small>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(255, 170, 0, 0.15)', border: '1px solid rgba(255, 170, 0, 0.4)', color: '#ffaa00' }}>
            <LaTeX math={`b = ${translation.toFixed(2)}`} />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(translație)</small>
          </span>
        </div>
        
        <div className="plot-container">
          <canvas ref={canvasScaledRef} width={800} height={250} />
        </div>
        
        <div className="insight-box">
          <strong>💡 Insight:</strong> 
          Scalarea mică (a &lt; 1) comprimă wavelet-ul → detectează frecvențe înalte (detalii fine).
          Scalarea mare (a &gt; 1) expandează wavelet-ul → detectează frecvențe joase (tendințe globale).
        </div>
      </div>

      {/* Frequency Response */}
      <div className="panel">
        <h3>📊 Răspuns în Frecvență</h3>
        
        <div className="plot-container">
          <canvas ref={canvasFreqRef} width={800} height={200} />
        </div>
        
        <p className="freq-explanation">
          Spectrul arată ce frecvențe "vede" wavelet-ul. Un spectru larg = wavelet localizat în timp.
          Un spectru îngust = wavelet localizat în frecvență.
        </p>
      </div>

      {/* Properties Grid */}
      <div className="panel">
        <h3>📋 Proprietăți</h3>
        
        <div className="properties-grid">
          <div className="property-list">
            <h4>Caracteristici</h4>
            <ul>
              {info.properties.map((prop, i) => (
                <li key={i}>{prop}</li>
              ))}
            </ul>
          </div>
          
          <div className="property-list advantages">
            <h4>✅ Avantaje</h4>
            <ul>
              {info.advantages.map((adv, i) => (
                <li key={i}>{adv}</li>
              ))}
            </ul>
          </div>
          
          <div className="property-list disadvantages">
            <h4>⚠️ Dezavantaje</h4>
            <ul>
              {info.disadvantages.map((dis, i) => (
                <li key={i}>{dis}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Applications */}
      <div className="panel">
        <h3>🔧 Aplicații</h3>
        
        <div className="applications-grid">
          {info.applications.map((app, i) => (
            <div key={i} className="application-card">
              <span className="app-number">{i + 1}</span>
              <span>{app}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Note */}
      <div className="panel comparison-panel">
        <h3>🔄 Comparație Rapidă</h3>
        
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Wavelet</th>
              <th>Suport</th>
              <th>Ortogonal</th>
              <th>Neted</th>
              <th>Best For</th>
            </tr>
          </thead>
          <tbody>
            <tr className={selectedWavelet === 'haar' ? 'selected' : ''}>
              <td>Haar</td>
              <td>Compact</td>
              <td>✓</td>
              <td>✗</td>
              <td>Tranziții bruște</td>
            </tr>
            <tr className={selectedWavelet === 'morlet' ? 'selected' : ''}>
              <td>Morlet</td>
              <td>Infinit</td>
              <td>✗</td>
              <td>✓</td>
              <td>Timp-frecvență</td>
            </tr>
            <tr className={selectedWavelet === 'mexican_hat' ? 'selected' : ''}>
              <td>Mexican Hat</td>
              <td>Infinit</td>
              <td>✗</td>
              <td>✓</td>
              <td>Detectare blob</td>
            </tr>
            <tr className={selectedWavelet === 'gaussian' ? 'selected' : ''}>
              <td>Gaussian</td>
              <td>Infinit</td>
              <td>✗</td>
              <td>✓</td>
              <td>Derivate netede</td>
            </tr>
            <tr className={selectedWavelet === 'shannon' ? 'selected' : ''}>
              <td>Shannon</td>
              <td>Infinit</td>
              <td>✓</td>
              <td>✗</td>
              <td>Bandă ideală</td>
            </tr>
            <tr className={selectedWavelet === 'meyer' ? 'selected' : ''}>
              <td>Meyer</td>
              <td>Infinit</td>
              <td>✓</td>
              <td>✓</td>
              <td>Calitate maximă</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
