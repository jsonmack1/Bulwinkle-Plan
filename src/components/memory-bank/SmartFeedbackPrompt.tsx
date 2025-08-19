import React, { useState } from 'react'
import { ActivityNode, TeacherFeedback } from '../../types/memoryBank'

interface SmartFeedbackPromptProps {
  activity: ActivityNode
  onFeedbackSubmit: (activityId: string, feedback: TeacherFeedback) => void
  onDismiss: () => void
  promptType: 'rating' | 'quick' | 'detailed' | 'return_visit'
}

const SmartFeedbackPrompt: React.FC<SmartFeedbackPromptProps> = ({
  activity,
  onFeedbackSubmit,
  onDismiss,
  promptType
}) => {
  const [rating, setRating] = useState<number | undefined>()
  const [showDetailed, setShowDetailed] = useState(false)
  const [feedback, setFeedback] = useState<Partial<TeacherFeedback>>({})

  const handleQuickRating = (stars: number) => {
    const quickFeedback: TeacherFeedback = {
      rating: stars,
      feedbackDate: new Date().toISOString()
    }
    onFeedbackSubmit(activity.id, quickFeedback)
  }

  const handleDetailedSubmit = () => {
    const detailedFeedback: TeacherFeedback = {
      ...feedback,
      rating,
      feedbackDate: new Date().toISOString()
    }
    onFeedbackSubmit(activity.id, detailedFeedback)
  }

  // Natural return visit prompt
  if (promptType === 'return_visit') {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400 text-xl">💫</span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-blue-700">
              How did your <strong>{activity.title}</strong> activity go?
            </p>
            <div className="mt-2 flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star}
                  onClick={() => handleQuickRating(star)}
                  className="text-yellow-400 hover:text-yellow-500 text-lg transition-colors"
                  title={`${star} star${star > 1 ? 's' : ''}`}
                >
                  ⭐
                </button>
              ))}
              <button 
                onClick={() => setShowDetailed(true)}
                className="text-xs text-blue-600 underline ml-4 hover:text-blue-800"
              >
                Add notes
              </button>
              <button 
                onClick={onDismiss}
                className="text-xs text-gray-500 ml-2 hover:text-gray-700"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // High engagement prompt (after 3+ uses)
  if (promptType === 'quick') {
    return (
      <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
        <div className="flex items-center justify-between">
          <p className="text-xs text-green-700 flex items-center space-x-1">
            <span>🎉</span>
            <span>You've used this activity {activity.useCount} times!</span>
          </p>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button 
                key={star}
                onClick={() => handleQuickRating(star)}
                className="text-yellow-400 hover:text-yellow-500 text-sm"
              >
                ⭐
              </button>
            ))}
            <button 
              onClick={onDismiss}
              className="text-xs text-gray-400 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Detailed feedback modal
  if (showDetailed || promptType === 'detailed') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              📝 Quick Reflection
            </h3>
            <button 
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Activity Reference */}
            <div className="bg-gray-50 rounded p-3">
              <p className="font-medium text-gray-900">{activity.title}</p>
              <p className="text-sm text-gray-600">{activity.gradeLevel} • {activity.subject}</p>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall rating
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${
                      rating && star <= rating 
                        ? 'text-yellow-400' 
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Questions */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student engagement (1-5)
                </label>
                <select 
                  value={feedback.studentEngagement || ''}
                  onChange={(e) => setFeedback({...feedback, studentEngagement: Number(e.target.value)})}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Select...</option>
                  <option value="1">1 - Low engagement</option>
                  <option value="2">2 - Some engagement</option>
                  <option value="3">3 - Good engagement</option>
                  <option value="4">4 - High engagement</option>
                  <option value="5">5 - Excellent engagement</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    checked={feedback.wouldUseAgain || false}
                    onChange={(e) => setFeedback({...feedback, wouldUseAgain: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">I would use this activity again</span>
                </label>
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quick notes (optional)
              </label>
              <textarea 
                value={feedback.reflectionNotes || ''}
                onChange={(e) => setFeedback({...feedback, reflectionNotes: e.target.value})}
                placeholder="What worked well? What would you change?"
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 h-20 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-2">
              <button 
                onClick={handleDetailedSubmit}
                disabled={!rating}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit Feedback
              </button>
              <button 
                onClick={onDismiss}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default SmartFeedbackPrompt