'use client'

import React, { useRef, useEffect, useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import ProfessionalMathProcessor from '../../utils/professionalMathProcessor'

interface PremiumMathContentProps {
  /** Content that may contain mathematical expressions */
  content: string
  /** Custom className for the container */
  className?: string
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
 * Premium Mathematical Content Component
 * Clean professional math rendering with KaTeX
 */
const PremiumMathContent: React.FC<PremiumMathContentProps> = ({
  content,
  className = '',
  forPrint = false,
  processingOptions = {
    autoDetectDisplayMode: true,
    enhanceFractions: true,
    smartSubscripts: true,
    professionalSpacing: true
  }
}) => {
  const contentRef = useRef<HTMLDivElement>(null)

  // Process content with professional mathematical notation and markdown
  const processedContent = useMemo(() => {
    if (!content) return 'No content available'

    // Process with professional math processor
    let processed = ProfessionalMathProcessor.processContent(content, processingOptions)

    // Process activity names first (before headers)
    processed = processed
      .replace(/ACTIVITY NAME: (.*?)(?=\n|$)/gi, '<div class="activity-name-header">🎯 ACTIVITY: $1</div>')
      .replace(/Activity Name: (.*?)(?=\n|$)/gi, '<div class="activity-name-header">🎯 ACTIVITY: $1</div>')
      .replace(/^\*\*([^*]+ACTIVITY[^*]*)\*\*$/gm, '<div class="activity-name-header">🎯 $1</div>')

    // Convert headers (### ## #)
    processed = processed.replace(/^### (.*$)/gm, '<h3>$1</h3>')
    processed = processed.replace(/^## (.*$)/gm, '<h2>$1</h2>')
    processed = processed.replace(/^# (.*$)/gm, '<h1>$1</h1>')

    // Convert markdown bold to HTML
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // Process bullet lists and paragraphs more intelligently
    const lines = processed.split('\n')
    let inList = false
    const processedLines = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      if (trimmed.match(/^[-*]\s+/)) {
        // Handle bullet points
        if (!inList) {
          processedLines.push('<ul class="lesson-list">')
          inList = true
        }
        const listContent = trimmed.replace(/^[-*]\s+/, '')
        processedLines.push(`<li>${listContent}</li>`)
      } else {
        // Close list if we were in one
        if (inList) {
          processedLines.push('</ul>')
          inList = false
        }
        
        // Handle different line types
        if (trimmed === '') {
          // Empty line - add break only if previous line wasn't empty
          const prevLine = processedLines[processedLines.length - 1]
          if (prevLine && !prevLine.includes('<br>') && !prevLine.includes('</ul>')) {
            processedLines.push('<br>')
          }
        } else if (trimmed.startsWith('<')) {
          // Already HTML - keep as is
          processedLines.push(line)
        } else if (trimmed.match(/^\*\*.*\*\*$/) && !trimmed.includes(' ')) {
          // Section headers (lines that are just **Header**)
          processedLines.push(line) // Let the bold processing handle it
        } else {
          // Regular content lines - only wrap in <p> if it looks like a standalone paragraph
          const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : ''
          const prevLine = i > 0 ? lines[i - 1].trim() : ''
          
          // Check if this should be a paragraph (not part of a list context)
          if (!trimmed.match(/^[-*]\s+/) && !prevLine.match(/^[-*]\s+/) && !nextLine.match(/^[-*]\s+/)) {
            processedLines.push(`<p>${line}</p>`)
          } else {
            processedLines.push(line)
          }
        }
      }
    }

    // Close any open list
    if (inList) {
      processedLines.push('</ul>')
    }

    processed = processedLines.join('\n')

    // Clean up formatting
    processed = processed.replace(/<br>\s*<br>/g, '<br>')
    processed = processed.replace(/<p>\s*<\/p>/g, '')
    processed = processed.replace(/\n\s*\n/g, '\n')

    return processed
  }, [content, processingOptions])

  // KaTeX rendering for mathematical expressions
  useEffect(() => {
    if (!contentRef.current) return

    const renderMathWithKaTeX = () => {
      const container = contentRef.current
      if (!container) return

      try {
        // Configure KaTeX options
        const katexOptions = {
          throwOnError: false,
          errorColor: '#dc3545',
          strict: false,
          trust: false,
          macros: {
            "\\RR": "\\mathbb{R}",
            "\\ZZ": "\\mathbb{Z}",
            "\\NN": "\\mathbb{N}",
            "\\QQ": "\\mathbb{Q}",
            "\\CC": "\\mathbb{C}",
            "\\frac": "\\frac{#1}{#2}",
            "\\ce": "\\text{#1}"
          }
        }

        // Find and render inline math expressions [math]...[/math]
        const inlineMathRegex = /\[math\](.*?)\[\/math\]/g
        let inlineMatch
        const inlineMatches: Array<{match: string, latex: string, index: number}> = []
        
        while ((inlineMatch = inlineMathRegex.exec(container.innerHTML)) !== null) {
          inlineMatches.push({
            match: inlineMatch[0],
            latex: inlineMatch[1],
            index: inlineMatch.index
          })
        }

        // Process matches in reverse order to maintain correct indices
        inlineMatches.reverse().forEach(({match, latex}) => {
          try {
            const katexHTML = katex.renderToString(latex, {
              ...katexOptions,
              displayMode: false
            })
            container.innerHTML = container.innerHTML.replace(match, katexHTML)
          } catch (error) {
            console.warn('KaTeX inline rendering error:', error)
            // Keep original text on error
            container.innerHTML = container.innerHTML.replace(match, `<span class="math-error">${latex}</span>`)
          }
        })

        // Find and render display math expressions [display]...[/display]
        const displayMathRegex = /\[display\](.*?)\[\/display\]/g
        let displayMatch
        const displayMatches: Array<{match: string, latex: string, index: number}> = []
        
        while ((displayMatch = displayMathRegex.exec(container.innerHTML)) !== null) {
          displayMatches.push({
            match: displayMatch[0],
            latex: displayMatch[1],
            index: displayMatch.index
          })
        }

        // Process display matches in reverse order
        displayMatches.reverse().forEach(({match, latex}) => {
          try {
            const katexHTML = katex.renderToString(latex, {
              ...katexOptions,
              displayMode: true
            })
            container.innerHTML = container.innerHTML.replace(match, `<div class="katex-display">${katexHTML}</div>`)
          } catch (error) {
            console.warn('KaTeX display rendering error:', error)
            // Keep original text on error
            container.innerHTML = container.innerHTML.replace(match, `<div class="math-error">${latex}</div>`)
          }
        })

        console.log('✅ KaTeX rendered successfully')
      } catch (error) {
        console.error('❌ KaTeX rendering error:', error)
      }
    }

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(renderMathWithKaTeX, 50)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [processedContent])

  // Generate container classes
  const containerClasses = [
    'premium-math-content',
    'lesson-plan-content',
    className,
    forPrint ? 'print-mode' : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      <div 
        ref={contentRef}
        className="math-content-container"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
      
      <style jsx>{`
        .premium-math-content {
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', 'Futura', 'Avenir', sans-serif;
          line-height: 1.6;
          color: #374151;
          max-width: none;
        }

        .premium-math-content .math-content-container {
          position: relative;
        }

        /* Lesson Plan Structure */
        .premium-math-content h1,
        .premium-math-content h2,
        .premium-math-content h3 {
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #111827;
          page-break-after: avoid;
        }

        .premium-math-content h1 {
          font-size: 1.5rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
          color: #1f2937;
        }

        .premium-math-content h2 {
          font-size: 1.25rem;
          color: #1f2937;
          margin-top: 2rem;
        }

        .premium-math-content h3 {
          font-size: 1.125rem;
          color: #374151;
          margin-top: 1.5rem;
        }

        .premium-math-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        .premium-math-content strong {
          font-weight: 600;
          color: #111827;
        }

        /* List Styling */
        .premium-math-content :global(.lesson-list),
        .premium-math-content ul,
        .premium-math-content ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }

        .premium-math-content :global(.lesson-list) li,
        .premium-math-content li {
          margin-bottom: 0.25rem;
          line-height: 1.5;
        }

        /* Activity Name Header */
        .premium-math-content :global(.activity-name-header) {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border-left: 4px solid #3b82f6;
          margin: 1.5rem 0;
          font-weight: 600;
          font-size: 1.2rem;
          color: #1d4ed8;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
          page-break-inside: avoid;
        }

        /* KaTeX Integration Styles */
        .premium-math-content :global(.katex) {
          font-size: inherit !important;
          color: inherit !important;
        }

        .premium-math-content :global(.katex-display) {
          margin: 1.2em 0;
          text-align: center;
        }

        .premium-math-content :global(.katex-display .katex) {
          font-size: 1.15em;
        }

        .premium-math-content :global(.katex:not(.katex-display .katex)) {
          font-size: 1.1em;
          margin: 0.2em 0.3em;
          vertical-align: -0.25em;
        }

        /* Math Error Styles */
        .premium-math-content :global(.math-error) {
          background-color: #fee;
          color: #c53030;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.9em;
        }

        /* Time Indicators */
        .premium-math-content :global(p:contains("minutes")) {
          font-weight: 500;
          color: #6b7280;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .premium-math-content {
            font-size: 0.95rem;
          }

          .premium-math-content h1 {
            font-size: 1.35rem;
          }

          .premium-math-content h2 {
            font-size: 1.15rem;
          }

          .premium-math-content h3 {
            font-size: 1.05rem;
          }

          .premium-math-content :global(.katex) {
            font-size: 1em !important;
          }

          .premium-math-content :global(.katex-display .katex) {
            font-size: 1.1em !important;
          }

          .premium-math-content :global(.activity-name-header) {
            font-size: 1.1rem;
            padding: 0.6rem 0.8rem;
          }
        }

        /* Print Styles */
        @media print {
          .premium-math-content {
            font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', 'Times New Roman', serif;
            color: #000 !important;
            background: #fff !important;
            font-size: 12pt;
            line-height: 1.6;
          }

          .premium-math-content h1,
          .premium-math-content h2,
          .premium-math-content h3 {
            color: #000 !important;
            page-break-after: avoid;
          }

          .premium-math-content h1 {
            border-bottom: 2px solid #000 !important;
          }

          .premium-math-content :global(.katex) {
            color: #000 !important;
            font-size: 1.1em !important;
          }

          .premium-math-content :global(.katex-display) {
            margin: 1.2em 0 !important;
            page-break-inside: avoid;
          }

          .premium-math-content :global(.katex-display .katex) {
            font-size: 1.2em !important;
          }

          .premium-math-content :global(.activity-name-header) {
            background: #f5f5f5 !important;
            border: 2px solid #000 !important;
            color: #000 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            page-break-after: avoid;
          }

          .premium-math-content strong {
            color: #000 !important;
            font-weight: 700 !important;
          }

          .premium-math-content p {
            margin-bottom: 0.5em !important;
          }

          .premium-math-content :global(.lesson-list),
          .premium-math-content ul,
          .premium-math-content ol {
            margin: 0.5em 0 !important;
          }
        }

        .premium-math-content.print-mode {
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', 'Times New Roman', serif;
          color: #000;
          background: #fff;
          line-height: 1.7;
        }

        .premium-math-content.print-mode :global(.katex) {
          font-size: 1.1em !important;
        }

        .premium-math-content.print-mode :global(.katex-display .katex) {
          font-size: 1.2em !important;
          margin: 1.5em 0;
        }

        /* High-contrast mode support */
        @media (prefers-contrast: high) {
          .premium-math-content {
            color: #000;
          }

          .premium-math-content h1,
          .premium-math-content h2,
          .premium-math-content h3 {
            color: #000;
          }

          .premium-math-content :global(.katex) {
            color: #000 !important;
          }

          .premium-math-content :global(.activity-name-header) {
            background: #fff;
            border: 3px solid #000;
            color: #000;
          }

          .premium-math-content strong {
            color: #000;
          }
        }
      `}</style>
    </div>
  )
}

export default PremiumMathContent