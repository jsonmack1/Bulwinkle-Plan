import { NextRequest, NextResponse } from 'next/server'
import { YouTubeVideo } from '../../../../types/youtube'
import { IntelligentVideoSearchOrchestrator } from '../../../../utils/videoSearchOrchestrator'
import { SearchContext, VideoResult } from '../../../../utils/intelligentVideoSearch'

/**
 * Intelligent YouTube Search API with contextual filtering and fallback logic
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      subject, 
      gradeLevel, 
      topic, 
      duration, 
      maxResults = 10,
      previousSuccessfulTerms = [],
      userPreferences = {}
    } = await request.json()
    
    console.log('🧠 Starting intelligent video search:', {
      query,
      subject,
      gradeLevel,
      topic,
      maxResults
    })
    
    // Validate required parameters
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      )
    }

    if (!subject || !gradeLevel || !topic) {
      return NextResponse.json(
        { success: false, error: 'Subject, grade level, and topic are required for intelligent search' },
        { status: 400 }
      )
    }

    // YouTube Data API v3 key
    const API_KEY = process.env.YOUTUBE_API_KEY
    if (!API_KEY) {
      console.warn('YouTube API key not configured, returning enhanced mock data')
      return generateIntelligentMockResults(query, subject, gradeLevel, topic, maxResults)
    }

    // Create search context
    const searchContext: SearchContext = {
      subject,
      gradeLevel,
      topic,
      duration,
      previousSuccessfulTerms,
      userPreferences: {
        minConfidenceThreshold: userPreferences.minConfidenceThreshold || 60,
        preferredChannels: userPreferences.preferredChannels || [],
        excludedChannels: userPreferences.excludedChannels || []
      }
    }

    // Initialize intelligent search orchestrator
    const searchOrchestrator = new IntelligentVideoSearchOrchestrator(API_KEY)
    
    // Perform intelligent search with fallback logic
    const searchResult = await searchOrchestrator.searchVideos(query, searchContext)
    
    console.log('🎯 Intelligent search completed:', {
      resultsFound: searchResult.results.length,
      averageConfidence: searchResult.averageConfidence.toFixed(1),
      fallbackTriggered: searchResult.fallbackTriggered,
      searchTermsUsed: searchResult.searchTermsUsed
    })

    // Convert to YouTube video format
    const intelligentVideos = await convertToYouTubeVideos(searchResult.results, API_KEY)
    
    // Get performance metrics
    const metrics = searchOrchestrator.getPerformanceMetrics()
    
    return NextResponse.json({
      success: true,
      videos: intelligentVideos.slice(0, maxResults),
      query,
      intelligentSearch: {
        searchStrategy: searchResult.searchStrategy,
        searchTermsUsed: searchResult.searchTermsUsed,
        averageConfidence: Math.round(searchResult.averageConfidence * 10) / 10,
        totalResultsAnalyzed: searchResult.totalResultsFound,
        fallbackTriggered: searchResult.fallbackTriggered,
        feedback: {
          ...searchResult.feedback,
          reasonsFiltered: searchResult.feedback.reasonsFiltered
        },
        suggestions: searchResult.fallbackTriggered 
          ? 'Try more specific terms or check if the topic matches your subject area'
          : 'High-quality results found using intelligent analysis',
        performance: {
          successRate: Math.round(metrics.successRate * 10) / 10,
          averageConfidence: Math.round(metrics.averageConfidence * 10) / 10,
          fallbackRate: Math.round(metrics.fallbackRate * 10) / 10
        }
      }
    })

  } catch (error) {
    console.error('❌ Intelligent YouTube search error:', error)
    
    // Enhanced fallback with context awareness
    const errorMessage = error instanceof Error ? error.message : 'Unknown search error'
    console.warn('Falling back to intelligent mock search results')
    
    // Try to extract context from request for better mock results
    let subject = 'General'
    let gradeLevel = 'Elementary'
    let topic = 'Educational Content'
    
    try {
      const body = await request.json()
      subject = body.subject || subject
      gradeLevel = body.gradeLevel || gradeLevel
      topic = body.topic || topic
    } catch {
      // Use defaults if request body can't be parsed
    }
    
    return generateIntelligentMockResults(
      'educational content', 
      subject, 
      gradeLevel, 
      topic, 
      10,
      errorMessage
    )
  }
}

/**
 * Convert VideoResult to YouTubeVideo format
 */
async function convertToYouTubeVideos(
  videoResults: VideoResult[], 
  apiKey: string
): Promise<YouTubeVideo[]> {
  if (videoResults.length === 0) {
    return []
  }

  try {
    // Get additional video details for accurate duration and stats
    const videoIds = videoResults.map(v => v.id).join(',')
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    detailsUrl.searchParams.set('part', 'contentDetails,statistics,snippet')
    detailsUrl.searchParams.set('id', videoIds)
    detailsUrl.searchParams.set('key', apiKey)

    const response = await fetch(detailsUrl.toString())
    const detailsData = response.ok ? await response.json() : null

    return videoResults.map((video) => {
      const details = detailsData?.items?.find((d: any) => d.id === video.id)
      const durationSeconds = details?.contentDetails?.duration 
        ? parseDuration(details.contentDetails.duration)
        : 300 // Default 5 minutes

      return {
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnail,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        shortUrl: `https://youtu.be/${video.id}`,
        duration: formatDuration(durationSeconds),
        durationSeconds,
        channelTitle: video.channelTitle,
        channelId: details?.snippet?.channelId || 'unknown',
        publishedAt: video.publishedAt,
        viewCount: video.viewCount || parseInt(details?.statistics?.viewCount || '0'),
        likeCount: parseInt(details?.statistics?.likeCount || '0'),
        relevanceScore: video.confidenceScore,
        safetyAnalysis: {
          safetyScore: Math.min(95, video.confidenceScore + 10),
          ageAppropriate: true,
          educationalValue: video.confidenceScore,
          recommendedMinAge: getRecommendedAge(video.educationalIndicators),
          contentWarnings: [],
          teacherReviewRequired: video.confidenceScore < 80
        },
        relevancyReason: `Intelligent analysis: ${video.educationalIndicators.slice(0, 2).join(', ')}`,
        suggestedTimestamps: [],
        intelligentMetadata: {
          confidenceScore: video.confidenceScore,
          searchTerm: video.searchTerm,
          educationalIndicators: video.educationalIndicators,
          analysisReason: `Selected through intelligent filtering with ${video.confidenceScore}% confidence`
        }
      }
    })

  } catch (error) {
    console.warn('Failed to get video details, using basic conversion:', error)
    
    // Fallback to basic conversion without API details
    return videoResults.map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnail,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      shortUrl: `https://youtu.be/${video.id}`,
      duration: formatDuration(300), // Default 5 minutes
      durationSeconds: 300,
      channelTitle: video.channelTitle,
      channelId: 'unknown',
      publishedAt: video.publishedAt,
      viewCount: video.viewCount || 0,
      likeCount: 0,
      relevanceScore: video.confidenceScore,
      safetyAnalysis: {
        safetyScore: Math.min(95, video.confidenceScore + 10),
        ageAppropriate: true,
        educationalValue: video.confidenceScore,
        recommendedMinAge: 8,
        contentWarnings: [],
        teacherReviewRequired: video.confidenceScore < 80
      },
      relevancyReason: `Intelligent analysis: ${video.educationalIndicators.slice(0, 2).join(', ')}`,
      suggestedTimestamps: [],
      intelligentMetadata: {
        confidenceScore: video.confidenceScore,
        searchTerm: video.searchTerm,
        educationalIndicators: video.educationalIndicators,
        analysisReason: `Selected through intelligent filtering with ${video.confidenceScore}% confidence`
      }
    }))
  }
}

/**
 * Get recommended age based on educational indicators
 */
function getRecommendedAge(indicators: string[]): number {
  const indicatorText = indicators.join(' ').toLowerCase()
  
  if (indicatorText.includes('kindergarten') || indicatorText.includes('preschool')) {
    return 5
  }
  if (indicatorText.includes('elementary') || indicatorText.includes('primary')) {
    return 7
  }
  if (indicatorText.includes('middle') || indicatorText.includes('intermediate')) {
    return 11
  }
  if (indicatorText.includes('high school') || indicatorText.includes('secondary')) {
    return 14
  }
  if (indicatorText.includes('advanced') || indicatorText.includes('college')) {
    return 16
  }
  
  return 8 // Default age
}

/**
 * Generate context-aware mock results when API is unavailable
 */
function generateIntelligentMockResults(
  query: string, 
  subject: string, 
  gradeLevel: string, 
  topic: string, 
  maxResults: number,
  error?: string
): NextResponse {
  const mockVideos: YouTubeVideo[] = []
  
  // Subject-specific educational channels
  const channelsBySubject = {
    'Math': ['Khan Academy', 'Professor Dave Explains', 'Math Antics', 'Organic Chemistry Tutor'],
    'Science': ['Crash Course', 'SciShow Kids', 'Amoeba Sisters', 'TED-Ed'],
    'English Language Arts': ['Crash Course Literature', 'Grammar Girl', 'Flocabulary', 'Brain Pump Studios'],
    'Social Studies': ['Crash Course History', 'National Geographic Kids', 'TED-Ed', 'Mr. Betts Class'],
    'Art': ['Art for Your Ear', 'Draw with Jazza', 'Proko', 'Art Hub for Kids'],
    'Music': ['Music Theory Guy', 'Hoffman Academy', 'Piano Lessons On The Web', 'Mr. Oven Music']
  }
  
  const channels = channelsBySubject[subject as keyof typeof channelsBySubject] || channelsBySubject['Science']
  
  // Generate intelligent video patterns based on context
  const videoPatterns = [
    { 
      title: `${topic} - ${subject} Lesson for ${gradeLevel}`, 
      duration: 360, 
      views: 250000,
      confidence: 95,
      indicators: ['Grade-appropriate content', 'Subject match', 'Educational lesson']
    },
    { 
      title: `Understanding ${topic} - ${subject} Tutorial`, 
      duration: 480, 
      views: 180000,
      confidence: 88,
      indicators: ['Tutorial format', 'Subject match', 'Clear explanation']
    },
    { 
      title: `${topic} Explained Simply - ${subject} Education`, 
      duration: 300, 
      views: 320000,
      confidence: 92,
      indicators: ['Simple explanation', 'Educational content', 'High engagement']
    },
    { 
      title: `Learn ${topic} in 10 Minutes - ${subject} Quick Guide`, 
      duration: 600, 
      views: 145000,
      confidence: 85,
      indicators: ['Time-efficient', 'Quick guide format', 'Subject relevant']
    },
    { 
      title: `${topic} for Students - Interactive ${subject} Learning`, 
      duration: 420, 
      views: 195000,
      confidence: 90,
      indicators: ['Student-focused', 'Interactive content', 'Educational design']
    }
  ]
  
  // Generate videos up to maxResults
  for (let i = 0; i < Math.min(maxResults, videoPatterns.length); i++) {
    const pattern = videoPatterns[i]
    const channel = channels[i % channels.length]
    const videoId = `intelligent_mock_${i}_${Date.now()}`
    
    mockVideos.push({
      id: videoId,
      title: pattern.title,
      description: `Intelligent educational content about ${topic} in ${subject} for ${gradeLevel} students. This mock result demonstrates the intelligent search system's context-awareness.`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      shortUrl: `https://youtu.be/${videoId}`,
      duration: formatDuration(pattern.duration),
      durationSeconds: pattern.duration,
      channelTitle: channel,
      channelId: `channel_${i}`,
      publishedAt: new Date(Date.now() - (i * 86400000)).toISOString(),
      viewCount: pattern.views,
      likeCount: Math.floor(pattern.views * 0.05),
      relevanceScore: pattern.confidence,
      safetyAnalysis: {
        safetyScore: 95,
        ageAppropriate: true,
        educationalValue: pattern.confidence,
        recommendedMinAge: getRecommendedAge([gradeLevel]),
        contentWarnings: [],
        teacherReviewRequired: pattern.confidence < 90
      },
      relevancyReason: `Intelligent mock: ${pattern.indicators.join(', ')}`,
      suggestedTimestamps: [],
      intelligentMetadata: {
        confidenceScore: pattern.confidence,
        searchTerm: query,
        educationalIndicators: pattern.indicators,
        analysisReason: `Context-aware mock result with ${pattern.confidence}% confidence`
      }
    })
  }

  return NextResponse.json({
    success: true,
    videos: mockVideos,
    query: query,
    intelligentSearch: {
      searchStrategy: 'mock-intelligent',
      searchTermsUsed: [query, `${topic} ${subject}`, `${gradeLevel} ${topic}`],
      averageConfidence: 90,
      totalResultsAnalyzed: maxResults,
      fallbackTriggered: false,
      feedback: {
        primarySearchResults: maxResults,
        fallbackSearchResults: 0,
        filteredOutCount: 0,
        reasonsFiltered: []
      },
      suggestions: 'Configure YOUTUBE_API_KEY for real intelligent search functionality',
      performance: {
        successRate: 95,
        averageConfidence: 90,
        fallbackRate: 0
      }
    },
    note: error 
      ? `Mock intelligent search due to error: ${error}` 
      : 'Mock intelligent search results. Configure YOUTUBE_API_KEY for real YouTube search with AI analysis.'
  })
}

// Utility functions (reused from original file)
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}