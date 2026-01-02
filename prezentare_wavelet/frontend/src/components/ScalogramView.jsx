import { useState, useEffect, useRef, useMemo } from 'react'

export default function ScalogramView({ compact = false }) {
  const [signalType, setSignalType] = useState('chirp_am')
  const canvasRef = useRef(null)
  
  // Configuration
  const DURATION = 10
  const SAMPLES = 400
  
  // Generate signal
  const { t, data } = useMemo(() => {
    const tArr = Array.from({length: SAMPLES}, (_, i) => i / SAMPLES * DURATION)
    let dArr = []
    
    switch (signalType) {
      case 'chirp':
        // Constant amplitude chirp
        dArr = tArr.map(ti => Math.sin(2 * Math.PI * (1 + 0.4 * ti) * ti))
        break
      case 'chirp_am':
        // Chirp with envelope (Amplitude Modulation)
        dArr = tArr.map(ti => Math.sin(2 * Math.PI * (1 + 0.4 * ti) * ti) * Math.sin(Math.PI * ti / DURATION))
        break
      case 'bumps':
        // Bursts of different freq and amplitude
        dArr = tArr.map(ti => {
          if (ti > 1 && ti < 3) return 0.8 * Math.sin(2 * Math.PI * 5 * ti)
          if (ti > 4 && ti < 7) return 0.4 * Math.sin(2 * Math.PI * 2 * ti)
          if (ti > 8 && ti < 9) return 1.0 * Math.sin(2 * Math.PI * 8 * ti)
          return 0
        })
        break
      case 'step':
        // Frequency and Amplitude step
        dArr = tArr.map(ti => ti < 5 
          ? 0.3 * Math.sin(2 * Math.PI * 2 * ti) 
          : 0.9 * Math.sin(2 * Math.PI * 6 * ti))
        break
      case 'transient':
        // Sine with a sudden spike
        dArr = tArr.map(ti => Math.sin(2 * Math.PI * 2 * ti) * 0.2 + (Math.abs(ti - 5) < 0.1 ? 2 * Math.exp(-100*(ti-5)**2) : 0))
        break
      default:
        dArr = tArr.map(() => 0)
    }
    return { t: tArr, data: dArr }
  }, [signalType])

  // Compute CWT
  const cwt = useMemo(() => {
    const result = []
    const n = data.length
    // Scales: logarithmic
    const numScales = 60
    const scales = Array.from({length: numScales}, (_, i) => 0.1 * Math.pow(30, i/numScales))
    
    scales.forEach(a => {
      const row = []
      const windowSize = Math.floor(8 * a)
      
      for (let b = 0; b < n; b++) {
        let sum = 0
        // Optimization: only convolve where wavelet is non-negligible
        const start = Math.max(0, b - windowSize)
        const end = Math.min(n, b + windowSize)
        
        for (let i = start; i < end; i++) {
            const t_val = (i - b) / (SAMPLES/DURATION) // time difference in seconds
            const wa = t_val / a
            // Morlet wavelet (real part approx)
            const psi = Math.exp(-wa*wa/2) * Math.cos(5 * wa)
            sum += data[i] * psi
        }
        row.push(Math.abs(sum / Math.sqrt(a)))
      }
      result.push(row)
    })
    return result
  }, [data])

  // Draw Scalogram Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    
    const imgData = ctx.createImageData(W, H)
    const maxVal = Math.max(...cwt.flat()) || 1
    
    for (let y = 0; y < H; y++) {
      // Map y to scale index (inverted: y=0 is high freq/low scale)
      const scaleIdx = Math.floor((y / H) * cwt.length)
      const row = cwt[scaleIdx] || []
      
      for (let x = 0; x < W; x++) {
        const timeIdx = Math.floor((x / W) * SAMPLES)
        const val = (row[timeIdx] || 0) / maxVal
        
        // Color Map: Custom "Magma"-like
        // 0.0 -> Black/Purple
        // 0.5 -> Red/Orange
        // 1.0 -> Yellow/White
        
        let r, g, b
        if (val < 0.5) {
            // 0.0 (0,0,0) -> 0.5 (255, 0, 0)
            const t = val * 2
            r = 50 + 205 * t
            g = 0
            b = 50 + 50 * t
        } else {
            // 0.5 (255, 0, 0) -> 1.0 (255, 255, 0)
            const t = (val - 0.5) * 2
            r = 255
            g = 255 * t
            b = 100 * t
        }

        const idx = (y * W + x) * 4
        imgData.data[idx] = r
        imgData.data[idx+1] = g
        imgData.data[idx+2] = b
        imgData.data[idx+3] = 255
      }
    }
    ctx.putImageData(imgData, 0, 0)
  }, [cwt])

  // SVG Path for Signal
  const signalPath = useMemo(() => {
    const maxAmp = Math.max(...data.map(Math.abs)) || 1
    // Map data to SVG coordinates: 0..100 width, -1..1 height
    return data.map((v, i) => {
        const x = (i / (SAMPLES - 1)) * 100
        const y = 50 - (v / maxAmp) * 45 // Center at 50, scale to fit
        return `${i===0?'M':'L'} ${x} ${y}`
    }).join(' ')
  }, [data])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '0.5rem',
      padding: compact ? '0.25rem' : '0.5rem',
      background: '#0f0f1a',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: '#d500f9' }}>Scalograma (CWT)</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#888', fontSize: '0.9rem' }}>
          Analiză Timp-Frecvență cu amplitudine variabilă
        </p>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        gap: '1rem',
        minHeight: 0
      }}>
        {/* Visualization Column */}
        <div style={{
          flex: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          position: 'relative'
        }}>
          
          {/* Scalogram Container */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex' }}>
             {/* Y Axis Label */}
             <div style={{ 
                 writingMode: 'vertical-rl', 
                 transform: 'rotate(180deg)', 
                 textAlign: 'center', 
                 fontSize: '0.8rem', 
                 color: '#aaa',
                 marginRight: '5px'
             }}>
                 Frecvență (Scală)
             </div>
             
             <div style={{ position: 'relative', flex: 1, border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
                <canvas 
                  ref={canvasRef}
                  width={600}
                  height={300}
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
                {/* HTML Overlays for Grid/Labels could go here */}
                <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                    High Freq
                </div>
                <div style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                    Low Freq
                </div>
             </div>
             
             {/* Color Legend Bar */}
             <div style={{ width: '20px', marginLeft: '5px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <div style={{ fontSize: '0.7rem', marginBottom: '2px' }}>Max</div>
                 <div style={{ 
                     flex: 1, 
                     width: '100%', 
                     background: 'linear-gradient(to top, rgb(255,255,0), rgb(255,0,0), rgb(50,0,50))',
                     borderRadius: '2px',
                     border: '1px solid #555'
                 }} />
                 <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>0</div>
             </div>
          </div>
          
          {/* Signal Container (SVG) */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
             <div style={{ width: '20px', marginRight: '5px' }}></div> {/* Spacer for alignment */}
             <div style={{ flex: 1, border: '1px solid #333', borderRadius: '4px', background: '#0a0a1a', position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#333" strokeWidth="0.5" />
                    <path d={signalPath} stroke="#00d4ff" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
                </svg>
                <div style={{ position: 'absolute', top: 5, left: 5, fontSize: '0.8rem', color: '#00d4ff' }}>
                    Semnal Intrare x(t)
                </div>
             </div>
             <div style={{ width: '20px', marginLeft: '5px' }}></div> {/* Spacer */}
          </div>

        </div>

        {/* Controls Column */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div className="control-group">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: '#aaa' }}>Tip Semnal</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                  { id: 'chirp', label: 'Chirp Simplu', desc: 'Frecvență crescătoare, amp. constantă' },
                  { id: 'chirp_am', label: 'Chirp Modulat (AM)', desc: 'Variază și frecvența și amplitudinea' },
                  { id: 'bumps', label: 'Bumps', desc: 'Pachete de frecvențe și amplitudini diferite' },
                  { id: 'step', label: 'Salt Frecvență', desc: 'Schimbare bruscă de regim' },
                  { id: 'transient', label: 'Tranzient', desc: 'Semnal continuu cu un spike' }
              ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSignalType(opt.id)}
                    className={signalType === opt.id ? 'active-btn' : 'btn'}
                    style={btnStyle(signalType === opt.id)}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{opt.desc}</div>
                  </button>
              ))}
            </div>
          </div>

          <div style={{
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            lineHeight: '1.3',
            marginTop: 'auto'
          }}>
            <h4 style={{ margin: '0 0 0.25rem', color: '#fff' }}>Legendă Culori</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                <div style={{ width: '100%', height: '10px', background: 'linear-gradient(to right, rgb(50,0,50), rgb(255,0,0), rgb(255,255,0))', borderRadius: '2px' }}></div>
            </div>
            <p style={{ margin: 0, color: '#ccc', fontSize: '0.85rem' }}>
              Culorile calde (Galben/Roșu) indică energie mare (rezonanță puternică între semnal și wavelet).
              Zonele întunecate indică lipsa acelei frecvențe.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const btnStyle = (active) => ({
  padding: '0.35rem',
  background: active ? 'rgba(213, 0, 249, 0.15)' : '#1a1a2e',
  border: `1px solid ${active ? '#d500f9' : '#333'}`,
  borderRadius: '6px',
  color: active ? '#d500f9' : '#888',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.2s',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
})
