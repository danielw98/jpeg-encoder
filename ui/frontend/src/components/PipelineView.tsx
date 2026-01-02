/**
 * PipelineView Component
 * 
 * Step-by-step visualization of the JPEG encoding pipeline
 * Shows each stage with data flow and statistics
 */

import { useState } from 'react';
import { EncodeResult } from '../hooks/useEncoder';

interface PipelineViewProps {
  result: EncodeResult;
}

interface PipelineStep {
  id: string;
  name: string;
  icon: string;
  description: string;
  details: string[];
  color: string;
}

export function PipelineView({ result }: PipelineViewProps) {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  
  const analysis = result.analysis;
  
  // Define pipeline steps with data from the result
  const steps: PipelineStep[] = [
    {
      id: 'input',
      name: 'Input Image',
      icon: '🖼️',
      description: 'Load raw pixel data',
      details: [
        `Dimensions: ${result.originalWidth} × ${result.originalHeight}`,
        `Raw size: ${formatBytes(result.originalBytes)}`,
        `Padded: ${result.paddedWidth} × ${result.paddedHeight}`,
        `Format: RGB (24-bit color)`,
      ],
      color: '#3b82f6',
    },
    {
      id: 'colorspace',
      name: 'Color Convert',
      icon: '🎨',
      description: 'RGB → YCbCr',
      details: [
        `Y: Luminance (brightness)`,
        `Cb: Blue chrominance`,
        `Cr: Red chrominance`,
        `Decorrelates color channels`,
      ],
      color: '#8b5cf6',
    },
    {
      id: 'subsample',
      name: 'Subsampling',
      icon: '📉',
      description: result.format === 'color_420' ? '4:2:0 Chroma' : 'None (Grayscale)',
      details: result.format === 'color_420' ? [
        `Y: Full resolution`,
        `Cb/Cr: Half H × Half V`,
        `Data reduction: ~50%`,
        `Exploits color insensitivity`,
      ] : [
        `Grayscale mode`,
        `Only Y channel encoded`,
        `No chroma channels`,
      ],
      color: '#ec4899',
    },
    {
      id: 'blocks',
      name: 'Block Split',
      icon: '🧱',
      description: '8×8 pixel blocks',
      details: analysis ? [
        `Total blocks: ${analysis.blocks.total.toLocaleString()}`,
        `Y (luma): ${analysis.blocks.yLuma.toLocaleString()}`,
        `Cb: ${analysis.blocks.cbChroma.toLocaleString()}`,
        `Cr: ${analysis.blocks.crChroma.toLocaleString()}`,
      ] : [
        `Image divided into 8×8 blocks`,
        `Each block processed independently`,
      ],
      color: '#f59e0b',
    },
    {
      id: 'dct',
      name: 'DCT Transform',
      icon: '🔄',
      description: 'Spatial → Frequency',
      details: analysis ? [
        `DC energy: ${analysis.dctAnalysis.dcEnergyPercent.toFixed(1)}%`,
        `AC energy: ${analysis.dctAnalysis.acEnergyPercent.toFixed(1)}%`,
        `Avg DC coef: ${analysis.dctAnalysis.avgDcCoefficient.toFixed(1)}`,
        `Avg AC coef: ${analysis.dctAnalysis.avgAcCoefficient.toFixed(2)}`,
      ] : [
        `2D DCT-II applied to each block`,
        `Concentrates energy in DC coefficient`,
      ],
      color: '#10b981',
    },
    {
      id: 'quantize',
      name: 'Quantization',
      icon: '📐',
      description: 'Lossy compression',
      details: analysis ? [
        `Quality: ${result.quality}`,
        `Zero coefficients: ${analysis.quantization.zeroCoefficients.toLocaleString()}`,
        `Sparsity: ${analysis.quantization.sparsityPercent.toFixed(1)}%`,
        `Avg error: ${analysis.quantization.avgError.toFixed(2)}`,
      ] : [
        `Divide by quantization matrix`,
        `Higher Q = less quantization`,
        `Creates many zeros in high freq`,
      ],
      color: '#ef4444',
    },
    {
      id: 'zigzag',
      name: 'Zig-Zag Scan',
      icon: '↯',
      description: '2D → 1D reorder',
      details: [
        `Groups zeros at end`,
        `Low freq → high freq order`,
        `Enables efficient RLE`,
        `64 coefficients per block`,
      ],
      color: '#6366f1',
    },
    {
      id: 'rle',
      name: 'RLE Encoding',
      icon: '📦',
      description: 'Run-Length Encoding',
      details: analysis ? [
        `Total symbols: ${analysis.rleStatistics.totalSymbols.toLocaleString()}`,
        `EOB count: ${analysis.rleStatistics.eobCount.toLocaleString()}`,
        `ZRL count: ${analysis.rleStatistics.zrlCount.toLocaleString()}`,
        `Avg run length: ${analysis.rleStatistics.avgRunLength.toFixed(2)}`,
      ] : [
        `Encodes (run, value) pairs`,
        `EOB: End of block marker`,
        `ZRL: 16 zero run marker`,
      ],
      color: '#0891b2',
    },
    {
      id: 'huffman',
      name: 'Huffman Coding',
      icon: '🌳',
      description: 'Entropy encoding',
      details: analysis ? [
        `Total bits: ${analysis.huffmanCoding.totalBits.toLocaleString()}`,
        `Avg codeword: ${analysis.huffmanCoding.avgCodewordLength.toFixed(2)} bits`,
        `Original entropy: ${analysis.entropy.originalEntropy.toFixed(2)} bits/sym`,
        `Compressed entropy: ${analysis.entropy.compressedEntropy.toFixed(2)} bits/sym`,
      ] : [
        `Variable-length codes`,
        `Common symbols → short codes`,
        `Lossless compression stage`,
      ],
      color: '#84cc16',
    },
    {
      id: 'output',
      name: 'JFIF Output',
      icon: '💾',
      description: 'Final .jpg file',
      details: [
        `Output size: ${formatBytes(result.compressedBytes)}`,
        `Compression: ${result.compressionRatio.toFixed(1)}×`,
        `Space saved: ${((1 - result.compressedBytes / result.originalBytes) * 100).toFixed(1)}%`,
        `Format: JFIF 1.01`,
      ],
      color: '#22c55e',
    },
  ];

  return (
    <div className="pipeline-view">
      <h3>⚙️ JPEG Encoding Pipeline</h3>
      
      {/* Pipeline diagram */}
      <div className="pipeline-diagram">
        {steps.map((step, index) => (
          <div key={step.id} className="pipeline-step-wrapper">
            {/* Step box */}
            <div 
              className={`pipeline-step ${activeStep === step.id ? 'active' : ''}`}
              style={{ borderColor: step.color }}
              onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
            >
              <div className="step-icon" style={{ backgroundColor: step.color }}>
                {step.icon}
              </div>
              <div className="step-info">
                <div className="step-name">{step.name}</div>
                <div className="step-desc">{step.description}</div>
              </div>
            </div>
            
            {/* Arrow connector */}
            {index < steps.length - 1 && (
              <div className="pipeline-arrow">→</div>
            )}
          </div>
        ))}
      </div>
      
      {/* Step details panel */}
      {activeStep && (
        <div className="step-details">
          {(() => {
            const step = steps.find(s => s.id === activeStep);
            if (!step) return null;
            return (
              <>
                <div className="details-header" style={{ borderLeftColor: step.color }}>
                  <span className="details-icon">{step.icon}</span>
                  <span className="details-title">{step.name}</span>
                </div>
                <ul className="details-list">
                  {step.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              </>
            );
          })()}
        </div>
      )}
      
      {/* Summary stats */}
      <div className="pipeline-summary">
        <div className="summary-item">
          <span className="summary-label">Input</span>
          <span className="summary-value">{formatBytes(result.originalBytes)}</span>
        </div>
        <div className="summary-arrow">→</div>
        <div className="summary-item highlight">
          <span className="summary-label">Output</span>
          <span className="summary-value">{formatBytes(result.compressedBytes)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Ratio</span>
          <span className="summary-value">{result.compressionRatio.toFixed(1)}×</span>
        </div>
      </div>
      
      {/* Click hint */}
      <p className="pipeline-hint">
        👆 Click any step to see details
      </p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
