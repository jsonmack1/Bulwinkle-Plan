import React from 'react'
import { useSubscription, SubscriptionStatus, SUBSCRIPTION_PLANS } from '../../lib/subscription'

const SubscriptionToggle: React.FC = () => {
  const { status, info, isHydrated } = useSubscription()

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Don't render until hydrated to prevent SSR mismatches
  if (!isHydrated) {
    return null
  }

  const handleStatusChange = (newStatus: SubscriptionStatus) => {
    console.log('Development mode - subscription toggle to:', newStatus)
    // setStatus is not available in production useSubscription hook
    // This is development-only UI for testing
  }

  const getStatusColor = (subscriptionStatus: SubscriptionStatus) => {
    switch (subscriptionStatus) {
      case 'free':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'school':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getButtonStyle = (subscriptionStatus: SubscriptionStatus) => {
    const isActive = status === subscriptionStatus
    const baseClasses = 'px-3 py-1 text-xs rounded-md border transition-all duration-200'
    
    if (isActive) {
      switch (subscriptionStatus) {
        case 'free':
          return `${baseClasses} bg-gray-600 text-white border-gray-600 shadow-md`
        case 'premium':
          return `${baseClasses} bg-purple-600 text-white border-purple-600 shadow-md`
        case 'school':
          return `${baseClasses} bg-blue-600 text-white border-blue-600 shadow-md`
      }
    }
    
    return `${baseClasses} bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:shadow-sm`
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 text-sm">🧪 Dev Tools</h4>
          <div className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(status)}`}>
            {info.plan}
          </div>
        </div>

        {/* Current Status Info */}
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
          <div className="font-medium text-gray-700 mb-1">Current Status:</div>
          <div className="text-gray-600">
            {info.plan} {info.monthlyPrice && `• ${info.monthlyPrice}/month`}
          </div>
        </div>

        {/* Status Toggle Buttons */}
        <div className="space-y-2 mb-3">
          <div className="text-xs text-gray-600 font-medium">Switch Subscription:</div>
          <div className="flex space-x-2">
            {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionStatus[]).map((subscriptionStatus) => (
              <button
                key={subscriptionStatus}
                onClick={() => handleStatusChange(subscriptionStatus)}
                className={getButtonStyle(subscriptionStatus)}
              >
                {SUBSCRIPTION_PLANS[subscriptionStatus].plan.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Access */}
        <div className="text-xs">
          <div className="font-medium text-gray-700 mb-1">Feature Access:</div>
          <div className="space-y-1">
            <div className={`flex items-center ${info.status !== 'free' ? 'text-green-600' : 'text-red-500'}`}>
              <span className="mr-1">{info.status !== 'free' ? '✓' : '✗'}</span>
              <span>Differentiation Engine</span>
            </div>
            <div className="text-green-600 flex items-center">
              <span className="mr-1">✓</span>
              <span>Basic Activities</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Test premium features by switching to Premium above
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionToggle