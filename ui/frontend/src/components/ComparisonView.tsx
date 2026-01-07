/**
 * ComparisonView Component
 * 
 * Top/bottom comparison of original and compressed images
 * with size comparison bar
 */

import { EncodeResult } from '../hooks/useEncoder';

interface ComparisonViewProps {
  result: EncodeResult;
  originalUrl: string | null;
}

export function ComparisonView({ result, originalUrl }: ComparisonViewProps) {
  // Download handler
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = result.outputUrl;
    link.download = `compressed_q${result.quality}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showOriginal = !!originalUrl;

  return (
    <div className="comparison-view">
      {/* Images stacked top/bottom */}
      <div className="stacked-comparison">
        {showOriginal && (
          <div className="stacked-image">
            <div className="image-header">
              <span className="image-title">Original</span>
              <span className="image-size">{formatBytes(result.originalBytes)}</span>
            </div>
            <img src={originalUrl} alt="Original" />
          </div>
        )}
        
        <div className="stacked-image">
          <div className="image-header">
            <span className="image-title">Compressed (Q{result.quality})</span>
            <span className="image-size">{formatBytes(result.compressedBytes)}</span>
          </div>
          <img src={result.outputUrl} alt="Compressed" />
        </div>
      </div>

      {/* Size Comparison */}
      <div className="size-comparison">
        <div className="size-bar-container">
          <div className="size-bar original-bar">
            Original: {formatBytes(result.originalBytes)}
          </div>
          <div 
            className="size-bar compressed-bar" 
            style={{ width: `${(result.compressedBytes / result.originalBytes) * 100}%` }}
          >
            Compressed: {formatBytes(result.compressedBytes)}
          </div>
        </div>
        <div className="size-savings">
          💾 Saved {((1 - result.compressedBytes / result.originalBytes) * 100).toFixed(1)}% 
          ({formatBytes(result.originalBytes - result.compressedBytes)})
        </div>
      </div>

      {/* Download Button */}
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
