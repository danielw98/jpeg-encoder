/**
 * ResultsPanel Component
 * 
 * Compact display of encoding results with tables
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCubes, faWaveSquare, faSliders, faBarcode, faChartBar, faTree } from '@fortawesome/free-solid-svg-icons';
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
  const analysis = result.analysis;

  return (
    <div className="results-compact">
      {/* Hero Stats - Most Important */}
      <div className="hero-stats">
        <div className="hero-stat primary">
          <span className="hero-value">{result.compressionRatio.toFixed(1)}×</span>
          <span className="hero-label">Compression</span>
        </div>
        <div className="hero-stat success">
          <span className="hero-value">{spaceSavings}%</span>
          <span className="hero-label">Space Saved</span>
        </div>
        <div className="hero-stat">
          <span className="hero-value">{formatBytes(result.originalBytes)}</span>
          <span className="hero-label">Original</span>
        </div>
        <div className="hero-stat">
          <span className="hero-value">{formatBytes(result.compressedBytes)}</span>
          <span className="hero-label">Compressed</span>
        </div>
      </div>

      {/* Image Info Row */}
      <div className="info-row">
        <span><strong>Size:</strong> {result.originalWidth}×{result.originalHeight}</span>
        <span><strong>Quality:</strong> {result.quality}</span>
        <span><strong>Format:</strong> {result.format === 'color_420' ? 'YCbCr 4:2:0' : 'Grayscale'}</span>
      </div>

      {/* Detailed Analysis - 4 Column Grid */}
      {analysis && (
        <div className="stats-grid-4col">
          {/* Blocks */}
          <div className="stats-box">
            <h4><FontAwesomeIcon icon={faCubes} /> Blocks</h4>
            <div className="stats-rows">
              <div className="stat-row"><span>Total</span><span>{analysis.blocks.total.toLocaleString()}</span></div>
              <div className="stat-row"><span>Y (Luma)</span><span>{analysis.blocks.yLuma.toLocaleString()}</span></div>
              <div className="stat-row"><span>Cb</span><span>{analysis.blocks.cbChroma.toLocaleString()}</span></div>
              <div className="stat-row"><span>Cr</span><span>{analysis.blocks.crChroma.toLocaleString()}</span></div>
            </div>
          </div>

          {/* DCT Energy */}
          <div className="stats-box">
            <h4><FontAwesomeIcon icon={faWaveSquare} /> DCT Energy</h4>
            <div className="stats-rows">
              <div className="stat-row"><span>DC</span><span>{analysis.dctAnalysis.dcEnergyPercent.toFixed(1)}%</span></div>
              <div className="stat-row"><span>AC</span><span>{analysis.dctAnalysis.acEnergyPercent.toFixed(1)}%</span></div>
              <div className="stat-row"><span>Avg DC</span><span>{analysis.dctAnalysis.avgDcCoefficient.toFixed(1)}</span></div>
              <div className="stat-row"><span>Avg AC</span><span>{analysis.dctAnalysis.avgAcCoefficient.toFixed(1)}</span></div>
            </div>
          </div>

          {/* Quantization */}
          <div className="stats-box">
            <h4><FontAwesomeIcon icon={faSliders} /> Quantization</h4>
            <div className="stats-rows">
              <div className="stat-row"><span>Zeros</span><span>{analysis.quantization.zeroCoefficients.toLocaleString()}</span></div>
              <div className="stat-row"><span>Sparsity</span><span>{analysis.quantization.sparsityPercent.toFixed(1)}%</span></div>
              <div className="stat-row"><span>Avg Err</span><span>{analysis.quantization.avgError.toFixed(2)}</span></div>
              <div className="stat-row"><span>Peak Err</span><span>{analysis.quantization.peakError.toFixed(1)}</span></div>
            </div>
          </div>

          {/* RLE */}
          <div className="stats-box">
            <h4><FontAwesomeIcon icon={faBarcode} /> RLE</h4>
            <div className="stats-rows">
              <div className="stat-row"><span>Symbols</span><span>{analysis.rleStatistics.totalSymbols.toLocaleString()}</span></div>
              <div className="stat-row"><span>ZRL</span><span>{analysis.rleStatistics.zrlCount.toLocaleString()}</span></div>
              <div className="stat-row"><span>EOB</span><span>{analysis.rleStatistics.eobCount.toLocaleString()}</span></div>
              <div className="stat-row"><span>Avg Run</span><span>{analysis.rleStatistics.avgRunLength.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Entropy - spans 2 columns */}
          <div className="stats-box wide">
            <h4><FontAwesomeIcon icon={faChartBar} /> Entropy Analysis</h4>
            <div className="stats-rows horizontal">
              <div className="stat-row"><span>Source</span><span>{analysis.entropy.originalEntropy.toFixed(3)} b/sym</span></div>
              <div className="stat-row"><span>Coded</span><span>{analysis.entropy.compressedEntropy.toFixed(3)} b/sym</span></div>
              <div className="stat-row"><span>Total Bits</span><span>{analysis.huffmanCoding.totalBits.toLocaleString()}</span></div>
            </div>
          </div>

          {/* Huffman - spans 2 columns */}
          <div className="stats-box wide">
            <h4><FontAwesomeIcon icon={faTree} /> Huffman Coding</h4>
            <div className="stats-rows horizontal">
              <div className="stat-row"><span>Avg Codeword</span><span>{analysis.huffmanCoding.avgCodewordLength.toFixed(2)} bits</span></div>
              <div className="stat-row">
                <span>Efficiency</span>
                <span className={analysis.entropy.entropyReductionPercent >= 0 ? 'text-success' : 'text-warning'}>
                  {analysis.entropy.entropyReductionPercent >= 0 
                    ? `${analysis.entropy.entropyReductionPercent.toFixed(1)}% saved`
                    : `${Math.abs(analysis.entropy.entropyReductionPercent).toFixed(1)}% overhead`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Link */}
      {result.outputUrl && (
        <div className="download-row">
          <a href={result.outputUrl} download className="btn btn-primary btn-sm">
            📥 Download JPEG
          </a>
        </div>
      )}
    </div>
  );
}
