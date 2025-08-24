'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { trackAnalyticsEvent } from '../../lib/usageTracker';
import Navigation from '../../components/Navigation';

interface PricingConfig {
  annual: {
    price: number;
    billedAmount: number;
    savings: string;
    stripePriceId: string;
  };
  monthly: {
    price: number;
    billedAmount: number;
    savings: null;
    stripePriceId: string;
  };
}

const PRICING_CONFIG: PricingConfig = {
  annual: {
    price: 7.99,
    billedAmount: 79.90,
    savings: '20% Savings',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID || 'price_annual'
  },
  monthly: {
    price: 9.99,
    billedAmount: 9.99,
    savings: null,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_monthly'
  }
};

const FEATURE_DESCRIPTIONS = {
  differentiation: "Create 5 versions of every lesson automatically - below grade, at grade, above grade, ESL, and IEP adaptations",
  memoryBank: "Save, organize, and reuse your most successful lessons with smart tagging and search",
  cerScripts: "Never wonder what to say - get research-based conversation starters and discussion questions",
  templates: "Subject-specific activities designed by master teachers for maximum engagement"
};

export default function PricingPage() {
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'annual' | 'monthly'>('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Track pricing page view
    trackAnalyticsEvent('pricing_page_viewed', {
      userId: user?.id,
      hasAccount: !!user
    });
  }, [user?.id]);

  const handleBillingToggle = (period: 'annual' | 'monthly') => {
    setBillingPeriod(period);
    trackAnalyticsEvent('billing_toggle_changed', {
      period,
      userId: user?.id
    });
  };

  const handleFreePlan = () => {
    trackAnalyticsEvent('free_plan_selected', {
      userId: user?.id,
      source: 'pricing_page'
    });
    window.location.href = '/';
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      trackAnalyticsEvent('pro_plan_selected', {
        billingPeriod,
        amount: PRICING_CONFIG[billingPeriod].billedAmount,
        userId: user?.id
      });

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: PRICING_CONFIG[billingPeriod].stripePriceId,
          billingPeriod: billingPeriod,
          userId: user?.id,
          successUrl: `${window.location.origin}/dashboard?upgrade=success`,
          cancelUrl: `${window.location.origin}/pricing?checkout=cancelled`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();
      
      trackAnalyticsEvent('stripe_checkout_initiated', {
        billingPeriod,
        amount: PRICING_CONFIG[billingPeriod].billedAmount,
        userId: user?.id
      });

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
      
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      
      trackAnalyticsEvent('checkout_error', {
        error: err instanceof Error ? err.message : 'Unknown error',
        billingPeriod,
        userId: user?.id
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pricing-page">
        {/* Hero Section */}
        <section className="text-center py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Choose Your Teaching 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Superpower</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Save hours every week with AI-powered lesson planning designed for real teachers
            </p>
            
            {/* Social proof */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 mb-12">
              <div className="flex items-center">
                <span className="text-yellow-400 text-lg mr-2">⭐⭐⭐⭐⭐</span>
                <span className="font-medium">4.9/5 from 2,000+ teachers</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-2">📚</span>
                <span className="font-medium">50,000+ lessons created</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-2">⏰</span>
                <span className="font-medium">Average saved: 6.2 hours/week</span>
              </div>
            </div>
          </div>
        </section>

        {/* Billing Toggle */}
        <div className="billing-toggle-section flex justify-center mb-12 px-4">
          <div className="bg-white rounded-full p-1 shadow-lg border border-gray-200">
            <div className="flex relative">
              <button
                onClick={() => handleBillingToggle('monthly')}
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 relative z-10 ${
                  billingPeriod === 'monthly'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => handleBillingToggle('annual')}
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 relative z-10 ${
                  billingPeriod === 'annual'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
                {billingPeriod === 'annual' && (
                  <span className="ml-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                    20% OFF
                  </span>
                )}
              </button>
              
              {/* Sliding background */}
              <div
                className={`absolute top-1 bottom-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-200 ${
                  billingPeriod === 'annual'
                    ? 'right-1 left-[calc(50%-0.25rem)]'
                    : 'left-1 right-[calc(50%-0.25rem)]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto px-4 mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 underline mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="pricing-cards-grid max-w-6xl mx-auto px-4 mb-16">
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Free Tier Card */}
            <div className="pricing-card-free bg-white rounded-xl border-2 border-gray-200 p-8 shadow-lg">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <p className="text-gray-600 mb-6">Perfect for trying Peabody</p>
                <div className="price-large text-4xl font-bold text-gray-900 mb-2">
                  $0
                  <span className="price-period text-base font-normal text-gray-600 ml-1">/ month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">3 lesson plans per month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Basic activity templates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Print & copy functionality</span>
                </li>
                <li className="flex items-start opacity-50">
                  <span className="text-gray-300 text-xl mr-3 mt-0.5">✗</span>
                  <span className="text-gray-400">No differentiation features</span>
                </li>
                <li className="flex items-start opacity-50">
                  <span className="text-gray-300 text-xl mr-3 mt-0.5">✗</span>
                  <span className="text-gray-400">No Memory Bank access</span>
                </li>
                <li className="flex items-start opacity-50">
                  <span className="text-gray-300 text-xl mr-3 mt-0.5">✗</span>
                  <span className="text-gray-400">No CER teacher scripts</span>
                </li>
              </ul>

              <button
                onClick={handleFreePlan}
                className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-colors border border-gray-300"
              >
                Start Free
              </button>
            </div>

            {/* Professional Tier Card */}
            <div className="pricing-card-pro bg-white rounded-xl border-2 border-orange-400 p-8 shadow-xl relative">
              {/* Best Value Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="savings-badge bg-gradient-to-r from-orange-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  🏆 BEST VALUE
                </span>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Teacher Pro</h3>
                <p className="text-gray-600 mb-6">Everything you need to excel</p>
                <div className="price-large text-4xl font-bold text-gray-900 mb-2">
                  ${PRICING_CONFIG[billingPeriod].price}
                  <span className="price-period text-base font-normal text-gray-600 ml-1">/ month</span>
                </div>
                <p className="text-sm text-gray-500">
                  {billingPeriod === 'annual' 
                    ? `Billed annually ($${PRICING_CONFIG[billingPeriod].billedAmount})`
                    : 'Billed monthly'
                  }
                </p>
                {billingPeriod === 'annual' && (
                  <div className="mt-2">
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {PRICING_CONFIG[billingPeriod].savings}
                    </span>
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-700 font-semibold">Unlimited lesson plan generation</span>
                    <p className="text-sm text-gray-500 mt-1">Create as many lessons as you need, when you need them</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 text-xl mr-3 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-700 font-semibold">AI Differentiation Engine</span>
                    <p className="text-sm text-gray-500 mt-1">{FEATURE_DESCRIPTIONS.differentiation}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 text-xl mr-3 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-700 font-semibold">Memory Bank - Save & organize lessons</span>
                    <p className="text-sm text-gray-500 mt-1">{FEATURE_DESCRIPTIONS.memoryBank}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 text-xl mr-3 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-700 font-semibold">CER Teacher Scripts & conversation guides</span>
                    <p className="text-sm text-gray-500 mt-1">{FEATURE_DESCRIPTIONS.cerScripts}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Advanced subject-specific templates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Export to PDF & Google Docs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Priority email support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Cancel anytime</span>
                </li>
              </ul>

              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-purple-700 transition-all duration-200 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Start Subscription'
                )}
              </button>
              
              <p className="text-center text-xs text-gray-500 mt-3">
                30-day money-back guarantee • No long-term commitment
              </p>
            </div>
          </div>
        </div>

        {/* Teacher Value Props */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-4">Why Teachers Choose Peabody Pro</h2>
            <p className="text-xl text-gray-600 text-center mb-12">Real benefits for real teachers</p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-5xl mb-4">⏰</div>
                <h3 className="text-2xl font-bold mb-4">Save 6+ Hours Weekly</h3>
                <p className="text-gray-600">
                  Stop spending entire weekends planning. Generate engaging, standards-aligned lessons in minutes, not hours.
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold mb-4">Perfect Differentiation</h3>
                <p className="text-gray-600">
                  One lesson becomes five versions automatically - below grade, at grade, above grade, ESL, and IEP adaptations.
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-5xl mb-4">💬</div>
                <h3 className="text-2xl font-bold mb-4">Never Wonder What to Say</h3>
                <p className="text-gray-600">
                  Get research-based conversation starters, discussion questions, and CER frameworks for every lesson.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">What Teachers Are Saying</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="text-yellow-400 text-xl">⭐⭐⭐⭐⭐</div>
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "Peabody Pro saved my career! I was burning out from spending 10+ hours every weekend planning. Now I spend 2 hours and get better, more engaging lessons."
                </p>
                <div className="font-semibold text-gray-900">Sarah M.</div>
                <div className="text-sm text-gray-600">4th Grade Teacher, Austin, TX</div>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="text-yellow-400 text-xl">⭐⭐⭐⭐⭐</div>
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "The differentiation feature is a game-changer. My ESL students and IEP kids finally get activities perfectly suited to their level. It's like having a co-teacher!"
                </p>
                <div className="font-semibold text-gray-900">Carlos R.</div>
                <div className="text-sm text-gray-600">High School Science, Los Angeles, CA</div>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="text-yellow-400 text-xl">⭐⭐⭐⭐⭐</div>
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "Best investment I've made as a teacher. The Memory Bank keeps all my successful lessons organized, and the CER scripts help me lead better discussions."
                </p>
                <div className="font-semibold text-gray-900">Jennifer K.</div>
                <div className="text-sm text-gray-600">8th Grade ELA, Denver, CO</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-xl mb-3">How does the annual pricing work?</h3>
                <p className="text-gray-600">
                  When you choose annual billing, you pay $79.90 upfront for the entire year, which works out to just $7.99 per month. You save 20% compared to paying monthly at $9.99/month.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-xl mb-3">Can I switch from monthly to annual billing?</h3>
                <p className="text-gray-600">
                  Absolutely! You can upgrade to annual billing anytime from your account settings. We'll prorate your remaining monthly subscription and apply it to your annual plan.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-xl mb-3">What happens if I need to cancel?</h3>
                <p className="text-gray-600">
                  You can cancel anytime with one click in your account settings. You'll keep full access to all Pro features until the end of your current billing period. No cancellation fees.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-xl mb-3">Do you offer school or district pricing?</h3>
                <p className="text-gray-600">
                  Yes! We offer volume discounts for schools and districts. Contact us at schools@peabody.app for custom pricing and admin features like usage analytics and teacher management.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-xl mb-3">Is there a money-back guarantee?</h3>
                <p className="text-gray-600">
                  Yes! We offer a 30-day money-back guarantee. If Peabody Pro doesn't save you time and improve your lessons, we'll refund your payment in full.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Teaching?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join over 2,000 teachers who are saving time and creating better lessons with Peabody Pro.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleFreePlan}
                className="bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Start Free (3 Lessons)
              </button>
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="bg-orange-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-orange-600 transition-colors border-2 border-orange-400 disabled:opacity-50"
              >
                Go Pro Now - ${PRICING_CONFIG[billingPeriod].price}/mo
              </button>
            </div>
            
            <p className="text-sm opacity-75 mt-6">
              30-day money-back guarantee • Cancel anytime • No long-term commitment
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}