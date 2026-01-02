/**
 * useEncoder hook
 * 
 * Custom hook for interacting with the JPEG encoder API
 */

import { useState, useCallback } from 'react';

export interface EncodeResult {
  success: boolean;
  inputFile: string;
  outputFile: string;
  outputUrl: string;
  
  originalWidth: number;
  originalHeight: number;
  paddedWidth: number;
  paddedHeight: number;
  originalBytes: number;
  compressedBytes: number;
  compressionRatio: number;
  quality: number;
  format: string;
  
  analysis?: {
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
  };
  
  error?: string;
}

export function useEncoder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encode = useCallback(async (
    file: File,
    quality: number,
    format: 'color_420' | 'grayscale',
    analyze: boolean = true
  ): Promise<EncodeResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('quality', quality.toString());
      formData.append('format', format);
      formData.append('analyze', analyze.toString());

      const response = await fetch('/api/encode', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Encoding failed');
        return null;
      }

      if (!result.success) {
        setError(result.error || 'Encoding failed');
        return null;
      }

      return result as EncodeResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Network error: ${message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const encodeSample = useCallback(async (
    imageName: string,
    quality: number,
    format: 'color_420' | 'grayscale',
    analyze: boolean = true
  ): Promise<EncodeResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/encode/sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageName,
          quality,
          format,
          analyze,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Encoding failed');
        return null;
      }

      if (!result.success) {
        setError(result.error || 'Encoding failed');
        return null;
      }

      return result as EncodeResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Network error: ${message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    encode,
    encodeSample,
    loading,
    error,
  };
}
