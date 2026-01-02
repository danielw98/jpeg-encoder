import { useState, useEffect, useRef } from 'react'
import LaTeX from './LaTeX'

export default function ComplexWaveletView({ compact = false }) {
  const [omega, setOmega] = useState(5)
  const [rotation, setRotation] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  // Complex Morlet: exp(-t^2/2) * exp(i*omega*t)
  const getPoints = (w) => {
    const points = []
    const steps = 300
    const range = 4
    
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 2 * range - range
      const envelope = Math.exp(-t*t/2)
      const re = envelope * Math.cos(w * t)
      const im = envelope * Math.sin(w * t)
      points.push({ t, re, im, envelope })
    }
    return points
  }

  useEffect(() => {
    if (autoRotate) {
      let lastTime = performance.now()
      const animate = (time) => {
        const dt = (time - lastTime) / 1000
        lastTime = time
        setRotation(r => (r + dt * 0.5) % (2 * Math.PI))
        animRef.current = requestAnimationFrame(animate)
      }
      animRef.current = requestAnimationFrame(animate)
    } else {
      cancelAnimationFrame(animRef.current)
    }
    return () => cancelAnimationFrame(animRef.current)
  }, [autoRotate])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    
    // Clear
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, W, H)
    
    const points = getPoints(omega)
    
    // 3D Projection
    // X axis: Time
    // Y axis: Real
    // Z axis: Imaginary
    
    // Camera angle
    const angle = rotation
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    
    const project = (t, re, im) => {
      // Rotate around Time axis (X) - actually let's rotate around Y (vertical) to see the spiral
      // Or rotate view around the t-axis
      
      // Let's keep t horizontal.
      // Rotate Re/Im plane.
      
      const y_rot = re * cos - im * sin
      const z_rot = re * sin + im * cos
      
      // Perspective projection
      const scale = 200 // Zoom
      const x_proj = W/2 + t * (W/10) // Spread time across width
      const y_proj = H/2 - y_rot * (H/4) // Scale amplitude
      
      // Z-depth for occlusion/size (simple)
      const z_depth = z_rot
      
      return { x: x_proj, y: y_proj, z: z_depth }
    }
    
    // Draw axis line (Time)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, H/2)
    ctx.lineTo(W, H/2)
    ctx.stroke()
    
    // Draw Spiral
    ctx.lineWidth = 3
    
    // We need to draw segments, maybe sorted by Z? 
    // For a line, simple drawing is usually fine unless self-intersecting heavily.
    // Let's just draw connected path.
    
    // Draw shadow/projection on back wall (Real part)
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)' // Blueish
    ctx.beginPath()
    points.forEach((p, i) => {
      const proj = project(p.t, p.re, -2) // Push back
      if (i===0) ctx.moveTo(proj.x, proj.y)
      else ctx.lineTo(proj.x, proj.y)
    })
    ctx.stroke()

    // Draw shadow/projection on floor (Imaginary part)
    ctx.strokeStyle = 'rgba(255, 170, 0, 0.2)' // Orangeish
    ctx.beginPath()
    points.forEach((p, i) => {
      const proj = project(p.t, -2, p.im) // Push down
      if (i===0) ctx.moveTo(proj.x, proj.y)
      else ctx.lineTo(proj.x, proj.y)
    })
    ctx.stroke()
    
    // Draw Main Spiral
    // Use gradient based on phase?
    
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i+1]
      
      const proj1 = project(p1.t, p1.re, p1.im)
      const proj2 = project(p2.t, p2.re, p2.im)
      
      // Color based on phase (angle in complex plane)
      // atan2(im, re)
      const phase = Math.atan2(p1.im, p1.re)
      // Map phase -PI..PI to Hue 0..360
      const hue = ((phase + Math.PI) / (2 * Math.PI)) * 360
      
      ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`
      ctx.beginPath()
      ctx.moveTo(proj1.x, proj1.y)
      ctx.lineTo(proj2.x, proj2.y)
      ctx.stroke()
    }
    
    // Draw Envelope
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    points.forEach((p, i) => {
      const proj = project(p.t, p.envelope, 0) // Just magnitude on Re axis? No, envelope is radius.
      // Envelope is a tube around the t-axis.
      // Let's just draw top/bottom profile in 2D
      const y_top = H/2 - p.envelope * (H/4)
      if (i===0) ctx.moveTo(project(p.t, 0, 0).x, y_top)
      else ctx.lineTo(project(p.t, 0, 0).x, y_top)
    })
    ctx.stroke()
    ctx.beginPath()
    points.forEach((p, i) => {
      const y_bot = H/2 + p.envelope * (H/4)
      if (i===0) ctx.moveTo(project(p.t, 0, 0).x, y_bot)
      else ctx.lineTo(project(p.t, 0, 0).x, y_bot)
    })
    ctx.stroke()
    ctx.setLineDash([])

  }, [omega, rotation])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '1rem',
      padding: compact ? '0.5rem' : '1rem',
      background: '#0f0f1a',
      color: '#fff'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: '#ff6b9d' }}>Wavelet Complex (Morlet)</h2>
        <p style={{ margin: '0.5rem 0 0', color: '#888', fontSize: '0.9rem' }}>
          <LaTeX math="\psi(t) = e^{-t^2/2} \cdot e^{i\omega t} = e^{-t^2/2} (\cos(\omega t) + i\sin(\omega t))" />
        </p>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        gap: '1rem',
        minHeight: 0
      }}>
        <div style={{
          flex: 3,
          position: 'relative',
          background: '#000',
          borderRadius: '8px',
          border: '1px solid #333',
          overflow: 'hidden'
        }}>
          <canvas 
            ref={canvasRef}
            width={800}
            height={400}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
          <div style={{ position: 'absolute', bottom: 10, left: 10, color: '#888', fontSize: '0.8rem' }}>
            Spirală 3D: Timp (X) vs Real (Y) vs Imaginar (Z)
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div className="control-group">
            <label>Frecvență (<LaTeX math="\omega" />): {omega}</label>
            <input 
              type="range" 
              min="1" 
              max="15" 
              step="0.5" 
              value={omega} 
              onChange={e => setOmega(parseFloat(e.target.value))} 
            />
          </div>

          <div className="control-group">
            <label>Rotație 3D</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="range" 
                min="0" 
                max={Math.PI * 2} 
                step="0.1" 
                value={rotation} 
                onChange={e => {
                  setRotation(parseFloat(e.target.value))
                  setAutoRotate(false)
                }} 
                style={{ flex: 1 }}
              />
              <button 
                onClick={() => setAutoRotate(!autoRotate)}
                style={{
                  background: 'none',
                  border: '1px solid #555',
                  color: autoRotate ? '#00ff88' : '#888',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  padding: '2px 6px'
                }}
              >
                {autoRotate ? 'Stop' : 'Auto'}
              </button>
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#fff' }}>De ce Complex?</h4>
            <p style={{ margin: 0, color: '#ccc' }}>
              Wavelet-urile complexe păstrează informația de <strong>fază</strong>.
              <br/><br/>
              Sunt esențiale pentru detectarea trăsăturilor invariante la translație și pentru analiza mișcării.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
