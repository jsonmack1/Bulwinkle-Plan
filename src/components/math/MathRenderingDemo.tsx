'use client'

import React from 'react'
import SafeMathContent from './SafeMathContent'

/**
 * Demo component showing mathematical rendering capabilities in lesson plans
 */
const MathRenderingDemo: React.FC = () => {
  const demoLessonContent = `
**AP Calculus - Exponential Growth and Decay**

**Learning Objectives:**
- Students will model exponential growth and decay using the equation [math]y = Ce^{kt}[/math]
- Students will solve for the constant of proportionality k
- Students will interpret the meaning of C in real-world contexts

**Main Activity:**
Analyzing population growth where the population P at time t follows the model [math]P(t) = P_0 e^{0.05t}[/math].

**Key Mathematical Concepts:**
- The general exponential function is [math]f(x) = ab^x[/math]
- For continuous growth, we use [math]y = Ce^{kt}[/math] where:
  - C is the initial amount
  - k is the growth/decay rate
  - t is time

**Practice Problems:**
1. If a bacteria culture starts with 1000 bacteria and grows according to [math]N(t) = 1000e^{0.2t}[/math], how many bacteria will there be after 5 hours?

2. A radioactive substance decays according to [math]A(t) = A_0 e^{-0.1t}[/math]. If the half-life is 10 years, find the decay constant.

**Teaching Tips:**
- Emphasize that [math]e ≈ 2.718[/math] is a special mathematical constant
- Connect [math]\\frac{dy}{dt} = ky[/math] to the exponential solution
- Use graphing calculators to visualize [math]y = Ce^{kt}[/math] for different values of k

**Assessment:**
Students should be able to explain why [math]\\lim_{t \\to \\infty} Ce^{-kt} = 0[/math] for positive k values.
`

  const algebraLessonContent = `
**Algebra II - Rational Functions**

**ACTIVITY NAME: Asymptote Investigation Lab**

**Key Concepts:**
- Rational functions have the form [math]f(x) = \\frac{P(x)}{Q(x)}[/math]
- Vertical asymptotes occur where the denominator equals zero
- Horizontal asymptotes depend on the degrees of P(x) and Q(x)

**Examples:**
1. For [math]f(x) = \\frac{x+1}{x-2}[/math]:
   - Vertical asymptote at x = 2
   - Horizontal asymptote at y = 1

2. For [math]g(x) = \\frac{x^2-4}{x^2+1}[/math]:
   - No vertical asymptotes (denominator never zero)
   - Horizontal asymptote at y = 1

**Practice:**
Graph [math]h(x) = \\frac{2x^2+3x-1}{x^2-4}[/math] and identify all asymptotes.

**Real-World Application:**
Average cost per item: [math]C(x) = \\frac{1000 + 5x}{x}[/math] where x is number of items produced.
Note that [math]C(x) = \\frac{1000}{x} + 5[/math], showing cost approaches $5 as production increases.
`

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">
        🧮 Mathematical Rendering Demo
      </h2>
      
      <div className="space-y-8">
        {/* AP Calculus Example */}
        <div className="border rounded-lg p-6 bg-blue-50">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">
            AP Calculus Example - Exponential Functions
          </h3>
          <div className="bg-white p-4 rounded border">
            <SafeMathContent content={demoLessonContent} />
          </div>
        </div>

        {/* Algebra II Example */}
        <div className="border rounded-lg p-6 bg-green-50">
          <h3 className="text-lg font-semibold mb-4 text-green-800">
            Algebra II Example - Rational Functions
          </h3>
          <div className="bg-white p-4 rounded border">
            <SafeMathContent content={algebraLessonContent} />
          </div>
        </div>

        {/* Mathematical Expressions Reference */}
        <div className="border rounded-lg p-6 bg-purple-50">
          <h3 className="text-lg font-semibold mb-4 text-purple-800">
            Supported Mathematical Expressions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium mb-2">Basic Operations:</h4>
              <ul className="space-y-1">
                <li><code>[math]x^2[/math]</code> → <SafeMathContent content="[math]x^2[/math]" className="inline" /></li>
                <li><code>[math]x_{12}[/math]</code> → <SafeMathContent content="[math]x_{12}[/math]" className="inline" /></li>
                <li><code>[math]\\frac{1}{2}[/math]</code> → <SafeMathContent content="[math]\\frac{1}{2}[/math]" className="inline" /></li>
                <li><code>[math]\\sqrt{16}[/math]</code> → <SafeMathContent content="[math]\\sqrt{16}[/math]" className="inline" /></li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium mb-2">Advanced Symbols:</h4>
              <ul className="space-y-1">
                <li><code>[math]\\pi[/math]</code> → <SafeMathContent content="[math]\\pi[/math]" className="inline" /></li>
                <li><code>[math]\\alpha[/math]</code> → <SafeMathContent content="[math]\\alpha[/math]" className="inline" /></li>
                <li><code>[math]\\int[/math]</code> → <SafeMathContent content="[math]\\int[/math]" className="inline" /></li>
                <li><code>[math]\\infty[/math]</code> → <SafeMathContent content="[math]\\infty[/math]" className="inline" /></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>📝 Mathematical expressions are automatically rendered in all lesson plan sections</p>
        <p>🖨️ Print and PDF export maintain mathematical formatting</p>
      </div>
    </div>
  )
}

export default MathRenderingDemo