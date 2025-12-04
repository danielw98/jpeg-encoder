import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { LaTeXBlock } from './LaTeX'

// Signal presets with more distinct frequencies
const SIGNAL_PRESETS = [
  { id: '5+50', label: '5Hz + 50Hz', expr: 'sin(2*pi*5*t) + sin(2*pi*50*t)', freqs: [5, 50] },
  { id: '3+15+40', label: '3Hz + 15Hz + 40Hz', expr: 'sin(2*pi*3*t) + sin(2*pi*15*t) + sin(2*pi*40*t)', freqs: [3, 15, 40] },
  { id: '5+20+50', label: '5Hz + 20Hz + 50Hz', expr: 'sin(2*pi*5*t) + sin(2*pi*20*t) + sin(2*pi*50*t)', freqs: [5, 20, 50] },
  { id: 'chirp', label: 'Chirp', expr: 'sin(2*pi*(5 + 30*t)*t)', freqs: [] },
]

// Max frequency to display on graphs
const MAX_FREQ_DISPLAY = 100  // Hz

// Default values for reset
const DEFAULTS = {
  filterType: 'lowpass',
  cutoffHz: 30,
  lowCutoffHz: 20,
  highCutoffHz: 60,
  shape: 'butterworth',
  order: 4,
  selectedPreset: '5+50'
}

// Filter equations
const FILTER_EQUATIONS = {
  ideal: {
    lowpass: String.raw`H(f) = \begin{cases} 1, & |f| \leq f_c \\ 0, & |f| > f_c \end{cases}`,
    highpass: String.raw`H(f) = \begin{cases} 0, & |f| \leq f_c \\ 1, & |f| > f_c \end{cases}`,
    bandpass: String.raw`H(f) = \begin{cases} 1, & f_L \leq |f| \leq f_H \\ 0, & \text{otherwise} \end{cases}`
  },
  butterworth: {
    lowpass: String.raw`H(f) = \frac{1}{\sqrt{1 + \left(\frac{f}{f_c}\right)^{2n}}}`,
    highpass: String.raw`H(f) = \frac{1}{\sqrt{1 + \left(\frac{f_c}{f}\right)^{2n}}}`,
    bandpass: String.raw`H(f) = H_{LP}(f_H) \cdot H_{HP}(f_L)`
  },
  gaussian: {
    lowpass: String.raw`H(f) = e^{-\frac{f^2}{2f_c^2}}`,
    highpass: String.raw`H(f) = 1 - e^{-\frac{f^2}{2f_c^2}}`,
    bandpass: String.raw`H(f) = e^{-\frac{(f - f_0)^2}{2\sigma^2}}`
  }
}

export default function FiltersView({ api, compact = false }) {
  // Filter parameters - now in Hz!
  const [filterType, setFilterType] = useState(DEFAULTS.filterType)
  const [cutoffHz, setCutoffHz] = useState(DEFAULTS.cutoffHz)  // For low/high pass
  const [lowCutoffHz, setLowCutoffHz] = useState(DEFAULTS.lowCutoffHz)  // For bandpass
  const [highCutoffHz, setHighCutoffHz] = useState(DEFAULTS.highCutoffHz)  // For bandpass
  const [shape, setShape] = useState(DEFAULTS.shape)
  const [order, setOrder] = useState(DEFAULTS.order)  // Butterworth order
  
  // Signal parameters
  const [selectedPreset, setSelectedPreset] = useState(DEFAULTS.selectedPreset)
  const [expression, setExpression] = useState(SIGNAL_PRESETS[0].expr)
  
  // Data
  const [filterData, setFilterData] = useState(null)
  const [signalData, setSignalData] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // Canvas refs
  const canvasFilterRef = useRef()
  const canvasSignalRef = useRef()  // Combined original + filtered
  const canvasSpectrumRef = useRef()
  
  // Container refs for responsive sizing
  const filterContainerRef = useRef()
  const signalContainerRef = useRef()
  const spectrumContainerRef = useRef()

  // Reset to defaults
  const resetToDefaults = () => {
    setFilterType(DEFAULTS.filterType)
    setCutoffHz(DEFAULTS.cutoffHz)
    setLowCutoffHz(DEFAULTS.lowCutoffHz)
    setHighCutoffHz(DEFAULTS.highCutoffHz)
    setShape(DEFAULTS.shape)
    setOrder(DEFAULTS.order)
    setSelectedPreset(DEFAULTS.selectedPreset)
    setExpression(SIGNAL_PRESETS[0].expr)
  }

  // Fetch filter response - send Hz directly
  const fetchFilter = useCallback(async () => {
    try {
      if (filterType === 'bandpass') {
        const res = await axios.get(`${api}/filters/bandpass`, {
          params: { 
            low_cutoff_hz: lowCutoffHz, 
            high_cutoff_hz: highCutoffHz, 
            filter_type: shape, 
            order: order,
            max_freq_hz: 100 
          }
        })
        setFilterData(res.data)
      } else {
        const endpoint = filterType === 'lowpass' ? 'lowpass' : 'highpass'
        const res = await axios.get(`${api}/filters/${endpoint}`, {
          params: { cutoff_hz: cutoffHz, filter_type: shape, order: order, max_freq_hz: 100 }
        })
        setFilterData(res.data)
      }
    } catch (err) {
      console.error('Filter fetch error:', err)
    }
  }, [api, filterType, cutoffHz, lowCutoffHz, highCutoffHz, shape, order])

  // Apply filter to signal - send Hz directly
  const applyFilter = useCallback(async (expr) => {
    setLoading(true)
    try {
      const params = { 
        expression: expr, 
        filter_type: filterType, 
        cutoff_hz: cutoffHz 
      }
      // Add bandpass-specific parameters
      if (filterType === 'bandpass') {
        params.low_cutoff_hz = lowCutoffHz
        params.high_cutoff_hz = highCutoffHz
      }
      const res = await axios.get(`${api}/filters/apply-signal`, { params })
      setSignalData(res.data)
    } catch (err) {
      console.error('Filter apply error:', err)
    } finally {
      setLoading(false)
    }
  }, [api, filterType, cutoffHz, lowCutoffHz, highCutoffHz])

  // Auto-update when any parameter changes
  useEffect(() => {
    fetchFilter()
    applyFilter(expression)
  }, [filterType, cutoffHz, lowCutoffHz, highCutoffHz, shape, order, expression])

  // Draw filter response
  useEffect(() => {
    if (filterData) drawFilter()
  }, [filterData, cutoffHz, lowCutoffHz, highCutoffHz, filterType])

  // Draw signals
  useEffect(() => {
    if (signalData) {
      drawSignalComparison()
      drawSpectrum()
    }
  }, [signalData, filterType, cutoffHz, lowCutoffHz, highCutoffHz])

  // Handle resize for responsive canvases
  useEffect(() => {
    const handleResize = () => {
      if (filterData) drawFilter()
      if (signalData) {
        drawSignalComparison()
        drawSpectrum()
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    if (filterContainerRef.current) resizeObserver.observe(filterContainerRef.current)
    if (signalContainerRef.current) resizeObserver.observe(signalContainerRef.current)
    if (spectrumContainerRef.current) resizeObserver.observe(spectrumContainerRef.current)

    return () => resizeObserver.disconnect()
  }, [filterData, signalData])

  // Handle preset selection
  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId)
    const preset = SIGNAL_PRESETS.find(p => p.id === presetId)
    if (preset) {
      setExpression(preset.expr)
    }
  }

  const drawFilter = () => {
    const canvas = canvasFilterRef.current
    if (!canvas || !filterData) return
    
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
    
    const { f, response } = filterData.frequency
    const margin = compact ? 40 : 50
    const maxFreqDisplay = 100  // Show up to 100 Hz
    
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, width, height)
    
    // Grid - horizontal lines
    ctx.strokeStyle = '#1a1a3a'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = margin + (i * (height - 2 * margin)) / 4
      ctx.beginPath()
      ctx.moveTo(margin, y)
      ctx.lineTo(width - margin, y)
      ctx.stroke()
    }
    
    // Grid - vertical lines with frequency ticks
    const freqTicks = [0, 25, 50, 75, 100]
    ctx.strokeStyle = '#1a1a3a'
    for (const tick of freqTicks) {
      const x = margin + (tick / maxFreqDisplay) * (width - 2 * margin)
      ctx.beginPath()
      ctx.moveTo(x, margin)
      ctx.lineTo(x, height - margin)
      ctx.stroke()
    }
    
    // Draw frequency tick labels
    ctx.fillStyle = '#aaaacc'
    ctx.font = `bold ${compact ? 10 : 11}px Inter, sans-serif`
    ctx.textAlign = 'center'
    for (const tick of freqTicks) {
      const x = margin + (tick / maxFreqDisplay) * (width - 2 * margin)
      ctx.fillText(`${tick}`, x, height - margin + 12)
    }
    
    // Cutoff line(s) (in Hz)
    ctx.strokeStyle = '#ffaa00'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    
    if (filterType === 'bandpass') {
      // Two cutoff lines for bandpass
      const lowX = margin + (lowCutoffHz / maxFreqDisplay) * (width - 2 * margin)
      const highX = margin + (highCutoffHz / maxFreqDisplay) * (width - 2 * margin)
      ctx.beginPath()
      ctx.moveTo(lowX, margin)
      ctx.lineTo(lowX, height - margin)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(highX, margin)
      ctx.lineTo(highX, height - margin)
      ctx.stroke()
    } else {
      const cutoffX = margin + (cutoffHz / maxFreqDisplay) * (width - 2 * margin)
      ctx.beginPath()
      ctx.moveTo(cutoffX, margin)
      ctx.lineTo(cutoffX, height - margin)
      ctx.stroke()
    }
    ctx.setLineDash([])
    
    // Filter response - backend returns frequencies in Hz directly
    const filterColor = filterType === 'lowpass' ? '#00ff88' : 
                        filterType === 'highpass' ? '#ff6b9d' : '#9d4edd'
    ctx.strokeStyle = filterColor
    ctx.lineWidth = 3
    ctx.beginPath()
    
    for (let i = 0; i < f.length; i++) {
      const freqHz = f[i]  // Already in Hz from backend
      if (freqHz > maxFreqDisplay) continue
      const x = margin + (freqHz / maxFreqDisplay) * (width - 2 * margin)
      const y = height - margin - response[i] * (height - 2 * margin)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    // Labels rendered as HTML overlays
  }

  // Combined signal comparison - original and filtered on same plot
  const drawSignalComparison = () => {
    const canvas = canvasSignalRef.current
    if (!canvas || !signalData) return
    
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
    
    const margin = compact ? 35 : 40
    
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, width, height)
    
    const { t, original, filtered } = signalData.time
    
    // Find range for both signals
    const allVals = [...original, ...filtered]
    const min = Math.min(...allVals) - 0.2
    const max = Math.max(...allVals) + 0.2
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
    
    // Zero line
    const zeroY = height - margin - ((0 - min) / range) * (height - 2 * margin)
    ctx.strokeStyle = '#4a4a6a'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin, zeroY)
    ctx.lineTo(width - margin, zeroY)
    ctx.stroke()
    
    // Original signal - cyan (draw first, slightly transparent)
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < t.length; i++) {
      const x = margin + (t[i] / t[t.length - 1]) * (width - 2 * margin)
      const y = height - margin - ((original[i] - min) / range) * (height - 2 * margin)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    
    // Filtered signal - color based on filter type
    const filteredColor = filterType === 'lowpass' ? '#00ff88' : 
                          filterType === 'highpass' ? '#ff6b9d' : '#9d4edd'
    ctx.strokeStyle = filteredColor
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let i = 0; i < t.length; i++) {
      const x = margin + (t[i] / t[t.length - 1]) * (width - 2 * margin)
      const y = height - margin - ((filtered[i] - min) / range) * (height - 2 * margin)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    // Labels rendered as HTML overlays
  }

  const drawSpectrum = () => {
    const canvas = canvasSpectrumRef.current
    if (!canvas || !signalData) return
    
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
    
    const margin = compact ? 35 : 40
    const maxFreqDisplay = 100  // Show up to 100 Hz
    
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, width, height)
    
    // Check if frequency data exists
    if (!signalData.frequency) return
    
    const { f: freqsHz, original_magnitude, filtered_magnitude } = signalData.frequency
    
    // Backend now returns frequencies in Hz directly - no conversion needed
    
    // Find max for normalization
    const maxOrig = Math.max(...original_magnitude)
    const maxFilt = Math.max(...filtered_magnitude)
    const maxVal = Math.max(maxOrig, maxFilt, 0.1)
    
    // Grid - horizontal
    ctx.strokeStyle = '#1a1a3a'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = margin + (i * (height - 2 * margin)) / 4
      ctx.beginPath()
      ctx.moveTo(margin, y)
      ctx.lineTo(width - margin, y)
      ctx.stroke()
    }
    
    // Grid - vertical with frequency ticks
    const freqTicks = [0, 25, 50, 75, 100]
    for (const tick of freqTicks) {
      const x = margin + (tick / maxFreqDisplay) * (width - 2 * margin)
      ctx.beginPath()
      ctx.moveTo(x, margin)
      ctx.lineTo(x, height - margin)
      ctx.stroke()
    }
    
    // Draw frequency tick labels
    ctx.fillStyle = '#aaaacc'
    ctx.font = `bold ${compact ? 10 : 11}px Inter, sans-serif`
    ctx.textAlign = 'center'
    for (const tick of freqTicks) {
      const x = margin + (tick / maxFreqDisplay) * (width - 2 * margin)
      ctx.fillText(`${tick}`, x, height - margin + 12)
    }
    
    // Cutoff line(s) in spectrum (in Hz)
    ctx.strokeStyle = '#ffaa00'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    
    if (filterType === 'bandpass') {
      const lowX = margin + (lowCutoffHz / maxFreqDisplay) * (width - 2 * margin)
      const highX = margin + (highCutoffHz / maxFreqDisplay) * (width - 2 * margin)
      ctx.beginPath()
      ctx.moveTo(lowX, margin)
      ctx.lineTo(lowX, height - margin)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(highX, margin)
      ctx.lineTo(highX, height - margin)
      ctx.stroke()
    } else {
      const cutoffX = margin + (cutoffHz / maxFreqDisplay) * (width - 2 * margin)
      ctx.beginPath()
      ctx.moveTo(cutoffX, margin)
      ctx.lineTo(cutoffX, height - margin)
      ctx.stroke()
    }
    ctx.setLineDash([])
    
    // Draw original spectrum as bars (in Hz)
    ctx.fillStyle = 'rgba(0, 217, 255, 0.4)'
    for (let i = 0; i < freqsHz.length; i++) {
      const freqHz = freqsHz[i]
      if (freqHz > maxFreqDisplay) continue
      const x = margin + (freqHz / maxFreqDisplay) * (width - 2 * margin)
      const barHeight = (original_magnitude[i] / maxVal) * (height - 2 * margin)
      const barWidth = (width - 2 * margin) / (maxFreqDisplay / 2)  // Approximate bar width
      ctx.fillRect(x - barWidth/2, height - margin - barHeight, barWidth, barHeight)
    }
    
    // Draw filtered spectrum as filled area on top
    const filteredColor = filterType === 'lowpass' ? '#00ff88' : 
                          filterType === 'highpass' ? '#ff6b9d' : '#9d4edd'
    ctx.fillStyle = filterType === 'lowpass' ? 'rgba(0, 255, 136, 0.5)' : 
                    filterType === 'highpass' ? 'rgba(255, 107, 157, 0.5)' : 'rgba(157, 78, 221, 0.5)'
    ctx.beginPath()
    ctx.moveTo(margin, height - margin)
    for (let i = 0; i < freqsHz.length; i++) {
      const freqHz = freqsHz[i]
      if (freqHz > maxFreqDisplay) continue
      const x = margin + (freqHz / maxFreqDisplay) * (width - 2 * margin)
      const y = height - margin - (filtered_magnitude[i] / maxVal) * (height - 2 * margin)
      ctx.lineTo(x, y)
    }
    ctx.lineTo(margin + (width - 2 * margin), height - margin)
    ctx.closePath()
    ctx.fill()
    
    // Filtered spectrum outline
    ctx.strokeStyle = filteredColor
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < freqsHz.length; i++) {
      const freqHz = freqsHz[i]
      if (freqHz > maxFreqDisplay) continue
      const x = margin + (freqHz / maxFreqDisplay) * (width - 2 * margin)
      const y = height - margin - (filtered_magnitude[i] / maxVal) * (height - 2 * margin)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    // Labels rendered as HTML overlays
  }

  return (
    <div className={`filters-view ${compact ? 'compact-mode' : ''}`}>
      {/* Non-compact header and intro */}
      {!compact && (
        <>
          <div className="panel">
            <h2>🔧 Filtre în Domeniul Frecvență</h2>
            
            <div className="info-box">
              <p>
                <strong>Filtrele</strong> modifică semnalul în funcție de frecvență. 
                Ajustează parametrii și vezi rezultatul în timp real!
              </p>
            </div>

            <div className="math-block">
              <LaTeXBlock math={String.raw`Y(f) = H(f) \cdot X(f)`} />
            </div>
          </div>

          {/* Controls Panel */}
          <div className="panel">
            <h3>⚙️ Parametri Filtru</h3>
            
            <div className="filter-controls-grid">
              {/* Filter Type Toggle */}
              <div className="control-section">
                <label>Tip Filtru</label>
                <div className="button-group">
                  <button 
                    className={filterType === 'lowpass' ? 'active success' : ''}
                    onClick={() => setFilterType('lowpass')}
                  >
                    Low-Pass
                  </button>
                  <button 
                    className={filterType === 'highpass' ? 'active danger' : ''}
                    onClick={() => setFilterType('highpass')}
                  >
                    High-Pass
                  </button>
                </div>
              </div>
              
              {/* Filter Shape */}
              <div className="control-section">
                <label>Formă Filtru</label>
                <div className="button-group">
                  {['ideal', 'butterworth', 'gaussian'].map(s => (
                    <button 
                      key={s}
                      className={shape === s ? 'active' : ''}
                      onClick={() => setShape(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Cutoff Slider - now in Hz */}
              <div className="control-section full-width">
                <label>
                  Frecvență Cutoff: <strong style={{ color: '#ffaa00' }}>{cutoffHz} Hz</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    (frecvențe {filterType === 'lowpass' ? '< ' : '> '}{cutoffHz} Hz trec)
                  </span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={cutoffHz}
                  onChange={e => setCutoffHz(parseInt(e.target.value))}
                  className="slider-wide"
                />
                <div className="slider-labels">
                  <span>5 Hz (joasă)</span>
                  <span>100 Hz (înaltă)</span>
                </div>
              </div>
              
              {/* Signal Preset */}
              <div className="control-section full-width">
                <label>Semnal de Test:</label>
                <div className="button-group preset-buttons">
                  {SIGNAL_PRESETS.map(p => (
                    <button 
                      key={p.id}
                      className={selectedPreset === p.id ? 'active' : ''}
                      onClick={() => handlePresetChange(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Filter Equation */}
            <div className="math-block compact">
              <LaTeXBlock math={FILTER_EQUATIONS[shape][filterType]} />
            </div>
          </div>
        </>
      )}

      {/* COMPACT MODE LAYOUT */}
      {compact ? (
        <div className="filters-compact-layout">
          {/* Top row: Filter Response + Frequency Spectrum side by side */}
          <div className="filters-top-row">
            <div className="plot-container-with-overlay" ref={filterContainerRef}>
              <canvas ref={canvasFilterRef} />
              <div className="plot-title-overlay" style={{ 
                color: filterType === 'lowpass' ? '#00ff88' : 
                       filterType === 'highpass' ? '#ff6b9d' : '#9d4edd' 
              }}>
                {filterType === 'lowpass' ? 'Low-Pass' : 
                 filterType === 'highpass' ? 'High-Pass' : 'Band-Pass'} 
                {shape === 'butterworth' ? ` (n=${order})` : ` (${shape})`}
              </div>
              <div className="plot-axis-label y-label">H(f)</div>
              <div className="plot-axis-label x-label">f (Hz)</div>
            </div>
            
            <div className="plot-container-with-overlay" ref={spectrumContainerRef}>
              <canvas ref={canvasSpectrumRef} />
              <div className="plot-title-overlay yellow">Spectru Frecvență</div>
              <div className="plot-legend-overlay">
                <span style={{ color: 'rgba(0, 217, 255, 0.7)' }}>■ Original</span>
                <span style={{ 
                  color: filterType === 'lowpass' ? '#00ff88' : 
                         filterType === 'highpass' ? '#ff6b9d' : '#9d4edd' 
                }}>■ Filtrat</span>
              </div>
              <div className="plot-axis-label y-label">|F|</div>
              <div className="plot-axis-label x-label">f (Hz)</div>
            </div>
          </div>
          
          {/* Bottom row: Comparison plot + Controls */}
          <div className="filters-bottom-row">
            <div className="plot-container-with-overlay" ref={signalContainerRef}>
              <canvas ref={canvasSignalRef} />
              <div className="plot-title-overlay white">Comparație: Original vs Filtrat</div>
              <div className="plot-legend-overlay">
                <span style={{ color: 'rgba(0, 217, 255, 0.9)' }}>— Original</span>
                <span style={{ color: filterType === 'lowpass' ? '#00ff88' : '#ff6b9d' }}>
                  — Filtrat ({filterType === 'lowpass' ? 'LP' : filterType === 'highpass' ? 'HP' : 'BP'} 
                    {filterType === 'bandpass' ? `${lowCutoffHz}-${highCutoffHz}` : cutoffHz}Hz)
                </span>
              </div>
              <div className="plot-axis-label y-label">Amp</div>
              <div className="plot-axis-label x-label">t (s)</div>
            </div>
            
            {/* Inline Controls Panel */}
            <div className="filters-inline-controls">
              <div className="controls-header">
                <h4>⚙️ Parametri</h4>
                <button className="reset-btn" onClick={resetToDefaults} title="Reset la valori implicite">↺</button>
              </div>
              
              <div className="control-row">
                <label>Tip filtru:</label>
                <div className="button-group mini">
                  <button 
                    className={filterType === 'lowpass' ? 'active success' : ''}
                    onClick={() => setFilterType('lowpass')}
                    title="Low-Pass"
                  >
                    LP
                  </button>
                  <button 
                    className={filterType === 'highpass' ? 'active danger' : ''}
                    onClick={() => setFilterType('highpass')}
                    title="High-Pass"
                  >
                    HP
                  </button>
                  <button 
                    className={filterType === 'bandpass' ? 'active bandpass' : ''}
                    onClick={() => setFilterType('bandpass')}
                    title="Band-Pass"
                  >
                    BP
                  </button>
                </div>
              </div>
              
              <div className="control-row">
                <label>Formă:</label>
                <select value={shape} onChange={e => setShape(e.target.value)}>
                  <option value="ideal">Ideal</option>
                  <option value="butterworth">Butterworth</option>
                  <option value="gaussian">Gaussian</option>
                </select>
              </div>
              
              {/* Butterworth order selector */}
              {shape === 'butterworth' && (
                <div className="control-row">
                  <label>Ordin n: <strong>{order}</strong></label>
                  <div className="order-buttons">
                    {[1, 2, 4, 8].map(n => (
                      <button 
                        key={n}
                        className={order === n ? 'active' : ''}
                        onClick={() => setOrder(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Cutoff controls - different for bandpass */}
              {filterType === 'bandpass' ? (
                <>
                  <div className="control-row">
                    <label>f<sub>L</sub>: <strong>{lowCutoffHz} Hz</strong></label>
                    <input
                      type="range"
                      min="5"
                      max={highCutoffHz - 5}
                      step="5"
                      value={lowCutoffHz}
                      onChange={e => setLowCutoffHz(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="control-row">
                    <label>f<sub>H</sub>: <strong>{highCutoffHz} Hz</strong></label>
                    <input
                      type="range"
                      min={lowCutoffHz + 5}
                      max="95"
                      step="5"
                      value={highCutoffHz}
                      onChange={e => setHighCutoffHz(parseInt(e.target.value))}
                    />
                  </div>
                </>
              ) : (
                <div className="control-row">
                  <label>Cutoff: <strong>{cutoffHz} Hz</strong></label>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    step="5"
                    value={cutoffHz}
                    onChange={e => setCutoffHz(parseInt(e.target.value))}
                  />
                </div>
              )}
              
              <div className="control-row">
                <label>Semnal:</label>
                <select value={selectedPreset} onChange={e => handlePresetChange(e.target.value)}>
                  {SIGNAL_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* NON-COMPACT MODE - Original vertical layout */}
          {/* Visualization Panel - Filter Response */}
          <div className="panel">
            <h3>📉 Răspunsul Filtrului H(f)</h3>
            <div className="plot-container-with-overlay" ref={filterContainerRef}>
              <canvas ref={canvasFilterRef} />
              <div className="plot-title-overlay" style={{ color: filterType === 'lowpass' ? '#00ff88' : '#ff6b9d' }}>
                {filterType === 'lowpass' ? 'Low-Pass' : 'High-Pass'} Filter ({shape})
              </div>
              <div className="plot-axis-label y-label">H(f)</div>
              <div className="plot-axis-label x-label">f (Hz)</div>
            </div>
          </div>

          {/* Signal Comparison - Combined plot */}
          <div className="panel">
            <h3>🔬 Comparație Semnale (domeniu timp)</h3>
            <div className="plot-container-with-overlay" ref={signalContainerRef}>
              <canvas ref={canvasSignalRef} />
              <div className="plot-title-overlay white">Comparație: Original vs Filtrat</div>
              <div className="plot-legend-overlay">
                <span style={{ color: 'rgba(0, 217, 255, 0.9)' }}>— Original</span>
                <span style={{ color: filterType === 'lowpass' ? '#00ff88' : '#ff6b9d' }}>
                  — Filtrat ({filterType === 'lowpass' ? 'LP' : 'HP'} {cutoffHz}Hz)
                </span>
              </div>
              <div className="plot-axis-label y-label">Amp</div>
              <div className="plot-axis-label x-label">t (s)</div>
            </div>
          </div>

          {/* Frequency Spectrum */}
          <div className="panel">
            <h3>📊 Spectru Frecvență (ce frecvențe sunt tăiate)</h3>
            <div className="plot-container-with-overlay" ref={spectrumContainerRef}>
              <canvas ref={canvasSpectrumRef} />
              <div className="plot-title-overlay yellow">Spectru Frecvență (ce frecvențe rămân)</div>
              <div className="plot-legend-overlay">
                <span style={{ color: 'rgba(0, 217, 255, 0.7)' }}>■ Original</span>
                <span style={{ color: filterType === 'lowpass' ? '#00ff88' : '#ff6b9d' }}>■ Filtrat</span>
              </div>
              <div className="plot-axis-label y-label">|F|</div>
              <div className="plot-axis-label x-label">f (Hz)</div>
            </div>
            <div className={`info-box ${filterType === 'lowpass' ? 'success' : 'warning'}`}>
              <strong>Rezultat:</strong> {filterType === 'lowpass' 
                ? `Low-pass păstrează frecvențele < ${cutoffHz} Hz → semnal mai neted, fără oscilații rapide`
                : `High-pass păstrează frecvențele > ${cutoffHz} Hz → rămân doar oscilațiile rapide`}
            </div>
          </div>
        </>
      )}

      {/* Connection to Wavelets - hide in compact mode */}
      {!compact && (
        <div className="panel collapsible">
          <h2>🔗 Conexiunea cu Wavelets</h2>
          
          <div className="info-box">
            <p>
              <strong>Filter banks</strong> sunt fundamentul transformatei wavelet discrete!
            </p>
            <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
              <li><strong>Filtru low-pass (h)</strong> → Coeficienți de aproximație (LL)</li>
              <li><strong>Filtru high-pass (g)</strong> → Coeficienți de detaliu (LH, HL, HH)</li>
            </ul>
          </div>

          <div className="math-block">
            <LaTeXBlock math={String.raw`a[n] = \sum_k h[k] \cdot x[2n - k] \quad \text{(low-pass)}`} />
            <LaTeXBlock math={String.raw`d[n] = \sum_k g[k] \cdot x[2n - k] \quad \text{(high-pass)}`} />
          </div>
        </div>
      )}
    </div>
  )
}
