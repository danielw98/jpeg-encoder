import { useState, useEffect, useRef } from 'react'
import LaTeX, { LaTeXBlock } from './LaTeX'

// Kernel generators for different sizes
const KERNEL_TYPES = {
  'moving-avg': {
    name: 'Moving Average',
    category: 'smoothing',
    scalable: true,
    generate: (size) => Array(size).fill(1 / size),
    sizes: [3, 5, 7, 9, 11, 13, 15]
  },
  'gaussian': {
    name: 'Gaussian',
    category: 'smoothing',
    scalable: true,
    generate: (size) => {
      const sigma = size / 4
      const kernel = []
      const half = Math.floor(size / 2)
      let sum = 0
      for (let i = 0; i < size; i++) {
        const x = i - half
        const val = Math.exp(-(x * x) / (2 * sigma * sigma))
        kernel.push(val)
        sum += val
      }
      return kernel.map(v => v / sum)
    },
    sizes: [3, 5, 7, 9, 11, 13, 15]
  },
  'derivative': {
    name: 'Derivată',
    category: 'edge',
    scalable: true,
    generate: (size) => {
      // Central difference derivative
      const kernel = Array(size).fill(0)
      kernel[0] = -1
      kernel[size - 1] = 1
      return kernel
    },
    sizes: [3, 5, 7, 9]
  },
  'laplacian': {
    name: 'Laplacian',
    category: 'edge',
    scalable: true,
    generate: (size) => {
      // Discrete Laplacian (second derivative)
      const kernel = Array(size).fill(0)
      const half = Math.floor(size / 2)
      kernel[half] = -2
      kernel[0] = 1
      kernel[size - 1] = 1
      return kernel
    },
    sizes: [3, 5, 7, 9]
  },
  'sharpen': {
    name: 'Sharpening',
    category: 'enhance',
    scalable: true,
    generate: (size) => {
      const kernel = Array(size).fill(0)
      const half = Math.floor(size / 2)
      const alpha = 0.5
      kernel[half] = 1 + 2 * alpha
      kernel[0] = -alpha
      kernel[size - 1] = -alpha
      return kernel
    },
    sizes: [3, 5, 7, 9]
  }
}

// Generate noisy signal
function generateNoisySignal(samples = 200, noiseLevel = 0.3) {
  const t = []
  const clean = []
  const noisy = []
  
  for (let i = 0; i < samples; i++) {
    const ti = i / samples
    t.push(ti)
    // Clean signal: smooth wave
    const cleanVal = Math.sin(2 * Math.PI * 3 * ti) + 0.5 * Math.sin(2 * Math.PI * 7 * ti)
    clean.push(cleanVal)
    // Add noise
    noisy.push(cleanVal + (Math.random() - 0.5) * 2 * noiseLevel)
  }
  
  return { t, clean, noisy }
}

// Apply 1D convolution
function convolve1D(signal, kernel) {
  const result = []
  const halfK = Math.floor(kernel.length / 2)
  
  for (let i = 0; i < signal.length; i++) {
    let sum = 0
    for (let j = 0; j < kernel.length; j++) {
      const idx = i + j - halfK
      if (idx >= 0 && idx < signal.length) {
        sum += signal[idx] * kernel[j]
      } else {
        // Edge handling: replicate border
        const clampedIdx = Math.max(0, Math.min(signal.length - 1, idx))
        sum += signal[clampedIdx] * kernel[j]
      }
    }
    result.push(sum)
  }
  
  return result
}

export default function ConvolutionView({ compact = false }) {
  const [kernelType, setKernelType] = useState('gaussian')
  const [kernelSize, setKernelSize] = useState(5)
  const [noiseLevel, setNoiseLevel] = useState(0.3)
  const [signalData, setSignalData] = useState(null)
  const [filteredSignal, setFilteredSignal] = useState(null)
  const [animStep, setAnimStep] = useState(-1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 700, height: 280 })
  
  const canvasSignalRef = useRef()
  const canvasConvRef = useRef()
  const canvasKernelRef = useRef()
  const containerRef = useRef()

  // Get current kernel
  const kernelConfig = KERNEL_TYPES[kernelType]
  const kernel = kernelConfig ? kernelConfig.generate(kernelSize) : [1]
  const kernelName = kernelConfig ? `${kernelConfig.name} (${kernelSize})` : 'Unknown'

  // Ensure kernel size is valid for the type
  useEffect(() => {
    if (kernelConfig && !kernelConfig.sizes.includes(kernelSize)) {
      setKernelSize(kernelConfig.sizes[0])
    }
  }, [kernelType])

  // Generate initial signal
  useEffect(() => {
    regenerateSignal()
  }, [noiseLevel])

  // Apply convolution when kernel or signal changes
  useEffect(() => {
    if (signalData && kernel) {
      const filtered = convolve1D(signalData.noisy, kernel)
      setFilteredSignal(filtered)
    }
  }, [signalData, kernelType, kernelSize])

  // Handle canvas resize for HiDPI support
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasSignalRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const width = Math.floor(rect.width)
        const height = Math.floor(rect.height)
        if (width > 0 && height > 0) {
          setCanvasSize({ width, height })
        }
      }
    }

    // Initial size
    handleResize()

    // Observe resize
    const resizeObserver = new ResizeObserver(handleResize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [compact])

  // Draw effects - redraw when size changes
  useEffect(() => {
    if (signalData && filteredSignal) {
      drawSignals()
      drawKernel()
    }
  }, [signalData, filteredSignal, animStep, canvasSize])

  const regenerateSignal = () => {
    const data = generateNoisySignal(200, noiseLevel)
    setSignalData(data)
    setAnimStep(-1)
  }

  const startAnimation = () => {
    setIsAnimating(true)
    setAnimStep(0)
  }

  useEffect(() => {
    if (isAnimating && animStep >= 0) {
      const timer = setTimeout(() => {
        if (animStep < signalData.noisy.length - 1) {
          setAnimStep(animStep + 2)
        } else {
          setIsAnimating(false)
        }
      }, 30)
      return () => clearTimeout(timer)
    }
  }, [isAnimating, animStep])

  const drawSignals = () => {
    const canvas = canvasSignalRef.current
    if (!canvas || !signalData || !filteredSignal) return
    
    // HiDPI support
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    if (width === 0 || height === 0) return
    
    // Set actual canvas size scaled by DPR
    canvas.width = width * dpr
    canvas.height = height * dpr
    
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    
    // Use CSS dimensions for drawing (not scaled canvas dimensions)
    const margin = compact ? 30 : 50
    
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, width, height)
    
    const { t, clean, noisy } = signalData
    
    // Find range
    const all = [...noisy, ...filteredSignal]
    const min = Math.min(...all) - 0.2
    const max = Math.max(...all) + 0.2
    const range = max - min || 1
    
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
    
    // Helper to draw a signal
    const drawLine = (data, color, lineWidth, endIdx = data.length) => {
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.beginPath()
      for (let i = 0; i < Math.min(endIdx, data.length); i++) {
        const x = margin + (t[i] / t[t.length - 1]) * (width - 2 * margin)
        const y = height - margin - ((data[i] - min) / range) * (height - 2 * margin)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    
    // Draw noisy signal (faded)
    drawLine(noisy, 'rgba(136, 136, 170, 0.5)', 1)
    
    // Draw clean reference (dotted)
    ctx.setLineDash([4, 4])
    drawLine(clean, 'rgba(0, 217, 255, 0.3)', 1)
    ctx.setLineDash([])
    
    // Draw filtered signal (animated or full)
    const endIdx = animStep >= 0 ? animStep : filteredSignal.length
    drawLine(filteredSignal, '#00ff88', 2.5, endIdx)
    
    // Animation marker
    if (animStep >= 0 && animStep < filteredSignal.length) {
      const x = margin + (t[animStep] / t[t.length - 1]) * (width - 2 * margin)
      ctx.strokeStyle = '#ffaa00'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, margin)
      ctx.lineTo(x, height - margin)
      ctx.stroke()
    }
    
    // Title and legend are now rendered as HTML overlays
  }

  const drawKernel = () => {
    const canvas = canvasKernelRef.current
    if (!canvas) return
    
    // HiDPI support
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    if (width === 0 || height === 0) return
    
    canvas.width = width * dpr
    canvas.height = height * dpr
    
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, width, height)
    
    const barWidth = Math.min(30, (width - 40) / kernel.length)
    const startX = (width - kernel.length * barWidth) / 2
    
    // Draw bars
    const maxK = Math.max(...kernel.map(Math.abs)) || 1
    
    kernel.forEach((k, i) => {
      const barHeight = (k / maxK) * (height / 2 - 15)
      const x = startX + i * barWidth
      const y = height / 2
      
      ctx.fillStyle = k >= 0 ? '#00ff88' : '#ff6b9d'
      if (k >= 0) {
        ctx.fillRect(x + 2, y - barHeight, barWidth - 4, barHeight)
      } else {
        ctx.fillRect(x + 2, y, barWidth - 4, -barHeight)
      }
      
      // Value label (only show if bar is wide enough)
      if (barWidth > 20) {
        ctx.fillStyle = '#fff'
        ctx.font = '9px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(k.toFixed(2), x + barWidth / 2, k >= 0 ? y - barHeight - 3 : y - barHeight + 10)
      }
    })
    
    // Center line
    ctx.strokeStyle = '#8888aa'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(20, height / 2)
    ctx.lineTo(width - 20, height / 2)
    ctx.stroke()
    
    ctx.textAlign = 'left'
  }

  // Compact mode for tour embed
  if (compact) {
    return (
      <div className="convolution-view compact-mode">
        <div className="compact-conv-layout">
          {/* Left: Controls + Kernel */}
          <div className="compact-conv-sidebar">
            <div className="compact-section">
              <h4>⚙️ Parametri</h4>
              <div className="compact-control">
                <label>Tip kernel:</label>
                <select value={kernelType} onChange={e => setKernelType(e.target.value)}>
                  <option value="moving-avg">Moving Average</option>
                  <option value="gaussian">Gaussian</option>
                  <option value="derivative">Derivată</option>
                  <option value="laplacian">Laplacian</option>
                  <option value="sharpen">Sharpening</option>
                </select>
              </div>
              <div className="compact-control">
                <label>Dimensiune: {kernelSize}</label>
                <input
                  type="range"
                  min={kernelConfig?.sizes[0] || 3}
                  max={kernelConfig?.sizes[kernelConfig.sizes.length - 1] || 11}
                  step="2"
                  value={kernelSize}
                  onChange={e => setKernelSize(parseInt(e.target.value))}
                />
              </div>
              <div className="compact-control">
                <label>Zgomot: {noiseLevel.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={noiseLevel}
                  onChange={e => setNoiseLevel(parseFloat(e.target.value))}
                />
              </div>
              <div className="compact-buttons">
                <button onClick={regenerateSignal} className="compact-btn">🎲 Nou</button>
                <button onClick={startAnimation} disabled={isAnimating} className="compact-btn primary">
                  {isAnimating ? '⏳' : '▶️'}
                </button>
              </div>
            </div>
            
            <div className="compact-section">
              <h4>🔢 {kernelName}</h4>
              <div className="compact-kernel-wrapper">
                <canvas ref={canvasKernelRef} className="compact-kernel-canvas" />
              </div>
              <div className="kernel-formula-mini">
                {kernelType === 'moving-avg' && <LaTeX math={String.raw`h[k] = \frac{1}{N}`} />}
                {kernelType === 'gaussian' && <LaTeX math={String.raw`h[k] \propto e^{-k^2/2\sigma^2}`} />}
                {kernelType === 'derivative' && <LaTeX math={String.raw`h = [-1, 0, ..., 0, 1]`} />}
                {kernelType === 'laplacian' && <LaTeX math={String.raw`h = [1, 0, ..., -2, ..., 0, 1]`} />}
                {kernelType === 'sharpen' && <LaTeX math={String.raw`h = [-\alpha, ..., 1+2\alpha, ..., -\alpha]`} />}
              </div>
            </div>
          </div>
          
          {/* Right: Result plot */}
          <div className="compact-conv-result" ref={containerRef}>
            <div className="plot-container-with-overlay">
              <canvas ref={canvasSignalRef} className="compact-result-canvas" />
              {/* HTML overlay for title */}
              <div className="plot-title-overlay">{kernelName} - Denoising</div>
              {/* HTML overlay for legend */}
              <div className="plot-legend-overlay">
                <div className="legend-entry">
                  <span className="legend-line gray"></span>
                  <span>Cu zgomot</span>
                </div>
                <div className="legend-entry">
                  <span className="legend-line cyan"></span>
                  <span>Original (referință)</span>
                </div>
                <div className="legend-entry">
                  <span className="legend-line green"></span>
                  <span>Filtrat (convoluție)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Full mode
  return (
    <div className="convolution-view">
      <div className="panel">
        <h2>🔄 Convoluție 1D</h2>
        
        <div className="info-box">
          <p>
            <strong>Convoluția</strong> este operația fundamentală în procesarea semnalelor.
            Un <em>kernel</em> glisează peste semnal, calculând o sumă ponderată la fiecare poziție.
          </p>
        </div>

        <div className="math-block">
          <LaTeXBlock math={String.raw`(f * g)[n] = \sum_{k=-\infty}^{\infty} f[k] \cdot g[n-k]`} />
        </div>
      </div>

      <div className="panel">
        <h3>⚙️ Parametri</h3>
        
        <div className="controls" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="control-group">
            <label>Tip Kernel</label>
            <select value={kernelType} onChange={e => setKernelType(e.target.value)}>
              {Object.entries(KERNEL_TYPES).map(([id, info]) => (
                <option key={id} value={id}>{info.name}</option>
              ))}
            </select>
          </div>
          
          {KERNEL_TYPES[kernelType]?.scalable && (
            <div className="control-group">
              <label>Dimensiune: {kernelSize}</label>
              <input
                type="range"
                min="3"
                max="15"
                step="2"
                value={kernelSize}
                onChange={e => setKernelSize(parseInt(e.target.value))}
              />
            </div>
          )}
          
          <div className="control-group">
            <label>Zgomot: {noiseLevel.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={noiseLevel}
              onChange={e => setNoiseLevel(parseFloat(e.target.value))}
            />
          </div>
          
          <button onClick={regenerateSignal}>🎲 Regenerează</button>
          
          <button onClick={startAnimation} disabled={isAnimating} className="primary">
            {isAnimating ? '⏳ Animație...' : '▶️ Animație'}
          </button>
        </div>
      </div>

      <div className="panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 200px' }}>
          <h3>🔢 {KERNEL_TYPES[kernelType]?.name} ({kernelSize})</h3>
          <canvas ref={canvasKernelRef} width={200} height={90} style={{ background: '#0a0a1a', borderRadius: '8px', width: '100%' }} />
        </div>
        
        <div style={{ flex: '1', minWidth: '250px' }}>
          <div className="math-block" style={{ padding: '0.5rem' }}>
            {kernelType === 'moving-avg' && (
              <><strong>Moving Average:</strong> <LaTeX math={String.raw`h[k] = \frac{1}{N}`} /> - media vecinilor</>
            )}
            {kernelType === 'gaussian' && (
              <><strong>Gaussian:</strong> <LaTeX math={String.raw`h[k] \propto e^{-k^2/2\sigma^2}`} /> - greutăți centrate</>
            )}
            {kernelType === 'derivative' && (
              <><strong>Derivată:</strong> <LaTeX math={String.raw`h = [-1, 0, 1]`} /> - detectează schimbări</>
            )}
            {kernelType === 'laplacian' && (
              <><strong>Laplacian:</strong> <LaTeX math={String.raw`h = [1, -2, 1]`} /> - a doua derivată</>
            )}
            {kernelType === 'sharpen' && (
              <><strong>Sharpening:</strong> <LaTeX math={String.raw`h = [-\alpha, 1+2\alpha, -\alpha]`} /> - amplifică detalii</>
            )}
          </div>
        </div>
      </div>

      <div className="panel" style={{ flex: '1', minHeight: '180px' }}>
        <h3>📊 Rezultat</h3>
        <div className="plot-container" style={{ height: '180px' }}>
          <canvas ref={canvasSignalRef} style={{ width: '100%', height: '100%' }} />
        </div>
        
        {(kernelType === 'moving-avg' || kernelType === 'gaussian') && (
          <div className="info-box success" style={{ margin: '0.5rem 0 0 0' }}>
            <strong>Observație:</strong> Semnalul filtrat (verde) este mai neted. Kernel-uri mai mari = mai multă netezire.
          </div>
        )}
        {(kernelType === 'derivative' || kernelType === 'laplacian') && (
          <div className="info-box warning" style={{ margin: '0.5rem 0 0 0' }}>
            <strong>Observație:</strong> Derivata evidențiază schimbările rapide, dar amplifică și zgomotul.
          </div>
        )}
        {kernelType === 'sharpen' && (
          <div className="info-box" style={{ margin: '0.5rem 0 0 0' }}>
            <strong>Observație:</strong> Sharpening amplifică detaliile, dar poate introduce artefacte.
          </div>
        )}
      </div>
    </div>
  )
}
