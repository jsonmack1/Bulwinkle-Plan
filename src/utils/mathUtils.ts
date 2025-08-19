import { evaluate, parse } from 'mathjs'

/**
 * Converts common mathematical notation to LaTeX format
 */
export function convertToLaTeX(expression: string): string {
  try {
    // Handle common function notations
    let latex = expression

    // Function notation: f(x) = ... → f(x) = ...
    latex = latex.replace(/([a-zA-Z]+)\(([^)]+)\)\s*=\s*(.+)/, '$1($2) = $3')

    // Powers: x^2 → x^{2}, x^(2+1) → x^{(2+1)}
    latex = latex.replace(/\^(\d+)/g, '^{$1}')
    latex = latex.replace(/\^(\([^)]+\))/g, '^{$1}')
    latex = latex.replace(/\^([a-zA-Z]+)/g, '^{$1}')

    // Subscripts: x_1 → x_{1}
    latex = latex.replace(/_(\d+)/g, '_{$1}')
    latex = latex.replace(/_([a-zA-Z]+)/g, '_{$1}')

    // Square roots: sqrt(x) → \sqrt{x}
    latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')

    // Fractions: (a)/(b) → \frac{a}{b}
    latex = latex.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, '\\frac{$1}{$2}')
    latex = latex.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')

    // Trigonometric functions
    latex = latex.replace(/sin\(/g, '\\sin(')
    latex = latex.replace(/cos\(/g, '\\cos(')
    latex = latex.replace(/tan\(/g, '\\tan(')
    latex = latex.replace(/sec\(/g, '\\sec(')
    latex = latex.replace(/csc\(/g, '\\csc(')
    latex = latex.replace(/cot\(/g, '\\cot(')

    // Inverse trig functions
    latex = latex.replace(/arcsin\(/g, '\\arcsin(')
    latex = latex.replace(/arccos\(/g, '\\arccos(')
    latex = latex.replace(/arctan\(/g, '\\arctan(')

    // Logarithms
    latex = latex.replace(/log\(/g, '\\log(')
    latex = latex.replace(/ln\(/g, '\\ln(')
    latex = latex.replace(/log_(\d+)\(/g, '\\log_{$1}(')

    // Exponentials
    latex = latex.replace(/e\^/g, 'e^')
    latex = latex.replace(/exp\(([^)]+)\)/g, 'e^{$1}')

    // Derivatives: d/dx → \frac{d}{dx}
    latex = latex.replace(/d\/d([a-zA-Z])/g, '\\frac{d}{d$1}')
    latex = latex.replace(/d\^(\d+)\/d([a-zA-Z])\^(\d+)/g, '\\frac{d^{$1}}{d$2^{$3}}')

    // Integrals: int(f, x) → \int f \, dx
    latex = latex.replace(/int\(([^,]+),\s*([a-zA-Z])\)/g, '\\int $1 \\, d$2')
    latex = latex.replace(/int_([^{]+)\^([^{]+)\(([^,]+),\s*([a-zA-Z])\)/g, '\\int_{$1}^{$2} $3 \\, d$4')

    // Limits: lim(x->a) → \lim_{x \to a}
    latex = latex.replace(/lim\(([a-zA-Z])->([^)]+)\)/g, '\\lim_{$1 \\to $2}')

    // Summations: sum(i=1, n) → \sum_{i=1}^{n}
    latex = latex.replace(/sum\(([a-zA-Z])=([^,]+),\s*([^)]+)\)/g, '\\sum_{$1=$2}^{$3}')

    // Products: prod(i=1, n) → \prod_{i=1}^{n}
    latex = latex.replace(/prod\(([a-zA-Z])=([^,]+),\s*([^)]+)\)/g, '\\prod_{$1=$2}^{$3}')

    // Greek letters
    const greekLetters = [
      'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
      'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho',
      'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'
    ]
    
    greekLetters.forEach(letter => {
      const regex = new RegExp(`\\b${letter}\\b`, 'g')
      latex = latex.replace(regex, `\\${letter}`)
    })

    // Infinity
    latex = latex.replace(/infinity|inf/g, '\\infty')

    // Plus/minus
    latex = latex.replace(/\+\/-/g, '\\pm')
    latex = latex.replace(/-\/\+/g, '\\mp')

    // Multiplication dot
    latex = latex.replace(/\*/g, ' \\cdot ')

    // Vectors: vec(a) → \vec{a}
    latex = latex.replace(/vec\(([^)]+)\)/g, '\\vec{$1}')

    // Matrices: matrix([[a,b],[c,d]]) → \begin{pmatrix} a & b \\ c & d \end{pmatrix}
    latex = latex.replace(/matrix\(\[\[([^\]]+)\]\]\)/g, (match, content) => {
      const rows = content.split('],[').map((row: string) => 
        row.replace(/[\[\]]/g, '').split(',').join(' & ')
      )
      return `\\begin{pmatrix} ${rows.join(' \\\\ ')} \\end{pmatrix}`
    })

    return latex
  } catch (error) {
    console.error('LaTeX conversion error:', error)
    return expression // Return original if conversion fails
  }
}

/**
 * Evaluates mathematical expressions using Math.js
 */
export function evaluateExpression(expression: string, variables: Record<string, number> = {}): number | string {
  try {
    const result = evaluate(expression, variables)
    return typeof result === 'number' ? Number(result.toFixed(10)) : result
  } catch (error) {
    console.error('Expression evaluation error:', error)
    return 'Error'
  }
}

/**
 * Generates common mathematical expressions for lessons
 */
export const MathExpressions = {
  // Basic functions
  quadratic: (a: number = 1, b: number = 0, c: number = 0) => 
    `f(x) = ${a}x^2 + ${b}x + ${c}`,
  
  linear: (m: number = 1, b: number = 0) => 
    `f(x) = ${m}x + ${b}`,
  
  exponential: (a: number = 1, b: number = 2) => 
    `f(x) = ${a} \\cdot ${b}^x`,
  
  logarithmic: (base: number = 10) => 
    base === 10 ? `f(x) = \\log(x)` : `f(x) = \\log_{${base}}(x)`,
  
  // Calculus
  derivative: (func: string, variable: string = 'x') => 
    `\\frac{d}{d${variable}}[${func}]`,
  
  integral: (func: string, variable: string = 'x', lower?: string, upper?: string) => 
    lower && upper ? 
      `\\int_{${lower}}^{${upper}} ${func} \\, d${variable}` : 
      `\\int ${func} \\, d${variable}`,
  
  limit: (func: string, variable: string = 'x', approaches: string = '0') => 
    `\\lim_{${variable} \\to ${approaches}} ${func}`,
  
  // Trigonometry
  sinWave: (a: number = 1, b: number = 1, c: number = 0, d: number = 0) => 
    `f(x) = ${a}\\sin(${b}x + ${c}) + ${d}`,
  
  cosWave: (a: number = 1, b: number = 1, c: number = 0, d: number = 0) => 
    `f(x) = ${a}\\cos(${b}x + ${c}) + ${d}`,
  
  // Physics
  velocity: () => `v = \\frac{\\Delta x}{\\Delta t}`,
  acceleration: () => `a = \\frac{\\Delta v}{\\Delta t}`,
  force: () => `F = ma`,
  energy: () => `E = mc^2`,
  kineticEnergy: () => `KE = \\frac{1}{2}mv^2`,
  potentialEnergy: () => `PE = mgh`,
  
  // Chemistry
  idealGas: () => `PV = nRT`,
  concentration: () => `C = \\frac{n}{V}`,
  pH: () => `pH = -\\log[H^+]`,
  
  // Statistics
  mean: () => `\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i`,
  standardDeviation: () => `\\sigma = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n}(x_i - \\bar{x})^2}`,
  
  // Geometry
  circleArea: () => `A = \\pi r^2`,
  sphereVolume: () => `V = \\frac{4}{3}\\pi r^3`,
  pythagorean: () => `a^2 + b^2 = c^2`
}

/**
 * Parses mathematical content and converts expressions to LaTeX
 */
export function parseMathContent(content: string): string {
  // Find expressions between [math] tags and convert them
  return content.replace(/\[math\](.*?)\[\/math\]/g, (match, expression) => {
    const latex = convertToLaTeX(expression.trim())
    return `$${latex}$`
  })
}

/**
 * Validates mathematical expressions
 */
export function validateExpression(expression: string): { valid: boolean; error?: string } {
  try {
    parse(expression)
    return { valid: true }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid expression' 
    }
  }
}

/**
 * Format numbers for display in mathematical contexts
 */
export function formatMathNumber(num: number, precision: number = 3): string {
  if (Math.abs(num) < 0.001 || Math.abs(num) > 1000) {
    return num.toExponential(precision)
  }
  return Number(num.toFixed(precision)).toString()
}