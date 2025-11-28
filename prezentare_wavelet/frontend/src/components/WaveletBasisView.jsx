import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { LaTeXBlock } from './LaTeX'

export default function WaveletBasisView({ api }) {
  const [wavelet, setWavelet] = useState('db4')
  const [families, setFamilies] = useState({})
  const [basisData, setBasisData] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const canvasBasisRef = useRef()
  const canvasFiltersRef = useRef()

  useEffect(() => {
    axios.get(`${api}/wavelet-families`)
      .then(res => setFamilies(res.data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchBasis()
  }, [wavelet])

  const fetchBasis = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${api}/wavelet-basis`, {
        params: { wavelet, samples: 256 }
      })
      setBasisData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (basisData) {
      drawBasis()
      drawFilters()
    }
  }, [basisData])

  const drawBasis = () => {
    const canvas = canvasBasisRef.current
    if (!canvas || !basisData) return
    const ctx = canvas.getContext('2d')
    
    const width = canvas.width
    const height = canvas.height
    const margin = 40
    const midHeight = height / 2
    
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, width, height)
    
    const { x, scaling_function, wavelet_function } = basisData
    
    // Draw scaling function (top half)
    drawFunction(ctx, x, scaling_function, margin, margin, width - 2 * margin, midHeight - margin - 10, '#00ff88', 'φ(t) - Funcție de scalare (Low-pass)')
    
    // Draw wavelet function (bottom half)  
    drawFunction(ctx, x, wavelet_function, margin, midHeight + 10, width - 2 * margin, midHeight - margin - 10, '#ff6b9d', 'ψ(t) - Funcție wavelet (High-pass)')
  }

  const drawFunction = (ctx, x, y, startX, startY, w, h, color, title) => {
    // Background
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(startX - 5, startY - 5, w + 10, h + 10)
    
    // Grid
    ctx.strokeStyle = '#1a1a3a'
    ctx.lineWidth = 1
    const midY = startY + h / 2
    ctx.beginPath()
    ctx.moveTo(startX, midY)
    ctx.lineTo(startX + w, midY)
    ctx.stroke()
    
    // Function
    const min = Math.min(...y)
    const max = Math.max(...y)
    const range = max - min || 1
    
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    
    for (let i = 0; i < x.length; i++) {
      const px = startX + ((x[i] - x[0]) / (x[x.length - 1] - x[0])) * w
      const py = startY + h - ((y[i] - min) / range) * h
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    
    // Title
    ctx.fillStyle = color
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(title, startX + 10, startY + 20)
  }

  const drawFilters = () => {
    const canvas = canvasFiltersRef.current
    if (!canvas || !basisData) return
    const ctx = canvas.getContext('2d')
    
    const width = canvas.width
    const height = canvas.height
    const margin = 40
    
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, width, height)
    
    const { dec_lo, dec_hi, rec_lo, rec_hi } = basisData.filters
    
    const filters = [
      { data: dec_lo, color: '#00ff88', label: 'h₀ (dec low)' },
      { data: dec_hi, color: '#ff6b9d', label: 'h₁ (dec high)' },
      { data: rec_lo, color: '#00d9ff', label: 'g₀ (rec low)' },
      { data: rec_hi, color: '#ffaa00', label: 'g₁ (rec high)' }
    ]
    
    const barWidth = (width - 2 * margin) / (filters.length + 1)
    
    filters.forEach((f, idx) => {
      const startX = margin + idx * barWidth + barWidth * 0.5
      const centerY = height / 2
      
      // Find max for scaling
      const maxVal = Math.max(...f.data.map(Math.abs))
      const scale = (height / 2 - margin) / maxVal
      
      // Draw coefficients as bars
      const coeffWidth = barWidth * 0.8 / f.data.length
      
      f.data.forEach((val, i) => {
        const x = startX + i * coeffWidth
        const barH = Math.abs(val) * scale
        const y = val >= 0 ? centerY - barH : centerY
        
        ctx.fillStyle = f.color
        ctx.fillRect(x, y, coeffWidth - 1, barH)
      })
      
      // Label
      ctx.fillStyle = f.color
      ctx.font = '12px sans-serif'
      ctx.fillText(f.label, startX, height - 15)
    })
    
    // Center line
    ctx.strokeStyle = '#2a2a4a'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin, height / 2)
    ctx.lineTo(width - margin, height / 2)
    ctx.stroke()
    
    // Title
    ctx.fillStyle = '#8888aa'
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText('Coeficienții Filtrelor (Filter Bank)', margin, 25)
  }

  const popularWavelets = [
    { id: 'haar', name: 'Haar', desc: 'Cel mai simplu, discontinuu' },
    { id: 'db4', name: 'Daubechies 4', desc: 'Bun scop general' },
    { id: 'db8', name: 'Daubechies 8', desc: 'Mai neted, suport mai mare' },
    { id: 'sym4', name: 'Symlet 4', desc: 'Aproape simetric' },
    { id: 'coif2', name: 'Coiflet 2', desc: 'Funcție scalare simetrică' },
    { id: 'bior2.2', name: 'Bior 5/3', desc: 'JPEG2000 lossless' },
    { id: 'bior4.4', name: 'Bior 9/7', desc: 'JPEG2000 lossy' }
  ]

  return (
    <div className="wavelet-basis-view">
      <div className="panel">
        <h2>🌊 Funcții Wavelet de Bază</h2>
        
        <div className="info-box">
          <p>
            O <strong>wavelet</strong> este o funcție oscilantă localizată în timp.
            Împreună cu <strong>funcția de scalare</strong>, formează baza pentru 
            descompunerea multi-rezoluție.
          </p>
        </div>

        <div className="math-block">
          <LaTeXBlock math={String.raw`\psi_{a,b}(t) = \frac{1}{\sqrt{a}} \cdot \psi\left(\frac{t - b}{a}\right)`} />
          <br/>
          <span style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
            a = scalare (dilatare), b = translație (poziție)
          </span>
        </div>
      </div>

      <div className="panel">
        <h3>🔬 Selectează Wavelet</h3>
        
        <div className="controls" style={{ flexWrap: 'wrap' }}>
          {popularWavelets.map(w => (
            <button
              key={w.id}
              className={wavelet === w.id ? 'primary' : ''}
              onClick={() => setWavelet(w.id)}
              style={{ minWidth: '120px' }}
            >
              {w.name}
            </button>
          ))}
        </div>
        
        <div className="control-group" style={{ marginTop: '1rem' }}>
          <label>Sau alege din toate familiile:</label>
          <select value={wavelet} onChange={e => setWavelet(e.target.value)}>
            {Object.entries(families).map(([family, data]) => (
              <optgroup key={family} label={`${family} - ${data.description}`}>
                {data.wavelets.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Încărcare wavelet...
        </div>
      )}

      {basisData && (
        <>
          <div className="panel">
            <h3>📊 Funcțiile de Bază: {basisData.name}</h3>
            
            <div className="plot-container">
              <canvas ref={canvasBasisRef} width={700} height={400} />
            </div>
            
            <div className="image-grid" style={{ marginTop: '1rem', gridTemplateColumns: '1fr 1fr' }}>
              <div className="info-box success">
                <h4>φ(t) - Funcție de scalare</h4>
                <p>
                  Asociată cu <strong>filtrul low-pass</strong>. Captează componentele 
                  de frecvență joasă (aproximația).
                </p>
              </div>
              <div className="info-box" style={{ borderLeftColor: '#ff6b9d' }}>
                <h4>ψ(t) - Funcție wavelet</h4>
                <p>
                  Asociată cu <strong>filtrul high-pass</strong>. Captează detaliile 
                  (frecvențe înalte, muchii, tranziții).
                </p>
              </div>
            </div>
          </div>

          <div className="panel">
            <h3>🔧 Coeficienții Filtrelor</h3>
            
            <div className="plot-container">
              <canvas ref={canvasFiltersRef} width={700} height={250} />
            </div>
            
            <div className="info-box" style={{ marginTop: '1rem' }}>
              <strong>Filter Bank:</strong> Wavelets discrete folosesc perechi de filtre pentru 
              descompunere (h₀, h₁) și reconstrucție (g₀, g₁). Relația dintre ele asigură 
              reconstrucția perfectă.
            </div>
          </div>

          <div className="panel">
            <h3>📋 Proprietăți</h3>
            
            <div className="image-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="metric" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Lungime filtru</div>
                <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {basisData.properties.filter_length}
                </div>
              </div>
              <div className="metric" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Simetrie</div>
                <div style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                  {basisData.properties.symmetry}
                </div>
              </div>
              <div className="metric" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ortogonal</div>
                <div style={{ color: basisData.properties.orthogonal ? 'var(--success)' : 'var(--secondary)', fontSize: '1.1rem' }}>
                  {basisData.properties.orthogonal ? '✓ Da' : '✗ Nu'}
                </div>
              </div>
              <div className="metric" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Biortogonal</div>
                <div style={{ color: basisData.properties.biorthogonal ? 'var(--success)' : 'var(--secondary)', fontSize: '1.1rem' }}>
                  {basisData.properties.biorthogonal ? '✓ Da' : '✗ Nu'}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="panel">
        <h2>📚 Familii de Wavelets</h2>
        
        <div className="image-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="info-box">
            <h4 style={{ color: 'var(--primary)' }}>Daubechies (db)</h4>
            <p>
              Wavelets ortogonale cu suport compact. dbN are 2N coeficienți.
              Mai multe coeficienți = mai neted, dar suport mai mare.
            </p>
          </div>
          <div className="info-box">
            <h4 style={{ color: 'var(--primary)' }}>Symlets (sym)</h4>
            <p>
              Versiune "aproape simetrică" a Daubechies. 
              Simetria reduce artefactele la margini.
            </p>
          </div>
          <div className="info-box">
            <h4 style={{ color: 'var(--primary)' }}>Coiflets (coif)</h4>
            <p>
              Funcție de scalare aproape simetrică.
              Bune pentru detectarea caracteristicilor.
            </p>
          </div>
          <div className="info-box success">
            <h4>Biorthogonal (bior)</h4>
            <p>
              <strong>JPEG2000 folosește bior4.4 (9/7)!</strong><br/>
              Simetrice, reconstrucție perfectă, dar nu ortogonale.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
