import { useState, useEffect, useRef, useCallback } from 'react'
import LaTeX, { LaTeXBlock } from './LaTeX'

/**
 * WaveletPlayground - Beginner-friendly interactive wavelet visualization
 * Presentation-style layout with scalable canvas and sidebar controls
 */

// Simple wavelet functions for visualization
const WAVELET_TYPES = {
  morlet: {
    name: 'Morlet',
    description: 'Sinusoidă modulată de Gaussiană - cel mai folosit în practică',
    func: (t, scale, shift, omega = 5) => {
      const x = (t - shift) / scale
      return Math.exp(-x * x / 2) * Math.cos(omega * x)
    },
    equation: String.raw`\psi(t) = e^{-\frac{(t-b)^2}{2a^2}} \cos\left(\omega_0 \frac{t-b}{a}\right)`,
    color: '#ffaa00'
  },
  haar: {
    name: 'Haar',
    description: 'Cel mai simplu wavelet - funcție "treaptă"',
    func: (t, scale, shift) => {
      const x = (t - shift) / scale
      if (x >= 0 && x < 0.5) return 1
      if (x >= 0.5 && x < 1) return -1
      return 0
    },
    equation: String.raw`\psi(t) = \begin{cases} 1, & 0 \leq \frac{t-b}{a} < 0.5 \\ -1, & 0.5 \leq \frac{t-b}{a} < 1 \\ 0, & \text{altfel} \end{cases}`,
    color: '#00ff88'
  },
  mexican: {
    name: 'Mexican Hat',
    description: 'Derivata a doua a Gaussianei - detectează schimbări',
    func: (t, scale, shift) => {
      const x = (t - shift) / scale
      return (1 - x * x) * Math.exp(-x * x / 2)
    },
    equation: String.raw`\psi(t) = \left(1 - \left(\frac{t-b}{a}\right)^2\right) e^{-\frac{(t-b)^2}{2a^2}}`,
    color: '#ff6b9d'
  },
  sine: {
    name: 'Sinusoidă',
    description: 'Funcție sinusoidală de bază - fundamentul analizei Fourier',
    func: (t, scale, shift) => Math.sin(2 * Math.PI * (t - shift) / scale),
    equation: String.raw`\psi(t) = \sin\left(\frac{2\pi(t-b)}{a}\right)`,
    color: '#00d9ff'
  }
}

// Default values
const DEFAULTS = {
  scale: 1.0,
  shift: 0.0,
  omega: 5,
  waveletType: 'morlet',
  showOriginal: true
}

export default function WaveletPlayground({ compact = false }) {
  // Parameters
  const [waveletType, setWaveletType] = useState(DEFAULTS.waveletType)
  const [scale, setScale] = useState(DEFAULTS.scale)
  const [shift, setShift] = useState(DEFAULTS.shift)
  const [omega, setOmega] = useState(DEFAULTS.omega)
  const [showOriginal, setShowOriginal] = useState(DEFAULTS.showOriginal)
  
  // Animation
  const [animating, setAnimating] = useState(false)
  const [animParam, setAnimParam] = useState('shift')
  
  // Collapsible sections
  const [showWaveletInfo, setShowWaveletInfo] = useState(true)
  const [showTheory, setShowTheory] = useState(false)
  const [viewDomain, setViewDomain] = useState('time') // 'time', 'freq', 'both'
  
  const canvasRef = useRef()
  const freqCanvasRef = useRef()
  const containerRef = useRef()
  const animRef = useRef()

  // Reset to defaults
  const handleReset = () => {
    setScale(DEFAULTS.scale)
    setShift(DEFAULTS.shift)
    setOmega(DEFAULTS.omega)
    setShowOriginal(DEFAULTS.showOriginal)
    setAnimating(false)
  }

  // Helper for frequency spectrum magnitude
  const getSpectrum = (w, type, s, o) => {
    // F{psi((t-b)/a)} = |a| * exp(-i*b*w) * Psi(a*w)
    // We only care about magnitude: |a| * |Psi(a*w)|
    const aw = w * s
    
    switch(type) {
      case 'morlet':
        // Gaussian centered at omega_0
        return Math.abs(s) * Math.exp(-Math.pow(aw - o, 2) / 2)
      case 'mexican':
        // w^2 * exp(-w^2/2)
        return Math.abs(s) * Math.pow(aw, 2) * Math.exp(-Math.pow(aw, 2) / 2)
      case 'haar':
        // Sinc-like shape
        if (Math.abs(aw) < 0.01) return 0 // Haar is bandpass
        return Math.abs(s) * Math.abs(Math.sin(aw/2) / (aw/2))
      case 'sine':
        // Narrow peak
        return Math.abs(s) * Math.exp(-Math.pow(aw - 2*Math.PI, 2) * 10)
      default:
        return 0
    }
  }

  // Draw frequency spectrum
  const drawSpectrum = useCallback(() => {
    const canvas = freqCanvasRef.current
    if (!canvas || viewDomain === 'time') return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    
    const W = rect.width
    const H = rect.height
    const margin = 30

    // Clear
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, W, H)
    
    // Grid
    ctx.strokeStyle = '#1a1a3a'
    ctx.lineWidth = 1
    
    // Axes
    ctx.beginPath()
    ctx.moveTo(margin, H - margin)
    ctx.lineTo(W - margin, H - margin) // Freq axis
    ctx.moveTo(margin, margin)
    ctx.lineTo(margin, H - margin) // Mag axis
    ctx.stroke()
    
    // Plot spectrum
    const wavelet = WAVELET_TYPES[waveletType]
    ctx.strokeStyle = wavelet.color
    ctx.lineWidth = 2
    ctx.beginPath()
    
    const maxFreq = 15 // Max frequency to display
    
    for (let px = margin; px < W - margin; px++) {
      const w = ((px - margin) / (W - 2 * margin)) * maxFreq
      const mag = getSpectrum(w, waveletType, scale, omega)
      
      // Normalize height roughly
      const plotY = (H - margin) - mag * (H - 2 * margin) * 0.8
      
      if (px === margin) ctx.moveTo(px, plotY)
      else ctx.lineTo(px, plotY)
    }
    ctx.stroke()
    
    // Labels
    ctx.fillStyle = '#888'
    ctx.font = '10px sans-serif'
    ctx.fillText('Frecvență (ω)', W/2, H - 5)
    ctx.fillText('|Ψ(ω)|', 5, H/2)
    
  }, [waveletType, scale, omega, viewDomain])

  // Draw wavelet
  const drawWavelet = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    
    // HiDPI support - responsive sizing
    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    // Adjust height if showing both
    const height = viewDomain === 'both' ? rect.height / 2 : rect.height
    const width = rect.width
    
    if (width === 0 || height === 0) return
    
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    
    const margin = compact ? 35 : 45
    
    // Clear
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, width, height)
    
    // Grid
    ctx.strokeStyle = '#1a1a3a'
    ctx.lineWidth = 1
    
    // Horizontal grid
    for (let i = 0; i <= 4; i++) {
      const y = margin + (i * (height - 2 * margin)) / 4
      ctx.beginPath()
      ctx.moveTo(margin, y)
      ctx.lineTo(width - margin, y)
      ctx.stroke()
    }
    
    // Vertical grid
    for (let i = 0; i <= 8; i++) {
      const x = margin + (i * (width - 2 * margin)) / 8
      ctx.beginPath()
      ctx.moveTo(x, margin)
      ctx.lineTo(x, height - margin)
      ctx.stroke()
    }
    
    // Zero line (horizontal axis)
    const zeroY = height / 2
    ctx.strokeStyle = '#3a3a5a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(margin, zeroY)
    ctx.lineTo(width - margin, zeroY)
    ctx.stroke()

    // Vertical axis at t=0 (center)
    const zeroX = margin + (4 / 8) * (width - 2 * margin)
    ctx.strokeStyle = '#3a3a5a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(zeroX, margin)
    ctx.lineTo(zeroX, height - margin)
    ctx.stroke()

    // Axis of symmetry for original function (t=0) - highlighted
    if (showOriginal) {
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 1
      ctx.setLineDash([8, 4])
      ctx.beginPath()
      ctx.moveTo(zeroX, margin + 10)
      ctx.lineTo(zeroX, height - margin - 10)
      ctx.stroke()
      ctx.setLineDash([])
      
      // Label for symmetry axis
      ctx.fillStyle = '#00ff88'
      ctx.font = '10px sans-serif'
      ctx.fillText('t=0', zeroX + 3, margin + 20)
    }
    
    // Translation marker (b) - more prominent
    const shiftX = margin + ((shift + 4) / 8) * (width - 2 * margin)
    ctx.strokeStyle = '#ffaa00'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(shiftX, margin)
    ctx.lineTo(shiftX, height - margin)
    ctx.stroke()
    ctx.setLineDash([])
    
    // b label on the translation marker
    ctx.fillStyle = '#ffaa00'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(`b = ${shift.toFixed(1)}`, shiftX + 5, margin + 15)
    
    // Draw original wavelet (scale=1, shift=0) if enabled
    const wavelet = WAVELET_TYPES[waveletType]
    
    if (showOriginal && (scale !== 1 || shift !== 0)) {
      ctx.strokeStyle = 'rgba(136, 136, 170, 0.5)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      
      for (let px = margin; px <= width - margin; px++) {
        const t = ((px - margin) / (width - 2 * margin)) * 8 - 4
        const y = wavelet.func(t, 1, 0, omega)
        const canvasY = zeroY - y * (height / 2 - margin) * 0.8
        if (px === margin) ctx.moveTo(px, canvasY)
        else ctx.lineTo(px, canvasY)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }
    
    // Draw transformed wavelet
    ctx.strokeStyle = wavelet.color
    ctx.lineWidth = 3
    ctx.beginPath()
    
    for (let px = margin; px <= width - margin; px++) {
      const t = ((px - margin) / (width - 2 * margin)) * 8 - 4
      const y = wavelet.func(t, scale, shift, omega)
      const canvasY = zeroY - y * (height / 2 - margin) * 0.8
      if (px === margin) ctx.moveTo(px, canvasY)
      else ctx.lineTo(px, canvasY)
    }
    ctx.stroke()
    
    // Axis labels
    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.fillText('t', width - margin + 10, zeroY + 5)
    ctx.fillText('ψ(t)', margin - 35, margin - 5)
    
    // X axis values
    for (let i = 0; i <= 8; i++) {
      const x = margin + (i * (width - 2 * margin)) / 8
      const val = i - 4
      ctx.fillStyle = '#666'
      ctx.fillText(val.toString(), x - 5, height - margin + 15)
    }
    
    // Draw spectrum if needed
    if (viewDomain !== 'time') {
      drawSpectrum()
    }
    
  }, [waveletType, scale, shift, omega, showOriginal, compact, viewDomain, drawSpectrum])

  // Redraw on mount and data change
  useEffect(() => {
    drawWavelet()
  }, [drawWavelet])

  // Handle resize
  useEffect(() => {
    const handleResize = () => drawWavelet()
    const resizeObserver = new ResizeObserver(handleResize)
    if (containerRef.current) resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [drawWavelet])

  // Animation loop
  useEffect(() => {
    if (animating) {
      let frame = 0
      const animate = () => {
        frame += 0.02
        if (animParam === 'shift') {
          setShift(Math.sin(frame) * 2)
        } else if (animParam === 'scale') {
          setScale(0.5 + Math.abs(Math.sin(frame)) * 1.5)
        }
        animRef.current = requestAnimationFrame(animate)
      }
      animRef.current = requestAnimationFrame(animate)
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [animating, animParam])

  const wavelet = WAVELET_TYPES[waveletType]

  return (
    <div className="wavelet-playground-v2">
      {/* Left area: Graph + Controls */}
      <div className="playground-top-row">
        {/* Main content area - graph */}
        <div className="playground-main">
          {/* Formula bar at top */}
          <div className="formula-bar">
            <LaTeX math={`\\psi_{${scale.toFixed(1)},${shift.toFixed(1)}}(t) = \\frac{1}{\\sqrt{${scale.toFixed(1)}}} \\cdot \\psi\\left(\\frac{t - ${shift.toFixed(1)}}{${scale.toFixed(1)}}\\right)`} />
          </div>
          
          {/* Parameter badges */}
          <div className="param-badges">
            <span className="param-badge scale">
              <LaTeX math={`a = ${scale.toFixed(2)}`} /> 
              <small>(scalare)</small>
            </span>
            <span className="param-badge shift">
              <LaTeX math={`b = ${shift.toFixed(2)}`} />
              <small>(translație)</small>
            </span>
          </div>
          
          {/* Canvas container - fills available space */}
          <div className="plot-container" ref={containerRef} style={{ display: 'flex', flexDirection: 'column' }}>
            <canvas 
              ref={canvasRef} 
              style={{ 
                flex: 1, 
                width: '100%',
                height: viewDomain === 'both' ? '0' : '100%', 
                minHeight: 0,
                display: viewDomain === 'freq' ? 'none' : 'block' 
              }} 
            />
            <canvas 
              ref={freqCanvasRef} 
              style={{ 
                flex: 1, 
                width: '100%',
                height: viewDomain === 'both' ? '0' : '100%',
                minHeight: 0,
                display: viewDomain === 'time' ? 'none' : 'block', 
                borderTop: viewDomain === 'both' ? '1px solid #333' : 'none' 
              }} 
            />
            
            <div className="plot-title-overlay" style={{ color: wavelet.color }}>
              {wavelet.name} Wavelet {viewDomain === 'freq' ? '(Frecvență)' : viewDomain === 'both' ? '(Timp + Frecvență)' : '(Timp)'}
            </div>
          </div>
        </div>
        
        {/* Bottom controls bar */}
        <div className="playground-controls-bar">
          {/* Scale Slider */}
          <div className="control-group">
            <label>
              <strong style={{ color: '#00d9ff' }}>a</strong>: {scale.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.2"
              max="3"
              step="0.05"
              value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
              disabled={animating && animParam === 'scale'}
            />
            <span className="slider-hint">
              {scale < 1 ? 'comprimat' : scale > 1 ? 'dilatat' : 'original'}
            </span>
          </div>
          
          {/* Shift Slider */}
          <div className="control-group">
            <label>
              <strong style={{ color: '#ffaa00' }}>b</strong>: {shift.toFixed(2)}
            </label>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.1"
              value={shift}
              onChange={e => setShift(parseFloat(e.target.value))}
              disabled={animating && animParam === 'shift'}
            />
          </div>
          
          {/* Morlet omega parameter */}
          {waveletType === 'morlet' && (
            <div className="control-group">
              <label>
                <strong style={{ color: '#ff6b9d' }}><LaTeX math="\omega_0" /></strong>: {omega}
              </label>
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                value={omega}
                onChange={e => setOmega(parseInt(e.target.value))}
              />
            </div>
          )}
          
          {/* Show original checkbox */}
          <label className="checkbox-control">
            <input
              type="checkbox"
              checked={showOriginal}
              onChange={e => setShowOriginal(e.target.checked)}
            />
            Original
          </label>
          
          {/* Animation controls */}
          <div className="animation-controls">
            <select 
              value={animParam} 
              onChange={e => setAnimParam(e.target.value)}
              disabled={animating}
            >
              <option value="shift">b</option>
              <option value="scale">a</option>
            </select>
            <button 
              className={`anim-btn ${animating ? 'stop' : 'play'}`}
              onClick={() => setAnimating(!animating)}
            >
              {animating ? '⏹' : '▶'}
            </button>
            <button 
              className="anim-btn reset"
              onClick={handleReset}
              title="Reset"
            >
              🔄
            </button>
          </div>
        </div>
      </div>
      
      {/* Right sidebar - extends full height */}
      <div className="playground-sidebar">
        {/* View Mode Toggle */}
        <div className="sidebar-section">
           <div className="section-header">
             <span>👁️ Vizualizare</span>
           </div>
             <div className="section-content">
               <div className="wavelet-buttons">
                 <button 
                   className={`wavelet-btn ${viewDomain === 'time' ? 'active' : ''}`}
                   onClick={() => setViewDomain('time')}
                 >
                   Timp
                 </button>
                 <button 
                   className={`wavelet-btn ${viewDomain === 'freq' ? 'active' : ''}`}
                   onClick={() => setViewDomain('freq')}
                 >
                   Frecvență
                 </button>
                 <button 
                   className={`wavelet-btn ${viewDomain === 'both' ? 'active' : ''}`}
                   onClick={() => setViewDomain('both')}
                 >
                   Ambele
                 </button>
               </div>
             </div>
          </div>

          {/* Wavelet Type Section */}
          <div className="sidebar-section">
            <div 
              className="section-header clickable"
              onClick={() => setShowWaveletInfo(!showWaveletInfo)}
            >
              <span>🌊 Tip Wavelet</span>
              <span className="toggle-icon">{showWaveletInfo ? '▼' : '▶'}</span>
            </div>
            {showWaveletInfo && (
              <div className="section-content">
                <div className="wavelet-buttons">
                  {Object.entries(WAVELET_TYPES).map(([key, w]) => (
                    <button
                      key={key}
                      className={`wavelet-btn ${waveletType === key ? 'active' : ''}`}
                      style={{ 
                        borderColor: waveletType === key ? w.color : 'transparent',
                        color: waveletType === key ? w.color : undefined
                      }}
                      onClick={() => setWaveletType(key)}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
                <p className="wavelet-desc">{wavelet.description}</p>
                <div className="wavelet-equation">
                  <LaTeXBlock math={wavelet.equation} />
                </div>
              </div>
            )}
          </div>
          
          {/* Parameter Explanation */}
          <div className="sidebar-section explanation-section">
            <div className="section-content theory-content">
              <div className="theory-item">
                <h5 style={{ color: '#00d9ff' }}>Scalare (a)</h5>
                <p><strong>a mic</strong> → frecvențe înalte (detalii)</p>
                <p><strong>a mare</strong> → frecvențe joase (structuri)</p>
              </div>
              <div className="theory-item">
                <h5 style={{ color: '#ffaa00' }}>Translație (b)</h5>
                <p>Localizează <em>unde</em> apar frecvențele în semnal.</p>
              </div>
              <div className="theory-formula">
                <LaTeXBlock math={String.raw`W(a,b) = \int f(t) \cdot \psi_{a,b}(t) \, dt`} />
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
