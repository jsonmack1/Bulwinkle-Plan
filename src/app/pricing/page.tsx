'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { trackAnalyticsEvent, usageTracker } from '../../lib/usageTracker';
import Navigation from '../../components/Navigation';
import PromoCodeInput from '../../components/premium/PromoCodeInput';
import { AccountCreationModal } from '../../components/modals/AccountCreationModal';
import { useSubscription } from '../../lib/subscription-mock';
import Link from 'next/link';

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
    savings: 'Save 20%',
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
  const { isPremium, isHydrated } = useSubscription();
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [annualLoading, setAnnualLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [discountPreview, setDiscountPreview] = useState<any>(null);
  const [fingerprint, setFingerprint] = useState<string>('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  useEffect(() => {
    // Track pricing page view
    trackAnalyticsEvent('pricing_page_viewed', {
      userId: user?.id,
      hasAccount: !!user
    });

    // Initialize fingerprint for promo code tracking
    const initFingerprint = async () => {
      try {
        await usageTracker.initialize();
        const context = usageTracker.getTrackingContext();
        if (context) {
          setFingerprint(context.fingerprintHash);
        }
      } catch (error) {
        console.warn('Failed to initialize fingerprint:', error);
      }
    };

    initFingerprint();
  }, [user?.id]);


  const handlePromoApplied = (promo: any, discount: any) => {
    setAppliedPromo(promo);
    setDiscountPreview(discount);
    
    trackAnalyticsEvent('promo_code_applied_ui', {
      code: promo.code,
      type: promo.type,
      userId: user?.id,
      discount: discount
    });
  };

  const handlePromoRemoved = () => {
    if (appliedPromo) {
      trackAnalyticsEvent('promo_code_removed_ui', {
        code: appliedPromo.code,
        userId: user?.id
      });
    }
    
    setAppliedPromo(null);
    setDiscountPreview(null);
  };

  const handleAccountCreated = async (newUserId: string) => {
    setShowAccountModal(false);
    // Now proceed to checkout with the authenticated user
    await proceedToStripeCheckout(selectedPlan);
  };

  const handleFreePlan = () => {
    trackAnalyticsEvent('free_plan_selected', {
      userId: user?.id,
      source: 'pricing_page'
    });
    window.location.href = '/';
  };

  const handleUpgrade = async (selectedBillingPeriod: 'monthly' | 'annual') => {
    // Check if user is already premium
    if (isPremium) {
      setError('You are already a PRO member! Visit your account settings to manage your subscription.');
      return;
    }

    // Check if user has account first
    if (!user?.id) {
      setSelectedPlan(selectedBillingPeriod);
      setShowAccountModal(true);
      return;
    }
    
    // Proceed to Stripe checkout
    await proceedToStripeCheckout(selectedBillingPeriod);
  };

  const proceedToStripeCheckout = async (selectedBillingPeriod: 'monthly' | 'annual') => {
    const isMonthly = selectedBillingPeriod === 'monthly';
    const setLoadingFunc = isMonthly ? setMonthlyLoading : setAnnualLoading;
    
    setLoadingFunc(true);
    setError(null);

    try {
      const config = PRICING_CONFIG[selectedBillingPeriod];
      const finalAmount = config.billedAmount * 100; // Convert to cents
      
      console.log('🔍 Debug info:', {
        billingPeriod: selectedBillingPeriod,
        priceId: config.stripePriceId,
        finalAmount,
        env_monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
        env_annual: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID
      });
      
      trackAnalyticsEvent('pro_plan_selected', {
        billingPeriod: selectedBillingPeriod,
        originalAmount: config.billedAmount,
        finalAmount: finalAmount / 100,
        promoCode: appliedPromo?.code,
        userId: user?.id
      });

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: config.stripePriceId,
          billingPeriod: selectedBillingPeriod,
          userId: user?.id,
          promoCode: appliedPromo?.code,
          promoCodeData: appliedPromo,
          discountAmount: discountPreview ? discountPreview.discountAmount : 0,
          finalAmount: finalAmount,
          successUrl: `${window.location.origin}/dashboard?upgrade=success`,
          cancelUrl: `${window.location.origin}/pricing?checkout=cancelled`
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Checkout API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Failed to create checkout session: ${response.status} ${errorData}`);
      }

      const { checkoutUrl } = await response.json();
      
      trackAnalyticsEvent('stripe_checkout_initiated', {
        billingPeriod: selectedBillingPeriod,
        amount: config.billedAmount,
        userId: user?.id
      });

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
      
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      
      trackAnalyticsEvent('checkout_error', {
        error: err instanceof Error ? err.message : 'Unknown error',
        billingPeriod: selectedBillingPeriod,
        userId: user?.id
      });
    } finally {
      setLoadingFunc(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pricing-page">
        {/* Premium User Alert */}
        {isPremium && isHydrated && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 py-4 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center bg-green-100 rounded-full px-4 py-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <span className="text-green-800 font-semibold">You're already a PRO member!</span>
              </div>
              <p className="text-green-700 mt-2">
                Enjoying your premium features? 
                <Link href="/account-settings" className="ml-1 text-green-600 hover:text-green-500 font-medium underline">
                  Manage your subscription
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="text-center py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Choose Your Teaching 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Superpower</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Save hours every week with intelligence-powered lesson planning designed for real teachers
            </p>
            
          </div>
        </section>


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
        <div className="pricing-cards-grid max-w-7xl mx-auto px-4 mb-16">
          <div className="grid lg:grid-cols-3 gap-8">
            
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
                  <span className="text-gray-700">5 lesson plans per month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Basic activity templates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Print & copy functionality</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">5-second differentiation previews</span>
                </li>
                <li className="flex items-start opacity-50">
                  <span className="text-gray-300 text-xl mr-3 mt-0.5">✗</span>
                  <span className="text-gray-400">No Google Docs export</span>
                </li>
                <li className="flex items-start opacity-50">
                  <span className="text-gray-300 text-xl mr-3 mt-0.5">✗</span>
                  <span className="text-gray-400">No Memory Bank access</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">CER teacher scripts</span>
                </li>
              </ul>

              <button
                onClick={handleFreePlan}
                className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-colors border border-gray-300"
              >
                Start Free
              </button>
            </div>

            {/* Monthly Pro Card */}
            <div className="pricing-card-monthly bg-white rounded-xl border-2 border-blue-400 p-8 shadow-lg">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Teacher Pro Monthly</h3>
                <p className="text-gray-600 mb-6">Flexible monthly billing</p>
                <div className="price-large text-4xl font-bold text-gray-900 mb-2">
                  ${PRICING_CONFIG.monthly.price}
                  <span className="price-period text-base font-normal text-gray-600 ml-1">/ month</span>
                </div>
                <p className="text-sm text-gray-500">Recurring monthly billing</p>
                <div className="mt-2">
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    Memory Bank stays active
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-700 font-semibold">Unlimited lesson plan generation</span>
                    <p className="text-sm text-gray-500 mt-1">Create as many lessons as you need</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 text-xl mr-3 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-700 font-semibold">Intelligence Differentiation Engine</span>
                    <p className="text-sm text-gray-500 mt-1">5 automatic adaptations per lesson</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 text-xl mr-3 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-700 font-semibold">Memory Bank - Always accessible</span>
                    <p className="text-sm text-gray-500 mt-1">Your lessons stay saved as long as you're subscribed</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Export to PDF & Google Docs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Cancel anytime</span>
                </li>
              </ul>

              <button
                onClick={() => handleUpgrade('monthly')}
                disabled={monthlyLoading || isPremium}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  isPremium 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-default'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                {isPremium ? (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">✅</span>
                    Subscribed
                  </div>
                ) : monthlyLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Start Monthly Plan'
                )}
              </button>
              
              <p className="text-center text-xs text-gray-500 mt-3">
                30-day money-back guarantee
              </p>
            </div>

            {/* Annual Pro Card - Best Value */}
            <div className="pricing-card-annual bg-white rounded-xl border-2 border-orange-400 p-8 shadow-xl relative">
              {/* Best Value Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="savings-badge bg-gradient-to-r from-orange-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  🏆 BEST VALUE
                </span>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Teacher Pro Annual</h3>
                <p className="text-gray-600 mb-6">Best value for the school year</p>
                <div className="price-large text-4xl font-bold text-gray-900 mb-2">
                  $79.90
                  <span className="price-period text-base font-normal text-gray-600 ml-1">for the year</span>
                </div>
                <p className="text-sm text-gray-500">One-time payment for 10 months</p>
                <div className="mt-2">
                  <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                    Save 20% - School year aligned
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-700 font-semibold">Unlimited lesson plan generation</span>
                    <p className="text-sm text-gray-500 mt-1">Full access for 10 months</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 text-xl mr-3 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-700 font-semibold">Intelligence Differentiation Engine</span>
                    <p className="text-sm text-gray-500 mt-1">5 automatic adaptations per lesson</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 text-xl mr-3 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-700 font-semibold">Memory Bank - 10 month access</span>
                    <p className="text-sm text-gray-500 mt-1">Perfect for planning your entire school year</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Export to PDF & Google Docs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 text-xl mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">No recurring charges</span>
                </li>
              </ul>

              <button
                onClick={() => handleUpgrade('annual')}
                disabled={annualLoading || isPremium}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  isPremium 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-default'
                    : 'bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700'
                }`}
              >
                {isPremium ? (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">✅</span>
                    Subscribed
                  </div>
                ) : annualLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Get Annual Plan'
                )}
              </button>
              
              <p className="text-center text-xs text-gray-500 mt-3">
                30-day money-back guarantee
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
              {/* Testimonial 1 - Layla */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-100">
                <div className="text-4xl text-blue-500 mb-4">"</div>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  The Intelligent Sub Plans are a life saver! Full scripts and activities that keep the class in order and actually fun!
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    L
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900">Layla</div>
                    <div className="text-gray-600 text-sm">2nd Grade Teacher Special Ed</div>
                    <div className="text-gray-600 text-xs">Flowery Branch, GA</div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial 2 - Cindy */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl shadow-lg border border-purple-100">
                <div className="text-4xl text-purple-500 mb-4">"</div>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  The fact that these are standards aligned is the cherry on top, no going back for me!
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    C
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900">Cindy</div>
                    <div className="text-gray-600 text-sm">11th Grade Chemistry</div>
                    <div className="text-gray-600 text-xs">Valley Stream, NY</div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial 3 - Danielle */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl shadow-lg border border-green-100">
                <div className="text-4xl text-green-500 mb-4">"</div>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Removes the headaches of lesson planning, it even does the differentiation! So simple.
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    D
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900">Danielle</div>
                    <div className="text-gray-600 text-sm">8th Grade Science</div>
                    <div className="text-gray-600 text-xs">Huntington, NY</div>
                  </div>
                </div>
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
              Join top performing teachers who are saving time and creating better lessons with Peabody Pro.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleFreePlan}
                className="bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Start Free (5 Lessons)
              </button>
              <button
                onClick={() => handleUpgrade('monthly')}
                disabled={monthlyLoading || isPremium}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-colors disabled:opacity-50 ${
                  isPremium 
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isPremium ? '✅ Subscribed' : 'Monthly Pro - $9.99/mo'}
              </button>
              <button
                onClick={() => handleUpgrade('annual')}
                disabled={annualLoading || isPremium}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-colors border-2 border-orange-400 disabled:opacity-50 ${
                  isPremium 
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {isPremium ? '✅ Subscribed' : 'Annual Pro - as low as $7.99/mo'}
              </button>
            </div>
            
            <p className="text-sm opacity-75 mt-6">
              30-day money-back guarantee • Cancel anytime • No long-term commitment
            </p>
          </div>
        </section>
      </div>

      {/* Account Creation Modal */}
      <AccountCreationModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onSuccess={handleAccountCreated}
        remainingLessons={5}
        currentLesson={5}
        mode="required"
        selectedPlan={{
          name: selectedPlan === 'annual' ? 'School Year' : 'Monthly',
          price: selectedPlan === 'annual' ? PRICING_CONFIG.annual.price : PRICING_CONFIG.monthly.price,
          billing: selectedPlan
        }}
      />
    </div>
  );
}