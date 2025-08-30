'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { trackAnalyticsEvent } from '../lib/usageTracker';

interface FreemiumLandingProps {
  onGetStarted: () => void;
  onUpgrade: () => void;
}

export const FreemiumLanding: React.FC<FreemiumLandingProps> = ({
  onGetStarted,
  onUpgrade
}) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Track landing page visit
    trackAnalyticsEvent('landing_page_visit', {
      userId: user?.id,
      hasAccount: !!user,
      timestamp: new Date().toISOString()
    });
  }, [user?.id]);

  const handleGetStarted = () => {
    trackAnalyticsEvent('get_started_clicked', {
      userId: user?.id,
      hasAccount: !!user,
      source: 'hero_section'
    });
    onGetStarted();
  };

  const handleUpgrade = () => {
    trackAnalyticsEvent('upgrade_button_clicked', {
      userId: user?.id,
      source: 'landing_page_hero'
    });
    onUpgrade();
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 min-h-screen">
      {/* Hero Section */}
      <section className={`pt-20 pb-16 px-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-7xl mx-auto text-center">
          {/* Main headline */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Turn Hours of Lesson Planning 
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> into Minutes</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Create engaging activities your students will love with AI-powered lesson plans, differentiation, and teacher scripts.
            </p>
          </div>

          {/* Social proof */}
          <div className="flex justify-center items-center space-x-8 mb-12 text-gray-500">
            <div className="flex items-center">
              <span className="text-yellow-400 text-xl">⭐⭐⭐⭐⭐</span>
              <span className="ml-2 font-medium">4.9/5 Teacher Rating</span>
            </div>
            <div className="flex items-center">
              <span className="text-2xl">📚</span>
              <span className="ml-2 font-medium">50,000+ Lessons Created</span>
            </div>
            <div className="flex items-center">
              <span className="text-2xl">⏰</span>
              <span className="ml-2 font-medium">6 Hours Saved/Week</span>
            </div>
          </div>

          {/* Video */}
          <div className="relative max-w-lg mx-auto mb-6">
            <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ paddingBottom: '54%' }}>
              <iframe
                src="https://www.youtube.com/embed/3cXjPsI4WZw?autoplay=1&loop=1&playlist=3cXjPsI4WZw&mute=1&controls=1&showinfo=0&rel=0&modestbranding=1&vq=hd720"
                title="How It Works - Lesson Plan Builder Demo"
                className="absolute top-0 left-0 w-full h-full"
                style={{ height: '110%', top: '-5%' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              🚀 Start Free (3 Lesson Plans)
            </button>
            <button
              onClick={handleUpgrade}
              className="border-2 border-purple-600 text-purple-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-purple-600 hover:text-white transition-all duration-200"
            >
              ✨ See Premium Features
            </button>
          </div>

          {/* Free trial highlight */}
          <div className="bg-white rounded-xl p-6 max-w-2xl mx-auto shadow-lg border border-purple-100">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-green-600 text-2xl">🎯</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Try 3 Lessons Free</h3>
            <p className="text-gray-600">
              No credit card required. Experience the power of AI-driven lesson planning with your first 3 activities completely free.
            </p>
          </div>
        </div>
      </section>

      {/* Value Comparison Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Choose Your Teaching Superpower</h2>
          <p className="text-xl text-gray-600 text-center mb-12">Start free, upgrade when you're ready</p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-gray-50 rounded-xl p-8 relative">
              <div className="text-center mb-6">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🆓</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Free Starter</h3>
                <p className="text-gray-600">Perfect for trying Peabody</p>
                <div className="text-4xl font-bold text-gray-800 mt-4">$0<span className="text-lg font-normal">/month</span></div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-lg">3 lesson plans per month</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-lg">Basic activity templates</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-lg">Print & copy functionality</span>
                </li>
                <li className="flex items-center text-gray-400">
                  <span className="text-gray-300 mr-3 text-xl">✗</span>
                  <span className="text-lg">No differentiation features</span>
                </li>
                <li className="flex items-center text-gray-400">
                  <span className="text-gray-300 mr-3 text-xl">✗</span>
                  <span className="text-lg">No Memory Bank storage</span>
                </li>
              </ul>
              
              <button
                onClick={handleGetStarted}
                className="w-full bg-gray-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-gray-700 transition-colors"
              >
                Start Free
              </button>
            </div>

            {/* Premium Tier */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 relative border-2 border-purple-200 shadow-lg">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                  🎯 Most Popular
                </span>
              </div>
              
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💎</span>
                </div>
                <h3 className="text-2xl font-bold text-purple-700 mb-2">Teacher Pro</h3>
                <p className="text-purple-600">Everything you need to excel</p>
                <div className="text-4xl font-bold text-purple-700 mt-4">
                  $7.99<span className="text-lg font-normal">/month</span>
                </div>
                <p className="text-sm text-purple-600 mt-1">School year pricing ($79.90 annually)</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-purple-500 mr-3 text-xl">✓</span>
                  <span className="text-lg"><strong>Unlimited lesson plans</strong></span>
                </li>
                <li className="flex items-center">
                  <span className="text-purple-500 mr-3 text-xl">✓</span>
                  <span className="text-lg"><strong>AI Differentiation Engine</strong> (ESL, IEP, grade levels)</span>
                </li>
                <li className="flex items-center">
                  <span className="text-purple-500 mr-3 text-xl">✓</span>
                  <span className="text-lg"><strong>Memory Bank</strong> - Save & reuse activities</span>
                </li>
                <li className="flex items-center">
                  <span className="text-purple-500 mr-3 text-xl">✓</span>
                  <span className="text-lg"><strong>CER Teacher Scripts</strong></span>
                </li>
                <li className="flex items-center">
                  <span className="text-purple-500 mr-3 text-xl">✓</span>
                  <span className="text-lg">Advanced subject-specific templates</span>
                </li>
                <li className="flex items-center">
                  <span className="text-purple-500 mr-3 text-xl">✓</span>
                  <span className="text-lg">Priority support</span>
                </li>
              </ul>
              
              <button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-md"
              >
                🚀 Upgrade Now
              </button>
              <p className="text-center text-xs text-purple-600 mt-2">Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Teacher Value Props */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Why Teachers Love Peabody</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4 text-center">⏰</div>
              <h3 className="text-2xl font-bold mb-4 text-center">Save 6+ Hours Weekly</h3>
              <p className="text-gray-600 text-center">
                Stop spending entire weekends planning. Generate engaging lessons in minutes, not hours.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4 text-center">🎯</div>
              <h3 className="text-2xl font-bold mb-4 text-center">Perfect Differentiation</h3>
              <p className="text-gray-600 text-center">
                One lesson becomes five versions automatically - below grade, at grade, above grade, ESL, and IEP adaptations.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4 text-center">💬</div>
              <h3 className="text-2xl font-bold mb-4 text-center">Teacher Scripts Included</h3>
              <p className="text-gray-600 text-center">
                Never wonder what to say. Get CER-based talking points and questions for every activity.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-2">How does the free trial work?</h3>
              <p className="text-gray-600">
                You get 3 completely free lesson plan generations per month. No credit card required, no strings attached. Perfect for trying out Peabody.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-2">What happens when I use my 3 free lessons?</h3>
              <p className="text-gray-600">
                Once you've created 3 lessons in a month, you'll be invited to upgrade to unlimited access. Your lesson count resets monthly on the 1st.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-2">How does the school-year pricing work?</h3>
              <p className="text-gray-600">
                Pay $79.90 upfront for the entire school year (August-May), which equals $7.99/month. You can also pay monthly at $9.99/month.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Yes! Cancel anytime with one click. You'll keep access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Teaching?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of teachers who are saving time and creating better lessons.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="bg-white text-purple-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              🚀 Start with 3 Free Lessons
            </button>
            <button
              onClick={handleUpgrade}
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-purple-700 transition-colors"
            >
              💎 Go Premium Now
            </button>
          </div>
          
          <p className="text-sm opacity-75 mt-4">
            No credit card required for free trial • 30-day money-back guarantee
          </p>
        </div>
      </section>
    </div>
  );
};