import { useCallback } from 'react'
import { FormState } from '../utils/formReducer'
import { parseMathContent } from '../utils/mathUtils'
import { processLessonMathContent, integrateStepByStepSolution } from '../utils/authenticMathProcessor'

interface ParsedActivityContent {
  welcomeMessage: string
  objectives: string[]
  materials: string[]
  instructions: Array<{
    phase: string
    duration: string
    description: string
    teacherActions?: string
    studentActions?: string
    script?: string
  }>
  differentiation?: Array<{
    category: string
    strategies: string[]
  }>
  assessment?: string
  troubleshooting?: Array<{
    scenario: string
    solution: string
  }>
  managementTips?: string[]
  cerScripts?: {
    claims: string[]
    evidence: string[]
    reasoning: string[]
  }
  isSubstituteMode: boolean
}

export const useActivityGeneration = () => {
  // Helper function to process mathematical content in text with context
  const processMathContent = useCallback((text: string, topic?: string, gradeLevel?: string, subject?: string): string => {
    if (!text) return text
    
    // If we have context, use the authentic math processor
    if (topic && gradeLevel && subject) {
      const result = processLessonMathContent(text, topic, gradeLevel, subject)
      return result.processedContent
    }
    
    // Fallback to basic math parsing
    return parseMathContent(text)
  }, [])

  // Parse activity content based on mode - MEMOIZED with Math Support
  const parseActivityContent = useCallback((
    content: string, 
    mode: string, 
    topic?: string, 
    gradeLevel?: string, 
    subject?: string
  ): ParsedActivityContent => {
    console.log('📖 Parsing activity content for mode:', mode, '(with math support)')
    
    const isSubMode = mode === 'substitute'
    
    // Process mathematical expressions in the entire content first with context
    const mathProcessedContent = processMathContent(content, topic, gradeLevel, subject)
    
    // Extract welcome message
    let welcomeMessage = ''
    const welcomePatterns = [
      /Welcome Message.*?\*\*\s*([\s\S]*?)(?=###|##|\*\*)/i,
      /Hello.*?\*\*\s*([\s\S]*?)(?=###|##|\*\*)/i,
      /You're going to have an AMAZING day.*?([\s\S]*?)(?=###|##)/i
    ]
    
    for (const pattern of welcomePatterns) {
      const match = mathProcessedContent.match(pattern)
      if (match && match[1]?.trim().length > 30) {
        welcomeMessage = processMathContent(match[1].trim())
        break
      }
    }
    
    if (!welcomeMessage && isSubMode) {
      welcomeMessage = "Welcome to today's activity! You have everything you need to create an engaging learning experience."
    } else if (!welcomeMessage) {
      welcomeMessage = "This comprehensive activity is designed to engage students and achieve meaningful learning outcomes."
    }

    // Extract objectives
    let objectives: string[] = []
    const objectivePatterns = [
      /Learning Objectives.*?\*\*\s*([\s\S]*?)(?=###|##|\*\*)/i,
      /Primary Learning Objective.*?\*\*\s*([\s\S]*?)(?=###|##|\*\*)/i,
      /Students will.*?([^\n]+)/gi
    ]
    
    for (const pattern of objectivePatterns) {
      const matches = content.match(pattern)
      if (matches) {
        objectives = matches.map(match => match.trim()).filter(obj => obj.length > 10)
        if (objectives.length > 0) break
      }
    }

    // Extract materials
    let materials: string[] = []
    const materialPattern = /Materials.*?(?:Needed|Required).*?\*\*\s*([\s\S]*?)(?=###|##|\*\*)/i
    const materialMatch = content.match(materialPattern)
    
    if (materialMatch && materialMatch[1]) {
      materials = materialMatch[1]
        .split(/\n\s*[-*]/)
        .map(item => item.trim().replace(/^[-*]\s*/, ''))
        .filter(item => item && item.length > 3)
    }

    // Extract instructions/phases (simplified for space)
    const instructions: Array<{
      phase: string
      duration: string
      description: string
      teacherActions?: string
      studentActions?: string
      script?: string
    }> = []

    // Basic instruction parsing
    const instructionPattern = /(Step \d+|Phase \d+|Opening|Main Activity|Closure):.*?\(([^)]+)\)([\s\S]*?)(?=Step \d+|Phase \d+|Opening|Main Activity|Closure|###|##|$)/g
    let match
    while ((match = instructionPattern.exec(content)) !== null) {
      const phaseName = match[1]
      const duration = match[2] || '15 minutes'
      const phaseContent = match[3] || ''
      
      // Extract script if available
      const scriptPattern = /(?:Your|Opening|What You Say).*?Script.*?\*\*\s*"([^"]+)/i
      const scriptMatch = phaseContent.match(scriptPattern)
      
      instructions.push({
        phase: phaseName,
        duration: duration.includes('minute') ? duration : `${duration} minutes`,
        description: phaseContent.substring(0, 200) + '...',
        script: scriptMatch ? scriptMatch[1] : undefined
      })
    }

    // Extract CER Scripts
    const cerScripts = {
      claims: [] as string[],
      evidence: [] as string[],
      reasoning: [] as string[]
    }

    // Parse Building Claims sections
    const claimsPattern = /\*\*Building Claims.*?\*\*\s*([\s\S]*?)(?=\*\*|###|##|$)/gi
    let claimsMatch
    while ((claimsMatch = claimsPattern.exec(content)) !== null) {
      const claimsText = claimsMatch[1]
      
      // Extract sentence starters and prompts
      const scriptPatterns = [
        /"([^"]+)"/g, // Quoted text
        /saying\s+'([^']+)'/gi, // 'saying' prompts
        /Make your claim by.*?([^\n]+)/gi, // Direct instructions
        /I believe that.*?([^\n]+)/gi // Claim starters
      ]
      
      scriptPatterns.forEach(pattern => {
        let match
        while ((match = pattern.exec(claimsText)) !== null) {
          const script = match[1]?.trim()
          if (script && script.length > 10 && !cerScripts.claims.includes(script)) {
            cerScripts.claims.push(script)
          }
        }
      })
    }

    // Parse Gathering Evidence sections
    const evidencePattern = /\*\*Gathering Evidence.*?\*\*\s*([\s\S]*?)(?=\*\*|###|##|$)/gi
    let evidenceMatch
    while ((evidenceMatch = evidencePattern.exec(content)) !== null) {
      const evidenceText = evidenceMatch[1]
      
      const scriptPatterns = [
        /"([^"]+)"/g, // Quoted text
        /What evidence.*?([^\n]+)/gi, // Question prompts
        /Show me.*?([^\n]+)/gi, // Evidence requests
        /Point to.*?([^\n]+)/gi // Evidence identification
      ]
      
      scriptPatterns.forEach(pattern => {
        let match
        while ((match = pattern.exec(evidenceText)) !== null) {
          const script = match[1]?.trim()
          if (script && script.length > 10 && !cerScripts.evidence.includes(script)) {
            cerScripts.evidence.push(script)
          }
        }
      })
    }

    // Parse Connecting Reasoning sections
    const reasoningPattern = /\*\*Connecting Reasoning.*?\*\*\s*([\s\S]*?)(?=\*\*|###|##|$)/gi
    let reasoningMatch
    while ((reasoningMatch = reasoningPattern.exec(content)) !== null) {
      const reasoningText = reasoningMatch[1]
      
      const scriptPatterns = [
        /"([^"]+)"/g, // Quoted text
        /Why does.*?([^\n]+)/gi, // Why questions
        /How does.*?([^\n]+)/gi, // How questions
        /Explain.*?([^\n]+)/gi // Explanation prompts
      ]
      
      scriptPatterns.forEach(pattern => {
        let match
        while ((match = pattern.exec(reasoningText)) !== null) {
          const script = match[1]?.trim()
          if (script && script.length > 10 && !cerScripts.reasoning.includes(script)) {
            cerScripts.reasoning.push(script)
          }
        }
      })
    }

    // Only include CER scripts if we found any
    const hasCerScripts = cerScripts.claims.length > 0 || cerScripts.evidence.length > 0 || cerScripts.reasoning.length > 0

    return {
      welcomeMessage,
      objectives,
      materials,
      instructions,
      differentiation: undefined, // Simplified for now
      assessment: undefined,
      troubleshooting: undefined,
      managementTips: [],
      cerScripts: hasCerScripts ? cerScripts : undefined,
      isSubstituteMode: isSubMode
    }
  }, [])

  // Generate activity with intelligence - ENHANCED ERROR HANDLING WITH RETRY SUPPORT
  const generateActivity = useCallback(async (formState: FormState, isRetry: boolean = false) => {
    const finalActivityType = formState.activityType === 'other' ? formState.customActivityType : formState.activityType
    
    if (!finalActivityType) {
      throw new Error('Please select or specify an activity type')
    }

    // Prepare data for API
    const activityData = {
      mode: formState.isSubMode ? 'substitute' : 'teacher',
      subject: formState.subject,
      gradeLevel: formState.gradeLevel,
      topic: formState.lessonTopic,
      activityType: finalActivityType,
      duration: formState.duration,
      classSize: formState.classSize || 'Standard class size',
      specialNotes: formState.specialNotes,
      
      // Sub mode specific data
      ...(formState.isSubMode && {
        substituteName: formState.substituteName,
        techPassword: formState.techPassword,
        emergencyContacts: formState.emergencyContacts,
        substituteMode: true
      })
    }

    console.log('🚀 Sending activity data:', activityData)
    
    try {
      // Create an AbortController for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      const response = await fetch('/api/generate-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      console.log('📡 Response status:', response.status)

      // Handle successful responses
      if (response.ok) {
        const result = await response.json()
        console.log('✅ API Response:', result)
        
        if (result.success && result.activityData) {
          const activityId = result.activityId
          
          localStorage.setItem(`activity-${activityId}`, JSON.stringify(result.activityData))
          
          return {
            activityId,
            activityData: result.activityData.generatedActivity || 'Activity generated successfully!',
            parsedContent: parseActivityContent(
              result.activityData.generatedActivity || '', 
              formState.isSubMode ? 'substitute' : 'teacher',
              formState.lessonTopic,
              formState.gradeLevel,
              formState.subject
            ),
            differentiationSuggestions: result.differentiationSuggestions || null,
            fromFallback: result.fallbackNotice ? true : false
          }
        } else {
          throw new Error(result.error || 'API did not return expected data structure')
        }
      }

      // Handle error responses with enhanced user messaging
      const errorText = await response.text()
      console.error('❌ API Error Response:', errorText)
      
      let errorInfo: {
        message: string;
        type: string;
        retryable: boolean;
        userFriendly: boolean;
      } = {
        message: `HTTP ${response.status}: ${response.statusText}`,
        type: 'unknown_error',
        retryable: false,
        userFriendly: false
      }
      
      try {
        const errorJson = JSON.parse(errorText)
        errorInfo = {
          message: errorJson.error || errorInfo.message,
          type: errorJson.type || 'unknown_error',
          retryable: errorJson.retryable || false,
          userFriendly: true
        }
      } catch {
        // For non-JSON responses, create user-friendly messages based on status
        if (response.status === 529) {
          errorInfo = {
            message: 'The intelligent service is currently experiencing high demand. Our system will automatically try again or provide a backup lesson plan.',
            type: 'service_overloaded',
            retryable: true,
            userFriendly: true
          }
        } else if (response.status === 429) {
          errorInfo = {
            message: 'Too many requests at once. Please wait a moment and try again.',
            type: 'rate_limited',
            retryable: true,
            userFriendly: true
          }
        } else if (response.status >= 500) {
          errorInfo = {
            message: 'The intelligent service is temporarily unavailable. Please try again in a few minutes.',
            type: 'service_unavailable',
            retryable: true,
            userFriendly: true
          }
        } else {
          errorInfo.message = errorText.substring(0, 200) + (errorText.length > 200 ? '...' : '')
        }
      }
      
      // Create enhanced error with metadata for UI handling
      const enhancedError = new Error(errorInfo.message) as Error & {
        type: string;
        retryable: boolean;
        userFriendly: boolean;
        status: number;
      }
      
      enhancedError.type = errorInfo.type
      enhancedError.retryable = errorInfo.retryable
      enhancedError.userFriendly = errorInfo.userFriendly
      enhancedError.status = response.status
      
      throw enhancedError

    } catch (networkError) {
      // Handle different types of network/fetch errors
      if (networkError.name === 'AbortError') {
        const enhancedError = new Error('The lesson generation request timed out. This usually happens during high demand. Please try again.') as Error & {
          type: string;
          retryable: boolean;
          userFriendly: boolean;
        }
        enhancedError.type = 'timeout_error'
        enhancedError.retryable = true
        enhancedError.userFriendly = true
        throw enhancedError
      } else if (networkError instanceof TypeError && networkError.message.includes('fetch')) {
        const enhancedError = new Error('Unable to connect to the lesson generation service. Please check your internet connection and try again.') as Error & {
          type: string;
          retryable: boolean;
          userFriendly: boolean;
        }
        enhancedError.type = 'network_error'
        enhancedError.retryable = true
        enhancedError.userFriendly = true
        throw enhancedError
      }
      
      // Re-throw enhanced errors or other errors as-is
      throw networkError
    }
  }, [parseActivityContent])

  return {
    generateActivity,
    parseActivityContent
  }
}