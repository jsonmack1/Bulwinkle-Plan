'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import ProfessionalMathProcessor from '../../utils/professionalMathProcessor'

declare global {
  interface Window {
    MathJax: {
      typesetPromise: (elements?: Element[]) => Promise<void>
      startup: {
        promise: Promise<void>
      }
      tex2svg: (tex: string, options?: any) => any
      mathml2svg: (mathml: string, options?: any) => any
    }
  }
}

interface ProfessionalMathContentProps {
  /** Content that may contain mathematical expressions */
  content: string
  /** Custom className for the container */
  className?: string
  /** Whether to show solutions and worked examples */
  showSolutions?: boolean
  /** Whether to use board display mode (large text for classroom) */
  boardDisplayMode?: boolean
  /** Whether this content is for PDF export */
  forPrint?: boolean
  /** Processing options for mathematical expressions */
  processingOptions?: {
    autoDetectDisplayMode?: boolean
    enhanceFractions?: boolean
    smartSubscripts?: boolean
    professionalSpacing?: boolean
  }
}

/**
 * Professional Mathematical Content Component
 * Uses MathJax for textbook-quality mathematical typography
 */
const ProfessionalMathContent: React.FC<ProfessionalMathContentProps> = ({
  content,
  className = '',
  showSolutions = true,
  boardDisplayMode = false,
  forPrint = false,
  processingOptions = {
    autoDetectDisplayMode: true,
    enhanceFractions: true,
    smartSubscripts: true,
    professionalSpacing: true
  }
}) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [mathJaxReady, setMathJaxReady] = useState(false)

  // Process content with professional mathematical notation
  const processedContent = useMemo(() => {
    if (!content) return 'No content available'

    let processed = content

    // Handle solutions visibility
    if (!showSolutions) {
      processed = processed.replace(/\*\*Solution[:\s]*.*?\*\*/gi, '**Solution:** _[Hidden - Click "Show Solutions" to reveal]_')
      processed = processed.replace(/\*\*Answer[:\s]*.*?\*\*/gi, '**Answer:** _[Hidden - Click "Show Solutions" to reveal]_')
      processed = processed.replace(/\*\*Step \d+[:\s]*.*?\n/gi, '**Step:** _[Hidden]_\n')
      
      // Hide math expressions that appear to be solutions
      processed = processed.replace(/\[math\]([^[\]]*=\s*[\d\w\+\-\*/\(\)\s\.]+)\[\/math\]/g, 
        '[math]\\text{Solution Hidden}[/math]')
    }

    // Process with professional math processor
    processed = ProfessionalMathProcessor.processContent(processed, processingOptions)

    // Convert markdown bold to HTML
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Process activity names
    processed = processed
      .replace(/ACTIVITY NAME: (.*?)(?=\n|$)/gi, '<div class="activity-name-header">🎯 ACTIVITY: $1</div>')
      .replace(/Activity Name: (.*?)(?=\n|$)/gi, '<div class="activity-name-header">🎯 ACTIVITY: $1</div>')
      .replace(/^\*\*([^*]+ACTIVITY[^*]*)\*\*$/gm, '<div class="activity-name-header">🎯 $1</div>')

    return processed
  }, [content, showSolutions, processingOptions])

  // Check if MathJax is ready
  useEffect(() => {
    const checkMathJax = () => {
      if (window.MathJax && window.MathJax.startup) {
        window.MathJax.startup.promise.then(() => {
          setMathJaxReady(true)
          console.log('🧮 MathJax Professional Ready')
        })
      } else {
        setTimeout(checkMathJax, 100)
      }
    }
    checkMathJax()
  }, [])

  // Process mathematical content with MathJax
  useEffect(() => {
    if (!mathJaxReady || !contentRef.current || isProcessing) return

    const processMath = async () => {
      setIsProcessing(true)
      try {
        if (window.MathJax && window.MathJax.typesetPromise) {
          await window.MathJax.typesetPromise([contentRef.current])
          console.log('✅ Mathematical content rendered professionally')
        }
      } catch (error) {
        console.error('❌ MathJax processing error:', error)
      } finally {
        setIsProcessing(false)
      }
    }

    // Small delay to ensure content is in DOM
    const timer = setTimeout(processMath, 50)
    return () => clearTimeout(timer)
  }, [processedContent, mathJaxReady, isProcessing])

  // Generate container classes
  const containerClasses = [
    'professional-math-content',
    className,
    boardDisplayMode ? 'board-display-mode' : '',
    forPrint ? 'print-mode' : '',
    isProcessing ? 'processing' : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      <div 
        ref={contentRef}
        className="math-content-container"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
      
      <style jsx>{`
        .professional-math-content {
          font-family: 'Times New Roman', 'Liberation Serif', 'DejaVu Serif', Georgia, serif;
          line-height: 1.6;
          color: #1a1a1a;
        }

        .professional-math-content .math-content-container {
          position: relative;
        }

        .professional-math-content.processing {
          opacity: 0.7;
        }

        /* MathJax Integration Styles */
        .professional-math-content :global(.MathJax) {
          font-size: inherit !important;
          color: inherit !important;
        }

        .professional-math-content :global(mjx-container[jax="SVG"]) {
          display: inline-block;
          margin: 0.2em 0.3em;
          vertical-align: -0.25em;
          line-height: normal;
          font-size: 1.1em;
        }

        .professional-math-content :global(mjx-container[jax="SVG"][display="true"]) {
          display: block;
          margin: 1.2em 0;
          text-align: center;
          font-size: 1.15em;
        }

        /* Professional Typography */
        .professional-math-content strong {
          font-weight: 600;
          color: #0d1117;
        }

        .professional-math-content p {
          margin: 0.8em 0;
          text-align: justify;
          hyphens: auto;
        }

        .professional-math-content .activity-name-header {
          font-weight: bold;
          font-size: 1.2rem;
          color: #1d4ed8;
          border-left: 4px solid #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 12px 16px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
          page-break-inside: avoid;
        }

        /* Board Display Mode - Large classroom-friendly text */
        .professional-math-content.board-display-mode {
          font-size: 1.5em;
          line-height: 1.8;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 32px;
          margin: 16px 0;
        }

        .professional-math-content.board-display-mode :global(mjx-container[jax="SVG"]) {
          font-size: 1.4em;
          margin: 0.3em 0.4em;
        }

        .professional-math-content.board-display-mode :global(mjx-container[jax="SVG"][display="true"]) {
          font-size: 1.6em;
          margin: 1.5em 0;
        }

        .professional-math-content.board-display-mode strong {
          font-size: 1.1em;
          color: #1e40af;
        }

        .professional-math-content.board-display-mode .activity-name-header {
          font-size: 1.4em;
          padding: 16px 24px;
          margin: 28px 0;
        }

        /* Print Mode - Optimized for PDF export */
        .professional-math-content.print-mode {
          font-family: 'Computer Modern', 'Latin Modern Math', 'Times New Roman', serif;
          color: #000;
          background: #fff;
          line-height: 1.7;
        }

        .professional-math-content.print-mode :global(mjx-container[jax="SVG"]) {
          font-size: 1.1em;
        }

        .professional-math-content.print-mode :global(mjx-container[jax="SVG"][display="true"]) {
          font-size: 1.2em;
          margin: 1.5em 0;
        }

        .professional-math-content.print-mode strong {
          font-weight: 700;
          color: #000;
        }

        .professional-math-content.print-mode .activity-name-header {
          background: #f8f9fa;
          border: 2px solid #343a40;
          color: #000;
          box-shadow: none;
        }

        /* Responsive Mathematical Typography */
        @media (max-width: 768px) {
          .professional-math-content :global(mjx-container[jax="SVG"]) {
            font-size: 1em;
            margin: 0.15em 0.2em;
          }

          .professional-math-content :global(mjx-container[jax="SVG"][display="true"]) {
            font-size: 1.1em;
            margin: 1em 0;
          }
        }

        /* Print Styles */
        @media print {
          .professional-math-content {
            font-family: 'Computer Modern', 'Latin Modern Math', 'Times New Roman', serif;
            color: #000 !important;
            background: #fff !important;
            font-size: 12pt;
            line-height: 1.6;
          }

          .professional-math-content :global(mjx-container[jax="SVG"]) {
            color: #000 !important;
            font-size: 1.1em !important;
          }

          .professional-math-content :global(mjx-container[jax="SVG"][display="true"]) {
            font-size: 1.2em !important;
            margin: 1.2em 0 !important;
            page-break-inside: avoid;
          }

          .professional-math-content .activity-name-header {
            background: #f5f5f5 !important;
            border: 2px solid #000 !important;
            color: #000 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            page-break-after: avoid;
          }

          .professional-math-content strong {
            color: #000 !important;
            font-weight: 700 !important;
          }
        }

        /* High-contrast mode support */
        @media (prefers-contrast: high) {
          .professional-math-content {
            color: #000;
          }

          .professional-math-content :global(mjx-container[jax="SVG"]) {
            color: #000 !important;
          }

          .professional-math-content .activity-name-header {
            background: #fff;
            border: 3px solid #000;
            color: #000;
          }
        }
      `}</style>
    </div>
  )
}

export default ProfessionalMathContent

// Export with display name for debugging
ProfessionalMathContent.displayName = 'ProfessionalMathContent'