import { useState, useEffect, useRef } from 'react'
import LaTeX from './LaTeX'

export default function HeisenbergBoxesView({ compact = false }) {
  const [mode, setMode] = useState('wavelet') // 'fourier', 'stft', 'wavelet'
  const canvasRef = useRef(null)
  const [hoverInfo, setHoverInfo] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    // Clear background
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, W, H)

    // Draw axes
    drawAxes(ctx, W, H)

    // Draw boxes based on mode
    if (mode === 'fourier') {
      drawFourier(ctx, W, H, mousePos)
    } else if (mode === 'stft') {
      drawSTFT(ctx, W, H, mousePos)
    } else if (mode === 'wavelet') {
      drawWavelet(ctx, W, H, mousePos)
    }

  }, [mode, mousePos])

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)
    setMousePos({ x, y })
  }

  const drawAxes = (ctx, W, H) => {
    const margin = 40
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 2
    
    // Y axis (Frequency)
    ctx.beginPath()
    ctx.moveTo(margin, H - margin)
    ctx.lineTo(margin, margin)
    ctx.stroke()
    
    // X axis (Time)
    ctx.beginPath()
    ctx.moveTo(margin, H - margin)
    ctx.lineTo(W - margin, H - margin)
    ctx.stroke()

    // Labels
    ctx.fillStyle = '#888'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Timp (t)', W / 2, H - 10)
    
    ctx.save()
    ctx.translate(15, H / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Frecvență (f)', 0, 0)
    ctx.restore()
  }

  const drawFourier = (ctx, W, H, mouse) => {
    const margin = 40
    const plotW = W - 2 * margin
    const plotH = H - 2 * margin
    
    const numFreqs = 8
    const h = plotH / numFreqs

    let hovered = false

    for (let i = 0; i < numFreqs; i++) {
      const y = margin + i * h
      
      const isHovered = mouse.x >= margin && mouse.x <= W - margin && mouse.y >= y && mouse.y < y + h
      if (isHovered) {
        hovered = true
        setHoverInfo({
          title: 'Rezoluție Fourier',
          dt: '∞ (Infinit)',
          df: 'Perfectă',
          desc: 'Știm frecvența exactă, dar nu știm când apare.'
        })
      }

      ctx.fillStyle = isHovered ? '#4fc3f7' : `hsl(${200 + i * 10}, 70%, 20%)`
      ctx.strokeStyle = `hsl(${200 + i * 10}, 100%, 60%)`
      ctx.lineWidth = isHovered ? 3 : 1

      ctx.fillRect(margin, y, plotW, h)
      ctx.strokeRect(margin, y, plotW, h)
    }
    if (!hovered && mode === 'fourier') setHoverInfo(null)
  }

  const drawSTFT = (ctx, W, H, mouse) => {
    const margin = 40
    const plotW = W - 2 * margin
    const plotH = H - 2 * margin
    
    const numTime = 8
    const numFreq = 8
    const w = plotW / numTime
    const h = plotH / numFreq

    let hovered = false

    for (let i = 0; i < numFreq; i++) {
      for (let j = 0; j < numTime; j++) {
        const x = margin + j * w
        const y = margin + i * h
        
        const isHovered = mouse.x >= x && mouse.x < x + w && mouse.y >= y && mouse.y < y + h
        if (isHovered) {
          hovered = true
          setHoverInfo({
            title: 'Rezoluție STFT',
            dt: 'Fixă (medie)',
            df: 'Fixă (medie)',
            desc: 'Compromis constant. Ferestre egale peste tot.'
          })
        }

        ctx.fillStyle = isHovered ? '#00e676' : `hsl(${150 + i * 10}, 70%, 20%)`
        ctx.strokeStyle = `hsl(${150 + i * 10}, 100%, 60%)`
        ctx.lineWidth = isHovered ? 3 : 1

        ctx.fillRect(x, y, w, h)
        ctx.strokeRect(x, y, w, h)
      }
    }
    if (!hovered && mode === 'stft') setHoverInfo(null)
  }

  const drawWavelet = (ctx, W, H, mouse) => {
    const margin = 40
    const plotW = W - 2 * margin
    const plotH = H - 2 * margin
    
    let currentY = margin
    let currentH = plotH / 2
    let levels = 4
    let hovered = false

    for (let l = 0; l < levels; l++) {
      const numBoxes = Math.pow(2, levels - l - 1) * 4 
      const boxW = plotW / numBoxes
      
      if (l === levels - 1) {
        currentH = H - margin - currentY
      }

      for (let i = 0; i < numBoxes; i++) {
        const x = margin + i * boxW
        
        const isHovered = mouse.x >= x && mouse.x < x + boxW && mouse.y >= currentY && mouse.y < currentY + currentH
        
        if (isHovered) {
          hovered = true
          const isHighFreq = l === 0
          const isLowFreq = l === levels - 1
          
          setHoverInfo({
            title: isHighFreq ? 'Frecvențe Înalte' : isLowFreq ? 'Frecvențe Joase' : 'Frecvențe Medii',
            dt: isHighFreq ? 'Foarte bună (mică)' : isLowFreq ? 'Slabă (mare)' : 'Medie',
            df: isHighFreq ? 'Slabă (mare)' : isLowFreq ? 'Foarte bună (mică)' : 'Medie',
            desc: isHighFreq 
              ? 'Ex: 500-510Hz. Vedem tranzienți scurți, dar nu distingem frecvențele apropiate.'
              : isLowFreq
              ? 'Ex: 1-5Hz. Distingem frecvențele bine, dar nu știm exact când apar.'
              : 'Compromis echilibrat pentru zona de mijloc.'
          })
        }

        ctx.fillStyle = isHovered ? '#d500f9' : `hsl(${280 - l * 40}, 70%, 20%)`
        ctx.strokeStyle = `hsl(${280 - l * 40}, 100%, 60%)`
        ctx.lineWidth = isHovered ? 3 : 1

        ctx.fillRect(x, currentY, boxW, currentH)
        ctx.strokeRect(x, currentY, boxW, currentH)
      }

      currentY += currentH
      currentH /= 2
    }
    if (!hovered && mode === 'wavelet') setHoverInfo(null)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '1rem',
      padding: compact ? '0.5rem' : '1rem',
      background: '#0f0f1a',
      color: '#fff'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: '#00d4ff' }}>Compromisul Timp-Frecvență</h2>
        <p style={{ margin: '0.5rem 0 0', color: '#888', fontSize: '0.9rem' }}>
          Principiul de incertitudine Heisenberg: <LaTeX math="\Delta t \cdot \Delta f \ge \frac{1}{4\pi}" />
        </p>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        gap: '1rem',
        minHeight: 0
      }}>
        {/* Visualization */}
        <div style={{
          flex: 2,
          background: '#000',
          borderRadius: '8px',
          border: '1px solid #333',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <canvas 
            ref={canvasRef}
            width={600}
            height={400}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverInfo(null)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'crosshair' }}
          />
          
          {/* Overlay labels */}
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '4px', fontSize: '0.85rem', maxWidth: '250px', border: '1px solid #444' }}>
            {hoverInfo ? (
              <>
                <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '5px' }}>{hoverInfo.title}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 10px', marginBottom: '8px' }}>
                  <span style={{ color: '#aaa' }}>Δt (Timp):</span>
                  <span style={{ color: '#fff' }}>{hoverInfo.dt}</span>
                  <span style={{ color: '#aaa' }}>Δf (Frecv):</span>
                  <span style={{ color: '#fff' }}>{hoverInfo.df}</span>
                </div>
                <div style={{ color: '#ccc', fontSize: '0.8rem', fontStyle: 'italic' }}>
                  {hoverInfo.desc}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '5px' }}>Info</div>
                <div style={{ color: '#aaa' }}>Mișcă mouse-ul peste grafic pentru detalii.</div>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div className="control-group">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#aaa' }}>Alege Vizualizarea</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => setMode('fourier')}
                style={{
                  padding: '1rem',
                  background: mode === 'fourier' ? 'rgba(79, 195, 247, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${mode === 'fourier' ? '#4fc3f7' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '8px',
                  color: mode === 'fourier' ? '#4fc3f7' : '#aaa',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <strong style={{ fontSize: '1.05rem' }}>Transformata Fourier</strong>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: '1.4', fontWeight: 'normal' }}>
                  Știm exact CE frecvențe, dar nu CÂND.
                </div>
              </button>

              <button
                onClick={() => setMode('stft')}
                style={{
                  padding: '1rem',
                  background: mode === 'stft' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${mode === 'stft' ? '#00e676' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '8px',
                  color: mode === 'stft' ? '#00e676' : '#aaa',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <strong style={{ fontSize: '1.05rem' }}>STFT (Windowed Fourier)</strong>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: '1.4', fontWeight: 'normal' }}>
                  Compromis fix. Ferestre egale.
                </div>
              </button>

              <button
                onClick={() => setMode('wavelet')}
                style={{
                  padding: '1rem',
                  background: mode === 'wavelet' ? 'rgba(213, 0, 249, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${mode === 'wavelet' ? '#d500f9' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '8px',
                  color: mode === 'wavelet' ? '#d500f9' : '#aaa',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <strong style={{ fontSize: '1.05rem' }}>Transformata Wavelet</strong>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: '1.4', fontWeight: 'normal' }}>
                  Frecvențe înalte → timp scurt.
                  Frecvențe joase → timp lung.
                </div>
              </button>
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#fff' }}>💡 De ce contează?</h4>
            <p style={{ margin: 0, color: '#ccc' }}>
              Semnalele reale (muzică, imagini, cutremure) au evenimente scurte de frecvență înaltă (tranzienți) și fundaluri lungi de frecvență joasă.
              <br/><br/>
              <strong>Wavelet</strong> se adaptează natural la această structură, oferind "zoom" unde trebuie.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
