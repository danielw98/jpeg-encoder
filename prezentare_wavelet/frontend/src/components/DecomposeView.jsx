import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { LaTeXBlock } from './LaTeX'

export default function DecomposeView({ api, imageId, sampleImages = [], onImageChange }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [wavelet, setWavelet] = useState('db4')
  const [levels, setLevels] = useState(3)

  const wavelets = [
    { id: 'haar', name: 'Haar' },
    { id: 'db4', name: 'Daubechies 4' },
    { id: 'db8', name: 'Daubechies 8' },
    { id: 'bior2.2', name: 'Biorthogonal 5/3 (JPEG2000 lossless)' },
    { id: 'bior4.4', name: 'Biorthogonal 9/7 (JPEG2000 lossy)' },
    { id: 'sym4', name: 'Symlet 4' },
    { id: 'coif2', name: 'Coiflet 2' }
  ]

  const handleDecompose = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(
        `${api}/decompose-sample/${imageId}?wavelet=${wavelet}&levels=${levels}`
      )
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-decompose when imageId changes
  useEffect(() => {
    if (imageId) {
      handleDecompose()
    }
  }, [imageId])

  return (
    <div>
      <div className="panel">
        <h2>🔬 Descompunere Mallat (2D DWT)</h2>
        
        <div className="info-box">
          <p>
            <strong>Algoritmul Mallat</strong> aplică succesiv filtre low-pass și high-pass 
            pe rânduri și coloane, urmată de subsampling 2:1. La fiecare nivel obținem:
          </p>
          <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
            <li><strong>LL</strong> - Aproximație (low-low) → se descompune mai departe</li>
            <li><strong>LH</strong> - Detalii orizontale (low-high)</li>
            <li><strong>HL</strong> - Detalii verticale (high-low)</li>
            <li><strong>HH</strong> - Detalii diagonale (high-high)</li>
          </ul>
        </div>

        <div className="math-block">
          <LaTeXBlock math={String.raw`\text{Nivel } n: LL_n \rightarrow \{LL_{n+1}, LH_{n+1}, HL_{n+1}, HH_{n+1}\}`} />
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
              max="5"
              value={levels}
              onChange={e => setLevels(parseInt(e.target.value))}
            />
          </div>

          <button onClick={handleDecompose} disabled={loading}>
            {loading ? '⏳ Processing...' : '🔬 Descompune'}
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
          Procesare descompunere wavelet...
        </div>
      )}

      {result && (
        <>
          <div className="panel">
            <h3>Rezultate - {wavelet}, {levels} nivele</h3>
            
            <div className="image-grid">
              <div className="image-card">
                <h4>Original</h4>
                <img 
                  src={`data:image/png;base64,${result.original}`} 
                  alt="Original" 
                />
                <p>Dimensiune: {result.original_shape.join(' × ')}</p>
              </div>
              
              <div className="image-card">
                <h4>Compozit Wavelet</h4>
                <img 
                  src={`data:image/png;base64,${result.composite}`} 
                  alt="Composite"
                />
                <p>Toate subbenzile vizualizate</p>
              </div>
            </div>
          </div>

          <div className="panel">
            <h3>📊 Subbenzile Individuale</h3>
            
            <div className="info-box" style={{ marginBottom: '1rem' }}>
              <strong>Interpretare:</strong> Coeficienții mari (alb) indică prezența 
              caracteristicilor corespunzătoare: LH=muchii orizontale, HL=muchii verticale, 
              HH=texturi diagonale. LL conține "miniatura" imaginii.
            </div>
            
            <div className="subband-grid">
              {Object.entries(result.subbands).map(([name, data]) => (
                <div key={name} className="subband-item">
                  <h4>{name}</h4>
                  <img 
                    src={`data:image/png;base64,${data.image}`} 
                    alt={name}
                  />
                  <p>{data.shape.join(' × ')}</p>
                  {data.energy !== undefined && (
                    <p style={{ color: 'var(--primary)' }}>
                      E: {data.energy.toExponential(1)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>📈 Concentrarea Energiei</h2>
            
            <div className="info-box success">
              <p>
                <strong>Proprietate cheie pentru compresie:</strong> Majoritatea energiei 
                semnalului se concentrează în subbanda LL (aproximație). Subbenzile de detaliu 
                conțin valori mici care pot fi cuantizate agresiv sau eliminate.
              </p>
            </div>
            
            <div className="image-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {Object.entries(result.subbands)
                .sort((a, b) => (b[1].energy || 0) - (a[1].energy || 0))
                .slice(0, 4)
                .map(([name, data]) => (
                  <div key={name} className="metric" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{name}</div>
                    <div style={{ fontSize: '0.9rem' }}>
                      {data.energy ? data.energy.toExponential(2) : 'N/A'}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </>
      )}
    </div>
  )
}
