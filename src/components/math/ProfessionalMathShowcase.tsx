'use client'

import React, { useState } from 'react'
import ProfessionalMathContent from './ProfessionalMathContent'
import MathExpressionLibrary from './MathExpressionLibrary'
import MathQualityControl from './MathQualityControl'
import { Calculator, BookOpen, CheckCircle, Eye, Zap } from 'lucide-react'

/**
 * Professional Mathematical Typography Showcase
 * Demonstrates textbook-quality mathematical rendering capabilities
 */
const ProfessionalMathShowcase: React.FC = () => {
  const [showLibrary, setShowLibrary] = useState(false)
  const [currentExample, setCurrentExample] = useState('slope')

  // Example mathematical content showcasing different features
  const examples = {
    slope: `
**Geometry - Understanding Slope**

**ACTIVITY NAME: Slope Investigation Lab**

The slope of a line is a fundamental concept in algebra and geometry. It represents the rate of change between two points.

**Definition:**
The slope formula is given by: [math](y2-y1)/(x2-x1)[/math]

This can also be written as: [display]m = \\frac{y_2 - y_1}{x_2 - x_1}[/display]

**Key Points:**
- When [math]x2 != x1[/math], the slope exists
- A positive slope means the line rises from left to right
- A negative slope means the line falls from left to right
- Zero slope indicates a horizontal line
- Undefined slope occurs when [math]x2 = x1[/math] (vertical line)

**Example Problem:**
Find the slope of the line passing through points (2, 3) and (6, 11).

**Solution:**
Using the slope formula: [math]m = (11-3)/(6-2) = 8/4 = 2[/math]

Therefore, the slope is 2, meaning the line rises 2 units vertically for every 1 unit horizontally.
`,

    calculus: `
**AP Calculus - Derivatives and Related Rates**

**ACTIVITY NAME: Population Growth Modeling**

Understanding derivatives helps us model real-world phenomena like population growth.

**The Derivative Definition:**
[display]f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}[/display]

**Exponential Growth Model:**
Population growth often follows: [math]P(t) = P_0 e^{kt}[/math]

Where:
- [math]P_0[/math] is the initial population
- [math]k[/math] is the growth constant
- [math]t[/math] is time

**Finding the Growth Rate:**
The rate of population change is: [display]\\frac{dP}{dt} = kP_0 e^{kt} = kP(t)[/display]

**Example:**
A bacteria culture starts with 1000 bacteria and doubles every 3 hours.

**Step 1:** Find the growth constant
[math]2000 = 1000e^{3k}[/math]
[math]2 = e^{3k}[/math]
[math]ln(2) = 3k[/math]
**Answer:** [math]k = \\frac{ln(2)}{3} ≈ 0.231[/math]

**Step 2:** The population function is:
[display]P(t) = 1000e^{0.231t}[/display]
`,

    quadratic: `
**Algebra II - Quadratic Functions and the Quadratic Formula**

**ACTIVITY NAME: Projectile Motion Analysis**

**The Quadratic Formula:**
For any quadratic equation [math]ax^2 + bx + c = 0[/math], the solutions are:

[display]x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}[/display]

**Discriminant Analysis:**
The discriminant [math]\\Delta = b^2 - 4ac[/math] tells us:
- If [math]\\Delta > 0[/math]: Two real solutions
- If [math]\\Delta = 0[/math]: One real solution (repeated root)
- If [math]\\Delta < 0[/math]: No real solutions (complex solutions)

**Real-World Application:**
A ball is thrown upward with initial velocity 64 ft/s from a height of 6 feet.
The height equation is: [math]h(t) = -16t^2 + 64t + 6[/math]

**Question:** When does the ball hit the ground? (when [math]h(t) = 0[/math])

**Solution:**
[math]-16t^2 + 64t + 6 = 0[/math]

Using the quadratic formula with [math]a = -16[/math], [math]b = 64[/math], [math]c = 6[/math]:

[display]t = \\frac{-64 \\pm \\sqrt{64^2 - 4(-16)(6)}}{2(-16)}[/display]

[display]t = \\frac{-64 \\pm \\sqrt{4096 + 384}}{-32}[/display]

[display]t = \\frac{-64 \\pm \\sqrt{4480}}{-32}[/display]

**Answer:** [math]t ≈ 4.09[/math] seconds (taking the positive solution)
`,

    trigonometry: `
**Trigonometry - The Unit Circle and Identities**

**ACTIVITY NAME: Trigonometric Identity Verification**

**Fundamental Identity:**
The Pythagorean identity is the foundation of trigonometry:
[display]\\sin^2\\theta + \\cos^2\\theta = 1[/display]

**Derived Identities:**
Dividing by [math]\\cos^2\\theta[/math]:
[math]\\tan^2\\theta + 1 = \\sec^2\\theta[/math]

Dividing by [math]\\sin^2\\theta[/math]:
[math]1 + \\cot^2\\theta = \\csc^2\\theta[/math]

**Double Angle Formulas:**
- [math]\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta[/math]
- [math]\\cos(2\\theta) = \\cos^2\\theta - \\sin^2\\theta[/math]
- [display]\\tan(2\\theta) = \\frac{2\\tan\\theta}{1 - \\tan^2\\theta}[/display]

**Law of Sines:**
For any triangle with sides [math]a[/math], [math]b[/math], [math]c[/math] and opposite angles [math]A[/math], [math]B[/math], [math]C[/math]:

[display]\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}[/display]

**Example Problem:**
Verify the identity: [math]\\frac{\\sin x}{1 - \\cos x} = \\csc x + \\cot x[/math]

**Solution:**
Starting with the right side:
[math]\\csc x + \\cot x = \\frac{1}{\\sin x} + \\frac{\\cos x}{\\sin x} = \\frac{1 + \\cos x}{\\sin x}[/math]

Multiply both numerator and denominator by [math](1 - \\cos x)[/math]:
[display]\\frac{1 + \\cos x}{\\sin x} \\cdot \\frac{1 - \\cos x}{1 - \\cos x} = \\frac{(1 + \\cos x)(1 - \\cos x)}{\\sin x(1 - \\cos x)}[/display]

[display]= \\frac{1 - \\cos^2 x}{\\sin x(1 - \\cos x)} = \\frac{\\sin^2 x}{\\sin x(1 - \\cos x)} = \\frac{\\sin x}{1 - \\cos x}[/display]

**Verified!** ✓
`
  }

  const handleInsertExpression = (expression: string, type: 'inline' | 'display') => {
    console.log(`Inserting ${type} expression:`, expression)
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🧮 Professional Mathematical Typography
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience textbook-quality mathematical notation rendering with automatic conversion, 
          professional spacing, and comprehensive quality control.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <Calculator className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="font-bold text-blue-900 mb-2">Professional MathJax</h3>
          <p className="text-sm text-blue-700">High-quality mathematical typography with proper font sizing and spacing</p>
        </div>
        
        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <Zap className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="font-bold text-green-900 mb-2">Smart Conversion</h3>
          <p className="text-sm text-green-700">Automatic conversion from common notation to professional LaTeX</p>
        </div>
        
        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <BookOpen className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="font-bold text-purple-900 mb-2">Expression Library</h3>
          <p className="text-sm text-purple-700">Pre-built formulas and templates for common mathematical concepts</p>
        </div>
        
        <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
          <CheckCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h3 className="font-bold text-orange-900 mb-2">Quality Control</h3>
          <p className="text-sm text-orange-700">Automated validation and consistency checking for professional results</p>
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        {/* Demo Controls */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Interactive Demo</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowLibrary(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Expression Library</span>
              </button>
            </div>
          </div>

          {/* Example Selector */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(examples).map(([key, content]) => (
              <button
                key={key}
                onClick={() => setCurrentExample(key)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  currentExample === key
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Quality Control */}
          <div className="mb-6">
            <MathQualityControl 
              content={examples[currentExample as keyof typeof examples]}
              enabled={true}
              showMetrics={true}
              onIssuesFound={(issues) => console.log('Quality issues:', issues)}
            />
          </div>

          {/* Mathematical Content Display */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Professional Mathematical Rendering
            </h3>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <ProfessionalMathContent 
                content={examples[currentExample as keyof typeof examples]}
                showSolutions={true}
                boardDisplayMode={false}
                forPrint={false}
                processingOptions={{
                  autoDetectDisplayMode: true,
                  enhanceFractions: true,
                  smartSubscripts: true,
                  professionalSpacing: true
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Technical Features */}
      <div className="mt-12 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Technical Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">🎯 Automatic Conversion</h3>
            <div className="space-y-2 text-sm">
              <div><code>(y2-y1)/(x2-x1)</code> → <span className="text-green-600">Professional slope formula</span></div>
              <div><code>sqrt(x^2 + y^2)</code> → <span className="text-green-600">Proper radical notation</span></div>
              <div><code>x^2 + 2x + 1</code> → <span className="text-green-600">Clean superscripts</span></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">📐 Professional Layout</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• Proper mathematical font selection</div>
              <div>• Optimal spacing around expressions</div>
              <div>• Responsive mathematical typography</div>
              <div>• Print-optimized formatting</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">✅ Quality Assurance</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• Automatic syntax validation</div>
              <div>• Consistency checking</div>
              <div>• Readability analysis</div>
              <div>• Professional scoring system</div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Info */}
      <div className="mt-12 text-center bg-blue-50 rounded-2xl p-8 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Seamless Integration</h2>
        <p className="text-blue-800 max-w-3xl mx-auto mb-6">
          This professional mathematical typography system is now fully integrated into your lesson planning application. 
          Mathematical expressions automatically render with textbook quality, and teachers can easily insert common formulas 
          using the expression library.
        </p>
        
        <div className="flex justify-center items-center space-x-8 text-blue-700">
          <div className="text-center">
            <div className="text-2xl font-bold">50+</div>
            <div className="text-sm">Pre-built Formulas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm">Automatic Quality</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">∞</div>
            <div className="text-sm">Expression Support</div>
          </div>
        </div>
      </div>

      {/* Mathematical Expression Library Modal */}
      <MathExpressionLibrary
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onInsertExpression={handleInsertExpression}
        showCategories={true}
      />
    </div>
  )
}

export default ProfessionalMathShowcase