import React, { useState } from 'react'
import { YouTubeVideo } from '../../../types/youtube'
import { useSubscription } from '../../../lib/subscription-mock'
import VideoPreviewModal from './VideoPreviewModal'

interface VideoCardProps {
  video: YouTubeVideo
  isSelected: boolean
  onSelect: (videoId: string) => void
  onRemove: (videoId: string) => void
  showAddButton?: boolean
  showRemoveButton?: boolean
  compact?: boolean
  onPreview?: (video: YouTubeVideo) => void
  enableMultipleSelection?: boolean
  onCheckboxSelect?: (videoId: string, checked: boolean) => void
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isSelected,
  onSelect,
  onRemove,
  showAddButton = true,
  showRemoveButton = false,
  compact = false,
  onPreview,
  enableMultipleSelection = false,
  onCheckboxSelect
}) => {
  const { isPremium } = useSubscription()
  const [thumbnailError, setThumbnailError] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  
  // All videos require premium subscription
  const canAddVideo = isPremium
  const isLocked = !canAddVideo
  
  // All videos show locked titles for non-premium users
  const shouldBlurTitle = !isPremium
  
  // Generate subtly blurred title for freemium users
  const getDisplayTitle = (originalTitle: string): string => {
    if (!shouldBlurTitle) return originalTitle
    
    // Create a subtle blur effect that maintains readability but creates curiosity
    const words = originalTitle.split(' ')
    const blurredWords = words.map((word, index) => {
      if (word.length <= 3) return word // Keep short words like "and", "the", "for"
      if (index === 0) return word // Keep first word visible
      if (index < 2) return word // Keep first couple words visible
      
      // Partially blur longer words to create curiosity
      const visiblePart = word.substring(0, Math.ceil(word.length * 0.4))
      const blurredPart = '•'.repeat(Math.max(1, word.length - visiblePart.length))
      return visiblePart + blurredPart
    })
    
    return blurredWords.join(' ')
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

  const getEducationalBadge = () => {
    if (video.safetyAnalysis.educationalValue >= 80) {
      return { color: 'bg-blue-100 text-blue-800', label: 'Educational', icon: '🎓' }
    } else if (video.safetyAnalysis.educationalValue >= 60) {
      return { color: 'bg-purple-100 text-purple-800', label: 'Informative', icon: '📚' }
    }
    return null
  }

  const safetyBadge = getSafetyBadge()
  const educationalBadge = getEducationalBadge()

  if (compact) {
    return (
      <>
        <div className={`flex gap-2 p-1.5 border rounded-lg transition-all duration-200 mb-1.5 ${
          isSelected 
            ? 'bg-blue-50 border-blue-200 shadow-sm' 
            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm hover:bg-gray-50'
        }`}>
          
          {/* Content Column */}
          <div className="flex flex-col gap-1.5">
            {/* Thumbnail and Buttons Container */}
            <div className="flex gap-2">
              {/* Thumbnail Container */}
              <div className="relative w-full max-w-[200px]">
              {!thumbnailError ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full aspect-video object-cover rounded-md cursor-pointer"
                  onError={() => setThumbnailError(true)}
                  onClick={() => setShowPreview(true)}
                />
              ) : (
                <div className="w-full aspect-video bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-gray-400 text-lg">📹</span>
                </div>
              )}
              
              {/* No overlay buttons on thumbnail */}
              
              {/* Duration Overlay */}
              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                {formatDuration(video.durationSeconds)}
              </div>
              
              {isLocked && (
                <div className="absolute top-1 left-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded flex items-center">
                  <span>🔒</span>
                </div>
              )}
            </div>

              
              {/* Buttons Container - Right of Thumbnail */}
              <div className="flex flex-col gap-2">
                {/* Toggle Add/Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isSelected) {
                      onRemove(video.id)
                    } else {
                      onSelect(video.id)
                    }
                  }}
                  disabled={!canAddVideo}
                  className={`p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
                    !canAddVideo 
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : isSelected 
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                  title={
                    !canAddVideo 
                      ? 'Premium required for videos over 2 minutes'
                      : isSelected 
                        ? 'Remove video from lesson plan' 
                        : 'Add video to lesson plan'
                  }
                >
                  {!canAddVideo ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0h2m-2 0H10m4-4.5V9a2 2 0 10-4 0v2.5M8 12h8" />
                    </svg>
                  ) : isSelected ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                </button>
                
                {/* Preview Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPreview(true)
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                  title="Preview video"
                >
                  Preview
                </button>
              </div>
            </div>

            {/* Text Content */}
            <div className="flex flex-col gap-1">
              <h4 className={`text-sm font-semibold line-height-1.3 ${shouldBlurTitle ? 'text-gray-500' : 'text-gray-900'}`}>
                {getDisplayTitle(video.title)}
              </h4>
              
              {shouldBlurTitle && (
                <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded cursor-pointer hover:bg-purple-100 transition-colors">
                  ✨ Unlock full title
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>{video.channelTitle}</span>
                <span>•</span>
                <span className="text-blue-600 font-medium">{video.relevanceScore}% match</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* In-App Preview Modal */}
        <VideoPreviewModal
          video={video}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onAddToLesson={canAddVideo ? () => onSelect(video.id) : undefined}
          isAlreadySelected={isSelected}
        />
      </>
    )
  }

  return (
    <>
      <div className={`rounded-xl border p-3 transition-all duration-300 backdrop-blur-sm ${
        isSelected 
          ? 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-indigo-300 shadow-xl shadow-indigo-200/40' 
          : 'bg-white/95 border-gray-200 hover:border-gray-300 hover:shadow-2xl hover:shadow-gray-200/30 hover:-translate-y-1'
      }`}>
        {/* Removed checkbox - streamlined interface */}
        
        {/* Larger Thumbnail with overlay */}
        <div className="relative mb-3">
          {!thumbnailError ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-40 object-cover rounded cursor-pointer"
              onError={() => setThumbnailError(true)}
              onClick={() => setShowPreview(true)}
            />
          ) : (
            <div className="w-full h-40 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-400 text-2xl">📹</span>
            </div>
          )}
          
          {/* Toggle Add/Remove Button - Next to Thumbnail */}
          <div className="absolute top-3 right-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (isSelected) {
                  onRemove(video.id)
                } else {
                  onSelect(video.id)
                }
              }}
              disabled={!canAddVideo}
              className={`p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
                !canAddVideo 
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : isSelected 
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              title={
                !canAddVideo 
                  ? 'Premium required for video access'
                  : isSelected 
                    ? 'Remove video from lesson plan' 
                    : 'Add video to lesson plan'
              }
            >
              {!canAddVideo ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0h2m-2 0H10m4-4.5V9a2 2 0 10-4 0v2.5M8 12h8" />
                </svg>
              ) : isSelected ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Duration overlay */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-sm px-2 py-1 rounded">
            {formatDuration(video.durationSeconds)}
          </div>

          {/* Premium lock indicator */}
          {isLocked && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-sm px-2 py-1 rounded flex items-center space-x-1">
              <span>🔒</span>
              <span className="font-medium">Premium</span>
            </div>
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowPreview(true)}
              className="bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Video info */}
        <div className="space-y-2">
          <h3 className={`font-medium line-clamp-2 leading-tight ${shouldBlurTitle ? 'text-gray-500' : 'text-gray-900'}`}>
            {getDisplayTitle(video.title)}
          </h3>
          {shouldBlurTitle && (
            <div className="text-xs text-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-2 rounded-lg border border-purple-200 cursor-pointer hover:from-purple-100 hover:to-indigo-100 transition-all">
              <div className="flex items-center space-x-2">
                <span>✨</span>
                <span>Unlock Premium to reveal full titles and add longer videos</span>
              </div>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium">{video.channelTitle}</span>
              <span className="text-gray-400">•</span>
              <span>{formatViewCount(video.viewCount)}</span>
            </div>
          </div>

          {/* Safety and educational badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${safetyBadge.color}`}>
              <span className="mr-1">{safetyBadge.icon}</span>
              {safetyBadge.label}
            </span>
            
            {educationalBadge && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${educationalBadge.color}`}>
                <span className="mr-1">{educationalBadge.icon}</span>
                {educationalBadge.label}
              </span>
            )}
            
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
              📊 {video.relevanceScore}% match
            </span>
          </div>

          {/* Expandable Video Details */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>📋 Video Details</span>
              <svg className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showDetails && (
              <div className="px-3 pb-3 space-y-3 border-t border-gray-200">
                {/* Intelligent Search Analysis */}
                {video.intelligentMetadata && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-900 mb-1">🧠 Intelligent Analysis</h5>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 bg-green-50 p-2 rounded border border-green-200">
                        <span className="font-medium">Search Term:</span> {video.intelligentMetadata.searchTerm}
                      </p>
                      <p className="text-xs text-gray-600 bg-green-50 p-2 rounded border border-green-200">
                        {video.intelligentMetadata.analysisReason}
                      </p>
                      {video.intelligentMetadata.educationalIndicators.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">Educational Indicators:</p>
                          <div className="flex flex-wrap gap-1">
                            {video.intelligentMetadata.educationalIndicators.map((indicator, index) => (
                              <span 
                                key={index}
                                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
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

                {/* Relevancy Explanation */}
                {video.relevancyReason && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-900 mb-1">Why This Video?</h5>
                    <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                      {video.relevancyReason}
                    </p>
                  </div>
                )}

                {/* Suggested Timestamps */}
                {video.suggestedTimestamps && video.suggestedTimestamps.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-900 mb-1">Key Learning Moments</h5>
                    <div className="space-y-1">
                      {video.suggestedTimestamps.map((timestamp, index) => (
                        <div key={index} className="text-xs bg-green-50 p-2 rounded border border-green-200">
                          <span className="font-mono text-green-800">📍 {timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safety Details */}
                <div>
                  <h5 className="text-xs font-medium text-gray-900 mb-1">Safety Analysis</h5>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Educational Value:</span>
                      <span className="font-medium">{video.safetyAnalysis.educationalValue}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recommended Age:</span>
                      <span className="font-medium">{video.safetyAnalysis.recommendedMinAge}+</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h5 className="text-xs font-medium text-gray-900 mb-1">Description</h5>
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {video.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Safety warnings */}
          {video.safetyAnalysis.teacherReviewRequired && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <div className="flex items-center text-xs text-yellow-800">
                <span className="mr-1">⚠️</span>
                <span className="font-medium">Teacher review recommended before classroom use</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          {/* Info row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>Published {new Date(video.publishedAt).toLocaleDateString()}</span>
            </div>
            <div className={`text-xs font-medium px-2 py-1 rounded ${
              isLocked ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
            }`}>
              {formatDuration(video.durationSeconds)} {isLocked ? '(Unlock)' : ''}
            </div>
          </div>
          
          {/* Preview Button Only */}
          <button
            onClick={() => setShowPreview(true)}
            className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors flex items-center justify-center space-x-2"
          >
            <span>▶️</span>
            <span>Preview Video</span>
          </button>
        </div>
      </div>

      {/* In-App Preview Modal */}
      <VideoPreviewModal
        video={video}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onAddToLesson={canAddVideo ? () => onSelect(video.id) : undefined}
        isAlreadySelected={isSelected}
      />
    </>
  )
}

export default VideoCard