import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { YouTubeVideo } from '../../../types/youtube'
import { useSubscription } from '../../../lib/subscription'

interface VideoPreviewModalProps {
  video: YouTubeVideo | null
  isOpen: boolean
  onClose: () => void
  onAddToLesson?: (video: YouTubeVideo) => void
  isAlreadySelected?: boolean
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  video,
  isOpen,
  onClose,
  onAddToLesson,
  isAlreadySelected = false
}) => {
  const { isPremium } = useSubscription()
  
  // Handle Escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  if (!isOpen || !video) return null
  
  // DEBUG: Log video data to trace duration issue
  console.log('🎬 VideoPreviewModal - Video Data:', {
    id: video.id,
    title: video.title,
    duration: video.duration,
    durationSeconds: video.durationSeconds,
    fullVideoObject: video
  })
  
  // Check if video can be added based on freemium restrictions
  const canAddVideo = isPremium || video.durationSeconds <= 120 // 2 minutes = 120 seconds
  const isLocked = !canAddVideo
  
  const handleAddToLesson = () => {
    if (canAddVideo && onAddToLesson && !isAlreadySelected) {
      onAddToLesson(video)
    }
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`
    }
    return `${count} views`
  }

  const getSafetyBadge = () => {
    const { safetyAnalysis } = video
    
    if (safetyAnalysis.safetyScore >= 90) {
      return { color: 'bg-green-100 text-green-800', label: 'Safe', icon: '✅' }
    } else if (safetyAnalysis.safetyScore >= 70) {
      return { color: 'bg-yellow-100 text-yellow-800', label: 'Review', icon: '⚠️' }
    } else {
      return { color: 'bg-orange-100 text-orange-800', label: 'Caution', icon: '🚫' }
    }
  }

  const safetyBadge = getSafetyBadge()

  // Generate YouTube embed URL from video ID
  const getEmbedUrl = (videoId: string): string => {
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&controls=1&fs=1&cc_load_policy=1&enablejsapi=1&origin=${window.location.origin}`
  }

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4"
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">{video.title}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="text-red-600">📺</span>
              <span>{video.channelTitle}</span>
              <span>•</span>
              <span>YouTube</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors hover:scale-105"
            title="Close preview (ESC)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {/* Video Player */}
          <div className="aspect-video mb-6 bg-black rounded-lg overflow-hidden relative">
            {isPremium ? (
              <iframe
                src={getEmbedUrl(video.id)}
                className="w-full h-full"
                allowFullScreen
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; ch-ua-form-factors"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <>
                {/* Blurred thumbnail background */}
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover filter blur-md"
                />
                
                {/* Enhanced Paywall overlay with value propositions */}
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
                  <div className="text-center text-white bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 max-w-md">
                    <div className="text-4xl mb-4">🎬</div>
                    <h3 className="text-xl font-bold mb-2">🚀 Unlock Video Access</h3>
                    <p className="mb-6 text-gray-100">Watch unlimited educational videos with Teacher Pro</p>
                    
                    {/* Video-focused Value Propositions */}
                    <div className="text-left mb-6 space-y-3">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Commercial-free video streaming</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Age-appropriate & safety verified</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Instant lesson plan integration</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>No more searching YouTube for hours</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        window.location.href = '/pricing'
                      }}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors w-full"
                    >
                      PRO as low as $7.99/mo*
                    </button>
                    <p className="text-xs text-white/80 mt-2">*With annual plan</p>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Video Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Video Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {video.duration || (video.durationSeconds ? formatDuration(video.durationSeconds) : 'Unknown')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Views:</span>
                    <span className="font-medium">{formatViewCount(video.viewCount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Published:</span>
                    <span className="font-medium">{new Date(video.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Relevance:</span>
                    <span className="font-medium">{video.relevanceScore}% match</span>
                  </div>
                </div>
              </div>

              {/* Safety Analysis */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Safety Analysis</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${safetyBadge.color}`}>
                      <span className="mr-1">{safetyBadge.icon}</span>
                      {safetyBadge.label}
                    </span>
                    <span className="text-sm text-gray-600">{video.safetyAnalysis.safetyScore}% safe</span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Educational Value:</span>
                      <span className="font-medium">{video.safetyAnalysis.educationalValue}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age Appropriate:</span>
                      <span className="font-medium">{video.safetyAnalysis.ageAppropriate ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recommended Age:</span>
                      <span className="font-medium">{video.safetyAnalysis.recommendedMinAge}+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Enhanced Details */}
            <div className="space-y-4">
              {/* Relevancy Explanation - Only show if different from Intelligence analysis */}
              {video.relevancyReason && !video.intelligentMetadata?.analysisReason && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Why This Video?</h4>
                  <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {video.relevancyReason}
                  </p>
                </div>
              )}

              {/* Suggested Timestamps */}
              {video.suggestedTimestamps && video.suggestedTimestamps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Key Learning Moments</h4>
                  <div className="space-y-2">
                    {video.suggestedTimestamps.map((timestamp, index) => (
                      <div key={index} className="text-sm bg-green-50 p-2 rounded border border-green-200">
                        <span className="font-mono text-green-800">📍 {timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Intelligence Search Analysis - Consolidated */}
              {video.intelligentMetadata && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🧠 Intelligent Analysis</h4>
                  <div className="space-y-3">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-sm text-gray-700 bg-blue-50 p-2 rounded border border-blue-200">
                        <span className="font-medium text-blue-800">Search Match:</span><br/>
                        <span className="text-blue-600">{video.intelligentMetadata.searchTerm}</span>
                      </div>
                      <div className="text-sm text-gray-700 bg-green-50 p-2 rounded border border-green-200">
                        <span className="font-medium text-green-800">Intelligent Confidence:</span><br/>
                        <span className="text-green-600">{video.intelligentMetadata.confidenceScore}%</span>
                      </div>
                    </div>
                    
                    {/* Analysis Reason */}
                    {video.intelligentMetadata.analysisReason && (
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <span className="font-medium">Why This Video:</span> {video.intelligentMetadata.analysisReason}
                      </div>
                    )}
                    
                    {/* Educational Tags */}
                    {video.intelligentMetadata.educationalIndicators.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-900 text-sm">Educational Indicators:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {video.intelligentMetadata.educationalIndicators.map((indicator, index) => (
                            <span 
                              key={index}
                              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200"
                              title={indicator}
                            >
                              {indicator}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Video Description */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                  {video.description}
                </p>
              </div>
            </div>
          </div>

          {/* Teacher Disclaimer */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start text-sm text-yellow-800">
              <span className="mr-2 mt-0.5">⚠️</span>
              <div>
                <div className="font-medium">Teacher Discretion Required</div>
                <div className="text-xs mt-1">
                  Always preview content before classroom use. Automated analysis provides guidance but teacher review ensures appropriateness for your specific classroom context.
                </div>
              </div>
            </div>
          </div>

          {/* Premium Restrictions Notice */}
          {isLocked && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start text-sm text-amber-800">
                <span className="mr-2 mt-0.5">🔒</span>
                <div>
                  <div className="font-medium">Premium Required</div>
                  <div className="text-xs mt-1">
                    This video is {Math.ceil(video.durationSeconds / 60)} minutes long. Free users can only add videos ≤2 minutes. 
                    Upgrade to Premium to add longer videos to your lessons.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="flex space-x-3">
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded transition-colors flex items-center space-x-2 shadow-sm"
              >
                <span>🎬</span>
                <span>Open in YouTube</span>
              </a>
              
              {onAddToLesson && (
                <button
                  onClick={handleAddToLesson}
                  disabled={isLocked || isAlreadySelected}
                  className={`px-4 py-2 text-sm rounded transition-colors flex items-center space-x-2 shadow-sm ${
                    isAlreadySelected
                      ? 'bg-green-100 text-green-800 cursor-default'
                      : isLocked
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                  title={
                    isAlreadySelected 
                      ? 'Already added to lesson'
                      : isLocked 
                        ? 'Premium required for videos over 2 minutes'
                        : 'Add to lesson plan'
                  }
                >
                  {isAlreadySelected ? (
                    <>
                      <span>✓</span>
                      <span>Added</span>
                    </>
                  ) : isLocked ? (
                    <>
                      <span>🔒</span>
                      <span>Locked</span>
                    </>
                  ) : (
                    <>
                      <span>+</span>
                      <span>Add to Lesson</span>
                    </>
                  )}
                </button>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm bg-gray-200 text-gray-800 hover:bg-gray-300 rounded transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default VideoPreviewModal