import { useState, useEffect, useRef, useCallback } from 'react'
import LaTeX, { LaTeXBlock } from './LaTeX'
import '../styles/views/wavelet-scan.css'

/**
 * WaveletScanDemo - Shows wavelet scanning a signal with positive/negative areas
 * Visualizes the convolution/correlation process between wavelet and signal
 */

// Wavelet types for scanning (6 fundamental wavelets)
const WAVELETS = {
  haar: {
    name: 'Haar',
    func: (t) => {
      if (t >= -0.5 && t < 0) return 1
      if (t >= 0 && t < 0.5) return -1
      return 0
    },
    color: '#00d9ff'
  },
  morlet: {
    name: 'Morlet',
    func: (t, omega = 5) => Math.exp(-t * t / 2) * Math.cos(omega * t),
    color: '#ff6b9d'
  },
  mexican: {
    name: 'Mexican Hat',
    func: (t) => (1 - t * t) * Math.exp(-t * t / 2),
    color: '#ffaa00'
  },
  gaussian: {
    name: 'Gaussian',
    func: (t) => -t * Math.exp(-t * t / 2), // First derivative (DOG)
    color: '#00ff88'
  },
  shannon: {
    name: 'Shannon',
    func: (t) => {
      if (Math.abs(t) < 0.001) return 1
      const sinc = Math.sin(Math.PI * t) / (Math.PI * t)
      return sinc * Math.cos(1.5 * Math.PI * t)
    },
    color: '#9d4edd'
  },
  meyer: {
    name: 'Meyer',
    func: (t) => {
      const x = Math.abs(t)
      if (x > 4) return 0
      const env = Math.exp(-x * x / 4)
      return env * Math.sin(2 * Math.PI * t * 0.5) * (1 - x / 4)
    },
    color: '#06d6a0'
  }
}

// Generate test signals
const SIGNALS = {
  sine: {
    name: 'Sinusoidă',
    func: (t) => Math.sin(2 * Math.PI * t / 3),
    desc: 'Semnal periodic simplu'
  },
  chirp: {
    name: 'Chirp',
    func: (t) => Math.sin(2 * Math.PI * (0.5 + t * 0.3) * t),
    desc: 'Frecvență crescătoare'
  },
  pulse: {
    name: 'Puls',
    func: (t) => Math.exp(-((t - 2) * (t - 2)) / 0.5) - 0.5 * Math.exp(-((t + 1) * (t + 1)) / 0.3),
    desc: 'Impulsuri localizate'
  },
  step: {
    name: 'Treaptă',
    func: (t) => t > 0 ? 0.8 : -0.3,
    desc: 'Discontinuitate bruscă'
  }
}

export default function WaveletScanDemo({ compact = false }) {
  const [waveletType, setWaveletType] = useState('haar')
  const [signalType, setSignalType] = useState('chirp')
  const [position, setPosition] = useState(0) // Wavelet position b
  const [scale, setScale] = useState(1)
  const [animating, setAnimating] = useState(false)
  const [paused, setPaused] = useState(false)
  const [animSpeed, setAnimSpeed] = useState(0.05)
  const [showAreas, setShowAreas] = useState(true)
  
  const canvasRef = useRef()
  const containerRef = useRef()
  const resultCanvasRef = useRef()
  const resultContainerRef = useRef()
  const animRef = useRef()

  // Calculate wavelet coefficient at current position
  const calculateCoefficient = useCallback((pos, scl) => {
    const wavelet = WAVELETS[waveletType]
    const signal = SIGNALS[signalType]
    const dt = 0.05
    let sum = 0
    
    for (let t = -5; t <= 5; t += dt) {
      const wt = (t - pos) / scl
      const w = wavelet.func(wt) / Math.sqrt(Math.abs(scl))
      const s = signal.func(t)
      sum += w * s * dt
    }
    return sum
  }, [waveletType, signalType])

  // Draw main visualization (signal + wavelet + areas)
  const drawMain = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const margin = 40
    const plotWidth = width - 2 * margin
    const plotHeight = height - 2 * margin
    const zeroY = height / 2

    // Map t coordinate to canvas x
    const tMin = -5, tMax = 5
    const tToX = (t) => margin + ((t - tMin) / (tMax - tMin)) * plotWidth
    const yScale = plotHeight * 0.35

    // Grid
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 1
    for (let t = -4; t <= 4; t++) {
      const x = tToX(t)
      ctx.beginPath()
      ctx.moveTo(x, margin)
      ctx.lineTo(x, height - margin)
      ctx.stroke()
    }

    // Zero line
    ctx.strokeStyle = '#3a3a5a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(margin, zeroY)
    ctx.lineTo(width - margin, zeroY)
    ctx.stroke()

    const wavelet = WAVELETS[waveletType]
    const signal = SIGNALS[signalType]

    // Draw signal (background)
    ctx.strokeStyle = '#8888aa'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let px = margin; px <= width - margin; px++) {
      const t = tMin + ((px - margin) / plotWidth) * (tMax - tMin)
      const y = signal.func(t)
      const canvasY = zeroY - y * yScale
      if (px === margin) ctx.moveTo(px, canvasY)
      else ctx.lineTo(px, canvasY)
    }
    ctx.stroke()

    // Draw filled areas (product of wavelet and signal)
    if (showAreas) {
      for (let px = margin; px <= width - margin; px += 2) {
        const t = tMin + ((px - margin) / plotWidth) * (tMax - tMin)
        const wt = (t - position) / scale
        const w = wavelet.func(wt) / Math.sqrt(Math.abs(scale))
        const s = signal.func(t)
        const product = w * s

        if (Math.abs(product) > 0.01) {
          const productY = zeroY - product * yScale * 0.8
          ctx.fillStyle = product > 0 
            ? 'rgba(80, 250, 123, 0.4)'  // Green for positive
            : 'rgba(255, 107, 107, 0.4)' // Red for negative
          ctx.beginPath()
          ctx.moveTo(px, zeroY)
          ctx.lineTo(px, productY)
          ctx.lineTo(px + 2, productY)
          ctx.lineTo(px + 2, zeroY)
          ctx.closePath()
          ctx.fill()
        }
      }
    }

    // Draw wavelet at current position
    ctx.strokeStyle = wavelet.color
    ctx.lineWidth = 3
    ctx.beginPath()
    for (let px = margin; px <= width - margin; px++) {
      const t = tMin + ((px - margin) / plotWidth) * (tMax - tMin)
      const wt = (t - position) / scale
      const y = wavelet.func(wt) / Math.sqrt(Math.abs(scale))
      const canvasY = zeroY - y * yScale
      if (px === margin) ctx.moveTo(px, canvasY)
      else ctx.lineTo(px, canvasY)
    }
    ctx.stroke()

    // Position marker
    const posX = tToX(position)
    ctx.strokeStyle = '#ffaa00'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(posX, margin)
    ctx.lineTo(posX, height - margin)
    ctx.stroke()
    ctx.setLineDash([])

    // Labels
    ctx.fillStyle = '#ffaa00'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(`b = ${position.toFixed(1)}`, posX + 5, margin + 15)

    ctx.fillStyle = '#8888aa'
    ctx.font = '12px sans-serif'
    ctx.fillText('t', width - margin + 10, zeroY + 5)

  }, [waveletType, signalType, position, scale, showAreas, calculateCoefficient])

  // Draw result plot (coefficient vs position)
  const drawResult = useCallback(() => {
    const canvas = resultCanvasRef.current
    const container = resultContainerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const margin = 40
    const plotWidth = width - 2 * margin
    const plotHeight = height - 2 * margin
    const zeroY = height / 2

    const bMin = -4, bMax = 4
    const bToX = (b) => margin + ((b - bMin) / (bMax - bMin)) * plotWidth

    // Grid
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 1
    for (let b = -3; b <= 3; b++) {
      const x = bToX(b)
      ctx.beginPath()
      ctx.moveTo(x, margin)
      ctx.lineTo(x, height - margin)
      ctx.stroke()
    }

    // Zero line
    ctx.strokeStyle = '#3a3a5a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(margin, zeroY)
    ctx.lineTo(width - margin, zeroY)
    ctx.stroke()

    // Calculate coefficients for all positions
    const coefficients = []
    let maxCoef = 0
    for (let b = bMin; b <= bMax; b += 0.1) {
      const coef = calculateCoefficient(b, scale)
      coefficients.push({ b, coef })
      maxCoef = Math.max(maxCoef, Math.abs(coef))
    }

    // Draw coefficient curve
    const yScale = (plotHeight * 0.4) / (maxCoef || 1)
    ctx.strokeStyle = '#bd93f9'
    ctx.lineWidth = 2
    ctx.beginPath()
    coefficients.forEach(({ b, coef }, i) => {
      const x = bToX(b)
      const y = zeroY - coef * yScale
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Current position marker
    const currentCoef = calculateCoefficient(position, scale)
    const posX = bToX(position)
    const posY = zeroY - currentCoef * yScale

    // Vertical line at current position
    ctx.strokeStyle = '#ffaa00'
    ctx.lineWidth = 2
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(posX, zeroY)
    ctx.lineTo(posX, posY)
    ctx.stroke()
    ctx.setLineDash([])

    // Point at current value
    ctx.fillStyle = '#ffaa00'
    ctx.beginPath()
    ctx.arc(posX, posY, 6, 0, Math.PI * 2)
    ctx.fill()

    // Axis labels
    ctx.fillStyle = '#666'
    ctx.font = '11px sans-serif'
    ctx.fillText('b', width - margin + 8, zeroY + 4)

  }, [position, scale, calculateCoefficient])

  // Draw both canvases when any drawing-related state changes
  useEffect(() => {
    drawMain()
    drawResult()
  }, [waveletType, signalType, position, scale, showAreas, drawMain, drawResult])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      drawMain()
      drawResult()
    }
    const observer1 = new ResizeObserver(handleResize)
    const observer2 = new ResizeObserver(handleResize)
    if (containerRef.current) observer1.observe(containerRef.current)
    if (resultContainerRef.current) observer2.observe(resultContainerRef.current)
    return () => {
      observer1.disconnect()
      observer2.disconnect()
    }
  }, [drawMain, drawResult])

  // Animation
  useEffect(() => {
    if (animating && !paused) {
      let b = position
      const animate = () => {
        b += animSpeed
        if (b > 4) b = -4
        setPosition(b)
        animRef.current = requestAnimationFrame(animate)
      }
      animRef.current = requestAnimationFrame(animate)
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [animating, paused, animSpeed])

  // Frame by frame step
  const handleStep = () => {
    let newPos = position + animSpeed
    if (newPos > 4) newPos = -4
    setPosition(newPos)
  }

  const handleReset = () => {
    setPosition(0)
    setScale(1)
    setAnimating(false)
    setPaused(false)
  }

  return (
    <div className="wavelet-scan-demo">
      {/* Top row: plots + sidebar */}
      <div className="scan-top-row">
        {/* Main area with two stacked plots */}
        <div className="scan-main">
          {/* Top: Signal + Wavelet */}
          <div className="scan-plot-section">
            <div className="plot-label clean">
              <span className="label-signal">f(t)</span>
              <span className="label-wavelet" style={{ color: WAVELETS[waveletType].color }}>ψ(t)</span>
            </div>
            <div className="scan-canvas-container" ref={containerRef}>
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* Bottom: Result coefficient */}
          <div className="scan-plot-section result">
            <div className="plot-label clean">
              <span className="label-result">W(b)</span>
            </div>
            <div className="scan-canvas-container" ref={resultContainerRef}>
              <canvas ref={resultCanvasRef} />
            </div>
          </div>
        </div>

        {/* Right sidebar - Signal, Wavelet, Coefficient, Explanation */}
        <div className="scan-sidebar">
          {/* Signal selection */}
          <div className="scan-section">
            <div className="scan-section-header">📈 Semnal</div>
            <div className="scan-section-content">
              <div className="scan-buttons">
                {Object.entries(SIGNALS).map(([key, s]) => (
                  <button
                    key={key}
                    className={`scan-btn ${signalType === key ? 'active' : ''}`}
                    onClick={() => setSignalType(key)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <p className="scan-desc">{SIGNALS[signalType].desc}</p>
            </div>
          </div>

          {/* Wavelet selection */}
          <div className="scan-section">
            <div className="scan-section-header">🌊 Wavelet</div>
            <div className="scan-section-content">
              <div className="scan-buttons">
                {Object.entries(WAVELETS).map(([key, w]) => (
                  <button
                    key={key}
                    className={`scan-btn ${waveletType === key ? 'active' : ''}`}
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
            </div>
          </div>

          {/* Current coefficient display */}
          <div className="scan-section coefficient-display">
            <div className="scan-section-content">
              <div className="coef-value" style={{ color: calculateCoefficient(position, scale) >= 0 ? '#50fa7b' : '#ff6b6b' }}>
                <LaTeX math={`W(${position.toFixed(1)}) = ${calculateCoefficient(position, scale).toFixed(3)}`} />
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="scan-section explanation">
            <div className="scan-section-content">
              <p><strong style={{ color: '#50fa7b' }}>+</strong> corelație pozitivă</p>
              <p><strong style={{ color: '#ff6b6b' }}>−</strong> corelație negativă</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls bar */}
      <div className="scan-controls-bar">
        {/* Position slider */}
        <div className="scan-control-group">
          <label>
            <strong style={{ color: '#ffaa00' }}>b</strong> (poziție): {position.toFixed(1)}
          </label>
          <input
            type="range"
            min="-4"
            max="4"
            step="0.1"
            value={position}
            onChange={e => setPosition(parseFloat(e.target.value))}
            disabled={animating}
          />
        </div>

        {/* Scale slider */}
        <div className="scan-control-group">
          <label>
            <strong style={{ color: '#00d9ff' }}>a</strong> (scalare): {scale.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.3"
            max="2"
            step="0.1"
            value={scale}
            onChange={e => setScale(parseFloat(e.target.value))}
          />
        </div>

        {/* Show areas checkbox */}
        <label className="scan-checkbox-control">
          <input
            type="checkbox"
            checked={showAreas}
            onChange={e => setShowAreas(e.target.checked)}
          />
          Arată arii (+/−)
        </label>

        {/* Speed slider */}
        <div className="scan-control-group">
          <label>Viteză: {(animSpeed * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0.01"
            max="0.15"
            step="0.01"
            value={animSpeed}
            onChange={e => setAnimSpeed(parseFloat(e.target.value))}
          />
        </div>

        {/* Animation buttons */}
        <div className="scan-anim-controls">
          <button 
            className={`scan-anim-btn ${animating ? (paused ? 'play' : 'stop') : 'play'}`}
            onClick={() => {
              if (!animating) {
                setAnimating(true)
                setPaused(false)
              } else if (paused) {
                setPaused(false)
              } else {
                setPaused(true)
              }
            }}
          >
            {animating && !paused ? '⏸' : '▶'}
          </button>
          <button 
            className="scan-anim-btn step" 
            onClick={handleStep}
            title="Pas cu pas"
          >
            ⏭
          </button>
          <button className="scan-anim-btn reset" onClick={handleReset}>
            🔄
          </button>
        </div>
      </div>
    </div>
  )
}
