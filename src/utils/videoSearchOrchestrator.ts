/**
 * Video Search Orchestrator
 * Coordinates the intelligent video search process with fallback logic
 */

import {
  VideoResult,
  SearchContext,
  SearchResult,
  generateAlternateSearchTerms,
  analyzeVideoContent,
  combineAndRankResults,
  shouldTriggerFallback,
  learnFromSearch,
  getAdaptiveThresholds
} from './intelligentVideoSearch'

export interface YouTubeVideoSearchParams {
  query: string
  maxResults?: number
  order?: 'relevance' | 'date' | 'rating' | 'viewCount'
  duration?: 'short' | 'medium' | 'long'
  safeSearch?: 'moderate' | 'strict'
}

export interface VideoSearchOrchestrator {
  searchVideos(primaryTerm: string, context: SearchContext): Promise<SearchResult>
  searchWithFallback(primaryTerm: string, context: SearchContext): Promise<SearchResult>
  improveSearch(searchTerm: string, context: SearchContext, feedback?: any): Promise<string[]>
}

/**
 * Main Video Search Orchestrator Class
 */
export class IntelligentVideoSearchOrchestrator implements VideoSearchOrchestrator {
  private apiKey: string
  private baseUrl: string = 'https://www.googleapis.com/youtube/v3'
  
  // Cache for successful search patterns
  private searchPatternCache: Map<string, string[]> = new Map()
  
  // Performance metrics
  private searchMetrics: {
    totalSearches: number
    successfulSearches: number
    fallbackTriggered: number
    averageConfidenceScores: number[]
  } = {
    totalSearches: 0,
    successfulSearches: 0,
    fallbackTriggered: 0,
    averageConfidenceScores: []
  }

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Primary search method with intelligent analysis
   */
  async searchVideos(primaryTerm: string, context: SearchContext): Promise<SearchResult> {
    const startTime = Date.now()
    console.log(`🔍 Starting intelligent video search for: "${primaryTerm}"`)
    
    this.searchMetrics.totalSearches++
    
    try {
      // Get adaptive thresholds for this context
      const thresholds = getAdaptiveThresholds(context)
      console.log(`📊 Adaptive thresholds:`, thresholds)
      
      // Perform primary search
      const primaryResults = await this.performSingleSearch(primaryTerm, context)
      console.log(`📹 Primary search found ${primaryResults.length} videos`)
      
      // Analyze if fallback is needed
      const fallbackCheck = shouldTriggerFallback(
        primaryResults,
        thresholds.minResults,
        thresholds.minConfidence,
        thresholds.fallbackThreshold
      )
      
      let finalResults = primaryResults
      let fallbackTriggered = false
      let searchTermsUsed = [primaryTerm]
      let fallbackSearchResults = 0
      
      if (fallbackCheck.shouldFallback) {
        console.log(`🔄 Triggering fallback search: ${fallbackCheck.reason}`)
        fallbackTriggered = true
        this.searchMetrics.fallbackTriggered++
        
        // Generate and execute alternate searches
        const alternateTerms = this.generateSmartAlternateTerms(primaryTerm, context)
        console.log(`🎯 Alternate search terms:`, alternateTerms)
        
        const fallbackResults: Array<{ results: VideoResult[]; searchTerm: string }> = []
        
        // Perform alternate searches (limit to 3-4 to avoid rate limits)
        const limitedAlternates = alternateTerms.slice(0, 4)
        
        for (const alternateTerm of limitedAlternates) {
          try {
            const altResults = await this.performSingleSearch(alternateTerm, context)
            if (altResults.length > 0) {
              fallbackResults.push({ results: altResults, searchTerm: alternateTerm })
              searchTermsUsed.push(alternateTerm)
              fallbackSearchResults += altResults.length
            }
          } catch (error) {
            console.warn(`⚠️ Alternate search failed for "${alternateTerm}":`, error)
          }
        }
        
        // Combine primary and fallback results
        const allSearchResults = [
          { results: primaryResults, searchTerm: primaryTerm },
          ...fallbackResults
        ]
        
        finalResults = combineAndRankResults(allSearchResults, 15)
        console.log(`🎯 Combined results: ${finalResults.length} videos`)
      }
      
      // Calculate metrics
      const averageConfidence = finalResults.length > 0 
        ? finalResults.reduce((sum, r) => sum + r.confidenceScore, 0) / finalResults.length 
        : 0
      
      this.searchMetrics.averageConfidenceScores.push(averageConfidence)
      
      if (averageConfidence >= thresholds.minConfidence) {
        this.searchMetrics.successfulSearches++
      }
      
      // Learn from this search
      const learningResults = learnFromSearch(primaryTerm, finalResults, context)
      if (learningResults.successfulTerms.length > 0) {
        this.cacheSuccessfulPatterns(context, learningResults.successfulTerms)
      }
      
      // Count filtered results
      const totalFound = finalResults.length + (fallbackTriggered ? fallbackSearchResults : 0)
      const filteredCount = Math.max(0, totalFound - finalResults.length)
      
      const searchResult: SearchResult = {
        results: finalResults,
        searchTermsUsed,
        averageConfidence,
        totalResultsFound: totalFound,
        fallbackTriggered,
        searchStrategy: fallbackTriggered ? 'fallback-enhanced' : 'primary-only',
        feedback: {
          primarySearchResults: primaryResults.length,
          fallbackSearchResults,
          filteredOutCount: filteredCount,
          reasonsFiltered: this.extractFilterReasons(finalResults)
        }
      }
      
      const endTime = Date.now()
      console.log(`✅ Search completed in ${endTime - startTime}ms:`, {
        totalResults: finalResults.length,
        averageConfidence: averageConfidence.toFixed(1),
        fallbackTriggered,
        searchTermsUsed
      })
      
      return searchResult
      
    } catch (error) {
      console.error('❌ Video search failed:', error)
      throw new Error(`Intelligent video search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Search with automatic fallback (alias for main search method)
   */
  async searchWithFallback(primaryTerm: string, context: SearchContext): Promise<SearchResult> {
    return this.searchVideos(primaryTerm, context)
  }

  /**
   * Improve search based on feedback
   */
  async improveSearch(searchTerm: string, context: SearchContext, feedback?: any): Promise<string[]> {
    // Use cached successful patterns
    const cacheKey = this.getCacheKey(context)
    const cachedPatterns = this.searchPatternCache.get(cacheKey) || []
    
    // Generate new improved terms
    const improvedTerms = generateAlternateSearchTerms(searchTerm, context)
    
    // Combine with cached successful patterns
    const allTerms = [...new Set([...cachedPatterns, ...improvedTerms])]
    
    console.log(`🎯 Improved search suggestions for "${searchTerm}":`, allTerms)
    return allTerms
  }

  /**
   * Perform a single YouTube search with analysis
   */
  private async performSingleSearch(searchTerm: string, context: SearchContext): Promise<VideoResult[]> {
    const searchParams: YouTubeVideoSearchParams = {
      query: searchTerm,
      maxResults: 15,
      order: 'relevance',
      duration: 'medium', // 4-20 minutes is ideal for classroom
      safeSearch: 'strict'
    }
    
    // Execute YouTube API search
    const rawResults = await this.executeYouTubeSearch(searchParams)
    
    // Analyze and score each result
    const analyzedResults: VideoResult[] = []
    
    for (const video of rawResults) {
      const analysis = analyzeVideoContent(video, context, searchTerm)
      
      // Only include videos that pass basic filtering
      if (analysis.confidenceScore > 0 && analysis.reasonsFiltered.length === 0) {
        const videoResult: VideoResult = {
          id: video.id.videoId || video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          duration: video.contentDetails?.duration || 'Unknown',
          viewCount: video.statistics?.viewCount ? parseInt(video.statistics.viewCount) : undefined,
          confidenceScore: analysis.confidenceScore,
          searchTerm,
          educationalIndicators: analysis.educationalIndicators
        }
        
        analyzedResults.push(videoResult)
      }
    }
    
    // Sort by confidence score
    return analyzedResults.sort((a, b) => b.confidenceScore - a.confidenceScore)
  }

  /**
   * Execute YouTube API search
   */
  private async executeYouTubeSearch(params: YouTubeVideoSearchParams): Promise<any[]> {
    const searchUrl = new URL(`${this.baseUrl}/search`)
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('key', this.apiKey)
    searchUrl.searchParams.set('q', params.query)
    searchUrl.searchParams.set('maxResults', (params.maxResults || 15).toString())
    searchUrl.searchParams.set('order', params.order || 'relevance')
    searchUrl.searchParams.set('safeSearch', params.safeSearch || 'strict')
    searchUrl.searchParams.set('videoEmbeddable', 'true')
    searchUrl.searchParams.set('videoSyndicated', 'true')
    
    if (params.duration) {
      searchUrl.searchParams.set('videoDuration', params.duration)
    }
    
    const response = await fetch(searchUrl.toString())
    
    if (!response.ok) {
      throw new Error(`YouTube API search failed: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.items || data.items.length === 0) {
      return []
    }
    
    // Get additional details for the videos
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',')
    const detailsUrl = new URL(`${this.baseUrl}/videos`)
    detailsUrl.searchParams.set('part', 'contentDetails,statistics')
    detailsUrl.searchParams.set('key', this.apiKey)
    detailsUrl.searchParams.set('id', videoIds)
    
    const detailsResponse = await fetch(detailsUrl.toString())
    const detailsData = detailsResponse.ok ? await detailsResponse.json() : null
    
    // Merge search results with details
    return data.items.map((item: any) => {
      const details = detailsData?.items?.find((d: any) => d.id === item.id.videoId)
      return {
        ...item,
        contentDetails: details?.contentDetails,
        statistics: details?.statistics
      }
    })
  }

  /**
   * Generate smart alternate terms using context and cache
   */
  private generateSmartAlternateTerms(primaryTerm: string, context: SearchContext): string[] {
    // Get cached successful patterns first
    const cacheKey = this.getCacheKey(context)
    const cachedPatterns = this.searchPatternCache.get(cacheKey) || []
    
    // Generate standard alternates
    const standardAlternates = generateAlternateSearchTerms(primaryTerm, context)
    
    // Prioritize cached successful patterns
    const prioritizedTerms = [...cachedPatterns, ...standardAlternates]
    
    // Remove duplicates and limit to reasonable number
    return [...new Set(prioritizedTerms)].slice(0, 6)
  }

  /**
   * Cache successful search patterns
   */
  private cacheSuccessfulPatterns(context: SearchContext, successfulTerms: string[]): void {
    const cacheKey = this.getCacheKey(context)
    const existing = this.searchPatternCache.get(cacheKey) || []
    const updated = [...new Set([...existing, ...successfulTerms])].slice(0, 10) // Limit cache size
    
    this.searchPatternCache.set(cacheKey, updated)
    console.log(`💾 Cached ${updated.length} successful patterns for ${cacheKey}`)
  }

  /**
   * Generate cache key for context
   */
  private getCacheKey(context: SearchContext): string {
    return `${context.subject}:${context.gradeLevel}`.toLowerCase()
  }

  /**
   * Extract filter reasons from results
   */
  private extractFilterReasons(results: VideoResult[]): string[] {
    const reasons = new Set<string>()
    for (const result of results) {
      if (result.reasonsFiltered) {
        result.reasonsFiltered.forEach(reason => reasons.add(reason))
      }
    }
    return Array.from(reasons)
  }

  /**
   * Get search performance metrics
   */
  getPerformanceMetrics() {
    const avgConfidence = this.searchMetrics.averageConfidenceScores.length > 0
      ? this.searchMetrics.averageConfidenceScores.reduce((a, b) => a + b, 0) / this.searchMetrics.averageConfidenceScores.length
      : 0
    
    return {
      ...this.searchMetrics,
      successRate: this.searchMetrics.totalSearches > 0 
        ? (this.searchMetrics.successfulSearches / this.searchMetrics.totalSearches * 100)
        : 0,
      fallbackRate: this.searchMetrics.totalSearches > 0
        ? (this.searchMetrics.fallbackTriggered / this.searchMetrics.totalSearches * 100)
        : 0,
      averageConfidence: avgConfidence,
      cacheSize: this.searchPatternCache.size
    }
  }

  /**
   * Clear cache and reset metrics (for testing)
   */
  reset(): void {
    this.searchPatternCache.clear()
    this.searchMetrics = {
      totalSearches: 0,
      successfulSearches: 0,
      fallbackTriggered: 0,
      averageConfidenceScores: []
    }
  }
}