'use client'

import React, { useState, useEffect } from 'react';
import { trackAnalyticsEvent } from '../../lib/usageTracker';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  modalType: 'warning' | 'paywall';
  remainingLessons: number;
  currentUsage: number;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  billing: 'monthly' | 'annual';
  savings?: string;
  stripePrice: string;
  features: string[];
  popular?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 9.99,
    billing: 'monthly',
    stripePrice: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_monthly',
    features: [
      'Unlimited lesson plans',
      'Intelligence Differentiation Engine',
      'Memory Bank - Save & reuse',
      'CER Teacher Scripts',
      'Priority support'
    ]
  },
  {
    id: 'annual',
    name: 'School Year',
    price: 95.88,
    billing: 'annual',
    savings: 'Save $24.00',
    stripePrice: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID || 'price_annual',
    features: [
      'Everything in Monthly',
      'Best value - $7.99/month',
      '20% savings vs monthly',
      'Perfect for school year',
      'Cancel anytime'
    ],
    popular: true
  }
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  userId,
  modalType,
  remainingLessons,
  currentUsage
}) => {
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      trackAnalyticsEvent(modalType === 'warning' ? 'limit_warning_shown' : 'paywall_encountered', {
        userId,
        remainingLessons,
        currentUsage,
        hasAccount: !!userId
      });
    }
  }, [isOpen, modalType, userId, remainingLessons, currentUsage]);

  if (!isOpen) return null;

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const plan = PRICING_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Invalid plan selected');

      await trackAnalyticsEvent('upgrade_button_clicked', {
        planId,
        planName: plan.name,
        price: plan.price,
        billing: plan.billing,
        source: modalType === 'warning' ? 'limit_warning' : 'paywall',
        userId,
        currentUsage
      });

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          priceId: plan.stripePrice,
          successUrl: `${window.location.origin}/upgrade/success`,
          cancelUrl: `${window.location.origin}/upgrade/cancel`,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;

    } catch (err) {
      console.error('Upgrade failed:', err);
      setError(err instanceof Error ? err.message : 'Upgrade failed');
      
      await trackAnalyticsEvent('upgrade_failed', {
        error: err instanceof Error ? err.message : 'Unknown error',
        planId,
        source: modalType
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getModalContent = () => {
    if (modalType === 'warning') {
      return {
        title: '🎯 You\'re on your last free lesson!',
        subtitle: 'Upgrade now to continue creating unlimited lesson plans',
        ctaText: 'Upgrade to Continue Teaching',
        showComparison: false
      };
    } else {
      return {
        title: '🎉 You\'ve been busy, Great work!',
        subtitle: 'You\'ve used all 5 free lessons this month. Upgrade for unlimited access',
        ctaText: 'Get Unlimited Access',
        showComparison: true
      };
    }
  };

  const content = getModalContent();

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {content.title}
            </h2>
            <p className="text-xl text-gray-600">
              {content.subtitle}
            </p>
          </div>
          
          {/* Usage indicator */}
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-800">Free Lessons Used</span>
              <span className="text-sm font-bold text-red-600">{currentUsage}/5</span>
            </div>
            <div className="w-full bg-red-200 rounded-full h-3">
              <div 
                className="bg-red-500 h-3 rounded-full transition-all duration-300"
                style={{ width: '100%' }}
              ></div>
            </div>
            <p className="text-sm text-red-600 mt-2 text-center">
              {modalType === 'warning' 
                ? 'Generate one more lesson, then upgrade for unlimited access!'
                : 'Your free lessons reset on the 1st of next month'
              }
            </p>
          </div>

          {/* Value propositions for warning modal */}
          {modalType === 'warning' && (
            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 text-center">
                🚀 Why Upgrade to Teacher Pro?
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Unlimited lesson generation</span>
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Save hours of prep time weekly</span>
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Auto-differentiation for all learners</span>
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Commercial-free video streaming</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Pricing plans */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <div 
                key={plan.id}
                className={`
                  relative border rounded-lg p-6 cursor-pointer transition-all
                  ${selectedPlan === plan.id 
                    ? 'border-purple-500 bg-purple-50 shadow-lg' 
                    : 'border-gray-200 hover:border-purple-300'
                  }
                  ${plan.popular ? 'ring-2 ring-purple-500' : ''}
                `}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      🏆 Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <div className="text-3xl font-bold text-purple-600">
                    ${plan.price}
                    <span className="text-lg font-normal text-gray-500">
                      /{plan.billing === 'annual' ? 'year' : 'month'}
                    </span>
                  </div>
                  {plan.savings && (
                    <p className="text-sm font-medium text-green-600 mt-1">{plan.savings}</p>
                  )}
                  {plan.billing === 'annual' && (
                    <p className="text-sm text-gray-500 mt-1">Just $7.99 per month</p>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  <div 
                    className={`
                      w-6 h-6 rounded-full border-2 mx-auto
                      ${selectedPlan === plan.id 
                        ? 'border-purple-500 bg-purple-500' 
                        : 'border-gray-300'
                      }
                    `}
                  >
                    {selectedPlan === plan.id && (
                      <svg className="w-4 h-4 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features comparison */}
        {content.showComparison && (
          <div className="px-6 pb-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                What You Get With Premium
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">🚀 Unlimited Generation</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Create unlimited lesson plans</li>
                    <li>• No monthly limits or restrictions</li>
                    <li>• Perfect for busy teachers</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">🎯 Intelligence Differentiation</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Automatic ESL adaptations</li>
                    <li>• IEP-friendly modifications</li>
                    <li>• Multiple grade level versions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">💾 Memory Bank</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Save your best activities</li>
                    <li>• Reuse and modify easily</li>
                    <li>• Build your teaching library</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">💬 CER Scripts</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Teacher talking points included</li>
                    <li>• Evidence-based questioning</li>
                    <li>• Boost student engagement</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-4 max-w-md mx-auto">
            {modalType === 'warning' && (
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Use Last Free Lesson
              </button>
            )}
            
            <button
              onClick={() => handleUpgrade(selectedPlan)}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : content.ctaText}
            </button>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Secure Payment
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cancel Anytime
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Trusted by 10K+ Teachers
              </div>
            </div>
          </div>
        </div>

        {/* Close button for warning modal only */}
        {modalType === 'warning' && (
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};