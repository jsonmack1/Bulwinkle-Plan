'use client'

import React, { useEffect, useRef, useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathRendererProps {
  /** Mathematical expression in LaTeX format */
  latex: string
  /** Whether to display as inline or block math */
  display?: boolean
  /** Custom className for styling */
  className?: string
  /** Whether to show a border around the math */
  bordered?: boolean
}

const MathRenderer: React.FC<MathRendererProps> = ({
  latex,
  display = false,
  className = '',
  bordered = false
}) => {
  const mathRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mathRef.current) return

    try {
      // Clear any existing content
      mathRef.current.innerHTML = ''
      
      // Configure KaTeX options
      const options = {
        displayMode: display,
        throwOnError: false,
        errorColor: '#dc3545',
        strict: false,
        trust: true,
        minRuleThickness: 0.05,
        macros: {
          "\\RR": "\\mathbb{R}",
          "\\ZZ": "\\mathbb{Z}",
          "\\NN": "\\mathbb{N}",
          "\\QQ": "\\mathbb{Q}",
          "\\CC": "\\mathbb{C}",
          "\\ce": "\\text{#1}",
          "\\pd": "\\partial",
          "\\dd": "\\mathrm{d}",
          "\\bra": "\\langle #1 |",
          "\\ket": "| #1 \\rangle",
          "\\braket": "\\langle #1 | #2 \\rangle",
          "\\abs": "| #1 |",
          "\\norm": "\\| #1 \\|",
          "\\vec": "\\mathbf{#1}",
          "\\hat": "\\widehat{#1}",
          "\\tr": "\\operatorname{tr}",
          "\\det": "\\operatorname{det}",
          "\\rank": "\\operatorname{rank}",
          "\\span": "\\operatorname{span}",
          "\\im": "\\operatorname{im}",
          "\\ker": "\\operatorname{ker}",
          "\\Re": "\\operatorname{Re}",
          "\\Im": "\\operatorname{Im}"
        }
      }

      // Render the mathematics with KaTeX
      katex.render(latex, mathRef.current, options)
      
      setIsLoaded(true)
      setError(null)
    } catch (err) {
      console.error('KaTeX rendering error:', err)
      setError('Failed to render mathematical expression')
      setIsLoaded(false)
    }
  }, [latex, display])

  if (error) {
    return (
      <div className={`math-error bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center text-red-700 text-sm">
          <span className="mr-2">⚠️</span>
          <span>{error}</span>
        </div>
        <div className="text-xs text-red-600 mt-1 font-mono">
          LaTeX: {latex}
        </div>
      </div>
    )
  }

  const containerClasses = [
    'math-container',
    display ? 'math-display' : 'math-inline',
    bordered ? 'border border-slate-200 rounded-lg p-3 bg-slate-50' : '',
    !isLoaded ? 'opacity-50' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      <div 
        ref={mathRef}
        className={display ? 'text-center' : 'inline-block'}
        style={{ 
          minHeight: display ? '40px' : '20px',
          lineHeight: display ? '1.5' : 'inherit'
        }}
      >
        {!isLoaded && (
          <span className="text-slate-500 text-sm">
            {display ? 'Loading equation...' : 'Loading...'}
          </span>
        )}
      </div>
    </div>
  )
}

export default MathRenderer

// Utility component for quick inline math
export const InlineMath: React.FC<{ latex: string; className?: string }> = ({ latex, className }) => (
  <MathRenderer latex={latex} display={false} className={className} />
)

// Utility component for block math equations
export const BlockMath: React.FC<{ latex: string; className?: string; bordered?: boolean }> = ({ 
  latex, 
  className, 
  bordered = true 
}) => (
  <MathRenderer latex={latex} display={true} className={className} bordered={bordered} />
)