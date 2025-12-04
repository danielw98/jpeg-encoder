import { useState, useEffect, useRef } from 'react'
import LaTeX, { LaTeXBlock } from './LaTeX'
import './PyramidDecompView.css'

/**
 * PyramidDecompView - Multi-level wavelet pyramid visualization
 * Shows how recursive LL decomposition creates a pyramid structure
 * with energy concentration and practical applications
 */

// Generate sample data for visualization
const generateSampleSignal = (size) => {
  const signal = []
  for (let i = 0; i < size; i++) {
    const t = i / size
    // Mix of frequencies
    signal.push(
      100 + 
      50 * Math.sin(2 * Math.PI * 2 * t) +
      30 * Math.sin(2 * Math.PI * 8 * t) +
      15 * Math.sin(2 * Math.PI * 32 * t)
    )
  }
  return signal
}

// Haar decomposition
const haarDecompose1D = (signal) => {
  const n = signal.length
  const approx = []
  const detail = []
  for (let i = 0; i < n; i += 2) {
    const a = signal[i]
    const b = signal[i + 1] || signal[i]
    approx.push((a + b) / Math.sqrt(2))
    detail.push((a - b) / Math.sqrt(2))
  }
  return { approx, detail }
}

// Multi-level 1D decomposition
const multiLevelDecompose = (signal, levels) => {
  const results = []
  let current = signal
  for (let l = 0; l < levels; l++) {
    if (current.length < 2) break
    const { approx, detail } = haarDecompose1D(current)
    results.push({
      level: l + 1,
      approx,
      detail,
      originalLength: current.length,
      approxLength: approx.length
    })
    current = approx
  }
  return results
}

// Calculate energy
const calcEnergy = (arr) => arr.reduce((sum, v) => sum + v * v, 0)

export default function PyramidDecompView({ compact = false }) {
  const [signalSize, setSignalSize] = useState(64)
  const [numLevels, setNumLevels] = useState(4)
  const [showReconstruction, setShowReconstruction] = useState(false)
  const [highlightLevel, setHighlightLevel] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [animLevel, setAnimLevel] = useState(0)
  const canvasRef = useRef()
  const animRef = useRef()

  const signal = generateSampleSignal(signalSize)
  const decomposition = multiLevelDecompose(signal, numLevels)

  // Calculate energy distribution
  const energies = decomposition.map((d, i) => ({
    level: d.level,
    detailEnergy: calcEnergy(d.detail),
    approxEnergy: i === decomposition.length - 1 ? calcEnergy(d.approx) : 0
  }))
  const totalEnergy = calcEnergy(signal)
  const detailTotal = energies.reduce((s, e) => s + e.detailEnergy, 0)
  const approxTotal = energies[energies.length - 1]?.approxEnergy || 0

  // Animation
  useEffect(() => {
    if (animating) {
      animRef.current = setTimeout(() => {
        setAnimLevel(prev => {
          if (prev >= numLevels) {
            setAnimating(false)
            return prev
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearTimeout(animRef.current)
  }, [animating, animLevel, numLevels])

  // Draw pyramid
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, W, H)

    drawPyramid(ctx, W, H, signal, decomposition, animating ? animLevel : numLevels, highlightLevel)
  }, [signal, decomposition, numLevels, highlightLevel, animLevel, animating])

  const handleAnimate = () => {
    setAnimLevel(0)
    setAnimating(true)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '0.8rem',
      padding: compact ? '0.5rem' : '1rem',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>
          🔺 Descompunere Piramidală Multi-Nivel
        </h2>
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.95rem', color: '#888' }}>
          Recursiv: LL → {'{'}LL, LH{'}'} → aplicăm din nou pe LL
        </p>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '1rem',
        minHeight: 0
      }}>
        {/* Left - pyramid visualization */}
        <div style={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <canvas
            ref={canvasRef}
            width={650}
            height={380}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '10px',
              border: '1px solid #333'
            }}
          />

          {/* Controls */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ color: '#888', fontSize: '0.9rem' }}>Niveluri:</label>
              <input
                type="range"
                min="1"
                max="6"
                value={numLevels}
                onChange={(e) => setNumLevels(parseInt(e.target.value))}
                style={{ width: '80px' }}
              />
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{numLevels}</span>
            </div>
            <button
              onClick={handleAnimate}
              disabled={animating}
              style={{
                padding: '0.4rem 1rem',
                background: animating ? '#333' : 'linear-gradient(135deg, #ffd700, #ff9f43)',
                border: 'none',
                borderRadius: '6px',
                color: '#000',
                cursor: animating ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              ▶ Animează Descompunerea
            </button>
            <button
              onClick={() => { setAnimating(false); setAnimLevel(numLevels) }}
              style={{
                padding: '0.4rem 1rem',
                background: '#333',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              ⏭ Salt la final
            </button>
          </div>

          {/* Energy distribution bar */}
          <div style={{
            padding: '0.6rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px'
          }}>
            <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              Distribuția Energiei:
            </div>
            <div style={{
              display: 'flex',
              height: '25px',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  width: `${(approxTotal / totalEnergy) * 100}%`,
                  background: '#00ff88',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}
              >
                {(approxTotal / totalEnergy * 100) > 10 && `A${numLevels}: ${(approxTotal / totalEnergy * 100).toFixed(0)}%`}
              </div>
              {energies.slice().reverse().map((e, i) => (
                <div
                  key={e.level}
                  style={{
                    width: `${(e.detailEnergy / totalEnergy) * 100}%`,
                    background: `hsl(${340 - i * 30}, 70%, 50%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={() => setHighlightLevel(e.level)}
                  onMouseLeave={() => setHighlightLevel(null)}
                >
                  {(e.detailEnergy / totalEnergy * 100) > 5 && `D${e.level}`}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - explanations */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem',
          overflow: 'auto'
        }}>
          {/* Key formula */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(255,215,0,0.08)',
            borderRadius: '8px',
            borderLeft: '4px solid #ffd700'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#ffd700', fontSize: '1rem' }}>
              📐 Schema Recursivă
            </h4>
            <div style={{ fontSize: '1rem', textAlign: 'center' }}>
              <LaTeX math={String.raw`x \xrightarrow{\text{DWT}} \{A_1, D_1\} \xrightarrow{\text{DWT pe } A_1} \{A_2, D_2, D_1\}`} />
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#aaa' }}>
              La fiecare nivel, decomponem doar aproximarea (LL).
            </p>
          </div>

          {/* Why pyramid? */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(0,255,136,0.05)',
            borderRadius: '8px',
            borderLeft: '4px solid #00ff88'
          }}>
            <h4 style={{ margin: '0 0 0.4rem', color: '#00ff88', fontSize: '1rem' }}>
              💡 De ce piramidă?
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#aaa' }}>
              <li>Dimensiunea scade exponențial: N → N/2 → N/4 → ...</li>
              <li>Energia se concentrează în aproximare</li>
              <li>Detaliile fine → niveluri mici, structura → niveluri mari</li>
            </ul>
          </div>

          {/* Compression insight */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(0,212,255,0.05)',
            borderRadius: '8px',
            borderLeft: '4px solid #00d4ff'
          }}>
            <h4 style={{ margin: '0 0 0.4rem', color: '#00d4ff', fontSize: '1rem' }}>
              📦 Compresie (JPEG2000)
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>
              Majoritatea energiei este în <strong style={{color:'#00ff88'}}>A{numLevels}</strong> (≈{(approxTotal/totalEnergy*100).toFixed(0)}%).
              Coeficienții mici din D pot fi eliminați cu pierdere minimă de calitate!
            </p>
          </div>

          {/* Levels breakdown */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(255,107,157,0.05)',
            borderRadius: '8px',
            borderLeft: '4px solid #ff6b9d'
          }}>
            <h4 style={{ margin: '0 0 0.4rem', color: '#ff6b9d', fontSize: '1rem' }}>
              📊 Niveluri și Frecvențe
            </h4>
            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
              {decomposition.map((d, i) => (
                <div 
                  key={d.level}
                  style={{
                    padding: '0.2rem 0',
                    background: highlightLevel === d.level ? 'rgba(255,255,255,0.05)' : 'transparent',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={() => setHighlightLevel(d.level)}
                  onMouseLeave={() => setHighlightLevel(null)}
                >
                  <strong style={{ color: `hsl(${120 - i * 30}, 70%, 60%)` }}>
                    Nivel {d.level}:
                  </strong>{' '}
                  {d.approxLength} coef. | Frecvențe: {Math.pow(2, numLevels - d.level)}-{Math.pow(2, numLevels - d.level + 1)} Hz (relativ)
                </div>
              ))}
            </div>
          </div>

          {/* Perfect reconstruction reminder */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(157,78,221,0.08)',
            borderRadius: '8px',
            borderLeft: '4px solid #9d4edd'
          }}>
            <h4 style={{ margin: '0 0 0.4rem', color: '#9d4edd', fontSize: '1rem' }}>
              🔄 Reconstrucție
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>
              Cu <strong>toate</strong> coeficienții (A<sub>{numLevels}</sub> + D<sub>1</sub>...D<sub>{numLevels}</sub>),
              semnalul original se recuperează <strong>perfect</strong>!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Drawing function
// ============================================================================

function drawPyramid(ctx, W, H, signal, decomposition, showLevels, highlightLevel) {
  const leftMargin = 80
  const rightMargin = 30
  const topMargin = 25
  const bottomMargin = 35
  const labelWidth = 50  // Space for labels on right side
  
  const numLevelsToShow = Math.min(showLevels, decomposition.length)
  const totalRows = numLevelsToShow + 1  // +1 for original signal
  const rowHeight = (H - topMargin - bottomMargin) / totalRows
  const barHeight = Math.min(rowHeight * 0.6, 35)  // Max bar height, with spacing
  const maxWidth = W - leftMargin - rightMargin - labelWidth

  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'left'

  // Draw original signal at top
  const signalY = topMargin + rowHeight / 2
  drawSignalBar(ctx, leftMargin, signalY - barHeight / 2, maxWidth, barHeight, signal, '#00d4ff', false)
  
  // Label for original
  ctx.fillStyle = '#00d4ff'
  ctx.font = 'bold 13px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Original x[n]', leftMargin + maxWidth / 2, signalY - barHeight / 2 - 8)

  // Draw each decomposition level
  for (let i = 0; i < numLevelsToShow; i++) {
    const d = decomposition[i]
    const rowY = topMargin + (i + 1.5) * rowHeight
    const y = rowY - barHeight / 2
    const isHighlighted = highlightLevel === d.level
    
    // Calculate widths proportional to coefficient count
    // Approximation takes proportionally more space
    const totalCoefs = d.approx.length + d.detail.length
    const approxRatio = d.approx.length / totalCoefs
    const gap = 15  // Gap between approx and detail bars
    
    const approxWidth = (maxWidth - gap) * approxRatio
    const detailWidth = maxWidth - gap - approxWidth

    // Draw approximation (green, left side)
    const approxX = leftMargin
    drawSignalBar(ctx, approxX, y, approxWidth, barHeight, d.approx, '#00ff88', isHighlighted)
    
    // Label for approximation (only on last visible level)
    if (i === numLevelsToShow - 1) {
      ctx.fillStyle = '#00ff88'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`A${d.level}`, approxX + approxWidth / 2, y + barHeight + 14)
    }

    // Draw detail (pink/magenta, right side)
    const detailX = approxX + approxWidth + gap
    const detailColor = `hsl(${320 - i * 25}, 75%, 55%)`
    drawSignalBar(ctx, detailX, y, detailWidth, barHeight, d.detail, detailColor, isHighlighted)
    
    // Label for detail (always show, right side of bar)
    ctx.fillStyle = detailColor
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`D${d.level}`, detailX + detailWidth + 8, y + barHeight / 2 + 4)

    // Draw flow arrows from previous level
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    
    const prevY = rowY - rowHeight
    const prevBarBottom = prevY + barHeight / 2
    const currBarTop = y
    
    // Arrow from previous approx to current approx
    ctx.beginPath()
    ctx.moveTo(approxX + approxWidth / 2, prevBarBottom)
    ctx.lineTo(approxX + approxWidth / 2, currBarTop)
    ctx.stroke()
    
    // Arrow from previous approx to current detail
    ctx.beginPath()
    ctx.moveTo(approxX + approxWidth / 2, prevBarBottom)
    ctx.lineTo(detailX + detailWidth / 2, currBarTop)
    ctx.stroke()
    
    ctx.setLineDash([])

    // Level label on the left
    ctx.fillStyle = '#888'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`Nivel ${d.level}`, leftMargin - 12, rowY + 4)
  }

  // Structure description at bottom
  ctx.fillStyle = '#888'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  const sizesStr = [signal.length, ...decomposition.slice(0, numLevelsToShow).map(d => d.approxLength)].join(' → ')
  ctx.fillText(`Structură piramidală: ${sizesStr} (coeficienți aproximare)`, W / 2, H - 10)
}

function drawSignalBar(ctx, x, y, width, height, data, color, highlight) {
  // Background
  ctx.fillStyle = highlight ? 'rgba(255,255,255,0.1)' : '#1a1a2e'
  ctx.fillRect(x, y, width, height)

  if (!data || data.length === 0) return

  // Draw mini signal visualization as bars
  const barWidth = Math.max(1, (width - 2) / data.length)
  const maxVal = Math.max(...data.map(Math.abs), 1)
  const innerPadding = 2
  
  ctx.fillStyle = color
  data.forEach((val, i) => {
    const barX = x + innerPadding + i * barWidth
    const normalizedVal = Math.abs(val) / maxVal
    const barH = normalizedVal * (height - 4)
    const barY = y + height / 2 - barH / 2
    ctx.fillRect(barX, barY, Math.max(barWidth - 0.5, 1), Math.max(barH, 1))
  })

  // Border if highlighted
  if (highlight) {
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)
  }
}
