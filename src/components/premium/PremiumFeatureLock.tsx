import React, { useState } from 'react'
import { mockSubscription, SUBSCRIPTION_PLANS } from '../../lib/subscription-mock'

interface PremiumFeatureLockProps {
  featureName?: string
  onClose: () => void
  onUpgrade?: () => void
}

const PremiumFeatureLock: React.FC<PremiumFeatureLockProps> = ({ 
  featureName = "Enhanced Differentiation", 
  onClose,
  onUpgrade 
}) => {
  const [isUpgrading, setIsUpgrading] = useState(false)
  const premiumPlan = SUBSCRIPTION_PLANS.premium

  const handleTryPremium = async () => {
    setIsUpgrading(true)
    try {
      await mockSubscription.mockUpgrade('premium')
      // Close the modal and let parent handle the premium access
      onClose()
      if (onUpgrade) onUpgrade()
    } catch (error) {
      console.error('Mock upgrade failed:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleMockUpgrade = async () => {
    setIsUpgrading(true)
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    try {
      await mockSubscription.mockUpgrade('premium')
      onClose()
      if (onUpgrade) onUpgrade()
    } catch (error) {
      console.error('Mock upgrade failed:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/60 to-indigo-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-center text-white">
          <div className="text-4xl mb-3">✨</div>
          <h2 className="text-2xl font-bold mb-2">Unlock {featureName}</h2>
          <p className="text-purple-100 text-sm">
            Generate 5 specialized adaptations for every learning need
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Feature Benefits */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🎯</span>
              What You'll Get:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {premiumPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-green-500 mr-2 font-bold">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Differentiation Preview */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">🚀 Preview: Differentiation Adaptations</h4>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {[
                { icon: '📚', label: 'Below Grade Level', desc: 'Simplified instructions & supports' },
                { icon: '🎯', label: 'At Grade Level', desc: 'Standard expectations' },
                { icon: '🚀', label: 'Above Grade Level', desc: 'Enhanced complexity & extensions' },
                { icon: '🌍', label: 'ESL Adaptations', desc: 'Language scaffolds & visual aids' },
                { icon: '🤝', label: 'IEP Accommodations', desc: 'Behavioral & sensory supports' }
              ].map((item, index) => (
                <div key={index} className="flex items-center p-2 bg-white rounded border">
                  <span className="mr-2">{item.icon}</span>
                  <div>
                    <div className="font-medium text-gray-800">{item.label}</div>
                    <div className="text-gray-500 text-xs">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full px-4 py-2 mb-3">
              <span className="text-sm text-gray-600 mr-2">as low as</span>
              <span className="text-2xl font-bold text-purple-600">{premiumPlan.monthlyPrice}</span>
              <span className="text-sm text-gray-600 ml-1">/month*</span>
            </div>
            <p className="text-xs text-gray-500">*With annual plan • Cancel anytime • 30-day money-back guarantee</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleMockUpgrade}
              disabled={isUpgrading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-purple-400 disabled:to-indigo-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isUpgrading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Upgrading...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Upgrade to Premium</span>
                </>
              )}
            </button>

            {/* Development Testing Button */}
            {mockSubscription.isDevelopment() && (
              <button
                onClick={handleTryPremium}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                🧪 Try Premium (Development)
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-4 transition-colors text-sm"
            >
              Maybe Later
            </button>
          </div>

          {/* Social Proof */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <div className="flex items-center mr-4">
                <span className="text-yellow-400 mr-1">⭐⭐⭐⭐⭐</span>
                <span>4.9/5</span>
              </div>
              <span>Join 10,000+ teachers saving time</span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default PremiumFeatureLock