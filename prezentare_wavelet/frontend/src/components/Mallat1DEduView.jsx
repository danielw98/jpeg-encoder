import { useState, useEffect, useRef, useCallback } from 'react'
import LaTeX, { LaTeXBlock } from './LaTeX'
import './Mallat1DEduView.css'

/**
 * Mallat1DEduView - Educational 1D Mallat decomposition
 * Shows step-by-step filtering and decimation on a single line
 * Improved with heatmap visualization and clearer explanations
 */

// Wavelet filters with explanations
const FILTERS = {
  haar: {
    name: 'Haar',
    h0: [1/Math.sqrt(2), 1/Math.sqrt(2)],      // Low-pass
    h1: [1/Math.sqrt(2), -1/Math.sqrt(2)],     // High-pass
    description: 'Cel mai simplu wavelet',
    lpExplain: 'MEDIE: (a + b) / √2 → păstrează forma generală',
    hpExplain: 'DIFERENȚĂ: (a - b) / √2 → detectează schimbări'
  },
  db2: {
    name: 'Daubechies-2',
    h0: [0.4830, 0.8365, 0.2241, -0.1294],
    h1: [-0.1294, -0.2241, 0.8365, -0.4830],
    description: 'Mai neted, suport 4',
    lpExplain: 'Media ponderată pe 4 valori → tranziții line',
    hpExplain: 'Detectează schimbări subtile pe 4 valori'
  }
}

// Heatmap color function: green=positive, red=negative
const getHeatmapColor = (value, maxAbs) => {
  if (maxAbs === 0) return '#444'
  const normalized = value / maxAbs
  if (normalized >= 0) {
    const intensity = Math.min(normalized, 1)
    const g = Math.round(80 + 175 * intensity)
    return `rgb(30, ${g}, 50)`
  } else {
    const intensity = Math.min(-normalized, 1)
    const r = Math.round(80 + 175 * intensity)
    return `rgb(${r}, 30, 50)`
  }
}

// Generate sample signal
const generateSignal = (size, type = 'step') => {
  const signal = []
  for (let i = 0; i < size; i++) {
    const t = i / size
    switch (type) {
      case 'step':
        signal.push(t < 0.5 ? 100 : 200)
        break
      case 'ramp':
        signal.push(50 + 150 * t)
        break
      case 'sine':
        signal.push(128 + 80 * Math.sin(4 * Math.PI * t))
        break
      case 'pulse':
        signal.push(t > 0.3 && t < 0.7 ? 200 : 80)
        break
      default:
        signal.push(128)
    }
  }
  return signal
}

export default function Mallat1DEduView({ compact = false }) {
  const [signalSize, setSignalSize] = useState(16)
  const [signalType, setSignalType] = useState('step')
  const [filterType, setFilterType] = useState('haar')
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [useHeatmap, setUseHeatmap] = useState(true)
  const [usePlot, setUsePlot] = useState(true) // Line plot mode
  const [kernelPos, setKernelPos] = useState(0)
  const [currentPhase, setCurrentPhase] = useState('idle') // 'idle', 'lp', 'hp', 'done'
  
  const canvasRef = useRef()
  const animRef = useRef()
  
  const signal = generateSignal(signalSize, signalType)
  const filter = FILTERS[filterType]
  
  // Compute filtered and decimated outputs
  const computeOutputs = useCallback(() => {
    const h0 = filter.h0
    const h1 = filter.h1
    const n = signal.length
    const filterLen = h0.length
    
    // Convolution + decimation
    const lowPass = []
    const highPass = []
    
    for (let i = 0; i < n; i += 2) { // Decimate by 2
      let lpVal = 0
      let hpVal = 0
      for (let j = 0; j < filterLen; j++) {
        const idx = (i + j) % n
        lpVal += signal[idx] * h0[j]
        hpVal += signal[idx] * h1[j]
      }
      lowPass.push(lpVal)
      highPass.push(hpVal)
    }
    
    return { lowPass, highPass }
  }, [signal, filter])
  
  const { lowPass, highPass } = computeOutputs()
  
  // Total steps: LP filtering (n/2 outputs) + HP filtering (n/2 outputs)
  const totalSteps = signalSize // n/2 for LP + n/2 for HP
  
  // Animation
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setStep(prev => {
          const next = prev + 1
          if (next >= totalSteps) {
            setIsPlaying(false)
            setCurrentPhase('done')
            return totalSteps
          }
          // Update phase
          if (next < signalSize / 2) {
            setCurrentPhase('lp')
            setKernelPos(next * 2)
          } else {
            setCurrentPhase('hp')
            setKernelPos((next - signalSize / 2) * 2)
          }
          return next
        })
        animRef.current = setTimeout(animate, 400)
      }
      animRef.current = setTimeout(animate, 400)
    }
    return () => clearTimeout(animRef.current)
  }, [isPlaying, totalSteps, signalSize])
  
  // Draw visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    
    // Clear
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, width, height)
    
    const margin = 20
    const barHeight = 140
    const spacing = 25
    const barWidth = (width - 2 * margin) / signalSize
    
    // Find max absolute values for normalization
    const allValues = [...signal, ...lowPass, ...highPass]
    const maxVal = Math.max(...allValues)
    const minVal = Math.min(...allValues)
    const range = maxVal - minVal || 1
    
    // Y-axis padding factor (0.85 means use 85% of height, leaving 15% padding)
    const yPadding = 0.82
    
    // Draw line plot with optional scatter points
    const drawLinePlot = (values, yOffset, color, filterHighlight = []) => {
      const plotHeight = barHeight
      const bw = (width - 2 * margin) / values.length
      const usableHeight = plotHeight * yPadding
      const topPadding = (plotHeight - usableHeight) / 2
      
      // Draw background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(margin, yOffset, width - 2 * margin, plotHeight)
      
      // Draw zero line
      const zeroY = yOffset + topPadding + usableHeight - ((0 - minVal) / range) * usableHeight
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(margin, zeroY)
      ctx.lineTo(width - margin, zeroY)
      ctx.stroke()
      ctx.setLineDash([])
      
      // Draw the line
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      values.forEach((val, i) => {
        const x = margin + i * bw + bw / 2
        const y = yOffset + topPadding + usableHeight - ((val - minVal) / range) * usableHeight
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      
      // Draw scatter points
      values.forEach((val, i) => {
        const x = margin + i * bw + bw / 2
        const y = yOffset + topPadding + usableHeight - ((val - minVal) / range) * usableHeight
        
        // Highlight filter positions
        if (filterHighlight.includes(i)) {
          ctx.fillStyle = '#ffaa00'
          ctx.beginPath()
          ctx.arc(x, y, 8, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2
          ctx.stroke()
        } else {
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    }
    
    // Draw bar/heatmap function
    const drawBar = (values, yOffset, defaultColor, label, highlightIdx = -1, filterHighlight = [], isCoefficients = false) => {
      const bw = (width - 2 * margin) / values.length
      const maxAbs = Math.max(...allValues.map(Math.abs), 1)
      const usableHeight = barHeight * yPadding
      const topPadding = (barHeight - usableHeight) / 2
      
      values.forEach((val, i) => {
        const x = margin + i * bw
        
        // Draw cell background
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(x + 1, yOffset, bw - 2, barHeight)
        
        // Choose color and drawing mode based on type
        if (isCoefficients && useHeatmap) {
          // Heatmap mode for coefficients: fill entire cell with color based on value
          ctx.fillStyle = getHeatmapColor(val, maxAbs)
          ctx.fillRect(x + 2, yOffset + topPadding, bw - 4, usableHeight)
        } else {
          // Bar chart mode for signal or when heatmap is off
          let barColor = defaultColor
          if (filterHighlight.includes(i)) {
            barColor = '#ffaa00' // Highlighted by filter kernel
          }
          
          // Draw the bar proportional to value with padding
          const normalizedVal = Math.abs(val) / maxAbs
          const h = Math.max(normalizedVal * usableHeight, 2)
          ctx.fillStyle = barColor
          ctx.fillRect(x + 2, yOffset + topPadding + usableHeight - h, bw - 4, h)
        }
        
        // Border for filter-highlighted cells
        if (filterHighlight.includes(i)) {
          ctx.strokeStyle = '#ffaa00'
          ctx.lineWidth = 3
          ctx.strokeRect(x, yOffset - 1, bw, barHeight + 2)
        }
        
        // Value text (skip if using plot mode to reduce clutter)
        if (!usePlot || !isCoefficients) {
          ctx.fillStyle = (isCoefficients && useHeatmap) ? '#fff' : '#ccc'
          ctx.font = 'bold 11px monospace'
          ctx.textAlign = 'center'
          const displayVal = isCoefficients ? val.toFixed(0) : Math.round(val)
          ctx.fillText(displayVal, x + bw/2, yOffset + barHeight/2 + 4)
          ctx.textAlign = 'left'
        }
      })
    }
    
    // Determine which pixels are being filtered
    const getFilterHighlight = () => {
      if (currentPhase === 'idle' || currentPhase === 'done') return []
      const filterLen = filter.h0.length
      const highlights = []
      for (let j = 0; j < filterLen; j++) {
        highlights.push((kernelPos + j) % signalSize)
      }
      return highlights
    }
    
    const filterHighlight = getFilterHighlight()
    
    // Draw original signal - use line plot or bar chart (labels moved to HTML)
    if (usePlot) {
      drawLinePlot(signal, 25, '#00d4ff', filterHighlight)
    } else {
      drawBar(signal, 25, '#00d4ff', '', -1, filterHighlight, false)
    }
    
    // Calculate Y positions for LP/HP sections (leave room for HTML labels above)
    const filterY = 25 + barHeight + spacing
    const currentFilter = currentPhase === 'hp' ? filter.h1 : filter.h0
    
    // Draw LP output section
    const lpY = 195
    const lpOutputCount = currentPhase === 'lp' ? Math.min(step + 1, signalSize / 2) : 
                          currentPhase === 'hp' || currentPhase === 'done' ? signalSize / 2 : 0
    const lpPartial = lowPass.slice(0, lpOutputCount)
    
    // Draw LP bars (labels moved to HTML)
    if (lpPartial.length > 0) {
      if (usePlot && currentPhase !== 'lp') {
        drawLinePlot(lpPartial, lpY, '#00ff88', [])
      } else {
        drawBar(lpPartial, lpY, '#00ff88', '', currentPhase === 'lp' ? step : -1, [], true)
      }
    } else {
      ctx.fillStyle = '#1a1a2e'
      const emptyBw = (width - 2 * margin) / (signalSize / 2)
      for (let i = 0; i < signalSize / 2; i++) {
        ctx.fillRect(margin + i * emptyBw + 1, lpY, emptyBw - 2, barHeight)
      }
    }
    
    // Draw HP output section
    const hpY = 365
    const hpOutputCount = currentPhase === 'hp' ? Math.min(step - signalSize / 2 + 1, signalSize / 2) :
                          currentPhase === 'done' ? signalSize / 2 : 0
    const hpPartial = highPass.slice(0, hpOutputCount)
    
    // Draw HP bars (labels moved to HTML)
    if (hpPartial.length > 0) {
      if (usePlot && currentPhase === 'done') {
        drawLinePlot(hpPartial, hpY, '#ff6b9d', [])
      } else {
        drawBar(hpPartial, hpY, '#ff6b9d', '', currentPhase === 'hp' ? step - signalSize / 2 : -1, [], true)
      }
    } else {
      ctx.fillStyle = '#1a1a2e'
      const emptyBw = (width - 2 * margin) / (signalSize / 2)
      for (let i = 0; i < signalSize / 2; i++) {
        ctx.fillRect(margin + i * emptyBw + 1, hpY, emptyBw - 2, barHeight)
      }
    }
    
    // Draw flow arrows when animating
    if (currentPhase !== 'idle') {
      ctx.strokeStyle = '#ffaa00'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      
      const arrowStartX = margin + kernelPos * barWidth + (filter.h0.length * barWidth) / 2
      const arrowEndX = margin + (kernelPos / 2) * ((width - 2 * margin) / (signalSize / 2)) + ((width - 2 * margin) / (signalSize / 2)) / 2
      
      ctx.beginPath()
      ctx.moveTo(arrowStartX, 25 + barHeight + 3)
      if (currentPhase === 'lp') {
        ctx.lineTo(arrowEndX, lpY - 3)
      } else if (currentPhase === 'hp') {
        ctx.lineTo(arrowEndX, hpY - 3)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }
    
    // Status/progress bar background (status text moved to HTML)
    const statusY = height - 35
    ctx.fillStyle = '#222'
    ctx.fillRect(margin, statusY, width - 2 * margin, 25)
    
    // Progress fill
    const progress = totalSteps > 0 ? step / totalSteps : 0
    ctx.fillStyle = currentPhase === 'hp' ? '#ff6b9d33' : '#00ff8833'
    ctx.fillRect(margin, statusY, (width - 2 * margin) * progress, 25)
    
  }, [signal, step, currentPhase, kernelPos, filter, signalSize, lowPass, highPass, totalSteps, useHeatmap, usePlot])
  
  const handleReset = () => {
    setStep(0)
    setKernelPos(0)
    setCurrentPhase('idle')
    setIsPlaying(false)
  }
  
  const handleStepBack = () => {
    if (step <= 0) return
    const prev = step - 1
    setStep(prev)
    if (prev === 0) {
      setCurrentPhase('idle')
      setKernelPos(0)
    } else if (prev <= signalSize / 2) {
      setCurrentPhase('lp')
      setKernelPos((prev - 1) * 2)
    } else {
      setCurrentPhase('hp')
      setKernelPos((prev - 1 - signalSize / 2) * 2)
    }
  }
  
  const handleStep = () => {
    if (step >= totalSteps) return
    const next = step + 1
    setStep(next)
    if (next <= signalSize / 2) {
      setCurrentPhase('lp')
      setKernelPos((next - 1) * 2)
    } else {
      setCurrentPhase('hp')
      setKernelPos((next - 1 - signalSize / 2) * 2)
    }
    if (next >= totalSteps) {
      setCurrentPhase('done')
    }
  }
  
  return (
    <div className={`mallat-1d-edu ${compact ? 'compact' : ''}`}>
      <div className="mallat-1d-main">
        {/* Title and formula */}
        <div className="mallat-1d-header">
          <h3>Descompunere Mallat 1D</h3>
          <div className="mallat-formula">
            <LaTeX math={String.raw`L[k] = \sum_{n} x[n] \cdot h_0[n-2k] \quad H[k] = \sum_{n} x[n] \cdot h_1[n-2k]`} />
          </div>
        </div>
        
        {/* Canvas visualization with HTML overlays */}
        <div className="mallat-1d-canvas-container">
          <div className="mallat-1d-canvas-wrapper">
            {/* Labels as HTML overlays - positions as percentages for scaling */}
            <div className="canvas-labels">
              <div className="signal-label" style={{top: '1%', color: '#00d4ff'}}>
                Semnal original x[n] <span style={{color: '#888'}}>({signalSize} valori)</span>
              </div>
              
              <div className="signal-label" style={{top: '28%', color: '#00ff88'}}>
                L (Aproximare) <span style={{color: '#888'}}>- frecvențe joase, {signalSize/2} valori</span>
              </div>
              
              <div className="signal-label" style={{top: '55%', color: '#ff6b9d'}}>
                H (Detalii) <span style={{color: '#888'}}>- frecvențe înalte, {signalSize/2} valori</span>
              </div>
              
              {/* Formulas info below all graphs - stacked with even spacing */}
              <div className="graph-info" style={{top: '83%'}}>
                <span style={{color: '#00ff88', fontWeight: 'bold'}}>Low-Pass h₀:</span>
                <span style={{color: '#aaa', marginLeft: '6px'}}>
                  {filterType === 'haar' ? 'L[k] = (a + b) / √2  →  MEDIE' : 'Media ponderată pe 4 valori'}
                </span>
                <span style={{color: '#aaa', marginLeft: '6px', fontStyle: 'italic'}}>
                  ({filter.lpExplain})
                </span>
              </div>
              <div className="graph-info" style={{top: '88%'}}>
                <span style={{color: '#ff6b9d', fontWeight: 'bold'}}>High-Pass h₁:</span>
                <span style={{color: '#aaa', marginLeft: '6px'}}>
                  {filterType === 'haar' ? 'H[k] = (a - b) / √2  →  DIFERENȚĂ' : 'Diferență ponderată pe 4 valori'}
                </span>
                <span style={{color: '#aaa', marginLeft: '6px', fontStyle: 'italic'}}>
                  ({filter.hpExplain})
                </span>
              </div>
              
              <div className="status-label" style={{bottom: '2%'}}>
                {currentPhase === 'idle' && '⏸ Apasă Play pentru a vedea descompunerea pas cu pas'}
                {currentPhase === 'lp' && `▶ Etapa 1/2: Filtrare Low-Pass + Decimare (${step}/${signalSize/2})`}
                {currentPhase === 'hp' && `▶ Etapa 2/2: Filtrare High-Pass + Decimare (${step - signalSize/2}/${signalSize/2})`}
                {currentPhase === 'done' && '✓ Complet! x[n] → [L, H] cu jumătate din dimensiune fiecare'}
              </div>
            </div>
            
            <canvas 
              ref={canvasRef} 
              width={750} 
              height={620}
            />
          </div>
        </div>
        
        {/* Animation Controls */}
        <div className="mallat-1d-controls">
          <button 
            className={`ctrl-btn ${isPlaying ? 'stop' : 'play'}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸ Pauză' : '▶ Play'}
          </button>
          <button 
            className="ctrl-btn back"
            onClick={handleStepBack}
            disabled={isPlaying || step <= 0}
          >
            ⏮ Înapoi
          </button>
          <button 
            className="ctrl-btn step"
            onClick={handleStep}
            disabled={isPlaying || step >= totalSteps}
          >
            ⏭ Înainte
          </button>
          <button className="ctrl-btn reset" onClick={handleReset}>
            🔄 Reset
          </button>
        </div>
        
        {/* Input Controls - Bottom */}
        <div className="mallat-1d-input-controls">
          <div className="input-group">
            <label>Semnal:</label>
            <select value={signalType} onChange={e => { setSignalType(e.target.value); handleReset() }}>
              <option value="step">Treaptă</option>
              <option value="ramp">Rampă</option>
              <option value="sine">Sinusoidă</option>
              <option value="pulse">Puls</option>
            </select>
          </div>
          
          <div className="input-group">
            <label>Dim: {signalSize}</label>
            <input 
              type="range" 
              min="8" 
              max="32" 
              step="8"
              value={signalSize}
              onChange={e => { setSignalSize(parseInt(e.target.value)); handleReset() }}
            />
          </div>
          
          <div className="input-group">
            <label>Filtru:</label>
            <select value={filterType} onChange={e => { setFilterType(e.target.value); handleReset() }}>
              {Object.entries(FILTERS).map(([key, f]) => (
                <option key={key} value={key}>{f.name}</option>
              ))}
            </select>
          </div>
          
          <div className="input-group checkboxes">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={usePlot}
                onChange={e => setUsePlot(e.target.checked)}
              />
              📈 Grafic
            </label>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={useHeatmap}
                onChange={e => setUseHeatmap(e.target.checked)}
              />
              🎨 Heatmap
            </label>
          </div>
        </div>
      </div>
      
      {/* Sidebar - Explanations Only */}
      <div className="mallat-1d-sidebar">
        <div className="sidebar-info">
          <h4>🎯 Ce este Descompunerea Mallat?</h4>
          <p>Este <strong>baza transformatei wavelet</strong> - separă semnalul în două părți:</p>
          <p style={{marginTop: '0.5rem'}}><strong style={{color: '#00ff88'}}>L (Low-pass)</strong> = Aproximarea (blur)</p>
          <p>Păstrează forma generală, elimină detaliile fine</p>
          <p style={{marginTop: '0.5rem'}}><strong style={{color: '#ff6b9d'}}>H (High-pass)</strong> = Detaliile (muchii)</p>
          <p>Captează schimbările bruște, zero în zone uniforme</p>
        </div>
        
        <div className="sidebar-info" style={{background: 'rgba(255, 170, 0, 0.05)', borderColor: 'rgba(255, 170, 0, 0.2)'}}>
          <h4 style={{color: '#ffaa00'}}>🎬 Ce arată animația?</h4>
          <p>1. <strong style={{color: '#ffaa00'}}>Punctele portocalii</strong> = fereastra filtrului</p>
          <p>2. Înmulțește valorile cu coeficienții și sumează</p>
          <p>3. Rezultatul → o valoare în L sau H</p>
          <p>4. <strong>Decimare ↓2</strong>: fereastra sare 2 poziții</p>
          <p style={{marginTop: '0.5rem', color: '#ffd700'}}>⚡ Rezultat: L și H au <u>jumătate</u> din valori!</p>
        </div>
        
        <div className="sidebar-info" style={{background: 'rgba(0, 255, 136, 0.05)', borderColor: 'rgba(0, 255, 136, 0.2)'}}>
          <h4 style={{color: '#00ff88'}}>📊 Cum interpretăm?</h4>
          <p><strong>Treaptă:</strong> H are spike la muchie, 0 altfel</p>
          <p><strong>Rampă:</strong> H constant (schimbare uniformă)</p>
          <p><strong>Sinusoidă:</strong> L = frecvența joasă, H = oscilații</p>
          <p><strong>Puls:</strong> H are spike-uri la ambele muchii</p>
        </div>
        
        <div className="sidebar-info" style={{background: 'rgba(0, 212, 255, 0.05)', borderColor: 'rgba(0, 212, 255, 0.2)'}}>
          <h4 style={{color: '#00d4ff'}}>🖼️ Extensia la 2D (Imagini)</h4>
          <p>Aplicăm Mallat 1D de <strong>două ori</strong>:</p>
          <p>1. Pe fiecare <strong>rând</strong> → L și H orizontal</p>
          <p>2. Pe fiecare <strong>coloană</strong> → L și H vertical</p>
          <p style={{marginTop: '0.5rem'}}>Rezultat: 4 sub-imagini de dimensiune ¼:</p>
          <p><strong>LL</strong>=blur, <strong>LH</strong>=muchii orizontale</p>
          <p><strong>HL</strong>=muchii verticale, <strong>HH</strong>=colțuri</p>
        </div>
      </div>
    </div>
  )
}
