'use client'

import React from 'react'
import { LessonContentParser } from '../../utils/lessonContentParser'

interface SafeMathContentProps {
  /** Content that may contain mathematical expressions */
  content: string
  /** Custom className for the container */
  className?: string
  /** Whether to use enhanced lesson parsing */
  enhanced?: boolean
  /** Whether this content is for PDF export */
  forPrint?: boolean
  /** Whether to show solutions and worked examples */
  showSolutions?: boolean
  /** Whether to use board display mode (large text for classroom) */
  boardDisplayMode?: boolean
  /** Whether to use math-specific export formatting */
  mathExportMode?: boolean
}

/**
 * Enhanced SafeMathContent that seamlessly integrates mathematical rendering
 * into existing lesson plan display system
 */
const SafeMathContent: React.FC<SafeMathContentProps> = ({ 
  content, 
  className = '', 
  enhanced = true,
  forPrint = false,
  showSolutions = true,
  boardDisplayMode = false,
  mathExportMode = false
}) => {
  const processedContent = React.useMemo(() => {
    if (!content) return 'No content available'
    
    let processed = content
    
    // Handle solutions visibility
    if (!showSolutions) {
      // Hide content that appears to be solutions or worked examples
      processed = processed.replace(/\*\*Solution[:\s]*.*?\*\*/gi, '**Solution:** _[Hidden - Click "Show Solutions" to reveal]_')
      processed = processed.replace(/\*\*Answer[:\s]*.*?\*\*/gi, '**Answer:** _[Hidden - Click "Show Solutions" to reveal]_')
      processed = processed.replace(/\*\*Step \d+[:\s]*.*?\n/gi, '**Step:** _[Hidden]_\n')
      
      // Hide math expressions that appear to be solutions (contain equals with numbers/simple expressions)
      processed = processed.replace(/\[math\]([^[\]]*=\s*[\d\w\+\-\*/\(\)\s\.]+)\[\/math\]/g, 
        '[math]\\text{Solution Hidden}[/math]')
    }
    
    if (enhanced) {
      // Use enhanced lesson content parsing
      processed = LessonContentParser.quickMathRender(processed)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
        .replace(/ACTIVITY NAME: (.*?)(?=\n|$)/gi, '<div class="activity-name-header">🎯 ACTIVITY: $1</div>')
        .replace(/Activity Name: (.*?)(?=\n|$)/gi, '<div class="activity-name-header">🎯 ACTIVITY: $1</div>')
        .replace(/^\*\*([^*]+ACTIVITY[^*]*)\*\*$/gm, '<div class="activity-name-header">🎯 $1</div>')
    } else {
      // Fallback to simple processing for backward compatibility
      // Replace [math]...[/math] tags with styled span elements
      processed = processed.replace(/\[math\](.*?)\[\/math\]/g, (match, mathContent) => {
        const rendered = LessonContentParser.renderMathExpression(mathContent.trim())
        const boardClass = boardDisplayMode ? ' board-display' : ''
        const mathClass = mathExportMode ? ' math-export' : ''
        return `<span class="math-expression${boardClass}${mathClass}">${rendered}</span>`
      })
      
      // Convert markdown bold to HTML
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Process activity names
      processed = processed
        .replace(/ACTIVITY NAME: (.*?)(?=\n|$)/gi, '<div class="activity-name-header">🎯 ACTIVITY: $1</div>')
        .replace(/Activity Name: (.*?)(?=\n|$)/gi, '<div class="activity-name-header">🎯 ACTIVITY: $1</div>')
        .replace(/^\*\*([^*]+ACTIVITY[^*]*)\*\*$/gm, '<div class="activity-name-header">🎯 $1</div>')
    }
    
    return processed
  }, [content, enhanced, showSolutions, boardDisplayMode, mathExportMode])

  // Generate print-friendly styles for PDF export
  const printStyles = forPrint ? {
    '.safe-math-content .math-expression': {
      backgroundColor: 'transparent',
      border: '1px solid #000',
      color: '#000',
      fontWeight: 'bold'
    },
    '.safe-math-content .activity-name-header': {
      backgroundColor: '#f5f5f5',
      border: '2px solid #000',
      color: '#000'
    }
  } : {}

  return (
    <div className={`safe-math-content ${className}`}>
      <div 
        className="whitespace-pre-wrap leading-relaxed"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
      <style jsx>{`
        /* Enhanced mathematical expression styling */
        .safe-math-content .math-expression {
          font-family: 'Times New Roman', 'Liberation Serif', 'DejaVu Serif', Georgia, serif;
          font-style: italic;
          font-weight: 500;
          background: rgba(59, 130, 246, 0.08);
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid rgba(59, 130, 246, 0.15);
          margin: 0 3px;
          display: inline-block;
          line-height: 1.4;
          min-height: 1.2em;
          vertical-align: baseline;
          position: relative;
        }

        /* Enhanced fraction styling */
        .safe-math-content .math-fraction {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          vertical-align: middle;
          margin: 0 2px;
        }

        .safe-math-content .math-fraction .numerator {
          font-size: 0.85em;
          border-bottom: 1px solid currentColor;
          padding-bottom: 1px;
          margin-bottom: 1px;
        }

        .safe-math-content .math-fraction .denominator {
          font-size: 0.85em;
          padding-top: 1px;
        }

        .safe-math-content .math-fraction .fraction-bar {
          width: 100%;
          height: 1px;
          background: currentColor;
          margin: 1px 0;
        }

        /* Square root styling */
        .safe-math-content .math-sqrt {
          position: relative;
          display: inline-block;
          margin: 0 2px;
        }

        .safe-math-content .math-sqrt .sqrt-content {
          border-top: 1px solid currentColor;
          padding-left: 2px;
          margin-left: 2px;
        }

        /* Activity name styling */
        .safe-math-content .activity-name-header {
          font-weight: bold;
          font-size: 1.15rem;
          color: #1d4ed8;
          border-left: 4px solid #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 10px 14px;
          margin: 18px 0;
          border-radius: 0 8px 8px 0;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
          page-break-inside: avoid;
        }

        /* Superscript and subscript styling */
        .safe-math-content sup {
          font-size: 0.7em;
          vertical-align: super;
          line-height: 0;
          margin-left: 1px;
        }
        
        .safe-math-content sub {
          font-size: 0.7em;
          vertical-align: sub;
          line-height: 0;
          margin-left: 1px;
        }

        /* Lesson structure styling */
        .safe-math-content .lesson-heading {
          font-weight: bold;
          font-size: 1.1em;
          color: #374151;
          margin: 16px 0 8px 0;
          page-break-after: avoid;
        }

        .safe-math-content .lesson-list-item {
          margin: 4px 0;
          padding-left: 16px;
          position: relative;
        }

        .safe-math-content .lesson-list-item:before {
          content: '•';
          position: absolute;
          left: 0;
          color: #6b7280;
        }

        /* Print-specific styles */
        @media print {
          .safe-math-content .math-expression {
            background: transparent !important;
            border: 1px solid #333 !important;
            color: #000 !important;
            font-weight: 600 !important;
          }
          
          .safe-math-content .activity-name-header {
            background: #f9f9f9 !important;
            border: 2px solid #000 !important;
            color: #000 !important;
            box-shadow: none !important;
          }
        }

        /* Spacing improvements for better readability */
        .safe-math-content p {
          margin: 8px 0;
          line-height: 1.6;
        }

        .safe-math-content strong {
          font-weight: 600;
          color: #1f2937;
        }

        /* Ensure proper spacing around math expressions */
        .safe-math-content .math-expression + .math-expression {
          margin-left: 6px;
        }

        /* Better handling of inline vs block math */
        .safe-math-content .math-expression.block {
          display: block;
          text-align: center;
          margin: 12px auto;
          padding: 8px 12px;
          max-width: fit-content;
        }

        /* Board Display Mode - Large text for classroom display */
        .safe-math-content .math-expression.board-display {
          font-size: 2.5em !important;
          padding: 12px 20px !important;
          margin: 20px 6px !important;
          border: 3px solid rgba(59, 130, 246, 0.3) !important;
          border-radius: 12px !important;
          background: rgba(59, 130, 246, 0.05) !important;
          display: inline-block;
          line-height: 1.2;
          min-height: 1.5em;
        }

        .safe-math-content .math-expression.board-display sup {
          font-size: 0.6em !important;
          margin-left: 2px;
        }

        .safe-math-content .math-expression.board-display sub {
          font-size: 0.6em !important;
          margin-left: 2px;
        }

        /* Math Export Mode - Optimized for mathematical documents */
        .safe-math-content .math-expression.math-export {
          font-family: 'Computer Modern', 'Latin Modern Math', 'Times New Roman', serif !important;
          font-size: 1.2em !important;
          background: rgba(0, 0, 0, 0.02) !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          padding: 6px 10px !important;
          margin: 0 4px !important;
          border-radius: 4px !important;
        }

        /* Board Display Mode - Entire content styling */
        ${boardDisplayMode ? `
          .safe-math-content {
            font-size: 1.4em !important;
            line-height: 1.8 !important;
            background: #f8fafc !important;
            border: 2px solid #e2e8f0 !important;
            border-radius: 12px !important;
            padding: 24px !important;
          }
          
          .safe-math-content strong {
            font-size: 1.2em !important;
            color: #1e40af !important;
          }
          
          .safe-math-content .activity-name-header {
            font-size: 1.5em !important;
            padding: 16px 20px !important;
            margin: 24px 0 !important;
          }
        ` : ''}

        /* Math Export Mode - Overall document styling */
        ${mathExportMode ? `
          .safe-math-content {
            font-family: 'Computer Modern', 'Latin Modern Math', 'Times New Roman', serif !important;
            line-height: 1.7 !important;
            background: #fefefe !important;
            color: #1a1a1a !important;
          }
          
          .safe-math-content strong {
            font-weight: 600 !important;
          }
          
          .safe-math-content p {
            margin: 12px 0 !important;
          }
        ` : ''}
      `}</style>
    </div>
  )
}

export default SafeMathContent