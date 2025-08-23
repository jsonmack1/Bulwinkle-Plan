// YouTube Video Integration Types
// Phase 1: Educational Video Integration

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  channelTitle: string
  channelId: string
  thumbnailUrl: string
  duration: string // ISO 8601 duration format (e.g., "PT4M13S")
  durationSeconds: number // Converted to seconds for easy comparison
  publishedAt: string
  viewCount: number
  likeCount?: number
  dislikeCount?: number
  url: string
  embedUrl?: string
  shortUrl?: string // Short youtu.be format URL
  relevanceScore: number // Intelligently-calculated score 0-100
  relevancyReason?: string // Explanation of why this video is relevant
  suggestedTimestamps?: string[] // Key learning moments with timestamps
  safetyAnalysis: VideoSafetyAnalysis
  tags?: string[]
  categoryId?: string
  defaultAudioLanguage?: string
  isLiveBroadcast?: boolean
  // Intelligent search metadata
  intelligentMetadata?: IntelligentSearchMetadata
}

export interface IntelligentSearchMetadata {
  confidenceScore: number // 0-100 confidence in educational relevance
  searchTerm: string // The search term that found this video
  educationalIndicators: string[] // Reasons why this video was selected
  analysisReason: string // Detailed explanation of the selection
  fallbackSearch?: boolean // Whether this came from a fallback search
  contextualRelevance?: number // 0-100 relevance to the specific context
}

export interface VideoSafetyAnalysis {
  isEducational?: boolean
  hasInappropriateContent?: boolean
  ageAppropriate: boolean
  contentWarnings: string[]
  educationalValue: number // 0-100 score
  safetyScore: number // 0-100 overall safety score
  moderationFlags?: {
    violence: boolean
    profanity: boolean
    mature: boolean
    misleading: boolean
  }
  teacherReviewRequired: boolean
  recommendedMinAge: number
}

export interface YouTubeSearchRequest {
  topic: string
  gradeLevel: string
  subject: string
  duration: number // lesson duration in minutes
  maxResults?: number
  safeSearch?: 'none' | 'moderate' | 'strict'
  order?: 'relevance' | 'rating' | 'viewCount' | 'date'
}

export interface YouTubeSearchResponse {
  success: boolean
  videos: YouTubeVideo[]
  totalResults?: number
  searchQueries?: string[]
  isPremium?: boolean
  limitedResults?: boolean
  error?: string
  // Intelligent search metadata
  intelligentSearch?: IntelligentSearchResponse
}

export interface IntelligentSearchResponse {
  searchStrategy: string // 'primary-only' | 'fallback-enhanced' | 'mock-intelligent'
  searchTermsUsed: string[] // All search terms that were tried
  averageConfidence: number // Average confidence score of results
  totalResultsAnalyzed: number // Total videos analyzed before filtering
  fallbackTriggered: boolean // Whether fallback search was needed
  feedback: {
    primarySearchResults: number
    fallbackSearchResults: number
    filteredOutCount: number
    reasonsFiltered: string[]
  }
  suggestions: string // Recommendations for improving search
  performance: {
    successRate: number // Overall success rate of the search system
    averageConfidence: number // Historical average confidence
    fallbackRate: number // How often fallback is triggered
  }
}

export interface VideoSelectionState {
  selectedVideos: Set<string>
  addedVideos: YouTubeVideo[]
  searchHistory: string[]
  lastSearchTopic: string
}

// Freemium limitations
export interface FreemiumLimits {
  maxVideos: number // 3 for free, unlimited for premium
  maxDurationMinutes: number // 2 minutes for free, unlimited for premium
  canAccessAdvancedSearch: boolean
  canAccessSafetyAnalysis: boolean
  canAccessBulkAdd: boolean
}

// API Response types
export interface YouTubeAPIError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface YouTubeAPIResponse {
  kind: string
  etag: string
  items: YouTubeVideoItem[]
  nextPageToken?: string
  prevPageToken?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

export interface YouTubeVideoItem {
  kind: string
  etag: string
  id: string | { videoId: string }
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      default: YouTubeThumbnail
      medium: YouTubeThumbnail
      high: YouTubeThumbnail
      standard?: YouTubeThumbnail
      maxres?: YouTubeThumbnail
    }
    channelTitle: string
    tags?: string[]
    categoryId: string
    liveBroadcastContent: string
    defaultAudioLanguage?: string
    defaultLanguage?: string
  }
  contentDetails?: {
    duration: string
    dimension: string
    definition: string
    caption: string
    licensedContent: boolean
    projection: string
  }
  statistics?: {
    viewCount: string
    likeCount?: string
    dislikeCount?: string
    favoriteCount: string
    commentCount: string
  }
}

export interface YouTubeThumbnail {
  url: string
  width: number
  height: number
}

// Search strategy types for multiple query approaches
export interface SearchStrategy {
  name: string
  queryTemplate: string
  description: string
  weight: number // Importance weight for ranking
}

export const SEARCH_STRATEGIES: SearchStrategy[] = [
  // Core educational searches
  {
    name: 'direct_topic_short',
    queryTemplate: '{topic} {subject} short explanation',
    description: 'Direct topic with short content emphasis',
    weight: 1.0
  },
  {
    name: 'grade_specific_brief',
    queryTemplate: '{topic} {gradeLevel} brief summary',
    description: 'Grade-specific brief content',
    weight: 0.95
  },
  {
    name: 'educational_shorts',
    queryTemplate: '{topic} educational shorts {subject}',
    description: 'Educational short-form content',
    weight: 0.9
  },
  {
    name: 'quick_concept',
    queryTemplate: '{topic} explained quickly {subject}',
    description: 'Quick concept explanations',
    weight: 0.85
  },
  {
    name: 'minute_summary',
    queryTemplate: '{topic} 2 minute summary {subject}',
    description: 'Short summary content',
    weight: 0.8
  },
  {
    name: 'key_concepts_brief',
    queryTemplate: '{conceptKeywords} {subject} brief explanation',
    description: 'Key concepts with brief explanation',
    weight: 0.75
  },
  {
    name: 'educational_clips',
    queryTemplate: '{topic} {subject} educational clips short',
    description: 'Educational clips and excerpts',
    weight: 0.7
  },
  {
    name: 'visual_animation_short',
    queryTemplate: '{topic} animation short {subject}',
    description: 'Short visual and animation content',
    weight: 0.65
  },
  {
    name: 'documentary_clips',
    queryTemplate: '{topic} documentary clips brief {subject}',
    description: 'Short documentary excerpts',
    weight: 0.6
  },
  {
    name: 'curriculum_terms',
    queryTemplate: '{curriculumTerms} {subject} quick overview',
    description: 'Curriculum-specific terminology',
    weight: 0.55
  }
]

// Enhanced topic processing for better keyword extraction
export interface EnhancedSearchContext {
  originalTopic: string
  conceptKeywords: string[]
  curriculumTerms: string[]
  alternativeTerms: string[]
  subjectSpecificTerms: string[]
}