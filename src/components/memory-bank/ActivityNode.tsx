import React, { useState } from 'react'
import { ActivityNode } from '../../types/memoryBank'

interface ActivityNodeProps {
  activity: ActivityNode
  isSelected: boolean
  onSelect: (activity: ActivityNode) => void
  onAction: (activityId: string, action: 'reuse' | 'favorite' | 'delete' | 'template' | 'similar') => void
}

const ActivityNodeComponent: React.FC<ActivityNodeProps> = ({
  activity,
  isSelected,
  onSelect,
  onAction
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false)

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

  // Get mode badge
  const getModeDisplay = (mode: string) => {
    return mode === 'substitute' 
      ? { emoji: '🔄', text: 'Sub Mode', color: 'bg-green-100 text-green-800' }
      : { emoji: '👩‍🏫', text: 'Teacher', color: 'bg-blue-100 text-blue-800' }
  }

  // Format subject display to avoid redundancy with AP courses
  const getSubjectDisplay = (subject: string, gradeLevel: string) => {
    if (gradeLevel.startsWith('AP ')) {
      return gradeLevel // Just show "AP Biology", not "AP Biology • Science"
    }
    return `${gradeLevel} • ${subject}` // Show "8th Grade • Science"
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  // Generate rating stars
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  const modeDisplay = getModeDisplay(activity.mode)

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-3 mb-2 cursor-pointer border-l-4 relative ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : 'border-transparent hover:border-blue-300'
      }`}
      onClick={() => onSelect(activity)}
    >
      {/* Compressed Header - Single line with better space usage */}
      <div className="flex justify-between items-center mb-1.5">
        <h3 className="font-semibold text-gray-900 text-sm truncate flex-1 mr-2 flex items-center">
          <span className="mr-1 text-base">{getActivityEmoji(activity.activityType)}</span>
          {activity.title}
        </h3>
        <div className="flex items-center space-x-2 text-xs text-gray-500 flex-shrink-0">
          <div className="flex text-yellow-500">
            {renderStars(activity.rating)}
          </div>
          <span>{formatDate(activity.createdAt)}</span>
        </div>
      </div>

      {/* Compressed metadata row */}
      <div className="flex justify-between items-center mb-2 text-xs">
        <span className="text-gray-600">{getSubjectDisplay(activity.subject, activity.gradeLevel)} • {activity.duration} min</span>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center space-x-1">
          <span>🔄</span>
          <span>{activity.useCount}x</span>
        </span>
      </div>

      {/* Reduced preview text */}
      <p className="text-xs text-gray-700 line-clamp-2 mb-2 leading-tight">{activity.preview}</p>

      {/* Compressed action row */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onAction(activity.id, 'template')
            }}
            className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 transition-colors"
          >
            📋 Template
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onAction(activity.id, 'similar')
            }}
            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
          >
            🔄 Similar
          </button>
        </div>
        <div className="flex items-center space-x-2">
          {activity.mode === 'substitute' && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center space-x-1">
              <span>🔄</span>
              <span>Sub</span>
            </span>
          )}
        </div>
      </div>

      {/* Actions Menu */}
      <div className="absolute top-2 right-10">
        <button
          className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            setShowActionsMenu(!showActionsMenu)
          }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {showActionsMenu && (
          <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-32">
            <button
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2"
              onClick={(e) => {
                e.stopPropagation()
                onAction(activity.id, 'reuse')
                setShowActionsMenu(false)
              }}
            >
              <span>🔄</span>
              <span>Reuse</span>
            </button>
            
            <button
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 flex items-center space-x-2"
              onClick={(e) => {
                e.stopPropagation()
                onAction(activity.id, 'favorite')
                setShowActionsMenu(false)
              }}
            >
              <span>{activity.isFavorite ? '⭐' : '☆'}</span>
              <span>{activity.isFavorite ? 'Unfavorite' : 'Favorite'}</span>
            </button>
            
            <hr className="my-1" />
            
            <button
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              onClick={(e) => {
                e.stopPropagation()
                onAction(activity.id, 'delete')
                setShowActionsMenu(false)
              }}
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Favorite Indicator */}
      {activity.isFavorite && (
        <div className="absolute top-2 right-2">
          <span className="text-yellow-500 text-lg">⭐</span>
        </div>
      )}

      {/* Click overlay to close menu */}
      {showActionsMenu && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowActionsMenu(false)}
        />
      )}
    </div>
  )
}

export default ActivityNodeComponent