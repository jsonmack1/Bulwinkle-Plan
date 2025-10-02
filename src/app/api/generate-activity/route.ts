// FILE LOCATION: src/app/api/generate-activity/route.ts
// REPLACE your current route.ts with this activity name enhanced version

import { NextRequest, NextResponse } from 'next/server';
import { generateMathLessonContent, GradeLevelMathContent } from '../../../utils/mathContentGenerators';

interface ActivityData {
  mode: string;
  subject: string;
  gradeLevel: string;
  topic: string;
  activityType: string;
  duration: string;
  classSize?: string;
  specialNotes?: string;
  substituteName?: string;
  techPassword?: string;
  emergencyContacts?: string;
  substituteMode?: boolean;
  date?: string;
}

function isMathSubject(subject: string, gradeLevel: string): boolean {
  const subj = subject.toLowerCase().trim();
  const grade = gradeLevel.toLowerCase().trim();
  
  // First, explicitly exclude non-math subjects - EXPANDED LIST
  const nonMathSubjects = [
    'english', 'ela', 'language arts', 'literature', 'reading', 'writing',
    'science', 'biology', 'chemistry', 'physics', 'earth science', 'environmental science',
    'social studies', 'history', 'geography', 'civics', 'government', 'world history', 'us history', 'american history',
    'art', 'music', 'pe', 'physical education', 'health', 'wellness',
    'advisory', 'sel', 'social emotional', 'counseling', 'guidance',
    'foreign language', 'spanish', 'french', 'german', 'chinese', 'japanese', 'latin',
    'computer science', 'technology', 'engineering', 'programming', 'coding',
    'business', 'economics', 'psychology', 'philosophy', 'sociology',
    'drama', 'theater', 'theatre', 'band', 'choir', 'orchestra',
    'culinary', 'cooking', 'woodshop', 'auto', 'automotive'
  ];
  
  // Check for partial matches in subject names (more comprehensive)
  const isNonMathSubject = nonMathSubjects.some(nonMath => 
    subj.includes(nonMath) || nonMath.includes(subj) || subj === nonMath
  );
  if (isNonMathSubject) return false;
  
  // STEM subjects that might contain math but aren't pure math should be excluded
  const stemNonMath = ['stem', 'steam', 'robotics', 'engineering', 'computer', 'technology'];
  const isStemNonMath = stemNonMath.some(stem => subj.includes(stem));
  if (isStemNonMath) return false;
  
  // Only allow explicitly mathematical subjects
  const mathKeywords = [
    'math', 'mathematics', 'calculus', 'algebra', 'geometry', 
    'trigonometry', 'statistics', 'precalculus', 'pre-calculus',
    'arithmetic', 'number theory', 'discrete math', 'linear algebra',
    'differential equations', 'integral calculus', 'finite math'
  ];
  
  const mathGrades = [
    'ap calculus', 'ap statistics', 'ib math', 'honors math'
  ];
  
  // Check subject name - must be an EXACT or very close match
  const hasSubjectMath = mathKeywords.some(keyword => 
    subj === keyword || 
    subj === keyword + 's' || 
    subj.startsWith(keyword + ' ') || 
    subj.endsWith(' ' + keyword) ||
    (keyword === 'math' && (subj === 'mathematics' || subj === 'maths'))
  );
  
  // Check grade level
  const hasGradeMath = mathGrades.some(gradeKeyword => grade.includes(gradeKeyword));
  
  return hasSubjectMath || hasGradeMath;
}

function sanitizeContentForNonMath(content: string): string {
  if (!content) return content;
  
  let sanitized = content;
  
  // Remove any [math] tags and their content completely
  sanitized = sanitized.replace(/\[math\]([\s\S]*?)\[\/math\]/g, '');
  
  // Remove LaTeX expressions and notation
  sanitized = sanitized.replace(/\\frac{[^}]*}{[^}]*}/g, '');
  sanitized = sanitized.replace(/\\sqrt{[^}]*}/g, '');
  sanitized = sanitized.replace(/\\begin{cases}[\s\S]*?\\end{cases}/g, '');
  sanitized = sanitized.replace(/\\int_[^\\]*?dx/g, '');
  sanitized = sanitized.replace(/\\lim_{[^}]*}/g, '');
  sanitized = sanitized.replace(/\\[a-zA-Z]+{[^}]*}/g, '');
  sanitized = sanitized.replace(/\\[a-zA-Z]+/g, '');
  
  // Remove mathematical symbols and expressions
  const mathSymbols = ['∫', '∑', '∏', '∞', 'π', 'α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'σ', 'φ', 'ω', '→', '←', '≤', '≥', '≠', '±', '×', '·', '÷', '≈', '≡', '∝', '∈', '⊂', '∪', '∩'];
  mathSymbols.forEach(symbol => {
    sanitized = sanitized.replace(new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
  });
  
  // Remove mathematical notation patterns
  sanitized = sanitized.replace(/f\([a-zA-Z]\)\s*=/g, '');
  sanitized = sanitized.replace(/[a-zA-Z]\^\d+/g, '');
  sanitized = sanitized.replace(/[a-zA-Z]_\d+/g, '');
  
  // Clean up any double spaces or empty lines that might result from removals
  sanitized = sanitized.replace(/\s{2,}/g, ' ');
  sanitized = sanitized.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return sanitized.trim();
}

function enhanceLessonFormatting(content: string): string {
  if (!content) return content;
  
  let formatted = content;
  
  // Add line break before each section header (both single and double asterisk)
  // Handle **Header** patterns
  formatted = formatted.replace(/([^\n])\s*(\*\*[^*]+\*\*)/g, '$1\n\n$2');
  
  // Handle *Header* patterns (but be very specific to avoid breaking text)
  // Only match when it looks like a section header
  const headerPatterns = [
    'Phase \\d+[^*]*', 'Step \\d+[^*]*', 'Part [A-Z][^*]*', 'Option [A-Z][^*]*',
    'Activity \\d+[^*]*', 'Section \\d+[^*]*', 'Exercise \\d+[^*]*'
  ];
  
  headerPatterns.forEach(pattern => {
    const regex = new RegExp(`([^\\n])\\s*(\\*${pattern}\\*)`, 'gi');
    formatted = formatted.replace(regex, '$1\n\n$2');
  });
  
  // Clearly indicate Exit Ticket sections
  formatted = formatted.replace(/(\*\*Exit Ticket[^*]*\*\*)/gi, '\n📋 $1');
  
  // Ensure bullet points have proper spacing
  formatted = formatted.replace(/\n-\s*/g, '\n- ');
  
  // Clean up excessive line breaks (more than 3 consecutive)
  formatted = formatted.replace(/\n{4,}/g, '\n\n\n');
  
  return formatted.trim();
}

function generateMathEnhancedPrompt(subject: string, gradeLevel: string, topic: string, activityType: string = ''): string {
  try {
    const gradeContent = GradeLevelMathContent.getContentForGrade(gradeLevel);
    
    // Identify math-focused activity types that need substantial expressions
    const mathFocusedActivities = [
      'problem_solving_strategies',
      'mathematical_modeling', 
      'function_analysis',
      'equation_solving',
      'graphing_activities',
      'algebraic_reasoning',
      'calculus_applications',
      'geometric_proofs',
      'statistical_analysis'
    ];
    
    const isMathFocused = mathFocusedActivities.some(activity => 
      activityType.toLowerCase().includes(activity) || 
      activityType.toLowerCase().includes(activity.replace('_', ' '))
    );
    
    let mathPrompt = `
**🧮 ENHANCED MATHEMATICAL CONTENT GENERATION**

This is a mathematics lesson that requires proper mathematical notation and rich content. Include the following mathematical elements:

**Mathematical Notation Requirements:**
- Use [math]...[/math] tags for mathematical expressions that need LaTeX conversion
- Use proper function notation with subscripts and superscripts
- Include step-by-step calculations with clear mathematical reasoning
- Format all mathematical rules and formulas with proper notation

**Grade-Appropriate Mathematical Content for ${gradeLevel}:**
- **Focus Areas:** ${gradeContent.focusAreas.join(', ')}
- **Difficulty Level:** ${gradeContent.difficulty}
- **Mathematical Depth:** ${gradeContent.difficulty === 'advanced' ? 'College-level rigor with detailed proofs and applications' : gradeContent.difficulty === 'intermediate' ? 'Pre-college level with thorough explanations' : 'Foundational concepts with clear examples'}`;

    // Add activity-specific mathematical expression requirements
    if (isMathFocused) {
      mathPrompt += `

**🎯 SUBSTANTIAL MATHEMATICAL EXPRESSIONS REQUIRED**

Since this is a ${activityType} activity, you MUST include substantial mathematical expressions for step-by-step analysis:

**Hero Expression Pattern:**
Generate exactly ONE substantial "hero expression" that serves as the main mathematical challenge:
${getHeroExpressionByActivity(activityType, gradeLevel)}

**Practice Problems (2-3 additional expressions):**
Include 2-3 additional mathematical expressions of varying complexity:
${getPracticeProblemsPattern(activityType, gradeLevel)}

**Mathematical Expression Standards:**
- Each expression must use proper [math]...[/math] tags
- Include operations like: solving equations, function analysis, graphing, derivatives, integrals
- Expressions should be substantial enough for meaningful step-by-step solutions
- Grade-appropriate complexity: ${gradeContent.difficulty} level
- Connect expressions directly to the ${topic} learning objectives`;
    }

    // Simplified math content generation
    const mathContent = generateMathLessonContent(gradeLevel, topic);
    
    // Add mathematical rules if available (limit to avoid overwhelming the prompt)
    if (mathContent.rules.length > 0) {
      mathPrompt += `

**Include These Mathematical Rules (with proper LaTeX formatting):**
${mathContent.rules.slice(0, 1).join('\n\n')}`;
    }

    // Add example problems (limit to 2)
    if (mathContent.examples.length > 0) {
      mathPrompt += `

**Include Mathematical Examples:**`;
      mathContent.examples.slice(0, 2).forEach((example, index) => {
        mathPrompt += `
${index + 1}. **${example.type.replace('_', ' ').toUpperCase()}:** [math]${example.expression}[/math]`;
      });
    }

    return mathPrompt;
  } catch (error) {
    console.error('Math enhancement error:', error);
    // Return a simplified math prompt if there's an error
    return `
**🧮 MATHEMATICAL CONTENT ENHANCEMENT**

This is a mathematics lesson. Please include:
- Use [math]...[/math] tags for all mathematical expressions
- Include step-by-step calculations with clear reasoning
- Use proper mathematical notation and terminology
- Provide practice problems appropriate for ${gradeLevel}`;
  }
}

function getHeroExpressionByActivity(activityType: string, gradeLevel: string): string {
  // Simplified fallback for different grade levels
  const grade = gradeLevel.toLowerCase();
  
  if (grade.includes('elementary') || grade.includes('1st') || grade.includes('2nd') || grade.includes('3rd')) {
    return `- **Main Challenge:** [math]8 + 5 = ?[/math]
- **Domain:** Basic Addition
- **Topic:** Arithmetic
- **Expected Solution:** Count and combine numbers`;
  } else if (grade.includes('middle') || grade.includes('6th') || grade.includes('7th') || grade.includes('8th')) {
    return `- **Main Challenge:** [math]3x + 7 = 22[/math]
- **Domain:** Linear Equations
- **Topic:** Algebra
- **Expected Solution:** Isolate the variable using inverse operations`;
  } else {
    return `- **Main Challenge:** [math]x^2 - 5x + 6 = 0[/math]
- **Domain:** Quadratic Equations
- **Topic:** Algebra
- **Expected Solution:** Factor or use quadratic formula`;
  }
}

function getTopicFromGradeLevel(gradeLevel: string): string {
  const grade = gradeLevel.toLowerCase();
  
  if (grade.includes('calculus') || grade.includes('ap calculus')) {
    return 'Derivatives';
  }
  if (grade.includes('precalculus') || grade.includes('pre-calculus')) {
    return 'Polynomial Functions';
  }
  if (grade.includes('algebra ii') || grade.includes('algebra 2') || grade.includes('11th')) {
    return 'Quadratic Equations';
  }
  if (grade.includes('algebra i') || grade.includes('algebra 1') || grade.includes('9th') || grade.includes('10th')) {
    return 'Linear Equations';
  }
  if (grade.includes('trigonometry') || grade.includes('trig')) {
    return 'Trigonometry';
  }
  
  return 'Linear Equations'; // Default
}

function isRecognizedMathTopic(topic: string): boolean {
  const recognizedTopics = [
    'Linear Equations', 'Quadratic Equations', 'Systems of Equations',
    'Polynomial Functions', 'Derivatives', 'Trigonometry'
  ];
  return recognizedTopics.includes(topic);
}

function getGenericMathExpression(gradeLevel: string): string {
  const grade = gradeLevel.toLowerCase();
  
  if (grade.includes('calculus')) {
    return `- **Main Challenge:** [math]\\frac{d}{dx}[x^3 + 2x^2 - 5x + 1][/math]
- **Domain:** Calculus
- **Topic:** Derivatives
- **Expected Solution:** Apply differentiation rules step by step`;
  } else if (grade.includes('algebra')) {
    return `- **Main Challenge:** [math]x^2 + 5x - 14 = 0[/math]
- **Domain:** Algebra
- **Topic:** Quadratic Equations
- **Expected Solution:** Factor or use quadratic formula`;
  } else {
    return `- **Main Challenge:** [math]3x + 7 = 22[/math]
- **Domain:** Algebra
- **Topic:** Linear Equations
- **Expected Solution:** Isolate the variable using inverse operations`;
  }
}

function getPracticeProblemsPattern(activityType: string, gradeLevel: string): string {
  const grade = gradeLevel.toLowerCase();
  
  if (grade.includes('calculus')) {
    return `- **Easier Practice:** [math]\\frac{d}{dx}[x^2][/math] (Basic derivatives - foundational level)
- **Similar Practice:** [math]\\frac{d}{dx}[x^3 + 2x][/math] (Polynomial derivatives - parallel complexity)  
- **Extension:** [math]\\lim_{x \\to 0} \\frac{\\sin(x)}{x}[/math] (Limits - higher challenge)`;
  } else if (grade.includes('algebra') || grade.includes('high')) {
    return `- **Easier Practice:** [math]2x + 5 = 11[/math] (Linear equations - foundational level)
- **Similar Practice:** [math]x^2 - 3x - 4 = 0[/math] (Quadratic equations - parallel complexity)  
- **Extension:** [math]x^3 - 6x^2 + 9x = 0[/math] (Cubic equations - higher challenge)`;
  } else {
    return `- **Easier Practice:** [math]x + 3 = 8[/math] (Simple equations - foundational level)
- **Similar Practice:** [math]2x - 4 = 10[/math] (Two-step equations - parallel complexity)  
- **Extension:** [math]3(x + 2) = 21[/math] (Multi-step equations - higher challenge)`;
  }
}

function inferTopicFromActivity(activityType: string, gradeLevel: string): string {
  const activity = activityType.toLowerCase();
  const grade = gradeLevel.toLowerCase();
  
  // Activity-based topic inference
  if (activity.includes('calculus') || activity.includes('derivative') || activity.includes('limit')) {
    return 'Calculus Applications';
  }
  if (activity.includes('trig') || activity.includes('sine') || activity.includes('cosine')) {
    return 'Trigonometry';
  }
  if (activity.includes('geometry') || activity.includes('area') || activity.includes('volume')) {
    return 'Geometry';
  }
  if (activity.includes('quadratic') || activity.includes('polynomial')) {
    return 'Quadratic Equations';
  }
  if (activity.includes('linear') || activity.includes('equation')) {
    return 'Linear Equations';
  }
  
  // Grade-based fallbacks
  if (grade.includes('calculus')) return 'Calculus Applications';
  if (grade.includes('algebra ii') || grade.includes('algebra 2')) return 'Quadratic Equations';
  if (grade.includes('algebra i') || grade.includes('algebra 1')) return 'Linear Equations';
  
  return 'Mathematical Problem Solving'; // Generic fallback
}

function getGenericPracticeProblems(gradeLevel: string): string {
  const grade = gradeLevel.toLowerCase();
  
  if (grade.includes('calculus')) {
    return `- **Easier Practice:** [math]\\\\frac{d}{dx}[3x^2][/math] (basic derivative)
- **Similar Practice:** [math]\\\\frac{d}{dx}[x^3 - 2x^2 + x][/math] (polynomial)
- **Extension:** [math]\\\\frac{d}{dx}[\\\\sin(x^2)][/math] (chain rule)`;
  }
  
  if (grade.includes('algebra')) {
    return `- **Easier Practice:** [math]x + 4 = 12[/math] (foundational level)
- **Similar Practice:** [math]2x^2 - 8 = 0[/math] (parallel complexity)
- **Extension:** [math]x^2 + 6x + 9 = 0[/math] (higher challenge)`;
  }
  
  return `- **Easier Practice:** A simpler version of the main problem
- **Similar Practice:** A parallel problem at the same level
- **Extension:** A more challenging variation with additional complexity`;
}

function shouldUseCER(subject: string, gradeLevel: string, activityType: string): boolean {
  const subj = subject.toLowerCase();
  const activity = activityType.toLowerCase();
  
  // CER-appropriate subjects
  const cerSubjects = ['science', 'math', 'english', 'social studies', 'history'];
  const hasCERSubject = cerSubjects.some(s => subj.includes(s));
  
  // Note: Activity type checking removed - now using subject-based approach
  
  // Skip CER for creative/procedural activities
  const nonCERActivities = [
    'create', 'draw', 'perform', 'act', 'sing', 'dance', 'practice', 
    'drill', 'memorize', 'art', 'music'
  ];
  const isNonCERActivity = nonCERActivities.some(a => activity.includes(a));
  
  // More inclusive approach: use CER for appropriate subjects unless explicitly non-CER
  return hasCERSubject && !isNonCERActivity;
}

function getFluidCERPrompting(subject: string, gradeLevel: string, topic: string, activityType: string): string {
  const grade = gradeLevel.toLowerCase();
  const subj = subject.toLowerCase();
  
  // Determine complexity level
  let complexityLevel = 'elementary';
  if (grade.includes('6th') || grade.includes('7th') || grade.includes('8th')) {
    complexityLevel = 'middle';
  } else if (grade.includes('9th') || grade.includes('10th') || grade.includes('11th') || grade.includes('12th')) {
    complexityLevel = 'high';
  }
  
  return `
**Fluid CER Teacher Prompting for ${topic}**

Generate lesson-specific CER prompts that flow naturally with this ${topic} activity. Create prompts that:

**🎯 Building Claims (${complexityLevel} level):**
Create 3-4 specific prompts that help students form claims about ${topic}. Use natural language that connects directly to what students will observe/discover in this activity. Include:
- A main question that leads to the claim
- Multiple sentence starters specific to ${topic}
- Reference to actual activity components
- Clear connection to learning objectives

Example structures: 
- "Based on what you discovered about ${topic}, what can you conclude about [specific aspect]?"
- "I believe that ${topic} [specific aspect] because..."
- "The most important thing I learned about ${topic} is..."
- "My claim about ${topic} is supported by..."

**CRITICAL: Make claims prominent and specific to ${topic} throughout the lesson.**

**📊 Gathering Evidence (${complexityLevel} level):**
Create 3-4 specific prompts that guide students to identify evidence from their ${topic} work. Use ${subj}-appropriate language:
${subj.includes('science') ? '- "What observations, measurements, or data from our ${topic} activity support your thinking?"' : ''}
${subj.includes('math') ? '- "What calculations, patterns, or mathematical relationships show your thinking about ${topic}?"' : ''}
${subj.includes('english') || subj.includes('social') || subj.includes('history') ? '- "What textual evidence, quotes, or examples support your claim about ${topic}?"' : ''}
- "What specific details from our work prove your point about ${topic}?"
- "Which parts of our ${topic} investigation give you the strongest evidence?"
- "What examples can you point to that support your thinking?"

**CRITICAL: Include multiple evidence-gathering moments throughout the lesson.**

**🧠 Connecting Reasoning (${complexityLevel} level):**
Create 3-4 prompts that help students explain WHY their evidence supports their claim about ${topic}. Include:
- "How does this evidence prove your claim about ${topic}?"
- "Why does this information support your thinking?"
- "What makes this evidence convincing for your ${topic} conclusion?"
- Questions that connect to underlying principles (scientific laws, mathematical concepts, literary themes, historical patterns)
- Prompts that help students think beyond surface observations
- Sentence frames: "This evidence supports my claim because..." and "The connection between my evidence and claim is..."

**CRITICAL: Ensure reasoning connections are explicit and subject-specific.**

**Differentiation Support:**
- Sentence starters for students who need language support
- Extension questions for advanced learners
- Visual or graphic organizer suggestions if helpful

Make these prompts feel like a natural part of discussing ${topic}, not like a separate framework being imposed on the lesson.`;
}

function generateActivityNamePrompt(subject: string, gradeLevel: string, topic: string, activityType: string): string {
  const subjectThemes = getSubjectThemes(subject.toLowerCase())
  const selectedTheme = subjectThemes[Math.floor(Math.random() * subjectThemes.length)]
  
  return `
**Engaging Activity Name Creation**

Create ONE memorable, engaging activity name that students will love referencing. The name should:

- Be appropriate for ${gradeLevel} students
- Connect clearly to ${topic}
- Sound exciting and engaging (not academic or boring)
- Be easy for students to remember and say
- Capture the essence of the ${activityType} activity type
- AVOID overused themes like "Detective" or "Investigation" 
- Use fresh, creative vocabulary specific to ${subject}

**SUGGESTED THEME FOR THIS ACTIVITY: ${selectedTheme}**

Subject-specific naming examples for ${subject}:
${getSubjectExamples(subject.toLowerCase(), topic)}

AVOID REPETITIVE PATTERNS:
- Don't default to "Detective Investigation" 
- Don't overuse "Challenge", "Quest", or "Adventure"
- Create names that sound unique and topic-specific
- Use vocabulary that connects to ${topic} specifically
- Generate 2-3 name options and select the most creative one
- Avoid generic patterns - make it specific to ${topic}

**CREATIVITY REQUIREMENTS:**
- The name should sound fresh and not formulaic
- Include specific ${topic} vocabulary when possible  
- Make it memorable and age-appropriate for ${gradeLevel}
- Ensure it matches the ${activityType} activity type

Format the name prominently as: **ACTIVITY NAME: [Your Creative Name Here]**

Place this at the very beginning of the Activity Instructions section so it's the first thing teachers and students see.`;
}

function getSubjectThemes(subject: string): string[] {
  switch (subject) {
    case 'science':
      return ['Lab Experiment', 'Nature Explorer', 'Science Discovery', 'Research Mission', 'Laboratory Challenge', 'Field Study', 'Science Studio']
    case 'math':
    case 'mathematics':
      return ['Math Workshop', 'Problem Solving Arena', 'Number Studio', 'Logic Lab', 'Math Academy', 'Calculation Center', 'Pattern Studio']
    case 'english':
    case 'ela':
    case 'language arts':
      return ['Story Workshop', 'Reading Lounge', 'Writer\'s Studio', 'Literature Circle', 'Word Craft', 'Reading Adventure', 'Story Builder']
    case 'social studies':
    case 'history':
      return ['Time Machine Journey', 'Culture Explorer', 'Historical Spotlight', 'World Traveler', 'Timeline Builder', 'Heritage Hunter', 'Global Connections']
    case 'art':
      return ['Art Studio', 'Creative Workshop', 'Artist\'s Canvas', 'Design Lab', 'Art Gallery', 'Creative Corner', 'Masterpiece Maker']
    case 'music':
      return ['Music Studio', 'Sound Lab', 'Rhythm Workshop', 'Melody Maker', 'Music Academy', 'Band Practice', 'Concert Hall']
    case 'advisory/sel':
    case 'advisory':
    case 'sel':
      return ['Circle Time', 'Growth Workshop', 'Reflection Corner', 'Community Builder', 'Mindful Moment', 'Connection Circle', 'Life Skills Lab']
    default:
      return ['Learning Lab', 'Knowledge Workshop', 'Discovery Center', 'Study Session', 'Academic Arena', 'Learning Studio', 'Classroom Challenge']
  }
}

function getSubjectExamples(subject: string, topic: string): string {
  switch (subject) {
    case 'science':
      return `- "${topic} Lab Experiment" - hands-on discovery\n- "${topic} Field Study" - outdoor exploration\n- "Nature's ${topic} Secrets" - discovery focus`
    case 'math':
    case 'mathematics':
      return `- "${topic} Problem Arena" - challenge focus\n- "Number Ninja: ${topic}" - skill building\n- "${topic} Logic Lab" - reasoning focus`
    case 'english':
    case 'ela':
    case 'language arts':
      return `- "${topic} Story Workshop" - creative writing\n- "Reading ${topic} Adventure" - literature focus\n- "${topic} Word Craft" - vocabulary building`
    case 'social studies':
    case 'history':
      return `- "${topic} Time Journey" - historical exploration\n- "Global ${topic} Connections" - cultural focus\n- "${topic} Heritage Hunt" - research focus`
    case 'advisory/sel':
    case 'advisory':
    case 'sel':
      return `- "${topic} Circle Time" - community building\n- "${topic} Growth Workshop" - skill development\n- "${topic} Reflection Corner" - self-awareness focus`
    default:
      return `- "${topic} Discovery Lab" - exploration focus\n- "${topic} Learning Studio" - skill building\n- "${topic} Knowledge Quest" - research focus`
  }
}

function generateAPEnhancement(gradeLevel: string, topic: string): string {
  // Get course-specific data for targeted prompting
  const courseMap: { [key: string]: {
    skills: string;
    examTypes: string;
    collegeTasks: string;
    terminology: string;
  } } = {
    'AP US History': {
      skills: 'Historical evidence analysis, thesis-driven arguments, document analysis (HIPP), causation/continuity analysis',
      examTypes: 'DBQ, LEQ, SAQ, multiple-choice with primary sources',
      collegeTasks: 'Primary source analysis, thesis-driven essays, historical argument construction',
      terminology: 'Historical thinking skills, periodization, contextualization, synthesis'
    },
    'AP Biology': {
      skills: 'Scientific investigation, data analysis, experimental design, model construction',
      examTypes: 'Multiple-choice with data analysis, free response with lab scenarios',
      collegeTasks: 'Lab reports with full methodology, data interpretation, research analysis',
      terminology: 'Science practices, quantitative analysis, experimental controls, peer review'
    },
    'AP English Literature': {
      skills: 'Literary analysis, rhetorical analysis, argument construction, close reading',
      examTypes: 'Multiple-choice with passages, poetry analysis, prose fiction analysis, argument essay',
      collegeTasks: 'Literary criticism essays, close reading analysis, comparative literature',
      terminology: 'Literary devices, rhetorical strategies, thematic analysis, textual evidence'
    },
    'AP Calculus': {
      skills: 'Mathematical reasoning, problem-solving, function analysis, limit concepts',
      examTypes: 'Multiple-choice, free response with justification, calculator and non-calculator sections',
      collegeTasks: 'Mathematical proofs, real-world applications, function analysis',
      terminology: 'Mathematical justification, continuity, differentiability, analytical methods'
    }
  };

  const courseData = courseMap[gradeLevel] || {
    skills: 'College-level analysis, critical thinking, independent research, academic writing',
    examTypes: 'Multiple-choice and free response requiring higher-order thinking',
    collegeTasks: 'Research papers, analytical essays, independent investigations',
    terminology: 'Academic discourse, evidence-based reasoning, scholarly analysis'
  };

  return `
**🎓 AP COLLEGE BOARD ALIGNMENT FOR ${gradeLevel}**

**Course & Exam Description (CED) Integration:**
- Connect this ${topic} lesson to specific CED learning objectives and enduring understandings
- Reference relevant essential questions that connect to broader course themes
- Include specific exam skills being developed: ${courseData.skills}
- Note exam weighting context for content emphasis and student understanding

**Authentic College-Level Rigor:**
Your activity MUST include these college-preparation elements:
- **Depth over breadth:** Focus on thorough conceptual mastery rather than content coverage
- **Higher-order thinking:** Analysis, synthesis, evaluation rather than memorization
- **Novel applications:** Students apply knowledge to new, unfamiliar situations
- **Academic discourse:** Use College Board terminology and scholarly language
- **Independent learning:** Build toward student self-direction and research skills

**AP Exam Skill-Building (Integrated, Not Test Prep):**
Naturally weave in AP exam formats through authentic learning:
- ${courseData.examTypes}
- Time management and prompt analysis skills
- Multiple-choice strategic thinking
- Free response structure and scoring expectations

**College-Level Task Requirements:**
Include these authentic collegiate elements:
- ${courseData.collegeTasks}
- College-level academic writing with proper citation expectations
- Peer review and revision processes
- Independent research components where appropriate
- Professional presentation of findings

**Scaffolded Independence Framework:**
Design the activity with developmental progression:
- **Teacher modeling:** Demonstrate college-level thinking processes explicitly
- **Guided practice:** Students practice with structured support and feedback
- **Independent application:** Students work autonomously with authentic challenge
- **Self-assessment:** Students evaluate their own work against college standards

**College Board Standards:**
- This activity should feel distinctly different from regular high school classes
- Maintain authentic college preparation that builds genuine readiness
- Balance rigor with appropriate developmental support
- Focus on building college-level thinking habits and academic skills
- Use ${courseData.terminology} consistently throughout

**CRITICAL AP REQUIREMENTS:**
- Every activity must explicitly connect to College Board frameworks
- Include specific skill development that transfers to college coursework
- Provide authentic intellectual challenge with appropriate scaffolding
- Prepare students for both exam success AND college academic demands
- Maintain high expectations while supporting student growth toward independence

This is authentic college preparation - create an activity worthy of college credit.`;
}

function createSubjectSpecificPrompt(subject: string, gradeLevel: string, topic: string, activityType: string): string {
  const isMath = isMathSubject(subject, gradeLevel);
  const isSEL = subject.toLowerCase().includes('advisory') || subject.toLowerCase().includes('sel');
  const isAPCourse = gradeLevel.startsWith('AP ');
  
  // Advisory/SEL subjects should NEVER be college-level, even in AP contexts
  if (isSEL) {
    return generateSELEnhancementPrompt(subject, gradeLevel, topic, activityType);
  } else if (isMath) {
    return generateMathEnhancedPrompt(subject, gradeLevel, topic, activityType);
  } else {
    return generateNonMathSubjectPrompt(subject, gradeLevel, topic, activityType);
  }
}

function generateNonMathSubjectPrompt(subject: string, gradeLevel: string, topic: string, activityType: string): string {
  return `
**CRITICAL: NON-MATHEMATICAL CONTENT GENERATION**

This is a ${subject} lesson for ${gradeLevel} students. ABSOLUTELY NO mathematical notation, expressions, or symbols should be included anywhere in the lesson plan.

**STRICTLY FORBIDDEN CONTENT:**
- NO [math]...[/math] tags of any kind
- NO LaTeX notation (\\frac, \\sqrt, etc.)
- NO fraction notation like \\frac{a}{b} or a/b presented as mathematical expressions
- NO mathematical equations or formulas
- NO mathematical symbols (∫, ∑, π, α, β, etc.)
- NO mathematical expressions using variables (x, y, f(x), etc.)
- NO numerical expressions presented as equations
- NO mathematical problem-solving content

**REQUIRED FORMATTING:**
- Use only regular text formatting (bold, italic, lists)
- Use plain language appropriate for ${subject}
- Focus exclusively on ${subject}-specific vocabulary and concepts
- All numerical references should be in plain text context, not as mathematical expressions
- Any fractions should be written in words (e.g., "one-half" not "1/2" as a mathematical expression)

**${subject.toUpperCase()} CONTENT REQUIREMENTS:**
- Use authentic ${subject} terminology and concepts
- Include ${subject}-appropriate examples and real-world applications
- Focus on skills and knowledge directly relevant to ${subject} curriculum
- Create activities that genuinely connect to ${topic} within the ${subject} domain
- Ensure content feels naturally designed for ${subject} students

**QUALITY CHECK:**
Before finalizing, verify that NO mathematical notation, symbols, or expressions appear anywhere in the lesson. This content should be indistinguishable from what a ${subject} specialist would create.

This is a ${subject} lesson, NOT a mathematics lesson. Keep it authentic to the subject area.`;
}

function generateSELEnhancementPrompt(subject: string, gradeLevel: string, topic: string, activityType: string): string {
  return `
**ADVISORY CONVERSATION APPROACH:**

This is NOT a formal lesson - it's a facilitated conversation for relationship and community building. You are creating content that feels like a caring adult having a thoughtful chat with young people.

**CRITICAL FORMATTING RULE - STRICTLY ENFORCED:**
- ABSOLUTELY NO mathematical notation, expressions, equations, or symbols of any kind
- NO [math]...[/math] tags anywhere in the content
- NO LaTeX expressions (\\frac{}{}, \\sqrt{}, etc.)
- NO mathematical variables (x, y, f(x), etc.) or equations
- NO mathematical symbols (∫, ∑, π, α, β, fractions, etc.)
- NO numerical expressions presented as mathematical problems
- Use ONLY conversational language and regular text formatting
- This is social-emotional learning and relationship building, NOT mathematics or academics
- Any numbers mentioned should be in plain conversational context only

**CONVERSATIONAL PHILOSOPHY:**
- Teacher is a conversation facilitator, NOT an instructor delivering content
- Focus on "What do you think?" rather than "What is the right answer?"
- Students drive the direction through their interests and responses  
- Feel natural and organic, not scripted or clinical
- Build relationships and community, not deliver academic content

**CONVERSATION FORMAT:**
- NO precise time breakdowns (use flexible suggestions like "Start with..." or "When ready to wrap up...")
- NO formal assessments, rubrics, or grading components
- NO materials beyond conversation and maybe paper/pen if students want to jot thoughts
- NO teacher prep burden or complicated setup

**CONTENT STYLE FOR ${topic.toUpperCase()}:**
- Start with an engaging question or relatable scenario about ${topic} that students naturally want to discuss
- Provide conversation starters and prompts, NOT step-by-step instructions
- Include "If the conversation goes toward..." guidance to help teachers navigate different directions
- Offer multiple ways the discussion might evolve based on student interests
- Give students voice and choice in where the conversation leads

**CONVERSATION FEEL:**
- Like a thoughtful circle chat, not a classroom lesson
- Help students think about themselves, their relationships, and their experiences with ${topic}
- Simple, meaningful prompts that can spark genuine discussion
- Options for quiet students to reflect privately or participate in ways that feel comfortable
- Natural closure that emerges from the conversation rather than forced wrap-up activities

**FACILITATION GUIDANCE:**
- Provide supportive conversation starters that any caring adult could use
- Include gentle ways to keep discussion healthy and inclusive
- Suggest how to honor different perspectives without judgment
- Offer ideas for drawing out quiet voices without putting anyone on the spot

Create content that feels like the kind of meaningful conversation a trusted mentor might have with young people - supportive, thought-provoking, and relationship-building, but never academic or clinical.`;
}

function generateTeacherModePrompt(activityData: {
  subject: string;
  gradeLevel: string;
  topic: string;
  activityType: string;
  duration: string;
  classSize?: string;
  specialNotes?: string;
  regenerating?: boolean;
}): string {
  const { subject, gradeLevel, topic, activityType, duration, classSize, specialNotes, regenerating } = activityData;
  
  const isAPCourse = gradeLevel.startsWith('AP ');
  const isMath = isMathSubject(subject, gradeLevel);
  const isSEL = subject.toLowerCase().includes('advisory') || subject.toLowerCase().includes('sel');
  const useCER = shouldUseCER(subject, gradeLevel, activityType);
  const fluidCERPrompting = useCER ? getFluidCERPrompting(subject, gradeLevel, topic, activityType) : '';
  const activityNamePrompt = generateActivityNamePrompt(subject, gradeLevel, topic, activityType);
  // Advisory/SEL subjects should never have AP enhancement, even if gradeLevel suggests AP
  const apEnhancement = (isAPCourse && !isSEL) ? generateAPEnhancement(gradeLevel, topic) : '';
  const subjectSpecificEnhancement = createSubjectSpecificPrompt(subject, gradeLevel, topic, activityType);
  
  const baseInstructions = isSEL 
    ? `You are creating a developmentally appropriate Advisory/SEL conversation activity focused on relationship-building and social-emotional growth. This is NOT academic instruction.`
    : (isAPCourse 
      ? `You are creating an AP-level activity with authentic college rigor and College Board alignment. This must prepare students for both AP exam success AND genuine college readiness.`
      : `You are creating a comprehensive, standards-aligned activity for professional teachers. Focus on research-based instructional strategies and activities using common classroom materials.`);
  
  return `${baseInstructions}

${regenerating ? '**IMPORTANT: This is a REGENERATION request. Create completely fresh, different content while maintaining the same high quality and standards. Avoid repeating previous versions.**' : ''}

ACTIVITY SPECIFICATIONS:
- Subject: ${subject}
- Grade Level: ${gradeLevel}
- Topic: ${topic}
- Activity Type: ${activityType}
- Duration: ${duration} minutes
- Class Size: ${classSize || 'Standard class size'}
- Special Notes: ${specialNotes || 'None'}

${apEnhancement}

${subjectSpecificEnhancement}

**Teaching Insights & Discussion Starters**

Create a brief, natural teacher talk track that helps frame this ${topic} lesson effectively:

**Frame this as:** [One compelling way to introduce the big idea behind ${topic}${isAPCourse ? ' with college-level depth and CED connection' : ''}]

**Connect to prior learning:** [How ${topic} builds on what students already know${isAPCourse ? ' and prepares for future college coursework' : ''}]

**Vocabulary flow:** [3-4 key terms in the order teachers should introduce them${isAPCourse ? ' using College Board terminology' : ''}]

**Discussion hooks:** [2-3 questions that get students thinking deeper about ${topic}${isAPCourse ? ' with analytical and evaluative reasoning' : ''}]

**Wonder questions:** [Questions that spark curiosity and extend beyond the lesson${isAPCourse ? ' toward independent college-level inquiry' : ''}]

**Quick reference:** [Suggest one reliable website or resource for additional examples/context${isAPCourse ? ' including College Board resources' : ''}]

${useCER ? fluidCERPrompting : ''}

${useCER ? `
**🔍 CER INTEGRATION REQUIREMENT:**
This lesson MUST include prominent Claim, Evidence, Reasoning components. Weave CER naturally throughout:
- Students form clear CLAIMS about ${topic}
- Students gather specific EVIDENCE from their work  
- Students explain their REASONING connecting evidence to claims
- Include multiple CER moments, not just one at the end
- Make CER feel natural to learning ${topic}, not forced
` : ''}

**Learning Objectives**
${isAPCourse 
  ? `State 1-2 specific, measurable learning objectives that:
- Align with College Board CED learning objectives and enduring understandings  
- Include specific AP exam skills being developed
- Connect to broader course essential questions
- Prepare students for college-level academic work`
  : `State 1-2 specific, measurable learning objectives aligned with grade-level standards.`}

**Materials Needed**
${isAPCourse 
  ? `List classroom materials for college-level work:
- Paper, pencils, whiteboard, basic supplies
- Access to primary sources, texts, or data sets as appropriate
- College-level resources (articles, documents, authentic materials)
- Technology for research/presentation if needed`
  : `List only common classroom materials:
- Paper, pencils, whiteboard, basic supplies
- NO special equipment or unusual materials`}

**Activity Instructions**

${activityNamePrompt}

**Opening Hook (${Math.ceil(parseInt(duration) * 0.15)} minutes)**
${isAPCourse 
  ? `Create a college-level introduction to ${topic}:
- Connect to essential questions and broader course themes
- Use authentic materials (primary sources, current research, real-world data)
- Pose analytical questions that require higher-order thinking
- Establish academic discourse expectations`
  : `Create an engaging introduction to ${topic} using discussion, questioning, or simple demonstration.`}

**Main Activity (${Math.ceil(parseInt(duration) * 0.7)} minutes)**

**Phase 1: ${isAPCourse ? `Investigate & Analyze ${topic}` : `Explore ${topic}`} (${Math.ceil(parseInt(duration) * 0.3)} minutes)**
${isAPCourse 
  ? `Design college-level investigation with authentic materials:
- Students work with primary sources, data sets, or complex texts
- Include explicit skill development (analysis, interpretation, evaluation)
- Require evidence-based reasoning and academic discourse
- Build toward independent intellectual work
- Connect to specific CED learning objectives`
  : `Design hands-on exploration using basic materials. Include:
- Clear teacher instructions
- What students do  
- Key questions to guide discovery`}
${useCER ? '- Natural opportunities for students to start forming initial thoughts about their findings' : ''}

**Phase 2: ${isAPCourse ? `Synthesize & Construct Arguments` : `Apply Understanding`} (${Math.ceil(parseInt(duration) * 0.25)} minutes)**
${isAPCourse 
  ? `Students engage in college-level academic work:
- Construct evidence-based arguments or analyses
- Use proper academic discourse and College Board terminology
- Include peer review and revision processes
- Practice AP exam skills naturally through authentic tasks
- Demonstrate mastery through college-level performance`
  : `Create application activity where students use their ${topic} knowledge:
- Step-by-step process
- How students show understanding`}
${useCER ? '- Integrated moments for students to articulate claims and evidence using the fluid prompts above' : ''}
${!isAPCourse ? '- Simple differentiation options' : ''}

**Phase 3: ${isAPCourse ? `Evaluate & Extend` : `Connect & Extend`} (${Math.ceil(parseInt(duration) * 0.15)} minutes)**
${isAPCourse 
  ? `Students work toward independent college-level thinking:
- Evaluate their own work against college standards
- Make connections to broader course themes and real-world applications  
- Consider alternative perspectives and counterarguments
- Plan for continued independent learning and research`
  : `Help students see bigger connections and applications of ${topic}.`}
${useCER ? '- Students deepen their reasoning and consider alternative explanations using guided prompting' : ''}

**Exit Ticket & ${isAPCourse ? `Self-Assessment` : `Check Understanding`} (${Math.ceil(parseInt(duration) * 0.15)} minutes)**

**EXIT TICKET (Required for all lessons):**
Generate an appropriate exit ticket that helps solidify today's learning about ${topic}. The exit ticket should:
- Be quick to complete (2-3 minutes maximum)
- Directly assess the key learning objectives
- Be appropriate for ${gradeLevel} students
- Help students reflect on their understanding of ${topic}
- Allow teachers to quickly gauge learning effectiveness

Choose ONE format that best fits this ${topic} lesson:
${isAPCourse 
  ? `**AP-Level Exit Ticket Options:**
- **Analytical Response:** One focused question requiring evidence-based reasoning about ${topic} with college-level expectations
- **Connection Challenge:** Connect today's ${topic} learning to broader course themes and real-world applications  
- **Self-Assessment Matrix:** Students evaluate their mastery against specific AP learning objectives
- **Essential Question Reflection:** Address how today's work advances their understanding of course essential questions`
  : `**Exit Ticket Format Options:**
- **3-2-1 Ticket:** 3 things learned about ${topic}, 2 questions remaining, 1 connection to real life
- **Quick Check Questions:** 2-3 focused questions directly testing ${topic} understanding
- **Reflection Prompt:** One thoughtful question about today's ${topic} learning
- **Apply & Explain:** Brief scenario where students apply ${topic} knowledge and explain their thinking
- **Scale & Explain:** Rate understanding 1-5 and explain what helped or challenged them with ${topic}`}

${isAPCourse 
  ? `**College-level closure and self-evaluation:**
- Students assess their work against AP/college standards
- Identify areas for continued growth and development
- Connect learning to upcoming coursework and assessments
- Reflect on skill development and academic growth`
  : `**Additional wrap-up activities:**
- Simple but effective ways to assess learning using basic classroom methods
- Quick discussion of key takeaways`}
${useCER ? '- Quick opportunity for students to share their strongest claim and evidence about ' + topic : ''}

**${isAPCourse ? `Scaffolded Support Options` : `Differentiation Options`}**
${isAPCourse 
  ? `Provide college-preparation scaffolds while maintaining high expectations:
- **Academic support:** Sentence frames for college-level discourse, model examples of expert reasoning
- **Challenge extensions:** Independent research opportunities, connections to current scholarship
- **Language scaffolds:** Support for academic vocabulary and College Board terminology
- **Skill development:** Explicit instruction in AP exam skills and college-level thinking processes`
  : `2-3 practical ways to support different learners:
- Support for struggling students
- Extensions for advanced students  
- Adaptations for English learners`}
${useCER ? '- Additional sentence frames and scaffolds for reasoning about ' + topic : ''}

**Assessment Ideas**
${isAPCourse 
  ? `College-level assessment aligned with AP standards:
- **Formative:** Quick checks using AP-style questions or college-level analysis tasks
- **Performance-based:** Students demonstrate college-level skills through authentic tasks  
- **Self-assessment:** Students evaluate their work against AP/college rubrics
- **Skill development:** Evidence of growth in specific AP exam skills and college readiness`
  : `Practical ways to gauge student understanding:`}
${useCER && !isAPCourse ? '- Look for evidence that students can make reasonable claims about ' + topic + ' with supporting evidence' : ''}
${!isAPCourse ? '- Formative assessment strategies\n- Evidence of learning to look for' : ''}

**Teaching Tips**
${isAPCourse 
  ? `Strategic guidance for authentic college-level instruction:
- **Maintain high expectations:** Hold students to college standards while providing appropriate support
- **Model expert thinking:** Demonstrate college-level reasoning and academic discourse explicitly  
- **Build independence gradually:** Scaffold toward student self-direction and autonomous learning
- **Connect to real college work:** Show how this preparation transfers to actual college coursework`
  : `2-3 practical insights for smooth implementation.`}
${useCER && !isAPCourse ? 'Include specific tips for guiding students through reasoning about ' + topic + ' naturally.' : ''}

Create a research-based activity that aligns with professional teaching standards and can be successfully delivered with common classroom materials. If CER is included, make it feel like a natural part of learning about ${topic}, not a separate academic exercise. Make sure the activity name is memorable and engaging for students to reference.`;
}

function generateSubModePrompt(activityData: {
  subject: string;
  gradeLevel: string;
  topic: string;
  activityType: string;
  duration: string;
  substituteName?: string;
  specialNotes?: string;
  regenerating?: boolean;
}): string {
  const { subject, gradeLevel, topic, activityType, duration, substituteName, specialNotes, regenerating } = activityData;
  
  const isAPCourse = gradeLevel.startsWith('AP ');
  const isMath = isMathSubject(subject, gradeLevel);
  const isSEL = subject.toLowerCase().includes('advisory') || subject.toLowerCase().includes('sel');
  const useCER = shouldUseCER(subject, gradeLevel, activityType);
  const isElementary = gradeLevel.toLowerCase().includes('prek') || gradeLevel.toLowerCase().includes('k') || 
                      gradeLevel.toLowerCase().includes('1st') || gradeLevel.toLowerCase().includes('2nd') ||
                      gradeLevel.toLowerCase().includes('3rd') || gradeLevel.toLowerCase().includes('4th') ||
                      gradeLevel.toLowerCase().includes('5th');
  
  const activityNamePrompt = generateActivityNamePrompt(subject, gradeLevel, topic, activityType);
  
  // Create subject-specific enhancement for substitute mode
  const subjectSpecificSubEnhancement = isMath ? generateMathEnhancedPrompt(subject, gradeLevel, topic, activityType) : 
    (isSEL ? `
**ADVISORY CONVERSATION FOR SUBSTITUTES:**
This ${topic} advisory is simply a facilitated conversation - like being a caring adult who asks thoughtful questions and listens. No special training needed! Students will naturally share and reflect. Your job is just to create a welcoming space where they can talk about ${topic} in whatever way feels meaningful to them. Think of it like being a supportive mentor having a chat, not teaching a lesson.` : 
    generateNonMathSubjectPrompt(subject, gradeLevel, topic, activityType));
  
  const baseInstructions = isAPCourse 
    ? `You are creating a substitute-friendly AP activity that maintains college-level rigor while being manageable for any substitute. Focus on discussion-based college preparation, independent analytical work, and authentic AP-level tasks.`
    : `You are creating an EXTREMELY SIMPLE substitute activity that requires NO PREPARATION and NO SPECIAL MATERIALS. Focus on discussion-based learning, independent work, and video resources that any substitute can manage easily.`;
  
  return `${baseInstructions}

${regenerating ? '**IMPORTANT: This is a REGENERATION request. Create completely fresh, different content while maintaining the same simplicity and substitute-friendly approach. Avoid repeating previous versions.**' : ''}

SUBSTITUTE ACTIVITY SPECIFICATIONS:
- Subject: ${subject}
- Grade Level: ${gradeLevel}  
- Topic: ${topic}
- Activity Type: ${activityType}
- Duration: ${duration} minutes
- Substitute Name: ${substituteName || '[Substitute Teacher]'}
- Special Notes: ${specialNotes || 'None'}

${subjectSpecificSubEnhancement}

SUBSTITUTE-FRIENDLY REQUIREMENTS:
${isAPCourse 
  ? `✅ COLLEGE-LEVEL DISCUSSION (analytical conversations about ${topic})
✅ INDEPENDENT ANALYTICAL WORK (reading primary sources, writing arguments, critical thinking)
✅ AP-APPROPRIATE RESOURCES (College Board materials, scholarly articles, authentic texts)
✅ SUBSTITUTE-MANAGEABLE but maintains AP rigor and college preparation standards
✅ NO complex lab work, but includes college-level intellectual engagement
✅ AUTHENTIC AP TASKS that any substitute can facilitate`
  : `✅ DISCUSSION-BASED activities (students talk, share, reflect)
✅ INDEPENDENT WORK (reading, writing, drawing, thinking)
✅ VIDEO RESOURCES when appropriate (educational YouTube videos)
✅ NO hands-on activities, NO experiments, NO group work management
✅ NO prep required - everything students need is provided`}

**Welcome Message for ${substituteName || 'Substitute Teacher'}**

Hello ${substituteName || 'Substitute Teacher'}! This ${topic} activity is designed to be completely self-running. Students will engage through discussion, independent thinking, and reflection - no special materials or complex management needed.

**Quick ${topic} Background**
${topic} is [simple 2-sentence explanation]. If students have questions beyond the basics, encourage them to "write that down for your regular teacher" or "that's a great question to explore further."

${useCER && !isElementary ? `
**Simple Questions for Discussion:**
If students are sharing their thinking about ${topic}, you can ask:
- "What makes you think that about ${topic}?"
- "What did you notice that supports your idea?"
- "Can you explain why you think that?"
Keep it conversational - no need for formal structures.` : ''}

**Materials Already Available**
- Paper and pencils/pens
- Whiteboard for writing key words
- Nothing else needed

**Simple Activity Plan**

${activityNamePrompt}

**Opening Discussion (${Math.ceil(parseInt(duration) * 0.2)} minutes)**
**Say:** "Today we're thinking about ${topic}. Let's start by sharing what you already know."
**Write on board:** "${topic} - What We Know"
**Ask:** "Who can tell me one thing about ${topic}?" [Let 3-4 students share]
**Your job:** Listen and write key words on the board. Say "Interesting!" or "Good thinking!"

**Main Activity: ${topic} Exploration (${Math.ceil(parseInt(duration) * 0.6)} minutes)**

Choose ONE of these simple approaches:

**Option A: Discussion & Reflection (${Math.ceil(parseInt(duration) * 0.6)} minutes)**
**Say:** "Now I want you to think more deeply about ${topic}."
**Students do:** [Individual thinking and writing activity about ${topic}]
${useCER && !isElementary ? '**If students want to explain their thinking:** "Write what you think about ' + topic + ' and what makes you think that"' : ''}
**Your job:** Walk around quietly, encourage writing, help with spelling if asked
**If students finish early:** "Add more details" or "Draw a picture to go with your writing"

**Option B: Educational Video + Discussion (${Math.ceil(parseInt(duration) * 0.6)} minutes)**
**Recommended video:** [Suggest 1-2 age-appropriate educational videos about ${topic} from reliable sources like Khan Academy, Crash Course Kids, or educational YouTube channels]
**Say:** "We're going to watch a short video about ${topic}, then discuss what we learned."
**Students do:** Watch quietly, then discuss key points
**Your job:** Play video, pause occasionally to ask "What did you notice about ${topic}?"

**Option C: Independent Reading & Response (${Math.ceil(parseInt(duration) * 0.6)} minutes)**
**Say:** "You're going to read about ${topic} and then share your thoughts."
**Students do:** [Simple reading activity with written response about ${topic}]
**Your job:** Help with reading difficulties, encourage thoughtful responses

**Exit Ticket & Closing (${Math.ceil(parseInt(duration) * 0.2)} minutes)**

**QUICK EXIT TICKET (2-3 minutes):**
**Say:** "Before we finish, everyone will complete a quick exit ticket about ${topic}."
**Give students a simple exit ticket - choose the easiest option:**

**Option A: 3-2-1 Exit Ticket**
Write on board: "3 things you learned about ${topic}, 2 questions you have, 1 way this connects to your life"

**Option B: Simple Reflection**  
Write on board: "What's the most important thing you learned about ${topic} today? Explain why."

**Option C: Quick Check**
Ask 2 simple questions about ${topic} that students can answer based on today's work

**Students do:** Write responses quietly on paper (2-3 minutes max)
**Your job:** Walk around, encourage complete sentences, collect papers when done

**Closing Circle (2-3 minutes)**
**Say:** "Let's share one new thing we learned about ${topic} today."
**Students do:** Take turns sharing one insight (keep it quick)  
**Write on board:** "New Learning About ${topic}:" [List 3-4 key insights]
**End with:** "Great thinking today! Your teacher will be impressed with your learning."

**Classroom Management (Super Simple)**
- **Get attention:** Raise your hand and wait for students to raise theirs
- **If talking:** "I need listening ears for our ${topic} discussion"
- **If restless:** "Stand up and stretch for 30 seconds, then back to learning"
- **Stay positive:** "You're doing great thinking about ${topic}!"

**Emergency Backup Plans**
- **Video won't work:** Switch to discussion and independent writing
- **Students finish early:** "Write 3 questions you have about ${topic}"
- **Too much time left:** "Draw and label a picture showing what you learned"
- **Students are confused:** "That's okay! Write what you're wondering about"

**End-of-Class Checklist**
✅ Collect any written work (if teacher requested)
✅ Erase the board
✅ Students clean up their area
✅ Leave a note: "Students engaged well with ${topic} discussions"

**Note for Teacher**
[Leave space for substitute to write brief note about how the lesson went]

Create a completely hands-off activity focused on discussion, thinking, and reflection that requires zero preparation from the substitute. Make sure the activity name is simple and memorable for students to reference.`;
}

function getTopicSpecificMathContent(topic: string, subject: string, gradeLevel: string): string {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('pythagor') || topicLower.includes('identity')) {
    return `Let's explore the fundamental Pythagorean identity: [math]\\sin^2(\\theta) + \\cos^2(\\theta) = 1[/math]

This identity is one of the most important relationships in trigonometry. We'll verify it using the unit circle and explore its applications in solving trigonometric equations.`;
  }
  
  if (topicLower.includes('integration') || topicLower.includes('accumulation')) {
    return `Let's explore this key expression: [math]\\int_{0}^{2} (3x^2 + 2x - 1) dx[/math]

This integral represents the area under the curve from x = 0 to x = 2. Students will work through this step-by-step to understand the fundamental theorem of calculus.`;
  }
  
  if (topicLower.includes('derivative') || topicLower.includes('rate of change')) {
    return `Analyze the rate of change with this function: [math]f(x) = x^3 + 2x^2 - 4x + 1[/math]

Find where f'(x) = 0 to locate critical points and understand how the derivative describes the behavior of the original function.`;
  }
  
  if (topicLower.includes('quadratic') || topicLower.includes('parabola')) {
    return `Examine this quadratic function: [math]f(x) = 2x^2 - 8x + 6[/math]

We'll complete the square, find the vertex, and analyze the parabola's key features including axis of symmetry and x-intercepts.`;
  }
  
  if (topicLower.includes('exponential') || topicLower.includes('logarithm')) {
    return `Study exponential growth with: [math]N(t) = 100e^{0.05t}[/math]

This models population growth where N(t) represents the population after t years, starting with 100 individuals and growing at 5% per year.`;
  }
  
  // Generate contextual expression based on grade level and subject
  if (gradeLevel.toLowerCase().includes('calculus')) {
    return `Let's analyze this function: [math]f(x) = x^3 - 3x^2 + 2x[/math]

We'll find critical points, analyze concavity, and sketch the graph to understand the behavior of this cubic function.`;
  }
  
  if (gradeLevel.toLowerCase().includes('algebra') || gradeLevel.toLowerCase().includes('9th') || gradeLevel.toLowerCase().includes('10th')) {
    return `Solve this system of equations: [math]\\begin{cases} 2x + 3y = 12 \\\\ x - y = 1 \\end{cases}[/math]

We'll use substitution and elimination methods to find the intersection point of these two lines.`;
  }
  
  // Fallback for other grade levels - but topic-specific
  return `Analyze this mathematical relationship: [math]A = \\pi r^2[/math]

This formula represents the area of a circle. We'll explore how the area changes as the radius varies and investigate the mathematical constant π.`;
}

function generateIntelligentFallbackActivity(activityData: ActivityData) {
  console.log('🤖 Generating intelligent fallback activity for:', activityData.topic)
  
  const isSubMode = activityData.mode === 'substitute' || activityData.substituteMode
  const isMath = isMathSubject(activityData.subject, activityData.gradeLevel)
  
  // Generate high-quality topic-specific content
  const heroMathContent = isMath ? getAdvancedTopicMathContent(activityData.topic, activityData.subject, activityData.gradeLevel) : ''
  const practiceProblems = isMath ? getAdvancedTopicProblems(activityData.topic, activityData.subject, activityData.gradeLevel) : ''
  
  let fallbackActivity = isSubMode ? generateSubstituteFallback(activityData, heroMathContent, practiceProblems) : generateTeacherFallback(activityData, heroMathContent, practiceProblems)
  
  // Apply sanitization for non-math subjects in fallback system too
  if (!isMath) {
    console.log('🧹 Sanitizing fallback content to remove any mathematical expressions...');
    fallbackActivity = sanitizeContentForNonMath(fallbackActivity);
  }
  
  // Generate unique ID
  const activityId = `fallback_activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const fullActivityData = {
    id: activityId,
    mode: isSubMode ? 'substitute' : 'teacher',
    teacherName: 'Your Teacher',
    substituteName: activityData.substituteName || '',
    date: activityData.date || new Date().toISOString().split('T')[0],
    gradeLevel: activityData.gradeLevel,
    subject: activityData.subject,
    topic: activityData.topic,
    activityType: activityData.activityType,
    duration: activityData.duration || '50',
    classSize: activityData.classSize,
    specialNotes: activityData.specialNotes,
    generatedActivity: fallbackActivity,
    originalData: activityData,
    createdAt: new Date().toISOString(),
    isPractical: true,
    isStandardsAligned: true,
    includesCER: shouldUseCER(activityData.subject, activityData.gradeLevel, activityData.activityType),
    hasFluidCERPrompting: true,
    hasEngagingName: true,
    isIntelligentFallback: true
  }

  return NextResponse.json({
    success: true,
    activityId,
    activityData: fullActivityData,
    differentiationSuggestions: null,
    fallbackNotice: 'Generated using intelligent fallback system - full quality maintained'
  })
}

function generateTeacherFallback(activityData: ActivityData, heroMathContent: string, practiceProblems: string): string {
  const isAP = activityData.gradeLevel.startsWith('AP ')
  const duration = parseInt(activityData.duration) || 50
  
  return `
**Welcome Message**
Welcome to your ${activityData.topic} exploration! This ${isAP ? 'AP-level' : 'comprehensive'} activity will deepen your understanding of key concepts in ${activityData.subject}.

**ACTIVITY NAME: ${getCreativeActivityName(activityData.topic, activityData.subject, activityData.gradeLevel)}**

**Learning Objectives**
Students will be able to:
- Master key concepts of ${activityData.topic} appropriate for ${activityData.gradeLevel}
- Apply ${activityData.topic} principles to solve authentic problems
- Demonstrate understanding through mathematical reasoning and communication
${isAP ? '- Connect learning to College Board standards and AP exam expectations' : ''}

**Materials Needed**
- Paper and pencils
- Whiteboard and markers
- ${activityData.subject === 'Mathematics' || activityData.subject.includes('math') ? 'Calculator (if permitted)' : 'Basic classroom supplies'}
- Student worksheets (provided)

**Opening Hook (${Math.ceil(duration * 0.15)} minutes)**
${generateEngagingOpener(activityData.topic, activityData.subject, isAP)}

${heroMathContent ? `**Hero Mathematical Challenge**
${heroMathContent}

**Practice Problems**
${practiceProblems}` : ''}

**Main Activity (${Math.ceil(duration * 0.7)} minutes)**

**Phase 1: Discover ${activityData.topic} (${Math.ceil(duration * 0.3)} minutes)**
${generateDiscoveryPhase(activityData.topic, activityData.subject, activityData.gradeLevel, isAP)}

**Phase 2: Apply Understanding (${Math.ceil(duration * 0.25)} minutes)**
${generateApplicationPhase(activityData.topic, activityData.subject, activityData.gradeLevel, isAP)}

**Phase 3: Connect & Extend (${Math.ceil(duration * 0.15)} minutes)**
${generateExtensionPhase(activityData.topic, activityData.subject, activityData.gradeLevel, isAP)}

**Exit Ticket & Assessment (${Math.ceil(duration * 0.15)} minutes)**
${generateExitTicketPhase(activityData.topic, activityData.subject, activityData.gradeLevel, isAP)}

**Additional Wrap-Up:**
${generateWrapUpPhase(activityData.topic, activityData.subject, isAP)}

**Differentiation Options**
${generateDifferentiation(activityData.gradeLevel, isAP)}

**Assessment Ideas**
${generateAssessmentSuggestions(activityData.topic, activityData.subject, isAP)}

**Teaching Tips**
${generateTeachingTips(activityData.topic, activityData.subject, isAP)}
  `.trim()
}

function generateSubstituteFallback(activityData: ActivityData, heroMathContent: string, practiceProblems: string): string {
  const duration = parseInt(activityData.duration) || 50
  
  return `
**Welcome Message for ${activityData.substituteName || 'Substitute Teacher'}**

Hello! This ${activityData.topic} activity is designed to be completely self-running. Students will engage through discussion, independent thinking, and reflection.

**Quick ${activityData.topic} Background**
${generateSimpleTopicBackground(activityData.topic, activityData.subject)}

**ACTIVITY NAME: ${getCreativeActivityName(activityData.topic, activityData.subject, activityData.gradeLevel)}**

**Materials Available**
- Paper and pencils
- Whiteboard for key words
- Nothing else needed

**Simple Activity Plan**

**Opening Discussion (${Math.ceil(duration * 0.2)} minutes)**
**Say:** "Today we're exploring ${activityData.topic}. Let's start by sharing what you know."
${generateSubstituteOpener(activityData.topic)}

${heroMathContent ? `**Mathematical Content**
${heroMathContent}

**Practice Activities**
${practiceProblems}` : ''}

**Main Activity (${Math.ceil(duration * 0.6)} minutes)**
${generateSubstituteMainActivity(activityData.topic, activityData.subject, duration)}

**Exit Ticket & Closing (${Math.ceil(duration * 0.2)} minutes)**
${generateSubstituteExitTicket(activityData.topic)}

**Wrap-up:**
${generateSubstituteClosing(activityData.topic)}

**Classroom Management**
${generateSubstituteManagement(activityData.topic)}

**Emergency Backup Plans**
${generateBackupPlans(activityData.topic)}
  `.trim()
}

// Helper functions for intelligent fallback system
function getCreativeActivityName(topic: string, subject: string, gradeLevel: string): string {
  const isAP = gradeLevel.startsWith('AP ')
  const topicWords = topic.split(' ')
  const keyWord = topicWords[0] || 'Mathematical'
  
  const patterns = [
    `${keyWord} Discovery Lab`,
    `${topic} Problem Arena`,
    `Exploring ${topic}`,
    `${keyWord} Investigation`,
    `${topic} Workshop`
  ]
  
  return patterns[Math.floor(Math.random() * patterns.length)]
}

function generateEngagingOpener(topic: string, subject: string, isAP: boolean): string {
  if (isAP) {
    return `Connect ${topic} to real-world applications and College Board essential questions. Ask students: "How does ${topic} appear in your future career field?" Use this to transition into college-level analysis.`
  }
  return `Start with an engaging question: "What do you already know about ${topic}?" Write key terms on the board and use student responses to build connections to today's learning.`
}

function generateDiscoveryPhase(topic: string, subject: string, gradeLevel: string, isAP: boolean): string {
  if (isAP) {
    return `Students work with authentic materials to investigate ${topic}. Provide primary sources, data sets, or complex problems that require analytical thinking. Guide students to form hypotheses and test them using appropriate methods.`
  }
  return `Students explore ${topic} through hands-on activities and guided discovery. Use questioning techniques to help students uncover key patterns and relationships. Encourage observation and initial hypothesis formation.`
}

function generateApplicationPhase(topic: string, subject: string, gradeLevel: string, isAP: boolean): string {
  if (isAP) {
    return `Students apply ${topic} knowledge to construct evidence-based arguments and analyses. Include peer review processes and require use of appropriate academic discourse. Connect to AP exam skills naturally.`
  }
  return `Students practice applying ${topic} concepts through structured activities. Provide multiple opportunities for students to demonstrate understanding and receive feedback.`
}

function generateExtensionPhase(topic: string, subject: string, gradeLevel: string, isAP: boolean): string {
  if (isAP) {
    return `Students make connections between ${topic} and broader course themes. Encourage evaluation of alternative perspectives and consideration of real-world applications in their field of interest.`
  }
  return `Help students connect ${topic} to other areas of study and real-world applications. Discuss how this knowledge builds toward future learning.`
}

function generateExitTicketPhase(topic: string, subject: string, gradeLevel: string, isAP: boolean): string {
  const grade = gradeLevel.toLowerCase();
  
  if (isAP) {
    return `**EXIT TICKET: ${topic} Analysis (3-4 minutes)**
Create one focused question that requires students to analyze or synthesize their ${topic} learning:
- Connect ${topic} to broader course themes and real-world applications
- Require evidence-based reasoning appropriate for college-level work  
- Assess mastery of today's specific ${topic} learning objectives
- Example: "Based on today's investigation of ${topic}, construct an argument for how this concept applies to [relevant real-world scenario]. Support your reasoning with specific evidence from our work."

Students complete individually and submit - this provides immediate feedback on lesson effectiveness and individual understanding.`
  } else if (grade.includes('elementary') || grade.includes('1st') || grade.includes('2nd') || grade.includes('3rd') || grade.includes('4th') || grade.includes('5th')) {
    return `**EXIT TICKET: ${topic} Check-In (2-3 minutes)**
Use a simple, engaging format appropriate for elementary students:
- **Picture & Explain:** Draw one thing you learned about ${topic} and write one sentence explaining it
- **Thumbs Up Check:** Rate your understanding of ${topic} (thumbs up, sideways, down) and write why
- **Simple Question:** Ask one focused question that checks if students understood the main ${topic} concept
- Keep language simple and provide visual supports if helpful

This quick check helps you see who grasped the key ${topic} ideas and who might need additional support tomorrow.`
  } else {
    return `**EXIT TICKET: ${topic} Reflection (2-3 minutes)**
Choose the format that best assesses today's ${topic} learning:
- **3-2-1 Ticket:** 3 things learned about ${topic}, 2 questions remaining, 1 real-world connection
- **Quick Application:** Brief scenario where students apply ${topic} knowledge and explain their thinking  
- **Scale & Justify:** Rate understanding 1-5 and explain what helped or challenged them with ${topic}
- **Key Concept Check:** 1-2 focused questions that directly assess the main ${topic} learning objectives

Students complete on paper - collect these to inform tomorrow's instruction and identify who needs additional ${topic} support.`
  }
}

function generateWrapUpPhase(topic: string, subject: string, isAP: boolean): string {
  if (isAP) {
    return `Students assess their own work against college-level standards and identify areas for continued growth. Connect to upcoming coursework and college preparation.`
  }
  return `Review key concepts through quick discussion. Ask students to share one insight that will stick with them about ${topic}.`
}

function generateDifferentiation(gradeLevel: string, isAP: boolean): string {
  if (isAP) {
    return `- **Academic support:** Sentence frames for college-level discourse and model examples
- **Challenge extensions:** Independent research and connections to current scholarship
- **Language scaffolds:** Support for academic vocabulary and College Board terminology`
  }
  return `- **Support:** Additional scaffolding and visual aids for struggling students
- **Extensions:** Challenge problems and research opportunities for advanced students
- **EL Support:** Vocabulary support and visual representations`
}

function generateAssessmentSuggestions(topic: string, subject: string, isAP: boolean): string {
  if (isAP) {
    return `- **Formative:** Quick checks using AP-style questions and analysis tasks
- **Performance-based:** College-level skills demonstration through authentic tasks
- **Self-assessment:** Students evaluate work against AP/college rubrics`
  }
  return `- **Formative:** Observation, questioning, and quick comprehension checks
- **Summative:** Work samples and demonstrations of understanding
- **Evidence:** Look for conceptual mastery rather than just procedural skills`
}

function generateTeachingTips(topic: string, subject: string, isAP: boolean): string {
  if (isAP) {
    return `- **Maintain rigor:** Hold students to college standards with appropriate support
- **Model thinking:** Demonstrate college-level reasoning explicitly
- **Build independence:** Scaffold toward student autonomy and self-direction`
  }
  return `- **Stay flexible:** Adjust pacing based on student understanding
- **Use questioning:** Guide discovery rather than direct instruction
- **Encourage discussion:** Create opportunities for student-to-student learning`
}

function generateSimpleTopicBackground(topic: string, subject: string): string {
  return `${topic} is a key concept in ${subject}. If students ask complex questions, encourage them to "write that down for your regular teacher" or "that's a great question to explore further."`
}

function generateSubstituteOpener(topic: string): string {
  return `**Write on board:** "${topic} - What We Know"
**Ask:** "Who can share one thing about ${topic}?" [Let 3-4 students share]
**Your job:** Listen and write key words. Say "Interesting!" or "Good thinking!"`
}

function generateSubstituteMainActivity(topic: string, subject: string, duration: number): string {
  return `**Option A: Discussion & Writing (${Math.ceil(duration * 0.6)} minutes)**
Students think and write about ${topic}. Walk around quietly, encourage detailed responses.

**Option B: Independent Reading (${Math.ceil(duration * 0.6)} minutes)**
Students read about ${topic} and respond to simple questions. Help with reading difficulties.`
}

function generateSubstituteExitTicket(topic: string): string {
  return `**QUICK EXIT TICKET (2-3 minutes):**
**Say:** "Before we finish, everyone will complete a quick exit ticket about ${topic}."
**Choose the simplest option:**

**Option A: 3-2-1 Exit Ticket**
Write on board: "3 things you learned about ${topic}, 2 questions you have, 1 way this connects to your life"

**Option B: Simple Reflection**  
Write on board: "What's the most important thing you learned about ${topic} today? Explain why."

**Option C: Quick Check**
Ask 2 simple questions about ${topic} that students can answer based on today's work

**Students do:** Write responses quietly on paper (2-3 minutes max)
**Your job:** Walk around, encourage complete sentences, collect papers when done`
}

function generateSubstituteClosing(topic: string): string {
  return `**Say:** "Share one new thing you learned about ${topic}."
**Students:** Take turns sharing insights (keep it quick)
**Write on board:** "New Learning: [student responses]"`
}

function generateSubstituteManagement(topic: string): string {
  return `- **Get attention:** Raise hand and wait
- **If talking:** "I need listening ears for ${topic}"
- **Stay positive:** "Great thinking about ${topic}!"`
}

function generateBackupPlans(topic: string): string {
  return `- **Extra time:** "Write 3 questions about ${topic}"
- **Confusion:** "Write what you're wondering about"
- **Early finish:** "Draw and label what you learned"`
}

function getAdvancedTopicMathContent(topic: string, subject: string, gradeLevel: string): string {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('pythagor') || topicLower.includes('identity')) {
    return `Explore the fundamental Pythagorean identity: [math]\\sin^2(\\theta) + \\cos^2(\\theta) = 1[/math]

This identity is one of the most important relationships in trigonometry. We'll verify it using the unit circle and explore its applications in solving trigonometric equations.`;
  }
  
  if (topicLower.includes('integration') || topicLower.includes('accumulation')) {
    return `Analyze this definite integral: [math]\\int_{0}^{3} (2x^2 + 4x - 1) dx[/math]

This integral represents the area under the curve from x = 0 to x = 3. Students will work through this step-by-step to understand the fundamental theorem of calculus and rate of change concepts.`;
  }
  
  if (topicLower.includes('derivative') || topicLower.includes('rate of change')) {
    return `Find the derivative and analyze critical points: [math]f(x) = x^3 - 6x^2 + 9x + 2[/math]

Determine where f'(x) = 0 to locate critical points and understand how the derivative describes the behavior of the original function.`;
  }
  
  if (topicLower.includes('quadratic') || topicLower.includes('parabola')) {
    return `Solve and analyze this quadratic equation: [math]2x^2 - 8x + 6 = 0[/math]

We'll use multiple methods including factoring, completing the square, and the quadratic formula to find solutions and understand parabolic behavior.`;
  }
  
  if (topicLower.includes('exponential') || topicLower.includes('logarithm')) {
    return `Model exponential growth with: [math]P(t) = 150e^{0.03t}[/math]

This equation models population growth where P(t) represents the population after t years, starting with 150 individuals and growing at 3% per year.`;
  }
  
  if (topicLower.includes('linear') || topicLower.includes('slope')) {
    return `Analyze this system of linear equations: [math]\\begin{cases} 3x + 2y = 16 \\\\ x - y = 2 \\end{cases}[/math]

We'll solve using substitution and elimination methods to find the intersection point and understand linear relationships.`;
  }
  
  if (topicLower.includes('ellipse') || topicLower.includes('conic')) {
    return `Study the ellipse equation: [math]\\frac{x^2}{25} + \\frac{y^2}{16} = 1[/math]

This represents an ellipse centered at the origin. We'll find the vertices, co-vertices, foci, and explore the geometric properties of this conic section.`;
  }
  
  // Generate contextual expression based on grade level
  if (gradeLevel.toLowerCase().includes('calculus')) {
    return `Analyze this function and its behavior: [math]g(x) = \\frac{x^2 - 4}{x + 2}[/math]

We'll find the domain, identify discontinuities, analyze limits, and understand rational function behavior.`;
  }
  
  if (gradeLevel.toLowerCase().includes('algebra') || gradeLevel.toLowerCase().includes('9th') || gradeLevel.toLowerCase().includes('10th')) {
    return `Solve this polynomial equation: [math]x^3 - 7x^2 + 14x - 8 = 0[/math]

We'll use factoring techniques and synthetic division to find all real solutions and understand polynomial behavior.`;
  }
  
  // Grade-appropriate fallback
  return `Explore this mathematical relationship: [math]A = \\pi r^2[/math]

This formula represents the area of a circle. We'll investigate how the area changes as the radius varies and explore the significance of π in mathematics.`;
}

function getAdvancedTopicProblems(topic: string, subject: string, gradeLevel: string): string {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('pythagor') || topicLower.includes('identity')) {
    return `1. Verify: [math]\\tan^2(\\theta) + 1 = \\sec^2(\\theta)[/math]
2. Simplify: [math]\\frac{\\sin^2(x)}{1 - \\cos(x)}[/math] 
3. Solve: [math]\\sin^2(x) + \\cos^2(x) = 1[/math] for x = 30°, 45°, 60°`;
  }
  
  if (topicLower.includes('integration') || topicLower.includes('accumulation')) {
    return `1. Evaluate: [math]\\int_{1}^{4} (x^2 + 3x - 2) dx[/math]
2. Find the antiderivative: [math]\\int (4x^3 - 6x^2 + 2x - 5) dx[/math]
3. Calculate the area: [math]\\int_{-2}^{2} (4 - x^2) dx[/math]`;
  }
  
  if (topicLower.includes('derivative') || topicLower.includes('rate of change')) {
    return `1. Find: [math]\\frac{d}{dx}(3x^4 - 2x^3 + 7x^2 - 4x + 1)[/math]
2. Critical points of: [math]h(x) = x^3 - 9x^2 + 24x - 10[/math]
3. Velocity function: [math]v(t) = -32t + 48[/math], find when object stops`;
  }
  
  if (topicLower.includes('quadratic') || topicLower.includes('parabola')) {
    return `1. Solve by factoring: [math]x^2 + 8x + 15 = 0[/math]
2. Complete the square: [math]x^2 - 6x + 5 = 0[/math]
3. Use quadratic formula: [math]3x^2 - 7x + 2 = 0[/math]`;
  }
  
  if (topicLower.includes('ellipse') || topicLower.includes('conic')) {
    return `1. Find vertices and foci: [math]\\frac{x^2}{36} + \\frac{y^2}{20} = 1[/math]
2. Write equation for ellipse with center (0,0), a = 5, b = 3
3. Determine eccentricity: [math]\\frac{x^2}{49} + \\frac{y^2}{24} = 1[/math]`;
  }
  
  // Generate practice problems based on grade level
  if (gradeLevel.toLowerCase().includes('calculus')) {
    return `1. Find the limit: [math]\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}[/math]
2. Derivative of: [math]f(x) = x^2 \\sin(x)[/math]
3. Evaluate: [math]\\int x e^x dx[/math]`;
  }
  
  if (gradeLevel.toLowerCase().includes('algebra') || gradeLevel.toLowerCase().includes('9th') || gradeLevel.toLowerCase().includes('10th')) {
    return `1. Solve the system: [math]\\begin{cases} 2x + y = 7 \\\\ x - 3y = -5 \\end{cases}[/math]
2. Factor completely: [math]x^3 - 8x^2 + 16x[/math]
3. Graph and find vertex: [math]f(x) = -2x^2 + 8x - 3[/math]`;
  }
  
  // Contextual problems for other levels
  return `1. Calculate the area of a circle with radius 7 units
2. Find the slope between points (2, 5) and (8, 17)
3. Solve for x: [math]\\frac{2x + 3}{4} = \\frac{x - 1}{2}[/math]`;
}

export async function POST(request: NextRequest) {
  console.log('🎓 ACTIVITY NAMES & REGENERATE API: Starting generation');
  
  let activityData;
  try {
    activityData = await request.json();
  } catch (parseError) {
    console.error('❌ Failed to parse request body:', parseError);
    return NextResponse.json(
      { 
        error: 'Invalid JSON in request body', 
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
        type: 'parse_error' 
      },
      { status: 400 }
    );
  }
  
  try {
    console.log('📚 Creating activity with engaging name for mode:', activityData.mode);
    
    // Validate required fields
    if (!activityData.subject || !activityData.gradeLevel || !activityData.topic || !activityData.activityType) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          details: 'subject, gradeLevel, topic, and activityType are required',
          received: {
            subject: !!activityData.subject,
            gradeLevel: !!activityData.gradeLevel,
            topic: !!activityData.topic,
            activityType: !!activityData.activityType
          }
        },
        { status: 400 }
      );
    }

    // Check for API availability - if no key or credits low, use intelligent fallback
    const envKey = process.env.ANTHROPIC_API_KEY;
    const isValidKey = envKey && envKey.length > 20 && envKey.startsWith('sk-ant-');
    const anthropicKey = isValidKey ? envKey : null;
    
    if (!anthropicKey) {
      console.error('❌ No valid Anthropic API key found');
      return NextResponse.json(
        { error: 'API configuration error. Please check your environment variables.' },
        { status: 500 }
      );
    }
    console.log('🔑 API Key check:', {
      fromEnv: envKey?.substring(0, 10) + '...',
      envKeyLength: envKey?.length || 0,
      isValid: isValidKey,
      final: anthropicKey.substring(0, 10) + '...',
      finalLength: anthropicKey.length
    });
    if (!anthropicKey) {
      console.warn('⚠️ Missing ANTHROPIC_API_KEY - using intelligent fallback system')
      return generateIntelligentFallbackActivity(activityData)
    }
    
    // Generate appropriate prompt based on mode
    const isSubMode = activityData.mode === 'substitute' || activityData.substituteMode;
    const prompt = isSubMode 
      ? generateSubModePrompt(activityData)
      : generateTeacherModePrompt(activityData);
    
    console.log(`🎯 Generated ${activityData.regenerating ? 'regenerated' : 'new'} ${isSubMode ? 'substitute' : 'teacher'} prompt for:`, activityData.topic);
    
    // Advanced retry system with exponential backoff and circuit breaker
    let response: Response | undefined;
    let retryCount = 0;
    const maxRetries = 5; // Increased for 529 errors
    const baseDelay = 1000; // 1 second base delay
    
    // Circuit breaker state (in production, use Redis or database)
    const circuitBreakerKey = 'anthropic_api_circuit_breaker';
    
    // Helper function for exponential backoff with jitter
    const calculateDelay = (attempt: number, isOverload: boolean = false): number => {
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), 30000); // Cap at 30 seconds
      const jitter = Math.random() * 1000; // Random 0-1000ms jitter
      const overloadMultiplier = isOverload ? 2 : 1; // Extra delay for overload errors
      return (exponentialDelay + jitter) * overloadMultiplier;
    };
    
    // Helper function to check if we should use fallback (circuit breaker)
    const shouldUseFallback = (): boolean => {
      try {
        const circuitState = (global as any)[circuitBreakerKey] || { failures: 0, lastFailure: 0 };
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        // Reset counter if it's been more than 5 minutes since last failure
        if (now - circuitState.lastFailure > fiveMinutes) {
          circuitState.failures = 0;
        }
        
        // If we've had 3+ failures in 5 minutes, use fallback
        return circuitState.failures >= 3;
      } catch {
        return false;
      }
    };
    
    // Helper function to record API failure
    const recordFailure = (): void => {
      try {
        if (!(global as any)[circuitBreakerKey]) {
          (global as any)[circuitBreakerKey] = { failures: 0, lastFailure: 0 };
        }
        (global as any)[circuitBreakerKey].failures++;
        (global as any)[circuitBreakerKey].lastFailure = Date.now();
      } catch {
        // Ignore circuit breaker errors
      }
    };
    
    // Check circuit breaker before attempting API calls
    if (shouldUseFallback()) {
      console.warn('🚨 Circuit breaker activated - API has been failing consistently, using fallback');
      return generateIntelligentFallbackActivity(activityData);
    }
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`📡 Attempting API call ${retryCount + 1}/${maxRetries + 1}`);
        
        // Use the API key from earlier check
        if (!anthropicKey) {
          throw new Error('Missing ANTHROPIC_API_KEY environment variable');
        }
        
        const startTime = Date.now();
        
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: isSubMode ? 2000 : 3500,
            temperature: activityData.regenerating ? 0.8 : 0.7,
            messages: [{
              role: 'user',
              content: prompt
            }]
          })
        });

        const responseTime = Date.now() - startTime;
        console.log(`📡 API Response status: ${response.status}, Time: ${responseTime}ms`);

        if (response.ok) {
          console.log('✅ Activity API call successful');
          // Reset circuit breaker on success
          if ((global as any)[circuitBreakerKey]) {
            (global as any)[circuitBreakerKey].failures = 0;
          }
          break;
        }
        
        // Handle specific error cases
        if (response.status === 529) {
          console.warn(`⚠️ API Overload (529) - attempt ${retryCount + 1}/${maxRetries + 1}`);
          recordFailure();
          
          if (retryCount < maxRetries) {
            const delay = calculateDelay(retryCount, true);
            console.log(`🔄 Retrying in ${Math.round(delay/1000)}s due to API overload...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCount++;
            continue;
          } else {
            // All retries exhausted for 529 - use fallback
            console.warn('⚠️ All retries exhausted for API overload, using intelligent fallback');
            return generateIntelligentFallbackActivity(activityData);
          }
        }
        
        if (response.status === 429) {
          console.warn(`⚠️ Rate Limited (429) - attempt ${retryCount + 1}/${maxRetries + 1}`);
          recordFailure();
          
          if (retryCount < maxRetries) {
            const delay = calculateDelay(retryCount, false);
            console.log(`🔄 Retrying in ${Math.round(delay/1000)}s due to rate limiting...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCount++;
            continue;
          }
        }
        
        // Handle other errors
        try {
          const errorText = await response.text();
          console.error(`❌ Claude API Error ${response.status}:`, errorText);
          console.error(`❌ Request details - Model: claude-3-5-sonnet-20241022, Max tokens: ${isSubMode ? 2000 : 3500}`);
          console.error(`❌ Prompt length: ${prompt.length} characters`);
          
          // Check if it's a credit/billing issue
          if (response.status === 400 && errorText.includes('credit balance')) {
            console.warn('💳 API credit balance too low - switching to intelligent fallback system');
            return generateIntelligentFallbackActivity(activityData);
          }
          
          // For 5xx errors, record failure and potentially retry
          if (response.status >= 500) {
            recordFailure();
            if (retryCount < maxRetries) {
              const delay = calculateDelay(retryCount, false);
              console.log(`🔄 Retrying in ${Math.round(delay/1000)}s due to server error...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              retryCount++;
              continue;
            }
          }
        } catch (readError) {
          console.error(`❌ API Error ${response.status}: Could not read response body`);
          recordFailure();
        }
        break;
        
      } catch (fetchError) {
        console.error('❌ Activity generation fetch error:', fetchError);
        recordFailure();
        
        if (retryCount < maxRetries) {
          const delay = calculateDelay(retryCount, false);
          console.log(`🔄 Retrying in ${Math.round(delay/1000)}s due to fetch error...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
          continue;
        }
        
        // All retries exhausted due to network issues
        console.warn('⚠️ Network issues persist, using intelligent fallback');
        return generateIntelligentFallbackActivity(activityData);
      }
    }

    if (!response || !response.ok) {
      console.error('❌ Activity API failed after all retries - response not ok:', response?.status);
      
      // For 529 errors after all retries, use fallback instead of returning error
      if (response?.status === 529) {
        console.warn('⚠️ Using intelligent fallback due to persistent API overload');
        return generateIntelligentFallbackActivity(activityData);
      }
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to generate activity';
      let errorType = 'server_error';
      
      if (response?.status === 429) {
        userMessage = 'The intelligent service is currently experiencing high demand. Please try again in a few minutes.';
        errorType = 'rate_limited';
      } else if (response?.status === 529) {
        userMessage = 'The intelligent service is temporarily overloaded. We\'ve generated a high-quality lesson plan using our backup system.';
        errorType = 'service_overloaded';
      } else if (response?.status && response.status >= 500) {
        userMessage = 'The intelligent service is temporarily unavailable. Please try again in a few minutes.';
        errorType = 'service_unavailable';
      } else if (!response) {
        userMessage = 'Unable to connect to the intelligent service. Please check your internet connection and try again.';
        errorType = 'network_error';
      }
      
      return NextResponse.json(
        { 
          error: userMessage,
          details: `API returned status ${response?.status || 'unknown'}`,
          type: errorType,
          retryable: (response?.status === 429) || (response?.status === 529) || (response?.status && response.status >= 500)
        },
        { status: response?.status || 500 }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('❌ Failed to parse API response as JSON:', jsonError);
      return NextResponse.json(
        { 
          error: 'Failed to generate activity', 
          details: 'Invalid response format from API',
          type: 'server_error'
        },
        { status: 500 }
      );
    }
    console.log('🎉 Activity with engaging name generated! Length:', data.content?.[0]?.text?.length || 0);
    
    let generatedActivity = data.content?.[0]?.text || 'Error: No activity content received';
    
    // Apply content sanitization for non-math subjects to prevent math formatting leakage
    const isMath = isMathSubject(activityData.subject, activityData.gradeLevel);
    const isSEL = activityData.subject.toLowerCase().includes('advisory') || activityData.subject.toLowerCase().includes('sel');
    
    if (!isMath) {
      console.log('🧹 Sanitizing non-math content to remove any mathematical expressions...');
      const beforeLength = generatedActivity.length;
      generatedActivity = sanitizeContentForNonMath(generatedActivity);
      const afterLength = generatedActivity.length;
      
      if (beforeLength !== afterLength) {
        console.log(`✨ Sanitization removed ${beforeLength - afterLength} characters of mathematical content from ${activityData.subject} lesson`);
      }
    }

    // Apply professional formatting to all lesson plans
    console.log('✨ Enhancing lesson formatting for professional appearance...');
    generatedActivity = enhanceLessonFormatting(generatedActivity);

    // Generate unique ID
    const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store activity data
    const fullActivityData = {
      id: activityId,
      mode: isSubMode ? 'substitute' : 'teacher',
      teacherName: 'Your Teacher',
      substituteName: activityData.substituteName || '',
      date: activityData.date || new Date().toISOString().split('T')[0],
      gradeLevel: activityData.gradeLevel,
      subject: activityData.subject,
      topic: activityData.topic,
      activityType: activityData.activityType,
      duration: activityData.duration || '50',
      classSize: activityData.classSize,
      specialNotes: activityData.specialNotes,
      
      // Sub mode specific fields (optional)
      ...(isSubMode && {
        techPassword: activityData.techPassword || '',
        emergencyContacts: activityData.emergencyContacts || '',
        classroomManagement: activityData.classroomManagement || ''
      }),
      
      generatedActivity,
      originalData: activityData,
      createdAt: new Date().toISOString(),
      isPractical: true,
      isStandardsAligned: true,
      includesCER: shouldUseCER(activityData.subject, activityData.gradeLevel, activityData.activityType),
      hasFluidCERPrompting: true,
      hasEngagingName: true, // Flag for this enhanced version
      isRegenerated: !!activityData.regenerating
    };

    console.log(`✨ ${activityData.regenerating ? 'Regenerated' : 'New'} ${isSubMode ? 'substitute' : 'teacher'} activity stored, ID:`, activityId);

    // For teacher mode, also generate differentiation suggestions
    const differentiationSuggestions = null;
    // Temporarily disabled auto-differentiation to prevent hanging - will implement as separate call
    // if (!isSubMode && activityData.includeDifferentiation === true) {
    //   try {
    //     console.log('🎯 Auto-generating differentiation suggestions...');
    //     // API call implementation here
    //   } catch (error) {
    //     console.warn('⚠️ Failed to generate differentiation suggestions (non-critical):', error);
    //   }
    // }

    return NextResponse.json({
      success: true,
      activityId,
      activityData: fullActivityData,
      differentiationSuggestions
    });

  } catch (error) {
    console.error('💥 Activity generation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate activity', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'server_error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get('id');

  if (!activityId) {
    return NextResponse.json(
      { error: 'Activity ID is required' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Retrieve activity data from localStorage',
    activityId
  });
}