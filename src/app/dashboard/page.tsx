'use client'

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import { trackAnalyticsEvent } from '../../lib/usageTracker';
import Navigation from '../../components/Navigation';
import Link from 'next/link';

export default function DashboardPage() {
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
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-4xl mr-4">🎉</div>
              <div>
                <h2 className="text-2xl font-bold text-green-900 mb-2">
                  Welcome to Peabody Pro!
                </h2>
                <p className="text-green-700 mb-4">
                  Your subscription is now active. You have unlimited access to all premium features!
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="/"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    🚀 Start Creating Lessons
                  </Link>
                  <Link 
                    href="/memory-bank"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    💾 Explore Memory Bank
                  </Link>
                  <button
                    onClick={() => setShowSuccessMessage(false)}
                    className="text-green-600 hover:text-green-700 px-4 py-2"
                  >
                    Dismiss
                  </button>
                </div>
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
                <p className="text-gray-600">Generate new lesson plans with AI</p>
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