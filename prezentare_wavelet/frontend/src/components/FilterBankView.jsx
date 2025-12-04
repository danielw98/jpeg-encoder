import { useState, useEffect, useRef } from 'react'
import LaTeX, { LaTeXBlock } from './LaTeX'
import './FilterBankView.css'

/**
 * FilterBankView - Analysis and Synthesis Filter Bank Diagram
 * Shows the complete Mallat decomposition/reconstruction structure
 * with animated signal flow
 */

// Haar filter coefficients
const HAAR = {
  h0: [1/Math.sqrt(2), 1/Math.sqrt(2)],   // Low-pass (analysis)
  h1: [1/Math.sqrt(2), -1/Math.sqrt(2)],  // High-pass (analysis)
  g0: [1/Math.sqrt(2), 1/Math.sqrt(2)],   // Low-pass (synthesis)
  g1: [-1/Math.sqrt(2), 1/Math.sqrt(2)]   // High-pass (synthesis)
}

// DB4 filter coefficients (normalized)
const DB4 = {
  h0: [0.4830, 0.8365, 0.2241, -0.1294],
  h1: [-0.1294, -0.2241, 0.8365, -0.4830],
  g0: [-0.1294, 0.2241, 0.8365, 0.4830],
  g1: [-0.4830, 0.8365, -0.2241, -0.1294]
}

const WAVELETS = {
  haar: { name: 'Haar', filters: HAAR, color: '#00d4ff' },
  db4: { name: 'Daubechies-4', filters: DB4, color: '#ff9f43' }
}

export default function FilterBankView({ compact = false }) {
  const [activeView, setActiveView] = useState('analysis') // 'analysis' | 'synthesis' | 'complete'
  const [wavelet, setWavelet] = useState('haar')
  const [animating, setAnimating] = useState(false)
  const [animStep, setAnimStep] = useState(0)
  const [showMath, setShowMath] = useState(true)
  const canvasRef = useRef()
  const animRef = useRef()

  const currentWavelet = WAVELETS[wavelet]
  const { h0, h1, g0, g1 } = currentWavelet.filters

  // Animation steps for analysis bank
  const ANALYSIS_STEPS = [
    { id: 'input', label: 'Semnal de intrare x[n]', highlight: 'input' },
    { id: 'split', label: 'Semnal duplicat pentru ambele filtre', highlight: 'split' },
    { id: 'lowpass', label: 'Filtrare low-pass cu h₀ (medie)', highlight: 'lowpass' },
    { id: 'highpass', label: 'Filtrare high-pass cu h₁ (diferență)', highlight: 'highpass' },
    { id: 'decimate', label: 'Decimare ↓2 (păstrăm doar indicii pari)', highlight: 'decimate' },
    { id: 'output', label: 'Ieșire: cA (aproximare) + cD (detaliu)', highlight: 'output' }
  ]

  const SYNTHESIS_STEPS = [
    { id: 'input', label: 'Coeficienți cA + cD', highlight: 'input' },
    { id: 'upsample', label: 'Upsampling ↑2 (inserăm zerouri)', highlight: 'upsample' },
    { id: 'lowsynth', label: 'Filtrare cu g₀ (synthesis low-pass)', highlight: 'lowsynth' },
    { id: 'highsynth', label: 'Filtrare cu g₁ (synthesis high-pass)', highlight: 'highsynth' },
    { id: 'add', label: 'Adunare: g₀*cA↑ + g₁*cD↑', highlight: 'add' },
    { id: 'output', label: 'Semnal reconstruit x̂[n] = x[n]', highlight: 'output' }
  ]

  const currentSteps = activeView === 'synthesis' ? SYNTHESIS_STEPS : ANALYSIS_STEPS

  // Animation control
  useEffect(() => {
    if (animating) {
      animRef.current = setTimeout(() => {
        setAnimStep(prev => {
          if (prev >= currentSteps.length - 1) {
            setAnimating(false)
            return prev
          }
          return prev + 1
        })
      }, 1200)
    }
    return () => clearTimeout(animRef.current)
  }, [animating, animStep, currentSteps.length])

  // Draw the filter bank diagram
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    // Clear
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, W, H)

    if (activeView === 'analysis') {
      drawAnalysisBank(ctx, W, H, animStep, currentWavelet)
    } else if (activeView === 'synthesis') {
      drawSynthesisBank(ctx, W, H, animStep, currentWavelet)
    } else {
      drawCompleteBank(ctx, W, H, animStep, currentWavelet)
    }
  }, [activeView, animStep, wavelet, currentWavelet])

  const handlePlay = () => {
    setAnimStep(0)
    setAnimating(true)
  }

  const handleReset = () => {
    setAnimating(false)
    setAnimStep(0)
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
          🔀 Banca de Filtre Wavelet
        </h2>
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.95rem', color: '#888' }}>
          Structura fundamentală a transformatei wavelet discrete (DWT)
        </p>
      </div>

      {/* View selector tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        flexShrink: 0
      }}>
        {[
          { id: 'analysis', label: '📥 Analiză (Descompunere)', icon: '↓' },
          { id: 'synthesis', label: '📤 Sinteză (Reconstrucție)', icon: '↑' },
          { id: 'complete', label: '🔄 Bancă Completă', icon: '↔' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveView(tab.id); setAnimStep(0); setAnimating(false) }}
            style={{
              padding: '0.5rem 1rem',
              border: activeView === tab.id ? '2px solid #ffd700' : '2px solid transparent',
              borderRadius: '8px',
              background: activeView === tab.id ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
              color: activeView === tab.id ? '#ffd700' : '#888',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: activeView === tab.id ? '600' : '400',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '1rem',
        minHeight: 0
      }}>
        {/* Canvas diagram */}
        <div style={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <canvas
            ref={canvasRef}
            width={700}
            height={350}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '10px',
              border: '1px solid #333'
            }}
          />

          {/* Step indicator */}
          <div style={{
            padding: '0.6rem 1rem',
            background: 'rgba(255,215,0,0.1)',
            borderRadius: '8px',
            borderLeft: '4px solid #ffd700',
            minHeight: '3rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '1.1rem' }}>
              Pas {animStep + 1}/{currentSteps.length}:
            </span>
            <span style={{ color: '#fff', fontSize: '1rem' }}>
              {currentSteps[animStep]?.label}
            </span>
          </div>

          {/* Animation controls */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center'
          }}>
            <button
              onClick={handlePlay}
              disabled={animating}
              style={{
                padding: '0.5rem 1.2rem',
                background: animating ? '#333' : 'linear-gradient(135deg, #00d4ff, #0099cc)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: animating ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600'
              }}
            >
              ▶ Play
            </button>
            <button
              onClick={() => setAnimStep(prev => Math.max(0, prev - 1))}
              disabled={animating || animStep === 0}
              style={{
                padding: '0.5rem 1rem',
                background: '#333',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: animating || animStep === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem'
              }}
            >
              ⏮ Înapoi
            </button>
            <button
              onClick={() => setAnimStep(prev => Math.min(currentSteps.length - 1, prev + 1))}
              disabled={animating || animStep >= currentSteps.length - 1}
              style={{
                padding: '0.5rem 1rem',
                background: '#333',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: animating || animStep >= currentSteps.length - 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem'
              }}
            >
              ⏭ Înainte
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: '0.5rem 1rem',
                background: '#333',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Right sidebar - formulas and explanation */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem',
          overflow: 'auto'
        }}>
          {/* Wavelet selector */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px'
          }}>
            <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>
              Wavelet:
            </label>
            <select
              value={wavelet}
              onChange={(e) => setWavelet(e.target.value)}
              style={{
                width: '100%',
                padding: '0.4rem',
                background: '#1a1a2e',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            >
              {Object.entries(WAVELETS).map(([key, w]) => (
                <option key={key} value={key}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Filter coefficients */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(0,212,255,0.05)',
            borderRadius: '8px',
            borderLeft: '3px solid #00d4ff'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#00d4ff', fontSize: '0.95rem' }}>
              📊 Coeficienți Filtru ({wavelet === 'haar' ? 'Haar' : 'DB4'})
            </h4>
            <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
              <p style={{ margin: '0.3rem 0' }}>
                <span style={{ color: '#00ff88' }}>h₀ (LP):</span>{' '}
                [{h0.map(v => v.toFixed(3)).join(', ')}]
              </p>
              <p style={{ margin: '0.3rem 0' }}>
                <span style={{ color: '#ff6b9d' }}>h₁ (HP):</span>{' '}
                [{h1.map(v => v.toFixed(3)).join(', ')}]
              </p>
            </div>
          </div>

          {/* Key formulas */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(255,215,0,0.05)',
            borderRadius: '8px',
            borderLeft: '3px solid #ffd700'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#ffd700', fontSize: '0.95rem' }}>
              📐 Formulele Cheie
            </h4>
            {activeView === 'analysis' ? (
              <div style={{ fontSize: '1rem', textAlign: 'center' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <LaTeX math={String.raw`cA[k] = \sum_n x[n] \cdot h_0[n-2k]`} />
                </div>
                <div>
                  <LaTeX math={String.raw`cD[k] = \sum_n x[n] \cdot h_1[n-2k]`} />
                </div>
              </div>
            ) : activeView === 'synthesis' ? (
              <div style={{ fontSize: '1rem', textAlign: 'center' }}>
                <LaTeX math={String.raw`x[n] = \sum_k cA[k] \cdot g_0[n-2k] + \sum_k cD[k] \cdot g_1[n-2k]`} />
              </div>
            ) : (
              <div style={{ fontSize: '1rem', textAlign: 'center' }}>
                <LaTeX math={String.raw`\text{Analiză} \rightarrow \{cA, cD\} \rightarrow \text{Sinteză} = x`} />
              </div>
            )}
          </div>

          {/* QMF relationship */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(255,107,157,0.05)',
            borderRadius: '8px',
            borderLeft: '3px solid #ff6b9d'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#ff6b9d', fontSize: '0.95rem' }}>
              🔗 Relația QMF
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>
              Filtrele sunt <strong>Quadrature Mirror Filters</strong>:
            </p>
            <div style={{ fontSize: '0.95rem', textAlign: 'center', marginTop: '0.4rem' }}>
              <LaTeX math={String.raw`h_1[n] = (-1)^n \cdot h_0[N-1-n]`} />
            </div>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#888' }}>
              Aceasta garantează reconstrucția perfectă!
            </p>
          </div>

          {/* Key insight */}
          <div style={{
            padding: '0.8rem',
            background: 'rgba(0,255,136,0.05)',
            borderRadius: '8px',
            borderLeft: '3px solid #00ff88'
          }}>
            <h4 style={{ margin: '0 0 0.4rem', color: '#00ff88', fontSize: '0.95rem' }}>
              💡 Ideea Cheie
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>
              {activeView === 'analysis' 
                ? 'Decimarea (↓2) reduce dimensiunea la jumătate, dar h₀ + h₁ păstrează toată informația!'
                : activeView === 'synthesis'
                ? 'Upsampling (↑2) + filtrare reconstruiește semnalul original fără pierderi!'
                : 'Banca completă demonstrează că DWT este o transformată reversibilă.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Drawing functions
// ============================================================================

function drawAnalysisBank(ctx, W, H, step, wavelet) {
  const color = wavelet.color
  const midY = H / 2
  const boxW = 100
  const boxH = 40

  // Draw signal flow based on step
  ctx.lineWidth = 3
  ctx.font = 'bold 14px monospace'

  // Input signal box
  const inputX = 50
  ctx.fillStyle = step >= 0 ? '#00d4ff' : '#333'
  ctx.strokeStyle = step >= 0 ? '#00d4ff' : '#555'
  ctx.fillRect(inputX, midY - boxH/2, boxW, boxH)
  ctx.strokeRect(inputX, midY - boxH/2, boxW, boxH)
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.fillText('x[n]', inputX + boxW/2, midY + 5)

  // Split point
  const splitX = inputX + boxW + 40
  if (step >= 1) {
    ctx.strokeStyle = '#ffd700'
    ctx.beginPath()
    ctx.moveTo(inputX + boxW, midY)
    ctx.lineTo(splitX, midY)
    ctx.stroke()
    
    // Split arrows
    ctx.beginPath()
    ctx.moveTo(splitX, midY)
    ctx.lineTo(splitX + 50, midY - 60)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(splitX, midY)
    ctx.lineTo(splitX + 50, midY + 60)
    ctx.stroke()
  }

  // Low-pass filter box (top branch)
  const lpX = splitX + 60
  const lpY = midY - 80
  ctx.fillStyle = step >= 2 ? '#00ff88' : '#222'
  ctx.strokeStyle = step >= 2 ? '#00ff88' : '#444'
  ctx.fillRect(lpX, lpY - boxH/2, boxW, boxH)
  ctx.strokeRect(lpX, lpY - boxH/2, boxW, boxH)
  ctx.fillStyle = step >= 2 ? '#000' : '#666'
  ctx.fillText('h₀ (LP)', lpX + boxW/2, lpY + 5)

  // High-pass filter box (bottom branch)
  const hpY = midY + 80
  ctx.fillStyle = step >= 3 ? '#ff6b9d' : '#222'
  ctx.strokeStyle = step >= 3 ? '#ff6b9d' : '#444'
  ctx.fillRect(lpX, hpY - boxH/2, boxW, boxH)
  ctx.strokeRect(lpX, hpY - boxH/2, boxW, boxH)
  ctx.fillStyle = step >= 3 ? '#000' : '#666'
  ctx.fillText('h₁ (HP)', lpX + boxW/2, hpY + 5)

  // Decimation boxes
  const decX = lpX + boxW + 40
  if (step >= 4) {
    // Connection lines to decimators
    ctx.strokeStyle = '#00ff88'
    ctx.beginPath()
    ctx.moveTo(lpX + boxW, lpY)
    ctx.lineTo(decX, lpY)
    ctx.stroke()

    ctx.strokeStyle = '#ff6b9d'
    ctx.beginPath()
    ctx.moveTo(lpX + boxW, hpY)
    ctx.lineTo(decX, hpY)
    ctx.stroke()

    // Decimation circles
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(decX + 25, lpY, 25, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.fillText('↓2', decX + 25, lpY + 5)

    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(decX + 25, hpY, 25, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.fillText('↓2', decX + 25, hpY + 5)
  }

  // Output boxes
  const outX = decX + 70
  if (step >= 5) {
    ctx.strokeStyle = '#00ff88'
    ctx.beginPath()
    ctx.moveTo(decX + 50, lpY)
    ctx.lineTo(outX, lpY)
    ctx.stroke()

    ctx.strokeStyle = '#ff6b9d'
    ctx.beginPath()
    ctx.moveTo(decX + 50, hpY)
    ctx.lineTo(outX, hpY)
    ctx.stroke()

    // cA output
    ctx.fillStyle = '#00ff88'
    ctx.strokeStyle = '#00ff88'
    ctx.fillRect(outX, lpY - boxH/2, boxW, boxH)
    ctx.strokeRect(outX, lpY - boxH/2, boxW, boxH)
    ctx.fillStyle = '#000'
    ctx.fillText('cA', outX + boxW/2, lpY + 5)

    // cD output
    ctx.fillStyle = '#ff6b9d'
    ctx.strokeStyle = '#ff6b9d'
    ctx.fillRect(outX, hpY - boxH/2, boxW, boxH)
    ctx.strokeRect(outX, hpY - boxH/2, boxW, boxH)
    ctx.fillStyle = '#000'
    ctx.fillText('cD', outX + boxW/2, hpY + 5)
  }

  // Labels
  ctx.fillStyle = '#888'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Low-pass → Aproximare', outX + boxW + 10, lpY + 5)
  ctx.fillText('High-pass → Detalii', outX + boxW + 10, hpY + 5)

  // Title
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('BANCA DE ANALIZĂ (Descompunere)', W/2, 25)

  // Dimension annotation
  if (step >= 5) {
    ctx.fillStyle = '#888'
    ctx.font = '11px sans-serif'
    ctx.fillText('N valori', inputX + boxW/2, midY + boxH/2 + 15)
    ctx.fillText('N/2', outX + boxW/2, lpY + boxH/2 + 15)
    ctx.fillText('N/2', outX + boxW/2, hpY + boxH/2 + 15)
  }
}

function drawSynthesisBank(ctx, W, H, step, wavelet) {
  const midY = H / 2
  const boxW = 100
  const boxH = 40

  ctx.lineWidth = 3
  ctx.font = 'bold 14px monospace'

  // Input boxes (cA, cD)
  const inputX = 50
  const lpY = midY - 80
  const hpY = midY + 80

  // cA input
  ctx.fillStyle = step >= 0 ? '#00ff88' : '#333'
  ctx.strokeStyle = step >= 0 ? '#00ff88' : '#555'
  ctx.fillRect(inputX, lpY - boxH/2, boxW, boxH)
  ctx.strokeRect(inputX, lpY - boxH/2, boxW, boxH)
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.fillText('cA', inputX + boxW/2, lpY + 5)

  // cD input
  ctx.fillStyle = step >= 0 ? '#ff6b9d' : '#333'
  ctx.strokeStyle = step >= 0 ? '#ff6b9d' : '#555'
  ctx.fillRect(inputX, hpY - boxH/2, boxW, boxH)
  ctx.strokeRect(inputX, hpY - boxH/2, boxW, boxH)
  ctx.fillStyle = '#000'
  ctx.fillText('cD', inputX + boxW/2, hpY + 5)

  // Upsampling
  const upX = inputX + boxW + 40
  if (step >= 1) {
    ctx.strokeStyle = '#00ff88'
    ctx.beginPath()
    ctx.moveTo(inputX + boxW, lpY)
    ctx.lineTo(upX, lpY)
    ctx.stroke()

    ctx.strokeStyle = '#ff6b9d'
    ctx.beginPath()
    ctx.moveTo(inputX + boxW, hpY)
    ctx.lineTo(upX, hpY)
    ctx.stroke()

    // Upsampling circles
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(upX + 25, lpY, 25, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.fillText('↑2', upX + 25, lpY + 5)

    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(upX + 25, hpY, 25, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.fillText('↑2', upX + 25, hpY + 5)
  }

  // Synthesis filters
  const gX = upX + 70
  if (step >= 2) {
    ctx.strokeStyle = '#00ff88'
    ctx.beginPath()
    ctx.moveTo(upX + 50, lpY)
    ctx.lineTo(gX, lpY)
    ctx.stroke()
  }

  ctx.fillStyle = step >= 2 ? '#00ff88' : '#222'
  ctx.strokeStyle = step >= 2 ? '#00ff88' : '#444'
  ctx.fillRect(gX, lpY - boxH/2, boxW, boxH)
  ctx.strokeRect(gX, lpY - boxH/2, boxW, boxH)
  ctx.fillStyle = step >= 2 ? '#000' : '#666'
  ctx.textAlign = 'center'
  ctx.fillText('g₀', gX + boxW/2, lpY + 5)

  if (step >= 3) {
    ctx.strokeStyle = '#ff6b9d'
    ctx.beginPath()
    ctx.moveTo(upX + 50, hpY)
    ctx.lineTo(gX, hpY)
    ctx.stroke()
  }

  ctx.fillStyle = step >= 3 ? '#ff6b9d' : '#222'
  ctx.strokeStyle = step >= 3 ? '#ff6b9d' : '#444'
  ctx.fillRect(gX, hpY - boxH/2, boxW, boxH)
  ctx.strokeRect(gX, hpY - boxH/2, boxW, boxH)
  ctx.fillStyle = step >= 3 ? '#000' : '#666'
  ctx.fillText('g₁', gX + boxW/2, hpY + 5)

  // Addition point
  const addX = gX + boxW + 60
  if (step >= 4) {
    ctx.strokeStyle = '#00ff88'
    ctx.beginPath()
    ctx.moveTo(gX + boxW, lpY)
    ctx.lineTo(addX, midY)
    ctx.stroke()

    ctx.strokeStyle = '#ff6b9d'
    ctx.beginPath()
    ctx.moveTo(gX + boxW, hpY)
    ctx.lineTo(addX, midY)
    ctx.stroke()

    // Plus circle
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(addX, midY, 25, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText('+', addX, midY + 7)
  }

  // Output
  const outX = addX + 50
  if (step >= 5) {
    ctx.strokeStyle = '#00d4ff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(addX + 25, midY)
    ctx.lineTo(outX, midY)
    ctx.stroke()

    ctx.fillStyle = '#00d4ff'
    ctx.strokeStyle = '#00d4ff'
    ctx.fillRect(outX, midY - boxH/2, boxW, boxH)
    ctx.strokeRect(outX, midY - boxH/2, boxW, boxH)
    ctx.fillStyle = '#000'
    ctx.font = 'bold 14px monospace'
    ctx.fillText('x̂[n]', outX + boxW/2, midY + 5)
  }

  // Title
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('BANCA DE SINTEZĂ (Reconstrucție)', W/2, 25)

  // Perfect reconstruction note
  if (step >= 5) {
    ctx.fillStyle = '#00ff88'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('✓ x̂[n] = x[n] (Reconstrucție Perfectă!)', W/2, H - 20)
  }
}

function drawCompleteBank(ctx, W, H, step, wavelet) {
  // Draw both analysis and synthesis connected
  const midY = H / 2
  const boxW = 70
  const boxH = 30

  ctx.lineWidth = 2
  ctx.font = 'bold 11px monospace'
  ctx.textAlign = 'center'

  // ANALYSIS SIDE (left half)
  const aInputX = 30
  const aSplitX = aInputX + boxW + 20
  const aFilterX = aSplitX + 40
  const aDecX = aFilterX + boxW + 20
  const aOutX = aDecX + 40

  const lpY = midY - 50
  const hpY = midY + 50

  // Input
  ctx.fillStyle = '#00d4ff'
  ctx.fillRect(aInputX, midY - boxH/2, boxW, boxH)
  ctx.fillStyle = '#000'
  ctx.fillText('x[n]', aInputX + boxW/2, midY + 4)

  // Lines to filters
  ctx.strokeStyle = '#666'
  ctx.beginPath()
  ctx.moveTo(aInputX + boxW, midY)
  ctx.lineTo(aSplitX, midY)
  ctx.lineTo(aFilterX, lpY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(aSplitX, midY)
  ctx.lineTo(aFilterX, hpY)
  ctx.stroke()

  // h0, h1 filters
  ctx.fillStyle = '#00ff88'
  ctx.fillRect(aFilterX, lpY - boxH/2, boxW, boxH)
  ctx.fillStyle = '#000'
  ctx.fillText('h₀', aFilterX + boxW/2, lpY + 4)

  ctx.fillStyle = '#ff6b9d'
  ctx.fillRect(aFilterX, hpY - boxH/2, boxW, boxH)
  ctx.fillStyle = '#000'
  ctx.fillText('h₁', aFilterX + boxW/2, hpY + 4)

  // Decimation
  ctx.strokeStyle = '#666'
  ctx.beginPath()
  ctx.moveTo(aFilterX + boxW, lpY)
  ctx.lineTo(aDecX + 15, lpY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(aFilterX + boxW, hpY)
  ctx.lineTo(aDecX + 15, hpY)
  ctx.stroke()

  ctx.fillStyle = '#ffd700'
  ctx.beginPath()
  ctx.arc(aDecX + 15, lpY, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(aDecX + 15, hpY, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#000'
  ctx.font = 'bold 10px monospace'
  ctx.fillText('↓2', aDecX + 15, lpY + 4)
  ctx.fillText('↓2', aDecX + 15, hpY + 4)

  // cA, cD outputs
  ctx.strokeStyle = '#666'
  ctx.beginPath()
  ctx.moveTo(aDecX + 30, lpY)
  ctx.lineTo(aOutX, lpY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(aDecX + 30, hpY)
  ctx.lineTo(aOutX, hpY)
  ctx.stroke()

  ctx.fillStyle = '#00ff88'
  ctx.fillRect(aOutX, lpY - boxH/2, boxW, boxH)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 11px monospace'
  ctx.fillText('cA', aOutX + boxW/2, lpY + 4)

  ctx.fillStyle = '#ff6b9d'
  ctx.fillRect(aOutX, hpY - boxH/2, boxW, boxH)
  ctx.fillStyle = '#000'
  ctx.fillText('cD', aOutX + boxW/2, hpY + 4)

  // SYNTHESIS SIDE (right half)
  const sInputX = aOutX + boxW + 30
  const sUpX = sInputX + 30
  const sFilterX = sUpX + 50
  const sAddX = sFilterX + boxW + 30
  const sOutX = sAddX + 40

  // Connecting lines from analysis to synthesis
  ctx.strokeStyle = '#444'
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(aOutX + boxW, lpY)
  ctx.lineTo(sInputX, lpY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(aOutX + boxW, hpY)
  ctx.lineTo(sInputX, hpY)
  ctx.stroke()
  ctx.setLineDash([])

  // Upsampling
  ctx.strokeStyle = '#666'
  ctx.beginPath()
  ctx.moveTo(sInputX, lpY)
  ctx.lineTo(sUpX + 15, lpY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(sInputX, hpY)
  ctx.lineTo(sUpX + 15, hpY)
  ctx.stroke()

  ctx.fillStyle = '#ffd700'
  ctx.beginPath()
  ctx.arc(sUpX + 15, lpY, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(sUpX + 15, hpY, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#000'
  ctx.font = 'bold 10px monospace'
  ctx.fillText('↑2', sUpX + 15, lpY + 4)
  ctx.fillText('↑2', sUpX + 15, hpY + 4)

  // g0, g1 filters
  ctx.strokeStyle = '#666'
  ctx.beginPath()
  ctx.moveTo(sUpX + 30, lpY)
  ctx.lineTo(sFilterX, lpY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(sUpX + 30, hpY)
  ctx.lineTo(sFilterX, hpY)
  ctx.stroke()

  ctx.fillStyle = '#00ff88'
  ctx.fillRect(sFilterX, lpY - boxH/2, boxW, boxH)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 11px monospace'
  ctx.fillText('g₀', sFilterX + boxW/2, lpY + 4)

  ctx.fillStyle = '#ff6b9d'
  ctx.fillRect(sFilterX, hpY - boxH/2, boxW, boxH)
  ctx.fillStyle = '#000'
  ctx.fillText('g₁', sFilterX + boxW/2, hpY + 4)

  // Addition
  ctx.strokeStyle = '#666'
  ctx.beginPath()
  ctx.moveTo(sFilterX + boxW, lpY)
  ctx.lineTo(sAddX, midY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(sFilterX + boxW, hpY)
  ctx.lineTo(sAddX, midY)
  ctx.stroke()

  ctx.fillStyle = '#ffd700'
  ctx.beginPath()
  ctx.arc(sAddX, midY, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#000'
  ctx.font = 'bold 14px monospace'
  ctx.fillText('+', sAddX, midY + 5)

  // Output
  ctx.strokeStyle = '#666'
  ctx.beginPath()
  ctx.moveTo(sAddX + 15, midY)
  ctx.lineTo(sOutX, midY)
  ctx.stroke()

  ctx.fillStyle = '#00d4ff'
  ctx.fillRect(sOutX, midY - boxH/2, boxW, boxH)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 11px monospace'
  ctx.fillText('x̂[n]', sOutX + boxW/2, midY + 4)

  // Labels
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 14px sans-serif'
  ctx.fillText('ANALIZĂ', (aInputX + aOutX + boxW) / 2, 25)
  ctx.fillText('SINTEZĂ', (sInputX + sOutX + boxW) / 2, 25)

  // Perfect reconstruction
  ctx.fillStyle = '#00ff88'
  ctx.font = 'bold 13px sans-serif'
  ctx.fillText('✓ Reconstrucție Perfectă: x̂[n] = x[n]', W/2, H - 15)

  // Divider
  ctx.strokeStyle = '#444'
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(W/2, 40)
  ctx.lineTo(W/2, H - 35)
  ctx.stroke()
  ctx.setLineDash([])
}
