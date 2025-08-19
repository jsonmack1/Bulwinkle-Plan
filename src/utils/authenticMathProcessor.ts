/**
 * Authentic Math Content Processor
 * Post-processes AI-generated lesson content to replace generic math expressions
 * with authentic, topic-specific mathematical content and step-by-step solutions.
 */

import { 
  AuthenticMathGenerator, 
  getTopicSpecificExpression, 
  generateStepByStepSolution,
  type MathExpression,
  type StepByStepSolution 
} from './authenticMathGenerator';
import { parseMathContent } from './mathUtils';

export interface MathContentReplacementResult {
  processedContent: string;
  heroExpression?: MathExpression;
  stepByStepSolution?: StepByStepSolution;
  replacementsMade: number;
}

/**
 * Processes lesson content and replaces generic math with authentic expressions
 */
export function processLessonMathContent(
  content: string, 
  topic: string, 
  gradeLevel: string, 
  subject: string
): MathContentReplacementResult {
  
  if (!isMathSubject(subject)) {
    // For non-math subjects, just parse existing math content
    return {
      processedContent: parseMathContent(content),
      replacementsMade: 0
    };
  }

  console.log('🧮 Processing math content for topic:', topic, 'grade:', gradeLevel);

  let processedContent = content;
  let replacementsMade = 0;
  let heroExpression: MathExpression | undefined;
  let stepByStepSolution: StepByStepSolution | undefined;

  try {
    // Determine the mathematical topic from the lesson topic
    const mathTopic = inferMathematicalTopic(topic, gradeLevel);
    console.log('🎯 Inferred mathematical topic:', mathTopic);

    // Generate authentic hero expression
    heroExpression = getTopicSpecificExpression(mathTopic, gradeLevel);
    
    // Replace the first significant math expression with our hero expression
    const heroReplaced = replaceFirstMathExpression(processedContent, heroExpression);
    if (heroReplaced.wasReplaced) {
      processedContent = heroReplaced.content;
      replacementsMade++;
      console.log('✅ Replaced hero expression');
    }

    // Replace additional generic expressions with topic-specific ones
    const additionalReplacements = replaceAdditionalMathExpressions(
      processedContent, 
      mathTopic, 
      gradeLevel,
      2 // Replace up to 2 additional expressions
    );
    processedContent = additionalReplacements.content;
    replacementsMade += additionalReplacements.count;

    // Generate step-by-step solution if we have a hero expression
    if (heroExpression) {
      stepByStepSolution = generateStepByStepSolution(heroExpression);
      console.log('📝 Generated step-by-step solution with', stepByStepSolution.steps.length, 'steps');
    }

    // Process any remaining [math] tags
    processedContent = parseMathContent(processedContent);

  } catch (error) {
    console.warn('⚠️ Error in math content processing:', error);
    // Fallback to basic math parsing
    processedContent = parseMathContent(content);
  }

  console.log('🔢 Math processing complete. Replacements made:', replacementsMade);

  return {
    processedContent,
    heroExpression,
    stepByStepSolution,
    replacementsMade
  };
}

/**
 * Determines if the subject should have mathematical content processing
 */
function isMathSubject(subject: string): boolean {
  const mathSubjects = [
    'math', 'mathematics', 'algebra', 'geometry', 'calculus', 
    'trigonometry', 'statistics', 'physics', 'chemistry'
  ];
  
  return mathSubjects.some(mathSubj => 
    subject.toLowerCase().includes(mathSubj)
  );
}

/**
 * Infers the mathematical topic from the lesson topic and grade level
 */
function inferMathematicalTopic(topic: string, gradeLevel: string): string {
  const topicLower = topic.toLowerCase();
  const gradeLower = gradeLevel.toLowerCase();

  // Direct topic mappings
  if (topicLower.includes('linear') || topicLower.includes('equation')) {
    return 'Linear Equations';
  }
  if (topicLower.includes('quadratic') || topicLower.includes('parabola')) {
    return 'Quadratic Equations';
  }
  if (topicLower.includes('system') || topicLower.includes('simultaneous')) {
    return 'Systems of Equations';
  }
  if (topicLower.includes('polynomial') || topicLower.includes('function')) {
    return 'Polynomial Functions';
  }
  if (topicLower.includes('derivative') || topicLower.includes('calculus')) {
    return 'Derivatives';
  }
  if (topicLower.includes('trigonometry') || topicLower.includes('sin') || topicLower.includes('cos')) {
    return 'Trigonometry';
  }
  if (topicLower.includes('ellipse') || topicLower.includes('conic') || topicLower.includes('focus')) {
    return 'Quadratic Equations'; // Ellipse work often involves quadratic-like expressions
  }

  // Grade-based fallbacks
  if (gradeLower.includes('calculus') || gradeLower.includes('ap calculus')) {
    return 'Derivatives';
  }
  if (gradeLower.includes('algebra ii') || gradeLower.includes('algebra 2') || gradeLower.includes('11th')) {
    return 'Quadratic Equations';
  }
  if (gradeLower.includes('algebra i') || gradeLower.includes('algebra 1') || gradeLower.includes('9th')) {
    return 'Linear Equations';
  }
  if (gradeLower.includes('10th')) {
    return 'Quadratic Equations';
  }

  // Default fallback
  return 'Linear Equations';
}

/**
 * Replaces the first significant math expression with the hero expression
 */
function replaceFirstMathExpression(
  content: string, 
  heroExpression: MathExpression
): { content: string; wasReplaced: boolean } {
  
  // Look for patterns that indicate the main mathematical challenge
  const heroPatterns = [
    // Look for "Main Challenge", "Hero Expression", etc.
    /(\*\*Main Challenge:\*\*[^[]*)\[math\]([^[]+)\[\/math\]/i,
    /(\*\*Hero Expression:\*\*[^[]*)\[math\]([^[]+)\[\/math\]/i,
    /(\*\*Primary Problem:\*\*[^[]*)\[math\]([^[]+)\[\/math\]/i,
    
    // Look for first significant math expression in content
    /(.*?)\[math\]([^[]+)\[\/math\]/,
  ];

  for (const pattern of heroPatterns) {
    const match = content.match(pattern);
    if (match) {
      const replacement = `${match[1]}[math]${heroExpression.expression}[/math]`;
      const newContent = content.replace(pattern, replacement);
      
      if (newContent !== content) {
        console.log('🎯 Replaced expression:', match[2], '→', heroExpression.expression);
        return { content: newContent, wasReplaced: true };
      }
    }
  }

  // If no specific patterns found, replace the first [math] expression
  const firstMathMatch = content.match(/\[math\]([^[]+)\[\/math\]/);
  if (firstMathMatch) {
    const replacement = `[math]${heroExpression.expression}[/math]`;
    const newContent = content.replace(/\[math\]([^[]+)\[\/math\]/, replacement);
    console.log('🎯 Replaced first math expression:', firstMathMatch[1], '→', heroExpression.expression);
    return { content: newContent, wasReplaced: true };
  }

  return { content, wasReplaced: false };
}

/**
 * Replaces additional math expressions with topic-specific authentic ones
 */
function replaceAdditionalMathExpressions(
  content: string,
  mathTopic: string,
  gradeLevel: string,
  maxReplacements: number
): { content: string; count: number } {
  
  let processedContent = content;
  let replacementCount = 0;

  // Find all remaining [math] expressions
  const mathMatches = Array.from(content.matchAll(/\[math\]([^[]+)\[\/math\]/g));
  
  // Skip the first one (already replaced) and replace up to maxReplacements more
  for (let i = 1; i < mathMatches.length && replacementCount < maxReplacements; i++) {
    try {
      const newExpression = getTopicSpecificExpression(mathTopic, gradeLevel);
      const oldExpression = mathMatches[i][0];
      const replacement = `[math]${newExpression.expression}[/math]`;
      
      processedContent = processedContent.replace(oldExpression, replacement);
      replacementCount++;
      
      console.log('🔄 Additional replacement:', mathMatches[i][1], '→', newExpression.expression);
    } catch (error) {
      console.warn('⚠️ Failed to generate additional expression:', error);
    }
  }

  return { content: processedContent, count: replacementCount };
}

/**
 * Extracts step-by-step solution content from lesson if present
 */
export function extractStepByStepContent(content: string): string | null {
  const stepByStepPatterns = [
    /\*\*Step[- ]by[- ]Step.*?\*\*([\s\S]*?)(?=\*\*|$)/i,
    /\*\*Solution Process.*?\*\*([\s\S]*?)(?=\*\*|$)/i,
    /\*\*Detailed Solution.*?\*\*([\s\S]*?)(?=\*\*|$)/i,
  ];

  for (const pattern of stepByStepPatterns) {
    const match = content.match(pattern);
    if (match && match[1]?.trim().length > 50) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Integrates step-by-step solution into lesson content
 */
export function integrateStepByStepSolution(
  content: string,
  stepByStepSolution: StepByStepSolution
): string {
  
  // Look for existing step-by-step section to replace
  const existingSteps = extractStepByStepContent(content);
  
  if (existingSteps) {
    // Replace existing step-by-step content
    const stepsContent = formatStepByStepForLesson(stepByStepSolution);
    return content.replace(existingSteps, stepsContent);
  } else {
    // Add step-by-step solution to the end
    const stepsContent = formatStepByStepForLesson(stepByStepSolution);
    return content + '\n\n**Step-by-Step Solution:**\n\n' + stepsContent;
  }
}

/**
 * Formats step-by-step solution for integration into lesson content
 */
function formatStepByStepForLesson(solution: StepByStepSolution): string {
  let formatted = `**Problem:** [math]${solution.heroExpression.expression}[/math]\n\n`;
  
  solution.steps.forEach((step, index) => {
    formatted += `**Step ${step.step}: ${step.title}**\n`;
    formatted += `[math]${step.expression}[/math]\n\n`;
    formatted += `*Teacher Guidance:* ${step.teacherGuidance}\n\n`;
    formatted += `*Student Action:* ${step.studentAction}\n\n`;
    
    if (index < solution.steps.length - 1) {
      formatted += '---\n\n';
    }
  });

  return formatted;
}