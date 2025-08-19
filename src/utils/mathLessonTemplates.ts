/**
 * Math-specific lesson templates with proper mathematical notation
 */

export interface MathLessonTemplate {
  title: string
  gradeLevel: string[]
  openingHook: string
  mainContent: string
  practiceSection: string
  assessmentIdeas: string
  differentiationTips: string
}

export const mathLessonTemplates = {
  
  /**
   * AP Calculus Templates
   */
  apCalculusDerivatives: {
    title: "Derivative Rules and Applications",
    gradeLevel: ["AP Calculus", "Calculus AB", "Calculus BC"],
    openingHook: `
**Opening Hook: Real-World Derivative Application**

Present this scenario: "A rocket's height is modeled by [math]h(t) = -16t^2 + 96t + 100[/math] feet after t seconds. At what exact moment is the rocket moving fastest upward?"

**Discussion Starter:** "How can we find the instantaneous rate of change?"
- Connect to students' prior knowledge of average rate of change
- Build toward the concept of limits and instantaneous rates
- Preview how derivatives solve real optimization problems
`,
    
    mainContent: `
**Phase 1: Derivative Rules Workshop (25 minutes)**

**Essential Rules to Master:**

**Power Rule**
[math]d/dx[x^n] = nx^(n-1)[/math]

**Step-by-Step Example:**
Find [math]d/dx[3x^4 - 2x^3 + 5x - 7][/math]

Step 1: Apply power rule to each term
- [math]d/dx[3x^4] = 3 \\cdot 4x^{4-1} = 12x^3[/math]
- [math]d/dx[-2x^3] = -2 \\cdot 3x^{3-1} = -6x^2[/math]
- [math]d/dx[5x] = 5 \\cdot 1x^{1-1} = 5[/math]
- [math]d/dx[-7] = 0[/math] (constant rule)

Step 2: Combine results
[math]f'(x) = 12x^3 - 6x^2 + 5[/math]

**Product Rule**
[math]d/dx[f(x)g(x)] = f'(x)g(x) + f(x)g'(x)[/math]

**Worked Example:**
Find [math]d/dx[x^2 \\sin(x)][/math]

Let [math]f(x) = x^2[/math] and [math]g(x) = \\sin(x)[/math]
- [math]f'(x) = 2x[/math]
- [math]g'(x) = \\cos(x)[/math]

Solution: [math]d/dx[x^2 \\sin(x)] = 2x \\sin(x) + x^2 \\cos(x)[/math]

**Chain Rule**
[math]d/dx[f(g(x))] = f'(g(x)) \\cdot g'(x)[/math]

**Worked Example:**
Find [math]d/dx[\\sin(x^2 + 1)][/math]

Let [math]f(u) = \\sin(u)[/math] and [math]g(x) = x^2 + 1[/math]
- [math]f'(u) = \\cos(u)[/math]
- [math]g'(x) = 2x[/math]

Solution: [math]d/dx[\\sin(x^2 + 1)] = \\cos(x^2 + 1) \\cdot 2x = 2x\\cos(x^2 + 1)[/math]

**Phase 2: Application Problems (20 minutes)**

**Position, Velocity, and Acceleration**

Given position function [math]s(t) = t^3 - 6t^2 + 9t + 4[/math]:

1. **Velocity:** [math]v(t) = s'(t) = 3t^2 - 12t + 9[/math]
2. **Acceleration:** [math]a(t) = v'(t) = s''(t) = 6t - 12[/math]
3. **When is velocity zero?** Set [math]3t^2 - 12t + 9 = 0[/math]
   - Factor: [math]3(t^2 - 4t + 3) = 3(t-1)(t-3) = 0[/math]
   - Solutions: [math]t = 1[/math] and [math]t = 3[/math] seconds

**Related Rates Problem**
A balloon is being inflated. If the radius increases at 2 cm/sec, how fast is the volume changing when r = 5 cm?

Given: [math]V = \\frac{4}{3}\\pi r^3[/math] and [math]\\frac{dr}{dt} = 2[/math] cm/sec

Step 1: Differentiate implicitly
[math]\\frac{dV}{dt} = \\frac{4}{3}\\pi \\cdot 3r^2 \\cdot \\frac{dr}{dt} = 4\\pi r^2 \\cdot \\frac{dr}{dt}[/math]

Step 2: Substitute known values
[math]\\frac{dV}{dt} = 4\\pi (5)^2 \\cdot 2 = 200\\pi[/math] cm³/sec
`,

    practiceSection: `
**Individual Practice Problems (15 minutes)**

**Derivative Computation:**
1. [math]f(x) = 2x^5 - 3x^4 + x^2 - 7[/math]
2. [math]g(x) = x^3 \\cos(x)[/math] (use product rule)
3. [math]h(x) = \\sin(3x^2 - 1)[/math] (use chain rule)
4. [math]k(x) = \\frac{x^2 + 1}{x^3 - 2}[/math] (use quotient rule)

**Application Problems:**
5. A particle moves along a line with position [math]s(t) = 2t^3 - 9t^2 + 12t - 3[/math]. Find when the particle is at rest.
6. Water flows into a conical tank at 3 ft³/min. The tank has radius 4 ft and height 8 ft. How fast is the water level rising when the water is 6 ft deep?

**Challenge Extension:**
7. Find the equation of the tangent line to [math]y = x^3 - 2x^2 + 1[/math] at the point where [math]x = 2[/math].
`,

    assessmentIdeas: `
**Formative Assessment:**
- Exit ticket: "Explain the difference between the product rule and chain rule in your own words"
- Quick computation check: Students solve [math]d/dx[x^2 e^x][/math] using product rule
- Peer explanation: Students explain their related rates solution process to a partner

**AP Exam Preparation:**
- Multiple choice practice with derivatives requiring multiple rules
- Free response problem involving optimization with calculus justification
- Calculator vs. non-calculator problems to build fluency

**Evidence of Mastery:**
- Correct application of derivative rules with proper notation
- Clear mathematical communication in step-by-step solutions
- Ability to connect derivative concepts to real-world contexts
`,

    differentiationTips: `
**Support for Struggling Students:**
- Provide derivative rule reference cards with examples
- Start with simpler polynomial functions before moving to trigonometric
- Use color coding to identify inner and outer functions in chain rule problems
- Offer additional practice with basic power rule before combining rules

**Extensions for Advanced Students:**
- Implicit differentiation problems
- Higher-order derivatives and their applications
- Introduction to differential equations
- Research project on historical development of calculus

**Language Support:**
- Mathematical vocabulary cards: derivative, instantaneous rate, tangent line
- Sentence frames: "To find the derivative of..., I will use... because..."
- Visual representations of rate of change concepts
`
  },

  /**
   * Algebra II Templates
   */
  algebraIIQuadratics: {
    title: "Quadratic Functions and Applications",
    gradeLevel: ["Algebra II", "Algebra 2", "11th Grade", "Pre-Calculus"],
    openingHook: `
**Opening Hook: Projectile Motion Challenge**

"A basketball player shoots from 6 feet high. The ball's height follows [math]h(t) = -16t^2 + 24t + 6[/math]. Will it go through a 10-foot hoop?"

**Discussion Questions:**
- What does each part of the equation represent?
- How can we find the maximum height?
- When does the ball hit the ground?
`,

    mainContent: `
**Phase 1: Standard Form and Vertex Form (20 minutes)**

**Standard Form:** [math]f(x) = ax^2 + bx + c[/math]
**Vertex Form:** [math]f(x) = a(x - h)^2 + k[/math]

**Converting Standard to Vertex Form (Completing the Square):**

Example: Convert [math]f(x) = 2x^2 - 8x + 3[/math] to vertex form

Step 1: Factor out coefficient of [math]x^2[/math]
[math]f(x) = 2(x^2 - 4x) + 3[/math]

Step 2: Complete the square inside parentheses
Take half of the x-coefficient: [math](-4) ÷ 2 = -2[/math]
Square it: [math](-2)^2 = 4[/math]

[math]f(x) = 2(x^2 - 4x + 4 - 4) + 3[/math]
[math]f(x) = 2((x - 2)^2 - 4) + 3[/math]
[math]f(x) = 2(x - 2)^2 - 8 + 3[/math]
[math]f(x) = 2(x - 2)^2 - 5[/math]

**Vertex:** [math](2, -5)[/math]

**Phase 2: Solving Quadratic Equations (25 minutes)**

**Method 1: Factoring**
Solve [math]x^2 - 5x + 6 = 0[/math]

Factor: [math](x - 2)(x - 3) = 0[/math]
Solutions: [math]x = 2[/math] or [math]x = 3[/math]

**Method 2: Quadratic Formula**
[math]x = \\frac{-b ± \\sqrt{b^2 - 4ac}}{2a}[/math]

Solve [math]2x^2 + 3x - 1 = 0[/math]

Here: [math]a = 2[/math], [math]b = 3[/math], [math]c = -1[/math]

[math]x = \\frac{-3 ± \\sqrt{3^2 - 4(2)(-1)}}{2(2)}[/math]
[math]x = \\frac{-3 ± \\sqrt{9 + 8}}{4}[/math]
[math]x = \\frac{-3 ± \\sqrt{17}}{4}[/math]

**Method 3: Completing the Square**
Solve [math]x^2 + 6x + 2 = 0[/math]

[math]x^2 + 6x = -2[/math]
[math]x^2 + 6x + 9 = -2 + 9[/math]
[math](x + 3)^2 = 7[/math]
[math]x + 3 = ±\\sqrt{7}[/math]
[math]x = -3 ± \\sqrt{7}[/math]

**Phase 3: Applications and Graphing (15 minutes)**

**Key Features of Parabolas:**
- **Vertex:** Maximum or minimum point
- **Axis of Symmetry:** [math]x = -\\frac{b}{2a}[/math]
- **y-intercept:** Value when [math]x = 0[/math]
- **x-intercepts:** Solutions to [math]f(x) = 0[/math]
- **Direction:** Opens up if [math]a > 0[/math], down if [math]a < 0[/math]
`,

    practiceSection: `
**Guided Practice Problems (20 minutes)**

**Converting Forms:**
1. Convert [math]f(x) = x^2 + 4x - 5[/math] to vertex form
2. Convert [math]g(x) = 3(x - 1)^2 + 7[/math] to standard form

**Solving Equations:**
3. [math]x^2 - 7x + 12 = 0[/math] (by factoring)
4. [math]2x^2 + 5x - 3 = 0[/math] (by quadratic formula)
5. [math]x^2 + 8x + 10 = 0[/math] (by completing the square)

**Application Problems:**
6. A ball is thrown upward with initial velocity 32 ft/sec from a height of 48 feet. Its height is [math]h(t) = -16t^2 + 32t + 48[/math]. Find:
   a) Maximum height and when it occurs
   b) When the ball hits the ground

7. A rectangular garden has perimeter 100 feet. Find the dimensions that maximize the area.

**Graphing Challenge:**
8. Sketch [math]f(x) = -2(x + 1)^2 + 8[/math] and identify all key features
`,

    assessmentIdeas: `
**Quick Checks:**
- Vertex form identification from graphs
- Mental math: axis of symmetry for simple quadratics
- Real-world interpretation of vertex meaning

**Performance Tasks:**
- Design a quadratic model for a real situation (sports, business, geometry)
- Compare multiple solution methods for efficiency
- Error analysis: find and correct mistakes in quadratic solutions

**Evidence of Understanding:**
- Correct use of mathematical notation and vocabulary
- Ability to choose appropriate solution method for given problem
- Connection between algebraic and graphical representations
`,

    differentiationTips: `
**Support Strategies:**
- Quadratic formula song or mnemonic device
- Step-by-step completion square templates
- Graphing calculator to verify algebraic solutions
- Real-world contexts that connect to student interests

**Advanced Extensions:**
- Complex number solutions when discriminant is negative
- Systems involving quadratic equations
- Introduction to conic sections
- Quadratic inequalities and their graphs

**Technology Integration:**
- Graphing calculator exploration of parameter effects
- Online simulation of projectile motion
- Spreadsheet modeling of optimization problems
`
  },

  /**
   * Algebra I Templates
   */
  algebraILinear: {
    title: "Linear Functions and Slope",
    gradeLevel: ["Algebra I", "Algebra 1", "9th Grade", "Freshman"],
    openingHook: `
**Opening Hook: Cell Phone Plan Investigation**

"Two phone companies offer different plans:
- Plan A: $30 per month plus $0.10 per minute
- Plan B: $50 per month with unlimited minutes

Which plan should you choose?"

**Mathematical Modeling:**
- Plan A: [math]C_A(m) = 30 + 0.10m[/math]
- Plan B: [math]C_B(m) = 50[/math]

Where [math]m[/math] = minutes used per month
`,

    mainContent: `
**Phase 1: Understanding Slope (20 minutes)**

**Slope Formula:**
[math]m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{\\text{rise}}{\\text{run}}[/math]

**Example Calculation:**
Find the slope between points [math](2, 5)[/math] and [math](6, 13)[/math]

[math]m = \\frac{13 - 5}{6 - 2} = \\frac{8}{4} = 2[/math]

**Slope Interpretations:**
- [math]m > 0[/math]: Line rises (positive correlation)
- [math]m < 0[/math]: Line falls (negative correlation)  
- [math]m = 0[/math]: Horizontal line (no change)
- [math]m[/math] undefined: Vertical line

**Phase 2: Forms of Linear Equations (25 minutes)**

**Slope-Intercept Form:** [math]y = mx + b[/math]
- [math]m[/math] = slope
- [math]b[/math] = y-intercept

**Point-Slope Form:** [math]y - y_1 = m(x - x_1)[/math]
- Used when you know a point and the slope

**Standard Form:** [math]Ax + By = C[/math]
- Useful for finding intercepts quickly

**Example: Writing Equations**
Write the equation of a line through [math](3, 7)[/math] with slope [math]m = -2[/math]

**Step 1:** Use point-slope form
[math]y - 7 = -2(x - 3)[/math]

**Step 2:** Convert to slope-intercept form
[math]y - 7 = -2x + 6[/math]
[math]y = -2x + 6 + 7[/math]
[math]y = -2x + 13[/math]

**Phase 3: Real-World Applications (15 minutes)**

**Distance-Time Graphs:**
- Slope represents speed/velocity
- Steeper slope = faster motion
- Horizontal line = no movement
- Negative slope = moving toward starting point

**Cost Analysis:**
For the phone plan problem:
- Slope of Plan A = $0.10 per minute (variable cost)
- y-intercept of Plan A = $30 (fixed cost)
- Plan B has zero slope (flat rate)

**Break-Even Analysis:**
Set equations equal: [math]30 + 0.10m = 50[/math]
Solve: [math]0.10m = 20[/math], so [math]m = 200[/math] minutes

If you use more than 200 minutes, choose Plan B
If you use less than 200 minutes, choose Plan A
`,

    practiceSection: `
**Individual Practice (20 minutes)**

**Slope Calculations:**
1. Find the slope between [math](-1, 4)[/math] and [math](3, -2)[/math]
2. A line passes through [math](0, 8)[/math] and [math](4, 0)[/math]. Find the slope.

**Writing Equations:**
3. Write the equation of a line with slope [math]\\frac{3}{4}[/math] and y-intercept [math]-2[/math]
4. Write the equation of a line through [math](2, -3)[/math] and [math](6, 5)[/math]
5. Convert [math]3x + 4y = 12[/math] to slope-intercept form

**Application Problems:**
6. A car rental costs $25 per day plus $0.20 per mile. Write an equation for the total cost [math]C[/math] based on miles driven [math]m[/math].

7. Water drains from a pool at a constant rate. After 2 hours, 1200 gallons remain. After 5 hours, 750 gallons remain. How much water was in the pool initially?

8. Temperature conversion: [math]F = \\frac{9}{5}C + 32[/math]
   - What does the slope [math]\\frac{9}{5}[/math] represent?
   - What does the y-intercept 32 represent?

**Graphing Practice:**
9. Graph [math]y = \\frac{1}{2}x - 3[/math] using slope and y-intercept
10. Graph [math]2x + 3y = 6[/math] using intercepts
`,

    assessmentIdeas: `
**Quick Formative Checks:**
- Slope identification from graphs and tables
- y-intercept reading from equations and graphs
- Real-world slope interpretation

**Performance Assessment:**
- Create a linear model for a real situation in your life
- Analyze multiple representations (table, graph, equation) of same function
- Compare rates of change in different contexts

**Evidence of Learning:**
- Accurate slope calculations with proper units
- Correct equation writing in appropriate form
- Meaningful interpretation of slope and intercepts in context
`,

    differentiationTips: `
**Support for Struggling Students:**
- Use physical manipulatives for rise/run concept
- Connect to familiar contexts (stairs, ramps, hills)
- Provide equation form reference sheets
- Use graphing tools to verify algebraic work

**Challenge Extensions:**
- Parallel and perpendicular line relationships
- Piecewise linear functions
- Linear inequalities and their graphs
- Introduction to absolute value functions

**Real-World Connections:**
- Business and economics applications
- Science data analysis (motion, chemistry)
- Social studies trends and statistics
- Art and design (perspective, proportions)
`
  },

  /**
   * Geometry Templates
   */
  geometryPythagorean: {
    title: "Pythagorean Theorem and Applications",
    gradeLevel: ["Geometry", "8th Grade", "Algebra I"],
    openingHook: `
**Opening Hook: Distance Measurement Challenge**

"You need to find the distance across a lake without swimming or boating. You can measure along the shore: 300 meters east and 400 meters north from your starting point. How far is it directly across?"

**Visual Setup:**
Draw a right triangle with legs 300m and 400m
Students predict the hypotenuse length before calculating
`,

    mainContent: `
**Phase 1: Pythagorean Theorem Foundation (15 minutes)**

**The Pythagorean Theorem:**
In a right triangle with legs [math]a[/math] and [math]b[/math] and hypotenuse [math]c[/math]:

[math]a^2 + b^2 = c^2[/math]

**Geometric Proof Demonstration:**
Show squares built on each side of a right triangle
- Square on leg [math]a[/math] has area [math]a^2[/math]
- Square on leg [math]b[/math] has area [math]b^2[/math]  
- Square on hypotenuse [math]c[/math] has area [math]c^2[/math]
- Relationship: [math]a^2 + b^2 = c^2[/math]

**Phase 2: Problem-Solving Applications (30 minutes)**

**Type 1: Finding the Hypotenuse**
A right triangle has legs of length 5 and 12. Find the hypotenuse.

[math]c^2 = 5^2 + 12^2[/math]
[math]c^2 = 25 + 144[/math]
[math]c^2 = 169[/math]
[math]c = \\sqrt{169} = 13[/math]

**Type 2: Finding a Leg**
A right triangle has hypotenuse 25 and one leg 15. Find the other leg.

[math]15^2 + b^2 = 25^2[/math]
[math]225 + b^2 = 625[/math]
[math]b^2 = 625 - 225 = 400[/math]
[math]b = \\sqrt{400} = 20[/math]

**Type 3: Distance Formula Connection**
Find the distance between points [math](1, 4)[/math] and [math](7, 12)[/math]

Form a right triangle:
- Horizontal leg: [math]|7 - 1| = 6[/math]
- Vertical leg: [math]|12 - 4| = 8[/math]
- Distance: [math]d = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10[/math]

**Distance Formula:** [math]d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}[/math]

**Phase 3: Pythagorean Triples and Special Cases (15 minutes)**

**Common Pythagorean Triples:**
- [math](3, 4, 5)[/math] and multiples: [math](6, 8, 10)[/math], [math](9, 12, 15)[/math]
- [math](5, 12, 13)[/math] and multiples: [math](10, 24, 26)[/math]
- [math](8, 15, 17)[/math]
- [math](7, 24, 25)[/math]

**Using Triples for Quick Recognition:**
If you see legs 9 and 12, recognize this as [math]3(3, 4, 5)[/math]
So the hypotenuse is [math]3 \\times 5 = 15[/math]
`,

    practiceSection: `
**Guided Practice Problems (20 minutes)**

**Basic Applications:**
1. Find the hypotenuse: legs = 8 and 15
2. Find the missing leg: hypotenuse = 17, one leg = 8
3. A ladder leans against a wall. The ladder is 13 feet long and the base is 5 feet from the wall. How high does the ladder reach?

**Coordinate Geometry:**
4. Find the distance between [math](-2, 1)[/math] and [math](4, 9)[/math]
5. A right triangle has vertices at [math](0, 0)[/math], [math](6, 0)[/math], and [math](6, 8)[/math]. Find the perimeter.

**Real-World Problems:**
6. A rectangular field is 120 meters by 160 meters. How long is the diagonal path across the field?

7. A television is advertised as 55-inch (diagonal measurement). If the width is 48 inches, what is the height?

8. A ship travels 15 miles east, then 20 miles north. How far is it from its starting point?

**Challenge Problems:**
9. Prove that a triangle with sides 7, 24, and 25 is a right triangle.
10. Find the length of the diagonal of a cube with side length 6.

**Error Analysis:**
11. Student Work: "For a right triangle with legs 6 and 8, the hypotenuse is [math]6 + 8 = 14[/math]"
    Identify and correct the error.
`,

    assessmentIdeas: `
**Formative Assessment:**
- Exit ticket: Apply Pythagorean theorem to find missing side
- Quick sketch: Draw and label a right triangle for a word problem
- Vocabulary check: Define hypotenuse, legs, right triangle

**Performance Tasks:**
- Design a ramp that meets specific slope and safety requirements
- Calculate materials needed for diagonal bracing in construction
- Map navigation using coordinate geometry and distances

**Evidence of Mastery:**
- Correct identification of right triangles and their parts
- Accurate calculation using [math]a^2 + b^2 = c^2[/math]
- Application of distance formula in coordinate plane
- Problem-solving in real-world contexts
`,

    differentiationTips: `
**Support Strategies:**
- Use concrete models and manipulatives
- Provide right triangle identification practice
- Calculator use for square root calculations
- Connect to familiar contexts (sports fields, buildings)

**Advanced Extensions:**
- Three-dimensional distance problems
- Proofs of Pythagorean theorem (multiple methods)
- Introduction to trigonometric ratios
- Non-right triangle relationships (Law of Cosines preview)

**Technology Integration:**
- Geometry software for dynamic demonstrations
- Measurement tools for real-world verification
- Graphing calculators for coordinate applications
- Online simulations of theorem applications
`
  }
}

/**
 * Function to get appropriate template based on grade level and topic
 */
export function getMathTemplate(gradeLevel: string, topic: string): MathLessonTemplate | null {
  const grade = gradeLevel.toLowerCase()
  const topicLower = topic.toLowerCase()

  // AP Calculus
  if (grade.includes('ap calculus') || grade.includes('calculus')) {
    if (topicLower.includes('derivative') || topicLower.includes('differentiation')) {
      return mathLessonTemplates.apCalculusDerivatives
    }
  }

  // Algebra II
  if (grade.includes('algebra ii') || grade.includes('algebra 2') || grade.includes('precalculus')) {
    if (topicLower.includes('quadratic') || topicLower.includes('parabola')) {
      return mathLessonTemplates.algebraIIQuadratics
    }
  }

  // Algebra I
  if (grade.includes('algebra i') || grade.includes('algebra 1') || grade.includes('9th')) {
    if (topicLower.includes('linear') || topicLower.includes('slope') || topicLower.includes('function')) {
      return mathLessonTemplates.algebraILinear
    }
  }

  // Geometry
  if (grade.includes('geometry') || grade.includes('8th')) {
    if (topicLower.includes('pythagorean') || topicLower.includes('distance') || topicLower.includes('right triangle')) {
      return mathLessonTemplates.geometryPythagorean
    }
  }

  return null
}

/**
 * Generate template-based content for math lessons
 */
export function generateTemplateContent(gradeLevel: string, topic: string): string | null {
  const template = getMathTemplate(gradeLevel, topic)
  
  if (!template) return null

  return `
**🎯 MATHEMATICAL LESSON TEMPLATE FOR ${template.title}**

${template.openingHook}

**📚 MAIN INSTRUCTIONAL CONTENT:**
${template.mainContent}

**✏️ PRACTICE SECTION:**
${template.practiceSection}

**📊 ASSESSMENT STRATEGIES:**
${template.assessmentIdeas}

**🎨 DIFFERENTIATION SUPPORT:**
${template.differentiationTips}

**Note:** All mathematical expressions above use [math]...[/math] tags for proper LaTeX rendering in your lesson plans.
  `.trim()
}