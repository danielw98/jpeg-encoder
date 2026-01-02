import { useState, useEffect, useRef } from 'react'
import LaTeX, { LaTeXBlock } from './LaTeX'
import './FilterBankView.css'

/**
 * FilterBankView - Analysis and Synthesis Filter Bank Diagram
 * Shows the complete Mallat decomposition/reconstruction structure
 * with animated signal flow
 * 
 * Uses HTML overlays for all text to ensure crisp rendering at any scale
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

  const handlePlay = () => {
    setAnimStep(0)
    setAnimating(true)
  }

  const handleReset = () => {
    setAnimating(false)
    setAnimStep(0)
  }

  // SVG-based Filter Bank Diagram Component
  const FilterBankDiagram = ({ view, step }) => {
    const isAnalysis = view === 'analysis'
    const isSynthesis = view === 'synthesis'
    const isComplete = view === 'complete'
    
    // Common styles
    const boxStyle = (active, color) => ({
      fill: active ? color : '#222',
      stroke: active ? color : '#444',
      strokeWidth: 2
    })
    
    const textStyle = (active) => ({
      fill: active ? '#000' : '#666',
      fontSize: '14px',
      fontWeight: 'bold',
      fontFamily: 'monospace',
      textAnchor: 'middle',
      dominantBaseline: 'middle'
    })
    
    const labelStyle = {
      fill: '#888',
      fontSize: '12px',
      fontFamily: 'sans-serif',
      textAnchor: 'start'
    }
    
    if (isAnalysis) {
      return (
        <svg viewBox="0 0 700 350" style={{ width: '100%', height: 'auto' }}>
          {/* Background */}
          <rect width="700" height="350" fill="#0a0a1a" />
          
          {/* Title */}
          <text x="350" y="25" fill="#ffd700" fontSize="16" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            BANCA DE ANALIZĂ (Descompunere)
          </text>
          
          {/* Input signal box */}
          <rect x="50" y="155" width="100" height="40" rx="4"
            fill={step >= 0 ? '#00d4ff' : '#333'}
            stroke={step >= 0 ? '#00d4ff' : '#555'}
            strokeWidth="2"
          />
          <text x="100" y="175" {...textStyle(step >= 0)}>x[n]</text>
          <text x="100" y="210" fill="#888" fontSize="11" fontFamily="sans-serif" textAnchor="middle">
            {step >= 5 ? 'N valori' : ''}
          </text>
          
          {/* Split lines */}
          {step >= 1 && (
            <g stroke="#ffd700" strokeWidth="3">
              <line x1="150" y1="175" x2="190" y2="175" />
              <line x1="190" y1="175" x2="240" y2="95" />
              <line x1="190" y1="175" x2="240" y2="255" />
            </g>
          )}
          
          {/* Low-pass filter (top) */}
          <rect x="250" y="75" width="100" height="40" rx="4"
            fill={step >= 2 ? '#00ff88' : '#222'}
            stroke={step >= 2 ? '#00ff88' : '#444'}
            strokeWidth="2"
          />
          <text x="300" y="95" {...textStyle(step >= 2)}>h₀ (LP)</text>
          
          {/* High-pass filter (bottom) */}
          <rect x="250" y="235" width="100" height="40" rx="4"
            fill={step >= 3 ? '#ff6b9d' : '#222'}
            stroke={step >= 3 ? '#ff6b9d' : '#444'}
            strokeWidth="2"
          />
          <text x="300" y="255" {...textStyle(step >= 3)}>h₁ (HP)</text>
          
          {/* Connections to decimators */}
          {step >= 4 && (
            <g strokeWidth="3">
              <line x1="350" y1="95" x2="390" y2="95" stroke="#00ff88" />
              <line x1="350" y1="255" x2="390" y2="255" stroke="#ff6b9d" />
            </g>
          )}
          
          {/* Decimation circles */}
          {step >= 4 && (
            <>
              <circle cx="415" cy="95" r="25" fill="#ffd700" />
              <text x="415" y="95" fill="#000" fontSize="16" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">↓2</text>
              <circle cx="415" cy="255" r="25" fill="#ffd700" />
              <text x="415" y="255" fill="#000" fontSize="16" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">↓2</text>
            </>
          )}
          
          {/* Connections to outputs */}
          {step >= 5 && (
            <g strokeWidth="3">
              <line x1="440" y1="95" x2="485" y2="95" stroke="#00ff88" />
              <line x1="440" y1="255" x2="485" y2="255" stroke="#ff6b9d" />
            </g>
          )}
          
          {/* Output boxes */}
          {step >= 5 && (
            <>
              <rect x="485" y="75" width="100" height="40" rx="4" fill="#00ff88" stroke="#00ff88" strokeWidth="2" />
              <text x="535" y="95" fill="#000" fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">cA</text>
              <text x="535" y="130" fill="#888" fontSize="11" fontFamily="sans-serif" textAnchor="middle">N/2</text>
              
              <rect x="485" y="235" width="100" height="40" rx="4" fill="#ff6b9d" stroke="#ff6b9d" strokeWidth="2" />
              <text x="535" y="255" fill="#000" fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">cD</text>
              <text x="535" y="290" fill="#888" fontSize="11" fontFamily="sans-serif" textAnchor="middle">N/2</text>
              
              {/* Labels - split into 2 lines to prevent overflow */}
              <text x="595" y="88" fill="#888" fontSize="12" fontFamily="sans-serif">Low-pass →</text>
              <text x="595" y="104" fill="#888" fontSize="12" fontFamily="sans-serif">Aproximare</text>
              
              <text x="595" y="248" fill="#888" fontSize="12" fontFamily="sans-serif">High-pass →</text>
              <text x="595" y="264" fill="#888" fontSize="12" fontFamily="sans-serif">Detalii</text>
            </>
          )}
        </svg>
      )
    }
    
    if (isSynthesis) {
      return (
        <svg viewBox="0 0 700 350" style={{ width: '100%', height: 'auto' }}>
          <rect width="700" height="350" fill="#0a0a1a" />
          
          <text x="350" y="25" fill="#ffd700" fontSize="16" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            BANCA DE SINTEZĂ (Reconstrucție)
          </text>
          
          {/* Input boxes */}
          <rect x="50" y="75" width="100" height="40" rx="4"
            fill={step >= 0 ? '#00ff88' : '#333'}
            stroke={step >= 0 ? '#00ff88' : '#555'}
            strokeWidth="2"
          />
          <text x="100" y="95" {...textStyle(step >= 0)}>cA</text>
          
          <rect x="50" y="235" width="100" height="40" rx="4"
            fill={step >= 0 ? '#ff6b9d' : '#333'}
            stroke={step >= 0 ? '#ff6b9d' : '#555'}
            strokeWidth="2"
          />
          <text x="100" y="255" {...textStyle(step >= 0)}>cD</text>
          
          {/* Upsampling */}
          {step >= 1 && (
            <>
              <line x1="150" y1="95" x2="175" y2="95" stroke="#00ff88" strokeWidth="3" />
              <line x1="150" y1="255" x2="175" y2="255" stroke="#ff6b9d" strokeWidth="3" />
              <circle cx="200" cy="95" r="20" fill="#ffd700" />
              <text x="200" y="95" fill="#000" fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">↑2</text>
              <circle cx="200" cy="255" r="20" fill="#ffd700" />
              <text x="200" y="255" fill="#000" fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">↑2</text>
            </>
          )}
          
          {/* g0, g1 filters */}
          {step >= 2 && (
            <>
              <line x1="220" y1="95" x2="260" y2="95" stroke="#666" strokeWidth="3" />
              <rect x="260" y="75" width="100" height="40" rx="4" fill="#00ff88" stroke="#00ff88" strokeWidth="2" />
              <text x="310" y="95" fill="#000" fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">g₀</text>
            </>
          )}
          {step >= 3 && (
            <>
              <line x1="220" y1="255" x2="260" y2="255" stroke="#666" strokeWidth="3" />
              <rect x="260" y="235" width="100" height="40" rx="4" fill="#ff6b9d" stroke="#ff6b9d" strokeWidth="2" />
              <text x="310" y="255" fill="#000" fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">g₁</text>
            </>
          )}
          
          {/* Addition */}
          {step >= 4 && (
            <>
              <line x1="360" y1="95" x2="440" y2="175" stroke="#666" strokeWidth="3" />
              <line x1="360" y1="255" x2="440" y2="175" stroke="#666" strokeWidth="3" />
              <circle cx="455" cy="175" r="20" fill="#ffd700" />
              <text x="455" y="175" fill="#000" fontSize="20" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle">+</text>
            </>
          )}
          
          {/* Output */}
          {step >= 5 && (
            <>
              <line x1="475" y1="175" x2="520" y2="175" stroke="#666" strokeWidth="3" />
              <rect x="520" y="155" width="100" height="40" rx="4" fill="#00d4ff" stroke="#00d4ff" strokeWidth="2" />
              <text x="570" y="175" fill="#000" fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">x̂[n]</text>
              <text x="350" y="330" fill="#00ff88" fontSize="13" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                ✓ Reconstrucție Perfectă: x̂[n] = x[n]
              </text>
            </>
          )}
        </svg>
      )
    }
    
    // Complete bank view
    return (
      <svg viewBox="0 0 900 350" style={{ width: '100%', height: 'auto' }}>
        <rect width="900" height="350" fill="#0a0a1a" />
        
        {/* Divider */}
        <line x1="450" y1="40" x2="450" y2="310" stroke="#444" strokeWidth="1" strokeDasharray="4,4" />
        
        {/* Analysis title */}
        <text x="225" y="25" fill="#ffd700" fontSize="14" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">ANALIZĂ</text>
        {/* Synthesis title */}
        <text x="675" y="25" fill="#ffd700" fontSize="14" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">SINTEZĂ</text>
        
        {/* === ANALYSIS SIDE (left) === */}
        {/* Input */}
        <rect x="20" y="155" width="70" height="35" rx="3" fill="#00d4ff" stroke="#00d4ff" strokeWidth="2" />
        <text x="55" y="172" fill="#000" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">x[n]</text>
        
        {/* Split */}
        <line x1="90" y1="172" x2="115" y2="172" stroke="#ffd700" strokeWidth="2" />
        <line x1="115" y1="172" x2="140" y2="95" stroke="#ffd700" strokeWidth="2" />
        <line x1="115" y1="172" x2="140" y2="250" stroke="#ffd700" strokeWidth="2" />
        
        {/* h0, h1 */}
        <rect x="145" y="78" width="70" height="35" rx="3" fill="#00ff88" stroke="#00ff88" strokeWidth="2" />
        <text x="180" y="95" fill="#000" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">h₀ (LP)</text>
        <rect x="145" y="232" width="70" height="35" rx="3" fill="#ff6b9d" stroke="#ff6b9d" strokeWidth="2" />
        <text x="180" y="250" fill="#000" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">h₁ (HP)</text>
        
        {/* Connections */}
        <line x1="215" y1="95" x2="240" y2="95" stroke="#00ff88" strokeWidth="2" />
        <line x1="215" y1="250" x2="240" y2="250" stroke="#ff6b9d" strokeWidth="2" />
        
        {/* Decimators */}
        <circle cx="260" cy="95" r="18" fill="#ffd700" />
        <text x="260" y="95" fill="#000" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">↓2</text>
        <circle cx="260" cy="250" r="18" fill="#ffd700" />
        <text x="260" y="250" fill="#000" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">↓2</text>
        
        {/* Connections */}
        <line x1="278" y1="95" x2="310" y2="95" stroke="#00ff88" strokeWidth="2" />
        <line x1="278" y1="250" x2="310" y2="250" stroke="#ff6b9d" strokeWidth="2" />
        
        {/* cA, cD */}
        <rect x="310" y="78" width="70" height="35" rx="3" fill="#00ff88" stroke="#00ff88" strokeWidth="2" />
        <text x="345" y="95" fill="#000" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">cA</text>
        <rect x="310" y="232" width="70" height="35" rx="3" fill="#ff6b9d" stroke="#ff6b9d" strokeWidth="2" />
        <text x="345" y="250" fill="#000" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">cD</text>
        
        {/* === SYNTHESIS SIDE (right) === */}
        {/* Connections from analysis */}
        <line x1="380" y1="95" x2="465" y2="95" stroke="#444" strokeWidth="2" strokeDasharray="4,4" />
        <line x1="380" y1="250" x2="465" y2="250" stroke="#444" strokeWidth="2" strokeDasharray="4,4" />
        
        {/* Upsamplers */}
        <circle cx="485" cy="95" r="15" fill="#ffd700" />
        <text x="485" y="95" fill="#000" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">↑2</text>
        <circle cx="485" cy="250" r="15" fill="#ffd700" />
        <text x="485" y="250" fill="#000" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">↑2</text>
        
        {/* Connections */}
        <line x1="500" y1="95" x2="525" y2="95" stroke="#666" strokeWidth="2" />
        <line x1="500" y1="250" x2="525" y2="250" stroke="#666" strokeWidth="2" />
        
        {/* g0, g1 */}
        <rect x="525" y="78" width="70" height="35" rx="3" fill="#00ff88" stroke="#00ff88" strokeWidth="2" />
        <text x="560" y="95" fill="#000" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">g₀</text>
        <rect x="525" y="232" width="70" height="35" rx="3" fill="#ff6b9d" stroke="#ff6b9d" strokeWidth="2" />
        <text x="560" y="250" fill="#000" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">g₁</text>
        
        {/* Connections to adder */}
        <line x1="595" y1="95" x2="650" y2="172" stroke="#666" strokeWidth="2" />
        <line x1="595" y1="250" x2="650" y2="172" stroke="#666" strokeWidth="2" />
        
        {/* Adder */}
        <circle cx="665" cy="172" r="15" fill="#ffd700" />
        <text x="665" y="172" fill="#000" fontSize="14" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle">+</text>
        
        {/* Output connection */}
        <line x1="680" y1="172" x2="720" y2="172" stroke="#666" strokeWidth="2" />
        
        {/* Output */}
        <rect x="720" y="155" width="70" height="35" rx="3" fill="#00d4ff" stroke="#00d4ff" strokeWidth="2" />
        <text x="755" y="172" fill="#000" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">x̂[n]</text>
        
        {/* Perfect reconstruction note */}
        <text x="450" y="330" fill="#00ff88" fontSize="12" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
          ✓ Reconstrucție Perfectă: x̂[n] = x[n]
        </text>
      </svg>
    )
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
          <div style={{
            borderRadius: '10px',
            border: '1px solid #333',
            overflow: 'hidden',
            background: '#0a0a1a'
          }}>
            <FilterBankDiagram view={activeView} step={animStep} />
          </div>

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
