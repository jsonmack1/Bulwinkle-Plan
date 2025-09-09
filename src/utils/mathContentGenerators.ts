import { convertToLaTeX } from './mathUtils'

/**
 * Mathematical content generators for enriched lesson plans
 */

export interface MathProblem {
  expression: string
  latex: string
  solution?: string
  difficulty: 'basic' | 'intermediate' | 'advanced'
  type: string
}

export interface MathLesson {
  rules: string[]
  examples: MathProblem[]
  practiceProblems: MathProblem[]
  contextProblems: MathProblem[]
}

/**
 * Generates polynomial functions with random coefficients
 */
export class PolynomialGenerator {
  static generateQuadratic(difficulty: 'basic' | 'intermediate' | 'advanced' = 'basic'): MathProblem {
    let a: number, b: number, c: number

    switch (difficulty) {
      case 'basic':
        a = Math.floor(Math.random() * 3) + 1 // 1-3
        b = Math.floor(Math.random() * 7) - 3 // -3 to 3
        c = Math.floor(Math.random() * 11) - 5 // -5 to 5
        break
      case 'intermediate':
        a = Math.floor(Math.random() * 5) + 1 // 1-5
        b = Math.floor(Math.random() * 21) - 10 // -10 to 10
        c = Math.floor(Math.random() * 21) - 10 // -10 to 10
        break
      case 'advanced':
        a = Math.floor(Math.random() * 10) + 1 // 1-10
        b = Math.floor(Math.random() * 41) - 20 // -20 to 20
        c = Math.floor(Math.random() * 41) - 20 // -20 to 20
        break
    }

    const expression = `f(x) = ${a}x^2 ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c}`
    const latex = convertToLaTeX(expression)

    return {
      expression,
      latex,
      difficulty,
      type: 'quadratic'
    }
  }

  static generateCubic(difficulty: 'basic' | 'intermediate' | 'advanced' = 'intermediate'): MathProblem {
    let a: number, b: number, c: number, d: number

    switch (difficulty) {
      case 'basic':
        a = 1
        b = Math.floor(Math.random() * 5) - 2 // -2 to 2
        c = Math.floor(Math.random() * 5) - 2 // -2 to 2
        d = Math.floor(Math.random() * 7) - 3 // -3 to 3
        break
      case 'intermediate':
        a = Math.floor(Math.random() * 3) + 1 // 1-3
        b = Math.floor(Math.random() * 11) - 5 // -5 to 5
        c = Math.floor(Math.random() * 11) - 5 // -5 to 5
        d = Math.floor(Math.random() * 11) - 5 // -5 to 5
        break
      case 'advanced':
        a = Math.floor(Math.random() * 5) + 1 // 1-5
        b = Math.floor(Math.random() * 21) - 10 // -10 to 10
        c = Math.floor(Math.random() * 21) - 10 // -10 to 10
        d = Math.floor(Math.random() * 21) - 10 // -10 to 10
        break
    }

    const expression = `f(x) = ${a}x^3 ${b >= 0 ? '+' : ''}${b}x^2 ${c >= 0 ? '+' : ''}${c}x ${d >= 0 ? '+' : ''}${d}`
    const latex = convertToLaTeX(expression)

    return {
      expression,
      latex,
      difficulty,
      type: 'cubic'
    }
  }
}

/**
 * Generates derivative problems with worked solutions
 */
export class DerivativeGenerator {
  static generatePowerRule(difficulty: 'basic' | 'intermediate' | 'advanced' = 'basic'): MathProblem {
    let coefficient: number, exponent: number

    switch (difficulty) {
      case 'basic':
        coefficient = Math.floor(Math.random() * 5) + 1 // 1-5
        exponent = Math.floor(Math.random() * 5) + 2 // 2-6
        break
      case 'intermediate':
        coefficient = Math.floor(Math.random() * 10) + 1 // 1-10
        exponent = Math.floor(Math.random() * 8) + 2 // 2-9
        break
      case 'advanced':
        coefficient = Math.floor(Math.random() * 20) + 1 // 1-20
        exponent = Math.floor(Math.random() * 12) + 2 // 2-13
        break
    }

    const expression = `f(x) = ${coefficient}x^${exponent}`
    const latex = convertToLaTeX(expression)
    
    const derivativeCoeff = coefficient * exponent
    const derivativeExp = exponent - 1
    const solutionExpression = derivativeExp === 1 ? `f'(x) = ${derivativeCoeff}x` : `f'(x) = ${derivativeCoeff}x^${derivativeExp}`
    const solution = convertToLaTeX(solutionExpression)

    return {
      expression,
      latex,
      solution,
      difficulty,
      type: 'power_rule'
    }
  }

  static generateProductRule(difficulty: 'basic' | 'intermediate' | 'advanced' = 'intermediate'): MathProblem {
    const functions = {
      basic: [
        { f: 'x', g: 'x^2' },
        { f: '2x', g: 'x^3' },
        { f: 'x^2', g: 'x^3' }
      ],
      intermediate: [
        { f: 'x^2', g: 'sin(x)' },
        { f: '3x', g: 'cos(x)' },
        { f: 'x^3', g: 'e^x' }
      ],
      advanced: [
        { f: 'x^2 + 1', g: 'sin(x)' },
        { f: 'e^x', g: 'cos(x)' },
        { f: 'ln(x)', g: 'x^3' }
      ]
    }

    const funcPair = functions[difficulty][Math.floor(Math.random() * functions[difficulty].length)]
    const expression = `f(x) = (${funcPair.f})(${funcPair.g})`
    const latex = convertToLaTeX(expression)

    return {
      expression,
      latex,
      solution: `Use the product rule: (uv)' = u'v + uv'`,
      difficulty,
      type: 'product_rule'
    }
  }

  static generateChainRule(difficulty: 'basic' | 'intermediate' | 'advanced' = 'advanced'): MathProblem {
    const compositions = {
      basic: [
        '(x^2 + 1)^2',
        '(2x + 3)^3',
        'sin(2x)'
      ],
      intermediate: [
        '(x^3 - 2x)^4',
        'cos(x^2)',
        'e^(2x + 1)'
      ],
      advanced: [
        'sin(x^2 + 3x)',
        'ln(x^2 + 1)',
        'e^(sin(x))'
      ]
    }

    const comp = compositions[difficulty][Math.floor(Math.random() * compositions[difficulty].length)]
    const expression = `f(x) = ${comp}`
    const latex = convertToLaTeX(expression)

    return {
      expression,
      latex,
      solution: `Use the chain rule: (f(g(x)))' = f'(g(x)) · g'(x)`,
      difficulty,
      type: 'chain_rule'
    }
  }
}

/**
 * Generates context problems (position/velocity/acceleration)
 */
export class ContextProblemGenerator {
  static generatePositionVelocity(difficulty: 'basic' | 'intermediate' | 'advanced' = 'basic'): MathProblem {
    const scenarios = {
      basic: [
        { position: 't^2 + 3t', context: 'A ball thrown upward' },
        { position: '2t^2 - t', context: 'A car accelerating' },
        { position: '-16t^2 + 64t', context: 'A projectile launched' }
      ],
      intermediate: [
        { position: 't^3 - 6t^2 + 9t', context: 'A particle moving along a line' },
        { position: '2t^3 - 3t^2 + t', context: 'An object in motion' },
        { position: '-4.9t^2 + 20t + 2', context: 'A rocket ascending' }
      ],
      advanced: [
        { position: 'sin(t) + cos(2t)', context: 'Oscillating motion' },
        { position: 'e^(-t) * cos(t)', context: 'Damped oscillation' },
        { position: 't * ln(t)', context: 'Complex motion pattern' }
      ]
    }

    const scenario = scenarios[difficulty][Math.floor(Math.random() * scenarios[difficulty].length)]
    const expression = `s(t) = ${scenario.position}`
    const latex = convertToLaTeX(expression)

    return {
      expression,
      latex,
      solution: `Velocity: v(t) = s'(t), Acceleration: a(t) = v'(t) = s''(t) | Context: ${scenario.context}`,
      difficulty,
      type: 'context_physics'
    }
  }

  static generateOptimization(difficulty: 'basic' | 'intermediate' | 'advanced' = 'intermediate'): MathProblem {
    const problems = {
      basic: [
        'Find the maximum area of a rectangle with perimeter 40',
        'Minimize the surface area of a cylinder with volume 100',
        'Find the minimum cost for a fence around a square garden'
      ],
      intermediate: [
        'A farmer has 200 meters of fencing to enclose a rectangular field',
        'Find the dimensions of a box with maximum volume from a 10×10 square',
        'Minimize the cost of materials for a cylindrical can'
      ],
      advanced: [
        'Optimize the flight path to minimize fuel consumption',
        'Find the optimal pricing strategy to maximize revenue',
        'Design a container with minimum material cost and given constraints'
      ]
    }

    const problem = problems[difficulty][Math.floor(Math.random() * problems[difficulty].length)]

    return {
      expression: problem,
      latex: problem,
      solution: 'Set up constraint equations, find critical points using derivatives',
      difficulty,
      type: 'optimization'
    }
  }
}

/**
 * Mathematical rule explanations with LaTeX notation
 */
export class MathRuleGenerator {
  static getPowerRule(): string {
    return `
**Power Rule**
[math]d/dx[x^n] = nx^(n-1)[/math]

**Examples:**
- [math]d/dx[x^3] = 3x^2[/math]
- [math]d/dx[x^5] = 5x^4[/math]
- [math]d/dx[x^(1/2)] = (1/2)x^(-1/2)[/math]
    `.trim()
  }

  static getProductRule(): string {
    return `
**Product Rule**
[math]d/dx[f(x)g(x)] = f'(x)g(x) + f(x)g'(x)[/math]

**Memory Device:** "First times derivative of second, plus second times derivative of first"

**Example:**
Let [math]f(x) = x^2[/math] and [math]g(x) = sin(x)[/math]
[math]d/dx[x^2 sin(x)] = 2x sin(x) + x^2 cos(x)[/math]
    `.trim()
  }

  static getQuotientRule(): string {
    return `
**Quotient Rule**
[math]d/dx[f(x)/g(x)] = (f'(x)g(x) - f(x)g'(x))/(g(x))^2[/math]

**Memory Device:** "Bottom times derivative of top, minus top times derivative of bottom, all over bottom squared"

**Example:**
[math]d/dx[x^2/sin(x)] = (2x sin(x) - x^2 cos(x))/(sin(x))^2[/math]
    `.trim()
  }

  static getChainRule(): string {
    return `
**Chain Rule**
[math]d/dx[f(g(x))] = f'(g(x)) · g'(x)[/math]

**Memory Device:** "Derivative of outside times derivative of inside"

**Example:**
[math]d/dx[sin(x^2)] = cos(x^2) · 2x = 2x cos(x^2)[/math]
    `.trim()
  }

  static getIntegrationByParts(): string {
    return `
**Integration by Parts**
[math]∫ u dv = uv - ∫ v du[/math]

**Memory Device:** "LIATE" - choose u in order: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential

**Example:**
[math]∫ x e^x dx[/math]
Let [math]u = x[/math], [math]dv = e^x dx[/math]
Then [math]du = dx[/math], [math]v = e^x[/math]
[math]∫ x e^x dx = x e^x - ∫ e^x dx = x e^x - e^x + C = e^x(x - 1) + C[/math]
    `.trim()
  }
}

/**
 * Generate practice problem sets with varied difficulty
 */
export class PracticeProblemGenerator {
  static generateSet(type: 'polynomial' | 'derivative' | 'context', count: number = 5, difficulty: 'basic' | 'intermediate' | 'advanced' = 'basic'): MathProblem[] {
    const problems: MathProblem[] = []

    for (let i = 0; i < count; i++) {
      switch (type) {
        case 'polynomial':
          if (Math.random() < 0.7) {
            problems.push(PolynomialGenerator.generateQuadratic(difficulty))
          } else {
            problems.push(PolynomialGenerator.generateCubic(difficulty))
          }
          break
        case 'derivative':
          const rand = Math.random()
          if (rand < 0.4) {
            problems.push(DerivativeGenerator.generatePowerRule(difficulty))
          } else if (rand < 0.7) {
            problems.push(DerivativeGenerator.generateProductRule(difficulty))
          } else {
            problems.push(DerivativeGenerator.generateChainRule(difficulty))
          }
          break
        case 'context':
          if (Math.random() < 0.6) {
            problems.push(ContextProblemGenerator.generatePositionVelocity(difficulty))
          } else {
            problems.push(ContextProblemGenerator.generateOptimization(difficulty))
          }
          break
      }
    }

    return problems
  }

  static generateMixedSet(count: number = 8, difficulty: 'basic' | 'intermediate' | 'advanced' = 'basic'): MathProblem[] {
    const problems: MathProblem[] = []
    const types: ('polynomial' | 'derivative' | 'context')[] = ['polynomial', 'derivative', 'context']

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)]
      const problemSet = this.generateSet(type, 1, difficulty)
      problems.push(...problemSet)
    }

    return problems
  }
}

/**
 * Grade-level appropriate content selection
 */
export class GradeLevelMathContent {
  static getContentForGrade(gradeLevel: string): {
    rules: string[]
    problemTypes: string[]
    difficulty: 'basic' | 'intermediate' | 'advanced'
    focusAreas: string[]
  } {
    const grade = gradeLevel.toLowerCase()

    if (grade.includes('ap calculus') || grade.includes('calculus')) {
      return {
        rules: [
          MathRuleGenerator.getPowerRule(),
          MathRuleGenerator.getProductRule(),
          MathRuleGenerator.getQuotientRule(),
          MathRuleGenerator.getChainRule(),
          MathRuleGenerator.getIntegrationByParts()
        ],
        problemTypes: ['derivative', 'context', 'polynomial'],
        difficulty: 'advanced',
        focusAreas: ['Limits', 'Derivatives', 'Integrals', 'Applications', 'Fundamental Theorem']
      }
    }

    if (grade.includes('precalculus') || grade.includes('pre-calculus')) {
      return {
        rules: [
          MathRuleGenerator.getPowerRule(),
          MathRuleGenerator.getProductRule()
        ],
        problemTypes: ['polynomial', 'context'],
        difficulty: 'intermediate',
        focusAreas: ['Functions', 'Polynomials', 'Trigonometry', 'Exponentials', 'Logarithms']
      }
    }

    if (grade.includes('algebra ii') || grade.includes('algebra 2')) {
      return {
        rules: [MathRuleGenerator.getPowerRule()],
        problemTypes: ['polynomial'],
        difficulty: 'intermediate',
        focusAreas: ['Quadratic Functions', 'Exponential Functions', 'Logarithmic Functions', 'Rational Functions']
      }
    }

    if (grade.includes('algebra i') || grade.includes('algebra 1') || grade.includes('9th') || grade.includes('freshman')) {
      return {
        rules: [],
        problemTypes: ['polynomial'],
        difficulty: 'basic',
        focusAreas: ['Linear Functions', 'Quadratic Functions', 'Systems of Equations', 'Inequalities']
      }
    }

    if (grade.includes('geometry')) {
      return {
        rules: [],
        problemTypes: [],
        difficulty: 'basic',
        focusAreas: ['Area and Perimeter', 'Volume', 'Pythagorean Theorem', 'Trigonometric Ratios']
      }
    }

    // Default for other grades
    return {
      rules: [],
      problemTypes: ['polynomial'],
      difficulty: 'basic',
        focusAreas: ['Basic Operations', 'Functions', 'Graphing']
    }
  }
}

/**
 * Main function to generate complete math lesson content
 */
export function generateMathLessonContent(
  gradeLevel: string,
  topic: string
): MathLesson {
  const gradeContent = GradeLevelMathContent.getContentForGrade(gradeLevel)
  
  const lesson: MathLesson = {
    rules: gradeContent.rules,
    examples: [],
    practiceProblems: [],
    contextProblems: []
  }

  // Generate examples based on topic and grade level
  if (gradeContent.problemTypes.includes('polynomial')) {
    lesson.examples.push(
      PolynomialGenerator.generateQuadratic(gradeContent.difficulty),
      PolynomialGenerator.generateCubic(gradeContent.difficulty)
    )
  }

  if (gradeContent.problemTypes.includes('derivative')) {
    lesson.examples.push(
      DerivativeGenerator.generatePowerRule(gradeContent.difficulty),
      DerivativeGenerator.generateProductRule(gradeContent.difficulty)
    )
  }

  if (gradeContent.problemTypes.includes('context')) {
    lesson.contextProblems.push(
      ContextProblemGenerator.generatePositionVelocity(gradeContent.difficulty),
      ContextProblemGenerator.generateOptimization(gradeContent.difficulty)
    )
  }

  // Generate practice problems
  lesson.practiceProblems = PracticeProblemGenerator.generateMixedSet(6, gradeContent.difficulty)

  return lesson
}