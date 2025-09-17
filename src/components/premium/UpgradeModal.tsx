import React, { useState } from 'react'
import { SUBSCRIPTION_PLANS, SubscriptionStatus, useSubscription, triggerSubscriptionRefresh } from '../../lib/subscription'
import { useAuth } from '../../contexts/AuthContext'

interface UpgradeModalProps {
  onClose: () => void
  onUpgraded?: () => void
  suggestedPlan?: SubscriptionStatus
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  onClose, 
  onUpgraded,
  suggestedPlan = 'premium'
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionStatus>('premium')
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [step, setStep] = useState<'plans' | 'payment' | 'success'>('plans')
  const { user } = useAuth()
  const { refreshSubscription } = useSubscription()

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    setStep('payment')
    
    try {
      // Redirect to real Stripe checkout
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_1QAqIKP7VwzJtjINaEcdGGde',
          billingPeriod: 'annual',
          successUrl: `${window.location.origin}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href,
          email: user?.email
        })
      })
      
      const data = await response.json()
      
      if (data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl
      } else {
        console.error('No checkout URL received')
        setStep('plans') // Return to plans step on error
      }
    } catch (error) {
      console.error('Real upgrade failed:', error)
      setStep('plans') // Return to plans step on error
    } finally {
      setIsUpgrading(false)
    }
  }

  const renderPlansStep = () => (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">📚</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          You've Used All 5 Free Lessons This Month
        </h2>
        <p className="text-gray-600 mb-2">
          Your free lessons will reset automatically next month
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
          <p className="text-blue-800 text-sm">
            📅 <strong>Good news!</strong> You'll get 5 new free lessons on the 1st of next month. 
            Or upgrade now for unlimited access.
          </p>
        </div>
      </div>

      {/* Premium Plan - Single Option */}
      <div className="max-w-md mx-auto mb-8">
        <div className="border-2 border-purple-500 bg-purple-50 rounded-xl p-6 shadow-lg">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              Starting at $7.99
            </div>
            <div className="text-sm text-gray-500">/month</div>
            <div className="text-sm text-purple-600 font-medium mt-1">
              Save 20% with annual billing
            </div>
          </div>
          
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Features</h3>
            <p className="text-gray-600 text-sm">Everything you need for unlimited lesson planning</p>
          </div>
          
          <ul className="space-y-3 text-sm">
            <li className="flex items-center">
              <span className="text-green-500 mr-3 font-bold">✓</span>
              <span className="font-medium">Unlimited lesson generation</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3 font-bold">✓</span>
              <span className="font-medium">AI differentiation engine</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3 font-bold">✓</span>
              <span className="font-medium">YouTube video integration</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3 font-bold">✓</span>
              <span className="font-medium">Export to Google Docs & Word</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3 font-bold">✓</span>
              <span className="font-medium">Memory bank with lesson history</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3 font-bold">✓</span>
              <span className="font-medium">Advanced math problem solver</span>
            </li>
          </ul>

          <div className="mt-4 p-3 bg-purple-100 rounded text-center">
            <span className="text-purple-800 font-medium text-sm">✓ Best Value for Teachers</span>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <span>🚀</span>
          <span>Start Premium - Save 6+ Hours Weekly</span>
        </button>

        <div className="text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-medium text-sm"
          >
            Maybe later
          </button>
        </div>
      </div>

      {/* Money Back Guarantee */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center justify-center bg-green-50 rounded-full px-4 py-2">
          <span className="text-green-600 mr-2">💰</span>
          <span className="text-sm font-medium text-green-800">30-day money-back guarantee</span>
        </div>
      </div>
    </>
  )

  const renderPaymentStep = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-6 animate-pulse">💳</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Processing Payment...
      </h3>
      <p className="text-gray-600 mb-6">
        Setting up your {SUBSCRIPTION_PLANS[selectedPlan].plan} account
      </p>
      <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
      </div>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-6">🎉</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Welcome to Premium!
      </h3>
      <p className="text-gray-600 mb-6">
        Your {SUBSCRIPTION_PLANS[selectedPlan].plan} is now active. Enjoy all premium features!
      </p>
      <div className="bg-green-50 rounded-lg p-4 inline-block">
        <div className="text-green-800 font-medium">✓ Differentiation Engine Unlocked</div>
        <div className="text-green-600 text-sm">Generate unlimited adaptations</div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/60 to-indigo-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Progress Steps */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex items-center justify-center space-x-4">
            {['Plans', 'Payment', 'Success'].map((stepName, index) => {
              const stepIndex = ['plans', 'payment', 'success'].indexOf(step)
              const isActive = index <= stepIndex
              const isCurrent = index === stepIndex
              
              return (
                <div key={stepName} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive 
                      ? (isCurrent ? 'bg-purple-600 text-white' : 'bg-green-500 text-white')
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index < stepIndex ? '✓' : index + 1}
                  </div>
                  <div className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {stepName}
                  </div>
                  {index < 2 && (
                    <div className={`w-8 h-0.5 ml-4 ${
                      index < stepIndex ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'plans' && renderPlansStep()}
          {step === 'payment' && renderPaymentStep()}
          {step === 'success' && renderSuccessStep()}
        </div>

        {/* Close Button */}
        {step !== 'payment' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default UpgradeModal