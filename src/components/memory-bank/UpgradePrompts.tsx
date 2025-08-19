import React from 'react'
import { ConversionTracker } from '../../lib/premiumControls'

interface UpgradePromptProps {
  onUpgrade: () => void
  onDismiss?: () => void
}

// Storage limit reached prompt
export const StorageLimitPrompt: React.FC<UpgradePromptProps> = ({ onUpgrade, onDismiss }) => {
  const handleUpgrade = () => {
    ConversionTracker.trackTrigger('storage_limit', 'Memory Bank storage full')
    onUpgrade()
  }

  return (
    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <span className="text-2xl">👑</span>
        <div className="ml-3 flex-1">
          <h3 className="font-semibold text-purple-900">
            Your Memory Bank is Getting Full!
          </h3>
          <p className="text-sm text-purple-700 mt-1">
            You've reached your 5-activity limit. Upgrade to Premium to save unlimited activities plus get AI suggestions and insights.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button 
              onClick={handleUpgrade}
              className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
            >
              Upgrade to Premium
            </button>
            <button 
              onClick={onDismiss}
              className="text-purple-600 text-sm underline hover:text-purple-800"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Feature attempt prompt (when clicking premium features)
export const FeatureUpgradeModal: React.FC<UpgradePromptProps & {
  featureName: string
  featureDescription: string
  featureIcon: string
}> = ({ featureName, featureDescription, featureIcon, onUpgrade, onDismiss }) => {
  const handleUpgrade = () => {
    ConversionTracker.trackTrigger('feature_attempt', featureName)
    onUpgrade()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="text-center">
          <div className="text-4xl mb-3">{featureIcon}</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {featureName} is a Premium Feature
          </h3>
          <p className="text-gray-600 mb-6">
            {featureDescription}
          </p>
          
          {/* Premium Benefits */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Premium includes:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✨ Unlimited activity storage</li>
              <li>🧠 AI-powered suggestions</li>
              <li>📊 Teaching insights & analytics</li>
              <li>📋 Template creation system</li>
              <li>📤 Export & backup options</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button 
              onClick={handleUpgrade}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
            >
              Upgrade Now
            </button>
            <button 
              onClick={onDismiss}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Gentle suggestion prompt (after multiple uses)
export const GentleSuggestionPrompt: React.FC<UpgradePromptProps & {
  activityCount: number
}> = ({ activityCount, onUpgrade, onDismiss }) => {
  const handleUpgrade = () => {
    ConversionTracker.trackTrigger('suggestion_click', `After ${activityCount} activities`)
    onUpgrade()
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <span className="text-xl">💡</span>
        <div className="ml-3 flex-1">
          <h3 className="font-medium text-blue-900">
            Loving the Memory Bank?
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            You've saved {activityCount} activities! Unlock AI suggestions and unlimited storage with Premium.
          </p>
          <div className="mt-2 flex space-x-2">
            <button 
              onClick={handleUpgrade}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              See Premium Features
            </button>
            <button 
              onClick={onDismiss}
              className="text-blue-600 text-sm underline hover:text-blue-800"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Success-based prompt (after good ratings)
export const SuccessPrompt: React.FC<UpgradePromptProps & {
  averageRating: number
  ratedActivities: number
}> = ({ averageRating, ratedActivities, onUpgrade, onDismiss }) => {
  const handleUpgrade = () => {
    ConversionTracker.trackTrigger('suggestion_click', `High success rate: ${averageRating} stars`)
    onUpgrade()
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <span className="text-xl">🌟</span>
        <div className="ml-3 flex-1">
          <h3 className="font-medium text-green-900">
            Great Success Rate!
          </h3>
          <p className="text-sm text-green-700 mt-1">
            Your activities average {averageRating.toFixed(1)} stars! Get AI insights to replicate this success with Premium.
          </p>
          <div className="mt-2 flex space-x-2">
            <button 
              onClick={handleUpgrade}
              className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors"
            >
              Unlock Success Insights
            </button>
            <button 
              onClick={onDismiss}
              className="text-green-600 text-sm underline hover:text-green-800"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Progress indicator for free users
export const StorageProgressIndicator: React.FC<{
  current: number
  limit: number
  onUpgrade: () => void
}> = ({ current, limit, onUpgrade }) => {
  const percentage = Math.min((current / limit) * 100, 100)
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  if (!isNearLimit) return null

  return (
    <div className={`rounded-lg p-3 mb-4 ${
      isAtLimit 
        ? 'bg-red-50 border border-red-200' 
        : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${
          isAtLimit ? 'text-red-800' : 'text-yellow-800'
        }`}>
          Memory Bank Storage
        </span>
        <span className={`text-xs ${
          isAtLimit ? 'text-red-600' : 'text-yellow-600'
        }`}>
          {current}/{limit} activities
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isAtLimit ? 'bg-red-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <p className={`text-xs ${
          isAtLimit ? 'text-red-700' : 'text-yellow-700'
        }`}>
          {isAtLimit 
            ? 'Storage full! Upgrade for unlimited activities.' 
            : 'Almost full! Consider upgrading soon.'
          }
        </p>
        <button 
          onClick={onUpgrade}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            isAtLimit 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          }`}
        >
          Upgrade
        </button>
      </div>
    </div>
  )
}