'use client'

import React, { useState, useMemo } from 'react'
import { Copy, Search, BookOpen, Calculator, TrendingUp, Target, Zap } from 'lucide-react'
import ProfessionalMathProcessor from '../../utils/professionalMathProcessor'

interface MathExpression {
  name: string
  formula: string
  latex: string
  category: string
  description: string
  example?: string
  variables?: Record<string, string>
}

interface MathExpressionLibraryProps {
  /** Whether the library is visible */
  isOpen: boolean
  /** Callback when library is closed */
  onClose: () => void
  /** Callback when expression is inserted */
  onInsertExpression: (expression: string, type: 'inline' | 'display') => void
  /** Show categories filter */
  showCategories?: boolean
}

/**
 * Mathematical Expression Library
 * Provides teachers with common formulas and expressions to insert into lessons
 */
const MathExpressionLibrary: React.FC<MathExpressionLibraryProps> = ({
  isOpen,
  onClose,
  onInsertExpression,
  showCategories = true
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [previewExpression, setPreviewExpression] = useState<MathExpression | null>(null)

  // Mathematical expressions organized by category
  const expressions = useMemo((): MathExpression[] => [
    // Basic Algebra
    {
      name: 'Slope Formula',
      formula: '(y2-y1)/(x2-x1)',
      latex: '\\frac{y_2 - y_1}{x_2 - x_1}',
      category: 'algebra',
      description: 'Calculate the slope between two points',
      variables: { 'x₁, y₁': 'First point coordinates', 'x₂, y₂': 'Second point coordinates' },
      example: 'For points (1,2) and (3,6): slope = (6-2)/(3-1) = 2'
    },
    {
      name: 'Point-Slope Form',
      formula: 'y - y1 = m(x - x1)',
      latex: 'y - y_1 = m(x - x_1)',
      category: 'algebra',
      description: 'Linear equation using point and slope',
      variables: { 'm': 'slope', 'x₁, y₁': 'Known point coordinates' }
    },
    {
      name: 'Slope-Intercept Form',
      formula: 'y = mx + b',
      latex: 'y = mx + b',
      category: 'algebra',
      description: 'Linear equation with slope and y-intercept',
      variables: { 'm': 'slope', 'b': 'y-intercept' }
    },
    {
      name: 'Quadratic Formula',
      formula: 'x = (-b +/- sqrt(b^2 - 4ac)) / (2a)',
      latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
      category: 'algebra',
      description: 'Solve quadratic equations ax² + bx + c = 0',
      variables: { 'a, b, c': 'Coefficients of quadratic equation' },
      example: 'For x² - 5x + 6 = 0: a=1, b=-5, c=6'
    },
    {
      name: 'Distance Formula',
      formula: 'sqrt((x2-x1)^2 + (y2-y1)^2)',
      latex: 'd = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}',
      category: 'algebra',
      description: 'Distance between two points in coordinate plane',
      variables: { 'x₁, y₁': 'First point', 'x₂, y₂': 'Second point' }
    },
    {
      name: 'Midpoint Formula',
      formula: '((x1+x2)/2, (y1+y2)/2)',
      latex: 'M = \\left(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2}\\right)',
      category: 'algebra',
      description: 'Midpoint between two coordinate points',
      variables: { 'x₁, y₁': 'First point', 'x₂, y₂': 'Second point' }
    },

    // Calculus
    {
      name: 'Derivative Definition',
      formula: 'lim(h->0) [f(x+h) - f(x)] / h',
      latex: "\\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
      category: 'calculus',
      description: 'Formal definition of derivative',
      variables: { 'f(x)': 'Function', 'h': 'Small change in x' }
    },
    {
      name: 'Power Rule',
      formula: 'd/dx [x^n] = n*x^(n-1)',
      latex: '\\frac{d}{dx}[x^n] = nx^{n-1}',
      category: 'calculus',
      description: 'Derivative of power functions',
      variables: { 'n': 'Exponent (constant)' },
      example: 'd/dx [x³] = 3x²'
    },
    {
      name: 'Product Rule',
      formula: 'd/dx [f(x)*g(x)] = f\'(x)*g(x) + f(x)*g\'(x)',
      latex: "\\frac{d}{dx}[f(x)g(x)] = f'(x)g(x) + f(x)g'(x)",
      category: 'calculus',
      description: 'Derivative of product of two functions',
      variables: { 'f(x), g(x)': 'Functions to be multiplied' }
    },
    {
      name: 'Quotient Rule',
      formula: 'd/dx [f(x)/g(x)] = [f\'(x)*g(x) - f(x)*g\'(x)] / [g(x)]^2',
      latex: "\\frac{d}{dx}\\left[\\frac{f(x)}{g(x)}\\right] = \\frac{f'(x)g(x) - f(x)g'(x)}{[g(x)]^2}",
      category: 'calculus',
      description: 'Derivative of quotient of two functions',
      variables: { 'f(x)': 'Numerator function', 'g(x)': 'Denominator function' }
    },
    {
      name: 'Chain Rule',
      formula: 'd/dx [f(g(x))] = f\'(g(x)) * g\'(x)',
      latex: "\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)",
      category: 'calculus',
      description: 'Derivative of composite functions',
      variables: { 'f(x)': 'Outer function', 'g(x)': 'Inner function' }
    },

    // Trigonometry
    {
      name: 'Pythagorean Identity',
      formula: 'sin^2(theta) + cos^2(theta) = 1',
      latex: '\\sin^2\\theta + \\cos^2\\theta = 1',
      category: 'trigonometry',
      description: 'Fundamental trigonometric identity',
      variables: { 'θ': 'Angle in radians or degrees' }
    },
    {
      name: 'Sine Rule',
      formula: 'a/sin(A) = b/sin(B) = c/sin(C)',
      latex: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}',
      category: 'trigonometry',
      description: 'Relationship between sides and angles in triangles',
      variables: { 'a, b, c': 'Triangle sides', 'A, B, C': 'Opposite angles' }
    },
    {
      name: 'Cosine Rule',
      formula: 'c^2 = a^2 + b^2 - 2ab*cos(C)',
      latex: 'c^2 = a^2 + b^2 - 2ab\\cos C',
      category: 'trigonometry',
      description: 'Generalized Pythagorean theorem',
      variables: { 'a, b, c': 'Triangle sides', 'C': 'Angle opposite side c' }
    },

    // Statistics
    {
      name: 'Mean (Average)',
      formula: 'mean = (sum of all values) / (number of values)',
      latex: '\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i',
      category: 'statistics',
      description: 'Arithmetic average of a dataset',
      variables: { 'xᵢ': 'Individual data values', 'n': 'Number of data points' }
    },
    {
      name: 'Standard Deviation',
      formula: 'sigma = sqrt((1/n) * sum((xi - mu)^2))',
      latex: '\\sigma = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n}(x_i - \\mu)^2}',
      category: 'statistics',
      description: 'Measure of data spread around the mean',
      variables: { 'xᵢ': 'Data values', 'μ': 'Population mean', 'n': 'Number of values' }
    },

    // Geometry
    {
      name: 'Circle Area',
      formula: 'A = pi * r^2',
      latex: 'A = \\pi r^2',
      category: 'geometry',
      description: 'Area of a circle',
      variables: { 'r': 'Radius of circle' },
      example: 'For radius = 3: A = π(3)² = 9π ≈ 28.27'
    },
    {
      name: 'Circle Circumference',
      formula: 'C = 2 * pi * r',
      latex: 'C = 2\\pi r',
      category: 'geometry',
      description: 'Perimeter of a circle',
      variables: { 'r': 'Radius of circle' }
    },
    {
      name: 'Sphere Volume',
      formula: 'V = (4/3) * pi * r^3',
      latex: 'V = \\frac{4}{3}\\pi r^3',
      category: 'geometry',
      description: 'Volume of a sphere',
      variables: { 'r': 'Radius of sphere' }
    }
  ], [])

  // Categories for filtering
  const categories = useMemo(() => [
    { value: 'all', label: 'All Categories', icon: BookOpen },
    { value: 'algebra', label: 'Algebra', icon: Calculator },
    { value: 'calculus', label: 'Calculus', icon: TrendingUp },
    { value: 'trigonometry', label: 'Trigonometry', icon: Target },
    { value: 'statistics', label: 'Statistics', icon: Zap },
    { value: 'geometry', label: 'Geometry', icon: Target }
  ], [])

  // Filtered expressions
  const filteredExpressions = useMemo(() => {
    return expressions.filter(expr => {
      const matchesSearch = expr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expr.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || expr.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [expressions, searchTerm, selectedCategory])

  // Copy expression to clipboard
  const copyToClipboard = (expression: MathExpression, type: 'formula' | 'latex') => {
    const textToCopy = type === 'formula' ? expression.formula : expression.latex
    navigator.clipboard.writeText(textToCopy).then(() => {
      console.log(`📋 Copied ${type}:`, textToCopy)
    })
  }

  // Insert expression into lesson
  const insertExpression = (expression: MathExpression) => {
    const processed = ProfessionalMathProcessor.processContent(`[math]${expression.formula}[/math]`)
    const isDisplay = /\\frac|\\sqrt|\\int|\\sum/.test(expression.latex)
    onInsertExpression(processed, isDisplay ? 'display' : 'inline')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Calculator className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mathematical Expression Library</h2>
                <p className="text-gray-600">Insert common formulas and expressions into your lessons</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search formulas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {showCategories && (
              <div className="flex flex-wrap gap-2">
                {categories.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedCategory(value)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                      selectedCategory === value
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Expression List */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="space-y-3">
                {filteredExpressions.map((expr, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      previewExpression === expr
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setPreviewExpression(expr)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{expr.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{expr.description}</p>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            expr.category === 'algebra' ? 'bg-green-100 text-green-800' :
                            expr.category === 'calculus' ? 'bg-purple-100 text-purple-800' :
                            expr.category === 'trigonometry' ? 'bg-blue-100 text-blue-800' :
                            expr.category === 'statistics' ? 'bg-orange-100 text-orange-800' :
                            expr.category === 'geometry' ? 'bg-pink-100 text-pink-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {expr.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1 ml-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            insertExpression(expr)
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Insert
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(expr, 'latex')
                          }}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredExpressions.length === 0 && (
                <div className="text-center py-12">
                  <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No expressions found matching your criteria</p>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 overflow-y-auto">
            {previewExpression ? (
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{previewExpression.name}</h3>
                
                {/* Rendered Formula */}
                <div className="bg-gray-50 rounded-xl p-6 mb-4">
                  <h4 className="font-medium text-gray-700 mb-3">Formula Preview:</h4>
                  <div 
                    className="text-center text-xl math-content"
                    dangerouslySetInnerHTML={{
                      __html: `[math]${previewExpression.latex}[/math]`
                    }}
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Description:</h4>
                  <p className="text-gray-600">{previewExpression.description}</p>
                </div>

                {/* Variables */}
                {previewExpression.variables && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Variables:</h4>
                    <div className="space-y-2">
                      {Object.entries(previewExpression.variables).map(([variable, description]) => (
                        <div key={variable} className="flex items-start space-x-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{variable}</code>
                          <span className="text-sm text-gray-600">{description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Example */}
                {previewExpression.example && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Example:</h4>
                    <p className="text-gray-600 bg-blue-50 p-3 rounded-lg">{previewExpression.example}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => insertExpression(previewExpression)}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Insert into Lesson
                  </button>
                  <button
                    onClick={() => copyToClipboard(previewExpression, 'latex')}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy LaTeX</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select an expression to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MathExpressionLibrary