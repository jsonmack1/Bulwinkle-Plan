'use client'

import React from 'react'
import SafeMathContent from './SafeMathContent'
import MathContentTools from './MathContentTools'

/**
 * Showcase component demonstrating all mathematical UI enhancements
 */
const MathUIShowcase: React.FC = () => {
  const demoMathContent = `
**AP Calculus - Exponential Growth and Decay**

**ACTIVITY NAME: Population Dynamics Lab**

**Learning Objectives:**
Students will analyze population growth using the differential equation [math]\\frac{dP}{dt} = kP[/math], where P represents population and k is the growth constant.

**Solution Steps:**
**Step 1:** The general solution is [math]P(t) = P_0 e^{kt}[/math]
**Step 2:** To find k, use initial conditions [math]P(0) = 1000[/math] and [math]P(5) = 2000[/math]
**Step 3:** Solve: [math]2000 = 1000e^{5k}[/math]
**Answer:** [math]k = \\frac{\\ln(2)}{5} ≈ 0.1386[/math]

**Practice Problems:**
1. A bacteria culture grows according to [math]N(t) = 500e^{0.3t}[/math]. Find the doubling time.
2. If [math]\\frac{dy}{dt} = 0.05y[/math] and y(0) = 100, what is y(10)?

**Teaching Tips:**
- Emphasize that [math]e ≈ 2.718[/math] is the natural base
- Connect [math]\\int \\frac{1}{x} dx = \\ln|x| + C[/math] to exponential functions
- Use real-world examples like [math]A(t) = A_0 e^{-\\lambda t}[/math] for radioactive decay
`

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">
        🧮 Mathematical UI Enhancements Showcase
      </h1>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">📊 Content Detection</h3>
          <p className="text-sm text-blue-700">
            Automatically detects mathematical expressions and shows analysis with complexity indicators
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <h3 className="font-bold text-green-800 mb-2">👁️ Solution Toggle</h3>
          <p className="text-sm text-green-700">
            Hide/show worked solutions and answers for student-friendly viewing
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
          <h3 className="font-bold text-purple-800 mb-2">📋 LaTeX Copy</h3>
          <p className="text-sm text-purple-700">
            Copy individual expressions or entire math content as LaTeX code
          </p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
          <h3 className="font-bold text-orange-800 mb-2">🖼️ Board Display</h3>
          <p className="text-sm text-orange-700">
            Large, classroom-friendly display mode for presentations
          </p>
        </div>
        
        <div className="bg-cyan-50 p-4 rounded-lg border-2 border-cyan-200">
          <h3 className="font-bold text-cyan-800 mb-2">🧮 Math Export</h3>
          <p className="text-sm text-cyan-700">
            Special PDF export optimized for mathematical typography
          </p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
          <h3 className="font-bold text-red-800 mb-2">🎯 Smart Integration</h3>
          <p className="text-sm text-red-700">
            Seamlessly integrated with existing lesson preview interface
          </p>
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          Interactive Demo
        </h2>
        
        {/* Math Content Tools */}
        <div className="mb-6">
          <MathContentTools
            content={demoMathContent}
            enabled={true}
            onCopyExpression={(expr) => console.log('Copied:', expr)}
            onBoardDisplayChange={(enabled) => console.log('Board mode:', enabled)}
            onSolutionsToggle={(visible) => console.log('Solutions:', visible)}
          />
        </div>
        
        {/* Content Display */}
        <div className="bg-white p-6 rounded-lg border">
          <SafeMathContent 
            content={demoMathContent}
            enhanced={true}
            showSolutions={true}
            boardDisplayMode={false}
            mathExportMode={false}
          />
        </div>
      </div>

      {/* Implementation Summary */}
      <div className="mt-8 bg-gray-100 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">✅ Implementation Complete</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">🔧 Components Created:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• MathContentTools - Math detection & controls</li>
              <li>• Enhanced SafeMathContent - Display modes</li>
              <li>• Math-specific export functionality</li>
              <li>• Board display mode styling</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">⚡ Features Added:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Automatic math content detection</li>
              <li>• Solutions visibility toggle</li>
              <li>• LaTeX expression copying</li>
              <li>• Classroom board display mode</li>
              <li>• Mathematical PDF export</li>
              <li>• Integration with lesson interface</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>🎯 Result:</strong> Your lesson plan system now provides comprehensive mathematical content support 
            with intelligent detection, interactive controls, and specialized export options - perfect for math-heavy subjects like 
            AP Calculus, Algebra II, and advanced mathematics courses.
          </p>
        </div>
      </div>
    </div>
  )
}

export default MathUIShowcase