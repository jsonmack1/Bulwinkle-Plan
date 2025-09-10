'use client'

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Force Subscription Refresh Component
 * For testing and debugging subscription status
 */
export default function ForceSubscriptionRefresh() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSubscription = async () => {
    if (!user?.id) {
      setResult({ error: 'No user logged in' });
      return;
    }

    setLoading(true);
    try {
      // Test subscription API
      const response = await fetch(`/api/user/subscription?userId=${user.id}`);
      const data = await response.json();
      
      setResult(data);
      
      // Trigger subscription refresh events
      window.dispatchEvent(new Event('subscription-changed'));
      window.dispatchEvent(new Event('real-subscription-refresh'));
      
      console.log('🔄 Subscription refresh triggered', data);
      
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const forceReload = () => {
    window.location.reload();
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <h3 className="font-bold text-yellow-800 mb-2">🧪 Subscription Test Panel</h3>
      
      <div className="space-x-2 mb-2">
        <button
          onClick={testSubscription}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Subscription'}
        </button>
        
        <button
          onClick={forceReload}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          Force Reload
        </button>
      </div>

      {user && (
        <div className="text-sm text-gray-600 mb-2">
          User: {user.email} (ID: {user.id})
        </div>
      )}

      {result && (
        <div className="text-sm">
          <strong>API Result:</strong>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.subscription && (
            <div className="mt-2 p-2 bg-white rounded border">
              <div className="font-semibold">
                Status: {result.subscription.isPremium ? '✅ PREMIUM' : '❌ FREE'}
              </div>
              <div>isPremium: {result.subscription.isPremium ? 'true' : 'false'}</div>
              <div>isActive: {result.subscription.isActive ? 'true' : 'false'}</div>
              <div>Plan: {result.subscription.plan}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}