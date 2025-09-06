'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../lib/subscription-mock';
import Navigation from '../../components/Navigation';
import Link from 'next/link';
import { trackAnalyticsEvent } from '../../lib/usageTracker';

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const { isPremium, isHydrated } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mock subscription data - in production this would come from your payment processor
  const mockSubscriptionData = {
    plan: isPremium ? 'Teacher Pro Annual' : 'Free Plan',
    status: isPremium ? 'Active' : 'Free',
    billingCycle: isPremium ? 'Annual' : 'N/A',
    subscriptionDate: new Date('2024-01-15'),
    nextRenewal: new Date('2025-01-15'),
    price: isPremium ? '$79.90' : '$0.00',
    monthlyEquivalent: isPremium ? '$7.99' : '$0.00',
    features: isPremium 
      ? ['Unlimited lesson plans', 'Intelligence Differentiation Engine', 'Memory Bank storage', 'Google Docs export', 'Priority support']
      : ['5 lesson plans per month', 'Basic templates', 'Limited memory bank']
  };

  useEffect(() => {
    if (user) {
      trackAnalyticsEvent('account_settings_viewed', {
        userId: user.id,
        isPremium,
        plan: mockSubscriptionData.plan
      });
    }
  }, [user, isPremium, mockSubscriptionData.plan]);

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      trackAnalyticsEvent('subscription_cancel_attempted', {
        userId: user?.id,
        plan: mockSubscriptionData.plan
      });

      setMessage({
        type: 'success',
        text: 'Your subscription has been scheduled for cancellation. You will retain access until your next billing date.'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to cancel subscription. Please try again or contact support.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading account settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-xl text-gray-600 mb-8">Please sign in to view your account settings</p>
            <Link 
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <Link 
              href="/dashboard"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
          
          {isPremium && (
            <div className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></span>
              PREMIUM ACTIVE
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Account Information */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">👤 Account Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Full Name</label>
                <div className="text-lg font-medium text-gray-900">{user.name}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Email Address</label>
                <div className="text-lg font-medium text-gray-900">{user.email}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Account Type</label>
                <div className="text-lg font-medium text-gray-900">
                  {isPremium ? 'Premium Teacher' : 'Free User'}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Member Since</label>
                <div className="text-lg font-medium text-gray-900">
                  {formatDate(mockSubscriptionData.subscriptionDate)}
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">💳 Subscription Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Current Plan</label>
                <div className="text-lg font-medium text-gray-900">{mockSubscriptionData.plan}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className={`text-lg font-medium ${isPremium ? 'text-green-600' : 'text-gray-900'}`}>
                  {mockSubscriptionData.status}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Billing</label>
                <div className="text-lg font-medium text-gray-900">
                  {mockSubscriptionData.price} {mockSubscriptionData.billingCycle !== 'N/A' && `/ ${mockSubscriptionData.billingCycle}`}
                  {isPremium && (
                    <div className="text-sm text-gray-600">
                      (${mockSubscriptionData.monthlyEquivalent}/month)
                    </div>
                  )}
                </div>
              </div>
              
              {isPremium && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Next Renewal</label>
                  <div className="text-lg font-medium text-gray-900">
                    {formatDate(mockSubscriptionData.nextRenewal)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 Your Features</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {mockSubscriptionData.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isPremium ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          {!isPremium ? (
            <Link 
              href="/pricing"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-semibold"
            >
              🚀 Upgrade to Premium
            </Link>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Cancel Subscription'}
              </button>
              
              <Link 
                href="/pricing"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                View All Plans
              </Link>
            </div>
          )}
          
          <button
            onClick={() => setMessage(null)}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Update Profile
          </button>
        </div>

        {/* Usage Stats */}
        {isPremium && (
          <div className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Your Teaching Impact</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">∞</div>
                <div className="text-sm text-gray-600">Lessons Available</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-1">5</div>
                <div className="text-sm text-gray-600">Differentiation Levels</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">24</div>
                <div className="text-sm text-gray-600">Days Until Renewal</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600 mb-1">98%</div>
                <div className="text-sm text-gray-600">Satisfaction Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-blue-800 mb-4">
            Our support team is here to assist you with any questions about your account or subscription.
          </p>
          <div className="flex gap-4">
            <a 
              href="mailto:support@peabody.ai"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Email Support
            </a>
            <Link 
              href="/"
              className="bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}