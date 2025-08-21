/**
 * Intelligent Video Search System
 * Provides contextual filtering, confidence scoring, and automatic fallback logic
 * for educational video content discovery
 */

export interface VideoResult {
  id: string
  title: string
  description: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
  duration: string
  viewCount?: number
  confidenceScore: number
  searchTerm: string
  reasonsFiltered?: string[]
  educationalIndicators: string[]
}

export interface SearchContext {
  subject: string
  gradeLevel: string
  topic: string
  duration?: number
  previousSuccessfulTerms?: string[]
  userPreferences?: {
    preferredChannels?: string[]
    excludedChannels?: string[]
    minConfidenceThreshold?: number
  }
}

export interface SearchResult {
  results: VideoResult[]
  searchTermsUsed: string[]
  averageConfidence: number
  totalResultsFound: number
  fallbackTriggered: boolean
  searchStrategy: string
  feedback: {
    primarySearchResults: number
    fallbackSearchResults: number
    filteredOutCount: number
    reasonsFiltered: string[]
  }
}

// Educational content indicators by subject
const EDUCATIONAL_INDICATORS = {
  'Math': [
    'lesson', 'tutorial', 'explained', 'learn', 'solve', 'practice', 'step by step',
    'education', 'teaching', 'classroom', 'khan academy', 'professor', 'instructor'
  ],
  'English Language Arts': [
    'grammar', 'writing', 'reading', 'literature', 'lesson', 'tutorial', 'explained',
    'education', 'teaching', 'classroom', 'english', 'language arts'
  ],
  'Science': [
    'experiment', 'lab', 'demonstration', 'explanation', 'lesson', 'tutorial',
    'education', 'biology', 'chemistry', 'physics', 'scientific', 'research'
  ],
  'Social Studies': [
    'history', 'geography', 'civics', 'lesson', 'documentary', 'historical',
    'education', 'teaching', 'civilization', 'culture', 'government'
  ],
  'Art': [
    'technique', 'tutorial', 'lesson', 'demonstration', 'art education',
    'drawing', 'painting', 'creative', 'artistic', 'step by step'
  ],
  'Music': [
    'lesson', 'tutorial', 'theory', 'instrument', 'practice', 'education',
    'musical', 'composition', 'performance', 'technique'
  ],
  'Physical Education': [
    'exercise', 'fitness', 'sports', 'technique', 'training', 'health',
    'physical education', 'workout', 'movement', 'athletics'
  ]
}

// Inappropriate content flags
const INAPPROPRIATE_FLAGS = [
  'explicit', 'mature', 'adult', 'violence', 'inappropriate', 'nsfw',
  'dangerous', 'harmful', 'scary', 'horror', 'graphic', 'disturbing'
]

// Trusted educational channels
const TRUSTED_EDUCATIONAL_CHANNELS = [
  'Khan Academy', 'Crash Course', 'TED-Ed', 'National Geographic Kids',
  'SciShow Kids', 'Scholastic', 'BrainPOP', 'Mystery Science',
  'Professor Dave Explains', 'Amoeba Sisters', 'MinutePhysics',
  'Veritasium', 'SmarterEveryDay', 'Bill Nye', 'Science Max'
]

/**
 * Generate alternate search terms based on context
 */
export function generateAlternateSearchTerms(
  primaryTerm: string,
  context: SearchContext
): string[] {
  const { subject, gradeLevel, topic } = context
  const alternates: string[] = []
  
  // Subject-specific expansions
  const subjectExpansions = getSubjectSpecificTerms(primaryTerm, subject)
  alternates.push(...subjectExpansions)
  
  // Grade-level appropriate terms
  const gradeTerms = getGradeLevelTerms(primaryTerm, gradeLevel)
  alternates.push(...gradeTerms)
  
  // Educational context terms
  alternates.push(
    `${primaryTerm} lesson`,
    `${primaryTerm} tutorial`,
    `${primaryTerm} explained`,
    `${primaryTerm} for kids`,
    `${primaryTerm} education`,
    `learn ${primaryTerm}`,
    `${primaryTerm} ${subject.toLowerCase()}`,
    `${gradeLevel} ${primaryTerm}`
  )
  
  // Remove duplicates and return
  return [...new Set(alternates)].filter(term => term !== primaryTerm)
}

/**
 * Get subject-specific alternate terms
 */
function getSubjectSpecificTerms(term: string, subject: string): string[] {
  const termLower = term.toLowerCase()
  
  switch (subject) {
    case 'Math':
      if (termLower.includes('fraction')) {
        return ['fractions explained', 'fraction math', 'parts of fractions', 'fraction tutorial']
      }
      if (termLower.includes('algebra')) {
        return ['algebra basics', 'algebra equations', 'solving algebra', 'algebra tutorial']
      }
      if (termLower.includes('geometry')) {
        return ['geometry shapes', 'geometry formulas', 'geometry basics', 'geometric concepts']
      }
      break
      
    case 'English Language Arts':
      if (termLower.includes('contraction')) {
        return ['grammar contractions', 'apostrophes contractions', 'shortened words', 'contractions lesson']
      }
      if (termLower.includes('grammar')) {
        return ['english grammar', 'grammar rules', 'grammar lesson', 'grammar basics']
      }
      if (termLower.includes('writing')) {
        return ['writing skills', 'creative writing', 'essay writing', 'writing techniques']
      }
      break
      
    case 'Science':
      if (termLower.includes('cell')) {
        return ['plant cells biology', 'animal cells science', 'cell parts diagram', 'cell structure']
      }
      if (termLower.includes('photosynthesis')) {
        return ['photosynthesis process', 'plant photosynthesis', 'photosynthesis explained', 'how plants make food']
      }
      if (termLower.includes('ecosystem')) {
        return ['ecosystem science', 'food chain', 'habitat science', 'ecosystem balance']
      }
      break
      
    case 'Social Studies':
      if (termLower.includes('civil war')) {
        return ['american civil war', 'civil war history', 'civil war causes', 'civil war documentary']
      }
      if (termLower.includes('government')) {
        return ['government civics', 'how government works', 'branches of government', 'democracy explained']
      }
      break
  }
  
  return []
}

/**
 * Get grade-level appropriate terms
 */
function getGradeLevelTerms(term: string, gradeLevel: string): string[] {
  const grade = gradeLevel.toLowerCase()
  
  if (grade.includes('k') || grade.includes('kindergarten') || grade.includes('pre')) {
    return [`${term} for kindergarten`, `${term} preschool`, `${term} early learning`]
  }
  
  if (grade.includes('1st') || grade.includes('2nd') || grade.includes('3rd')) {
    return [`${term} elementary`, `${term} primary school`, `${term} for young learners`]
  }
  
  if (grade.includes('4th') || grade.includes('5th') || grade.includes('6th')) {
    return [`${term} upper elementary`, `${term} middle grades`, `${term} intermediate`]
  }
  
  if (grade.includes('7th') || grade.includes('8th') || grade.includes('9th')) {
    return [`${term} middle school`, `${term} junior high`, `${term} teens`]
  }
  
  if (grade.includes('10th') || grade.includes('11th') || grade.includes('12th')) {
    return [`${term} high school`, `${term} advanced`, `${term} secondary`]
  }
  
  if (grade.includes('ap')) {
    return [`${term} advanced placement`, `${term} college level`, `${term} AP curriculum`]
  }
  
  return []
}

/**
 * Analyze video content for educational relevance
 */
export function analyzeVideoContent(
  video: any,
  context: SearchContext,
  searchTerm: string
): { confidenceScore: number; educationalIndicators: string[]; reasonsFiltered: string[] } {
  let confidenceScore = 0
  const educationalIndicators: string[] = []
  const reasonsFiltered: string[] = []
  
  const title = (video.snippet?.title || '').toLowerCase()
  const description = (video.snippet?.description || '').toLowerCase()
  const channelTitle = (video.snippet?.channelTitle || '').toLowerCase()
  
  // Base score for content analysis
  let contentScore = 0
  let channelScore = 0
  let contextScore = 0
  
  // Check for educational indicators
  const subjectIndicators = EDUCATIONAL_INDICATORS[context.subject] || EDUCATIONAL_INDICATORS['Math']
  
  for (const indicator of subjectIndicators) {
    if (title.includes(indicator.toLowerCase()) || description.includes(indicator.toLowerCase())) {
      contentScore += 10
      educationalIndicators.push(indicator)
    }
  }
  
  // Bonus for trusted educational channels
  for (const trustedChannel of TRUSTED_EDUCATIONAL_CHANNELS) {
    if (channelTitle.includes(trustedChannel.toLowerCase())) {
      channelScore += 25
      educationalIndicators.push(`Trusted channel: ${trustedChannel}`)
      break
    }
  }
  
  // Check for inappropriate content
  for (const flag of INAPPROPRIATE_FLAGS) {
    if (title.includes(flag) || description.includes(flag)) {
      reasonsFiltered.push(`Contains inappropriate content: ${flag}`)
      return { confidenceScore: 0, educationalIndicators, reasonsFiltered }
    }
  }
  
  // Context relevance scoring
  const subjectLower = context.subject.toLowerCase()
  const topicLower = context.topic.toLowerCase()
  const searchTermLower = searchTerm.toLowerCase()
  
  // Check if video title/description contains subject terms
  if (title.includes(subjectLower) || description.includes(subjectLower)) {
    contextScore += 15
    educationalIndicators.push(`Subject match: ${context.subject}`)
  }
  
  // Check for topic relevance
  if (title.includes(topicLower) || description.includes(topicLower)) {
    contextScore += 20
    educationalIndicators.push(`Topic match: ${context.topic}`)
  }
  
  // Check for search term presence
  if (title.includes(searchTermLower)) {
    contextScore += 15
    educationalIndicators.push(`Title contains search term`)
  }
  
  // Grade level appropriateness
  const gradeScore = assessGradeLevelAppropriateness(video, context.gradeLevel)
  if (gradeScore > 0) {
    contextScore += gradeScore
    educationalIndicators.push(`Grade-appropriate content`)
  }
  
  // Duration appropriateness (if provided)
  if (context.duration && video.contentDetails?.duration) {
    const videoDuration = parseDuration(video.contentDetails.duration)
    const targetDuration = context.duration
    
    // Prefer videos that are 5-15 minutes for most educational content
    if (videoDuration >= 3 && videoDuration <= 20) {
      contextScore += 10
      educationalIndicators.push('Appropriate duration')
    } else if (videoDuration > 30) {
      contextScore -= 5
      reasonsFiltered.push('Video too long for classroom use')
    }
  }
  
  // Calculate final confidence score (0-100)
  confidenceScore = Math.min(100, contentScore + channelScore + contextScore)
  
  // Apply minimum thresholds
  if (confidenceScore < 20) {
    reasonsFiltered.push('Low educational relevance score')
  }
  
  return { confidenceScore, educationalIndicators, reasonsFiltered }
}

/**
 * Assess grade level appropriateness
 */
function assessGradeLevelAppropriateness(video: any, gradeLevel: string): number {
  const title = (video.snippet?.title || '').toLowerCase()
  const description = (video.snippet?.description || '').toLowerCase()
  const content = `${title} ${description}`
  
  // Grade level indicators
  const gradeLower = gradeLevel.toLowerCase()
  
  if (content.includes(gradeLower)) return 15
  
  // Elementary indicators
  if (gradeLower.includes('k') || gradeLower.includes('1st') || gradeLower.includes('2nd') || gradeLower.includes('3rd')) {
    if (content.includes('kids') || content.includes('children') || content.includes('elementary')) {
      return 12
    }
  }
  
  // Middle school indicators
  if (gradeLower.includes('4th') || gradeLower.includes('5th') || gradeLower.includes('6th') || gradeLower.includes('7th') || gradeLower.includes('8th')) {
    if (content.includes('middle school') || content.includes('intermediate')) {
      return 12
    }
  }
  
  // High school indicators
  if (gradeLower.includes('9th') || gradeLower.includes('10th') || gradeLower.includes('11th') || gradeLower.includes('12th')) {
    if (content.includes('high school') || content.includes('secondary')) {
      return 12
    }
  }
  
  // AP indicators
  if (gradeLower.includes('ap')) {
    if (content.includes('advanced') || content.includes('college') || content.includes('ap')) {
      return 15
    }
  }
  
  return 5 // Base score for general educational content
}

/**
 * Parse YouTube duration format (PT#M#S) to minutes
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 60 + minutes + seconds / 60
}

/**
 * Combine and rank results from multiple searches
 */
export function combineAndRankResults(
  searchResults: Array<{ results: VideoResult[]; searchTerm: string }>,
  maxResults: number = 10
): VideoResult[] {
  const allResults: VideoResult[] = []
  
  // Combine all results
  for (const searchResult of searchResults) {
    allResults.push(...searchResult.results)
  }
  
  // Remove duplicates by video ID
  const uniqueResults = allResults.filter((video, index, array) => 
    array.findIndex(v => v.id === video.id) === index
  )
  
  // Sort by confidence score (descending)
  uniqueResults.sort((a, b) => b.confidenceScore - a.confidenceScore)
  
  // Return top results
  return uniqueResults.slice(0, maxResults)
}

/**
 * Determine if fallback search is needed
 */
export function shouldTriggerFallback(
  results: VideoResult[],
  minResults: number = 3,
  minAverageConfidence: number = 60,
  minIndividualConfidence: number = 70
): { shouldFallback: boolean; reason: string } {
  // Check if we have enough high-quality results
  const highConfidenceResults = results.filter(r => r.confidenceScore >= minIndividualConfidence)
  
  if (highConfidenceResults.length < minResults) {
    return {
      shouldFallback: true,
      reason: `Only ${highConfidenceResults.length} results with confidence ≥ ${minIndividualConfidence}% (need ${minResults})`
    }
  }
  
  // Check average confidence
  const averageConfidence = results.length > 0 
    ? results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length 
    : 0
    
  if (averageConfidence < minAverageConfidence) {
    return {
      shouldFallback: true,
      reason: `Average confidence ${averageConfidence.toFixed(1)}% below threshold ${minAverageConfidence}%`
    }
  }
  
  return { shouldFallback: false, reason: 'Results quality acceptable' }
}

/**
 * Learn from successful searches to improve future results
 */
export function learnFromSearch(
  searchTerm: string,
  results: VideoResult[],
  context: SearchContext,
  userFeedback?: { videoId: string; helpful: boolean }[]
): {
  successfulTerms: string[]
  improvementSuggestions: string[]
} {
  const successfulTerms: string[] = []
  const improvementSuggestions: string[] = []
  
  // Identify successful search terms (high confidence results)
  const highQualityResults = results.filter(r => r.confidenceScore >= 80)
  
  if (highQualityResults.length > 0) {
    successfulTerms.push(searchTerm)
    
    // Extract successful patterns
    const successfulPatterns = highQualityResults.map(r => r.searchTerm)
    successfulTerms.push(...successfulPatterns)
  }
  
  // Generate improvement suggestions
  if (results.length === 0) {
    improvementSuggestions.push('Try more specific search terms')
    improvementSuggestions.push('Include subject name in search')
  } else if (results.every(r => r.confidenceScore < 50)) {
    improvementSuggestions.push('Search terms may be too broad')
    improvementSuggestions.push('Try including grade level in search')
  }
  
  return { successfulTerms: [...new Set(successfulTerms)], improvementSuggestions }
}

/**
 * Adaptive threshold adjustment based on subject complexity
 */
export function getAdaptiveThresholds(context: SearchContext): {
  minConfidence: number
  minResults: number
  fallbackThreshold: number
} {
  const { subject, gradeLevel } = context
  
  let baseConfidence = 60
  let baseResults = 3
  let baseFallback = 70
  
  // Adjust for subject complexity
  switch (subject) {
    case 'Math':
      // Math often has very specific terminology
      baseConfidence = 65
      baseFallback = 75
      break
    case 'Science':
      // Science has many specialized terms
      baseConfidence = 65
      baseFallback = 75
      break
    case 'English Language Arts':
      // ELA can be broad, so be more lenient
      baseConfidence = 55
      baseFallback = 65
      break
    case 'Art':
    case 'Music':
      // Creative subjects may have fewer educational videos
      baseConfidence = 50
      baseResults = 2
      baseFallback = 60
      break
  }
  
  // Adjust for grade level
  if (gradeLevel.includes('AP') || gradeLevel.includes('12th')) {
    // Advanced content is harder to find
    baseConfidence -= 10
    baseResults = 2
    baseFallback -= 10
  } else if (gradeLevel.includes('K') || gradeLevel.includes('1st') || gradeLevel.includes('2nd')) {
    // Elementary content should be more readily available
    baseConfidence += 5
    baseFallback += 5
  }
  
  return {
    minConfidence: Math.max(30, baseConfidence),
    minResults: Math.max(1, baseResults),
    fallbackThreshold: Math.max(40, baseFallback)
  }
}