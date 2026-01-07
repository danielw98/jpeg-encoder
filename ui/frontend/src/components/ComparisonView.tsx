/**
 * ComparisonView Component
 * 
 * Side-by-side comparison with quality slider for live preview
 */

import { useState, useEffect, useRef } from 'react';
import { EncodeResult } from '../hooks/useEncoder';

// Precomputed quality levels (must match backend)
const QUALITY_LEVELS = [10, 25, 50, 65, 75, 85, 90, 95, 100];

interface ComparisonViewProps {
  result: EncodeResult;
  originalUrl: string | null;
}

interface CachedLevel {
  quality: number;
  outputUrl: string;
  compressedBytes: number;
}

export function ComparisonView({ result, originalUrl }: ComparisonViewProps) {
  const [cachedLevels, setCachedLevels] = useState<CachedLevel[]>([]);
  const [selectedQuality, setSelectedQuality] = useState(result.quality);
  const [currentImage, setCurrentImage] = useState(result.outputUrl);
  const [currentSize, setCurrentSize] = useState(result.compressedBytes);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);
  
  // Load cached quality levels for sample images
  useEffect(() => {
    const imageName = result.inputFile.split('\\').pop()?.split('/').pop() || '';
    
    async function loadCachedLevels() {
      try {
        const response = await fetch(`/api/cache/quality-curve/${encodeURIComponent(imageName)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.cached && data.data) {
            setCachedLevels(data.data.map((p: { quality: number; outputUrl: string; compressedBytes: number }) => ({
              quality: p.quality,
              outputUrl: p.outputUrl,
              compressedBytes: p.compressedBytes,
            })));
          }
        }
      } catch {
        // No cache available
      }
    }
    
    loadCachedLevels();
  }, [result.inputFile]);
  
  // Update image when quality slider changes
  useEffect(() => {
    if (selectedQuality === result.quality) {
      setCurrentImage(result.outputUrl);
      setCurrentSize(result.compressedBytes);
      return;
    }
    
    // Find closest cached level
    const closest = cachedLevels.reduce((prev, curr) => 
      Math.abs(curr.quality - selectedQuality) < Math.abs(prev.quality - selectedQuality) ? curr : prev,
      cachedLevels[0]
    );
    
    if (closest) {
      setCurrentImage(closest.outputUrl);
      setCurrentSize(closest.compressedBytes);
    }
  }, [selectedQuality, cachedLevels, result.quality, result.outputUrl, result.compressedBytes]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `compressed_q${selectedQuality}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showOriginal = !!originalUrl;
  const savedPercent = ((1 - currentSize / result.originalBytes) * 100).toFixed(1);
  
  // Handle slider drag for before/after comparison
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !comparisonRef.current) return;
    const rect = comparisonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  return (
    <div className="comparison-view">
      {/* Quality Slider - only show if we have cached levels */}
      {cachedLevels.length > 0 && (
        <div className="quality-slider-section">
          <div className="quality-slider-header">
            <span>Quality: <strong>{selectedQuality}</strong></span>
            <span className="quality-slider-size">{formatBytes(currentSize)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={QUALITY_LEVELS.length - 1}
            step={1}
            value={QUALITY_LEVELS.indexOf(selectedQuality)}
            onChange={(e) => setSelectedQuality(QUALITY_LEVELS[Number(e.target.value)])}
            className="quality-range-slider"
          />
          <div className="quality-slider-ticks">
            {QUALITY_LEVELS.map(q => (
              <span 
                key={q} 
                className={`tick ${selectedQuality === q ? 'active' : ''}`}
                onClick={() => setSelectedQuality(q)}
              >
                {q}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Before/After Slider Comparison */}
      {showOriginal ? (
        <div 
          className="slider-comparison"
          ref={comparisonRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
        >
          <div className="slider-image original-side">
            <img src={originalUrl} alt="Original" />
            <div className="slider-label left">Original</div>
          </div>
          <div 
            className="slider-image compressed-side"
            style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
          >
            <img src={currentImage} alt="Compressed" />
            <div className="slider-label right">Q{selectedQuality}</div>
          </div>
          <div 
            className="slider-handle"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="slider-line"></div>
            <div className="slider-grip">⇔</div>
          </div>
        </div>
      ) : (
        <div className="single-image">
          <div className="compare-image">
            <div className="image-label">Compressed (Q{selectedQuality})</div>
            <img src={currentImage} alt="Compressed" />
            <div className="image-info">{formatBytes(currentSize)}</div>
          </div>
        </div>
      )}

      {/* Size Bar */}
      <div className="size-bar-section">
        <div className="size-bars">
          <div className="bar-row">
            <span className="bar-label">Original</span>
            <div className="bar-track">
              <div className="bar-fill original" style={{ width: '100%' }}></div>
            </div>
            <span className="bar-value">{formatBytes(result.originalBytes)}</span>
          </div>
          <div className="bar-row">
            <span className="bar-label">Compressed</span>
            <div className="bar-track">
              <div className="bar-fill compressed" style={{ width: `${(currentSize / result.originalBytes) * 100}%` }}></div>
            </div>
            <span className="bar-value">{formatBytes(currentSize)}</span>
          </div>
        </div>
        <div className="savings-badge">
          💾 Saved {savedPercent}% ({formatBytes(result.originalBytes - currentSize)})
        </div>
      </div>

      <button className="btn btn-primary btn-download" onClick={handleDownload}>
        ⬇️ Download JPEG
      </button>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
