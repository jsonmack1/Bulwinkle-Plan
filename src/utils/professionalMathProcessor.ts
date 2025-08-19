/**
 * Professional Mathematical Expression Processor
 * Converts common mathematical notation to high-quality LaTeX for textbook-level rendering
 */

interface MathExpression {
  raw: string
  latex: string
  type: 'inline' | 'display' | 'block'
  complexity: 'simple' | 'moderate' | 'complex'
  category: string
}

interface ProcessingOptions {
  autoDetectDisplayMode?: boolean
  enhanceFractions?: boolean
  smartSubscripts?: boolean
  professionalSpacing?: boolean
}

export class ProfessionalMathProcessor {
  
  // Common mathematical patterns and their LaTeX equivalents
  private static readonly CONVERSION_PATTERNS = [
    // Fractions - automatic detection and conversion
    {
      pattern: /\(([^)]+)\)\/\(([^)]+)\)/g,
      replacement: '\\frac{$1}{$2}',
      category: 'fractions'
    },
    {
      pattern: /([a-zA-Z0-9_]+)\s*\/\s*([a-zA-Z0-9_]+)/g,
      replacement: '\\frac{$1}{$2}',
      category: 'simple_fractions'
    },
    
    // Slope formula variations
    {
      pattern: /\(y2\s*-\s*y1\)\s*\/\s*\(x2\s*-\s*x1\)/gi,
      replacement: '\\frac{y_2 - y_1}{x_2 - x_1}',
      category: 'slope'
    },
    {
      pattern: /\(y_2\s*-\s*y_1\)\s*\/\s*\(x_2\s*-\s*x_1\)/g,
      replacement: '\\frac{y_2 - y_1}{x_2 - x_1}',
      category: 'slope'
    },
    {
      pattern: /slope\s*=\s*rise\s*\/\s*run/gi,
      replacement: '\\text{slope} = \\frac{\\text{rise}}{\\text{run}}',
      category: 'slope'
    },
    
    // Quadratic formula
    {
      pattern: /\(-b\s*\+\/-\s*sqrt\(b\^2\s*-\s*4ac\)\)\s*\/\s*\(2a\)/gi,
      replacement: '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
      category: 'quadratic'
    },
    {
      pattern: /x\s*=\s*\(-b\s*\+\/-\s*sqrt\(b\^2\s*-\s*4ac\)\)\s*\/\s*\(2a\)/gi,
      replacement: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
      category: 'quadratic'
    },
    
    // Distance formula
    {
      pattern: /sqrt\(\(x2\s*-\s*x1\)\^2\s*\+\s*\(y2\s*-\s*y1\)\^2\)/gi,
      replacement: '\\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}',
      category: 'distance'
    },
    
    // Point-slope form
    {
      pattern: /y\s*-\s*y1\s*=\s*m\s*\*\s*\(x\s*-\s*x1\)/gi,
      replacement: 'y - y_1 = m(x - x_1)',
      category: 'point_slope'
    },
    
    // Subscripts and superscripts
    {
      pattern: /([a-zA-Z])(\d+)/g,
      replacement: '$1_{$2}',
      category: 'subscripts'
    },
    {
      pattern: /\^(\d+)/g,
      replacement: '^{$1}',
      category: 'superscripts'
    },
    {
      pattern: /\^(\([^)]+\))/g,
      replacement: '^{$1}',
      category: 'superscripts'
    },
    
    // Square roots
    {
      pattern: /sqrt\(([^)]+)\)/gi,
      replacement: '\\sqrt{$1}',
      category: 'radicals'
    },
    
    // Absolute values
    {
      pattern: /\|([^|]+)\|/g,
      replacement: '\\left|$1\\right|',
      category: 'absolute_value'
    },
    
    // Derivatives
    {
      pattern: /d\/dx\s*\(([^)]+)\)/gi,
      replacement: '\\frac{d}{dx}\\left($1\\right)',
      category: 'calculus'
    },
    {
      pattern: /dy\/dx/gi,
      replacement: '\\frac{dy}{dx}',
      category: 'calculus'
    },
    
    // Integrals
    {
      pattern: /integral\(([^,]+),\s*([^,]+),\s*([^)]+)\)/gi,
      replacement: '\\int_{$2}^{$3} $1 \\, dx',
      category: 'calculus'
    },
    
    // Limits
    {
      pattern: /lim\s*\(([^,]+),\s*([^,]+)\)\s*(.+)/gi,
      replacement: '\\lim_{$1 \\to $2} $3',
      category: 'calculus'
    },
    
    // Mathematical operators
    {
      pattern: /\+\/-/g,
      replacement: '\\pm',
      category: 'operators'
    },
    {
      pattern: /-\+/g,
      replacement: '\\mp',
      category: 'operators'
    },
    {
      pattern: /<=/g,
      replacement: '\\leq',
      category: 'operators'
    },
    {
      pattern: />=/g,
      replacement: '\\geq',
      category: 'operators'
    },
    {
      pattern: /!=/g,
      replacement: '\\neq',
      category: 'operators'
    },
    {
      pattern: /approx/gi,
      replacement: '\\approx',
      category: 'operators'
    },
    {
      pattern: /infinity|infty/gi,
      replacement: '\\infty',
      category: 'operators'
    },
    
    // Greek letters (common in mathematics)
    {
      pattern: /\b(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|phi|omega)\b/gi,
      replacement: (match: string) => `\\${match.toLowerCase()}`,
      category: 'greek_letters'
    }
  ]

  /**
   * Process mathematical content to professional LaTeX
   */
  static processContent(content: string, options: ProcessingOptions = {}): string {
    const {
      autoDetectDisplayMode = true,
      enhanceFractions = true,
      smartSubscripts = true,
      professionalSpacing = true
    } = options

    let processed = content

    // Pre-process: handle [math] and [display] tags
    processed = processed.replace(/\[math\](.*?)\[\/math\]/g, (match, mathContent) => {
      const cleanMath = this.cleanMathExpression(mathContent.trim())
      const convertedMath = this.convertToLatex(cleanMath, options)
      
      // Auto-detect if this should be display mode
      const shouldBeDisplay = autoDetectDisplayMode && this.shouldUseDisplayMode(convertedMath)
      
      if (shouldBeDisplay) {
        return `[display]${convertedMath}[/display]`
      }
      
      return `[math]${convertedMath}[/math]`
    })

    // Process [display] tags
    processed = processed.replace(/\[display\](.*?)\[\/display\]/g, (match, mathContent) => {
      const cleanMath = this.cleanMathExpression(mathContent.trim())
      const convertedMath = this.convertToLatex(cleanMath, options)
      return `[display]${convertedMath}[/display]`
    })

    return processed
  }

  /**
   * Convert common mathematical notation to LaTeX
   */
  private static convertToLatex(expression: string, options: ProcessingOptions): string {
    let latex = expression

    const {
      enhanceFractions = true,
      smartSubscripts = true,
      professionalSpacing = true
    } = options

    // Apply conversion patterns
    for (const pattern of this.CONVERSION_PATTERNS) {
      if (typeof pattern.replacement === 'string') {
        latex = latex.replace(pattern.pattern, pattern.replacement)
      } else {
        latex = latex.replace(pattern.pattern, pattern.replacement as (substring: string, ...args: string[]) => string)
      }
    }

    // Enhanced fraction processing
    if (enhanceFractions) {
      latex = this.enhanceFractions(latex)
    }

    // Smart subscript processing
    if (smartSubscripts) {
      latex = this.enhanceSubscripts(latex)
    }

    // Professional spacing
    if (professionalSpacing) {
      latex = this.addProfessionalSpacing(latex)
    }

    return latex
  }

  /**
   * Enhanced fraction processing for better visual appearance
   */
  private static enhanceFractions(latex: string): string {
    // Handle nested fractions
    latex = latex.replace(/\\frac\{([^}]*\\frac\{[^}]*\}[^}]*)\}\{([^}]+)\}/g, 
                         '\\dfrac{$1}{$2}')
    
    // Use \dfrac for display-style fractions
    latex = latex.replace(/\\frac\{([^}]{10,})\}\{([^}]+)\}/g, '\\dfrac{$1}{$2}')
    
    return latex
  }

  /**
   * Enhanced subscript processing
   */
  private static enhanceSubscripts(latex: string): string {
    // Handle common variable subscripts (x1, y2, etc.)
    latex = latex.replace(/([a-zA-Z])_(\d+)/g, '$1_{$2}')
    
    // Handle multi-character subscripts
    latex = latex.replace(/([a-zA-Z])_([a-zA-Z]{2,})/g, '$1_{\\text{$2}}')
    
    return latex
  }

  /**
   * Add professional spacing to mathematical expressions
   */
  private static addProfessionalSpacing(latex: string): string {
    // Add proper spacing around operators
    latex = latex.replace(/([a-zA-Z0-9})])\s*([+\-])\s*([a-zA-Z0-9({])/g, '$1 $2 $3')
    latex = latex.replace(/([a-zA-Z0-9})])\s*([*×·])\s*([a-zA-Z0-9({])/g, '$1 \\cdot $3')
    latex = latex.replace(/([a-zA-Z0-9})])\s*(=)\s*([a-zA-Z0-9({])/g, '$1 $2 $3')
    latex = latex.replace(/([a-zA-Z0-9})])\s*([<>≤≥])\s*([a-zA-Z0-9({])/g, '$1 $2 $3')
    
    // Add spacing in function definitions
    latex = latex.replace(/([a-zA-Z])\(([a-zA-Z])\)/g, '$1($2)')
    
    return latex
  }

  /**
   * Determine if expression should use display mode
   */
  private static shouldUseDisplayMode(latex: string): boolean {
    // Expressions that should be displayed (centered, larger)
    const displayPatterns = [
      /\\frac\{.*\}\{.*\}/,  // Fractions
      /\\dfrac\{.*\}\{.*\}/, // Display fractions
      /\\sqrt\{.*\}/,        // Square roots
      /\\int.*dx/,           // Integrals
      /\\lim_.*to/,          // Limits
      /\\sum_.*\^/,          // Summations
      /\\prod_.*\^/,         // Products
      /=[^=].*[+\-±∓].*=/,   // Multi-step equations
    ]

    return displayPatterns.some(pattern => pattern.test(latex))
  }

  /**
   * Clean mathematical expression of common formatting issues
   */
  private static cleanMathExpression(expression: string): string {
    return expression
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\*\*/g, '^') // Convert ** to ^
      .replace(/\s*\*\s*/g, ' \\cdot ') // Convert * to proper multiplication
      .trim()
  }

  /**
   * Analyze mathematical expression complexity and type
   */
  static analyzeExpression(expression: string): MathExpression {
    const latex = this.convertToLatex(expression, {})
    
    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple'
    if (/\\frac|\\sqrt|\\int|\\lim|\\sum/.test(latex)) {
      complexity = 'moderate'
    }
    if (/\\dfrac|\\int_.*\^|\\lim_.*\\to|nested/.test(latex)) {
      complexity = 'complex'
    }

    // Determine category
    let category = 'general'
    if (/\\frac\{.*y.*\}\{.*x.*\}/.test(latex)) category = 'slope'
    if (/\\pm.*\\sqrt/.test(latex)) category = 'quadratic'
    if (/\\sqrt\{.*\^2.*\^2\}/.test(latex)) category = 'distance'
    if (/\\frac\{d.*\}\{d.*\}/.test(latex)) category = 'calculus'
    if (/\\int/.test(latex)) category = 'calculus'

    // Determine display type
    const type = this.shouldUseDisplayMode(latex) ? 'display' : 'inline'

    return {
      raw: expression,
      latex,
      type: type as 'inline' | 'display' | 'block',
      complexity,
      category
    }
  }

  /**
   * Get common mathematical expressions library
   */
  static getCommonExpressions(): Record<string, string> {
    return {
      // Basic algebra
      'Slope Formula': '\\frac{y_2 - y_1}{x_2 - x_1}',
      'Point-Slope Form': 'y - y_1 = m(x - x_1)',
      'Slope-Intercept Form': 'y = mx + b',
      'Standard Form': 'Ax + By = C',
      'Quadratic Formula': 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
      'Distance Formula': 'd = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}',
      'Midpoint Formula': 'M = \\left(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2}\\right)',
      
      // Calculus
      'Derivative Definition': '\\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}',
      'Power Rule': '\\frac{d}{dx}[x^n] = nx^{n-1}',
      'Product Rule': '\\frac{d}{dx}[f(x)g(x)] = f\'(x)g(x) + f(x)g\'(x)',
      'Quotient Rule': '\\frac{d}{dx}\\left[\\frac{f(x)}{g(x)}\\right] = \\frac{f\'(x)g(x) - f(x)g\'(x)}{[g(x)]^2}',
      'Chain Rule': '\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)',
      'Fundamental Theorem': '\\int_a^b f\'(x)\\,dx = f(b) - f(a)',
      
      // Trigonometry
      'Pythagorean Identity': '\\sin^2\\theta + \\cos^2\\theta = 1',
      'Sine Rule': '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}',
      'Cosine Rule': 'c^2 = a^2 + b^2 - 2ab\\cos C',
      
      // Statistics
      'Mean': '\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i',
      'Standard Deviation': '\\sigma = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n}(x_i - \\mu)^2}',
      'Normal Distribution': 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}'
    }
  }
}

// Export for use in components
export default ProfessionalMathProcessor