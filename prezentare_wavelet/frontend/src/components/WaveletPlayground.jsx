import { useState, useEffect, useRef } from 'react'
import LaTeX, { LaTeXBlock } from './LaTeX'

/**
 * WaveletPlayground - Beginner-friendly interactive wavelet visualization
 * Allows adjusting scale and translation parameters to see how wavelets work
 */

// Simple wavelet functions for visualization
const WAVELET_TYPES = {
  sine: {
    name: 'Sinusoidă',
    description: 'Funcție sinusoidală de bază - fundamentul analizei Fourier',
    func: (t, scale, shift) => Math.sin(2 * Math.PI * (t - shift) / scale),
    equation: String.raw`\psi(t) = \sin\left(\frac{2\pi(t-b)}{a}\right)`,
    color: '#00d9ff'
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
  morlet: {
    name: 'Morlet',
    description: 'Sinusoidă modulată de Gaussiană - cel mai folosit în practică',
    func: (t, scale, shift, omega = 5) => {
      const x = (t - shift) / scale
      return Math.exp(-x * x / 2) * Math.cos(omega * x)
    },
    equation: String.raw`\psi(t) = e^{-\frac{(t-b)^2}{2a^2}} \cos\left(\omega_0 \frac{t-b}{a}\right)`,
    color: '#ffaa00'
  }
}

export default function WaveletPlayground() {
  // Parameters
  const [waveletType, setWaveletType] = useState('morlet')
  const [scale, setScale] = useState(1.0)
  const [shift, setShift] = useState(0.0)
  const [omega, setOmega] = useState(5)
  const [showOriginal, setShowOriginal] = useState(true)
  
  // Animation
  const [animating, setAnimating] = useState(false)
  const [animParam, setAnimParam] = useState('shift')
  const [lastAnimParam, setLastAnimParam] = useState(null)
  
  const canvasRef = useRef()
  const animRef = useRef()

  // Default values for reset
  const DEFAULT_SCALE = 1.0
  const DEFAULT_SHIFT = 0.0

  // Draw wavelet
  useEffect(() => {
    drawWavelet()
  }, [waveletType, scale, shift, omega, showOriginal])

  // Animation loop
  useEffect(() => {
    if (animating) {
      // If starting a different animation type, reset to defaults
      if (lastAnimParam !== null && lastAnimParam !== animParam) {
        setScale(DEFAULT_SCALE)
        setShift(DEFAULT_SHIFT)
      }
      setLastAnimParam(animParam)
      
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

  // Handle animation type change - reset params when switching while animating
  const handleAnimParamChange = (newParam) => {
    if (animating) {
      // Reset to defaults when switching animation type while running
      setScale(DEFAULT_SCALE)
      setShift(DEFAULT_SHIFT)
    }
    setAnimParam(newParam)
  }

  const drawWavelet = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    const width = canvas.width
    const height = canvas.height
    const margin = 50
    
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
    const zeroX = margin + (4 / 8) * (width - 2 * margin) // t=0 is at index 4 in range [-4, 4]
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
    ctx.font = 'bold 14px sans-serif'
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
  }

  const wavelet = WAVELET_TYPES[waveletType]

  return (
    <div className="wavelet-playground">
      {/* Header - compact */}
      <div className="playground-header">
        <h2>🎮 Wavelet Playground</h2>
        <p className="subtitle">Explorează cum parametrii afectează forma wavelet-ului</p>
      </div>

      {/* Canvas - central focus */}
      <div className="panel visualization-panel">
        {/* LaTeX formula above canvas */}
        <div className="formula-display">
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
        
        <div className="plot-container">
          <canvas ref={canvasRef} width={800} height={350} />
        </div>
        
        {/* Wavelet name below */}
        <div className="wavelet-label" style={{ color: wavelet.color }}>
          {wavelet.name} Wavelet
        </div>
      </div>

      {/* Controls - directly below canvas */}
      <div className="panel controls-panel">
        <div className="playground-controls">
          {/* Wavelet Type */}
          <div className="control-section">
            <label>Tip Wavelet</label>
            <div className="button-group">
              {Object.entries(WAVELET_TYPES).map(([key, w]) => (
                <button
                  key={key}
                  className={waveletType === key ? 'active' : ''}
                  style={{ borderColor: waveletType === key ? w.color : undefined }}
                  onClick={() => setWaveletType(key)}
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Scale Slider */}
          <div className="control-section">
            <label>
              <strong style={{ color: '#00d9ff' }}>a</strong> (Scalare): {scale.toFixed(2)}
              <span className="hint">
                {scale < 1 ? ' ← comprimat (frecvențe înalte)' : scale > 1 ? ' ← dilatat (frecvențe joase)' : ' ← original'}
              </span>
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
            <div className="slider-labels">
              <span>0.2 (îngust)</span>
              <span>3.0 (larg)</span>
            </div>
          </div>
          
          {/* Shift Slider */}
          <div className="control-section">
            <label>
              <strong style={{ color: '#ffaa00' }}>b</strong> (Translație): {shift.toFixed(2)}
              <span className="hint"> ← poziția în timp</span>
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
            <div className="slider-labels">
              <span>-3 (stânga)</span>
              <span>+3 (dreapta)</span>
            </div>
          </div>
          
          {/* Morlet omega parameter */}
          {waveletType === 'morlet' && (
            <div className="control-section">
              <label>
                <strong style={{ color: '#ff6b9d' }}>ω₀</strong> (Frecvență oscilație): {omega}
              </label>
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                value={omega}
                onChange={e => setOmega(parseInt(e.target.value))}
              />
              <div className="slider-labels">
                <span>2 (lent)</span>
                <span>10 (rapid)</span>
              </div>
            </div>
          )}
          
          {/* Options */}
          <div className="control-section options-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showOriginal}
                onChange={e => setShowOriginal(e.target.checked)}
              />
              Arată originalul (a=1, b=0)
            </label>
            
            <div className="animation-controls">
              <button 
                className={animating ? 'active danger' : 'primary'}
                onClick={() => setAnimating(!animating)}
              >
                {animating ? '⏹ Stop' : '▶️ Animează'}
              </button>
              <select value={animParam} onChange={e => handleAnimParamChange(e.target.value)}>
                <option value="shift">Translație (b)</option>
                <option value="scale">Scalare (a)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Wavelet Info */}
      <div className="panel info-panel">
        <h3>📝 {wavelet.name}</h3>
        <p style={{ color: 'var(--text-muted)' }}>{wavelet.description}</p>
        
        <div className="math-block">
          <LaTeXBlock math={wavelet.equation} />
        </div>
        
        <div className="info-box success">
          <strong>💡 Încearcă:</strong>
          <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
            <li>Mută slider-ul <strong>b</strong> pentru a vedea cum wavelet-ul "scanează" semnalul</li>
            <li>Schimbă <strong>a</strong> pentru a detecta frecvențe diferite</li>
            <li>Activează animația pentru a vedea transformarea în mișcare!</li>
          </ul>
        </div>
      </div>

      {/* Theory Section - collapsible or at bottom */}
      <details className="panel theory-panel">
        <summary><h3 style={{ display: 'inline' }}>🎓 De ce contează?</h3></summary>
        
        <div className="insight-grid" style={{ marginTop: '1rem' }}>
          <div className="info-box">
            <h4 style={{ color: 'var(--primary)' }}>Scalare (a)</h4>
            <p>
              <strong>a mic</strong> = wavelet îngust = detectează frecvențe înalte (detalii fine)<br/>
              <strong>a mare</strong> = wavelet larg = detectează frecvențe joase (structuri mari)
            </p>
          </div>
          
          <div className="info-box">
            <h4 style={{ color: '#ffaa00' }}>Translație (b)</h4>
            <p>
              Mută wavelet-ul de-a lungul semnalului pentru a <em>localiza</em> unde apar anumite frecvențe.
              Aceasta este superputerea wavelet-ilor față de Fourier!
            </p>
          </div>
        </div>
        
        <div className="math-block" style={{ marginTop: '1rem' }}>
          <strong>Transformata Wavelet Continuă:</strong>
          <LaTeXBlock math={String.raw`W(a,b) = \int_{-\infty}^{\infty} f(t) \cdot \psi_{a,b}(t) \, dt`} />
          <p style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Corelația dintre semnal și wavelet-ul la diferite scale și poziții
          </p>
        </div>
      </details>
    </div>
  )
}
