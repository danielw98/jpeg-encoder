import { useEffect, useRef } from 'react'

/**
 * LaTeX component for rendering mathematical expressions using KaTeX
 * @param {string} math - The LaTeX expression to render
 * @param {boolean} block - If true, renders as display math (centered, larger)
 * @param {string} className - Additional CSS classes
 */
export default function LaTeX({ math, block = false, className = '' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current && window.katex) {
      try {
        window.katex.render(math, containerRef.current, {
          throwOnError: false,
          displayMode: block,
          trust: true,
          strict: false
        })
      } catch (e) {
        console.error('KaTeX error:', e)
        containerRef.current.textContent = math
      }
    }
  }, [math, block])

  // Fallback while KaTeX loads
  useEffect(() => {
    const checkKatex = setInterval(() => {
      if (window.katex && containerRef.current) {
        try {
          window.katex.render(math, containerRef.current, {
            throwOnError: false,
            displayMode: block,
            trust: true,
            strict: false
          })
          clearInterval(checkKatex)
        } catch (e) {
          console.error('KaTeX error:', e)
        }
      }
    }, 100)

    return () => clearInterval(checkKatex)
  }, [math, block])

  return (
    <span 
      ref={containerRef} 
      className={`latex ${block ? 'latex-block' : 'latex-inline'} ${className}`}
    >
      {math}
    </span>
  )
}

/**
 * Shorthand for block-level LaTeX
 */
export function LaTeXBlock({ math, className = '' }) {
  return <LaTeX math={math} block={true} className={className} />
}
