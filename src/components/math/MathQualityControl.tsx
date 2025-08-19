'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { CheckCircle, AlertTriangle, Info, Eye, FileText, Download } from 'lucide-react'

interface MathValidation {
  isValid: boolean
  score: number
  issues: Array<{
    type: 'error' | 'warning' | 'suggestion'
    message: string
    location?: string
    fix?: string
  }>
  metrics: {
    totalExpressions: number
    displayExpressions: number
    inlineExpressions: number
    complexityScore: number
    readabilityScore: number
    consistencyScore: number
  }
}

interface MathQualityControlProps {
  /** Content to analyze */
  content: string
  /** Whether quality control is enabled */
  enabled?: boolean
  /** Callback when issues are found */
  onIssuesFound?: (issues: MathValidation['issues']) => void
  /** Show detailed metrics */
  showMetrics?: boolean
}

/**
 * Mathematical Quality Control Component
 * Ensures professional-grade mathematical typography and consistency
 */
const MathQualityControl: React.FC<MathQualityControlProps> = ({
  content,
  enabled = true,
  onIssuesFound,
  showMetrics = true
}) => {
  const [validation, setValidation] = useState<MathValidation | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Quality analysis of mathematical content
  const qualityAnalysis = useMemo(() => {
    if (!enabled || !content) {
      return {
        isValid: true,
        score: 100,
        issues: [],
        metrics: {
          totalExpressions: 0,
          displayExpressions: 0,
          inlineExpressions: 0,
          complexityScore: 0,
          readabilityScore: 100,
          consistencyScore: 100
        }
      }
    }

    const analysis = analyzeMathematicalContent(content)
    return analysis
  }, [content, enabled])

  // Update validation when analysis changes
  useEffect(() => {
    setValidation(qualityAnalysis)
    onIssuesFound?.(qualityAnalysis.issues)
  }, [qualityAnalysis, onIssuesFound])

  // Generate quality report
  const generateQualityReport = () => {
    if (!validation) return

    const report = `
Mathematical Content Quality Report
Generated: ${new Date().toLocaleDateString()}

OVERALL SCORE: ${validation.score}/100
${getQualityGrade(validation.score)}

METRICS:
- Total Mathematical Expressions: ${validation.metrics.totalExpressions}
- Display Mode Expressions: ${validation.metrics.displayExpressions}
- Inline Expressions: ${validation.metrics.inlineExpressions}
- Complexity Score: ${validation.metrics.complexityScore}/100
- Readability Score: ${validation.metrics.readabilityScore}/100
- Consistency Score: ${validation.metrics.consistencyScore}/100

ISSUES FOUND: ${validation.issues.length}
${validation.issues.map((issue, i) => 
  `${i + 1}. [${issue.type.toUpperCase()}] ${issue.message}${issue.fix ? `\n   Suggested Fix: ${issue.fix}` : ''}`
).join('\n')}

RECOMMENDATIONS:
${generateRecommendations(validation)}
    `.trim()

    // Copy to clipboard
    navigator.clipboard.writeText(report).then(() => {
      console.log('📋 Quality report copied to clipboard')
    })
  }

  if (!enabled || !validation || validation.metrics.totalExpressions === 0) {
    return null
  }

  return (
    <div className="math-quality-control">
      {/* Quality Score Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              validation.score >= 90 ? 'bg-green-100 text-green-600' :
              validation.score >= 80 ? 'bg-yellow-100 text-yellow-600' :
              validation.score >= 70 ? 'bg-orange-100 text-orange-600' :
              'bg-red-100 text-red-600'
            }`}>
              {validation.score >= 90 ? <CheckCircle className="w-6 h-6" /> :
               validation.score >= 70 ? <Info className="w-6 h-6" /> :
               <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Mathematical Quality Score</h3>
              <div className="flex items-center space-x-4">
                <span className={`text-2xl font-bold ${
                  validation.score >= 90 ? 'text-green-600' :
                  validation.score >= 80 ? 'text-yellow-600' :
                  validation.score >= 70 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {validation.score}/100
                </span>
                <span className="text-sm text-gray-600">
                  {getQualityGrade(validation.score)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
            </button>
            <button
              onClick={generateQualityReport}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Quality Metrics */}
        {showMetrics && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{validation.metrics.totalExpressions}</div>
              <div className="text-sm text-gray-600">Total Expressions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{validation.metrics.complexityScore}</div>
              <div className="text-sm text-gray-600">Complexity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{validation.metrics.readabilityScore}</div>
              <div className="text-sm text-gray-600">Readability</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{validation.metrics.consistencyScore}</div>
              <div className="text-sm text-gray-600">Consistency</div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Analysis */}
      {showDetails && (
        <div className="space-y-4">
          {/* Issues */}
          {validation.issues.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                Issues Found ({validation.issues.length})
              </h4>
              <div className="space-y-3">
                {validation.issues.map((issue, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    issue.type === 'error' ? 'bg-red-50 border-red-400' :
                    issue.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`font-medium ${
                          issue.type === 'error' ? 'text-red-800' :
                          issue.type === 'warning' ? 'text-yellow-800' :
                          'text-blue-800'
                        }`}>
                          {issue.message}
                        </p>
                        {issue.location && (
                          <p className="text-sm text-gray-600 mt-1">Location: {issue.location}</p>
                        )}
                        {issue.fix && (
                          <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded border">
                            <strong>Suggested Fix:</strong> {issue.fix}
                          </p>
                        )}
                      </div>
                      <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                        issue.type === 'error' ? 'bg-red-100 text-red-800' :
                        issue.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {issue.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Metrics */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 text-blue-500 mr-2" />
              Detailed Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Expression Types</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Display Mode:</span>
                    <span className="font-medium">{validation.metrics.displayExpressions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inline Mode:</span>
                    <span className="font-medium">{validation.metrics.inlineExpressions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{validation.metrics.totalExpressions}</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Quality Scores</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Complexity:</span>
                    <span className={`font-medium ${getScoreColor(validation.metrics.complexityScore)}`}>
                      {validation.metrics.complexityScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Readability:</span>
                    <span className={`font-medium ${getScoreColor(validation.metrics.readabilityScore)}`}>
                      {validation.metrics.readabilityScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consistency:</span>
                    <span className={`font-medium ${getScoreColor(validation.metrics.consistencyScore)}`}>
                      {validation.metrics.consistencyScore}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
function analyzeMathematicalContent(content: string): MathValidation {
  const issues: MathValidation['issues'] = []
  
  // Extract mathematical expressions
  const mathExpressions = content.match(/\[math\](.*?)\[\/math\]/g) || []
  const displayExpressions = content.match(/\[display\](.*?)\[\/display\]/g) || []
  
  const totalExpressions = mathExpressions.length + displayExpressions.length
  
  // Analyze each expression
  let complexitySum = 0
  let readabilitySum = 0
  let consistencyIssues = 0

  // Check for common issues
  mathExpressions.forEach((expr, index) => {
    const mathContent = expr.replace(/\[math\]|\[\/math\]/g, '')
    
    // Check for unmatched parentheses
    if (!areParenthesesMatched(mathContent)) {
      issues.push({
        type: 'error',
        message: 'Unmatched parentheses in mathematical expression',
        location: `Expression ${index + 1}`,
        fix: 'Check that all parentheses, brackets, and braces are properly matched'
      })
    }

    // Check for inconsistent notation
    if (hasInconsistentNotation(mathContent)) {
      issues.push({
        type: 'warning',
        message: 'Inconsistent mathematical notation detected',
        location: `Expression ${index + 1}`,
        fix: 'Use consistent notation for variables and operators throughout the lesson'
      })
      consistencyIssues++
    }

    // Analyze complexity
    const complexity = calculateComplexity(mathContent)
    complexitySum += complexity

    // Analyze readability
    const readability = calculateReadability(mathContent)
    readabilitySum += readability
  })

  // Check for missing LaTeX commands
  const commonMistakes = [
    { pattern: /\*\*/g, suggestion: 'Use ^ for exponents instead of **' },
    { pattern: /\/ *\(/g, suggestion: 'Use \\frac{}{} for fractions instead of /' },
    { pattern: /sqrt\(/g, suggestion: 'Use \\sqrt{} for square roots' }
  ]

  commonMistakes.forEach(mistake => {
    if (mistake.pattern.test(content)) {
      issues.push({
        type: 'suggestion',
        message: 'Consider using proper LaTeX formatting',
        fix: mistake.suggestion
      })
    }
  })

  // Calculate metrics
  const avgComplexity = totalExpressions > 0 ? complexitySum / totalExpressions : 0
  const avgReadability = totalExpressions > 0 ? readabilitySum / totalExpressions : 100
  const consistencyScore = Math.max(0, 100 - (consistencyIssues * 10))

  // Calculate overall score
  const errorWeight = issues.filter(i => i.type === 'error').length * 20
  const warningWeight = issues.filter(i => i.type === 'warning').length * 10
  const suggestionWeight = issues.filter(i => i.type === 'suggestion').length * 5
  
  const score = Math.max(0, 100 - errorWeight - warningWeight - suggestionWeight)

  return {
    isValid: issues.filter(i => i.type === 'error').length === 0,
    score,
    issues,
    metrics: {
      totalExpressions,
      displayExpressions: displayExpressions.length,
      inlineExpressions: mathExpressions.length,
      complexityScore: Math.round(avgComplexity),
      readabilityScore: Math.round(avgReadability),
      consistencyScore
    }
  }
}

function areParenthesesMatched(expression: string): boolean {
  const stack: string[] = []
  const pairs: Record<string, string> = { '(': ')', '{': '}', '[': ']' }
  
  for (const char of expression) {
    if (char in pairs) {
      stack.push(char)
    } else if (Object.values(pairs).includes(char)) {
      const last = stack.pop()
      if (!last || pairs[last] !== char) {
        return false
      }
    }
  }
  
  return stack.length === 0
}

function hasInconsistentNotation(expression: string): boolean {
  // Check for mixed notation styles
  const hasUnderscores = /_/.test(expression)
  const hasSubscriptCommands = /\\text/.test(expression)
  const hasMixedFractions = /\//.test(expression) && /\\frac/.test(expression)
  
  return (hasUnderscores && hasSubscriptCommands) || hasMixedFractions
}

function calculateComplexity(expression: string): number {
  let complexity = 0
  
  // Count complex structures
  const fractions = (expression.match(/\\frac/g) || []).length
  const roots = (expression.match(/\\sqrt/g) || []).length
  const integrals = (expression.match(/\\int/g) || []).length
  const sums = (expression.match(/\\sum/g) || []).length
  const limits = (expression.match(/\\lim/g) || []).length
  
  complexity += fractions * 10 + roots * 5 + integrals * 15 + sums * 15 + limits * 15
  
  // Normalize to 0-100 scale
  return Math.min(100, complexity)
}

function calculateReadability(expression: string): number {
  let readability = 100
  
  // Penalize for overly long expressions
  if (expression.length > 100) readability -= 10
  if (expression.length > 200) readability -= 20
  
  // Penalize for too many nested structures
  const nestingLevel = Math.max(
    (expression.match(/\{/g) || []).length,
    (expression.match(/\(/g) || []).length
  )
  if (nestingLevel > 5) readability -= (nestingLevel - 5) * 5
  
  return Math.max(0, readability)
}

function getQualityGrade(score: number): string {
  if (score >= 95) return 'Excellent - Textbook Quality'
  if (score >= 90) return 'Very Good - Professional Quality'
  if (score >= 80) return 'Good - Minor Issues'
  if (score >= 70) return 'Fair - Several Issues'
  if (score >= 60) return 'Poor - Many Issues'
  return 'Needs Improvement - Major Issues'
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-yellow-600'
  if (score >= 70) return 'text-orange-600'
  return 'text-red-600'
}

function generateRecommendations(validation: MathValidation): string {
  const recommendations: string[] = []
  
  if (validation.metrics.consistencyScore < 80) {
    recommendations.push('• Use consistent notation throughout your lesson')
  }
  
  if (validation.metrics.readabilityScore < 80) {
    recommendations.push('• Break down complex expressions into smaller steps')
  }
  
  if (validation.metrics.complexityScore > 80) {
    recommendations.push('• Consider providing more context for complex mathematical concepts')
  }
  
  if (validation.issues.filter(i => i.type === 'error').length > 0) {
    recommendations.push('• Fix all mathematical syntax errors before publishing')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('• Excellent mathematical content! No major recommendations.')
  }
  
  return recommendations.join('\n')
}

export default MathQualityControl