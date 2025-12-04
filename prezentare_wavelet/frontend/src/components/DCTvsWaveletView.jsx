import { useState, useEffect, useRef, useMemo } from 'react'
import LaTeX from './LaTeX'
import '../styles/views/jpeg.css'

// ============================================
// DCT vs WAVELET COMPARISON VIEW
// Shows differences between JPEG (DCT) and JPEG2000 (Wavelet)
// ============================================

// Seeded random number generator for consistent noise
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export default function DCTvsWaveletView({ compact = false }) {
  const canvasRef = useRef()
  const [quality, setQuality] = useState(30)
  const [showBlockLines, setShowBlockLines] = useState(true)
  const [viewMode, setViewMode] = useState('side-by-side')
  
  useEffect(() => {
    drawComparison()
  }, [quality, showBlockLines, viewMode])
  
  const drawComparison = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const width = 1500
    const height = 680
    
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.scale(dpr, dpr)
    
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, width, height)
    
    const imgSize = 420
    const gap = 140
    
    if (viewMode === 'progressive') {
      drawProgressiveLoading(ctx, width, height)
    } else {
      drawSideBySide(ctx, width, height, imgSize, gap)
    }
  }
  
  const drawSideBySide = (ctx, width, height, imgSize, gap) => {
    const totalWidth = imgSize * 2 + gap
    const startX = (width - totalWidth) / 2
    const startY = 70
    
    // Labels above images
    ctx.textAlign = 'center'
    ctx.font = 'bold 28px system-ui'
    
    // DCT (JPEG) label
    ctx.fillStyle = '#ff9f43'
    ctx.fillText('JPEG (DCT)', startX + imgSize / 2, startY - 20)
    
    // Wavelet (JPEG2000) label
    ctx.fillStyle = '#00d4ff'
    ctx.fillText('JPEG2000 (Wavelet)', startX + imgSize + gap + imgSize / 2, startY - 20)
    
    // Draw simulated compressed images
    drawDCTImage(ctx, startX, startY, imgSize, quality, showBlockLines)
    drawWaveletImage(ctx, startX + imgSize + gap, startY, imgSize, quality)
    
    // "vs" between
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 36px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('vs', startX + imgSize + gap / 2, startY + imgSize / 2)
    
    // Text underneath each image
    const textY = startY + imgSize + 30
    ctx.font = '20px system-ui'
    ctx.textAlign = 'center'
    
    // DCT characteristics
    ctx.fillStyle = '#ff9f43'
    ctx.fillText('• Blocuri fixe 8×8', startX + imgSize / 2, textY)
    ctx.fillText('• Artefacte de bloc vizibile', startX + imgSize / 2, textY + 28)
    ctx.fillText('• Compresie: bună', startX + imgSize / 2, textY + 56)
    
    // Wavelet characteristics
    ctx.fillStyle = '#00d4ff'
    const waveletCenterX = startX + imgSize + gap + imgSize / 2
    ctx.fillText('• Transformare globală', waveletCenterX, textY)
    ctx.fillText('• Degradare uniformă (blur)', waveletCenterX, textY + 28)
    ctx.fillText('• Compresie: foarte bună', waveletCenterX, textY + 56)
  }
  
  const drawDCTImage = (ctx, x, y, size, quality, showBlocks) => {
    const intSize = Math.floor(size)
    const numBlocks = 32
    const blockSize = intSize / numBlocks
    
    // Generate "compressed" image with blocking artifacts using seeded random
    for (let by = 0; by < numBlocks; by++) {
      for (let bx = 0; bx < numBlocks; bx++) {
        // Base color with gradient
        const baseR = 100 + (bx / numBlocks) * 100
        const baseG = 80 + (by / numBlocks) * 80
        const baseB = 120
        
        // Add quantization noise based on quality - use seeded random for consistency
        const noise = (100 - quality) / 100
        const seed = by * numBlocks + bx + 1
        const blockNoise = (seededRandom(seed) - 0.5) * noise * 120
        
        const r = Math.max(0, Math.min(255, Math.floor(baseR + blockNoise)))
        const g = Math.max(0, Math.min(255, Math.floor(baseG + blockNoise)))
        const b = Math.max(0, Math.min(255, Math.floor(baseB + blockNoise)))
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(x + bx * blockSize, y + by * blockSize, blockSize + 0.5, blockSize + 0.5)
      }
    }
    
    // Draw block lines (artifacts) - controlled by showBlocks toggle
    if (showBlocks) {
      const lineOpacity = Math.max(0.2, (100 - quality) / 100)
      ctx.strokeStyle = `rgba(0, 0, 0, ${lineOpacity})`
      ctx.lineWidth = quality < 50 ? 2 : 1
      for (let i = 0; i <= numBlocks; i++) {
        ctx.beginPath()
        ctx.moveTo(x + i * blockSize, y)
        ctx.lineTo(x + i * blockSize, y + intSize)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, y + i * blockSize)
        ctx.lineTo(x + intSize, y + i * blockSize)
        ctx.stroke()
      }
    }
    
    // Border
    ctx.strokeStyle = '#ff9f43'
    ctx.lineWidth = 3
    ctx.strokeRect(x, y, intSize, intSize)
  }
  
  const drawWaveletImage = (ctx, x, y, size, quality) => {
    // Draw directly to canvas for wavelet (smooth, no blocks)
    const intSize = Math.floor(size)
    const blurAmount = (100 - quality) / 100
    
    for (let py = 0; py < intSize; py++) {
      for (let px = 0; px < intSize; px++) {
        // Smooth gradient
        const baseR = 100 + (px / intSize) * 100
        const baseG = 80 + (py / intSize) * 80
        const baseB = 120
        
        // Add smooth noise (simulating wavelet blur at low quality)
        const noiseScale = blurAmount * 60
        const smoothNoise = Math.sin(px * 0.05) * Math.cos(py * 0.05) * noiseScale
        
        const r = Math.max(0, Math.min(255, Math.floor(baseR + smoothNoise)))
        const g = Math.max(0, Math.min(255, Math.floor(baseG + smoothNoise)))
        const b = Math.max(0, Math.min(255, Math.floor(baseB + smoothNoise)))
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
    
    // Border
    ctx.strokeStyle = '#00d4ff'
    ctx.lineWidth = 3
    ctx.strokeRect(x, y, intSize, intSize)
  }
  
  const drawProgressiveLoading = (ctx, width, height) => {
    const levels = [10, 30, 50, 100]
    const imgSize = 300
    const gap = 25
    const totalWidth = levels.length * imgSize + (levels.length - 1) * gap
    const startX = (width - totalWidth) / 2
    const startY = 110
    
    // Title
    ctx.font = 'bold 32px system-ui'
    ctx.fillStyle = '#ffd700'
    ctx.textAlign = 'center'
    ctx.fillText('Încărcare Progresivă - JPEG2000', width / 2, 50)
    
    ctx.font = '20px system-ui'
    ctx.fillStyle = '#888'
    ctx.fillText('Wavelets permit încărcarea treptată a imaginii', width / 2, 85)
    
    levels.forEach((level, idx) => {
      const x = startX + idx * (imgSize + gap)
      
      // Always draw wavelet image at this quality level
      drawWaveletImage(ctx, x, startY, imgSize, level)
      
      // Label underneath
      ctx.fillStyle = '#00ff88'
      ctx.font = 'bold 26px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(`${level}%`, x + imgSize / 2, startY + imgSize + 40)
    })
    
    // Bottom notes
    const noteY = startY + imgSize + 90
    ctx.font = '20px system-ui'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ff9f43'
    ctx.fillText('JPEG: Tot sau nimic per bloc', width / 2, noteY)
    ctx.fillStyle = '#00d4ff'
    ctx.fillText('JPEG2000: Îmbunătățire graduală peste tot', width / 2, noteY + 30)
  }
  
  return (
    <div className="dct-wavelet-view">
      <div className="stage-header">
        <h4>⚡ DCT (JPEG) vs Wavelet (JPEG2000)</h4>
        <div className="view-toggle">
          <button 
            className={viewMode === 'side-by-side' ? 'active' : ''}
            onClick={() => setViewMode('side-by-side')}
          >
            Comparație
          </button>
          <button 
            className={viewMode === 'progressive' ? 'active' : ''}
            onClick={() => setViewMode('progressive')}
          >
            Progresiv
          </button>
        </div>
      </div>
      
      {viewMode === 'side-by-side' && (
        <div className="controls-row">
          <div className="control-item">
            <label>Calitate: {quality}%</label>
            <input 
              type="range" 
              min="10" 
              max="95" 
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
            />
          </div>
          
          <label className="checkbox-item">
            <input 
              type="checkbox" 
              checked={showBlockLines}
              onChange={(e) => setShowBlockLines(e.target.checked)}
            />
            Arată blocuri 8×8
          </label>
        </div>
      )}
      
      <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
    </div>
  )
}
