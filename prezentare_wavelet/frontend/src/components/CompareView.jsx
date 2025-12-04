import { useState, useEffect } from 'react'
import axios from 'axios'
import { LaTeXBlock } from './LaTeX'

export default function CompareView({ api, imageId, sampleImages = [], onImageChange }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [quality, setQuality] = useState(50)
  const [wavelet, setWavelet] = useState('bior4.4')
  const [levels, setLevels] = useState(4)

  const wavelets = [
    { id: 'bior4.4', name: 'Biorthogonal 9/7' },
    { id: 'bior2.2', name: 'Biorthogonal 5/3' },
    { id: 'db4', name: 'Daubechies 4' },
    { id: 'haar', name: 'Haar' }
  ]

  const handleCompare = async () => {
    if (!imageId) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        quality: quality.toString(),
        wavelet,
        levels: levels.toString()
      })

      const response = await axios.get(
        `${api}/compare-sample/${imageId}?${params}`
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
      handleCompare()
    }
  }, [imageId])

  return (
    <div className="compare-view-compact">
      {/* Header with title */}
      <div className="compare-header">
        <h2>⚖️ DCT (JPEG) vs Wavelet (JPEG2000)</h2>
      </div>

      {/* Info and Tips Row */}
      <div className="info-tips-row">
        <div className="info-section">
          <div className="info-col">
            <strong style={{color: '#ff9f43'}}>DCT/JPEG:</strong> Blocuri 8×8 → artefacte de blocare
          </div>
          <div className="info-col">
            <strong style={{color: '#00d4ff'}}>Wavelet/JPEG2000:</strong> Global multi-rezoluție → fără blocuri
          </div>
          <div className="info-col">
            <LaTeXBlock math={String.raw`\text{PSNR} = 10 \log_{10}\frac{\text{MAX}^2}{\text{MSE}}`} />
          </div>
        </div>
        <div className="tips-section">
          <span>🔍 DCT: Artefacte de bloc la margini</span>
          <span>🌊 Wavelet: Gradienți fini, fără blocuri</span>
          <span>💡 Calitate 20-30 → diferențe vizibile!</span>
        </div>
      </div>

      {error && <div className="error-message compact">❌ {error}</div>}

      {/* Main Image Comparison Area */}
      <div className="comparison-main">
        {result && (
          <div className={`comparison-images ${loading ? 'loading' : ''}`}>
            <div className="comparison-card">
              <div className="card-header">Original</div>
              <img 
                src={`data:image/png;base64,${result.original}`} 
                alt="Original"
              />
            </div>
            
            <div className="comparison-card dct">
              <div className="card-header">
                DCT (JPEG)
                <span className="metric-inline">{result.metrics.dct.psnr.toFixed(1)} dB</span>
              </div>
              <img 
                src={`data:image/png;base64,${result.dct_result}`} 
                alt="DCT"
              />
            </div>
            
            <div className="comparison-card wavelet">
              <div className="card-header">
                Wavelet ({wavelet})
                <span className="metric-inline">{result.metrics.wavelet.psnr.toFixed(1)} dB</span>
              </div>
              <img 
                src={`data:image/png;base64,${result.wavelet_result}`} 
                alt="Wavelet"
              />
            </div>
          </div>
        )}

        {result && (
          <div className={`verdict-bar ${result.metrics.wavelet.psnr > result.metrics.dct.psnr ? 'wavelet-wins' : 'dct-wins'}`}>
            {result.metrics.wavelet.psnr > result.metrics.dct.psnr ? (
              <span>✅ Wavelet: +{(result.metrics.wavelet.psnr - result.metrics.dct.psnr).toFixed(2)} dB</span>
            ) : (
              <span>📦 DCT: +{(result.metrics.dct.psnr - result.metrics.wavelet.psnr).toFixed(2)} dB</span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="controls-bar">
        <div className="control-item">
          <label>🖼️ Imagine:</label>
          <select 
            value={imageId} 
            onChange={e => onImageChange?.(e.target.value)}
          >
            {sampleImages.map(img => (
              <option key={img.id} value={img.id}>{img.name}</option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label>Calitate: {quality}%</label>
          <input
            type="range"
            min="5"
            max="95"
            value={quality}
            onChange={e => setQuality(parseInt(e.target.value))}
          />
        </div>

        <div className="control-item">
          <label>Wavelet:</label>
          <select value={wavelet} onChange={e => setWavelet(e.target.value)}>
            {wavelets.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label>Nivele: {levels}</label>
          <input
            type="range"
            min="2"
            max="6"
            value={levels}
            onChange={e => setLevels(parseInt(e.target.value))}
          />
        </div>

        <button 
          className={`run-btn ${loading ? 'loading' : ''}`}
          onClick={handleCompare} 
          disabled={!imageId || loading}
        >
          ▶️ Run
        </button>
      </div>
    </div>
  )
}
