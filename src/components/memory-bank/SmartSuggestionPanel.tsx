import React from 'react'
import { ActivityNode, ActivityRequest, ActivitySuggestion } from '../../types/memoryBank'
import { createSuggestionsEngine } from '../../lib/smartSuggestions'

interface SmartSuggestionPanelProps {
  request: ActivityRequest
  activities: ActivityNode[]
  onUseSuggestion: (activity: ActivityNode) => void
  onDismiss: () => void
}

/**
 * Smart Suggestion Panel for Activity Creation Flow
 * This component would be integrated into the main activity creation modal
 * to show relevant suggestions based on the user's current input
 */
const SmartSuggestionPanel: React.FC<SmartSuggestionPanelProps> = ({
  request,
  activities,
  onUseSuggestion,
  onDismiss
}) => {
  // Generate suggestions using the smart engine
  const engine = createSuggestionsEngine(activities)
  const suggestions = engine.getSuggestions(request, 3)

  if (suggestions.length === 0) {
    return null
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'high_rated': return '⭐'
      case 'same_subject_grade': return '🎯'
      case 'similar_topic': return '🔄'
      case 'successful_pattern': return '📈'
      case 'recent_success': return '🕒'
      default: return '💡'
    }
  }

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'high_rated': return 'border-yellow-300 bg-yellow-50'
      case 'same_subject_grade': return 'border-blue-300 bg-blue-50'
      case 'similar_topic': return 'border-green-300 bg-green-50'
      case 'successful_pattern': return 'border-purple-300 bg-purple-50'
      case 'recent_success': return 'border-orange-300 bg-orange-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-blue-900 flex items-center space-x-2">
          <span>💡</span>
          <span>Smart Suggestions</span>
        </h3>
        <button
          onClick={onDismiss}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ✕
        </button>
      </div>
      
      <p className="text-sm text-blue-800 mb-3">
        Based on your {request.subject} • {request.gradeLevel} request, here are some relevant activities from your Memory Bank:
      </p>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.activity.id}
            onClick={() => onUseSuggestion(suggestion.activity)}
            className={`w-full text-left p-3 bg-white rounded-lg border hover:shadow-md transition-all duration-200 ${getSuggestionColor(suggestion.reason.type)}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{getSuggestionIcon(suggestion.reason.type)}</span>
                  <div className="font-medium text-gray-900">{suggestion.activity.title}</div>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {suggestion.reason.explanation}
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>📚 {suggestion.activity.subject}</span>
                  <span>🎓 {suggestion.activity.gradeLevel}</span>
                  <span>⏱️ {suggestion.activity.duration}min</span>
                  <span>🔄 Used {suggestion.activity.useCount}x</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-600 font-medium mb-1">
                  ★{suggestion.activity.rating}
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round(suggestion.similarity)}% match
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-3 text-xs text-blue-700 bg-blue-100 rounded p-2">
        💡 <strong>Tip:</strong> Click a suggestion to use it as a template for your new activity. 
        You can modify the generated content to fit your specific needs.
      </div>
    </div>
  )
}

export default SmartSuggestionPanel