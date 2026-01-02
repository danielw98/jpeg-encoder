/**
 * Encoder Service
 * 
 * Wrapper for the C++ CLI encoder - handles spawning the process
 * and parsing JSON output.
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface EncodeOptions {
  quality: number;          // 1-100
  format: 'grayscale' | 'color_420';
  analyze: boolean;
}

export interface EncodeResult {
  success: boolean;
  inputFile: string;
  outputFile: string;
  outputUrl: string;
  
  // Basic metrics
  originalWidth: number;
  originalHeight: number;
  paddedWidth: number;
  paddedHeight: number;
  originalBytes: number;
  compressedBytes: number;
  compressionRatio: number;
  quality: number;
  format: string;
  
  // Detailed analysis (if requested)
  analysis?: DetailedAnalysis;
  
  // Error info
  error?: string;
}

export interface DetailedAnalysis {
  entropy: {
    originalEntropy: number;
    compressedEntropy: number;
    entropyReductionPercent: number;
  };
  blocks: {
    total: number;
    yLuma: number;
    cbChroma: number;
    crChroma: number;
  };
  dctAnalysis: {
    avgDcCoefficient: number;
    avgAcCoefficient: number;
    dcEnergyPercent: number;
    acEnergyPercent: number;
  };
  quantization: {
    avgError: number;
    peakError: number;
    zeroCoefficients: number;
    sparsityPercent: number;
  };
  rleStatistics: {
    totalSymbols: number;
    zrlCount: number;
    eobCount: number;
    avgRunLength: number;
  };
  huffmanCoding: {
    totalBits: number;
    avgCodewordLength: number;
  };
}

// -----------------------------------------------------------------------------
// CLI Wrapper
// -----------------------------------------------------------------------------

export async function checkCliAvailable(): Promise<boolean> {
  try {
    await fs.access(config.cliPath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function encodeImage(
  inputPath: string,
  outputPath: string,
  options: EncodeOptions
): Promise<EncodeResult> {
  // Ensure directories exist
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // Build CLI arguments
  const args = [
    '--input', inputPath,
    '--output', outputPath,
    '--quality', options.quality.toString(),
    '--format', options.format,
    '--json',
  ];

  if (options.analyze) {
    args.push('--analyze');
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(config.cliPath, args);
    
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', async (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          inputFile: inputPath,
          outputFile: outputPath,
          outputUrl: '',
          originalWidth: 0,
          originalHeight: 0,
          paddedWidth: 0,
          paddedHeight: 0,
          originalBytes: 0,
          compressedBytes: 0,
          compressionRatio: 0,
          quality: options.quality,
          format: options.format,
          error: stderr || `CLI exited with code ${code}`,
        });
        return;
      }

      try {
        // Parse JSON output from CLI
        const cliOutput = JSON.parse(stdout);
        
        // Build output URL (relative path for serving)
        const outputFilename = path.basename(outputPath);
        const outputUrl = `/outputs/${outputFilename}`;

        const result: EncodeResult = {
          success: true,
          inputFile: inputPath,
          outputFile: outputPath,
          outputUrl,
          originalWidth: cliOutput.original_width,
          originalHeight: cliOutput.original_height,
          paddedWidth: cliOutput.padded_width,
          paddedHeight: cliOutput.padded_height,
          originalBytes: cliOutput.original_bytes,
          compressedBytes: cliOutput.compressed_bytes,
          compressionRatio: cliOutput.compression_ratio,
          quality: cliOutput.quality,
          format: cliOutput.format,
        };

        // Include detailed analysis if present
        if (cliOutput.detailed_analysis) {
          const da = cliOutput.detailed_analysis;
          result.analysis = {
            entropy: {
              originalEntropy: da.entropy?.original_entropy ?? 0,
              compressedEntropy: da.entropy?.compressed_entropy ?? 0,
              entropyReductionPercent: da.entropy?.entropy_reduction_percent ?? 0,
            },
            blocks: {
              total: da.blocks?.total ?? 0,
              yLuma: da.blocks?.y_luma ?? 0,
              cbChroma: da.blocks?.cb_chroma ?? 0,
              crChroma: da.blocks?.cr_chroma ?? 0,
            },
            dctAnalysis: {
              avgDcCoefficient: da.dct_analysis?.avg_dc_coefficient ?? 0,
              avgAcCoefficient: da.dct_analysis?.avg_ac_coefficient ?? 0,
              dcEnergyPercent: da.dct_analysis?.dc_energy_percent ?? 0,
              acEnergyPercent: da.dct_analysis?.ac_energy_percent ?? 0,
            },
            quantization: {
              avgError: da.quantization?.avg_error ?? 0,
              peakError: da.quantization?.peak_error ?? 0,
              zeroCoefficients: da.quantization?.zero_coefficients ?? 0,
              sparsityPercent: da.quantization?.sparsity_percent ?? 0,
            },
            rleStatistics: {
              totalSymbols: da.rle_statistics?.total_symbols ?? 0,
              zrlCount: da.rle_statistics?.zrl_count ?? 0,
              eobCount: da.rle_statistics?.eob_count ?? 0,
              avgRunLength: da.rle_statistics?.avg_run_length ?? 0,
            },
            huffmanCoding: {
              totalBits: da.huffman_coding?.total_bits ?? 0,
              avgCodewordLength: da.huffman_coding?.avg_codeword_length ?? 0,
            },
          };
        }

        resolve(result);
      } catch (parseError) {
        resolve({
          success: false,
          inputFile: inputPath,
          outputFile: outputPath,
          outputUrl: '',
          originalWidth: 0,
          originalHeight: 0,
          paddedWidth: 0,
          paddedHeight: 0,
          originalBytes: 0,
          compressedBytes: 0,
          compressionRatio: 0,
          quality: options.quality,
          format: options.format,
          error: `Failed to parse CLI output: ${parseError}`,
        });
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn CLI: ${err.message}`));
    });
  });
}
