/**
 * QualityChart Component
 * 
 * Interactive chart showing relationship between quality setting,
 * compression ratio, and file size
 * 
 * Uses cached data for sample images, generates real data for uploaded images
 */

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { EncodeResult } from '../hooks/useEncoder';

// Precomputed quality levels (must match backend)
const QUALITY_LEVELS = [10, 25, 50, 65, 75, 85, 90, 95, 100];

interface QualityChartProps {
  result: EncodeResult;
  onQualityChange?: (quality: number) => void;
}

interface QualityDataPoint {
  quality: number;
  ratio: number;
  size: number;
  sizeKB: number;
  outputUrl?: string;
}

export function QualityChart({ result, onQualityChange }: QualityChartProps) {
  const [curveData, setCurveData] = useState<QualityDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<QualityDataPoint | null>(null);
  
  // Generate actual compression data - try cache first, then encode
  useEffect(() => {
    let cancelled = false;
    
    async function loadData() {
      setLoading(true);
      
      // Extract image name from path
      const imageName = result.inputFile.split('\\').pop()?.split('/').pop() || '';
      
      // Try to get cached data first (for sample images)
      try {
        const cacheResponse = await fetch(`/api/cache/quality-curve/${encodeURIComponent(imageName)}`);
        if (cacheResponse.ok) {
          const cacheData = await cacheResponse.json();
          if (cacheData.cached && cacheData.data && cacheData.data.length > 0) {
            console.log('[QualityChart] Using cached data for', imageName);
            if (!cancelled) {
              setCurveData(cacheData.data.map((p: { quality: number; ratio: number; compressedBytes: number; sizeKB: number; outputUrl?: string }) => ({
                quality: p.quality,
                ratio: p.ratio,
                size: p.compressedBytes,
                sizeKB: p.sizeKB,
                outputUrl: p.outputUrl,
              })));
              setLoading(false);
            }
            return;
          }
        }
      } catch {
        // Cache miss, continue to generate data
      }
      
      // No cache - generate by encoding at different quality levels
      console.log('[QualityChart] Generating data for', imageName);
      const points: QualityDataPoint[] = [];
      const format = result.format;
      
      try {
        for (const q of QUALITY_LEVELS) {
          if (cancelled) break;
          
          const response = await fetch('/api/encode/sample', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageName,
              quality: q,
              format: format,
              analyze: false,
            }),
          });
          
          if (!response.ok) continue;
          
          const data: EncodeResult = await response.json();
          
          points.push({
            quality: q,
            ratio: data.compressionRatio,
            size: data.compressedBytes,
            sizeKB: data.compressedBytes / 1024,
            outputUrl: data.outputUrl,
          });
        }
        
        if (!cancelled && points.length > 0) {
          setCurveData(points);
        }
      } catch (error) {
        console.error('Failed to generate quality curve:', error);
        // Fallback to estimated curve
        const estimatedPoints: QualityDataPoint[] = [];
        for (const q of QUALITY_LEVELS) {
          const baseRatio = 2.5;
          const maxRatio = 35;
          const decay = 0.045;
          const ratio = baseRatio + (maxRatio - baseRatio) * Math.exp(-decay * q);
          const size = result.originalBytes / ratio;
          estimatedPoints.push({
            quality: q,
            ratio: ratio,
            size: size,
            sizeKB: size / 1024,
          });
        }
        if (!cancelled) {
          setCurveData(estimatedPoints);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    loadData();
    
    return () => {
      cancelled = true;
    };
  }, [result.inputFile, result.format, result.originalBytes]);

  const chartWidth = 600;
  const chartHeight = 400;
  const padding = { top: 30, right: 40, bottom: 60, left: 90 };
  
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  
  // Scales
  const xScale = useCallback((q: number) => {
    return padding.left + ((q - 10) / 90) * innerWidth;
  }, [innerWidth]);
  
  const yScale = useCallback((ratio: number) => {
    const maxRatio = 40;
    return padding.top + innerHeight - (ratio / maxRatio) * innerHeight;
  }, [innerHeight]);
  
  // Generate path for the curve
  const curvePath = curveData.map((point, i) => {
    const x = xScale(point.quality);
    const y = yScale(point.ratio);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Current point
  const currentPoint = {
    x: xScale(result.quality),
    y: yScale(result.compressionRatio),
  };

  // Format helpers
  const formatSize = (kb: number) => {
    if (kb > 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb.toFixed(0)} KB`;
  };

  return (
    <div className="quality-chart">
      <h3><FontAwesomeIcon icon={faChartLine} /> Quality vs Compression {loading && <span style={{ fontSize: '0.875rem', color: '#888' }}>(generating real data...)</span>}</h3>
      
      {loading && curveData.length === 0 ? (
        <div className="loading" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '12px', color: '#888' }}>Encoding at multiple quality levels...</p>
        </div>
      ) : (
        <>
      {/* SVG Chart */}
      <div className="chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          <g className="grid-lines">
            {[10, 20, 30].map(ratio => (
              <line
                key={ratio}
                x1={padding.left}
                y1={yScale(ratio)}
                x2={chartWidth - padding.right}
                y2={yScale(ratio)}
                stroke="#e2e8f0"
                strokeDasharray="4,4"
              />
            ))}
            {QUALITY_LEVELS.filter(q => q > 10).map(q => (
              <line
                key={q}
                x1={xScale(q)}
                y1={padding.top}
                x2={xScale(q)}
                y2={chartHeight - padding.bottom}
                stroke="#e2e8f0"
                strokeDasharray="4,4"
              />
            ))}
          </g>
          
          {/* Axes */}
          <g className="axes">
            {/* X axis */}
            <line
              x1={padding.left}
              y1={chartHeight - padding.bottom}
              x2={chartWidth - padding.right}
              y2={chartHeight - padding.bottom}
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Y axis */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={chartHeight - padding.bottom}
              stroke="#94a3b8"
              strokeWidth="1"
            />
          </g>
          
          {/* Axis labels */}
          <g className="axis-labels" fontSize="10" fill="#64748b">
            {/* X axis labels */}
            {QUALITY_LEVELS.map(q => (
              <text key={q} x={xScale(q)} y={chartHeight - 25} textAnchor="middle">
                {q}
              </text>
            ))}
            <text x={chartWidth / 2} y={chartHeight - 5} textAnchor="middle" fontSize="12" fontWeight="500">
              Quality
            </text>
            
            {/* Y axis labels */}
            {[10, 20, 30].map(ratio => (
              <text key={ratio} x={padding.left - 12} y={yScale(ratio) + 4} textAnchor="end">
                {ratio}×
              </text>
            ))}
            <text 
              x={25} 
              y={chartHeight / 2} 
              textAnchor="middle" 
              transform={`rotate(-90, 25, ${chartHeight / 2})`}
              fontSize="12"
              fontWeight="500"
            >
              Compression Ratio
            </text>
          </g>
          
          {/* Curve */}
          <path
            d={curvePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
          />
          
          {/* Interactive points */}
          <g className="data-points">
            {curveData.map((point) => (
              <circle
                key={point.quality}
                cx={xScale(point.quality)}
                cy={yScale(point.ratio)}
                r={hoveredPoint?.quality === point.quality ? 6 : 4}
                fill={hoveredPoint?.quality === point.quality ? '#2563eb' : 'white'}
                stroke="#2563eb"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => onQualityChange?.(point.quality)}
              />
            ))}
          </g>
          
          {/* Current quality marker */}
          <g className="current-marker">
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r="8"
              fill="#16a34a"
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={currentPoint.x}
              y={currentPoint.y - 15}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#16a34a"
            >
              Current
            </text>
          </g>
        </svg>
        
        {/* Tooltip */}
        {hoveredPoint && (
          <div 
            className="chart-tooltip"
            style={{
              left: xScale(hoveredPoint.quality) + 10,
              top: yScale(hoveredPoint.ratio) - 10,
            }}
          >
            <div><strong>Quality:</strong> {hoveredPoint.quality}</div>
            <div><strong>Ratio:</strong> {hoveredPoint.ratio.toFixed(1)}×</div>
            <div><strong>Size:</strong> ~{formatSize(hoveredPoint.sizeKB)}</div>
          </div>
        )}
      </div>
      
      {/* Current Stats */}
      <div className="chart-stats">
        <div className="chart-stat">
          <span className="stat-label">Current Quality</span>
          <span className="stat-value">{result.quality}</span>
        </div>
        <div className="chart-stat">
          <span className="stat-label">Compression</span>
          <span className="stat-value">{result.compressionRatio.toFixed(1)}×</span>
        </div>
        <div className="chart-stat">
          <span className="stat-label">File Size</span>
          <span className="stat-value">{formatSize(result.compressedBytes / 1024)}</span>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
