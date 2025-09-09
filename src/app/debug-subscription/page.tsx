'use client'

import React, { useState, useEffect } from 'react';
import { useSubscription } from '../../lib/subscription';
import Navigation from '../../components/Navigation';

export default function DebugSubscriptionPage() {
  const { status, isPremium, isHydrated } = useSubscription();
  const [localStorageValue, setLocalStorageValue] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalStorageValue(localStorage.getItem('mockSubscription'));
    }
  }, [status]);

  const handleSetPremium = () => {
    console.log('Premium status would be set via database');
  };

  const handleSetFree = () => {
    console.log('Free status would be set via database');
  };

  const handleClearStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔧 Subscription Debug Tool</h1>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Status</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">useSubscription() Status</label>
              <div className="text-2xl font-bold text-purple-600">{status}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">isPremium</label>
              <div className={`text-2xl font-bold ${isPremium ? 'text-green-600' : 'text-red-600'}`}>
                {isPremium ? 'TRUE' : 'FALSE'}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">isHydrated</label>
              <div className={`text-2xl font-bold ${isHydrated ? 'text-green-600' : 'text-orange-600'}`}>
                {isHydrated ? 'TRUE' : 'FALSE'}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">localStorage Value</label>
              <div className="text-lg font-mono text-gray-800">
                {localStorageValue || 'null'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Controls</h2>
          
          <div className="flex gap-4">
            <button
              onClick={handleSetPremium}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Set Premium
            </button>
            
            <button
              onClick={handleSetFree}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Set Free
            </button>
            
            <button
              onClick={handleClearStorage}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear & Reload
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard Test</h2>
          <p className="text-gray-600 mb-4">
            Use the buttons above to change your subscription status, then visit the dashboard to see how it behaves.
          </p>
          
          <div className="flex gap-4">
            <a 
              href="/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </a>
            
            <a 
              href="/memory-bank"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Test Memory Bank
            </a>
            
            <a 
              href="/account-settings"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Test Account Settings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}