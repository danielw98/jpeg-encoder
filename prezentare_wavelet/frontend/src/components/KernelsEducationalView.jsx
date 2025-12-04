import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import './KernelsEducational.css'

// Base 3x3 kernel definitions - will be resized dynamically
const BASE_KERNELS = {
  blur_box: {
    name: 'Box Blur',
    description: 'Media tuturor vecinilor - netezire uniformă'
  },
  blur_gaussian: {
    name: 'Gaussian Blur', 
    description: 'Pondere mai mare pentru centru - netezire naturală'
  },
  edge_sobel_x: {
    name: 'Sobel X',
    description: 'Detectează muchii verticale (gradienți orizontali)'
  },
  edge_sobel_y: {
    name: 'Sobel Y',
    description: 'Detectează muchii orizontale (gradienți verticali)'
  },
  sharpen: {
    name: 'Sharpen',
    description: 'Amplifică diferențele - imagine mai clară'
  },
  edge_laplacian: {
    name: 'Laplacian',
    description: 'Detectează toate muchiile în toate direcțiile'
  },
  identity: {
    name: 'Identity',
    description: 'Nu modifică imaginea - referință'
  }
}

// Generate kernel matrix for given size
function generateKernel(kernelId, size) {
  const center = Math.floor(size / 2)
  
  switch (kernelId) {
    case 'blur_box': {
      const matrix = Array(size).fill(null).map(() => Array(size).fill(1))
      return { matrix, scale: size * size }
    }
    
    case 'blur_gaussian': {
      // Generate Gaussian weights based on distance from center
      const sigma = size / 4
      const matrix = []
      let sum = 0
      for (let i = 0; i < size; i++) {
        const row = []
        for (let j = 0; j < size; j++) {
          const dist = Math.sqrt((i - center) ** 2 + (j - center) ** 2)
          const val = Math.exp(-(dist * dist) / (2 * sigma * sigma))
          row.push(val)
          sum += val
        }
        matrix.push(row)
      }
      // Normalize to integers for display
      const minVal = Math.min(...matrix.flat())
      const scale = 1 / minVal
      const intMatrix = matrix.map(row => row.map(v => Math.round(v * scale)))
      const intSum = intMatrix.flat().reduce((a, b) => a + b, 0)
      return { matrix: intMatrix, scale: intSum }
    }
    
    case 'edge_sobel_x': {
      const matrix = Array(size).fill(null).map(() => Array(size).fill(0))
      for (let i = 0; i < size; i++) {
        const distFromCenter = Math.abs(i - center)
        const weight = size - distFromCenter
        matrix[i][0] = -weight
        matrix[i][size - 1] = weight
      }
      return { matrix, scale: 1 }
    }
    
    case 'edge_sobel_y': {
      const matrix = Array(size).fill(null).map(() => Array(size).fill(0))
      for (let j = 0; j < size; j++) {
        const distFromCenter = Math.abs(j - center)
        const weight = size - distFromCenter
        matrix[0][j] = -weight
        matrix[size - 1][j] = weight
      }
      return { matrix, scale: 1 }
    }
    
    case 'sharpen': {
      const matrix = Array(size).fill(null).map(() => Array(size).fill(0))
      // Cross pattern negative
      for (let i = 0; i < size; i++) {
        matrix[center][i] = -1
        matrix[i][center] = -1
      }
      matrix[center][center] = size * 2 - 1
      return { matrix, scale: 1 }
    }
    
    case 'edge_laplacian': {
      const matrix = Array(size).fill(null).map(() => Array(size).fill(0))
      // Cross pattern
      for (let i = 0; i < size; i++) {
        matrix[center][i] = -1
        matrix[i][center] = -1
      }
      matrix[center][center] = (size - 1) * 2
      return { matrix, scale: 1 }
    }
    
    case 'identity':
    default: {
      const matrix = Array(size).fill(null).map(() => Array(size).fill(0))
      matrix[center][center] = 1
      return { matrix, scale: 1 }
    }
  }
}

export default function KernelsEducationalView({ api, compact = false }) {
  // State
  const [sprites, setSprites] = useState([])
  const [selectedSprite, setSelectedSprite] = useState(null)
  const [pixelData, setPixelData] = useState(null)
  const [selectedKernel, setSelectedKernel] = useState('blur_gaussian')
  const [kernelSize, setKernelSize] = useState(3) // 3 to 6
  const [animationPos, setAnimationPos] = useState({ row: 0, col: 0 })
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationSpeed, setAnimationSpeed] = useState(300) // ms per step
  const [outputPixels, setOutputPixels] = useState(null)
  const [hoveredPixel, setHoveredPixel] = useState(null)
  const animationRef = useRef(null)
  
  // Track history for going back
  const [history, setHistory] = useState([])
  
  // Generate current kernel based on size
  const kernel = {
    ...BASE_KERNELS[selectedKernel],
    ...generateKernel(selectedKernel, kernelSize)
  }
  const halfKernel = Math.floor(kernelSize / 2)
  
  // Load sprite list on mount
  useEffect(() => {
    const loadSprites = async () => {
      try {
        const response = await axios.get(`${api}/sprite-images`)
        setSprites(response.data.images)
        // Default to 16x16 smiley
        const defaultSprite = response.data.images.find(s => s.id === 'smiley_16') 
          || response.data.images[0]
        if (defaultSprite) {
          setSelectedSprite(defaultSprite.id)
        }
      } catch (err) {
        console.error('Failed to load sprites:', err)
      }
    }
    loadSprites()
  }, [api])
  
  // Load pixel data when sprite changes
  useEffect(() => {
    if (!selectedSprite) return
    
    const loadPixels = async () => {
      try {
        const response = await axios.get(`${api}/sprite-images/${selectedSprite}/pixels`)
        setPixelData(response.data)
        // Initialize output with zeros
        const size = response.data.size
        setOutputPixels(Array(size).fill(null).map(() => 
          Array(size).fill(null).map(() => [0, 0, 0])
        ))
        // Reset animation
        setAnimationPos({ row: 0, col: 0 })
      } catch (err) {
        console.error('Failed to load pixel data:', err)
      }
    }
    loadPixels()
  }, [selectedSprite, api])
  
  // Apply kernel at current position (for step-by-step)
  const applyKernelAtPosition = useCallback((pixels, row, col, kernelMatrix, scale, kernelId) => {
    if (!pixels) return [0, 0, 0]
    
    const imgSize = pixels.length
    const kSize = kernelMatrix.length
    const half = Math.floor(kSize / 2)
    let r = 0, g = 0, b = 0
    
    for (let ki = 0; ki < kSize; ki++) {
      for (let kj = 0; kj < kSize; kj++) {
        const pi = row + ki - half
        const pj = col + kj - half
        
        // Handle boundaries (zero padding)
        if (pi >= 0 && pi < imgSize && pj >= 0 && pj < imgSize) {
          const weight = kernelMatrix[ki][kj]
          r += pixels[pi][pj][0] * weight
          g += pixels[pi][pj][1] * weight
          b += pixels[pi][pj][2] * weight
        }
      }
    }
    
    // Normalize and clamp
    if (scale > 1) {
      r /= scale
      g /= scale
      b /= scale
    }
    
    // For edge detection kernels that can go negative
    if (scale === 1 && (kernelId.includes('sobel') || kernelId.includes('laplacian'))) {
      // Map to 0-255 range
      r = Math.abs(r)
      g = Math.abs(g)
      b = Math.abs(b)
    }
    
    return [
      Math.max(0, Math.min(255, Math.round(r))),
      Math.max(0, Math.min(255, Math.round(g))),
      Math.max(0, Math.min(255, Math.round(b)))
    ]
  }, [])
  
  // Step animation forward
  const stepAnimation = useCallback(() => {
    if (!pixelData || !outputPixels) return false
    
    const size = pixelData.size
    const { row, col } = animationPos
    
    // Check if already at the end
    if (row >= size) {
      setIsAnimating(false)
      return false
    }
    
    // Save current state to history before modifying
    setHistory(prev => [...prev, { pos: { row, col }, output: outputPixels.map(r => r.map(c => c ? [...c] : null)) }])
    
    // Apply kernel at current position
    const newOutput = outputPixels.map(r => r.map(c => c ? [...c] : null))
    const result = applyKernelAtPosition(pixelData.pixels, row, col, kernel.matrix, kernel.scale, selectedKernel)
    newOutput[row][col] = result
    setOutputPixels(newOutput)
    
    // Move to next position
    let nextCol = col + 1
    let nextRow = row
    if (nextCol >= size) {
      nextCol = 0
      nextRow = row + 1
    }
    
    if (nextRow >= size) {
      // Animation complete
      setAnimationPos({ row: size, col: 0 })
      setIsAnimating(false)
      return false
    }
    
    setAnimationPos({ row: nextRow, col: nextCol })
    return true
  }, [pixelData, animationPos, outputPixels, kernel.matrix, kernel.scale, selectedKernel, applyKernelAtPosition])
  
  // Step animation backward
  const stepBack = useCallback(() => {
    if (history.length === 0) return
    
    const lastState = history[history.length - 1]
    setHistory(prev => prev.slice(0, -1))
    setAnimationPos(lastState.pos)
    setOutputPixels(lastState.output)
    setIsAnimating(false)
  }, [history])
  
  // Auto animation loop
  useEffect(() => {
    if (!isAnimating) {
      if (animationRef.current) {
        clearInterval(animationRef.current)
        animationRef.current = null
      }
      return
    }
    
    animationRef.current = setInterval(() => {
      const shouldContinue = stepAnimation()
      if (!shouldContinue) {
        clearInterval(animationRef.current)
        animationRef.current = null
      }
    }, animationSpeed)
    
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
    }
  }, [isAnimating, animationSpeed, stepAnimation])
  
  // Reset animation - clears output to empty state
  const resetAnimation = useCallback(() => {
    setIsAnimating(false)
    setAnimationPos({ row: 0, col: 0 })
    setHistory([])
    if (pixelData) {
      const size = pixelData.size
      // Set to null to show empty pattern instead of black
      setOutputPixels(Array(size).fill(null).map(() => 
        Array(size).fill(null)
      ))
    }
  }, [pixelData])
  
  // Start/pause animation
  const toggleAnimation = useCallback(() => {
    if (isAnimating) {
      // If running, just pause
      setIsAnimating(false)
    } else {
      // If at end, reset first
      if (pixelData && animationPos.row >= pixelData.size) {
        resetAnimation()
        // Small delay to let reset take effect
        setTimeout(() => setIsAnimating(true), 50)
      } else {
        setIsAnimating(true)
      }
    }
  }, [isAnimating, pixelData, animationPos.row, resetAnimation])

  // Apply kernel to entire image instantly
  const applyFullKernel = useCallback(() => {
    if (!pixelData) return
    
    const size = pixelData.size
    const newOutput = []
    
    for (let i = 0; i < size; i++) {
      const row = []
      for (let j = 0; j < size; j++) {
        row.push(applyKernelAtPosition(pixelData.pixels, i, j, kernel.matrix, kernel.scale, selectedKernel))
      }
      newOutput.push(row)
    }
    
    setOutputPixels(newOutput)
    setAnimationPos({ row: size, col: 0 })
    setIsAnimating(false)
    setHistory([])
  }, [pixelData, kernel.matrix, kernel.scale, selectedKernel, applyKernelAtPosition])
  
  // Render pixel grid - responsive to fill wrapper
  const renderPixelGrid = (pixels, isInput = true, highlightPos = null) => {
    if (!pixels) return null
    
    const size = pixels.length
    // Use percentage-based sizing for responsive layout
    const cellPercent = 100 / size
    
    return (
      <div 
        className="pixel-grid"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
          width: '100%',
          height: '100%'
        }}
      >
        {pixels.map((row, i) => 
          row.map((pixel, j) => {
            const isHighlighted = highlightPos && 
              i >= highlightPos.row - halfKernel && i <= highlightPos.row + halfKernel &&
              j >= highlightPos.col - halfKernel && j <= highlightPos.col + halfKernel
            const isCenter = highlightPos && i === highlightPos.row && j === highlightPos.col
            
            // Handle null pixels (empty state)
            const isEmpty = pixel === null
            const rgb = isEmpty ? 'transparent' : `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
            const title = isEmpty 
              ? `[${i},${j}] (empty)` 
              : `[${i},${j}] RGB(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
            
            return (
              <div
                key={`${i}-${j}`}
                className={`pixel-cell ${isHighlighted ? 'highlighted' : ''} ${isCenter ? 'center' : ''} ${isEmpty ? 'empty' : ''}`}
                style={{ backgroundColor: rgb }}
                onMouseEnter={() => !isEmpty && setHoveredPixel({ row: i, col: j, rgb: pixel })}
                onMouseLeave={() => setHoveredPixel(null)}
                title={title}
              />
            )
          })
        )}
      </div>
    )
  }
  
  // Render kernel matrix with current values overlay
  const renderKernelOverlay = () => {
    if (!pixelData || !kernel) return null
    
    const { row, col } = animationPos
    const imgSize = pixelData.size
    const kSize = kernelSize
    
    // Get the NxN region around current position
    const region = []
    for (let ki = 0; ki < kSize; ki++) {
      const rowData = []
      for (let kj = 0; kj < kSize; kj++) {
        const pi = row + ki - halfKernel
        const pj = col + kj - halfKernel
        
        if (pi >= 0 && pi < imgSize && pj >= 0 && pj < imgSize) {
          rowData.push({
            pixel: pixelData.pixels[pi][pj],
            weight: kernel.matrix[ki][kj]
          })
        } else {
          rowData.push({ pixel: [0, 0, 0], weight: kernel.matrix[ki][kj] })
        }
      }
      region.push(rowData)
    }
    
    // Calculate weighted sum
    let sumR = 0, sumG = 0, sumB = 0
    region.forEach(rowData => {
      rowData.forEach(({ pixel, weight }) => {
        sumR += pixel[0] * weight
        sumG += pixel[1] * weight
        sumB += pixel[2] * weight
      })
    })
    
    if (kernel.scale > 1) {
      sumR /= kernel.scale
      sumG /= kernel.scale
      sumB /= kernel.scale
    }
    
    return (
      <div className="kernel-calculation">
        <h4>Calcul la poziția [{row}, {col}]</h4>
        
        <div className="calculation-grid">
          <div className="calc-section">
            <span className="calc-label">Pixeli ×</span>
            <div className="mini-grid">
              {region.map((rowData, i) => (
                <div key={i} className="mini-row">
                  {rowData.map(({ pixel }, j) => (
                    <div 
                      key={j} 
                      className="mini-cell pixel"
                      style={{ backgroundColor: `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})` }}
                    >
                      <span className="pixel-val">{pixel[0]}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          <div className="calc-section">
            <span className="calc-label">Kernel =</span>
            <div className="mini-grid kernel">
              {kernel.matrix.map((row, i) => (
                <div key={i} className="mini-row">
                  {row.map((val, j) => (
                    <div 
                      key={j} 
                      className={`mini-cell weight ${val > 0 ? 'positive' : val < 0 ? 'negative' : 'zero'}`}
                    >
                      {val}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          <div className="calc-section result">
            <span className="calc-label">
              {kernel.scale > 1 ? `Σ ÷ ${kernel.scale} =` : 'Σ ='}
            </span>
            <div 
              className="result-pixel"
              style={{ 
                backgroundColor: `rgb(${Math.max(0, Math.min(255, Math.round(sumR)))}, ${Math.max(0, Math.min(255, Math.round(sumG)))}, ${Math.max(0, Math.min(255, Math.round(sumB)))})` 
              }}
            >
              <span>{Math.round(Math.max(0, Math.min(255, sumR)))}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Calculation info with region pixels
  const renderCalcInfo = () => {
    if (!pixelData || !kernel) return null
    
    const { row, col } = animationPos
    const imgSize = pixelData.size
    const kSize = kernelSize
    const half = Math.floor(kSize / 2)
    
    // Get region pixels
    const region = []
    for (let ki = 0; ki < kSize; ki++) {
      const rowData = []
      for (let kj = 0; kj < kSize; kj++) {
        const pi = row + ki - half
        const pj = col + kj - half
        if (pi >= 0 && pi < imgSize && pj >= 0 && pj < imgSize) {
          rowData.push(pixelData.pixels[pi][pj])
        } else {
          rowData.push([0, 0, 0])
        }
      }
      region.push(rowData)
    }
    
    const result = applyKernelAtPosition(pixelData.pixels, row, col, kernel.matrix, kernel.scale)
    const rgb = `rgb(${result[0]}, ${result[1]}, ${result[2]})`
    const gray = Math.round((result[0] + result[1] + result[2]) / 3)
    
    const sizeClass = kSize >= 6 ? 'size-6' : kSize >= 5 ? 'size-5' : ''
    
    return (
      <div className={`calc-info ${sizeClass}`}>
        <h4>Poziția [{row}, {col}]</h4>
        <div className="calc-row">
          <div className="region-mini">
            <div className="calc-label">Pixeli</div>
            <div className="mini-matrix">
              {region.map((r, i) => (
                <div key={i} className="mini-row">
                  {r.map((px, j) => {
                    const g = Math.round((px[0] + px[1] + px[2]) / 3)
                    return (
                      <div 
                        key={j} 
                        className="mini-cell" 
                        style={{ backgroundColor: `rgb(${px[0]},${px[1]},${px[2]})` }}
                      >
                        <span style={{ color: g > 128 ? '#000' : '#fff' }}>{g}</span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="calc-equals">=</div>
          <div className="result-pixel" style={{ backgroundColor: rgb }}>
            {gray}
          </div>
        </div>
        {kernel.scale > 1 && (
          <div className="result-label">÷ {kernel.scale}</div>
        )}
      </div>
    )
  }
  
  const kernelSizeClass = kernelSize >= 6 ? 'size-6' : kernelSize >= 5 ? 'size-5' : ''
  
  return (
    <div className="kernels-educational">
      {/* Main area: images + right panel */}
      <div className="edu-main-area">
        {/* Left: Images stacked or side by side */}
        <div className="edu-images-area">
          <div className="grid-container">
            <h3>Input (Original)</h3>
            <div className="pixel-grid-wrapper">
              {renderPixelGrid(pixelData?.pixels, true, isAnimating || animationPos.row > 0 || animationPos.col > 0 ? animationPos : null)}
            </div>
          </div>
          
          <div className="grid-container">
            <h3>Output (Rezultat)</h3>
            <div className="pixel-grid-wrapper">
              {renderPixelGrid(outputPixels, false)}
            </div>
          </div>
        </div>
        
        {/* Right: Matrices display */}
        <div className="edu-matrices-panel">
          <div className="kernel-display">
            <h3>{kernel?.name}</h3>
            <p className="kernel-desc">{kernel?.description}</p>
            <div className={`kernel-matrix-edu ${kernelSizeClass}`}>
              {kernel?.matrix.map((row, i) => (
                <div key={i} className="kernel-row">
                  {row.map((val, j) => (
                    <div 
                      key={j} 
                      className={`kernel-cell ${val > 0 ? 'positive' : val < 0 ? 'negative' : 'zero'}`}
                    >
                      {val}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {kernel?.scale > 1 && (
              <p className="scale-note">÷ {kernel.scale}</p>
            )}
          </div>
          
          {pixelData && renderCalcInfo()}
        </div>
      </div>
      
      {/* Bottom: Controls bar */}
      <div className="edu-controls-bar">
        <div className="control-group">
          <label>🖼️ Sprite</label>
          <select 
            value={selectedSprite || ''} 
            onChange={e => setSelectedSprite(e.target.value)}
          >
            {sprites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>🔲 Kernel</label>
          <select 
            value={selectedKernel} 
            onChange={e => {
              setSelectedKernel(e.target.value)
              resetAnimation()
            }}
          >
            {Object.entries(BASE_KERNELS).map(([id, k]) => (
              <option key={id} value={id}>{k.name}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>📐 {kernelSize}×{kernelSize}</label>
          <input
            type="range"
            min="3"
            max="6"
            step="1"
            value={kernelSize}
            onChange={e => {
              setKernelSize(parseInt(e.target.value))
              resetAnimation()
            }}
          />
        </div>
        
        <div className="control-group">
          <label>⏱️ {animationSpeed}ms</label>
          <input
            type="range"
            min="50"
            max="500"
            step="50"
            value={550 - animationSpeed}
            onChange={e => setAnimationSpeed(550 - parseInt(e.target.value))}
          />
        </div>
        
        <div className="edu-animation-controls">
          <button 
            onClick={toggleAnimation}
            className={isAnimating ? 'stop' : 'play'}
            title={isAnimating ? 'Pauză' : 'Play'}
          >
            {isAnimating ? '⏸️' : '▶️'}
          </button>
          <button 
            onClick={stepBack} 
            disabled={isAnimating || history.length === 0}
            title="Pas înapoi"
          >
            ⏮️
          </button>
          <button 
            onClick={stepAnimation} 
            disabled={isAnimating || (pixelData && animationPos.row >= pixelData.size)}
            title="Pas înainte"
          >
            ⏭️
          </button>
          <button 
            onClick={applyFullKernel}
            title="Aplică complet"
          >
            ⏩
          </button>
          <button 
            onClick={resetAnimation}
            title="Reset"
          >
            🔄
          </button>
        </div>
      </div>
      
      {hoveredPixel && (
        <div className="pixel-info">
          [{hoveredPixel.row}, {hoveredPixel.col}]: RGB({hoveredPixel.rgb[0]}, {hoveredPixel.rgb[1]}, {hoveredPixel.rgb[2]})
        </div>
      )}
    </div>
  )
}
