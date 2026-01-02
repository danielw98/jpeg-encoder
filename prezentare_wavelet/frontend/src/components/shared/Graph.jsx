import { useRef, useEffect, useCallback } from 'react'
import './Graph.css'

/**
 * Reusable Graph component with HiDPI support, axis labels, grid, and multiple series
 * 
 * @param {Object} props
 * @param {Array<Object>} props.series - Array of series to plot: { data: number[], color: string, lineWidth?: number, label?: string, dashed?: boolean, opacity?: number }
 * @param {Object} props.xAxis - X-axis config: { label?: string, min?: number, max?: number, ticks?: number[], tickFormat?: (v) => string }
 * @param {Object} props.yAxis - Y-axis config: { label?: string, min?: number, max?: number, ticks?: number[], tickFormat?: (v) => string }
 * @param {Object} props.margin - Custom margins: { top, right, bottom, left }
 * @param {string} props.background - Background color
 * @param {string} props.gridColor - Grid line color
 * @param {boolean} props.compact - Compact mode with smaller margins
 * @param {Function} props.onDraw - Custom draw callback for overlays: (ctx, { width, height, getX, getY, margin }) => void
 * @param {Object} props.highlight - Highlight config: { xRange?: [min, max], points?: [{x, y, color, radius}] }
 * @param {string} props.className - Additional CSS class
 */
export default function Graph({
  series = [],
  xAxis = {},
  yAxis = {},
  margin: customMargin,
  background = '#050510',
  gridColor = '#1a1a3a',
  compact = false,
  onDraw,
  highlight,
  className = ''
}) {
  const canvasRef = useRef()
  const containerRef = useRef()
  
  // Default margins
  const defaultMargin = compact 
    ? { top: 25, right: 15, bottom: 35, left: 40 }
    : { top: 30, right: 20, bottom: 45, left: 55 }
  const margin = { ...defaultMargin, ...customMargin }
  
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    
    // HiDPI support
    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    if (width === 0 || height === 0) return
    
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    
    // Clear with background
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)
    
    // Calculate plot area
    const plotWidth = width - margin.left - margin.right
    const plotHeight = height - margin.top - margin.bottom
    
    // Calculate data ranges
    let xMin = xAxis.min, xMax = xAxis.max
    let yMin = yAxis.min, yMax = yAxis.max
    
    // Auto-calculate if not provided
    if (xMin === undefined || xMax === undefined) {
      let allXValues = []
      series.forEach(s => {
        if (s.xData) {
          allXValues = allXValues.concat(s.xData)
        } else if (s.data) {
          allXValues = allXValues.concat(s.data.map((_, i) => i))
        }
      })
      if (allXValues.length > 0) {
        xMin = xMin ?? Math.min(...allXValues)
        xMax = xMax ?? Math.max(...allXValues)
      } else {
        xMin = 0
        xMax = 1
      }
    }
    
    if (yMin === undefined || yMax === undefined) {
      let allYValues = []
      series.forEach(s => {
        if (s.data) allYValues = allYValues.concat(s.data)
      })
      if (allYValues.length > 0) {
        const dataMin = Math.min(...allYValues)
        const dataMax = Math.max(...allYValues)
        const padding = (dataMax - dataMin) * 0.1 || 0.1
        yMin = yMin ?? dataMin - padding
        yMax = yMax ?? dataMax + padding
      } else {
        yMin = 0
        yMax = 1
      }
    }
    
    const xRange = xMax - xMin || 1
    const yRange = yMax - yMin || 1
    
    // Coordinate transforms
    const getX = (val) => margin.left + ((val - xMin) / xRange) * plotWidth
    const getY = (val) => margin.top + plotHeight - ((val - yMin) / yRange) * plotHeight
    
    // Draw grid
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1
    
    // Horizontal grid lines
    const yTicks = yAxis.ticks || generateTicks(yMin, yMax, 5)
    yTicks.forEach(tick => {
      const y = getY(tick)
      ctx.beginPath()
      ctx.moveTo(margin.left, y)
      ctx.lineTo(width - margin.right, y)
      ctx.stroke()
    })
    
    // Vertical grid lines
    const xTicks = xAxis.ticks || generateTicks(xMin, xMax, 5)
    xTicks.forEach(tick => {
      const x = getX(tick)
      ctx.beginPath()
      ctx.moveTo(x, margin.top)
      ctx.lineTo(x, height - margin.bottom)
      ctx.stroke()
    })
    
    // Draw axis labels
    ctx.fillStyle = '#aaaacc'
    ctx.font = `bold ${compact ? 10 : 11}px Inter, system-ui, sans-serif`
    
    // X-axis tick labels
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    xTicks.forEach(tick => {
      const x = getX(tick)
      const label = xAxis.tickFormat ? xAxis.tickFormat(tick) : formatNumber(tick)
      ctx.fillText(label, x, height - margin.bottom + 6)
    })
    
    // Y-axis tick labels
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    yTicks.forEach(tick => {
      const y = getY(tick)
      const label = yAxis.tickFormat ? yAxis.tickFormat(tick) : formatNumber(tick)
      ctx.fillText(label, margin.left - 6, y)
    })
    
    // Axis labels
    ctx.font = `bold ${compact ? 11 : 12}px Inter, system-ui, sans-serif`
    ctx.fillStyle = '#ccccee'
    
    if (xAxis.label) {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(xAxis.label, margin.left + plotWidth / 2, height - 4)
    }
    
    if (yAxis.label) {
      ctx.save()
      ctx.translate(12, margin.top + plotHeight / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(yAxis.label, 0, 0)
      ctx.restore()
    }
    
    // Draw highlight regions if specified
    if (highlight?.xRange) {
      const [hxMin, hxMax] = highlight.xRange
      const x1 = getX(hxMin)
      const x2 = getX(hxMax)
      ctx.fillStyle = highlight.color || 'rgba(255, 170, 0, 0.15)'
      ctx.fillRect(x1, margin.top, x2 - x1, plotHeight)
      
      // Draw dashed borders
      ctx.strokeStyle = highlight.borderColor || 'rgba(255, 170, 0, 0.6)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(x1, margin.top)
      ctx.lineTo(x1, height - margin.bottom)
      ctx.moveTo(x2, margin.top)
      ctx.lineTo(x2, height - margin.bottom)
      ctx.stroke()
      ctx.setLineDash([])
    }
    
    // Draw series
    series.forEach(s => {
      if (!s.data || s.data.length === 0) return
      
      const xData = s.xData || s.data.map((_, i) => xMin + (i / (s.data.length - 1 || 1)) * xRange)
      
      ctx.strokeStyle = s.color || '#00d9ff'
      ctx.lineWidth = s.lineWidth || 2
      ctx.globalAlpha = s.opacity ?? 1
      
      if (s.dashed) {
        ctx.setLineDash(s.dashed === true ? [4, 4] : s.dashed)
      }
      
      // Draw line
      ctx.beginPath()
      const endIdx = s.endIndex ?? s.data.length
      for (let i = 0; i < Math.min(endIdx, s.data.length); i++) {
        const x = getX(xData[i])
        const y = getY(s.data[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      
      // Reset dash
      if (s.dashed) ctx.setLineDash([])
      ctx.globalAlpha = 1
      
      // Draw points if specified
      if (s.showPoints) {
        const pointRadius = s.pointRadius || 3
        ctx.fillStyle = s.pointColor || s.color || '#00d9ff'
        for (let i = 0; i < Math.min(endIdx, s.data.length); i++) {
          const x = getX(xData[i])
          const y = getY(s.data[i])
          ctx.beginPath()
          ctx.arc(x, y, pointRadius, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    })
    
    // Draw highlight points
    if (highlight?.points) {
      highlight.points.forEach(pt => {
        const x = getX(pt.x)
        const y = getY(pt.y)
        ctx.beginPath()
        ctx.arc(x, y, pt.radius || 5, 0, Math.PI * 2)
        ctx.fillStyle = pt.color || '#ffaa00'
        ctx.fill()
        if (pt.stroke) {
          ctx.strokeStyle = pt.stroke
          ctx.lineWidth = pt.strokeWidth || 2
          ctx.stroke()
        }
      })
    }
    
    // Call custom draw callback for overlays
    if (onDraw) {
      onDraw(ctx, { width, height, plotWidth, plotHeight, getX, getY, margin, xMin, xMax, yMin, yMax })
    }
  }, [series, xAxis, yAxis, margin, background, gridColor, compact, highlight, onDraw])
  
  // Initial draw and resize handling
  useEffect(() => {
    draw()
    
    const handleResize = () => draw()
    const observer = new ResizeObserver(handleResize)
    if (containerRef.current) observer.observe(containerRef.current)
    
    return () => observer.disconnect()
  }, [draw])
  
  return (
    <div ref={containerRef} className={`graph-container ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  )
}

// Bar chart variant
export function BarGraph({
  data = [],
  labels = [],
  colors = [],
  xAxis = {},
  yAxis = {},
  margin: customMargin,
  background = '#050510',
  gridColor = '#1a1a3a',
  barWidth = 0.8, // Fraction of available space
  compact = false,
  className = ''
}) {
  const canvasRef = useRef()
  const containerRef = useRef()
  
  const defaultMargin = compact 
    ? { top: 25, right: 15, bottom: 35, left: 40 }
    : { top: 30, right: 20, bottom: 45, left: 55 }
  const margin = { ...defaultMargin, ...customMargin }
  
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || data.length === 0) return
    
    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    if (width === 0 || height === 0) return
    
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)
    
    const plotWidth = width - margin.left - margin.right
    const plotHeight = height - margin.top - margin.bottom
    
    const yMin = yAxis.min ?? 0
    const yMax = yAxis.max ?? Math.max(...data) * 1.1
    const yRange = yMax - yMin || 1
    
    const getY = (val) => margin.top + plotHeight - ((val - yMin) / yRange) * plotHeight
    
    // Grid
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1
    const yTicks = yAxis.ticks || generateTicks(yMin, yMax, 5)
    yTicks.forEach(tick => {
      const y = getY(tick)
      ctx.beginPath()
      ctx.moveTo(margin.left, y)
      ctx.lineTo(width - margin.right, y)
      ctx.stroke()
    })
    
    // Y-axis labels
    ctx.fillStyle = '#aaaacc'
    ctx.font = `bold ${compact ? 10 : 11}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    yTicks.forEach(tick => {
      ctx.fillText(formatNumber(tick), margin.left - 6, getY(tick))
    })
    
    // Bars
    const bw = plotWidth / data.length
    const actualBarWidth = bw * barWidth
    data.forEach((val, i) => {
      const x = margin.left + i * bw + (bw - actualBarWidth) / 2
      const barHeight = ((val - yMin) / yRange) * plotHeight
      const y = margin.top + plotHeight - barHeight
      
      ctx.fillStyle = colors[i] || '#ff6b9d'
      ctx.fillRect(x, y, actualBarWidth, barHeight)
    })
    
    // X-axis labels
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    labels.forEach((label, i) => {
      const x = margin.left + i * bw + bw / 2
      ctx.fillText(label, x, height - margin.bottom + 6)
    })
  }, [data, labels, colors, yAxis, margin, background, gridColor, barWidth, compact])
  
  useEffect(() => {
    draw()
    
    const observer = new ResizeObserver(draw)
    if (containerRef.current) observer.observe(containerRef.current)
    
    return () => observer.disconnect()
  }, [draw])
  
  return (
    <div ref={containerRef} className={`graph-container bar-graph ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  )
}

// Helper functions
function generateTicks(min, max, count) {
  const range = max - min
  if (range === 0) return [min]
  
  const step = range / (count - 1)
  const ticks = []
  for (let i = 0; i < count; i++) {
    ticks.push(min + i * step)
  }
  return ticks
}

function formatNumber(val) {
  if (Math.abs(val) >= 1000) return val.toFixed(0)
  if (Math.abs(val) >= 100) return val.toFixed(0)
  if (Math.abs(val) >= 10) return val.toFixed(1)
  if (Math.abs(val) >= 1) return val.toFixed(1)
  if (val === 0) return '0'
  return val.toFixed(2)
}
