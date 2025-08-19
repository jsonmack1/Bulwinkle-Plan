import React, { useState } from 'react'
import { ActivityNode } from '../../types/memoryBank'

interface ActivityPreviewProps {
  activity: ActivityNode
  onAction: (activityId: string, action: 'reuse' | 'favorite' | 'delete') => void
}

const ActivityPreview: React.FC<ActivityPreviewProps> = ({
  activity,
  onAction
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'details'>('content')

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get activity type emoji
  const getActivityEmoji = (activityType: string) => {
    const emojiMap: { [key: string]: string } = {
      'Lab Investigation': '🔬',
      'Document Analysis': '📜',
      'Discussion': '💬',
      'Project': '📋',
      'Assessment': '📝',
      'Game': '🎮',
      'Presentation': '📊',
      'Research': '🔍',
      'Creative Writing': '✍️',
      'Problem Solving': '🧩'
    }
    return emojiMap[activityType] || '📚'
  }

  // Generate rating stars
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  // Get mode display
  const getModeDisplay = (mode: string) => {
    return mode === 'substitute' 
      ? { emoji: '🔄', text: 'Substitute Mode', color: 'bg-green-100 text-green-800' }
      : { emoji: '👩‍🏫', text: 'Teacher Mode', color: 'bg-blue-100 text-blue-800' }
  }

  const modeDisplay = getModeDisplay(activity.mode)

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <span className="text-3xl">{getActivityEmoji(activity.activityType)}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{activity.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <span>🎓</span>
                  <span>{activity.gradeLevel}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>📚</span>
                  <span>{activity.subject}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>⏱️</span>
                  <span>{activity.duration} minutes</span>
                </span>
              </div>
            </div>
          </div>

          {/* Favorite Button */}
          <button
            onClick={() => onAction(activity.id, 'favorite')}
            className={`p-2 transition-colors ${
              activity.isFavorite 
                ? 'text-yellow-500 hover:text-yellow-600' 
                : 'text-gray-400 hover:text-yellow-500'
            }`}
            title={activity.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <span className="text-xl">{activity.isFavorite ? '⭐' : '☆'}</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600">Rating:</span>
              <div className="flex items-center">
                {renderStars(activity.rating)}
              </div>
            </div>
            
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <span>🔄</span>
              <span>Used {activity.useCount} times</span>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-sm ${modeDisplay.color} flex items-center space-x-1`}>
              <span>{modeDisplay.emoji}</span>
              <span>{modeDisplay.text}</span>
            </span>
          </div>

          <div className="text-sm text-gray-500">
            Created {formatDate(activity.createdAt)}
            {activity.lastUsed && (
              <div>Last used {formatDate(activity.lastUsed)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'content'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📄 Content Preview
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Activity Details
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'content' ? (
          <div className="space-y-6">
            {/* Preview Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity Overview</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{activity.preview}</p>
              </div>
            </div>

            {/* Full Content Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Complete Lesson Plan</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  {/* Simulated lesson content - replace with actual content parsing */}
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {activity.fullContent || 'Complete lesson content would be displayed here...'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-6">
            {/* Activity Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Activity Information</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Topic:</span>
                    <span className="font-medium">{activity.topic}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Activity Type:</span>
                    <span className="font-medium">{activity.activityType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{activity.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode:</span>
                    <span className={`px-2 py-1 rounded text-sm ${modeDisplay.color}`}>
                      {modeDisplay.text}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Usage Statistics</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Times Used:</span>
                    <span className="font-medium">{activity.useCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Rating:</span>
                    <div className="flex items-center">
                      {renderStars(activity.rating)}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{formatDate(activity.createdAt)}</span>
                  </div>
                  {activity.lastUsed && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Used:</span>
                      <span className="font-medium">{formatDate(activity.lastUsed)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tags & Keywords */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags & Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {activity.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>🏷️</span>
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Usage History Placeholder */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Usage</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Usage history and analytics would be displayed here in a future update.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            <button
              onClick={() => onAction(activity.id, 'reuse')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Reuse This Activity</span>
            </button>
          </div>

          <button
            onClick={() => onAction(activity.id, 'delete')}
            className="text-red-600 hover:text-red-800 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-2"
          >
            <span>🗑️</span>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActivityPreview