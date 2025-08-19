'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Copy, Eye, EyeOff, Monitor, FileText, Calculator } from 'lucide-react'

interface MathExpression {
  id: string
  content: string
  latex: string
  isSolution?: boolean
  isExample?: boolean
  position: { start: number; end: number }
}

interface MathContentToolsProps {
  /** The lesson content to analyze */
  content: string
  /** Whether content analysis is enabled */
  enabled?: boolean
  /** Callback when math expressions are copied */
  onCopyExpression?: (latex: string) => void
  /** Callback when board display mode changes */
  onBoardDisplayChange?: (enabled: boolean) => void
  /** Callback when solutions visibility changes */
  onSolutionsToggle?: (visible: boolean) => void
}

/**
 * Advanced math content tools for math-heavy lessons
 * Provides detection, copying, and display options for mathematical expressions
 */
const MathContentTools: React.FC<MathContentToolsProps> = ({
  content,
  enabled = true,
  onCopyExpression,
  onBoardDisplayChange,
  onSolutionsToggle
}) => {
  const [showSolutions, setShowSolutions] = useState(true)
  const [boardDisplayMode, setBoardDisplayMode] = useState(false)
  const [showMathInfo, setShowMathInfo] = useState(false)

  // Analyze mathematical content
  const mathAnalysis = useMemo(() => {
    if (!enabled || !content) return { expressions: [], hasMath: false, stats: {} }

    const mathRegex = /\[math\](.*?)\[\/math\]/g
    const expressions: MathExpression[] = []
    let match
    let expressionId = 0

    while ((match = mathRegex.exec(content)) !== null) {
      const mathContent = match[1].trim()
      const isSolution = /=\s*[\d\w]|steps?|solution|answer/i.test(content.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50))
      const isExample = /example|sample|demo/i.test(content.substring(Math.max(0, match.index - 30), match.index + match[0].length + 30))

      expressions.push({
        id: `math_${expressionId++}`,
        content: mathContent,
        latex: mathContent,
        isSolution,
        isExample,
        position: { start: match.index, end: match.index + match[0].length }
      })
    }

    const stats = {
      totalExpressions: expressions.length,
      solutions: expressions.filter(e => e.isSolution).length,
      examples: expressions.filter(e => e.isExample).length,
      complexity: expressions.length > 10 ? 'high' : expressions.length > 3 ? 'medium' : 'low'
    }

    return {
      expressions,
      hasMath: expressions.length > 0,
      stats
    }
  }, [content, enabled])

  // Copy individual expression
  const copyExpression = useCallback((expression: MathExpression) => {
    const latexCode = `[math]${expression.latex}[/math]`
    navigator.clipboard.writeText(latexCode).then(() => {
      onCopyExpression?.(latexCode)
      // Show temporary success feedback
      const button = document.getElementById(`copy-${expression.id}`)
      if (button) {
        const originalText = button.textContent
        button.textContent = '✓ Copied!'
        setTimeout(() => {
          if (button) button.textContent = originalText || ''
        }, 2000)
      }
    }).catch(err => {
      console.error('Failed to copy expression:', err)
    })
  }, [onCopyExpression])

  // Copy all expressions
  const copyAllExpressions = useCallback(() => {
    const allLatex = mathAnalysis.expressions
      .map(expr => `[math]${expr.latex}[/math]`)
      .join('\n')
    
    navigator.clipboard.writeText(allLatex).then(() => {
      onCopyExpression?.('All expressions copied')
    }).catch(err => {
      console.error('Failed to copy all expressions:', err)
    })
  }, [mathAnalysis.expressions, onCopyExpression])

  // Toggle solutions visibility
  const toggleSolutions = useCallback(() => {
    const newState = !showSolutions
    setShowSolutions(newState)
    onSolutionsToggle?.(newState)
  }, [showSolutions, onSolutionsToggle])

  // Toggle board display mode
  const toggleBoardDisplay = useCallback(() => {
    const newState = !boardDisplayMode
    setBoardDisplayMode(newState)
    onBoardDisplayChange?.(newState)
  }, [boardDisplayMode, onBoardDisplayChange])

  if (!enabled || !mathAnalysis.hasMath) {
    return null
  }

  return (
    <div className="math-content-tools">
      {/* Mathematical Content Indicator */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Mathematical Content Detected</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-blue-600">
              <span>{mathAnalysis.stats.totalExpressions} expressions</span>
              {mathAnalysis.stats.solutions > 0 && (
                <span>{mathAnalysis.stats.solutions} solutions</span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                mathAnalysis.stats.complexity === 'high' ? 'bg-red-100 text-red-800' :
                mathAnalysis.stats.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {mathAnalysis.stats.complexity} complexity
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowMathInfo(!showMathInfo)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showMathInfo ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {/* Expanded Math Info */}
        {showMathInfo && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800">Expression Types:</h4>
                <ul className="space-y-1 text-blue-700">
                  {mathAnalysis.stats.examples > 0 && <li>• {mathAnalysis.stats.examples} worked examples</li>}
                  {mathAnalysis.stats.solutions > 0 && <li>• {mathAnalysis.stats.solutions} solution steps</li>}
                  <li>• {mathAnalysis.stats.totalExpressions - mathAnalysis.stats.solutions - mathAnalysis.stats.examples} general expressions</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800">Quick Actions:</h4>
                <button
                  onClick={copyAllExpressions}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy All LaTeX</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Math Control Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Solutions Toggle */}
        {mathAnalysis.stats.solutions > 0 && (
          <button
            onClick={toggleSolutions}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
              showSolutions
                ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {showSolutions ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="font-medium">
              {showSolutions ? 'Hide Solutions' : 'Show Solutions'}
            </span>
            <span className="bg-white px-2 py-1 rounded-full text-xs">
              {mathAnalysis.stats.solutions}
            </span>
          </button>
        )}

        {/* Board Display Mode */}
        <button
          onClick={toggleBoardDisplay}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
            boardDisplayMode
              ? 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span className="font-medium">
            {boardDisplayMode ? 'Exit Board Mode' : 'Board Display'}
          </span>
        </button>

        {/* Copy All Expressions */}
        <button
          onClick={copyAllExpressions}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all"
        >
          <Copy className="w-4 h-4" />
          <span className="font-medium">Copy LaTeX</span>
        </button>
      </div>

      {/* Individual Expression Tools */}
      {showMathInfo && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">Individual Expressions:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {mathAnalysis.expressions.map((expr, index) => (
              <div key={expr.id} className="flex items-center justify-between bg-white p-2 rounded border">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-mono text-gray-700 truncate block">
                    {expr.latex}
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    {expr.isSolution && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Solution
                      </span>
                    )}
                    {expr.isExample && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Example
                      </span>
                    )}
                  </div>
                </div>
                <button
                  id={`copy-${expr.id}`}
                  onClick={() => copyExpression(expr)}
                  className="ml-2 flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MathContentTools

// Export types for use in other components
export type { MathExpression, MathContentToolsProps }