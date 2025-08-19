import React, { useState } from 'react'
import { ActivityNode, TeachingInsights } from '../../types/memoryBank'
import { createSuggestionsEngine } from '../../lib/smartSuggestions'

interface UsageAnalyticsProps {
  activities: ActivityNode[]
}

const UsageAnalytics: React.FC<UsageAnalyticsProps> = ({ activities }) => {
  const [showInsights, setShowInsights] = useState(false)
  
  // Generate insights using the smart suggestions engine
  const engine = createSuggestionsEngine(activities)
  const insights: TeachingInsights = engine.generateInsights()

  const formatRating = (rating: number) => rating.toFixed(1)

  return (
    <div className="bg-white rounded-lg shadow-md mb-4">
      <button 
        onClick={() => setShowInsights(!showInsights)}
        className="w-full flex justify-between items-center p-4 hover:bg-gray-50 transition-colors"
      >
        <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
          <span>📊</span>
          <span>Your Teaching Insights</span>
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {insights.totalActivities} activities analyzed
          </span>
          <span className={`transform transition-transform ${showInsights ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </button>
      
      {showInsights && (
        <div className="p-4 pt-0 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{insights.totalActivities}</div>
              <div className="text-sm text-blue-800">Activities Created</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{formatRating(insights.averageRating)}</div>
              <div className="text-sm text-green-800">Average Rating</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{insights.totalUseCount}</div>
              <div className="text-sm text-purple-800">Total Reuses</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{insights.recentTrends.thisMonth}</div>
              <div className="text-sm text-orange-800">This Month</div>
            </div>
          </div>

          {/* Success Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Favorite Subjects */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <span>📚</span>
                <span>Your Favorite Subjects</span>
              </h4>
              <div className="space-y-2">
                {insights.favoriteSubjects.map((subject, index) => (
                  <div key={subject} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                    <span className="text-sm font-medium text-gray-900">{subject}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Types */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <span>🎯</span>
                <span>Preferred Activity Types</span>
              </h4>
              <div className="space-y-2">
                {insights.successPatterns.preferredActivityTypes.slice(0, 3).map((type, index) => (
                  <div key={type.value} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                    <span className="text-sm font-medium text-gray-900">{type.value}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {type.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Duration Insights */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <span>⏱️</span>
              <span>Duration Patterns</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {insights.successPatterns.idealDurations.slice(0, 5).map((duration, index) => (
                <div key={duration.value} className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-sm font-medium text-gray-900">{duration.value}</div>
                  <div className="text-xs text-gray-600">{duration.count} activities</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Tags */}
          {insights.recentTrends.trending.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <span>🔥</span>
                <span>Trending This Month</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {insights.recentTrends.trending.map((tag, index) => (
                  <span 
                    key={tag}
                    className="bg-gradient-to-r from-pink-100 to-red-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>🏷️</span>
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Success Tips */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
              <span>💡</span>
              <span>Success Insights</span>
            </h4>
            <div className="space-y-2 text-sm text-blue-800">
              {insights.successPatterns.averageRating >= 4 && (
                <p>✨ Your activities have a high average rating of {formatRating(insights.successPatterns.averageRating)}!</p>
              )}
              {insights.successPatterns.mostReusedTypes.length > 0 && (
                <p>🔄 Your most successful activity type is "{insights.successPatterns.mostReusedTypes[0].type}" with an average of {insights.successPatterns.mostReusedTypes[0].avgUseCount.toFixed(1)} reuses.</p>
              )}
              {insights.recentTrends.thisMonth >= 3 && (
                <p>📈 You've been very productive this month with {insights.recentTrends.thisMonth} new activities!</p>
              )}
              {insights.totalUseCount >= 10 && (
                <p>♻️ Great job reusing your activities! You've saved time with {insights.totalUseCount} reuses.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsageAnalytics