import { useState } from 'react'
import LaTeX, { LaTeXBlock } from './LaTeX'

// Wavelet definitions with math and properties
const WAVELET_INFO = {
  haar: {
    name: 'Haar',
    fullName: 'Alfred Haar (1909)',
    category: 'Orthogonal',
    icon: '📐',
    color: '#00d9ff',
    description: 'Cel mai simplu wavelet - o funcție pas. Primul wavelet descoperit.',
    math: String.raw`\psi(t) = \begin{cases} 1 & 0 \le t < \frac{1}{2} \\ -1 & \frac{1}{2} \le t < 1 \\ 0 & \text{altfel} \end{cases}`,
    keyPoints: ['Suport compact [0,1]', 'Discontinuu', 'Ortogonal', 'Rapid O(n)'],
    bestFor: 'Tranziții bruște, muchii'
  },
  
  morlet: {
    name: 'Morlet',
    fullName: 'Jean Morlet (1982)',
    category: 'Continuous',
    icon: '🌊',
    color: '#ff6b9d',
    description: 'Sinusoidă modulată de Gaussian. Standard în analiza timp-frecvență.',
    math: String.raw`\psi(t) = \pi^{-1/4} \cdot e^{i\omega_0 t} \cdot e^{-t^2/2}`,
    keyPoints: ['Complex (Re + Im)', 'Suport infinit', 'Localizare optimă timp-frecvență'],
    bestFor: 'Semnale seismice, EEG/ECG'
  },

  gaussian: {
    name: 'Gaussian',
    fullName: 'Derivate Gaussiene',
    category: 'Continuous',
    icon: '📊',
    color: '#00ff88',
    description: 'Familie de wavelets din derivatele succesive ale Gaussienei.',
    math: String.raw`\psi_n(t) = C_n \cdot \frac{d^n}{dt^n}\left[e^{-t^2/2}\right]`,
    keyPoints: ['Ordinul n → formă', 'Infinit neted (C∞)', 'n=2 este Mexican Hat'],
    bestFor: 'Detectare muchii, computer vision'
  },

  mexican_hat: {
    name: 'Mexican Hat',
    fullName: 'Ricker / Marr Wavelet',
    category: 'Continuous',
    icon: '🎩',
    color: '#ffaa00',
    description: 'Derivata a 2-a a Gaussienei. Formă de pălărie mexicană.',
    math: String.raw`\psi(t) = (1 - t^2) \cdot e^{-t^2/2}`,
    keyPoints: ['Simetric', 'LoG în 2D', 'Zero crossings clare'],
    bestFor: 'Detectare blob, scale-space'
  },

  shannon: {
    name: 'Shannon',
    fullName: 'Sinc Wavelet',
    category: 'Continuous',
    icon: '📡',
    color: '#9d4edd',
    description: 'Wavelet ideal în frecvență - separare perfectă a benzilor.',
    math: String.raw`\psi(t) = \text{sinc}(t/2) \cdot \cos(3\pi t/2)`,
    keyPoints: ['Brick-wall în frecvență', 'Decadere lentă în timp', 'Artefacte Gibbs'],
    bestFor: 'Analiză teoretică, referință'
  },

  meyer: {
    name: 'Meyer',
    fullName: 'Yves Meyer (1985)',
    category: 'Orthogonal',
    icon: '🏆',
    color: '#06d6a0',
    description: 'Compromis elegant: ortogonal, neted, decadere rapidă.',
    math: String.raw`\Psi(\omega) \text{ definit prin } \nu(x)^2 + \nu(1-x)^2 = 1`,
    keyPoints: ['C∞ neted', 'Ortogonal complet', 'Decadere rapidă O(1/|t|^N)'],
    bestFor: 'Aplicații de înaltă calitate'
  }
}

export default function WaveletEducationView({ api, compact = false }) {
  const [selectedWavelet, setSelectedWavelet] = useState('haar')
  const info = WAVELET_INFO[selectedWavelet]

  return (
    <div className="wavelet-education-view" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '1rem',
      padding: compact ? '0.5rem' : '1rem',
      overflow: 'hidden'
    }}>
      {/* Title */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>🎓 Wavelets Fundamentale</h2>
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: '#888' }}>
          Selectează un wavelet pentru a vedea formula și proprietățile
        </p>
      </div>

      {/* Wavelet Selector */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0.5rem',
        flexShrink: 0
      }}>
        {Object.entries(WAVELET_INFO).map(([key, w]) => (
          <button
            key={key}
            onClick={() => setSelectedWavelet(key)}
            style={{
              padding: '0.5rem 0.8rem',
              border: selectedWavelet === key ? `2px solid ${w.color}` : '2px solid transparent',
              borderRadius: '8px',
              background: selectedWavelet === key ? `${w.color}22` : 'rgba(255,255,255,0.05)',
              color: selectedWavelet === key ? w.color : '#aaa',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.85rem',
              fontWeight: selectedWavelet === key ? '600' : '400'
            }}
          >
            <span style={{ marginRight: '0.4rem' }}>{w.icon}</span>
            {w.name}
          </button>
        ))}
      </div>

      {/* Selected Wavelet Details */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        minHeight: 0,
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.75rem',
          background: `${info.color}15`,
          borderRadius: '10px',
          borderLeft: `4px solid ${info.color}`
        }}>
          <span style={{ fontSize: '2rem' }}>{info.icon}</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, color: info.color, fontSize: '1.1rem' }}>{info.name}</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#888' }}>{info.fullName}</p>
          </div>
          <span style={{
            padding: '0.3rem 0.6rem',
            background: info.color,
            borderRadius: '12px',
            fontSize: '0.7rem',
            color: '#000',
            fontWeight: '600'
          }}>
            {info.category}
          </span>
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc', textAlign: 'center' }}>
          {info.description}
        </p>

        {/* Math Formula */}
        <div style={{
          padding: '1rem',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <LaTeXBlock math={info.math} />
        </div>

        {/* Key Points & Best For */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '1rem',
          alignItems: 'start'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}>
            {info.keyPoints.map((point, i) => (
              <span key={i} style={{
                padding: '0.3rem 0.6rem',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#aaa'
              }}>
                {point}
              </span>
            ))}
          </div>
          <div style={{
            padding: '0.4rem 0.8rem',
            background: `${info.color}20`,
            border: `1px solid ${info.color}40`,
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: info.color,
            whiteSpace: 'nowrap'
          }}>
            <strong>Best for:</strong> {info.bestFor}
          </div>
        </div>

        {/* CWT Formula */}
        <div style={{
          padding: '0.75rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#666' }}>
            Transformata Wavelet Continuă (CWT)
          </p>
          <LaTeX math={String.raw`W(a,b) = \int f(t) \cdot \frac{1}{\sqrt{a}} \psi^*\left(\frac{t-b}{a}\right) dt`} />
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.7rem', color: '#555' }}>
            a = scalare, b = translație
          </p>
        </div>
      </div>
    </div>
  )
}
