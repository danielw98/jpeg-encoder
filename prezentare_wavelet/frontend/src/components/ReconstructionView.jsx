import { useState, useEffect, useRef } from 'react'
import LaTeX, { LaTeXBlock } from './LaTeX'
import './ReconstructionView.css'

/**
 * ReconstructionView - Perfect Reconstruction Demonstration
 * Shows that DWT is lossless and the original signal can be recovered exactly
 */

// Haar wavelet filters
const HAAR = {
  h0: [1/Math.sqrt(2), 1/Math.sqrt(2)],   // Analysis LP
  h1: [1/Math.sqrt(2), -1/Math.sqrt(2)],  // Analysis HP
  g0: [1/Math.sqrt(2), 1/Math.sqrt(2)],   // Synthesis LP
  g1: [-1/Math.sqrt(2), 1/Math.sqrt(2)]   // Synthesis HP
}

// Forward transform (decomposition)
const decompose = (signal) => {
  const approx = []
  const detail = []
  for (let i = 0; i < signal.length; i += 2) {
    const a = signal[i]
    const b = signal[i + 1] || signal[i]
    approx.push((a + b) / Math.sqrt(2))
    detail.push((a - b) / Math.sqrt(2))
  }
  return { approx, detail }
}

// Inverse transform (reconstruction)
const reconstruct = (approx, detail) => {
  const result = []
  for (let i = 0; i < approx.length; i++) {
    const a = approx[i]
    const d = detail[i]
    // Inverse Haar: x[2k] = (a + d) / sqrt(2), x[2k+1] = (a - d) / sqrt(2)
    result.push((a + d) / Math.sqrt(2))
    result.push((a - d) / Math.sqrt(2))
  }
  return result
}

// Multi-level decomposition
const multiDecompose = (signal, levels) => {
  const results = []
  let current = [...signal]
  for (let l = 0; l < levels; l++) {
    if (current.length < 2) break
    const { approx, detail } = decompose(current)
    results.push({ level: l + 1, approx: [...approx], detail: [...detail] })
    current = approx
  }
  return results
}

// Multi-level reconstruction
const multiReconstruct = (decomp) => {
  if (decomp.length === 0) return []
  
  // Start with the deepest approximation
  let current = [...decomp[decomp.length - 1].approx]
  
  // Reconstruct level by level, from deepest to shallowest
  for (let i = decomp.length - 1; i >= 0; i--) {
    current = reconstruct(current, decomp[i].detail)
  }
  
  return current
}

// Generate test signals
const SIGNALS = {
  step: { name: 'Treaptă', generate: (n) => Array.from({length: n}, (_, i) => i < n/2 ? 50 : 200) },
  ramp: { name: 'Rampă', generate: (n) => Array.from({length: n}, (_, i) => 50 + 150 * i / n) },
  sine: { name: 'Sinusoidă', generate: (n) => Array.from({length: n}, (_, i) => 128 + 80 * Math.sin(4 * Math.PI * i / n)) },
  pulse: { name: 'Puls', generate: (n) => Array.from({length: n}, (_, i) => (i > n*0.3 && i < n*0.7) ? 200 : 80) },
  random: { name: 'Random', generate: (n) => Array.from({length: n}, () => 50 + Math.random() * 150) }
}

export default function ReconstructionView({ compact = false }) {
  const [signalType, setSignalType] = useState('step')
  const [signalSize, setSignalSize] = useState(16)
  const [numLevels, setNumLevels] = useState(2)
  const [animStep, setAnimStep] = useState(0) // 0 = original, 1 = decomposed, 2 = reconstructed
  const [quantize, setQuantize] = useState(false)
  const [quantBits, setQuantBits] = useState(8)
  const canvasRef = useRef()

  // Generate signal
  const originalSignal = SIGNALS[signalType].generate(signalSize)
  
  // Decompose
  const decomposition = multiDecompose(originalSignal, numLevels)
  
  // Apply quantization if enabled (lossy compression simulation)
  const quantizedDecomp = quantize 
    ? decomposition.map(d => ({
        ...d,
        approx: d.approx.map(v => Math.round(v * (1 << quantBits)) / (1 << quantBits)),
        detail: d.detail.map(v => Math.round(v * (1 << quantBits)) / (1 << quantBits))
      }))
    : decomposition

  // Reconstruct
  const reconstructed = multiReconstruct(quantizedDecomp)
  
  // Calculate error
  const error = originalSignal.map((v, i) => Math.abs(v - (reconstructed[i] || 0)))
  const maxError = Math.max(...error)
  const mse = error.reduce((s, e) => s + e * e, 0) / error.length
  const psnr = mse > 0 ? 10 * Math.log10(255 * 255 / mse) : Infinity

  // Draw visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, W, H)

    drawReconstruction(ctx, W, H, originalSignal, decomposition, reconstructed, animStep, quantize, error)
  }, [originalSignal, decomposition, reconstructed, animStep, quantize, error])

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
          🔄 Reconstrucție Perfectă
        </h2>
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.95rem', color: '#888' }}>
          DWT este o transformată fără pierderi - semnalul original se recuperează exact
        </p>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '1rem',
        minHeight: 0
      }}>
        {/* Left - visualization */}
        <div style={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <canvas
            ref={canvasRef}
            width={650}
            height={350}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '10px',
              border: '1px solid #333'
            }}
          />

          {/* Step controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            {[
              { step: 0, label: '1. Original', color: '#00d4ff' },
              { step: 1, label: '2. Coeficienți DWT', color: '#ffd700' },
              { step: 2, label: '3. Reconstruit', color: '#00ff88' }
            ].map(({ step, label, color }) => (
              <button
                key={step}
                onClick={() => setAnimStep(step)}
                style={{
                  padding: '0.5rem 1rem',
                  background: animStep === step ? color : '#333',
                  border: animStep === step ? `2px solid ${color}` : '2px solid #555',
                  borderRadius: '8px',
                  color: animStep === step ? '#000' : '#aaa',
                  cursor: 'pointer',
                  fontWeight: animStep === step ? '600' : '400',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Error display */}
          <div style={{
            padding: '0.6rem 1rem',
            background: quantize ? 'rgba(255,107,157,0.1)' : 'rgba(0,255,136,0.1)',
            borderRadius: '8px',
            borderLeft: `4px solid ${quantize ? '#ff6b9d' : '#00ff88'}`,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>Eroare Max</div>
              <div style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold', 
                color: maxError < 0.001 ? '#00ff88' : maxError < 1 ? '#ffd700' : '#ff6b9d' 
              }}>
                {maxError < 0.001 ? '≈ 0' : maxError.toFixed(4)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>MSE</div>
              <div style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                color: mse < 0.001 ? '#00ff88' : mse < 1 ? '#ffd700' : '#ff6b9d'
              }}>
                {mse < 0.001 ? '≈ 0' : mse.toFixed(4)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>PSNR</div>
              <div style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                color: psnr === Infinity ? '#00ff88' : psnr > 40 ? '#ffd700' : '#ff6b9d'
              }}>
                {psnr === Infinity ? '∞ dB' : `${psnr.toFixed(1)} dB`}
              </div>
            </div>
            <div style={{ 
              padding: '0.4rem 0.8rem',
              background: quantize ? 'rgba(255,107,157,0.2)' : 'rgba(0,255,136,0.2)',
              borderRadius: '6px',
              color: quantize ? '#ff6b9d' : '#00ff88',
              fontWeight: 'bold'
            }}>
              {quantize ? '⚠️ Lossy' : '✓ Lossless'}
            </div>
          </div>
        </div>

        {/* Right - controls and explanation */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem',
          overflow: 'auto'
        }}>
          {/* Signal controls */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#00d4ff', fontSize: '0.95rem' }}>
              📊 Parametri Semnal
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <label style={{ color: '#888', fontSize: '0.8rem' }}>Tip semnal:</label>
                <select
                  value={signalType}
                  onChange={(e) => setSignalType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.3rem',
                    background: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                >
                  {Object.entries(SIGNALS).map(([key, s]) => (
                    <option key={key} value={key}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ color: '#888', fontSize: '0.8rem' }}>Niveluri: {numLevels}</label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={numLevels}
                  onChange={(e) => setNumLevels(parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Quantization control (lossy simulation) */}
          <div style={{
            padding: '0.8rem',
            background: quantize ? 'rgba(255,107,157,0.08)' : 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            borderLeft: `3px solid ${quantize ? '#ff6b9d' : '#555'}`
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              cursor: 'pointer',
              color: quantize ? '#ff6b9d' : '#888'
            }}>
              <input
                type="checkbox"
                checked={quantize}
                onChange={(e) => setQuantize(e.target.checked)}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: quantize ? '600' : '400' }}>
                Simulează Compresie Lossy
              </span>
            </label>
            {quantize && (
              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ color: '#888', fontSize: '0.8rem' }}>
                  Biți cuantizare: {quantBits}
                </label>
                <input
                  type="range"
                  min="2"
                  max="16"
                  value={quantBits}
                  onChange={(e) => setQuantBits(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

          {/* Key formulas */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(255,215,0,0.08)',
            borderRadius: '8px',
            borderLeft: '4px solid #ffd700'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#ffd700', fontSize: '0.95rem' }}>
              📐 Formulele Reconstrucției
            </h4>
            <div style={{ fontSize: '0.95rem', textAlign: 'center' }}>
              <div style={{ marginBottom: '0.4rem' }}>
                <LaTeX math={String.raw`x[2k] = \frac{cA[k] + cD[k]}{\sqrt{2}}`} />
              </div>
              <div>
                <LaTeX math={String.raw`x[2k+1] = \frac{cA[k] - cD[k]}{\sqrt{2}}`} />
              </div>
            </div>
          </div>

          {/* Perfect reconstruction theorem */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(0,255,136,0.08)',
            borderRadius: '8px',
            borderLeft: '4px solid #00ff88'
          }}>
            <h4 style={{ margin: '0 0 0.4rem', color: '#00ff88', fontSize: '0.95rem' }}>
              ✓ Teorema Reconstrucției Perfecte
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>
              Dacă filtrele satisfac condițiile QMF (Quadrature Mirror Filter),
              atunci <strong style={{color:'#00ff88'}}>x̂[n] = x[n]</strong> exact, fără nicio eroare numerică!
            </p>
          </div>

          {/* Why this matters */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(157,78,221,0.08)',
            borderRadius: '8px',
            borderLeft: '4px solid #9d4edd'
          }}>
            <h4 style={{ margin: '0 0 0.4rem', color: '#9d4edd', fontSize: '0.95rem' }}>
              💡 De ce contează?
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#aaa' }}>
              <li>Compresie <strong>fără pierderi</strong> posibilă (lossless)</li>
              <li>Orice pierdere este <strong>controlată</strong> (de cuantizare)</li>
              <li>Baza pentru JPEG2000, denoising, analiză de semnale</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Drawing function
// ============================================================================

function drawReconstruction(ctx, W, H, original, decomp, reconstructed, step, quantize, error) {
  const margin = 50
  const plotHeight = 80
  const gap = 20

  // Draw signals based on step
  if (step >= 0) {
    // Original signal
    drawSignalPlot(ctx, margin, 30, W - 2 * margin, plotHeight, original, '#00d4ff', 'Original x[n]')
  }

  if (step >= 1) {
    // Decomposition coefficients
    const coeffY = 30 + plotHeight + gap
    const coeffWidth = (W - 2 * margin) / 2 - 10
    
    // Show final approximation
    if (decomp.length > 0) {
      const finalApprox = decomp[decomp.length - 1].approx
      drawSignalPlot(ctx, margin, coeffY, coeffWidth, plotHeight, finalApprox, '#00ff88', `Aproximare A${decomp.length}`)
    }
    
    // Show all details combined
    const allDetails = decomp.flatMap(d => d.detail)
    drawSignalPlot(ctx, margin + coeffWidth + 20, coeffY, coeffWidth, plotHeight, allDetails, '#ff6b9d', 'Detalii D₁...Dₙ')
  }

  if (step >= 2) {
    // Reconstructed signal
    const reconY = 30 + 2 * (plotHeight + gap)
    drawSignalPlot(ctx, margin, reconY, W - 2 * margin, plotHeight, reconstructed, '#00ff88', 'Reconstruit x̂[n]')
    
    // Error visualization if there is any
    const maxErr = Math.max(...error)
    if (maxErr > 0.001) {
      const errY = reconY + plotHeight + 10
      drawErrorPlot(ctx, margin, errY, W - 2 * margin, 40, error, maxErr)
    }
  }

  // Draw flow arrows
  if (step >= 1) {
    ctx.strokeStyle = '#ffd700'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    
    // Arrow from original to coefficients
    const arrowY = 30 + plotHeight + gap / 2
    ctx.beginPath()
    ctx.moveTo(W / 2, 30 + plotHeight)
    ctx.lineTo(W / 2, arrowY - 5)
    ctx.stroke()
    
    // Arrow head
    ctx.beginPath()
    ctx.moveTo(W / 2 - 8, arrowY - 12)
    ctx.lineTo(W / 2, arrowY - 5)
    ctx.lineTo(W / 2 + 8, arrowY - 12)
    ctx.stroke()
    
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('DWT', W / 2 + 25, arrowY - 5)
    
    ctx.setLineDash([])
  }

  if (step >= 2) {
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    
    const arrowY = 30 + plotHeight + gap + plotHeight + gap / 2
    ctx.beginPath()
    ctx.moveTo(W / 2, 30 + plotHeight + gap + plotHeight)
    ctx.lineTo(W / 2, arrowY - 5)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(W / 2 - 8, arrowY - 12)
    ctx.lineTo(W / 2, arrowY - 5)
    ctx.lineTo(W / 2 + 8, arrowY - 12)
    ctx.stroke()
    
    ctx.fillStyle = '#00ff88'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('IDWT', W / 2 + 28, arrowY - 5)
    
    ctx.setLineDash([])
  }
}

function drawSignalPlot(ctx, x, y, width, height, data, color, label) {
  // Background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(x, y, width, height)

  if (!data || data.length === 0) return

  const maxVal = Math.max(...data.map(Math.abs), 1)
  const barWidth = width / data.length

  // Draw bars
  ctx.fillStyle = color
  data.forEach((val, i) => {
    const barX = x + i * barWidth
    const barH = (val / maxVal) * height * 0.8
    const barY = y + height / 2 - barH / 2
    ctx.fillRect(barX, barY, Math.max(barWidth - 1, 1), Math.abs(barH))
  })

  // Label
  ctx.fillStyle = color
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(label, x + 5, y + 14)
}

function drawErrorPlot(ctx, x, y, width, height, error, maxErr) {
  ctx.fillStyle = '#2a1a1a'
  ctx.fillRect(x, y, width, height)

  const barWidth = width / error.length

  error.forEach((e, i) => {
    const barX = x + i * barWidth
    const barH = (e / maxErr) * height * 0.9
    ctx.fillStyle = e > maxErr * 0.5 ? '#ff6b9d' : '#ff9f43'
    ctx.fillRect(barX, y + height - barH, Math.max(barWidth - 1, 1), barH)
  })

  ctx.fillStyle = '#ff6b9d'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Eroare (|x - x̂|)', x + 5, y + 12)
}
