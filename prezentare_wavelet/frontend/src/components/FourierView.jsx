import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { LaTeXBlock } from './LaTeX'

const PRESET_FUNCTIONS = [
  { label: 'Sinusoidă simplă', expr: 'sin(2*pi*5*t)' },
  { label: 'Două frecvențe', expr: 'sin(2*pi*5*t) + sin(2*pi*12*t)' },
  { label: 'Trei frecvențe', expr: 'sin(2*pi*3*t) + 0.5*sin(2*pi*10*t) + 0.3*sin(2*pi*25*t)' },
  { label: 'Chirp (frecvență variabilă)', expr: 'sin(2*pi*(5 + 20*t)*t)' },
  { label: 'Puls Gaussian', expr: 'exp(-50*(t-0.5)**2) * sin(2*pi*20*t)' },
  { label: 'Undă pătrată aprox.', expr: 'sin(2*pi*5*t) + sin(2*pi*15*t)/3 + sin(2*pi*25*t)/5' }
]

export default function FourierView({ api, compact = false }) {
  const [activePresetIndex, setActivePresetIndex] = useState(1)  // Default to "Două frecvențe"
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customExpression, setCustomExpression] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const canvasTimeRef = useRef()
  const canvasFreqRef = useRef()
  const timeContainerRef = useRef()
  const freqContainerRef = useRef()

  // Current expression being displayed
  const currentExpression = isCustomMode ? customExpression : PRESET_FUNCTIONS[activePresetIndex].expr

  const fetchFourier = async (expr) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${api}/fourier/function`, {
        params: { expression: expr, samples: 512, duration: 1.0 }
      })
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFourier(currentExpression)
  }, [])

  // Redraw when data changes or on resize
  useEffect(() => {
    if (data) {
      drawTimeDomain()
      drawFrequencyDomain()
    }
  }, [data])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (data) {
        drawTimeDomain()
        drawFrequencyDomain()
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    if (timeContainerRef.current) resizeObserver.observe(timeContainerRef.current)
    if (freqContainerRef.current) resizeObserver.observe(freqContainerRef.current)

    return () => resizeObserver.disconnect()
  }, [data])

  const drawTimeDomain = () => {
    const canvas = canvasTimeRef.current
    if (!canvas || !data) return
    
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
    
    const { t, signal } = data.time
    const margin = compact ? 35 : 50
    
    // Clear
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, width, height)
    
    // Grid - horizontal lines
    ctx.strokeStyle = '#1a1a3a'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = margin + (i * (height - 2 * margin)) / 4
      ctx.beginPath()
      ctx.moveTo(margin, y)
      ctx.lineTo(width - 15, y)
      ctx.stroke()
    }
    
    // Grid - vertical lines
    const maxTime = t[t.length - 1]
    const timeTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0].filter(tick => tick <= maxTime)
    for (const tick of timeTicks) {
      const x = margin + (tick / maxTime) * (width - margin - 15)
      ctx.beginPath()
      ctx.moveTo(x, margin)
      ctx.lineTo(x, height - margin)
      ctx.stroke()
    }
    
    // X-axis tick labels
    ctx.fillStyle = '#aaaacc'
    ctx.font = `bold ${compact ? 11 : 12}px Inter, sans-serif`
    ctx.textAlign = 'center'
    for (const tick of timeTicks) {
      const x = margin + (tick / maxTime) * (width - margin - 15)
      ctx.fillText(tick.toFixed(1), x, height - margin + 14)
    }
    
    // Signal range
    const min = Math.min(...signal)
    const max = Math.max(...signal)
    const range = max - min || 1
    
    // Y-axis labels
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    const ampTicks = [0, 0.25, 0.5, 0.75, 1.0]
    for (const tick of ampTicks) {
      const y = height - margin - tick * (height - 2 * margin)
      const ampValue = min + tick * (max - min)
      ctx.fillText(ampValue.toFixed(1), margin - 6, y)
    }
    
    // Draw signal
    ctx.strokeStyle = '#00d9ff'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    for (let i = 0; i < t.length; i++) {
      const x = margin + (t[i] / maxTime) * (width - margin - 15)
      const y = height - margin - ((signal[i] - min) / range) * (height - 2 * margin)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  const drawFrequencyDomain = () => {
    const canvas = canvasFreqRef.current
    if (!canvas || !data) return
    
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
    
    const { f, magnitude } = data.frequency
    const margin = compact ? 35 : 50
    
    // Clear
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, width, height)
    
    // Only show up to 50 Hz
    const maxFreq = 50
    const filteredIndices = f.map((freq, i) => ({ freq, mag: magnitude[i], i }))
      .filter(x => x.freq <= maxFreq && x.freq > 0)
    
    const rawMaxMag = Math.max(...filteredIndices.map(x => x.mag))
    
    // Round up to nice number for Y-axis
    const roundUpToNice = (val) => {
      if (val <= 0) return 1
      const mag = Math.pow(10, Math.floor(Math.log10(val)))
      const normalized = val / mag
      let nice
      if (normalized <= 1) nice = 1
      else if (normalized <= 2) nice = 2
      else if (normalized <= 5) nice = 5
      else nice = 10
      return nice * mag
    }
    const maxMag = roundUpToNice(rawMaxMag)
    
    // Peak detection
    const absoluteThreshold = rawMaxMag * 0.03
    const windowSize = 5
    const prominenceRatio = 1.5
    
    const significantPeaks = []
    for (let i = 0; i < filteredIndices.length; i++) {
      const curr = filteredIndices[i]
      if (curr.mag < absoluteThreshold) continue
      
      let neighborSum = 0
      let neighborCount = 0
      for (let j = Math.max(0, i - windowSize); j <= Math.min(filteredIndices.length - 1, i + windowSize); j++) {
        if (j !== i) {
          neighborSum += filteredIndices[j].mag
          neighborCount++
        }
      }
      const localAvg = neighborCount > 0 ? neighborSum / neighborCount : 0
      
      if (curr.mag > localAvg * prominenceRatio || curr.mag > rawMaxMag * 0.15) {
        significantPeaks.push(curr)
      }
    }
    
    // Grid - horizontal lines
    ctx.strokeStyle = '#1a1a3a'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = margin + (i * (height - 2 * margin)) / 4
      ctx.beginPath()
      ctx.moveTo(margin, y)
      ctx.lineTo(width - 15, y)
      ctx.stroke()
    }
    
    // Grid - vertical lines
    const freqTicks = [0, 10, 20, 30, 40, 50]
    for (const tick of freqTicks) {
      const x = margin + (tick / maxFreq) * (width - margin - 15)
      ctx.beginPath()
      ctx.moveTo(x, margin)
      ctx.lineTo(x, height - margin)
      ctx.stroke()
    }
    
    // X-axis tick labels
    ctx.fillStyle = '#aaaacc'
    ctx.font = `bold ${compact ? 11 : 12}px Inter, sans-serif`
    ctx.textAlign = 'center'
    for (const tick of freqTicks) {
      const x = margin + (tick / maxFreq) * (width - margin - 15)
      ctx.fillText(`${tick}`, x, height - margin + 14)
    }
    
    // Y-axis labels
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    const ampTicks = [0, 0.25, 0.5, 0.75, 1.0]
    for (const tick of ampTicks) {
      const y = height - margin - tick * (height - 2 * margin)
      const ampValue = tick * maxMag
      const label = maxMag >= 100 ? ampValue.toFixed(0) : maxMag >= 10 ? ampValue.toFixed(1) : ampValue.toFixed(2)
      ctx.fillText(label, margin - 6, y)
    }
    
    // Draw bars
    ctx.fillStyle = '#ff6b9d'
    const barWidth = Math.max(4, Math.min(8, (width - 2 * margin) / 60))
    
    for (const { freq, mag } of significantPeaks) {
      const x = margin + (freq / maxFreq) * (width - margin - 15)
      const barHeight = (mag / maxMag) * (height - 2 * margin)
      ctx.fillRect(x - barWidth/2, height - margin - barHeight, barWidth, barHeight)
    }
  }

  return (
    <div className={`fourier-view ${compact ? 'fourier-compact' : ''}`}>
      {/* Header - hidden in compact mode */}
      {!compact && (
        <div className="panel panel-compact">
          <h2>📊 Transformata Fourier</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Descompune un semnal în suma de sinusoide de diferite frecvențe
          </p>
          <div className="math-block" style={{ margin: '0' }}>
            <LaTeXBlock math={String.raw`F(\omega) = \int_{-\infty}^{\infty} f(t) \cdot e^{-i\omega t} \, dt`} />
          </div>
        </div>
      )}

      {error && <div className="error">❌ {error}</div>}

      {/* Only show loading on initial load when no data exists */}
      {loading && !data && (
        <div className="loading">
          <div className="spinner"></div>
          Calculez transformata Fourier...
        </div>
      )}

      {/* Compact mode: Side controls + plots + bottom equation */}
      {compact ? (
        <div className="fourier-compact-layout">
          {/* Main content: plots + equation */}
          <div className="fourier-main-content">
            {/* Plots */}
            {data && (
              <div className="fourier-plots">
                <div className="plot-container-with-overlay" ref={timeContainerRef}>
                  <canvas ref={canvasTimeRef} />
                  <div className="plot-title-overlay cyan">Domeniul Timp</div>
                  <div className="plot-axis-label y-label">f(t)</div>
                  <div className="plot-axis-label x-label">t (s)</div>
                </div>
                
                <div className="plot-container-with-overlay" ref={freqContainerRef}>
                  <canvas ref={canvasFreqRef} />
                  <div className="plot-title-overlay pink">Spectru Frecvență</div>
                  <div className="plot-axis-label y-label">|F(f)|</div>
                  <div className="plot-axis-label x-label">f (Hz)</div>
                </div>
              </div>
            )}

            {/* Bottom equation display */}
            <div className="fourier-equation-bar">
              {isCustomMode ? (
                <div className="custom-input-row">
                  <span>f(t) =</span>
                  <input
                    type="text"
                    value={customExpression}
                    onChange={e => setCustomExpression(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && customExpression.trim()) {
                        fetchFourier(customExpression)
                      }
                    }}
                    placeholder="introduceți funcția..."
                  />
                  <button 
                    onClick={() => customExpression.trim() && fetchFourier(customExpression)} 
                    disabled={loading || !customExpression.trim()}
                  >
                    {loading ? '⏳' : '▶️'}
                  </button>
                </div>
              ) : (
                <code>f(t) = {currentExpression}</code>
              )}
            </div>
          </div>

          {/* Side controls - RIGHT */}
          <div className="fourier-side-controls">
            <h4>Funcții Preset</h4>
            <div className="preset-buttons-vertical">
              {PRESET_FUNCTIONS.map((p, idx) => (
                <button
                  key={p.expr}
                  onClick={() => {
                    // Skip if already selected
                    if (!isCustomMode && activePresetIndex === idx) return
                    setActivePresetIndex(idx)
                    setIsCustomMode(false)
                    fetchFourier(p.expr)
                  }}
                  className={!isCustomMode && activePresetIndex === idx ? 'active' : ''}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => {
                  // Skip if already in custom mode
                  if (isCustomMode) return
                  setIsCustomMode(true)
                  const exprToUse = customExpression.trim() || currentExpression
                  setCustomExpression(exprToUse)
                  fetchFourier(exprToUse)
                }}
                className={isCustomMode ? 'active' : ''}
              >
                ✏️ Custom
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Full mode layout */
        <>
          {/* Visualization */}
          {data && (
            <div className="fourier-plots">
              <div className="plot-container-with-overlay" ref={timeContainerRef}>
                <canvas ref={canvasTimeRef} />
                <div className="plot-title-overlay cyan">Domeniul Timp</div>
                <div className="plot-axis-label y-label">f(t)</div>
                <div className="plot-axis-label x-label">t (s)</div>
              </div>
              
              <div className="plot-container-with-overlay" ref={freqContainerRef}>
                <canvas ref={canvasFreqRef} />
                <div className="plot-title-overlay pink">Spectru Frecvență</div>
                <div className="plot-axis-label y-label">|F(f)|</div>
                <div className="plot-axis-label x-label">f (Hz)</div>
              </div>
            </div>
          )}

          {/* Controls - full mode */}
          <div className="panel controls-panel">
            <div style={{ 
              textAlign: 'center', 
              padding: '0.5rem 1rem', 
              background: isCustomMode ? 'rgba(255, 107, 157, 0.1)' : 'rgba(0, 217, 255, 0.1)', 
              borderRadius: '6px', 
              marginBottom: '0.75rem',
              border: `1px solid ${isCustomMode ? 'rgba(255, 107, 157, 0.3)' : 'rgba(0, 217, 255, 0.3)'}`
            }}>
              {isCustomMode ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ff6b9d', fontFamily: 'monospace' }}>f(t) =</span>
                  <input
                    type="text"
                    value={customExpression}
                    onChange={e => setCustomExpression(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && customExpression.trim()) {
                        fetchFourier(customExpression)
                      }
                    }}
                    placeholder="introduceți funcția..."
                    style={{ 
                      flex: 1, 
                      maxWidth: '400px',
                      padding: '0.25rem 0.5rem', 
                      fontFamily: 'monospace',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255, 107, 157, 0.5)',
                      borderRadius: '4px',
                      color: '#ff6b9d'
                    }}
                    autoFocus
                  />
                  <button 
                    onClick={() => customExpression.trim() && fetchFourier(customExpression)} 
                    disabled={loading || !customExpression.trim()}
                  >
                    {loading ? '⏳' : '▶️'}
                  </button>
                </div>
              ) : (
                <code style={{ color: '#00d9ff', fontFamily: 'monospace' }}>
                  f(t) = {currentExpression}
                </code>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', justifyContent: 'center' }}>
              {PRESET_FUNCTIONS.map((p, idx) => (
                <button
                  key={p.expr}
                  onClick={() => {
                    // Skip if already selected
                    if (!isCustomMode && activePresetIndex === idx) return
                    setActivePresetIndex(idx)
                    setIsCustomMode(false)
                    fetchFourier(p.expr)
                  }}
                  className={!isCustomMode && activePresetIndex === idx ? 'active' : ''}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => {
                  // Skip if already in custom mode
                  if (isCustomMode) return
                  setIsCustomMode(true)
                  const exprToUse = customExpression.trim() || currentExpression
                  setCustomExpression(exprToUse)
                  fetchFourier(exprToUse)
                }}
                className={isCustomMode ? 'active' : ''}
              >
                ✏️ Personalizată
              </button>
            </div>
          </div>
        </>
      )}

      {/* Details section - hidden in compact mode */}
      {!compact && (
        <div className="panel details-panel">
          <h3>🎵 Interpretare</h3>
          
          <div className="image-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="info-box">
              <h4>Spike-uri în Spectru</h4>
              <p>
                Fiecare "spike" (vârf) în spectru corespunde unei componente sinusoidale 
                din semnal. Înălțimea spike-ului = amplitudinea componentei.
              </p>
            </div>
            
            <div className="info-box">
              <h4>Frecvență vs Timp</h4>
              <p>
                Un semnal cu frecvență constantă → spike ascuțit.<br/>
                Un chirp (frecvență variabilă) → spectru "împrăștiat".
              </p>
            </div>
          </div>

          <div className="info-box warning" style={{ marginTop: '1rem' }}>
            <strong>⚠️ Limitarea Fourier:</strong> Spectrul ne arată frecvențele prezente,
            dar nu <em>când</em> apar în semnal. Pentru semnale non-staționare (ex: chirp),
            această informație se pierde!
          </div>
        </div>
      )}
    </div>
  )
}
