import { LaTeXBlock } from './LaTeX'
import '../styles/views/denoise.css'

export default function DenoiseTheoryView({ compact = false }) {
  return (
    <div className={`denoise-theory-view ${compact ? 'compact' : ''}`}>
      <div className="denoise-theory-content">
        {/* Main theory section */}
        <div className="theory-section main-theory">
          <h2>🔇 Wavelet Denoising</h2>
          
          <div className="info-box">
            <p>
              <strong>Denoising prin thresholding:</strong> Zgomotul produce coeficienți 
              wavelet mici, în timp ce semnalul util produce coeficienți mari. 
              Prin eliminarea/atenuarea coeficienților sub un prag, păstrăm semnalul.
            </p>
          </div>

          <div className="math-formulas">
            <div className="formula-row">
              <span className="formula-label">Soft thresholding:</span>
              <div className="formula-math">
                <LaTeXBlock math={String.raw`\eta_s(x, \lambda) = \text{sign}(x) \cdot \max(|x| - \lambda, 0)`} />
              </div>
            </div>
            <div className="formula-row">
              <span className="formula-label">Hard thresholding:</span>
              <div className="formula-math">
                <LaTeXBlock math={String.raw`\eta_h(x, \lambda) = x \cdot \mathbb{1}(|x| > \lambda)`} />
              </div>
            </div>
          </div>
        </div>

        {/* Comparison section */}
        <div className="theory-section comparison-section">
          <h2>📚 Soft vs Hard Thresholding</h2>
          
          <div className="threshold-comparison">
            <div className="threshold-card soft">
              <div className="card-header">
                <h3>✨ Soft Thresholding</h3>
                <div className="threshold-visual">
                  <svg viewBox="0 0 120 80" className="threshold-graph">
                    {/* Axes */}
                    <line x1="10" y1="40" x2="110" y2="40" stroke="#555" strokeWidth="1"/>
                    <line x1="60" y1="10" x2="60" y2="70" stroke="#555" strokeWidth="1"/>
                    {/* Input line (gray dashed) */}
                    <line x1="10" y1="70" x2="110" y2="10" stroke="#444" strokeWidth="1" strokeDasharray="3,3"/>
                    {/* Soft threshold curve - correct shape */}
                    <path d="M 10 55 L 35 40 L 85 40 L 110 25" 
                          fill="none" stroke="#00ff88" strokeWidth="2.5"/>
                    {/* Lambda markers */}
                    <text x="32" y="52" fill="#888" fontSize="8">-λ</text>
                    <text x="82" y="52" fill="#888" fontSize="8">+λ</text>
                  </svg>
                </div>
              </div>
              <p>
                Reduce continuu coeficienții spre zero. Rezultate netede,
                fără discontinuități. <strong>Preferat în practică.</strong>
              </p>
            </div>

            <div className="threshold-card hard">
              <div className="card-header">
                <h3>⚡ Hard Thresholding</h3>
                <div className="threshold-visual">
                  <svg viewBox="0 0 120 80" className="threshold-graph">
                    {/* Axes */}
                    <line x1="10" y1="40" x2="110" y2="40" stroke="#555" strokeWidth="1"/>
                    <line x1="60" y1="10" x2="60" y2="70" stroke="#555" strokeWidth="1"/>
                    {/* Input line (gray dashed) */}
                    <line x1="10" y1="70" x2="110" y2="10" stroke="#444" strokeWidth="1" strokeDasharray="3,3"/>
                    {/* Hard threshold curve - correct shape with jumps */}
                    <path d="M 10 55 L 35 55" fill="none" stroke="#ffaa00" strokeWidth="2.5"/>
                    <line x1="35" y1="55" x2="35" y2="40" stroke="#ffaa00" strokeWidth="2.5" strokeDasharray="2,2"/>
                    <path d="M 35 40 L 85 40" fill="none" stroke="#ffaa00" strokeWidth="2.5"/>
                    <line x1="85" y1="40" x2="85" y2="25" stroke="#ffaa00" strokeWidth="2.5" strokeDasharray="2,2"/>
                    <path d="M 85 25 L 110 25" fill="none" stroke="#ffaa00" strokeWidth="2.5"/>
                    {/* Lambda markers */}
                    <text x="32" y="52" fill="#888" fontSize="8">-λ</text>
                    <text x="82" y="52" fill="#888" fontSize="8">+λ</text>
                  </svg>
                </div>
              </div>
              <p>
                Elimină complet sub prag, păstrează exact restul.
                Poate produce artefacte, dar păstrează muchiile.
              </p>
            </div>
          </div>
        </div>

        {/* Process steps */}
        <div className="theory-section process-section">
          <h3>🔄 Procesul de Denoising</h3>
          <div className="process-steps">
            <div className="step">
              <span className="step-num">1</span>
              <span className="step-text">DWT</span>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-num">2</span>
              <span className="step-text">Threshold</span>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-num">3</span>
              <span className="step-text">IDWT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
