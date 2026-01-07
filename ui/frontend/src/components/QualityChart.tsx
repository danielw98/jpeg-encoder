/**
 * QualityChart Component
 * 
 * Interactive chart showing relationship between quality setting,
 * compression ratio, and file size
 * 
 * Generates real data by encoding the current image at multiple quality levels
 */

import { useState, useEffect, useCallback } from 'react';
import { EncodeResult } from '../hooks/useEncoder';

interface QualityChartProps {
  result: EncodeResult;
  onQualityChange?: (quality: number) => void;
}

interface QualityDataPoint {
  quality: number;
  ratio: number;
  size: number;
  sizeKB: number;
}

export function QualityChart({ result, onQualityChange }: QualityChartProps) {
  const [curveData, setCurveData] = useState<QualityDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<QualityDataPoint | null>(null);
  
  // Generate actual compression data by encoding at different quality levels
  useEffect(() => {
    let cancelled = false;
    
    async function generateRealCurve() {
      setLoading(true);
      const points: QualityDataPoint[] = [];
      
      // Use the current result's original image path
      const inputPath = result.inputFile;
      const format = result.format;
      
      // Sample quality levels: 10, 20, 30, ..., 100
      const qualities = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      
      try {
        // Encode at each quality level
        for (const q of qualities) {
          if (cancelled) break;
          
          const response = await fetch('/api/encode/sample', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageName: inputPath.split('\\').pop()?.split('/').pop() || '',
              quality: q,
              format: format,
              analyze: false, // No need for detailed analysis
            }),
          });
          
          if (!response.ok) continue;
          
          const data: EncodeResult = await response.json();
          
          points.push({
            quality: q,
            ratio: data.compressionRatio,
            size: data.compressedBytes,
            sizeKB: data.compressedBytes / 1024,
          });
        }
        
        if (!cancelled && points.length > 0) {
          setCurveData(points);
        }
      } catch (error) {
        console.error('Failed to generate quality curve:', error);
        // Fallback to estimated curve
        const estimatedPoints: QualityDataPoint[] = [];
        for (let q = 10; q <= 100; q += 10) {
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
    
    generateRealCurve();
    
    return () => {
      cancelled = true;
    };
  }, [result.inputFile, result.format, result.originalBytes]);

  const chartWidth = 500;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  
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
      <h3>📈 Quality vs Compression {loading && <span style={{ fontSize: '0.875rem', color: '#888' }}>(generating real data...)</span>}</h3>
      
      {loading && curveData.length === 0 ? (
        <div className="loading" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '12px', color: '#888' }}>Encoding at multiple quality levels...</p>
        </div>
      ) : (
        <>
      {/* SVG Chart */}
      <div className="chart-container">
        <svg width={chartWidth} height={chartHeight} className="chart-svg">
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
            {[25, 50, 75].map(q => (
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
            {[25, 50, 75, 100].map(q => (
              <text key={q} x={xScale(q)} y={chartHeight - 15} textAnchor="middle">
                {q}
              </text>
            ))}
            <text x={chartWidth / 2} y={chartHeight - 2} textAnchor="middle" fontSize="11">
              Quality
            </text>
            
            {/* Y axis labels */}
            {[10, 20, 30].map(ratio => (
              <text key={ratio} x={padding.left - 8} y={yScale(ratio) + 3} textAnchor="end">
                {ratio}×
              </text>
            ))}
            <text 
              x={15} 
              y={chartHeight / 2} 
              textAnchor="middle" 
              transform={`rotate(-90, 15, ${chartHeight / 2})`}
              fontSize="11"
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
