'use client'

import React, { useState } from 'react'
import MathRenderer, { InlineMath, BlockMath } from '../../components/math/MathRenderer'
import MathContent from '../../components/math/MathContent'
import { convertToLaTeX, evaluateExpression, MathExpressions } from '../../utils/mathUtils'

const MathDemoPage: React.FC = () => {
  const [inputExpression, setInputExpression] = useState('f(x) = x^2 + 3x - 5')
  const [evaluationExpression, setEvaluationExpression] = useState('2*x + 3')
  const [variableX, setVariableX] = useState(5)

  const sampleContent = `
# Mathematical Functions and Equations

Here's how we can represent mathematical functions in our lesson content:

## Quadratic Functions
The general form of a quadratic function is [math]f(x) = ax^2 + bx + c[/math], where $a$, $b$, and $c$ are constants.

For example, consider the function [math]f(x) = 2x^2 - 4x + 1[/math]. This is a parabola that opens upward since $a = 2 > 0$.

## Calculus Concepts

### Derivatives
The derivative of a function $f(x)$ with respect to $x$ is denoted as $\\frac{df}{dx}$ or $f'(x)$.

For the power rule: [math]d/dx[x^n] = nx^(n-1)[/math]

### Integrals
The integral of a function represents the area under the curve: $$\\int f(x) \\, dx$$

## Physics Applications

### Newton's Second Law
Force equals mass times acceleration: [math]F = ma[/math]

### Energy Conservation
The total mechanical energy is conserved: [math]KE + PE = (1/2)mv^2 + mgh = constant[/math]

## Chemistry Examples

### Ideal Gas Law
The relationship between pressure, volume, and temperature: [math]PV = nRT[/math]

### pH Calculation
The pH of a solution is calculated as: [math]pH = -log[H^+][/math]
  `

  const evaluationResult = evaluateExpression(evaluationExpression, { x: variableX })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Mathematical Rendering Demo</h1>
          <p className="text-lg text-gray-600">
            Demonstrating LaTeX equation rendering and mathematical function capabilities
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Interactive Expression Converter */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Expression Converter</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mathematical Expression
                </label>
                <input
                  type="text"
                  value={inputExpression}
                  onChange={(e) => setInputExpression(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., f(x) = x^2 + 3x - 5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LaTeX Output
                </label>
                <div className="bg-gray-50 p-3 rounded-lg border font-mono text-sm">
                  {convertToLaTeX(inputExpression)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rendered Result
                </label>
                <BlockMath latex={convertToLaTeX(inputExpression)} />
              </div>
            </div>
          </div>

          {/* Function Evaluation */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Function Evaluation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Function Expression
                </label>
                <input
                  type="text"
                  value={evaluationExpression}
                  onChange={(e) => setEvaluationExpression(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 2*x + 3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value of x
                </label>
                <input
                  type="number"
                  value={variableX}
                  onChange={(e) => setVariableX(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result
                </label>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <InlineMath latex={`f(${variableX}) = ${evaluationResult}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pre-built Mathematical Expressions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Common Mathematical Expressions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Quadratic Function</h3>
              <BlockMath latex={MathExpressions.quadratic(2, -4, 1)} />
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Derivative</h3>
              <BlockMath latex={MathExpressions.derivative('x^3 + 2x^2 - x + 5')} />
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">Integral</h3>
              <BlockMath latex={MathExpressions.integral('x^2 + 3x', 'x', '0', '5')} />
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-900 mb-2">Trigonometric</h3>
              <BlockMath latex={MathExpressions.sinWave(2, 1, 0, 1)} />
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">Physics: Force</h3>
              <BlockMath latex={MathExpressions.force()} />
            </div>
            
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-medium text-indigo-900 mb-2">Chemistry: Ideal Gas</h3>
              <BlockMath latex={MathExpressions.idealGas()} />
            </div>
          </div>
        </div>

        {/* Lesson Content Demo */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Math-Enabled Lesson Content</h2>
          <div className="prose max-w-none">
            <MathContent content={sampleContent} />
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage in Lesson Plans</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded mr-3">[math]...[/math]</span>
              <span>Use these tags for block mathematical expressions that will be converted to LaTeX</span>
            </div>
            <div className="flex items-start">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded mr-3">$...$</span>
              <span>Use dollar signs for inline mathematical expressions in LaTeX format</span>
            </div>
            <div className="flex items-start">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded mr-3">$$...$$</span>
              <span>Use double dollar signs for centered display mathematical expressions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MathDemoPage