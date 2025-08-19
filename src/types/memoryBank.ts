export interface ActivityNode {
  id: string
  title: string
  subject: string
  gradeLevel: string
  topic: string
  activityType: string
  duration: number
  rating: number
  useCount: number
  createdAt: string
  lastUsed?: string
  preview: string
  tags: string[]
  isFavorite: boolean
  mode: 'teacher' | 'substitute'
  fullContent: string
  // Enhanced features for Phase 3
  basedOn?: string // ID of template activity
  derivedActivities?: string[] // Activities created from this one
  templateUseCount: number // Times used as template
  successScore: number // Calculated success metric
  lastSuggested?: string // When last suggested to user
  userPatterns?: {
    subjectPreference: number
    typePreference: number
    durationPreference: number
  }
}

export interface SearchFilters {
  searchTerm: string
  subject: string
  gradeLevel: string
  timeframe: 'all' | 'week' | 'month' | 'quarter' | 'year'
  mode: 'all' | 'teacher' | 'substitute'
  sortBy: 'recent' | 'popular' | 'rating' | 'alphabetical'
}

export interface ActivityAction {
  type: 'reuse' | 'favorite' | 'delete' | 'duplicate' | 'edit'
  activityId: string
}

export interface MemoryBankStats {
  totalActivities: number
  favoriteCount: number
  teacherModeCount: number
  substituteModeCount: number
  mostUsedSubject: string
  averageRating: number
}

export interface ActivityPreviewData extends ActivityNode {
  relatedActivities?: ActivityNode[]
  usageHistory?: Array<{
    date: string
    context?: string
  }>
}

// Phase 3: Smart Suggestions Types
export interface SuggestionReason {
  type: 'similar_topic' | 'same_subject_grade' | 'successful_pattern' | 'recent_success' | 'high_rated'
  score: number
  explanation: string
}

export interface ActivitySuggestion {
  activity: ActivityNode
  reason: SuggestionReason
  similarity: number
}

export interface ActivityRequest {
  subject: string
  gradeLevel: string
  topic: string
  activityType?: string
  duration?: number
}

export interface SuccessPatterns {
  preferredActivityTypes: Array<{ value: string; count: number }>
  successfulSubjects: Array<{ value: string; count: number }>
  idealDurations: Array<{ range: string; count: number }>
  winningTags: Array<{ tag: string; count: number }>
  averageRating: number
  mostReusedTypes: Array<{ type: string; avgUseCount: number }>
}

export interface TeachingInsights {
  totalActivities: number
  averageRating: number
  totalUseCount: number
  favoriteSubjects: string[]
  preferredDurations: number[]
  successPatterns: SuccessPatterns
  recentTrends: {
    thisWeek: number
    thisMonth: number
    trending: string[]
  }
}

export interface SmartSearchSuggestion {
  label: string
  query: string
  type: 'quick_filter' | 'saved_search' | 'pattern_based'
  icon: string
}

// Phase 4: Success Tracking & Premium Integration Types
export interface ActivityUsageMetrics {
  // Behavioral success indicators
  reuseCount: number
  templateUseCount: number
  viewDuration: number
  copyCount: number
  lastAccessDate: string
  
  // Engagement patterns
  quickActions: {
    copied: number
    printed: number
    shared: number
    favorited: boolean
  }
  
  // Success proxy metrics
  successScore: number
}

export interface TeacherFeedback {
  rating?: number
  reflectionNotes?: string
  wouldUseAgain?: boolean
  studentEngagement?: number
  timingAccuracy?: number
  materialsCost?: 'low' | 'medium' | 'high'
  prepTime?: number
  feedbackDate?: string
}

export interface FreeTierLimits {
  maxStoredActivities: number
  maxSearchResults: number
  noSmartSuggestions: boolean
  noAnalytics: boolean
  noTemplateCreation: boolean
  noExport: boolean
}

export interface PremiumFeatures {
  unlimitedStorage: boolean
  smartSuggestions: boolean
  advancedAnalytics: boolean
  templateSystem: boolean
  exportOptions: boolean
  prioritySupport: boolean
}

export interface MemoryBankAnalytics {
  // Usage patterns
  dailyActiveUsers: number
  averageActivitiesPerUser: number
  averageSessionDuration: number
  
  // Feature adoption
  smartSuggestionsUsage: number
  templateCreationRate: number
  ratingCompletionRate: number
  
  // Premium conversion
  freeToTrialConversion: number
  trialToPaidConversion: number
  premiumRetentionRate: number
  
  // Success indicators
  averageActivityRating: number
  reuseRate: number
  userRetentionRate: number
}

export interface EnhancedActivityNode extends ActivityNode {
  // Enhanced tracking fields
  usageMetrics?: ActivityUsageMetrics
  teacherFeedback?: TeacherFeedback
  // Success indicators
  wouldRecommend?: boolean
  timesShared?: number
}