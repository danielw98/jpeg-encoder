/**
 * ResultsPanel Component
 * 
 * Display encoding results and analysis
 */

import { EncodeResult } from '../hooks/useEncoder';

interface ResultsPanelProps {
  result: EncodeResult;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const spaceSavings = ((1 - result.compressedBytes / result.originalBytes) * 100).toFixed(1);

  return (
    <div className="results">
      {/* Main Stats */}
      <div className="stat-grid">
        <div className="stat-item">
          <div className="label">Compression Ratio</div>
          <div className="value">
            {result.compressionRatio.toFixed(1)}<span className="unit">×</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="label">Space Saved</div>
          <div className="value">
            {spaceSavings}<span className="unit">%</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="label">Original Size</div>
          <div className="value" style={{ fontSize: '1.25rem' }}>
            {formatBytes(result.originalBytes)}
          </div>
        </div>
        <div className="stat-item">
          <div className="label">Compressed Size</div>
          <div className="value" style={{ fontSize: '1.25rem' }}>
            {formatBytes(result.compressedBytes)}
          </div>
        </div>
      </div>

      {/* Image Info */}
      <div className="analysis-section" style={{ borderTop: 'none', paddingTop: 0 }}>
        <h3>Image Details</h3>
        <div className="analysis-grid">
          <div className="analysis-item">
            <div className="label">Original Size</div>
            <div className="value">{result.originalWidth} × {result.originalHeight}</div>
          </div>
          <div className="analysis-item">
            <div className="label">Padded Size</div>
            <div className="value">{result.paddedWidth} × {result.paddedHeight}</div>
          </div>
          <div className="analysis-item">
            <div className="label">Quality</div>
            <div className="value">{result.quality}</div>
          </div>
          <div className="analysis-item">
            <div className="label">Format</div>
            <div className="value">{result.format === 'color_420' ? 'YCbCr 4:2:0' : 'Grayscale'}</div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      {result.analysis && (
        <>
          {/* Entropy Analysis */}
          <div className="analysis-section">
            <h3>📊 Entropy Analysis</h3>
            <div className="analysis-grid">
              <div className="analysis-item">
                <div className="label">Original Entropy</div>
                <div className="value">{result.analysis.entropy.originalEntropy.toFixed(3)} bits/symbol</div>
              </div>
              <div className="analysis-item">
                <div className="label">Compressed Entropy</div>
                <div className="value">{result.analysis.entropy.compressedEntropy.toFixed(3)} bits/symbol</div>
              </div>
              <div className="analysis-item">
                <div className="label">Entropy Reduction</div>
                <div className="value">{result.analysis.entropy.entropyReductionPercent.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Block Statistics */}
          <div className="analysis-section">
            <h3>🧱 Block Statistics</h3>
            <div className="analysis-grid">
              <div className="analysis-item">
                <div className="label">Total Blocks</div>
                <div className="value">{result.analysis.blocks.total.toLocaleString()}</div>
              </div>
              <div className="analysis-item">
                <div className="label">Y (Luma)</div>
                <div className="value">{result.analysis.blocks.yLuma.toLocaleString()}</div>
              </div>
              <div className="analysis-item">
                <div className="label">Cb (Chroma)</div>
                <div className="value">{result.analysis.blocks.cbChroma.toLocaleString()}</div>
              </div>
              <div className="analysis-item">
                <div className="label">Cr (Chroma)</div>
                <div className="value">{result.analysis.blocks.crChroma.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* DCT Analysis */}
          <div className="analysis-section">
            <h3>🔄 DCT Analysis</h3>
            <div className="analysis-grid">
              <div className="analysis-item">
                <div className="label">DC Energy</div>
                <div className="value">{result.analysis.dctAnalysis.dcEnergyPercent.toFixed(1)}%</div>
              </div>
              <div className="analysis-item">
                <div className="label">AC Energy</div>
                <div className="value">{result.analysis.dctAnalysis.acEnergyPercent.toFixed(1)}%</div>
              </div>
              <div className="analysis-item">
                <div className="label">Avg DC Coefficient</div>
                <div className="value">{result.analysis.dctAnalysis.avgDcCoefficient.toFixed(2)}</div>
              </div>
              <div className="analysis-item">
                <div className="label">Avg AC Coefficient</div>
                <div className="value">{result.analysis.dctAnalysis.avgAcCoefficient.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Quantization */}
          <div className="analysis-section">
            <h3>📐 Quantization</h3>
            <div className="analysis-grid">
              <div className="analysis-item">
                <div className="label">Zero Coefficients</div>
                <div className="value">{result.analysis.quantization.zeroCoefficients.toLocaleString()}</div>
              </div>
              <div className="analysis-item">
                <div className="label">Sparsity</div>
                <div className="value">{result.analysis.quantization.sparsityPercent.toFixed(1)}%</div>
              </div>
              <div className="analysis-item">
                <div className="label">Avg Error</div>
                <div className="value">{result.analysis.quantization.avgError.toFixed(2)}</div>
              </div>
              <div className="analysis-item">
                <div className="label">Peak Error</div>
                <div className="value">{result.analysis.quantization.peakError.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* RLE Statistics */}
          <div className="analysis-section">
            <h3>🔢 RLE Statistics</h3>
            <div className="analysis-grid">
              <div className="analysis-item">
                <div className="label">Total Symbols</div>
                <div className="value">{result.analysis.rleStatistics.totalSymbols.toLocaleString()}</div>
              </div>
              <div className="analysis-item">
                <div className="label">ZRL Count</div>
                <div className="value">{result.analysis.rleStatistics.zrlCount.toLocaleString()}</div>
              </div>
              <div className="analysis-item">
                <div className="label">EOB Count</div>
                <div className="value">{result.analysis.rleStatistics.eobCount.toLocaleString()}</div>
              </div>
              <div className="analysis-item">
                <div className="label">Avg Run Length</div>
                <div className="value">{result.analysis.rleStatistics.avgRunLength.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Huffman Coding */}
          <div className="analysis-section">
            <h3>🌳 Huffman Coding</h3>
            <div className="analysis-grid">
              <div className="analysis-item">
                <div className="label">Total Bits</div>
                <div className="value">{result.analysis.huffmanCoding.totalBits.toLocaleString()}</div>
              </div>
              <div className="analysis-item">
                <div className="label">Avg Codeword Length</div>
                <div className="value">{result.analysis.huffmanCoding.avgCodewordLength.toFixed(2)} bits</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Download Link */}
      {result.outputUrl && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <a
            href={result.outputUrl}
            download
            className="btn btn-primary"
          >
            📥 Download JPEG
          </a>
        </div>
      )}
    </div>
  );
}
