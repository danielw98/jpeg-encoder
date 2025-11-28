import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function SignalDemoView({ api }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [frequency, setFrequency] = useState(5)
  const [noiseLevel, setNoiseLevel] = useState(0.3)
  const [samples, setSamples] = useState(256)
  
  const canvasRef = useRef()

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        frequency: frequency.toString(),
        noise_level: noiseLevel.toString(),
        samples: samples.toString()
      })
      
      const response = await axios.get(`${api}/signal-demo?${params}`)
      setData(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (data && canvasRef.current) {
      drawSignals()
    }
  }, [data])

  const drawSignals = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    
    ctx.fillStyle = '#0f3460'
    ctx.fillRect(0, 0, width, height)
    
    const margin = 40
    const plotWidth = width - 2 * margin
    const plotHeight = (height - 4 * margin) / 3
    
    // Draw each signal
    const signals = [
      { data: data.signal, color: '#00d9ff', label: 'Original Signal' },
      { data: data.noisy, color: '#ff6b9d', label: 'Noisy Signal' },
      { data: data.denoised, color: '#00ff88', label: 'Denoised (Wavelet)' }
    ]
    
    signals.forEach((sig, idx) => {
      const yOffset = margin + idx * (plotHeight + margin)
      
      // Background
      ctx.fillStyle = '#16213e'
      ctx.fillRect(margin, yOffset, plotWidth, plotHeight)
      
      // Grid
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const y = yOffset + (plotHeight * i) / 4
        ctx.beginPath()
        ctx.moveTo(margin, y)
        ctx.lineTo(margin + plotWidth, y)
        ctx.stroke()
      }
      
      // Signal
      ctx.strokeStyle = sig.color
      ctx.lineWidth = 2
      ctx.beginPath()
      
      const min = Math.min(...sig.data)
      const max = Math.max(...sig.data)
      const range = max - min || 1
      
      sig.data.forEach((val, i) => {
        const x = margin + (i / sig.data.length) * plotWidth
        const y = yOffset + plotHeight - ((val - min) / range) * plotHeight * 0.9 - plotHeight * 0.05
        
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      
      // Label
      ctx.fillStyle = sig.color
      ctx.font = '14px sans-serif'
      ctx.fillText(sig.label, margin + 10, yOffset + 20)
    })
  }

  return (
    <div>
      <div className="panel">
        <h2>1D Signal Denoising Demo</h2>
        <p className="info-box">
          Demonstrație pe semnal 1D: zgomotul apare în coeficienții de detaliu 
          (frecvențe înalte). Thresholding-ul elimină componentele mici, 
          păstrând structura semnalului original.
        </p>

        <div className="controls">
          <div className="control-group">
            <label>Frequency: {frequency} Hz</label>
            <input
              type="range"
              min="1"
              max="20"
              value={frequency}
              onChange={e => setFrequency(parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Noise Level: {noiseLevel.toFixed(2)}</label>
            <input
              type="range"
              min="0.05"
              max="0.8"
              step="0.05"
              value={noiseLevel}
              onChange={e => setNoiseLevel(parseFloat(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Samples: {samples}</label>
            <input
              type="range"
              min="64"
              max="512"
              step="64"
              value={samples}
              onChange={e => setSamples(parseInt(e.target.value))}
            />
          </div>

          <button onClick={fetchData} disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Update'}
          </button>
        </div>
      </div>

      {error && <div className="error">❌ {error}</div>}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Processing signal...
        </div>
      )}

      {data && (
        <div className="panel">
          <h3>Signal Visualization</h3>
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            style={{ width: '100%', maxWidth: '800px', display: 'block', margin: '0 auto' }}
          />

          <div className="info-box" style={{ marginTop: '1rem' }}>
            <h4>Wavelet Coefficients</h4>
            <p>
              <strong>Approximation (low freq):</strong> {data.coefficients.approximation.length} samples
            </p>
            <p>
              <strong>Detail levels:</strong> {data.coefficients.details.map((d, i) => 
                `D${i + 1}: ${d.length}`
              ).join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
