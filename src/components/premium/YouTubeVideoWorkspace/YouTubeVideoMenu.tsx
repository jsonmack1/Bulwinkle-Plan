import React, { useState, useEffect, useCallback } from 'react'
import VideoCard from './VideoCard'
import IntelligentSearchFeedback from './IntelligentSearchFeedback'
import { YouTubeVideo, IntelligentSearchResponse } from '../../../types/youtube'
import { useSubscription } from '../../../lib/subscription-mock'

interface YouTubeVideoMenuProps {
  topic: string
  gradeLevel: string
  subject: string
  duration: number
  isCollapsed: boolean
  onToggleCollapse: () => void
  onVideosSelected: (videos: YouTubeVideo[]) => void
  selectedVideoIds: Set<string>
}

const YouTubeVideoMenu: React.FC<YouTubeVideoMenuProps> = ({
  topic,
  gradeLevel,
  subject,
  duration,
  isCollapsed,
  onToggleCollapse,
  onVideosSelected,
  selectedVideoIds
}) => {
  const { isPremium } = useSubscription()
  
  // State management
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [selectedVideos, setSelectedVideos] = useState<YouTubeVideo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [enableMultipleSelection, setEnableMultipleSelection] = useState(false)
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set())
  const [intelligentSearchData, setIntelligentSearchData] = useState<IntelligentSearchResponse | null>(null)
  
  // Generate smart search query from lesson context  
  const generateSearchQuery = useCallback(() => {
    return topic || 'educational content'
  }, [topic])
  
  // Update search query when lesson context changes
  useEffect(() => {
    const newQuery = generateSearchQuery()
    setSearchQuery(newQuery)
  }, [generateSearchQuery])

  // Generate suggested search variations
  const getSuggestedSearches = useCallback(() => {
    if (!topic) return []
    
    return [
      `${topic} explained`,
      `${topic} for kids`,
      `${topic} tutorial`,
      `${subject} ${topic}`,
      `learn ${topic}`
    ]
  }, [topic, subject])

  // Intelligent YouTube search with contextual filtering and fallback logic
  const searchYouTube = useCallback(async (query: string) => {
    if (!query.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🧠 Starting intelligent YouTube search for:', query)
      console.log('📚 Context:', { subject, gradeLevel, topic, duration })
      
      // Call the intelligent search API
      const response = await fetch('/api/premium/youtube-search-intelligent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          subject,
          gradeLevel,
          topic,
          duration,
          maxResults: 12,
          userPreferences: {
            minConfidenceThreshold: isPremium ? 60 : 70, // Premium users get more results
            preferredChannels: [],
            excludedChannels: []
          }
        }),
      })

      const data = await response.json()

      if (data.success) {
        setVideos(data.videos || [])
        setHasSearched(true)
        
        const intelligentData = data.intelligentSearch
        setIntelligentSearchData(intelligentData || null)
        
        console.log('✅ Intelligent YouTube search completed:', {
          videosFound: data.videos?.length || 0,
          searchStrategy: intelligentData?.searchStrategy,
          averageConfidence: intelligentData?.averageConfidence,
          fallbackTriggered: intelligentData?.fallbackTriggered,
          searchTermsUsed: intelligentData?.searchTermsUsed
        })
        
        // Show intelligent search feedback to users
        if (intelligentData) {
          if (intelligentData.fallbackTriggered) {
            console.log('🔄 Fallback search was triggered:', intelligentData.searchTermsUsed.join(', '))
          }
          
          if (intelligentData.feedback.filteredOutCount > 0) {
            console.log('🛡️ Filtered out', intelligentData.feedback.filteredOutCount, 'inappropriate videos')
          }
          
          // Show suggestions if confidence is low
          if (intelligentData.averageConfidence < 70) {
            console.warn('⚠️ Low confidence results:', intelligentData.suggestions)
          }
        }
        
        // DEBUG: Log intelligent video data
        if (data.videos && data.videos.length > 0) {
          console.log('🎯 First intelligent video sample:', {
            id: data.videos[0].id,
            title: data.videos[0].title,
            duration: data.videos[0].duration,
            confidenceScore: data.videos[0].intelligentMetadata?.confidenceScore,
            educationalIndicators: data.videos[0].intelligentMetadata?.educationalIndicators,
            relevanceScore: data.videos[0].relevanceScore
          })
        }
      } else {
        setError(data.error || 'Intelligent search failed')
        setVideos([])
      }
    } catch (error) {
      console.error('❌ Intelligent YouTube search error:', error)
      setError('Failed to search videos with intelligent analysis. Please try again.')
      setVideos([])
    } finally {
      setIsLoading(false)
    }
  }, [subject, gradeLevel, topic, duration, isPremium])

  // Handle search form submission  
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      searchYouTube(searchQuery.trim())
    }
  }, [searchQuery, searchYouTube])

  // Handle suggested search click
  const handleSuggestedSearch = useCallback((suggestion: string) => {
    setSearchQuery(suggestion)
    searchYouTube(suggestion)
  }, [searchYouTube])

  // Handle single video selection (legacy support)
  const handleVideoSelect = useCallback((videoId: string) => {
    if (enableMultipleSelection) {
      handleCheckboxSelect(videoId, !selectedVideoIds.has(videoId))
    } else {
      const video = videos.find(v => v.id === videoId)
      if (!video) return
      
      let newSelectedVideos: YouTubeVideo[]
      
      if (selectedVideoIds.has(videoId)) {
        // Remove video
        newSelectedVideos = selectedVideos.filter(v => v.id !== videoId)
      } else {
        // Add video - check freemium restrictions
        const maxVideos = isPremium ? 50 : 3
        if (selectedVideos.length >= maxVideos) {
          setError(`${isPremium ? 'Maximum' : 'Free tier'} limit: ${maxVideos} videos max`)
          return
        }
        
        // Check duration limit for free users (2 minutes = 120 seconds)
        if (!isPremium && video.durationSeconds > 120) {
          setError(`Free tier: videos must be 2 minutes or less. This video is ${Math.ceil(video.durationSeconds / 60)} minutes. Upgrade to Premium for longer videos.`)
          return
        }
        
        newSelectedVideos = [...selectedVideos, video]
      }
      
      setSelectedVideos(newSelectedVideos)
      onVideosSelected(newSelectedVideos)
      setError(null)
    }
  }, [videos, selectedVideoIds, selectedVideos, isPremium, onVideosSelected, enableMultipleSelection])

  // Handle checkbox-based selection for multiple videos
  const handleCheckboxSelect = useCallback((videoId: string, checked: boolean) => {
    const video = videos.find(v => v.id === videoId)
    if (!video) return

    // Check restrictions for new selections
    if (checked) {
      // Check duration limit for free users (2 minutes = 120 seconds)
      if (!isPremium && video.durationSeconds > 120) {
        setError(`Free tier: videos must be 2 minutes or less. This video is ${Math.ceil(video.durationSeconds / 60)} minutes. Upgrade to Premium for longer videos.`)
        return
      }

      // Check max video count
      const maxVideos = isPremium ? 50 : 3
      const currentCount = selectedVideos.length + tempSelectedIds.size
      if (currentCount >= maxVideos) {
        setError(`${isPremium ? 'Maximum' : 'Free tier'} limit: ${maxVideos} videos max`)
        return
      }
    }

    // Update temporary selection
    setTempSelectedIds(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(videoId)
      } else {
        newSet.delete(videoId)
      }
      return newSet
    })
    setError(null)
  }, [videos, selectedVideos.length, isPremium, tempSelectedIds.size])

  // Add selected videos to lesson
  const handleAddSelectedVideos = useCallback(() => {
    const videosToAdd = videos.filter(v => tempSelectedIds.has(v.id))
    const newSelectedVideos = [...selectedVideos, ...videosToAdd]
    
    setSelectedVideos(newSelectedVideos)
    onVideosSelected(newSelectedVideos)
    setTempSelectedIds(new Set()) // Clear temporary selections
    setError(null)
  }, [videos, tempSelectedIds, selectedVideos, onVideosSelected])

  // Handle video removal
  const handleVideoRemove = useCallback((videoId: string) => {
    const newSelectedVideos = selectedVideos.filter(v => v.id !== videoId)
    setSelectedVideos(newSelectedVideos)
    onVideosSelected(newSelectedVideos)
  }, [selectedVideos, onVideosSelected])

  // Auto-search on component mount
  useEffect(() => {
    if (searchQuery && !hasSearched) {
      searchYouTube(searchQuery)
    }
  }, [searchQuery, hasSearched, searchYouTube])

  if (isCollapsed) {
    return (
      <div className="bg-white/80 backdrop-blur-xl flex flex-col items-center py-6 shadow-sm h-full overflow-hidden">
        <button
          onClick={onToggleCollapse}
          className="p-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-xl transition-all duration-200 mb-6 hover:scale-105"
          title="Expand video library"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-indigo-600 text-xl">🎬</span>
          </div>
          
          {selectedVideos.length > 0 && (
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-sm font-semibold">{selectedVideos.length}</span>
            </div>
          )}
          
          <div className="text-xs text-slate-500 transform -rotate-90 whitespace-nowrap origin-center mt-8 font-medium">
            Videos
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/95 backdrop-blur-xl flex flex-col h-full shadow-sm overflow-hidden">
      {/* Premium Header */}
      <div className="p-6 border-b border-slate-200/60 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mr-4 shadow-sm">
              <span className="text-indigo-600 text-2xl">🎬</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Video Library</h3>
              <p className="text-sm text-slate-600">Discover educational content</p>
            </div>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-xl transition-all duration-200 hover:scale-105"
            title="Minimize video panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Elegant Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-amber-50/80 border border-amber-200/60 rounded-2xl backdrop-blur-sm">
            <div className="flex items-start text-amber-800 text-sm">
              <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-xs">⚠️</span>
              </div>
              <span className="leading-relaxed">{error}</span>
            </div>
          </div>
        )}

        {/* Premium Search Interface */}
        <div className="p-6 border-b border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30">
          <div className="mb-5">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-3">
                <span className="text-blue-600 text-lg">🔍</span>
              </div>
              <h4 className="font-semibold text-gray-900">Search Videos</h4>
            </div>
            <p className="text-sm text-slate-600 ml-11">Discover educational content from YouTube&apos;s catalog</p>
          </div>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search for "${topic}" videos...`}
                className="w-full px-4 py-3.5 bg-white/80 border border-slate-200/60 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 shadow-sm backdrop-blur-sm transition-all duration-200 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="absolute right-2 top-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-lg transition-all duration-200 flex items-center space-x-2 hover:scale-105 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Searching</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Refined Search Suggestions */}
          <div className="mt-4">
            <div className="text-xs font-medium text-slate-700 mb-3">Suggested searches</div>
            <div className="flex flex-wrap gap-2">
              {getSuggestedSearches().map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedSearch(suggestion)}
                  className="px-3 py-2 text-xs bg-white/60 hover:bg-indigo-50/80 border border-slate-200/60 hover:border-indigo-200 rounded-xl transition-all duration-200 text-slate-700 hover:text-indigo-700 font-medium backdrop-blur-sm hover:shadow-sm"
                  title={`Search for "${suggestion}"`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Elegant Loading State */}
        {isLoading && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <div className="font-semibold text-gray-900 mb-2">Searching YouTube</div>
            <div className="text-sm text-slate-600">Discovering educational videos for your lesson</div>
          </div>
        )}

        {/* Premium Search Results */}
        {videos.length > 0 && (
          <div className="p-6 space-y-4">
            {/* Intelligent Search Feedback */}
            {intelligentSearchData && (
              <IntelligentSearchFeedback 
                searchData={intelligentSearchData}
                query={searchQuery}
              />
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-sm">📺</span>
                  </div>
                  Search Results
                  {intelligentSearchData && (
                    <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      🧠 AI Enhanced
                    </span>
                  )}
                </h4>
                <div className="text-sm text-slate-600 mt-1 ml-9">
                  {videos.length} video{videos.length !== 1 ? 's' : ''} found
                  {intelligentSearchData && (
                    <span className="ml-2 text-gray-500">
                      • {intelligentSearchData.totalResultsAnalyzed} analyzed
                    </span>
                  )}
                  {enableMultipleSelection && tempSelectedIds.size > 0 && (
                    <span className="ml-2 text-indigo-600 font-medium">
                      • {tempSelectedIds.size} selected
                    </span>
                  )}
                </div>
              </div>
              
              {/* Multiple Selection Controls */}
              {enableMultipleSelection && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEnableMultipleSelection(false)}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    title="Switch to single selection"
                  >
                    Single
                  </button>
                  {tempSelectedIds.size > 0 && (
                    <button
                      onClick={handleAddSelectedVideos}
                      className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Add {tempSelectedIds.size} Video{tempSelectedIds.size !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
              
              {!enableMultipleSelection && (
                <button
                  onClick={() => setEnableMultipleSelection(true)}
                  className="px-3 py-1.5 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors"
                  title="Switch to multiple selection"
                >
                  Multiple
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {videos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isSelected={enableMultipleSelection ? tempSelectedIds.has(video.id) : selectedVideoIds.has(video.id)}
                  onSelect={handleVideoSelect}
                  onRemove={handleVideoRemove}
                  showAddButton={!enableMultipleSelection}
                  showRemoveButton={false}
                  compact={true}
                  enableMultipleSelection={enableMultipleSelection}
                  onCheckboxSelect={handleCheckboxSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* Premium Selected Videos Section */}
        {selectedVideos.length > 0 && (
          <div className="border-t border-slate-200/60 p-6 bg-gradient-to-br from-emerald-50/30 to-green-50/30">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl flex items-center justify-center mr-3">
                <span className="text-emerald-600 text-lg">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Added to Lesson</h4>
                <div className="text-sm text-slate-600">
                  {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {selectedVideos.map(video => (
                <VideoCard
                  key={`selected-${video.id}`}
                  video={video}
                  isSelected={true}
                  onSelect={handleVideoSelect}
                  onRemove={handleVideoRemove}
                  showAddButton={false}
                  showRemoveButton={true}
                  compact={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Elegant No Results State */}
        {hasSearched && videos.length === 0 && !isLoading && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-slate-500 text-2xl">📹</span>
            </div>
            <div className="font-semibold text-gray-900 mb-2">No videos found</div>
            <div className="text-sm text-slate-600 max-w-sm mx-auto">Try different search terms or check your spelling</div>
          </div>
        )}

        {/* Welcoming Initial State */}
        {!hasSearched && !isLoading && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <span className="text-indigo-600 text-3xl">🎬</span>
            </div>
            <div className="font-semibold text-gray-900 mb-2">Discover Educational Videos</div>
            <div className="text-sm text-slate-600 max-w-sm mx-auto">Search YouTube&apos;s vast library to find the perfect videos for your lesson</div>
          </div>
        )}

        {/* Refined Upgrade Prompt */}
        {!isPremium && (
          <div className="border-t border-slate-200/60 p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-2xl">✨</span>
              </div>
              <div className="font-semibold text-gray-900 mb-2">Upgrade to Premium</div>
              <div className="text-sm text-slate-600 mb-4 leading-relaxed">
                Unlock unlimited video length, more videos per lesson, and advanced search features
              </div>
              <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default YouTubeVideoMenu