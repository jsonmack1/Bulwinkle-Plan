'use client'

import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import { trackAnalyticsEvent } from '../../lib/usageTracker';
import Navigation from '../../components/Navigation';
import Link from 'next/link';
import { useSubscription } from '../../lib/subscription';
import PremiumDashboardModal from '../../components/modals/PremiumDashboardModal';

function DashboardContent() {
  const { user } = useAuth();
  const { isPremium, isHydrated, setStatus } = useSubscription();
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(true);

  // Check for upgrade success BEFORE checking if premium
  useEffect(() => {
    const upgrade = searchParams.get('upgrade');
    if (upgrade === 'success') {
      console.log('🎉 Stripe success detected - setting premium status');
      
      // CRITICAL: Set subscription status to premium after successful payment
      setStatus('premium');
      
      // Track successful upgrade
      trackAnalyticsEvent('upgrade_success_page_viewed', {
        userId: user?.id,
        source: 'stripe_redirect'
      });
    }
  }, [searchParams, user?.id, setStatus]);

  // Show loading state while checking subscription
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Peabody</h1>
            <p className="text-xl text-gray-600 mb-8">Please sign in to access your dashboard</p>
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

  // Premium user gets the premium dashboard modal
  if (isPremium) {
    return (
      <>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center py-16">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome back, {user.name}!</h1>
              <p className="text-xl text-gray-600 mb-8">Your PRO dashboard is loading...</p>
            </div>
          </div>
        </div>
        
        <PremiumDashboardModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  // Free user gets the basic dashboard with upgrade prompts
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Free User Dashboard */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome, {user.name}!
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            You're on the free plan. Upgrade to unlock unlimited lessons and premium features.
          </p>
          <Link 
            href="/pricing"
            className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            Upgrade to Pro →
          </Link>
        </div>

        {/* Basic Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link 
            href="/?builder=true"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Create Lessons</h3>
            <p className="text-gray-600">Generate lesson plans (5 per month)</p>
            <div className="text-sm text-orange-600 mt-2 font-medium">Free Plan</div>
          </Link>

          <Link 
            href="/memory-bank"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-4">💾</div>
            <h3 className="text-xl font-semibold mb-2">Memory Bank</h3>
            <p className="text-gray-600">Limited storage for saved lessons</p>
            <div className="text-sm text-orange-600 mt-2 font-medium">Upgrade for Unlimited</div>
          </Link>

          <Link 
            href="/account-settings"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold mb-2">Account Settings</h3>
            <p className="text-gray-600">Manage your account</p>
            <div className="text-sm text-blue-600 mt-2 font-medium">Free Account</div>
          </Link>
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