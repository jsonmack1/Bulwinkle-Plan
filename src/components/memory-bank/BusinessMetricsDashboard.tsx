import React, { useState, useEffect } from 'react'
import { MemoryBankAnalytics } from '../../types/memoryBank'
import { UsageAnalytics, ConversionTracker } from '../../lib/premiumControls'

/**
 * Business Metrics Dashboard - Internal Analytics
 * This component would be used internally to track Memory Bank performance
 * and conversion metrics for business optimization
 */

interface BusinessMetricsDashboardProps {
  // In real implementation, this would come from backend API
  mockData?: boolean
}

const BusinessMetricsDashboard: React.FC<BusinessMetricsDashboardProps> = ({ 
  mockData = true 
}) => {
  const [analytics, setAnalytics] = useState<MemoryBankAnalytics | null>(null)
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week')

  useEffect(() => {
    // In real app, would fetch from backend API
    if (mockData) {
      const usageStats = UsageAnalytics.getUsageStats()
      const triggers = ConversionTracker.getTriggers()
      const conversionReadiness = ConversionTracker.getConversionReadiness()
      
      // Mock analytics data
      setAnalytics({
        dailyActiveUsers: 145,
        averageActivitiesPerUser: 4.2,
        averageSessionDuration: 8.5, // minutes
        
        smartSuggestionsUsage: 67, // percentage
        templateCreationRate: 23, // percentage  
        ratingCompletionRate: 41, // percentage
        
        freeToTrialConversion: 15.2, // percentage
        trialToPaidConversion: 68, // percentage
        premiumRetentionRate: 89, // percentage
        
        averageActivityRating: 4.3,
        reuseRate: 64, // percentage
        userRetentionRate: 78 // percentage
      })
    }
  }, [mockData])

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`
  const formatNumber = (value: number) => value.toLocaleString()

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Memory Bank Business Metrics
          </h2>
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-3 py-2"
          >
            <option value="day">Last 24 hours</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Key Performance Indicators */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            📊 Core Metrics
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(analytics.dailyActiveUsers)}
              </div>
              <div className="text-sm text-blue-800">Daily Active Users</div>
              <div className="text-xs text-blue-600 mt-1">
                +12% vs last {timeframe}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {analytics.averageActivitiesPerUser.toFixed(1)}
              </div>
              <div className="text-sm text-green-800">Avg Activities/User</div>
              <div className="text-xs text-green-600 mt-1">
                +8% vs last {timeframe}
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.averageSessionDuration.toFixed(1)}m
              </div>
              <div className="text-sm text-purple-800">Avg Session Duration</div>
              <div className="text-xs text-purple-600 mt-1">
                +15% vs last {timeframe}
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">
                {formatPercentage(analytics.reuseRate)}
              </div>
              <div className="text-sm text-orange-800">Activity Reuse Rate</div>
              <div className="text-xs text-orange-600 mt-1">
                +5% vs last {timeframe}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Adoption */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            🚀 Feature Adoption
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Smart Suggestions</span>
                <span className="text-sm text-gray-600">
                  {formatPercentage(analytics.smartSuggestionsUsage)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${analytics.smartSuggestionsUsage}%` }}
                />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Template Creation</span>
                <span className="text-sm text-gray-600">
                  {formatPercentage(analytics.templateCreationRate)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${analytics.templateCreationRate}%` }}
                />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Rating Completion</span>
                <span className="text-sm text-gray-600">
                  {formatPercentage(analytics.ratingCompletionRate)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${analytics.ratingCompletionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            💎 Conversion Metrics
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-lg font-bold text-blue-900">
                {formatPercentage(analytics.freeToTrialConversion)}
              </div>
              <div className="text-sm text-blue-800">Free → Trial</div>
              <div className="text-xs text-blue-700 mt-1">
                Target: 12-18%
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-lg font-bold text-green-900">
                {formatPercentage(analytics.trialToPaidConversion)}
              </div>
              <div className="text-sm text-green-800">Trial → Premium</div>
              <div className="text-xs text-green-700 mt-1">
                Target: 60-75%
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="text-lg font-bold text-purple-900">
                {formatPercentage(analytics.premiumRetentionRate)}
              </div>
              <div className="text-sm text-purple-800">Premium Retention</div>
              <div className="text-xs text-purple-700 mt-1">
                Target: 85%+
              </div>
            </div>
          </div>
        </div>

        {/* Success Indicators */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            ⭐ Success Indicators
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Content Quality</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Average Rating</span>
                  <span className="font-medium text-yellow-600">
                    {analytics.averageActivityRating.toFixed(1)} ⭐
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Reuse Rate</span>
                  <span className="font-medium text-orange-600">
                    {formatPercentage(analytics.reuseRate)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">User Engagement</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">30-Day Retention</span>
                  <span className="font-medium text-indigo-600">
                    {formatPercentage(analytics.userRetentionRate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Session Duration</span>
                  <span className="font-medium text-purple-600">
                    {analytics.averageSessionDuration.toFixed(1)}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">📈 Key Insights & Actions</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Conversion rate exceeds target - Memory Bank is driving premium upgrades</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-yellow-500 mt-0.5">△</span>
              <span>Rating completion rate at 41% - consider simplifying feedback flow</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">💡</span>
              <span>High reuse rate indicates strong value - focus on activity quality tools</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-purple-500 mt-0.5">🎯</span>
              <span>Template usage growing - expand template creation features</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default BusinessMetricsDashboard