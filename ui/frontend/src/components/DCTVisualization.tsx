/**
 * DCTVisualization Component
 * 
 * Visualizes DCT coefficients in an 8×8 block heatmap
 * Shows how energy is distributed across frequency components
 */

import { useMemo } from 'react';
import { EncodeResult } from '../hooks/useEncoder';

interface DCTVisualizationProps {
  result: EncodeResult;
}

// Standard JPEG luminance quantization matrix (quality 50)
const STANDARD_QUANTIZATION_MATRIX = [
  [16, 11, 10, 16, 24, 40, 51, 61],
  [12, 12, 14, 19, 26, 58, 60, 55],
  [14, 13, 16, 24, 40, 57, 69, 56],
  [14, 17, 22, 29, 51, 87, 80, 62],
  [18, 22, 37, 56, 68, 109, 103, 77],
  [24, 35, 55, 64, 81, 104, 113, 92],
  [49, 64, 78, 87, 103, 121, 120, 101],
  [72, 92, 95, 98, 112, 100, 103, 99],
];

// DCT basis function visualization (simplified)
const DCT_BASIS_LABELS = [
  ['DC', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7'],
  ['V1', '↘', '→', '↘', '→', '↘', '→', '↘'],
  ['V2', '→', '↘', '→', '↘', '→', '↘', '→'],
  ['V3', '↘', '→', '↘', '→', '↘', '→', '↘'],
  ['V4', '→', '↘', '→', '↘', '→', '↘', '→'],
  ['V5', '↘', '→', '↘', '→', '↘', '→', '↘'],
  ['V6', '→', '↘', '→', '↘', '→', '↘', '→'],
  ['V7', '↘', '→', '↘', '→', '↘', '→', '↘'],
];

export function DCTVisualization({ result }: DCTVisualizationProps) {
  const analysis = result.analysis;
  
  // Generate a representative energy distribution based on DCT analysis
  const energyMatrix = useMemo(() => {
    if (!analysis) return null;
    
    const dcEnergy = analysis.dctAnalysis.dcEnergyPercent;
    const acEnergy = analysis.dctAnalysis.acEnergyPercent;
    
    // Create a simulated energy distribution matrix
    // DC coefficient has most energy, decreases with frequency
    const matrix: number[][] = [];
    
    for (let y = 0; y < 8; y++) {
      const row: number[] = [];
      for (let x = 0; x < 8; x++) {
        const freq = Math.sqrt(x * x + y * y);
        if (x === 0 && y === 0) {
          // DC coefficient
          row.push(dcEnergy);
        } else {
          // AC coefficients - energy decreases with frequency
          const decay = Math.exp(-freq * 0.3);
          row.push(acEnergy * decay / 5);
        }
      }
      matrix.push(row);
    }
    
    return matrix;
  }, [analysis]);

  if (!analysis) {
    return (
      <div className="dct-visualization">
        <p className="no-data">No DCT analysis available</p>
      </div>
    );
  }

  const getHeatmapColor = (value: number, max: number) => {
    const normalized = Math.min(value / max, 1);
    // Blue (cold) to Red (hot) gradient
    const r = Math.round(255 * normalized);
    const g = Math.round(50 * (1 - normalized));
    const b = Math.round(255 * (1 - normalized));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const maxEnergy = energyMatrix ? Math.max(...energyMatrix.flat()) : 1;

  return (
    <div className="dct-visualization">
      <h3>🔄 DCT Energy Distribution</h3>
      
      {/* Energy Summary */}
      <div className="dct-summary">
        <div className="dct-stat">
          <div className="dct-stat-value">{analysis.dctAnalysis.dcEnergyPercent.toFixed(1)}%</div>
          <div className="dct-stat-label">DC Energy</div>
        </div>
        <div className="dct-stat">
          <div className="dct-stat-value">{analysis.dctAnalysis.acEnergyPercent.toFixed(1)}%</div>
          <div className="dct-stat-label">AC Energy</div>
        </div>
        <div className="dct-stat">
          <div className="dct-stat-value">{analysis.quantization.sparsityPercent.toFixed(1)}%</div>
          <div className="dct-stat-label">Sparsity</div>
        </div>
      </div>

      {/* 8×8 Heatmap */}
      <div className="dct-heatmap-container">
        <div className="dct-heatmap">
          {energyMatrix?.map((row, y) => (
            <div key={y} className="dct-row">
              {row.map((value, x) => (
                <div
                  key={x}
                  className={`dct-cell ${x === 0 && y === 0 ? 'dc-cell' : ''}`}
                  style={{ backgroundColor: getHeatmapColor(value, maxEnergy) }}
                  title={`(${x},${y}): ${value.toFixed(2)}%`}
                >
                  <span className="dct-cell-label">{DCT_BASIS_LABELS[y][x]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="dct-legend">
          <div className="legend-gradient"></div>
          <div className="legend-labels">
            <span>Low</span>
            <span>High</span>
          </div>
          <div className="legend-title">Energy</div>
        </div>
      </div>

      {/* Frequency explanation */}
      <div className="dct-explanation">
        <div className="freq-axis">
          <span className="axis-label">← Low Frequency</span>
          <span className="axis-label">High Frequency →</span>
        </div>
        <p>
          <strong>DC (0,0):</strong> Average brightness<br/>
          <strong>H1-H7:</strong> Horizontal detail<br/>
          <strong>V1-V7:</strong> Vertical detail<br/>
          <strong>Diagonal:</strong> Combined H+V detail
        </p>
      </div>

      {/* Quantization Matrix */}
      <div className="quant-matrix-section">
        <h4>📐 Standard Quantization Matrix</h4>
        <p className="quant-desc">
          Higher values = more aggressive quantization = more zeros
        </p>
        <div className="quant-matrix">
          {STANDARD_QUANTIZATION_MATRIX.map((row, y) => (
            <div key={y} className="quant-row">
              {row.map((value, x) => (
                <div
                  key={x}
                  className="quant-cell"
                  style={{
                    backgroundColor: `rgba(37, 99, 235, ${value / 150})`,
                    color: value > 75 ? 'white' : 'inherit'
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
