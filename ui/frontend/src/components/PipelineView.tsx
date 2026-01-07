/**
 * PipelineView Component
 * 
 * Step-by-step visualization of the JPEG encoding pipeline
 * Shows each stage with data flow, statistics, and DSP theory
 */

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faImage, faPalette, faCompress, faCubes, faWaveSquare,
  faSliders, faRightLeft, faBoxesStacked, faTree, faFloppyDisk,
  faCogs, faHandPointer, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { EncodeResult } from '../hooks/useEncoder';

interface PipelineViewProps {
  result: EncodeResult;
}

interface PipelineStep {
  id: string;
  name: string;
  icon: IconDefinition;
  description: string;
  details: string[];
  theory: string;  // Educational DSP theory content
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
      icon: faImage,
      description: 'Load raw pixel data',
      details: [
        `Dimensions: ${result.originalWidth} × ${result.originalHeight}`,
        `Raw size: ${formatBytes(result.originalBytes)}`,
        `Padded: ${result.paddedWidth} × ${result.paddedHeight}`,
        `Format: RGB (24-bit color)`,
      ],
      theory: 'Digital images are 2D signals sampled on a discrete grid. Each pixel contains intensity values (0-255) for color channels. The Nyquist theorem requires sampling at 2× the highest spatial frequency to avoid aliasing artifacts.',
      color: '#3b82f6',
    },
    {
      id: 'colorspace',
      name: 'Color Convert',
      icon: faPalette,
      description: 'RGB → YCbCr',
      details: [
        `Y: Luminance (brightness)`,
        `Cb: Blue chrominance`,
        `Cr: Red chrominance`,
        `Decorrelates color channels`,
      ],
      theory: 'Human vision is more sensitive to brightness (luminance) than color (chrominance). The YCbCr transform decorrelates RGB channels, concentrating most perceptual information in Y. This enables aggressive chroma subsampling with minimal visible quality loss.',
      color: '#8b5cf6',
    },
    {
      id: 'subsample',
      name: 'Subsampling',
      icon: faCompress,
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
      theory: 'Chroma subsampling (4:2:0) reduces Cb/Cr resolution by 2× in each direction. This exploits the eye\'s lower spatial resolution for color vs. luminance. The notation 4:2:0 means: for every 4 luma samples, there are 2 chroma samples horizontally and 0 alternation vertically.',
      color: '#ec4899',
    },
    {
      id: 'blocks',
      name: 'Block Split',
      icon: faCubes,
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
      theory: 'Dividing images into 8×8 blocks enables localized frequency analysis. This size balances computational efficiency with transform accuracy. Block-based processing also enables parallel computation and adaptive quality per-region.',
      color: '#f59e0b',
    },
    {
      id: 'dct',
      name: 'DCT Transform',
      icon: faWaveSquare,
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
      theory: 'The Discrete Cosine Transform (DCT-II) is a real-valued variant of the Fourier Transform. It decomposes each 8×8 block into 64 basis functions of increasing spatial frequency. Natural images have most energy in low-frequency (DC) components, making high-frequency coefficients small and compressible.',
      color: '#10b981',
    },
    {
      id: 'quantize',
      name: 'Quantization',
      icon: faSliders,
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
      theory: 'Quantization divides DCT coefficients by values from the quantization matrix, then rounds to integers. Higher frequencies use larger divisors since the eye is less sensitive to them. This is the only lossy step—it discards information irreversibly. Quality factor scales the matrix: Q=100 means minimal loss, Q=1 means maximum compression.',
      color: '#ef4444',
    },
    {
      id: 'zigzag',
      name: 'Zig-Zag Scan',
      icon: faRightLeft,
      description: '2D → 1D reorder',
      details: [
        `Groups zeros at end`,
        `Low freq → high freq order`,
        `Enables efficient RLE`,
        `64 coefficients per block`,
      ],
      theory: 'The zig-zag scan reorders the 8×8 quantized coefficients into a 1D array, visiting from low to high frequency. Since quantization creates many zeros in high-frequency positions, this ordering groups zeros at the end of the sequence, maximizing run-length encoding efficiency.',
      color: '#6366f1',
    },
    {
      id: 'rle',
      name: 'RLE Encoding',
      icon: faBoxesStacked,
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
      theory: 'Run-Length Encoding compresses sequences of zeros by encoding (skip, value) pairs instead of individual coefficients. EOB (End of Block) marks when all remaining coefficients are zero. ZRL (Zero Run Length) handles runs of exactly 16 zeros. This exploits the sparsity created by quantization.',
      color: '#0891b2',
    },
    {
      id: 'huffman',
      name: 'Huffman Coding',
      icon: faTree,
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
      theory: 'Huffman coding assigns variable-length binary codes to symbols based on their frequency. Frequent symbols get shorter codes, rare symbols get longer codes. This approaches the theoretical Shannon entropy limit—the minimum bits needed to encode the data losslessly. JPEG uses predefined Huffman tables for DC and AC coefficients.',
      color: '#84cc16',
    },
    {
      id: 'output',
      name: 'JFIF Output',
      icon: faFloppyDisk,
      description: 'Final .jpg file',
      details: [
        `Output size: ${formatBytes(result.compressedBytes)}`,
        `Compression: ${result.compressionRatio.toFixed(1)}×`,
        `Space saved: ${((1 - result.compressedBytes / result.originalBytes) * 100).toFixed(1)}%`,
        `Format: JFIF 1.01`,
      ],
      theory: 'The JFIF (JPEG File Interchange Format) wraps the compressed data with headers containing image dimensions, quantization tables, Huffman tables, and markers. The bitstream uses restart markers for error resilience. The format is designed for maximum interoperability across platforms.',
      color: '#22c55e',
    },
  ];

  return (
    <div className="pipeline-view">
      <h3><FontAwesomeIcon icon={faCogs} /> JPEG Encoding Pipeline</h3>
      
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
                <FontAwesomeIcon icon={step.icon} />
              </div>
              <div className="step-info">
                <div className="step-name">{step.name}</div>
                <div className="step-desc">{step.description}</div>
              </div>
            </div>
            
            {/* Arrow connector */}
            {index < steps.length - 1 && (
              <div className="pipeline-arrow"><FontAwesomeIcon icon={faChevronRight} /></div>
            )}
          </div>
        ))}
      </div>
      
      {/* Step details panel with theory */}
      {activeStep && (
        <div className="step-details">
          {(() => {
            const step = steps.find(s => s.id === activeStep);
            if (!step) return null;
            return (
              <>
                <div className="details-header" style={{ borderLeftColor: step.color }}>
                  <span className="details-icon"><FontAwesomeIcon icon={step.icon} /></span>
                  <span className="details-title">{step.name}</span>
                </div>
                
                {/* Statistics */}
                <div className="details-stats">
                  <h4>Statistics</h4>
                  <ul className="details-list">
                    {step.details.map((detail, i) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                </div>
                
                {/* DSP Theory */}
                <div className="details-theory">
                  <h4>DSP Theory</h4>
                  <p>{step.theory}</p>
                </div>
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
        <FontAwesomeIcon icon={faHandPointer} /> Click any step to see details and DSP theory
      </p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
