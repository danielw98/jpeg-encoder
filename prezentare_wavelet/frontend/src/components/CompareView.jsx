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
    { id: 'bior4.4', name: 'Biorthogonal 9/7 (JPEG2000)' },
    { id: 'bior2.2', name: 'Biorthogonal 5/3' },
    { id: 'db4', name: 'Daubechies 4' },
    { id: 'db8', name: 'Daubechies 8' },
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

  // Auto-run when imageId changes
  useEffect(() => {
    if (imageId) {
      handleCompare()
    }
  }, [imageId])

  return (
    <div className="view-container">
      <div className="panel">
        <h2>⚖️ DCT (JPEG) vs Wavelet (JPEG2000)</h2>
        
        <div className="info-box math-block">
          <h4>Why Compare?</h4>
          <p>
            <strong>DCT/JPEG:</strong> Procesează blocuri 8×8 independent → 
            artefacte de blocare la calitate scăzută.
          </p>
          <p>
            <strong>Wavelet/JPEG2000:</strong> Descompunere globală multi-rezoluție → 
            tranziții mai line, fără artefacte de bloc.
          </p>
          <div className="math-equation">
            <strong>PSNR:</strong>
            <LaTeXBlock math={String.raw`\text{PSNR} = 10 \cdot \log_{10}\left(\frac{\text{MAX}^2}{\text{MSE}}\right) \text{ dB}`} />
          </div>
        </div>

        <div className="controls-grid">
          <div className="control-group">
            <label>Quality: {quality}</label>
            <input
              type="range"
              min="5"
              max="95"
              value={quality}
              onChange={e => setQuality(parseInt(e.target.value))}
            />
            <div className="range-labels">
              <span>5 (Low)</span>
              <span>95 (High)</span>
            </div>
          </div>

          <div className="control-group">
            <label>Wavelet Family</label>
            <select value={wavelet} onChange={e => setWavelet(e.target.value)}>
              {wavelets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Decomposition Levels: {levels}</label>
            <input
              type="range"
              min="2"
              max="6"
              value={levels}
              onChange={e => setLevels(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="action-bar">
          <button 
            className="primary-btn"
            onClick={handleCompare} 
            disabled={!imageId || loading}
          >
            {loading ? '⏳ Comparing...' : '⚖️ Run Comparison'}
          </button>
          
          <div className="image-selector-inline">
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
        </div>
      </div>

      {error && <div className="error-message">❌ {error}</div>}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Running DCT and Wavelet compression...</p>
        </div>
      )}

      {result && (
        <>
          <div className="panel">
            <h3>Results at Quality = {quality}</h3>
            
            <div className="comparison-grid">
              <div className="comparison-card">
                <h4>Original</h4>
                <img 
                  src={`data:image/png;base64,${result.original}`} 
                  alt="Original"
                />
              </div>
              
              <div className="comparison-card">
                <h4>DCT (JPEG-style)</h4>
                <img 
                  src={`data:image/png;base64,${result.dct_result}`} 
                  alt="DCT"
                />
                <div className="metrics-bar">
                  <div className="metric">
                    <span className="metric-label">PSNR</span>
                    <span className="metric-value">{result.metrics.dct.psnr.toFixed(2)} dB</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">MSE</span>
                    <span className="metric-value">{result.metrics.dct.mse.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="comparison-card">
                <h4>Wavelet ({wavelet})</h4>
                <img 
                  src={`data:image/png;base64,${result.wavelet_result}`} 
                  alt="Wavelet"
                />
                <div className="metrics-bar">
                  <div className="metric">
                    <span className="metric-label">PSNR</span>
                    <span className="metric-value">{result.metrics.wavelet.psnr.toFixed(2)} dB</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">MSE</span>
                    <span className="metric-value">{result.metrics.wavelet.mse.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel result-panel">
            <h3>📊 Analysis</h3>
            <div className={`verdict ${result.metrics.wavelet.psnr > result.metrics.dct.psnr ? 'wavelet-wins' : 'dct-wins'}`}>
              {result.metrics.wavelet.psnr > result.metrics.dct.psnr ? (
                <>
                  <span className="winner">✅ Wavelet Wins</span>
                  <span className="difference">
                    +{(result.metrics.wavelet.psnr - result.metrics.dct.psnr).toFixed(2)} dB PSNR
                  </span>
                </>
              ) : (
                <>
                  <span className="winner">📦 DCT Wins</span>
                  <span className="difference">
                    +{(result.metrics.dct.psnr - result.metrics.wavelet.psnr).toFixed(2)} dB PSNR
                  </span>
                </>
              )}
            </div>
            
            <div className="analysis-notes">
              <p>
                <strong>🔍 What to look for:</strong>
              </p>
              <ul>
                <li>DCT: Blocking artifacts at block boundaries (especially at low quality)</li>
                <li>DCT: Ringing around sharp edges</li>
                <li>Wavelet: Smoother gradients across the entire image</li>
                <li>Wavelet: Better edge preservation without blocking</li>
              </ul>
              <p className="tip">
                💡 <strong>Tip:</strong> Lower the quality to 20-30 to see the difference more clearly!
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
