import React, { useState } from 'react'
import { IntelligentSearchResponse } from '../../../types/youtube'

interface IntelligentSearchFeedbackProps {
  searchData: IntelligentSearchResponse
  query: string
  onClose?: () => void
}

const IntelligentSearchFeedback: React.FC<IntelligentSearchFeedbackProps> = ({
  searchData,
  query,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Determine feedback color based on success metrics
  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'primary-only':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'fallback-enhanced':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'mock-intelligent':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'primary-only':
        return 'Direct Search'
      case 'fallback-enhanced':
        return 'Enhanced Search'
      case 'mock-intelligent':
        return 'Demo Mode'
      default:
        return 'Unknown Strategy'
    }
  }

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'primary-only':
        return '🎯'
      case 'fallback-enhanced':
        return '🔄'
      case 'mock-intelligent':
        return '🎭'
      default:
        return '🔍'
    }
  }

  return (
    <div className="mb-4 bg-white border rounded-lg shadow-sm">
      {/* Compact Header */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStrategyColor(searchData.searchStrategy)}`}>
              <span className="mr-1">{getStrategyIcon(searchData.searchStrategy)}</span>
              {getStrategyLabel(searchData.searchStrategy)}
            </div>
            
            <div className="text-sm text-gray-600">
              <span className={`font-medium ${getConfidenceColor(searchData.averageConfidence)}`}>
                {searchData.averageConfidence}% confidence
              </span>
              <span className="mx-2">•</span>
              <span>{searchData.totalResultsAnalyzed} videos analyzed</span>
            </div>
            
            {searchData.fallbackTriggered && (
              <div className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                🔄 Fallback used
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {isExpanded ? 'Less info' : 'More info'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-100 space-y-3">
          {/* Search Terms Used */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">🔍 Search Terms Used</h4>
            <div className="flex flex-wrap gap-2">
              {searchData.searchTermsUsed.map((term, index) => (
                <span 
                  key={index}
                  className={`px-2 py-1 text-xs rounded ${
                    index === 0 
                      ? 'bg-blue-100 text-blue-800 font-medium' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {index === 0 && '🎯 '}
                  {term}
                </span>
              ))}
            </div>
            {searchData.searchTermsUsed.length > 1 && (
              <p className="text-xs text-gray-600 mt-1">
                Primary search enhanced with {searchData.searchTermsUsed.length - 1} alternate terms
              </p>
            )}
          </div>

          {/* Results Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">📊 Results Breakdown</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-green-50 p-2 rounded">
                <span className="font-medium text-green-800">Primary Search</span>
                <div className="text-xs text-green-600 mt-1">
                  {searchData.feedback.primarySearchResults} videos found
                </div>
              </div>
              
              {searchData.fallbackTriggered && (
                <div className="bg-yellow-50 p-2 rounded">
                  <span className="font-medium text-yellow-800">Fallback Search</span>
                  <div className="text-xs text-yellow-600 mt-1">
                    {searchData.feedback.fallbackSearchResults} additional videos
                  </div>
                </div>
              )}
              
              {searchData.feedback.filteredOutCount > 0 && (
                <div className="bg-red-50 p-2 rounded">
                  <span className="font-medium text-red-800">Filtered Out</span>
                  <div className="text-xs text-red-600 mt-1">
                    {searchData.feedback.filteredOutCount} inappropriate videos
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 p-2 rounded">
                <span className="font-medium text-blue-800">Success Rate</span>
                <div className="text-xs text-blue-600 mt-1">
                  {searchData.performance.successRate}% historical success
                </div>
              </div>
            </div>
          </div>

          {/* Filter Reasons */}
          {searchData.feedback.reasonsFiltered.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">🛡️ Content Filtering</h4>
              <div className="space-y-1">
                {searchData.feedback.reasonsFiltered.map((reason, index) => (
                  <div key={index} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                    {reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {searchData.suggestions && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">💡 Suggestions</h4>
              <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded border border-blue-200">
                {searchData.suggestions}
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">⚡ System Performance</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-900">
                  {searchData.performance.averageConfidence}%
                </div>
                <div className="text-gray-600">Avg Confidence</div>
              </div>
              
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-900">
                  {searchData.performance.fallbackRate}%
                </div>
                <div className="text-gray-600">Fallback Rate</div>
              </div>
              
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-900">
                  {searchData.performance.successRate}%
                </div>
                <div className="text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IntelligentSearchFeedback