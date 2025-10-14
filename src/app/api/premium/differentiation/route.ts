import { NextRequest, NextResponse } from 'next/server';

// Vercel serverless function configuration
// Set maximum duration to 60 seconds (requires Pro plan, Hobby = 10s max)
// If on Hobby plan, this will be capped at 10s
export const maxDuration = 60;

interface DifferentiationRequest {
  activityContent: string;
  gradeLevel: string;
  subject: string;
  topic: string;
  activityType: string;
  duration: string;
  requestedTypes?: string[]; // Optional: specific types to generate
}

interface DifferentiationContent {
  title: string;
  talk_track: string[];
  instructions: string[];
  modifications: string[];
  materials_changes?: string[];
  exit_ticket: {
    format: string;
    questions: string[];
    time_needed: string;
  };
}

interface ESLAdaptations {
  vocabulary_support: string[];
  visual_aids: string[];
  language_scaffolds: string[];
  exit_ticket: {
    format: string;
    language_supports: string[];
    visual_supports: string[];
  };
}

interface IEPAdaptations {
  behavioral_supports: string[];
  sensory_accommodations: string[];
  cognitive_modifications: string[];
  exit_ticket: {
    format: string;
    accommodations: string[];
    alternative_formats: string[];
  };
}

interface DifferentiationResponse {
  below_grade: DifferentiationContent;
  at_grade: DifferentiationContent;
  above_grade: DifferentiationContent;
  esl_adaptations: ESLAdaptations & { title: string };
  iep_adaptations: IEPAdaptations & { title: string };
}

// Smart defaults based on grade level
function getSmartDefaults(gradeLevel: string): string[] {
  const grade = gradeLevel.toLowerCase();
  
  // Elementary (K-5): Below Grade, At Grade, ESL, IEP
  if (grade.includes('k') || grade.includes('kindergarten') || 
      grade.includes('1st') || grade.includes('2nd') || grade.includes('3rd') || 
      grade.includes('4th') || grade.includes('5th') ||
      grade.includes('elementary')) {
    return ['below_grade', 'at_grade', 'esl_adaptations', 'iep_adaptations'];
  }
  
  // Middle School (6-8): Below Grade, At Grade, Above Grade, ESL, IEP
  if (grade.includes('6th') || grade.includes('7th') || grade.includes('8th') ||
      grade.includes('middle')) {
    return ['below_grade', 'at_grade', 'above_grade', 'esl_adaptations', 'iep_adaptations'];
  }
  
  // High School (9-12): At Grade, Above Grade, ESL, IEP
  if (grade.includes('9th') || grade.includes('10th') || grade.includes('11th') || 
      grade.includes('12th') || grade.includes('high') || grade.includes('secondary')) {
    return ['at_grade', 'above_grade', 'esl_adaptations', 'iep_adaptations'];
  }
  
  // AP Classes: Above Grade (Advanced), At Grade (Standard), ESL, IEP (for diverse learners)
  if (grade.includes('ap ')) {
    return ['at_grade', 'above_grade', 'esl_adaptations', 'iep_adaptations'];
  }
  
  // Default fallback: generate all types
  return ['below_grade', 'at_grade', 'above_grade', 'esl_adaptations', 'iep_adaptations'];
}

function isElementaryGrade(gradeLevel: string): boolean {
  const grade = gradeLevel.toLowerCase();
  return grade.includes('k') || grade.includes('kindergarten') || 
         grade.includes('1st') || grade.includes('2nd') || grade.includes('3rd') || 
         grade.includes('4th') || grade.includes('5th') || grade.includes('elementary');
}

function isMiddleSchoolGrade(gradeLevel: string): boolean {
  const grade = gradeLevel.toLowerCase();
  return grade.includes('6th') || grade.includes('7th') || grade.includes('8th') || 
         grade.includes('middle');
}

function isHighSchoolGrade(gradeLevel: string): boolean {
  const grade = gradeLevel.toLowerCase();
  return grade.includes('9th') || grade.includes('10th') || grade.includes('11th') || 
         grade.includes('12th') || grade.includes('high') || grade.includes('secondary');
}

function isAPGrade(gradeLevel: string): boolean {
  const grade = gradeLevel.toLowerCase();
  return grade.includes('ap ');
}

export async function POST(request: NextRequest) {
  console.log('🎯 DIFFERENTIATION ENDPOINT CALLED at', new Date().toISOString());
  console.log('Request method:', request.method);
  console.log('Request headers:', {
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length')
  });

  try {
    const data: DifferentiationRequest = await request.json();
    console.log('📦 Request data received:', {
      hasActivityContent: !!data.activityContent,
      activityContentLength: data.activityContent?.length || 0,
      gradeLevel: data.gradeLevel,
      subject: data.subject,
      topic: data.topic,
      activityType: data.activityType,
      duration: data.duration,
      requestedTypes: data.requestedTypes || 'using smart defaults'
    });

    // Check for API availability - use fallback if environment loading fails
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
    
    console.log('🔑 Differentiation API Key check:', {
      fromEnv: envKey?.substring(0, 10) + '...',
      envKeyLength: envKey?.length || 0,
      startsWithSkAnt: envKey?.startsWith('sk-ant-'),
      hasMinLength: (envKey?.length || 0) > 20,
      isValid: isValidKey,
      final: anthropicKey?.substring(0, 10) + '...',
      finalLength: anthropicKey?.length || 0,
      // Check for common issues
      hasWhitespace: envKey?.includes(' ') || envKey?.includes('\n') || envKey?.includes('\t'),
      hasQuotes: envKey?.includes('"') || envKey?.includes("'")
    });

    // Validate required fields
    if (!data.activityContent || !data.gradeLevel || !data.subject || !data.topic) {
      return NextResponse.json(
        { error: 'Missing required fields: activityContent, gradeLevel, subject, topic' }, 
        { status: 400 }
      );
    }

    // Determine which adaptations to generate
    const requestedTypes = data.requestedTypes || getSmartDefaults(data.gradeLevel);
    const shouldGenerateIEP = requestedTypes.includes('iep_adaptations');
    
    console.log('📚 Smart defaults for', data.gradeLevel, ':', requestedTypes);

    const differentiationPrompt = `
You are an expert teacher specializing in differentiated instruction. Create specific adaptations based on the grade level and learning needs.

ORIGINAL ACTIVITY:
Grade Level: ${data.gradeLevel}
Subject: ${data.subject}  
Topic: ${data.topic}
Activity Type: ${data.activityType}
Duration: ${data.duration} minutes

ACTIVITY CONTENT:
${data.activityContent}

Create detailed adaptations ONLY for the following types: ${requestedTypes.join(', ')}

Grade Context: ${isElementaryGrade(data.gradeLevel) ? 'Elementary (K-5) - Focus on concrete, hands-on activities with simple language' : 
               isMiddleSchoolGrade(data.gradeLevel) ? 'Middle School (6-8) - Balance concrete and abstract thinking, peer collaboration' :
               isAPGrade(data.gradeLevel) ? 'Advanced Placement (AP) - College-level rigor, analytical thinking, exam preparation, independent research' :
               isHighSchoolGrade(data.gradeLevel) ? 'High School (9-12) - Abstract thinking, independent work, college/career readiness' :
               'Mixed grade level - Provide flexible adaptations'}

${requestedTypes.includes('below_grade') ? `
## BELOW GRADE LEVEL VERSION
**Adaptation Title:** [Clear, encouraging title]
**Teacher Talk Track:** 
- [3-4 specific phrases for scaffolding and encouragement]
- [Simple, supportive language]
**Modified Instructions:**
- [Step-by-step simplified instructions]
- [Visual cues and chunked tasks]
**Key Modifications:**
- [Reduced complexity while maintaining core learning]
- [Additional support strategies]
**Materials Changes:** [Simplified or additional support materials]
**Exit Ticket Adaptation:**
- **Format:** [Choose: Simple Choice, Picture Response, or One Question - describe the specific format]
- **Questions:** [1-2 very simple questions about ${data.topic} using basic vocabulary]
- **Time Needed:** [Usually 1-2 minutes for below-grade students]
` : ''}

${requestedTypes.includes('at_grade') ? `
## AT GRADE LEVEL VERSION  
**Adaptation Title:** [Grade-appropriate title]
**Teacher Talk Track:**
- [3-4 phrases for standard guidance]
- [Clear instructional language]
**Modified Instructions:**
- [Standard grade-level expectations]
- [Balanced challenge level]
**Key Modifications:**
- [Core standards alignment]
- [Appropriate expectations]
**Materials Changes:** [Standard materials]
**Exit Ticket Adaptation:**
- **Format:** [Choose: 3-2-1, Quick Check, or Reflection - describe the specific format for ${data.topic}]
- **Questions:** [2-3 grade-level appropriate questions about ${data.topic}]
- **Time Needed:** [Usually 2-3 minutes for grade-level students]
` : ''}

${requestedTypes.includes('above_grade') ? `
## ABOVE GRADE LEVEL VERSION
**Adaptation Title:** [Challenging, engaging title]
**Teacher Talk Track:**
- [3-4 phrases that promote critical thinking]
- [Language that encourages depth and connections]
**Modified Instructions:**
- [Enhanced complexity and extension activities]
- [Independent exploration elements]
**Key Modifications:**
- [Higher-order thinking challenges]
- [Creative and analytical extensions]
**Materials Changes:** [Advanced or additional materials]
**Exit Ticket Adaptation:**
- **Format:** [Choose: Analysis & Synthesis, Extension Challenge, or Connection Making - describe the specific format]
- **Questions:** [2-3 higher-order thinking questions about ${data.topic} requiring analysis, evaluation, or creation]
- **Time Needed:** [Usually 3-4 minutes for above-grade students to complete thoughtful responses]
` : ''}

${requestedTypes.includes('esl_adaptations') ? `
## ESL ADAPTATIONS
**Adaptation Title:** ESL-Friendly Version
**Vocabulary Support:**
- [3-4 key vocabulary words with simple definitions]
- [Visual vocabulary support strategies]
**Visual Aids:**
- [Specific visual supports and graphic organizers]
- [Cultural relevance considerations]
**Language Scaffolds:**
- [Sentence frames and communication supports]
- [Peer partnership strategies]
**Exit Ticket Adaptation:**
- **Format:** [Choose: Picture + Word, Sentence Frames, or Native Language Support - describe the specific format]
- **Language Supports:** [Simplified vocabulary, sentence starters, key terms in native language if helpful]
- **Visual Supports:** [Icons, diagrams, or pictures to support understanding of ${data.topic} questions]
` : ''}

${shouldGenerateIEP ? `
## IEP ADAPTATIONS  
**Adaptation Title:** IEP Accommodations Version

CONTEXT: You are creating IEP accommodations for a ${data.duration}-minute ${data.subject} lesson on ${data.topic} at ${data.gradeLevel} level. The activity type is ${data.activityType}. 

Analyze the specific lesson content and create DYNAMIC, TOPIC-SPECIFIC accommodations that directly address the challenges students might face with THIS PARTICULAR lesson content. Avoid generic templates.

**Behavioral Supports:**
Create 4-5 specific behavioral supports that directly relate to the challenges of this ${data.topic} lesson. Consider:
- What specific behaviors might emerge during ${data.topic} activities?
- What positive reinforcement strategies work best for ${data.subject} concepts?
- How can movement and engagement be built into ${data.topic} learning?
- What environmental modifications support focus during ${data.activityType} activities?

**Sensory Accommodations:**
Create 4-5 sensory accommodations specifically designed for this ${data.topic} lesson. Consider:
- What sensory challenges might arise with ${data.topic} materials or activities?
- How can visual, auditory, and tactile needs be met during ${data.subject} instruction?
- What specific sensory tools would enhance learning ${data.topic} concepts?
- How can the physical environment be optimized for ${data.activityType} activities?

**Cognitive Modifications:**
Create 4-5 cognitive modifications that specifically address the thinking demands of ${data.topic}. Consider:
- What are the specific cognitive challenges of understanding ${data.topic}?
- How can complex ${data.topic} concepts be broken down into manageable steps?
- What memory strategies work best for ${data.subject} content?
- How can abstract ${data.topic} ideas be made more concrete and accessible?
- What organizational tools specifically support ${data.activityType} learning?

**Exit Ticket Adaptation:**
Create a specific exit ticket format that addresses the unique needs of students with IEP accommodations for ${data.topic}:
- **Format:** [Choose: Alternative Response, Modified Questions, or Multi-modal Options - describe the specific format]
- **Accommodations:** [Specific accommodations for completing the exit ticket - extended time, alternative format, assistive technology, etc.]
- **Alternative Formats:** [Different ways students can demonstrate ${data.topic} understanding - verbal, visual, hands-on, digital, etc.]

IMPORTANT: Generate SPECIFIC, CONTEXTUAL accommodations based on the actual lesson content, not generic IEP strategies. Each accommodation should clearly connect to the specific challenges and opportunities within this ${data.topic} lesson.
` : ''}

**CRITICAL REQUIREMENTS:**
- Generate COMPLETE, detailed content for every requested section
- Each section must have AT LEAST 3-4 substantive items 
- Use specific, actionable language that teachers can implement immediately
- Maintain the exact formatting structure requested above
- Do NOT generate partial or incomplete sections
- Focus on practical strategies that directly relate to ${data.topic}

**CONTENT QUALITY STANDARDS:**
- Teacher Talk Track: Provide specific phrases teachers can say verbatim
- Instructions: Give step-by-step, detailed guidance
- Modifications: Specify exactly what to change and how
- Materials: List specific items or changes needed
- Support strategies: Be concrete and actionable

Each adaptation should maintain the core learning objectives while addressing specific student needs. Generate thorough, complete content that teachers will find immediately useful.
`;

    console.log('🎯 DIFFERENTIATION API: Starting generation');
    console.log('📚 Creating differentiated versions for:', data.topic);

    // Make API call to Anthropic
    // Create AbortController for timeout handling
    // Vercel Hobby plan: 10s max, Pro: 60s max, Enterprise: 300s max
    // Set timeout slightly less than maxDuration to allow for cleanup
    const controller = new AbortController();
    const timeoutMs = 55000; // 55 seconds (allows 5s for response processing)
    const timeoutId = setTimeout(() => {
      console.error('⏱️ Aborting request after', timeoutMs/1000, 'seconds');
      controller.abort();
    }, timeoutMs);

    let response;
    const apiStartTime = Date.now();
    try {
      console.log('🔄 Starting Anthropic API call at', new Date().toISOString());
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 3000,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content: differentiationPrompt
          }]
        }),
        signal: controller.signal
      });

      const apiDuration = Date.now() - apiStartTime;
      console.log(`✅ API responded in ${apiDuration}ms`);

    } catch (fetchError) {
      const apiDuration = Date.now() - apiStartTime;
      console.error(`❌ Fetch failed after ${apiDuration}ms:`, fetchError);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('⏱️ Differentiation API call timed out after', apiDuration/1000, 'seconds');
        console.error('💡 Timeout limit was:', timeoutMs/1000, 'seconds');
        console.error('⚠️ If on Vercel Hobby plan, function is limited to 10s max execution');
        return NextResponse.json(
          {
            error: 'Request timed out. The AI response took too long. Please try again or upgrade your Vercel plan for longer timeouts.',
            details: `Timed out after ${Math.round(apiDuration/1000)}s`
          },
          { status: 408 }
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ Anthropic API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody.substring(0, 500) // Log first 500 chars
      });

      // Return detailed error for debugging
      return NextResponse.json(
        {
          error: `Anthropic API error: ${response.status}`,
          details: response.statusText,
          hint: response.status === 401 ? 'Invalid API key' :
                response.status === 429 ? 'Rate limit exceeded' :
                response.status === 500 ? 'Anthropic service error' : 'Unknown error'
        },
        { status: 500 }
      );
    }

    const apiResponse = await response.json();
    console.log('✅ Differentiation API call successful');
    
    if (!apiResponse.content || !apiResponse.content[0] || !apiResponse.content[0].text) {
      console.error('❌ Invalid API response structure:', JSON.stringify(apiResponse, null, 2));
      return NextResponse.json(
        { error: 'Invalid response from intelligent service' }, 
        { status: 500 }
      );
    }

    const generatedContent = apiResponse.content[0].text;
    console.log('🎉 Differentiation generated! Length:', generatedContent.length);

    // Parse the structured response with error handling
    let parsedDifferentiation;
    try {
      parsedDifferentiation = parseDifferentiationContent(generatedContent);
    } catch (parseError) {
      console.error('❌ Error parsing differentiation content:', parseError);
      return NextResponse.json(
        { 
          error: 'Failed to parse differentiation content',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      differentiationData: parsedDifferentiation,
      requestedTypes,
      gradeContext: {
        level: data.gradeLevel,
        isElementary: isElementaryGrade(data.gradeLevel),
        isMiddleSchool: isMiddleSchoolGrade(data.gradeLevel),
        isHighSchool: isHighSchoolGrade(data.gradeLevel)
      },
      rawContent: generatedContent
    });

  } catch (error) {
    console.error('❌ Differentiation API Error:', error);

    // Enhanced error logging for Vercel
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack?.substring(0, 500));
    }

    // Check if it's a Vercel timeout (different from our abort timeout)
    const isVercelTimeout = error instanceof Error &&
      (error.message.includes('FUNCTION_INVOCATION_TIMEOUT') ||
       error.message.includes('Task timed out'));

    if (isVercelTimeout) {
      console.error('⚠️ VERCEL FUNCTION TIMEOUT DETECTED');
      console.error('💡 Your Vercel plan limits function execution time');
      console.error('💡 Hobby: 10s, Pro: 60s, Enterprise: 300s');
      return NextResponse.json(
        {
          error: 'Function execution timeout',
          details: 'The request exceeded Vercel\'s serverless function time limit. Consider upgrading your Vercel plan or optimizing the request.',
          hint: 'Vercel Hobby plan limits functions to 10 seconds'
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate differentiated content',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

function parseDifferentiationContent(content: string): DifferentiationResponse {
  if (!content || typeof content !== 'string' || content.length < 10) {
    throw new Error('Invalid content provided for parsing');
  }
  
  console.log('📋 Parsing differentiation content, length:', content.length);
  console.log('📋 Content preview:', content.substring(0, 500));
  console.log('📋 Full content for debugging:', content);
  
  try {
    const sections = {
      below_grade: extractSection(content, 'BELOW GRADE LEVEL VERSION'),
      at_grade: extractSection(content, 'AT GRADE LEVEL VERSION'),
      above_grade: extractSection(content, 'ABOVE GRADE LEVEL VERSION'),
      esl_adaptations: extractESLSection(content),
      iep_adaptations: extractIEPSection(content)
    };

    console.log('📋 Parsed sections:', Object.keys(sections).map(key => `${key}: ${sections[key as keyof typeof sections]?.title || 'missing'}`));
    
    // Debug each section content
    Object.keys(sections).forEach(key => {
      const section = sections[key as keyof typeof sections];
      console.log(`📋 Section ${key}:`, section);
    });
    
    return sections;
  } catch (error) {
    console.error('❌ Error in parseDifferentiationContent:', error);
    throw new Error(`Failed to parse differentiation content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractSection(content: string, sectionTitle: string): DifferentiationContent {
  console.log(`📋 Extracting section: ${sectionTitle}`);
  
  // Try multiple regex patterns to catch different intelligent output formats
  const patterns = [
    new RegExp(`## ${sectionTitle}([\\s\\S]*?)(?=##|$)`, 'i'),
    new RegExp(`\\*\\*${sectionTitle}\\*\\*([\\s\\S]*?)(?=\\*\\*[A-Z]|$)`, 'i'),
    new RegExp(`${sectionTitle}([\\s\\S]*?)(?=BELOW GRADE|AT GRADE|ABOVE GRADE|ESL|IEP|$)`, 'i'),
    // More flexible patterns
    new RegExp(`${sectionTitle.replace(/\s+/g, '\\s+')}([\\s\\S]*?)(?=\\n\\s*##|\\n\\s*\\*\\*[A-Z]|$)`, 'i'),
    new RegExp(`(?:##\\s*)?${sectionTitle}\\s*\\n([\\s\\S]*?)(?=\\n\\s*##|\\n\\s*\\*\\*|$)`, 'i')
  ];
  
  let match = null;
  let usedPattern = -1;
  
  for (let i = 0; i < patterns.length; i++) {
    match = content.match(patterns[i]);
    console.log(`📋 Pattern ${i + 1} for ${sectionTitle}:`, match ? 'MATCH' : 'NO MATCH');
    if (match && match[1]?.trim().length > 20) {
      usedPattern = i;
      break;
    }
  }
  
  if (!match || !match[1]?.trim()) {
    console.warn(`⚠️ Could not extract section: ${sectionTitle}`);
    console.log(`📋 Available content headers:`, content.match(/##[^#\n]*/g) || 'No ## headers found');
    console.log(`📋 Available bold headers:`, content.match(/\*\*[A-Z][^*]*\*\*/g) || 'No ** headers found');
    
    // Return more meaningful fallback content
    const fallbackTitle = sectionTitle.includes('BELOW') ? 'Support for Struggling Students' :
                         sectionTitle.includes('AT') ? 'Grade-Level Adaptations' :
                         sectionTitle.includes('ABOVE') ? 'Extensions for Advanced Learners' :
                         `${sectionTitle} Support`;
    
    return {
      title: fallbackTitle,
      talk_track: [
        `"Let's work together on this approach"`,
        `"Take your time and ask questions if you need help"`,
        `"You're making great progress with this strategy"`
      ],
      instructions: [
        `Provide appropriate support for learners`,
        `Monitor student progress and adjust as needed`,
        `Use encouraging language throughout the activity`
      ],
      modifications: [
        `Adapt content difficulty as appropriate`,
        `Provide additional time if needed`,
        `Offer alternative ways to demonstrate understanding`
      ],
      exit_ticket: {
        format: 'Simple reflection format appropriate for learning level',
        questions: ['What did you learn today?', 'What questions do you have?'],
        time_needed: '2-3 minutes'
      }
    };
  }

  const sectionContent = match[1];
  console.log(`📋 Extracted content for ${sectionTitle} (pattern ${usedPattern + 1}):`, sectionContent.substring(0, 200));
  
  const extracted = {
    title: extractField(sectionContent, 'Adaptation Title') || `${sectionTitle} Version`,
    talk_track: extractList(sectionContent, 'Teacher Talk Track'),
    instructions: extractList(sectionContent, 'Modified Instructions'),
    modifications: extractList(sectionContent, 'Key Modifications'),
    materials_changes: extractList(sectionContent, 'Materials Changes'),
    exit_ticket: {
      format: extractField(sectionContent, 'Format') || 'Standard reflection format',
      questions: extractList(sectionContent, 'Questions'),
      time_needed: extractField(sectionContent, 'Time Needed') || '2-3 minutes'
    }
  };
  
  console.log(`📋 Final extracted data for ${sectionTitle}:`, extracted);
  return extracted;
}

function extractESLSection(content: string): ESLAdaptations & { title: string } {
  const sectionRegex = /## ESL ADAPTATIONS([\s\S]*?)(?=##|$)/i;
  const match = content.match(sectionRegex);
  
  if (!match) {
    console.warn('⚠️ Could not extract ESL section');
    return {
      title: 'ESL-Friendly Version',
      vocabulary_support: ['No vocabulary support generated'],
      visual_aids: ['No visual aids generated'],
      language_scaffolds: ['No language scaffolds generated'],
      exit_ticket: {
        format: 'Simple picture and word format',
        language_supports: ['Use simple vocabulary', 'Provide sentence frames'],
        visual_supports: ['Include pictures or icons', 'Use graphic organizers']
      }
    };
  }

  const sectionContent = match[1];
  
  return {
    title: extractField(sectionContent, 'Adaptation Title') || 'ESL-Friendly Version',
    vocabulary_support: extractList(sectionContent, 'Vocabulary Support'),
    visual_aids: extractList(sectionContent, 'Visual Aids'),
    language_scaffolds: extractList(sectionContent, 'Language Scaffolds'),
    exit_ticket: {
      format: extractField(sectionContent, 'Format') || 'Picture and word format',
      language_supports: extractList(sectionContent, 'Language Supports'),
      visual_supports: extractList(sectionContent, 'Visual Supports')
    }
  };
}

function extractIEPSection(content: string): IEPAdaptations & { title: string } {
  const sectionRegex = /## IEP ADAPTATIONS([\s\S]*?)$/i;
  const match = content.match(sectionRegex);
  
  if (!match) {
    console.warn('⚠️ Could not extract IEP section');
    return {
      title: 'IEP Accommodations Version',
      behavioral_supports: ['No behavioral supports generated'],
      sensory_accommodations: ['No sensory accommodations generated'],
      cognitive_modifications: ['No cognitive modifications generated'],
      exit_ticket: {
        format: 'Multi-modal response options',
        accommodations: ['Extended time if needed', 'Alternative response formats'],
        alternative_formats: ['Verbal response', 'Visual demonstration', 'Digital submission']
      }
    };
  }

  const sectionContent = match[1];
  
  return {
    title: extractField(sectionContent, 'Adaptation Title') || 'IEP Accommodations Version',
    behavioral_supports: extractList(sectionContent, 'Behavioral Supports'),
    sensory_accommodations: extractList(sectionContent, 'Sensory Accommodations'),
    cognitive_modifications: extractList(sectionContent, 'Cognitive Modifications'),
    exit_ticket: {
      format: extractField(sectionContent, 'Format') || 'Multi-modal response options',
      accommodations: extractList(sectionContent, 'Accommodations'),
      alternative_formats: extractList(sectionContent, 'Alternative Formats')
    }
  };
}

function extractField(content: string, fieldName: string): string | null {
  const regex = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.*)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

function extractList(content: string, fieldName: string): string[] {
  console.log(`📋 Extracting list for: ${fieldName}`);
  
  // Try multiple patterns for field extraction
  const patterns = [
    new RegExp(`\\*\\*${fieldName}:\\*\\*([\\s\\S]*?)(?=\\*\\*[^*]+:\\*\\*|$)`, 'i'),
    new RegExp(`\\*\\*${fieldName}\\*\\*([\\s\\S]*?)(?=\\*\\*[A-Z]|$)`, 'i'),
    new RegExp(`${fieldName}:([\\s\\S]*?)(?=\\*\\*|\\n\\n|$)`, 'i'),
    new RegExp(`${fieldName}\\s*\\n([\\s\\S]*?)(?=\\*\\*|\\n\\n|$)`, 'i')
  ];
  
  let match = null;
  let usedPattern = -1;
  
  for (let i = 0; i < patterns.length; i++) {
    match = content.match(patterns[i]);
    console.log(`📋 List pattern ${i + 1} for ${fieldName}:`, match ? 'MATCH' : 'NO MATCH');
    if (match && match[1]?.trim().length > 5) {
      usedPattern = i;
      break;
    }
  }
  
  if (!match) {
    console.warn(`⚠️ Could not extract list for: ${fieldName}`);
    return [`No ${fieldName.toLowerCase()} generated`];
  }
  
  const listContent = match[1].trim();
  console.log(`📋 Raw list content for ${fieldName}:`, listContent.substring(0, 100));
  
  // Try multiple splitting strategies
  let items: string[] = [];
  
  // Strategy 1: Split by bullet points (- or *)
  if (listContent.includes('\n-') || listContent.includes('\n*')) {
    items = listContent
      .split(/\n\s*[-*]\s*/)
      .map(item => item.trim())
      .filter(item => item && item.length > 3);
  }
  // Strategy 2: Split by numbered lists
  else if (listContent.match(/\n\s*\d+\./)) {
    items = listContent
      .split(/\n\s*\d+\.\s*/)
      .map(item => item.trim())
      .filter(item => item && item.length > 3);
  }
  // Strategy 3: Split by newlines for simple lists
  else if (listContent.includes('\n')) {
    items = listContent
      .split('\n')
      .map(item => item.trim().replace(/^[-*]\s*/, ''))
      .filter(item => item && item.length > 3);
  }
  // Strategy 4: Treat as single item
  else {
    items = [listContent];
  }
  
  // Clean up items
  items = items.map(item => 
    item.replace(/^[\[\]"']+|[\[\]"']+$/g, '') // Remove brackets and quotes
        .replace(/^\s*[-*•]\s*/, '') // Remove bullet points
        .trim()
  ).filter(item => item.length > 3);
  
  console.log(`📋 Final extracted items for ${fieldName}:`, items);
  
  return items.length > 0 ? items : [`No ${fieldName.toLowerCase()} generated`];
}