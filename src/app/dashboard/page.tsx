'use client'

import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import { trackAnalyticsEvent } from '../../lib/usageTracker';
import Navigation from '../../components/Navigation';
import Link from 'next/link';

function DashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const upgrade = searchParams.get('upgrade');
    if (upgrade === 'success') {
      setShowSuccessMessage(true);
      
      // Track successful upgrade
      trackAnalyticsEvent('upgrade_success_page_viewed', {
        userId: user?.id,
        source: 'stripe_redirect'
      });

      // Auto-hide success message after 10 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 10000);
    }
  }, [searchParams, user?.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Premium Success Message */}
        {showSuccessMessage && (
          <div className="mb-8 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 border-2 border-purple-200 rounded-xl p-8 shadow-xl">
            <div className="text-center">
              <div className="text-6xl mb-4">✨🎉✨</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                🚀 Welcome to Your Teaching Superpower! 
              </h2>
              <p className="text-xl text-gray-700 mb-6 max-w-2xl mx-auto">
                You've just unlocked unlimited lesson planning, intelligent differentiation, and your personal Memory Bank. 
                Time to transform how you teach! 
              </p>
              
              {/* Premium Features Highlight */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/80 rounded-lg p-4 shadow-sm">
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="font-semibold text-purple-700">Smart Differentiation</h3>
                  <p className="text-sm text-gray-600">5 versions per lesson automatically</p>
                </div>
                <div className="bg-white/80 rounded-lg p-4 shadow-sm">
                  <div className="text-2xl mb-2">💾</div>
                  <h3 className="font-semibold text-purple-700">Memory Bank</h3>
                  <p className="text-sm text-gray-600">Save & organize your best work</p>
                </div>
                <div className="bg-white/80 rounded-lg p-4 shadow-sm">
                  <div className="text-2xl mb-2">∞</div>
                  <h3 className="font-semibold text-purple-700">Unlimited Access</h3>
                  <p className="text-sm text-gray-600">Create as many lessons as you need</p>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  href="/"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg transform hover:scale-105"
                >
                  🚀 Create Your First Pro Lesson
                </Link>
                <Link 
                  href="/memory-bank"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg transform hover:scale-105"
                >
                  💾 Explore Memory Bank
                </Link>
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="text-purple-600 hover:text-purple-700 px-6 py-3 font-medium"
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="text-center py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {user ? `Hello ${user.name}!` : 'Please sign in to continue'}
          </p>

          {user ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                href="/"
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2">Create Lessons</h3>
                <p className="text-gray-600">Generate new lesson plans with intelligence</p>
              </Link>

              <Link 
                href="/memory-bank"
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">💾</div>
                <h3 className="text-xl font-semibold mb-2">Memory Bank</h3>
                <p className="text-gray-600">Access your saved lessons</p>
              </Link>

              <Link 
                href="/pricing"
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-xl font-semibold mb-2">Account Settings</h3>
                <p className="text-gray-600">Manage your subscription</p>
              </Link>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <p className="text-gray-600 mb-6">
                Sign in to access your personalized dashboard and start creating amazing lessons.
              </p>
              <Link 
                href="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Home Page
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}