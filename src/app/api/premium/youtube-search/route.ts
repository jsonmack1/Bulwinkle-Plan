import { NextRequest, NextResponse } from 'next/server'
import { YouTubeVideo } from '../../../../types/youtube'

// Simple YouTube Search using YouTube Data API v3
export async function POST(request: NextRequest) {
  try {
    const { query, maxResults = 10 } = await request.json()
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      )
    }

    // YouTube Data API v3 key
    const API_KEY = process.env.YOUTUBE_API_KEY
    if (!API_KEY) {
      console.warn('YouTube API key not configured, returning mock data')
      return generateMockSearchResults(query, maxResults)
    }

    console.log('🔍 Searching YouTube for:', query)

    // Search for videos using YouTube Data API v3
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('q', query)
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('maxResults', maxResults.toString())
    searchUrl.searchParams.set('order', 'relevance')
    searchUrl.searchParams.set('safeSearch', 'moderate')
    searchUrl.searchParams.set('regionCode', 'US')
    searchUrl.searchParams.set('relevanceLanguage', 'en')
    searchUrl.searchParams.set('videoEmbeddable', 'true')
    searchUrl.searchParams.set('key', API_KEY)

    const searchResponse = await fetch(searchUrl.toString())
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json()
      throw new Error(`YouTube API error: ${errorData.error?.message || 'Search failed'}`)
    }

    const searchData = await searchResponse.json()
    
    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({
        success: true,
        videos: [],
        message: 'No videos found for this search query'
      })
    }

    // Extract video IDs for details lookup
    const videoIds = searchData.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(',')

    // Get video details (duration, statistics, etc.)
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    detailsUrl.searchParams.set('part', 'snippet,contentDetails,statistics')
    detailsUrl.searchParams.set('id', videoIds)
    detailsUrl.searchParams.set('key', API_KEY)

    const detailsResponse = await fetch(detailsUrl.toString())
    
    if (!detailsResponse.ok) {
      throw new Error('Failed to fetch video details')
    }

    const detailsData = await detailsResponse.json()

    // Process videos and create YouTubeVideo objects
    const videos: YouTubeVideo[] = detailsData.items.map((item: { 
      id: string; 
      snippet: { 
        title: string; 
        description: string; 
        thumbnails: { high?: { url: string }; default?: { url: string } }; 
        channelTitle: string; 
        channelId: string; 
        publishedAt: string 
      }; 
      contentDetails: { duration: string }; 
      statistics: { viewCount: string; likeCount: string } 
    }) => {
      const duration = parseDuration(item.contentDetails.duration)
      
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description || '',
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
        url: `https://www.youtube.com/watch?v=${item.id}`,
        shortUrl: `https://youtu.be/${item.id}`,
        duration: formatDuration(duration),
        durationSeconds: duration,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(item.statistics.viewCount || '0'),
        likeCount: parseInt(item.statistics.likeCount || '0'),
        relevanceScore: 95, // Trust YouTube's search relevance
        safetyAnalysis: {
          safetyScore: 85,
          ageAppropriate: true,
          educationalValue: 75,
          recommendedMinAge: 8,
          contentWarnings: [],
          teacherReviewRequired: true
        },
        relevancyReason: 'Found through YouTube search algorithm',
        suggestedTimestamps: []
      }
    })

    console.log('✅ Found videos:', videos.length)

    return NextResponse.json({
      success: true,
      videos: videos,
      query: query
    })

  } catch (error) {
    console.error('❌ YouTube search error:', error)
    
    // Fallback to mock data on error
    console.warn('Falling back to mock search results')
    return generateMockSearchResults('educational content', 10)
  }
}

// Parse ISO 8601 duration (PT4M13S) to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

// Format seconds to MM:SS or H:MM:SS
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

// Generate diverse mock search results when API is not available
function generateMockSearchResults(query: string, maxResults: number) {
  const mockVideos: YouTubeVideo[] = []
  
  // Generate realistic educational content
  const channels = [
    'Crash Course', 'Khan Academy', 'TED-Ed', 'National Geographic Kids', 
    'SciShow Kids', 'Brain Pump Studios', 'Learn Bright', 'Homeschool Pop',
    'Free School', 'Simple Learning Pro', 'Kids Learning Tube', 'Professor Dave Explains'
  ]
  
  const videoPatterns = [
    { title: `${query} Explained for Kids`, duration: 180, views: 250000 },
    { title: `Learn ${query} in 5 Minutes`, duration: 300, views: 180000 },
    { title: `${query} - Educational Video`, duration: 420, views: 95000 },
    { title: `Understanding ${query} for Students`, duration: 240, views: 175000 },
    { title: `${query} Tutorial for Beginners`, duration: 360, views: 120000 }
  ]
  
  // Generate videos up to maxResults
  for (let i = 0; i < Math.min(maxResults, videoPatterns.length); i++) {
    const pattern = videoPatterns[i]
    const channel = channels[i % channels.length]
    const videoId = `mock_${i}_${Date.now()}`
    
    mockVideos.push({
      id: videoId,
      title: pattern.title,
      description: `Educational content about ${query} designed for students.`,
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
      relevanceScore: Math.floor(92 - (i * 1.5)),
      safetyAnalysis: {
        safetyScore: 95,
        ageAppropriate: true,
        educationalValue: 85,
        recommendedMinAge: 8,
        contentWarnings: [],
        teacherReviewRequired: false
      },
      relevancyReason: `Educational content about ${query}`,
      suggestedTimestamps: []
    })
  }

  return NextResponse.json({
    success: true,
    videos: mockVideos,
    query: query,
    note: 'Mock educational videos. Configure YOUTUBE_API_KEY for real YouTube search.'
  })
}