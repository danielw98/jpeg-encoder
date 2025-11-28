import { useState, useEffect } from 'react'
import axios from 'axios'
import { LaTeXBlock } from './LaTeX'

export default function DenoiseView({ api, imageId, sampleImages = [], onImageChange }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [wavelet, setWavelet] = useState('db4')
  const [levels, setLevels] = useState(4)
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
    <div>
      <div className="panel">
        <h2>🔇 Wavelet Denoising</h2>
        
        <div className="info-box">
          <p>
            <strong>Denoising prin thresholding:</strong> Zgomotul produce coeficienți 
            wavelet mici, în timp ce semnalul util produce coeficienți mari. 
            Prin eliminarea/atenuarea coeficienților sub un prag, păstrăm semnalul.
          </p>
        </div>

        <div className="math-block">
          <strong>Soft thresholding:</strong>
          <LaTeXBlock math={String.raw`\eta_s(x, \lambda) = \text{sign}(x) \cdot \max(|x| - \lambda, 0)`} />
          <strong>Hard thresholding:</strong>
          <LaTeXBlock math={String.raw`\eta_h(x, \lambda) = x \cdot \mathbb{1}(|x| > \lambda)`} />
        </div>
      </div>

      <div className="panel">
        <h3>⚙️ Parametri</h3>
        
        <div className="controls">
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
              max="6"
              value={levels}
              onChange={e => setLevels(parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Mod threshold</label>
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="soft">Soft (shrinkage continuu)</option>
              <option value="hard">Hard (eliminare bruscă)</option>
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

          <button onClick={handleDenoise} disabled={loading}>
            {loading ? '⏳ Processing...' : '🔇 Aplică Denoising'}
          </button>
        </div>
        
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

      {error && <div className="error">❌ {error}</div>}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Procesare denoising...
        </div>
      )}

      {result && (
        <>
          <div className="panel">
            <h3>Rezultate</h3>
            
            <div className="image-grid">
              <div className="image-card">
                <h4>Original</h4>
                <img 
                  src={`data:image/png;base64,${result.original}`} 
                  alt="Original"
                />
              </div>
              
              {result.noisy && (
                <div className="image-card">
                  <h4>Cu zgomot (σ = {noiseSigma})</h4>
                  <img 
                    src={`data:image/png;base64,${result.noisy}`} 
                    alt="Noisy"
                  />
                  {result.snr_before && (
                    <div className="metrics">
                      <div className="metric">SNR: <span>{result.snr_before.toFixed(2)} dB</span></div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="image-card">
                <h4>Denoised ({mode})</h4>
                <img 
                  src={`data:image/png;base64,${result.denoised}`} 
                  alt="Denoised"
                />
                {result.snr_after && (
                  <div className="metrics">
                    <div className="metric">SNR: <span>{result.snr_after.toFixed(2)} dB</span></div>
                    <div className="metric" style={{ background: 'rgba(0,255,136,0.2)' }}>
                      +{result.snr_improvement.toFixed(2)} dB
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="panel">
            <h3>📊 Statistici</h3>
            
            <div className="image-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="metric" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)' }}>σ estimat</div>
                <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {result.estimated_sigma.toFixed(2)}
                </div>
              </div>
              <div className="metric" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)' }}>Prag folosit</div>
                <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {result.threshold_used.toFixed(2)}
                </div>
              </div>
              <div className="metric" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)' }}>Îmbunătățire SNR</div>
                <div style={{ color: 'var(--success)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  +{result.snr_improvement?.toFixed(2) || 0} dB
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <h2>📚 Soft vs Hard Thresholding</h2>
            
            <div className="image-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="info-box success">
                <h4>Soft Thresholding</h4>
                <p>
                  Reduce continuu coeficienții spre zero. Produce rezultate mai netede,
                  evită artefacte de discontinuitate. <strong>Preferat în practică.</strong>
                </p>
              </div>
              <div className="info-box warning">
                <h4>Hard Thresholding</h4>
                <p>
                  Elimină complet coeficienții sub prag, păstrează exact pe cei mari.
                  Poate produce artefacte "ringing", dar păstrează mai bine muchiile.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
