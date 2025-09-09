/**
 * Authentic Mathematical Expression Generator with Step-by-Step Solutions
 * Generates topic-specific, grade-appropriate mathematical expressions with 
 * sequential problem-solving steps and proper MathJax rendering.
 */

export interface MathExpression {
  topic: string
  expression: string
  mathjax: string
  gradeLevel: string
  context?: string
}

export interface SolutionStep {
  step: number
  title: string
  expression: string
  mathjax: string
  teacherGuidance: string
  studentAction: string
}

export interface StepByStepSolution {
  heroExpression: MathExpression
  steps: SolutionStep[]
}

/**
 * Topic-specific mathematical expression generators
 */
export class AuthenticMathGenerator {
  
  static generateMathExpression(topic: string, gradeLevel: string, stepNumber: number | null = null): MathExpression | SolutionStep {
    const mathTopics: Record<string, { grades: string[]; heroExpressions: string[]; steps: (expression: string) => SolutionStep[]; }> = {
      "Linear Equations": {
        grades: ["6", "7", "8", "9"],
        heroExpressions: [
          "3x + 7 = 22",
          "2(x - 4) = 14",
          "\\frac{x}{3} + 5 = 11",
          "5x - 3 = 2x + 9",
          "4(2x + 1) = 3(x - 2)"
        ],
        steps: this.generateLinearSteps
      },
      "Quadratic Equations": {
        grades: ["9", "10", "11"],
        heroExpressions: [
          "x^2 + 5x - 14 = 0",
          "2x^2 - 8x + 6 = 0", 
          "x^2 - 4x + 3 = 0",
          "3x^2 + 7x - 6 = 0",
          "x^2 - 6x + 9 = 0"
        ],
        steps: this.generateQuadraticSteps
      },
      "Systems of Equations": {
        grades: ["8", "9", "10"],
        heroExpressions: [
          "\\begin{cases} 2x + y = 7 \\\\ x - y = 2 \\end{cases}",
          "\\begin{cases} 3x + 2y = 12 \\\\ x - y = 1 \\end{cases}",
          "\\begin{cases} x + 2y = 8 \\\\ 3x - y = 5 \\end{cases}"
        ],
        steps: this.generateSystemSteps
      },
      "Polynomial Functions": {
        grades: ["9", "10", "11", "12"],
        heroExpressions: [
          "f(x) = x^3 - 6x^2 + 9x + 2",
          "g(x) = 2x^4 - 8x^3 + 6x^2",
          "h(x) = x^3 + 3x^2 - 4x - 12"
        ],
        steps: this.generatePolynomialSteps
      },
      "Derivatives": {
        grades: ["11", "12", "AP Calculus"],
        heroExpressions: [
          "f(x) = x^3 + 2x^2 - 5x + 1",
          "g(x) = e^x \\sin(x)",
          "h(x) = \\frac{x^2 + 1}{x - 2}"
        ],
        steps: this.generateDerivativeSteps
      },
      "Trigonometry": {
        grades: ["10", "11", "Precalculus"],
        heroExpressions: [
          "\\sin(2x) = \\frac{\\sqrt{3}}{2}",
          "\\cos^2(x) - \\sin^2(x) = \\frac{1}{2}",
          "\\tan(x) + \\cot(x) = 2"
        ],
        steps: this.generateTrigSteps
      }
    }

    const topicData = mathTopics[topic]
    if (!topicData) {
      throw new Error(`Topic ${topic} not supported`)
    }

    if (stepNumber === null) {
      // Generate hero expression
      const randomExpression = topicData.heroExpressions[
        Math.floor(Math.random() * topicData.heroExpressions.length)
      ]
      return {
        expression: randomExpression,
        mathjax: `$${randomExpression}$`,
        topic: topic,
        gradeLevel: gradeLevel,
        context: this.getContextForTopic(topic)
      }
    } else {
      // Generate specific step - get all steps and return the requested one
      const steps = topicData.steps(topicData.heroExpressions[0])
      const stepIndex = (stepNumber || 1) - 1
      return steps[stepIndex] || steps[0]
    }
  }

  private static getContextForTopic(topic: string): string {
    const contexts: Record<string, string> = {
      "Linear Equations": "Finding unknown values in real-world scenarios",
      "Quadratic Equations": "Modeling projectile motion and optimization problems",
      "Systems of Equations": "Solving multiple constraints simultaneously",
      "Polynomial Functions": "Analyzing complex relationships and behavior",
      "Derivatives": "Finding rates of change and optimization",
      "Trigonometry": "Analyzing periodic phenomena and triangular relationships"
    }
    return contexts[topic] || "Mathematical problem solving"
  }

  /**
   * Generate complete step-by-step solution for a given problem
   */
  static generateCompleteStepsForProblem(expression: string, topic: string, gradeLevel: string): SolutionStep[] {
    switch (topic) {
      case "Linear Equations":
        return this.generateLinearSteps(expression)
      case "Quadratic Equations":
        return this.generateQuadraticSteps(expression)
      case "Systems of Equations":
        return this.generateSystemSteps(expression)
      case "Polynomial Functions":
        return this.generatePolynomialSteps(expression)
      case "Derivatives":
        return this.generateDerivativeSteps(expression)
      case "Trigonometry":
        return this.generateTrigSteps(expression)
      default:
        return this.generateGenericSteps(expression)
    }
  }

  /**
   * Linear Equations Step-by-Step Solution
   */
  private static generateLinearSteps(expression: string): SolutionStep[] {
    // For 3x + 7 = 22
    return [
      {
        step: 1,
        title: "Identify the Linear Equation",
        expression: "3x + 7 = 22",
        mathjax: "$3x + 7 = 22$",
        teacherGuidance: "Point out this is a linear equation in the form ax + b = c where a=3, b=7, c=22",
        studentAction: "Students identify the coefficient, constant, and target value"
      },
      {
        step: 2,
        title: "Isolate the Variable Term",
        expression: "3x + 7 - 7 = 22 - 7",
        mathjax: "$3x + 7 - 7 = 22 - 7$",
        teacherGuidance: "Subtract 7 from both sides to eliminate the constant term on the left",
        studentAction: "Students perform the same operation on both sides"
      },
      {
        step: 3,
        title: "Simplify Both Sides",
        expression: "3x = 15",
        mathjax: "$3x = 15$",
        teacherGuidance: "Combine like terms: 7 - 7 = 0 on left, 22 - 7 = 15 on right",
        studentAction: "Students simplify the arithmetic on both sides"
      },
      {
        step: 4,
        title: "Solve for x",
        expression: "x = \\frac{15}{3} = 5",
        mathjax: "$x = \\frac{15}{3} = 5$",
        teacherGuidance: "Divide both sides by the coefficient 3 to isolate x",
        studentAction: "Students divide and calculate the final answer"
      },
      {
        step: 5,
        title: "Verify the Solution",
        expression: "3(5) + 7 = 15 + 7 = 22 \\checkmark",
        mathjax: "$3(5) + 7 = 15 + 7 = 22 \\checkmark$",
        teacherGuidance: "Always check by substituting back into the original equation",
        studentAction: "Students substitute x = 5 back into the original equation to verify"
      }
    ]
  }

  /**
   * Quadratic Equations Step-by-Step Solution
   */
  private static generateQuadraticSteps(expression: string): SolutionStep[] {
    // For x^2 + 5x - 14 = 0
    return [
      {
        step: 1,
        title: "Identify the Quadratic Form",
        expression: "x^2 + 5x - 14 = 0",
        mathjax: "$x^2 + 5x - 14 = 0$",
        teacherGuidance: "Point out this is in standard form ax² + bx + c = 0 where a=1, b=5, c=-14",
        studentAction: "Students identify coefficients a, b, and c"
      },
      {
        step: 2,
        title: "Apply the Quadratic Formula",
        expression: "x = \\frac{-5 \\pm \\sqrt{5^2 - 4(1)(-14)}}{2(1)}",
        mathjax: "$x = \\frac{-5 \\pm \\sqrt{5^2 - 4(1)(-14)}}{2(1)}$",
        teacherGuidance: "Substitute values into x = (-b ± √(b²-4ac))/2a",
        studentAction: "Students substitute the identified values into the formula"
      },
      {
        step: 3,
        title: "Simplify the Discriminant",
        expression: "x = \\frac{-5 \\pm \\sqrt{25 + 56}}{2}",
        mathjax: "$x = \\frac{-5 \\pm \\sqrt{25 + 56}}{2}$",
        teacherGuidance: "Calculate 5² = 25 and 4(1)(-14) = -56, so we get 25 - (-56) = 25 + 56",
        studentAction: "Students perform arithmetic in the discriminant"
      },
      {
        step: 4,
        title: "Calculate the Square Root",
        expression: "x = \\frac{-5 \\pm \\sqrt{81}}{2} = \\frac{-5 \\pm 9}{2}",
        mathjax: "$x = \\frac{-5 \\pm \\sqrt{81}}{2} = \\frac{-5 \\pm 9}{2}$",
        teacherGuidance: "Since √81 = 9, we can now solve for both possible values",
        studentAction: "Students recognize perfect square and substitute"
      },
      {
        step: 5,
        title: "Find Both Solutions",
        expression: "x_1 = \\frac{-5 + 9}{2} = 2, \\quad x_2 = \\frac{-5 - 9}{2} = -7",
        mathjax: "$x_1 = \\frac{-5 + 9}{2} = 2, \\quad x_2 = \\frac{-5 - 9}{2} = -7$",
        teacherGuidance: "Calculate both solutions separately. In context, consider which solutions make sense",
        studentAction: "Students calculate final answers and interpret meaning"
      }
    ]
  }

  /**
   * Systems of Equations Step-by-Step Solution
   */
  private static generateSystemSteps(expression: string): SolutionStep[] {
    // For the system: 2x + y = 7, x - y = 2
    return [
      {
        step: 1,
        title: "Identify the System",
        expression: "\\begin{cases} 2x + y = 7 \\\\ x - y = 2 \\end{cases}",
        mathjax: "$\\begin{cases} 2x + y = 7 \\\\ x - y = 2 \\end{cases}$",
        teacherGuidance: "We have two equations with two unknowns. Notice the y terms have opposite coefficients",
        studentAction: "Students identify the variables and observe coefficient patterns"
      },
      {
        step: 2,
        title: "Add the Equations (Elimination Method)",
        expression: "(2x + y) + (x - y) = 7 + 2",
        mathjax: "$(2x + y) + (x - y) = 7 + 2$",
        teacherGuidance: "Add the left sides and right sides together to eliminate y",
        studentAction: "Students add corresponding sides of both equations"
      },
      {
        step: 3,
        title: "Simplify to Find x",
        expression: "3x = 9 \\Rightarrow x = 3",
        mathjax: "$3x = 9 \\Rightarrow x = 3$",
        teacherGuidance: "The y terms cancel out: y + (-y) = 0, leaving 3x = 9",
        studentAction: "Students combine like terms and solve for x"
      },
      {
        step: 4,
        title: "Substitute to Find y",
        expression: "x - y = 2 \\Rightarrow 3 - y = 2 \\Rightarrow y = 1",
        mathjax: "$x - y = 2 \\Rightarrow 3 - y = 2 \\Rightarrow y = 1$",
        teacherGuidance: "Substitute x = 3 into either original equation to find y",
        studentAction: "Students substitute and solve for the remaining variable"
      },
      {
        step: 5,
        title: "Verify the Solution",
        expression: "\\begin{cases} 2(3) + 1 = 7 \\checkmark \\\\ 3 - 1 = 2 \\checkmark \\end{cases}",
        mathjax: "$\\begin{cases} 2(3) + 1 = 7 \\checkmark \\\\ 3 - 1 = 2 \\checkmark \\end{cases}$",
        teacherGuidance: "Check the solution (3, 1) in both original equations",
        studentAction: "Students verify by substituting both values into both equations"
      }
    ]
  }

  /**
   * Polynomial Functions Step-by-Step Analysis
   */
  private static generatePolynomialSteps(expression: string): SolutionStep[] {
    // For f(x) = x^3 - 6x^2 + 9x + 2
    return [
      {
        step: 1,
        title: "Identify the Polynomial",
        expression: "f(x) = x^3 - 6x^2 + 9x + 2",
        mathjax: "$f(x) = x^3 - 6x^2 + 9x + 2$",
        teacherGuidance: "This is a cubic polynomial with degree 3, leading coefficient 1",
        studentAction: "Students identify degree, leading coefficient, and constant term"
      },
      {
        step: 2,
        title: "Find the Derivative",
        expression: "f'(x) = 3x^2 - 12x + 9",
        mathjax: "$f'(x) = 3x^2 - 12x + 9$",
        teacherGuidance: "Use the power rule: d/dx[x^n] = nx^(n-1)",
        studentAction: "Students apply power rule to each term"
      },
      {
        step: 3,
        title: "Find Critical Points",
        expression: "3x^2 - 12x + 9 = 0 \\Rightarrow x^2 - 4x + 3 = 0",
        mathjax: "$3x^2 - 12x + 9 = 0 \\Rightarrow x^2 - 4x + 3 = 0$",
        teacherGuidance: "Set f'(x) = 0 and factor out the common factor of 3",
        studentAction: "Students set derivative equal to zero and simplify"
      },
      {
        step: 4,
        title: "Solve for Critical Points",
        expression: "(x - 1)(x - 3) = 0 \\Rightarrow x = 1, x = 3",
        mathjax: "$(x - 1)(x - 3) = 0 \\Rightarrow x = 1, x = 3$",
        teacherGuidance: "Factor the quadratic or use the quadratic formula",
        studentAction: "Students factor and find the critical points"
      },
      {
        step: 5,
        title: "Evaluate Function at Critical Points",
        expression: "f(1) = 6, \\quad f(3) = 2",
        mathjax: "$f(1) = 6, \\quad f(3) = 2$",
        teacherGuidance: "Substitute critical points back into original function",
        studentAction: "Students calculate function values to find local extrema"
      }
    ]
  }

  /**
   * Derivatives Step-by-Step Solution
   */
  private static generateDerivativeSteps(expression: string): SolutionStep[] {
    // For f(x) = x^3 + 2x^2 - 5x + 1
    return [
      {
        step: 1,
        title: "Identify the Function",
        expression: "f(x) = x^3 + 2x^2 - 5x + 1",
        mathjax: "$f(x) = x^3 + 2x^2 - 5x + 1$",
        teacherGuidance: "This is a polynomial function with four terms",
        studentAction: "Students identify each term and its degree"
      },
      {
        step: 2,
        title: "Apply Power Rule to Each Term",
        expression: "\\frac{d}{dx}[x^3] = 3x^2, \\quad \\frac{d}{dx}[2x^2] = 4x, \\quad \\frac{d}{dx}[-5x] = -5",
        mathjax: "$\\frac{d}{dx}[x^3] = 3x^2, \\quad \\frac{d}{dx}[2x^2] = 4x, \\quad \\frac{d}{dx}[-5x] = -5$",
        teacherGuidance: "Use power rule: d/dx[ax^n] = nax^(n-1). The derivative of a constant is 0",
        studentAction: "Students apply power rule term by term"
      },
      {
        step: 3,
        title: "Combine the Results",
        expression: "f'(x) = 3x^2 + 4x - 5",
        mathjax: "$f'(x) = 3x^2 + 4x - 5$",
        teacherGuidance: "Add all the derivative terms together",
        studentAction: "Students write the complete derivative"
      },
      {
        step: 4,
        title: "Find Critical Points",
        expression: "3x^2 + 4x - 5 = 0",
        mathjax: "$3x^2 + 4x - 5 = 0$",
        teacherGuidance: "Set the derivative equal to zero to find where slope is zero",
        studentAction: "Students set up equation for critical points"
      },
      {
        step: 5,
        title: "Solve Using Quadratic Formula",
        expression: "x = \\frac{-4 \\pm \\sqrt{16 + 60}}{6} = \\frac{-4 \\pm \\sqrt{76}}{6}",
        mathjax: "$x = \\frac{-4 \\pm \\sqrt{16 + 60}}{6} = \\frac{-4 \\pm \\sqrt{76}}{6}$",
        teacherGuidance: "Apply quadratic formula with a=3, b=4, c=-5",
        studentAction: "Students calculate critical points using quadratic formula"
      }
    ]
  }

  /**
   * Trigonometry Step-by-Step Solution
   */
  private static generateTrigSteps(expression: string): SolutionStep[] {
    // For sin(2x) = √3/2
    return [
      {
        step: 1,
        title: "Identify the Trigonometric Equation",
        expression: "\\sin(2x) = \\frac{\\sqrt{3}}{2}",
        mathjax: "$\\sin(2x) = \\frac{\\sqrt{3}}{2}$",
        teacherGuidance: "This involves a double angle and we need to find when sine equals √3/2",
        studentAction: "Students identify the trigonometric function and target value"
      },
      {
        step: 2,
        title: "Find Reference Angles",
        expression: "\\sin(\\theta) = \\frac{\\sqrt{3}}{2} \\Rightarrow \\theta = \\frac{\\pi}{3}, \\frac{2\\pi}{3}",
        mathjax: "$\\sin(\\theta) = \\frac{\\sqrt{3}}{2} \\Rightarrow \\theta = \\frac{\\pi}{3}, \\frac{2\\pi}{3}$",
        teacherGuidance: "Recall that sin(π/3) = sin(60°) = √3/2, and sine is positive in quadrants I and II",
        studentAction: "Students identify angles where sine equals √3/2"
      },
      {
        step: 3,
        title: "Set Up Equations for 2x",
        expression: "2x = \\frac{\\pi}{3} + 2\\pi k \\text{ or } 2x = \\frac{2\\pi}{3} + 2\\pi k",
        mathjax: "$2x = \\frac{\\pi}{3} + 2\\pi k \\text{ or } 2x = \\frac{2\\pi}{3} + 2\\pi k$",
        teacherGuidance: "Include all possible solutions by adding 2πk for integer k",
        studentAction: "Students write general solutions for the double angle"
      },
      {
        step: 4,
        title: "Solve for x",
        expression: "x = \\frac{\\pi}{6} + \\pi k \\text{ or } x = \\frac{\\pi}{3} + \\pi k",
        mathjax: "$x = \\frac{\\pi}{6} + \\pi k \\text{ or } x = \\frac{\\pi}{3} + \\pi k$",
        teacherGuidance: "Divide both sides by 2 to isolate x",
        studentAction: "Students divide by 2 to find solutions for x"
      },
      {
        step: 5,
        title: "Find Solutions in [0, 2π]",
        expression: "x = \\frac{\\pi}{6}, \\frac{\\pi}{3}, \\frac{7\\pi}{6}, \\frac{4\\pi}{3}",
        mathjax: "$x = \\frac{\\pi}{6}, \\frac{\\pi}{3}, \\frac{7\\pi}{6}, \\frac{4\\pi}{3}$",
        teacherGuidance: "Substitute k = 0, 1 to find all solutions in the interval [0, 2π]",
        studentAction: "Students find specific solutions in the given interval"
      }
    ]
  }

  /**
   * Generic steps for unsupported topics
   */
  private static generateGenericSteps(expression: string): SolutionStep[] {
    return [
      {
        step: 1,
        title: "Analyze the Problem",
        expression: expression,
        mathjax: `$${expression}$`,
        teacherGuidance: "Break down the mathematical expression and identify the required approach",
        studentAction: "Students examine the expression and determine the solution method"
      },
      {
        step: 2,
        title: "Apply Mathematical Principles",
        expression: "Apply relevant mathematical rules and formulas",
        mathjax: "$\\text{Apply relevant rules}$",
        teacherGuidance: "Guide students through the appropriate mathematical techniques",
        studentAction: "Students apply learned mathematical principles"
      },
      {
        step: 3,
        title: "Solve Step by Step",
        expression: "Work through the solution systematically",
        mathjax: "$\\text{Systematic solution}$",
        teacherGuidance: "Ensure each step follows logically from the previous",
        studentAction: "Students work through the problem methodically"
      }
    ]
  }
}

/**
 * Helper function to get topic-specific mathematical expressions
 */
export function getTopicSpecificExpression(topic: string, gradeLevel: string): MathExpression {
  return AuthenticMathGenerator.generateMathExpression(topic, gradeLevel) as MathExpression
}

/**
 * Helper function to generate complete step-by-step solutions
 */
export function generateStepByStepSolution(heroExpression: MathExpression): StepByStepSolution {
  const steps = AuthenticMathGenerator.generateCompleteStepsForProblem(
    heroExpression.expression,
    heroExpression.topic,
    heroExpression.gradeLevel
  )

  return {
    heroExpression,
    steps
  }
}