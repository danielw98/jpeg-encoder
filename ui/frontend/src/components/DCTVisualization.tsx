/**
 * DCTVisualization Component
 * 
 * Educational visualization of how DCT transforms image blocks
 * Shows the transformation process and why it enables compression
 */

import { useState } from 'react';
import { EncodeResult } from '../hooks/useEncoder';
import './DCTVisualization.css';

interface DCTVisualizationProps {
  result: EncodeResult;
}

// Standard JPEG luminance quantization matrix (quality 50)
const Q50_MATRIX = [
  [16, 11, 10, 16, 24, 40, 51, 61],
  [12, 12, 14, 19, 26, 58, 60, 55],
  [14, 13, 16, 24, 40, 57, 69, 56],
  [14, 17, 22, 29, 51, 87, 80, 62],
  [18, 22, 37, 56, 68, 109, 103, 77],
  [24, 35, 55, 64, 81, 104, 113, 92],
  [49, 64, 78, 87, 103, 121, 120, 101],
  [72, 92, 95, 98, 112, 100, 103, 99],
];

export function DCTVisualization({ result }: DCTVisualizationProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'transform' | 'quantize'>('overview');
  const analysis = result.analysis;

  if (!analysis) {
    return (
      <div className="dct-viz">
        <p className="no-data">No DCT analysis available</p>
      </div>
    );
  }

  const dcEnergy = analysis.dctAnalysis.dcEnergyPercent;
  const acEnergy = analysis.dctAnalysis.acEnergyPercent;
  const sparsity = analysis.quantization.sparsityPercent;
  const avgZeros = (analysis.quantization.zeroCoefficients / analysis.blocks.total) || 0;

  return (
    <div className="dct-viz">
      {/* Section Tabs */}
      <div className="dct-tabs">
        <button 
          className={`dct-tab ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          Overview
        </button>
        <button 
          className={`dct-tab ${activeSection === 'transform' ? 'active' : ''}`}
          onClick={() => setActiveSection('transform')}
        >
          DCT Transform
        </button>
        <button 
          className={`dct-tab ${activeSection === 'quantize' ? 'active' : ''}`}
          onClick={() => setActiveSection('quantize')}
        >
          Quantization
        </button>
      </div>

      {activeSection === 'overview' && (
        <div className="dct-section">
          <h3>What is DCT?</h3>
          <p className="dct-intro">
            The <strong>Discrete Cosine Transform</strong> converts pixel values into frequency components.
            This reveals that most image energy is concentrated in low frequencies, enabling efficient compression.
          </p>

          <div className="dct-flow">
            <div className="flow-step">
              <div className="flow-icon">🖼️</div>
              <div className="flow-label">8×8 Pixels</div>
              <div className="flow-desc">Image divided into blocks</div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-icon">📊</div>
              <div className="flow-label">DCT</div>
              <div className="flow-desc">Transform to frequencies</div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-icon">✂️</div>
              <div className="flow-label">Quantize</div>
              <div className="flow-desc">Remove small values</div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-icon">📦</div>
              <div className="flow-label">Encode</div>
              <div className="flow-desc">Compress with Huffman</div>
            </div>
          </div>

          <div className="dct-stats-grid">
            <div className="stat-card">
              <div className="stat-value dc-color">{dcEnergy.toFixed(1)}%</div>
              <div className="stat-label">DC Energy</div>
              <div className="stat-desc">Average brightness (1 coefficient)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value ac-color">{acEnergy.toFixed(1)}%</div>
              <div className="stat-label">AC Energy</div>
              <div className="stat-desc">Detail information (63 coefficients)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value sparse-color">{sparsity.toFixed(1)}%</div>
              <div className="stat-label">Zeros After Quantization</div>
              <div className="stat-desc">~{avgZeros.toFixed(0)} of 64 coefficients per block</div>
            </div>
          </div>

          <div className="dct-insight">
            <strong>💡 Key Insight:</strong> {dcEnergy.toFixed(0)}% of energy is in just the DC coefficient!
            This is why JPEG can achieve high compression - most AC coefficients become zero after quantization.
          </div>
        </div>
      )}

      {activeSection === 'transform' && (
        <div className="dct-section">
          <h3>DCT Basis Functions</h3>
          <p className="dct-intro">
            Each 8×8 block is represented as a weighted sum of 64 basis patterns.
            Low frequencies (top-left) capture smooth areas, high frequencies (bottom-right) capture edges.
          </p>

          <div className="basis-grid-container">
            <div className="basis-grid">
              {Array.from({ length: 8 }, (_, v) => (
                <div key={v} className="basis-row">
                  {Array.from({ length: 8 }, (_, u) => {
                    const freq = Math.sqrt(u * u + v * v);
                    const importance = Math.exp(-freq * 0.4);
                    return (
                      <div 
                        key={u} 
                        className={`basis-cell ${u === 0 && v === 0 ? 'dc' : ''}`}
                        style={{ backgroundColor: `rgba(59, 130, 246, ${importance})` }}
                        title={`(${u},${v}) - ${u === 0 && v === 0 ? 'DC' : `freq: ${freq.toFixed(1)}`}`}
                      >
                        {u === 0 && v === 0 ? 'DC' : 
                         u === 0 ? `V${v}` : 
                         v === 0 ? `H${u}` : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="basis-legend">
              <div className="legend-item">
                <span className="legend-color high"></span>
                <span>High importance (low freq)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color low"></span>
                <span>Low importance (high freq)</span>
              </div>
            </div>
          </div>

          <div className="freq-explanation">
            <div className="freq-item">
              <strong>DC (0,0)</strong>: Average value of the block (brightness)
            </div>
            <div className="freq-item">
              <strong>H1-H7</strong>: Horizontal frequency components (vertical edges)
            </div>
            <div className="freq-item">
              <strong>V1-V7</strong>: Vertical frequency components (horizontal edges)
            </div>
            <div className="freq-item">
              <strong>Diagonals</strong>: Combined horizontal + vertical patterns
            </div>
          </div>
        </div>
      )}

      {activeSection === 'quantize' && (
        <div className="dct-section">
          <h3>Quantization Matrix (Q={result.quality})</h3>
          <p className="dct-intro">
            DCT coefficients are divided by these values and rounded. Larger divisors = more loss.
            High frequencies (bottom-right) have larger divisors because the eye is less sensitive to them.
          </p>

          <div className="quant-container">
            <div className="quant-matrix">
              {Q50_MATRIX.map((row, y) => (
                <div key={y} className="quant-row">
                  {row.map((val, x) => {
                    // Scale by quality
                    const scaled = result.quality >= 50 
                      ? Math.round(val * (100 - result.quality) / 50)
                      : Math.round(val * 50 / result.quality);
                    const clamped = Math.max(1, Math.min(255, scaled || val));
                    const intensity = Math.min(clamped / 120, 1);
                    return (
                      <div 
                        key={x} 
                        className="quant-cell"
                        style={{ 
                          backgroundColor: `rgba(239, 68, 68, ${intensity})`,
                          color: intensity > 0.5 ? 'white' : '#ccc'
                        }}
                        title={`Division factor at (${x},${y})`}
                      >
                        {clamped}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="quant-info">
              <div className="quant-stat">
                <span className="label">Zeros per block:</span>
                <span className="value">{avgZeros.toFixed(1)} / 64</span>
              </div>
              <div className="quant-stat">
                <span className="label">Sparsity:</span>
                <span className="value">{sparsity.toFixed(1)}%</span>
              </div>
              <div className="quant-stat">
                <span className="label">Non-zero coeffs:</span>
                <span className="value">{(64 - avgZeros).toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="dct-insight">
            <strong>💡 Quality Trade-off:</strong> Lower quality = larger divisors = more zeros = smaller file but more artifacts.
            At Q={result.quality}, approximately {sparsity.toFixed(0)}% of coefficients become zero.
          </div>
        </div>
      )}
    </div>
  );
}
