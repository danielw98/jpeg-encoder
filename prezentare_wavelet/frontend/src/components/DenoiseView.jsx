import { useState, useEffect } from 'react'
import axios from 'axios'
import { LaTeXBlock } from './LaTeX'

export default function DenoiseView({ api, imageId, sampleImages = [], onImageChange }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [wavelet, setWavelet] = useState('db4')
  const [levels, setLevels] = useState(3)
  const [mode, setMode] = useState('soft')
  const [noiseSigma, setNoiseSigma] = useState(25)

  const wavelets = [
    { id: 'haar', name: 'Haar' },
    { id: 'db4', name: 'Daubechies 4' },
    { id: 'db8', name: 'Daubechies 8' },
    { id: 'sym4', name: 'Symlet 4' },
    { id: 'coif2', name: 'Coiflet 2' }
  ]

  const handleDenoise = async () => {
    if (!imageId) return
    
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        wavelet,
        levels: levels.toString(),
        mode,
        add_noise: 'true',
        noise_sigma: noiseSigma.toString()
      })

      const response = await axios.get(
        `${api}/denoise-sample/${imageId}?${params}`
      )

      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (imageId) {
      handleDenoise()
    }
  }, [imageId])

  return (
    <div className="denoise-practical-view">
      {/* Controls row */}
      <div className="denoise-controls-row">
        <div className="control-group">
          <label>Wavelet</label>
          <select value={wavelet} onChange={e => setWavelet(e.target.value)}>
            {wavelets.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Nivele: {levels}</label>
          <input
            type="range"
            min="1"
            max="4"
            value={levels}
            onChange={e => setLevels(parseInt(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>Threshold</label>
          <select value={mode} onChange={e => setMode(e.target.value)}>
            <option value="soft">Soft</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="control-group">
          <label>Zgomot σ: {noiseSigma}</label>
          <input
            type="range"
            min="5"
            max="50"
            value={noiseSigma}
            onChange={e => setNoiseSigma(parseInt(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>Imagine</label>
          <select 
            value={imageId} 
            onChange={e => onImageChange?.(e.target.value)}
          >
            {sampleImages.map(img => (
              <option key={img.id} value={img.id}>{img.name}</option>
            ))}
          </select>
        </div>

        <button className={`denoise-btn ${loading ? 'loading' : ''}`} onClick={handleDenoise} disabled={loading}>
          🔇 Aplică
        </button>
      </div>

      {error && <div className="error">❌ {error}</div>}

      {result && (
        <div className={`denoise-results ${loading ? 'loading' : ''}`}>
          {/* Images row */}
          <div className="denoise-images">
            <div className="denoise-image-card">
              <h4>Original</h4>
              <div className="img-wrapper">
                <img 
                  src={`data:image/png;base64,${result.original}`} 
                  alt="Original"
                />
              </div>
            </div>
            
            {result.noisy && (
              <div className="denoise-image-card">
                <h4>Cu zgomot (σ={noiseSigma})</h4>
                <div className="img-wrapper">
                  <img 
                    src={`data:image/png;base64,${result.noisy}`} 
                    alt="Noisy"
                  />
                </div>
                <div className="img-metric">SNR: {result.snr_before?.toFixed(1)} dB</div>
              </div>
            )}
            
            <div className="denoise-image-card">
              <h4>Denoised ({mode})</h4>
              <div className="img-wrapper">
                <img 
                  src={`data:image/png;base64,${result.denoised}`} 
                  alt="Denoised"
                />
              </div>
              <div className="img-metric success">SNR: {result.snr_after?.toFixed(1)} dB (+{result.snr_improvement?.toFixed(1)})</div>
            </div>
          </div>

          {/* Stats row */}
          <div className="denoise-stats">
            <div className="stat-item">
              <span className="stat-label">σ estimat</span>
              <span className="stat-value">{result.estimated_sigma.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Prag</span>
              <span className="stat-value">{result.threshold_used.toFixed(2)}</span>
            </div>
            <div className="stat-item success">
              <span className="stat-label">Îmbunătățire</span>
              <span className="stat-value">+{result.snr_improvement?.toFixed(2) || 0} dB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
