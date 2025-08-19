// Test the new MathStepGenerator
import { MathStepGenerator, testFractionSteps } from './src/utils/mathStepGenerator.ts'

console.log('🧪 Testing new MathStepGenerator system...')

// Test the fraction solver
testFractionSteps()

// Test direct call
console.log('\n🔍 Direct test of 24/36:')
try {
  const solution = MathStepGenerator.solveMathExpression('24/36')
  console.log('Steps generated:')
  solution.steps.forEach(step => {
    console.log(`${step.stepNumber}. ${step.title}`)
    console.log(`   ${step.expression}`)
  })
  console.log('Final answer:', solution.finalAnswer)
} catch (error) {
  console.error('Error:', error.message)
}