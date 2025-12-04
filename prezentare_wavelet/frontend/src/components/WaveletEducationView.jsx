import { useState } from 'react'
import LaTeX, { LaTeXBlock } from './LaTeX'

// ========== CONTINUOUS WAVELETS (for CWT analysis) ==========
const CONTINUOUS_WAVELETS = {
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
  }
}

// ========== DISCRETE WAVELETS (for DWT / Mallat algorithm) ==========
const DISCRETE_WAVELETS = {
  haar: {
    name: 'Haar',
    fullName: 'Alfred Haar (1909)',
    category: 'Orthogonal',
    icon: '📐',
    color: '#00d9ff',
    description: 'Cel mai simplu wavelet - funcție pas. Primul wavelet descoperit, baza pentru înțelegerea DWT.',
    math: String.raw`\psi(t) = \begin{cases} 1 & 0 \le t < \frac{1}{2} \\ -1 & \frac{1}{2} \le t < 1 \\ 0 & \text{altfel} \end{cases}`,
    filterCoeffs: {
      lo: ['\\frac{1}{\\sqrt{2}}', '\\frac{1}{\\sqrt{2}}'],
      hi: ['\\frac{1}{\\sqrt{2}}', '-\\frac{1}{\\sqrt{2}}']
    },
    filterMath: String.raw`h = \left[\frac{1}{\sqrt{2}}, \frac{1}{\sqrt{2}}\right], \quad g = \left[\frac{1}{\sqrt{2}}, -\frac{1}{\sqrt{2}}\right]`,
    keyPoints: ['Suport compact [0,1]', 'Discontinuu', 'Ortogonal', 'Cel mai rapid O(n)', '2 coeficienți'],
    bestFor: 'Tranziții bruște, muchii, pedagogic',
    vanishingMoments: 1,
    filterLength: 2
  },
  
  daubechies: {
    name: 'Daubechies',
    fullName: 'Ingrid Daubechies (1988)',
    category: 'Orthogonal',
    icon: '🔬',
    color: '#ff6b6b',
    description: 'Familie de wavelets ortogonale cu suport compact. db4 este cel mai utilizat pentru analiza semnalelor.',
    math: String.raw`\phi(t) = \sqrt{2} \sum_{k=0}^{N-1} h_k \phi(2t - k)`,
    filterCoeffs: {
      lo: ['0.483', '0.836', '0.224', '-0.129'],
      hi: ['-0.129', '-0.224', '0.836', '-0.483']
    },
    filterMath: String.raw`\text{db4: } h = [0.483, 0.836, 0.224, -0.129]`,
    keyPoints: ['Suport compact', 'Neted (C^n)', 'dbN = N momente nule', 'Asimetric'],
    bestFor: 'Compresie audio/video, analiză generală',
    vanishingMoments: '2-10 (dbN)',
    filterLength: '2N (ex: db4 = 8 coef.)'
  },

  symlets: {
    name: 'Symlets',
    fullName: 'Daubechies Simetrizate',
    category: 'Near-Symmetric',
    icon: '⚖️',
    color: '#06d6a0',
    description: 'Modificare a Daubechies pentru a obține simetrie aproape perfectă. Reduce artefactele de fază.',
    math: String.raw`\text{sym}N: \text{Fază liniară aproape perfectă}`,
    filterMath: String.raw`\text{sym4: } h \approx [-0.076, -0.030, 0.498, 0.804, 0.298, -0.099, -0.013, 0.032]`,
    keyPoints: ['Aproape simetric', 'Fază liniară', 'Artefacte reduse', 'symN = dbN optimizat'],
    bestFor: 'Imagini, unde simetria contează',
    vanishingMoments: 'N',
    filterLength: '2N'
  },

  biorthogonal: {
    name: 'Biortogonal',
    fullName: 'Cohen-Daubechies-Feauveau',
    category: 'Biorthogonal',
    icon: '🎯',
    color: '#ffd93d',
    description: 'Filtre diferite pentru analiză și sinteză. Permite simetrie exactă. Folosit în JPEG2000!',
    math: String.raw`\langle \tilde{\psi}_{j,k}, \psi_{j',k'} \rangle = \delta_{j,j'} \delta_{k,k'}`,
    filterMath: String.raw`\text{bior4.4: Folosit în JPEG2000}`,
    keyPoints: ['Simetrie exactă', 'Reconstrucție perfectă', 'Filtre separate analiză/sinteză', 'Standard JPEG2000'],
    bestFor: 'JPEG2000, compresie imagini',
    vanishingMoments: 'N.M (ex: 4.4)',
    filterLength: 'Variabil (analiză ≠ sinteză)'
  },

  coiflets: {
    name: 'Coiflets',
    fullName: 'Coifman Wavelets',
    category: 'Near-Symmetric',
    icon: '🔮',
    color: '#9d4edd',
    description: 'Wavelets cu momente nule atât pentru ψ cât și pentru φ. Aproximare mai bună a funcțiilor smooth.',
    math: String.raw`\int t^k \phi(t) dt = 0, \quad k = 1, ..., N`,
    filterMath: String.raw`\text{coif2: } \phi \text{ are } 2N-1 \text{ momente nule}`,
    keyPoints: ['φ și ψ cu momente nule', 'Foarte neted', '6N coeficienți', 'Aproximare superioară'],
    bestFor: 'Aproximare funcții, analiza numerică',
    vanishingMoments: '2N',
    filterLength: '6N'
  }
}

// Admissibility condition and key theory
const WAVELET_THEORY = {
  admissibility: {
    title: 'Condiția de Admisibilitate',
    math: String.raw`\int_{-\infty}^{\infty} \psi(t) \, dt = 0`,
    description: 'Wavelet-ul trebuie să oscileze în jurul lui zero (media = 0)'
  },
  scalingEquation: {
    title: 'Ecuația de Scalare (Dilatație)',
    math: String.raw`\phi(t) = \sqrt{2} \sum_{k} h_k \, \phi(2t - k)`,
    description: 'Funcția de scalare φ se exprimă recursiv prin coeficienții h'
  },
  waveletEquation: {
    title: 'Ecuația Wavelet',
    math: String.raw`\psi(t) = \sqrt{2} \sum_{k} g_k \, \phi(2t - k)`,
    description: 'Wavelet-ul ψ se derivă din φ folosind coeficienții g'
  },
  qmf: {
    title: 'Filtre QMF (Quadrature Mirror)',
    math: String.raw`g_k = (-1)^k h_{N-1-k}`,
    description: 'Filtrul high-pass g se obține din low-pass h prin alternare de semn'
  }
}

export default function WaveletEducationView({ api, compact = false }) {
  const [activeTab, setActiveTab] = useState('discrete') // 'continuous' | 'discrete' | 'theory'
  const [selectedContinuous, setSelectedContinuous] = useState('morlet')
  const [selectedDiscrete, setSelectedDiscrete] = useState('haar')

  const contInfo = CONTINUOUS_WAVELETS[selectedContinuous]
  const discInfo = DISCRETE_WAVELETS[selectedDiscrete]

  const renderWaveletCard = (info, isDiscrete = false) => (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      minHeight: 0,
      overflow: 'auto',
      justifyContent: 'center'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '1rem 1.5rem',
        background: `${info.color}15`,
        borderRadius: '12px',
        borderLeft: `5px solid ${info.color}`
      }}>
        <span style={{ fontSize: '2.5rem' }}>{info.icon}</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, color: info.color, fontSize: '1.4rem' }}>{info.name}</h3>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.95rem', color: '#888' }}>{info.fullName}</p>
        </div>
        <span style={{
          padding: '0.4rem 0.8rem',
          background: info.color,
          borderRadius: '12px',
          fontSize: '0.85rem',
          color: '#000',
          fontWeight: '600'
        }}>
          {info.category}
        </span>
      </div>

      {/* Description */}
      <p style={{ margin: 0, fontSize: '1.05rem', color: '#ccc', textAlign: 'center', padding: '0 1rem' }}>
        {info.description}
      </p>

      {/* Math Formula */}
      <div style={{
        padding: '1rem 1.5rem',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '10px',
        textAlign: 'center',
        fontSize: '1.2rem'
      }}>
        <LaTeXBlock math={info.math} />
      </div>

      {/* Filter Coefficients for DWT */}
      {isDiscrete && info.filterMath && (
        <div style={{
          padding: '0.8rem 1.2rem',
          background: 'rgba(255,215,0,0.1)',
          border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#ffd700' }}>
            📊 Coeficienții Filtrului
          </p>
          <div style={{ fontSize: '1.1rem' }}>
            <LaTeX math={info.filterMath} />
          </div>
        </div>
      )}

      {/* Key Points & Best For */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'center'
        }}>
          {info.keyPoints.map((point, i) => (
            <span key={i} style={{
              padding: '0.4rem 0.8rem',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '6px',
              fontSize: '0.9rem',
              color: '#bbb'
            }}>
              {point}
            </span>
          ))}
        </div>
        <div style={{
          padding: '0.5rem 1rem',
          background: `${info.color}20`,
          border: `1px solid ${info.color}40`,
          borderRadius: '8px',
          fontSize: '1rem',
          color: info.color,
          textAlign: 'center'
        }}>
          <strong>Best for:</strong> {info.bestFor}
        </div>
      </div>

      {/* Additional info for discrete */}
      {isDiscrete && info.vanishingMoments && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          fontSize: '0.95rem',
          color: '#888'
        }}>
          <span>📈 Momente nule: <strong style={{ color: '#fff' }}>{info.vanishingMoments}</strong></span>
          <span>📏 Lungime filtru: <strong style={{ color: '#fff' }}>{info.filterLength}</strong></span>
        </div>
      )}
    </div>
  )

  const renderTheoryTab = () => {
    const theoryItems = Object.entries(WAVELET_THEORY)
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem',
        padding: '1rem'
      }}>
        {/* Row 1: First two theory items */}
        <div style={{
          flex: 1,
          display: 'flex',
          gap: '1.2rem'
        }}>
          {theoryItems.slice(0, 2).map(([key, item]) => (
            <div key={key} style={{
              flex: 1,
              padding: '1.2rem 1.5rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              borderLeft: '5px solid #00d4ff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '0.6rem'
            }}>
              <h4 style={{ margin: 0, color: '#00d4ff', fontSize: '1.3rem' }}>
                {item.title}
              </h4>
              <div style={{ textAlign: 'center', fontSize: '1.5rem' }}>
                <LaTeX math={item.math} />
              </div>
              <p style={{ margin: 0, fontSize: '1.05rem', color: '#aaa' }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Row 2: Items 3 and 4 */}
        <div style={{
          flex: 1,
          display: 'flex',
          gap: '1.2rem'
        }}>
          {theoryItems.slice(2, 4).map(([key, item]) => (
            <div key={key} style={{
              flex: 1,
              padding: '1.2rem 1.5rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              borderLeft: '5px solid #00d4ff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '0.6rem'
            }}>
              <h4 style={{ margin: 0, color: '#00d4ff', fontSize: '1.3rem' }}>
                {item.title}
              </h4>
              <div style={{ textAlign: 'center', fontSize: '1.5rem' }}>
                <LaTeX math={item.math} />
              </div>
              <p style={{ margin: 0, fontSize: '1.05rem', color: '#aaa' }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
        
        {/* Row 3: CWT Formula - full width */}
        <div style={{
          flex: 1,
          padding: '1.2rem 2rem',
          background: 'rgba(255,107,155,0.1)',
          borderRadius: '12px',
          borderLeft: '5px solid #ff6b9d',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.8rem'
        }}>
          <p style={{ margin: 0, fontSize: '1.3rem', color: '#ff6b9d', fontWeight: '600' }}>
            🌊 Transformata Wavelet Continuă (CWT)
          </p>
          <div style={{ fontSize: '1.6rem' }}>
            <LaTeX math={String.raw`W(a,b) = \int_{-\infty}^{\infty} f(t) \cdot \frac{1}{\sqrt{a}} \psi^*\left(\frac{t-b}{a}\right) dt`} />
          </div>
          <p style={{ margin: 0, fontSize: '1.1rem', color: '#aaa' }}>
            Analizează semnalul la toate scalele și pozițiile
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="wavelet-education-view" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '1rem',
      padding: compact ? '0.6rem' : '1rem',
      overflow: 'hidden'
    }}>
      {/* Title */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#fff' }}>🎓 Familii Wavelet Complete</h2>
        <p style={{ margin: '0.3rem 0 0', fontSize: '1rem', color: '#888' }}>
          CWT pentru analiză timp-frecvență • DWT pentru Mallat/JPEG2000
        </p>
      </div>

      {/* Tab Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        flexShrink: 0
      }}>
        {[
          { id: 'discrete', label: '🔬 DWT (Discrete)', desc: 'Mallat, JPEG2000' },
          { id: 'continuous', label: '🌊 CWT (Continuous)', desc: 'Analiză' },
          { id: 'theory', label: '📐 Teorie', desc: 'Formule' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.6rem 1.2rem',
              border: activeTab === tab.id ? '2px solid #00d4ff' : '2px solid transparent',
              borderRadius: '10px',
              background: activeTab === tab.id ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.id ? '#00d4ff' : '#888',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '1rem',
              fontWeight: activeTab === tab.id ? '600' : '400'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'discrete' && (
        <>
          {/* Discrete Wavelet Selector */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem',
            flexShrink: 0
          }}>
            {Object.entries(DISCRETE_WAVELETS).map(([key, w]) => (
              <button
                key={key}
                onClick={() => setSelectedDiscrete(key)}
                style={{
                  padding: '0.5rem 1rem',
                  border: selectedDiscrete === key ? `2px solid ${w.color}` : '2px solid transparent',
                  borderRadius: '8px',
                  background: selectedDiscrete === key ? `${w.color}22` : 'rgba(255,255,255,0.05)',
                  color: selectedDiscrete === key ? w.color : '#aaa',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem',
                  fontWeight: selectedDiscrete === key ? '600' : '400'
                }}
              >
                <span style={{ marginRight: '0.4rem' }}>{w.icon}</span>
                {w.name}
              </button>
            ))}
          </div>
          {renderWaveletCard(discInfo, true)}
        </>
      )}

      {activeTab === 'continuous' && (
        <>
          {/* Continuous Wavelet Selector */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem',
            flexShrink: 0
          }}>
            {Object.entries(CONTINUOUS_WAVELETS).map(([key, w]) => (
              <button
                key={key}
                onClick={() => setSelectedContinuous(key)}
                style={{
                  padding: '0.5rem 1rem',
                  border: selectedContinuous === key ? `2px solid ${w.color}` : '2px solid transparent',
                  borderRadius: '8px',
                  background: selectedContinuous === key ? `${w.color}22` : 'rgba(255,255,255,0.05)',
                  color: selectedContinuous === key ? w.color : '#aaa',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem',
                  fontWeight: selectedContinuous === key ? '600' : '400'
                }}
              >
                <span style={{ marginRight: '0.4rem' }}>{w.icon}</span>
                {w.name}
              </button>
            ))}
          </div>
          {renderWaveletCard(contInfo, false)}
        </>
      )}

      {activeTab === 'theory' && renderTheoryTab()}
    </div>
  )
}
