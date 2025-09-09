'use client'

import React from 'react'
import MathRenderer from './MathRenderer'
import { parseMathContent, convertToLaTeX } from '../../utils/mathUtils'

interface MathContentProps {
  /** Content that may contain mathematical expressions */
  content: string
  /** Custom className for the container */
  className?: string
}

/**
 * Component that parses text content and renders embedded mathematical expressions
 * Supports both [math]...[/math] tags and inline $...$ LaTeX notation
 */
const MathContent: React.FC<MathContentProps> = ({ content, className = '' }) => {
  const contentKey = React.useMemo(() => 
    content ? content.substring(0, 100) + content.length : 'empty'
  , [content])

  const renderContent = React.useCallback((text: string) => {
    // Split content by math expressions (both [math] tags and $ notation)
    const parts: React.ReactNode[] = []
    let currentIndex = 0

    // Handle [math] tags first
    const mathTagRegex = /\[math\](.*?)\[\/math\]/g
    let mathTagMatch: RegExpExecArray | null

    // Store positions of [math] tags
    const mathTags: { start: number; end: number; expression: string }[] = []
    
    while ((mathTagMatch = mathTagRegex.exec(text)) !== null) {
      mathTags.push({
        start: mathTagMatch.index,
        end: mathTagMatch.index + mathTagMatch[0].length,
        expression: mathTagMatch[1].trim()
      })
    }

    // Handle inline $ notation
    const inlineMathRegex = /\$([^$]+)\$/g
    const inlineMaths: { start: number; end: number; expression: string }[] = []
    let inlineMathMatch: RegExpExecArray | null
    
    while ((inlineMathMatch = inlineMathRegex.exec(text)) !== null) {
      // Check if this $ notation is inside a [math] tag
      const insideMathTag = mathTags.some(tag => 
        inlineMathMatch!.index >= tag.start && inlineMathMatch!.index + inlineMathMatch![0].length <= tag.end
      )
      
      if (!insideMathTag) {
        inlineMaths.push({
          start: inlineMathMatch.index,
          end: inlineMathMatch.index + inlineMathMatch[0].length,
          expression: inlineMathMatch[1].trim()
        })
      }
    }

    // Handle $$ display math notation
    const displayMathRegex = /\$\$([^$]+)\$\$/g
    const displayMaths: { start: number; end: number; expression: string }[] = []
    let displayMathMatch: RegExpExecArray | null
    
    while ((displayMathMatch = displayMathRegex.exec(text)) !== null) {
      displayMaths.push({
        start: displayMathMatch.index,
        end: displayMathMatch.index + displayMathMatch[0].length,
        expression: displayMathMatch[1].trim()
      })
    }

    // Combine all math expressions and sort by position
    const allMaths = [
      ...mathTags.map(m => ({ ...m, type: 'block' as const })),
      ...inlineMaths.map(m => ({ ...m, type: 'inline' as const })),
      ...displayMaths.map(m => ({ ...m, type: 'display' as const }))
    ].sort((a, b) => a.start - b.start)

    // Build the final content with math rendered
    allMaths.forEach((math, index) => {
      // Add text before this math expression
      if (currentIndex < math.start) {
        const textPart = text.slice(currentIndex, math.start)
        if (textPart) {
          parts.push(
            <span key={`text-${index}`} dangerouslySetInnerHTML={{ __html: textPart }} />
          )
        }
      }

      // Add the math expression
      if (math.type === 'block' || math.type === 'display') {
        // Convert to LaTeX if it's from [math] tags
        const latex = math.type === 'block' ? convertToLaTeX(math.expression) : math.expression
        parts.push(
          <MathRenderer
            key={`math-${index}`}
            latex={latex}
            display={true}
            bordered={true}
            className="my-4"
          />
        )
      } else {
        // Inline math
        parts.push(
          <MathRenderer
            key={`math-${index}`}
            latex={math.expression}
            display={false}
            className="mx-1"
          />
        )
      }

      currentIndex = math.end
    })

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex)
      if (remainingText) {
        parts.push(
          <span key="text-final" dangerouslySetInnerHTML={{ __html: remainingText }} />
        )
      }
    }

    // If no math expressions found, return the original content
    if (parts.length === 0) {
      return <span dangerouslySetInnerHTML={{ __html: text }} />
    }

    return <>{parts}</>
  }, [])

  return (
    <div className={`math-content ${className}`} key={contentKey}>
      {renderContent(content)}
    </div>
  )
}

export default MathContent

/**
 * Hook for integrating mathematical expressions into lesson content
 */
export function useMathInContent(content: string) {
  const hasMath = React.useMemo(() => {
    return /\[math\].*?\[\/math\]|\$.*?\$|\$\$.*?\$\$/.test(content)
  }, [content])

  const processedContent = React.useMemo(() => {
    if (!hasMath) return content
    return parseMathContent(content)
  }, [content, hasMath])

  return { hasMath, processedContent }
}

/**
 * Utility component for rendering math-enabled lesson sections
 */
export const MathEnabledSection: React.FC<{
  title: string
  content: string
  className?: string
}> = ({ title, content, className = '' }) => (
  <div className={`math-section ${className}`}>
    <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
    <MathContent content={content} />
  </div>
)