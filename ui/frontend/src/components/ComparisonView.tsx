/**
 * ComparisonView Component
 * 
 * Side-by-side comparison of original and compressed images
 * with interactive slider for revealing differences
 */

import { useState, useRef, useEffect } from 'react';
import { EncodeResult } from '../hooks/useEncoder';

interface ComparisonViewProps {
  result: EncodeResult;
  originalUrl: string | null;
}

export function ComparisonView({ result, originalUrl }: ComparisonViewProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'slider' | 'sideBySide'>('sideBySide');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // If no original URL (sample image case), show compressed only
  const showOriginal = !!originalUrl;

  // Download handler
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = result.outputUrl;
    link.download = `compressed_q${result.quality}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="comparison-view">
      {/* Header with View Mode + Download */}
      <div className="comparison-header">
        {showOriginal && (
          <div className="view-mode-selector">
            <button 
              className={`view-mode-btn ${viewMode === 'sideBySide' ? 'active' : ''}`}
              onClick={() => setViewMode('sideBySide')}
            >
              ⬛⬛ Side by Side
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'slider' ? 'active' : ''}`}
              onClick={() => setViewMode('slider')}
            >
              ↔ Slider
            </button>
          </div>
        )}
        <button className="download-btn" onClick={handleDownload}>
          ⬇️ Download JPEG
        </button>
      </div>

      {/* Slider Mode */}
      {viewMode === 'slider' && showOriginal && (
        <div 
          ref={containerRef}
          className="comparison-slider"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseUp}
        >
          {/* Original Image (Background) */}
          <div className="comparison-image original">
            <img src={originalUrl} alt="Original" />
            <div className="image-label original-label">Original</div>
          </div>

          {/* Compressed Image (Clipped) */}
          <div 
            className="comparison-image compressed"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img src={result.outputUrl} alt="Compressed" />
            <div className="image-label compressed-label">Compressed</div>
          </div>

          {/* Slider Handle */}
          <div 
            className="slider-handle"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="slider-line"></div>
            <div className="slider-icon">◀▶</div>
          </div>

          {/* Hover hint */}
          <div className="slider-hint">Drag to compare</div>
        </div>
      )}

      {/* Side by Side Mode */}
      {viewMode === 'sideBySide' && showOriginal && (
        <div className="side-by-side">
          <div className="side-image">
            <div className="image-label">Original ({formatBytes(result.originalBytes)})</div>
            <img src={originalUrl} alt="Original" />
          </div>
          <div className="side-image">
            <div className="image-label">Compressed ({formatBytes(result.compressedBytes)})</div>
            <img src={result.outputUrl} alt="Compressed" />
          </div>
        </div>
      )}

      {/* Single Image Mode (for sample images) */}
      {!showOriginal && (
        <div className="single-image">
          <div className="image-label">Compressed Output ({formatBytes(result.compressedBytes)})</div>
          <img src={result.outputUrl} alt="Compressed" />
        </div>
      )}

      {/* Size Comparison Bar */}
      <div className="size-comparison">
        <div className="size-bar-container">
          <div className="size-bar original-bar" style={{ width: '100%' }}>
            <span>Original: {formatBytes(result.originalBytes)}</span>
          </div>
          <div 
            className="size-bar compressed-bar" 
            style={{ width: `${(result.compressedBytes / result.originalBytes) * 100}%` }}
          >
            <span>Compressed: {formatBytes(result.compressedBytes)}</span>
          </div>
        </div>
        <div className="size-savings">
          💾 Saved {((1 - result.compressedBytes / result.originalBytes) * 100).toFixed(1)}% 
          ({formatBytes(result.originalBytes - result.compressedBytes)})
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
