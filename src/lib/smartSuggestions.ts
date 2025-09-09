import { 
  ActivityNode, 
  ActivityRequest, 
  ActivitySuggestion, 
  SuggestionReason,
  SuccessPatterns,
  TeachingInsights 
} from '../types/memoryBank'

/**
 * Smart Suggestions Engine - Phase 3
 * Provides intelligent activity suggestions based on user patterns and similarity matching
 */

export class SmartSuggestionsEngine {
  private activities: ActivityNode[]

  constructor(activities: ActivityNode[]) {
    this.activities = activities
  }

  /**
   * Calculate similarity between a current request and stored activity
   */
  calculateSimilarity(current: ActivityRequest, past: ActivityNode): number {
    let score = 0

    // Subject match (high weight)
    if (current.subject === past.subject) score += 30

    // Grade level match (high weight)
    if (current.gradeLevel === past.gradeLevel) score += 25

    // Topic similarity (keyword matching)
    if (current.topic && past.topic) {
      const topicWords = current.topic.toLowerCase().split(' ')
      const pastTopicWords = past.topic.toLowerCase().split(' ')
      const commonWords = topicWords.filter(word => 
        word.length > 2 && pastTopicWords.includes(word)
      )
      score += (commonWords.length / Math.max(topicWords.length, 1)) * 20
    }

    // Activity type match
    if (current.activityType === past.activityType) score += 15

    // Duration similarity
    if (current.duration && past.duration) {
      const durationDiff = Math.abs(current.duration - past.duration)
      if (durationDiff <= 10) score += 10
      else if (durationDiff <= 20) score += 5
    }

    // Success bonus (high ratings get priority)
    if (past.rating >= 4) score += 10
    if (past.useCount >= 3) score += 5
    if (past.templateUseCount >= 2) score += 5

    return Math.min(score, 100) // Cap at 100
  }

  /**
   * Generate suggestions for a new activity request
   */
  getSuggestions(request: ActivityRequest, limit: number = 5): ActivitySuggestion[] {
    const suggestions: ActivitySuggestion[] = []

    for (const activity of this.activities) {
      const similarity = this.calculateSimilarity(request, activity)
      
      if (similarity >= 30) { // Only suggest if similarity is reasonable
        const reason = this.getSuggestionReason(request, activity, similarity)
        
        suggestions.push({
          activity,
          reason,
          similarity
        })
      }
    }

    // Sort by similarity score and success metrics
    return suggestions
      .sort((a, b) => {
        const scoreA = a.similarity + (a.activity.rating * 5) + (a.activity.useCount * 2)
        const scoreB = b.similarity + (b.activity.rating * 5) + (b.activity.useCount * 2)
        return scoreB - scoreA
      })
      .slice(0, limit)
  }

  /**
   * Determine the reason for suggesting an activity
   */
  private getSuggestionReason(request: ActivityRequest, activity: ActivityNode, similarity: number): SuggestionReason {
    // High-rated activity
    if (activity.rating >= 4.5) {
      return {
        type: 'high_rated',
        score: similarity,
        explanation: `This ${activity.rating}-star activity worked great for you before`
      }
    }

    // Same subject and grade
    if (request.subject === activity.subject && request.gradeLevel === activity.gradeLevel) {
      return {
        type: 'same_subject_grade',
        score: similarity,
        explanation: `Perfect match for ${activity.gradeLevel} ${activity.subject}`
      }
    }

    // Similar topic
    if (request.topic && activity.topic) {
      const topicWords = request.topic.toLowerCase().split(' ')
      const pastTopicWords = activity.topic.toLowerCase().split(' ')
      const commonWords = topicWords.filter(word => pastTopicWords.includes(word))
      
      if (commonWords.length > 0) {
        return {
          type: 'similar_topic',
          score: similarity,
          explanation: `Similar to your "${activity.title}" activity`
        }
      }
    }

    // Successful pattern
    if (activity.useCount >= 3) {
      return {
        type: 'successful_pattern',
        score: similarity,
        explanation: `You've reused this ${activity.useCount} times - must be good!`
      }
    }

    // Recent success
    if (activity.lastUsed && this.isRecentlyUsed(activity.lastUsed)) {
      return {
        type: 'recent_success',
        score: similarity,
        explanation: `You used this recently with success`
      }
    }

    // Default similar topic
    return {
      type: 'similar_topic',
      score: similarity,
      explanation: `Similar content and approach`
    }
  }

  /**
   * Find success patterns in user's activity history
   */
  findSuccessPatterns(): SuccessPatterns {
    const successful = this.activities.filter(a => a.rating >= 4 && a.useCount >= 2)
    
    // Count occurrences
    const activityTypeCounts = this.countOccurrences(successful.map(a => a.activityType))
    const subjectCounts = this.countOccurrences(successful.map(a => a.subject))
    const tagCounts = this.countOccurrences(successful.flatMap(a => a.tags))
    
    // Duration ranges
    const durationRanges = successful.map(a => this.getDurationRange(a.duration))
    const durationCounts = this.countOccurrences(durationRanges)
    
    // Most reused types
    const typeUseMap = new Map<string, { count: number; totalUse: number }>()
    successful.forEach(activity => {
      const existing = typeUseMap.get(activity.activityType) || { count: 0, totalUse: 0 }
      typeUseMap.set(activity.activityType, {
        count: existing.count + 1,
        totalUse: existing.totalUse + activity.useCount
      })
    })
    
    const mostReusedTypes = Array.from(typeUseMap.entries())
      .map(([type, data]) => ({
        type,
        avgUseCount: data.totalUse / data.count
      }))
      .sort((a, b) => b.avgUseCount - a.avgUseCount)

    return {
      preferredActivityTypes: activityTypeCounts,
      successfulSubjects: subjectCounts,
      idealDurations: durationCounts.map(item => ({ range: item.value, count: item.count })),
      winningTags: tagCounts.map(item => ({ tag: item.value, count: item.count })),
      averageRating: successful.length > 0 
        ? successful.reduce((sum, a) => sum + a.rating, 0) / successful.length 
        : 0,
      mostReusedTypes
    }
  }

  /**
   * Generate teaching insights from activity history
   */
  generateInsights(): TeachingInsights {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const thisWeekActivities = this.activities.filter(a => 
      new Date(a.createdAt) >= oneWeekAgo
    )
    const thisMonthActivities = this.activities.filter(a => 
      new Date(a.createdAt) >= oneMonthAgo
    )

    // Get trending topics/subjects
    const recentTags = thisMonthActivities.flatMap(a => a.tags)
    const trendingTags = this.countOccurrences(recentTags)
      .slice(0, 3)
      .map(item => item.value)

    return {
      totalActivities: this.activities.length,
      averageRating: this.activities.length > 0 
        ? this.activities.reduce((sum, a) => sum + a.rating, 0) / this.activities.length 
        : 0,
      totalUseCount: this.activities.reduce((sum, a) => sum + a.useCount, 0),
      favoriteSubjects: this.getTopSubjects(),
      preferredDurations: this.getCommonDurations(),
      successPatterns: this.findSuccessPatterns(),
      recentTrends: {
        thisWeek: thisWeekActivities.length,
        thisMonth: thisMonthActivities.length,
        trending: trendingTags
      }
    }
  }

  // Helper methods
  private countOccurrences(items: string[]): Array<{ value: string; count: number }> {
    const counts = new Map<string, number>()
    items.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1)
    })
    
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
  }

  private getDurationRange(duration: number): string {
    if (duration <= 30) return '≤30 min'
    if (duration <= 45) return '31-45 min'
    if (duration <= 60) return '46-60 min'
    if (duration <= 90) return '61-90 min'
    return '>90 min'
  }

  private isRecentlyUsed(lastUsed: string): boolean {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    return new Date(lastUsed) >= twoWeeksAgo
  }

  private getTopSubjects(): string[] {
    const subjectCounts = this.countOccurrences(this.activities.map(a => a.subject))
    return subjectCounts.slice(0, 3).map(item => item.value)
  }

  private getCommonDurations(): number[] {
    const durations = this.activities.map(a => a.duration).sort((a, b) => a - b)
    const uniqueDurations = [...new Set(durations)]
    return uniqueDurations.slice(0, 5)
  }
}

/**
 * Convenience function to create suggestions engine
 */
export function createSuggestionsEngine(activities: ActivityNode[]): SmartSuggestionsEngine {
  return new SmartSuggestionsEngine(activities)
}

/**
 * Quick suggestion helpers
 */
export const SuggestionHelpers = {
  /**
   * Get quick search suggestions based on activity history
   */
  getQuickSearchSuggestions(activities: ActivityNode[]) {
    const engine = new SmartSuggestionsEngine(activities)
    const insights = engine.generateInsights()
    
    const suggestions = [
      {
        label: 'Your 5-star activities',
        query: 'rating:5',
        type: 'quick_filter' as const,
        icon: '⭐'
      },
      {
        label: 'Most reused',
        query: 'sort:popular',
        type: 'quick_filter' as const,
        icon: '🔄'
      },
      {
        label: "This month's activities",
        query: 'timeframe:month',
        type: 'quick_filter' as const,
        icon: '📅'
      }
    ]

    // Add subject-specific suggestions
    insights.favoriteSubjects.slice(0, 2).forEach(subject => {
      suggestions.push({
        label: `Your ${subject} activities`,
        query: `subject:${subject}`,
        type: 'quick_filter',
        icon: '📚'
      })
    })

    return suggestions
  }
}