'use client'

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface DevToolsProps {
  className?: string;
}

const DevTools: React.FC<DevToolsProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS !== 'true') {
    return null;
  }

  const handleDemoAccountAction = async (action: 'create' | 'login' | 'reset', type?: 'free' | 'premium') => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/dev/demo-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, type })
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ ${result.message}`);
        
        if (result.credentials) {
          setMessage(prev => `${prev}\nCredentials: ${result.credentials.email} / ${result.credentials.password}`);
        }

        // If login action, refresh the page to reflect the login
        if (action === 'login' || action === 'create') {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Demo account action failed:', error);
      setMessage('❌ Failed to execute demo account action');
    } finally {
      setLoading(false);
    }
  };

  const resetUsageTracking = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Clear localStorage usage data
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const fallbackKey = `peabody_usage_${currentYear}_${currentMonth}`;
      
      localStorage.removeItem(fallbackKey);
      localStorage.removeItem('peabody_session_id');
      localStorage.removeItem('peabody_usage_cache');
      
      setMessage('✅ Usage tracking data cleared');
      
      // Refresh after a delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to reset usage tracking:', error);
      setMessage('❌ Failed to reset usage tracking');
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className={`dev-tools-collapsed fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
          title="Open Dev Tools"
        >
          🛠️
        </button>
      </div>
    );
  }

  return (
    <div className={`dev-tools-expanded fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-900">Dev Tools</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700 text-lg"
        >
          ✕
        </button>
      </div>

      {/* Current User Status */}
      <div className="mb-4 p-2 bg-gray-50 rounded text-xs">
        <strong>Current User:</strong><br />
        {user ? (
          <>
            {user.email}<br />
            {user.subscription?.plan === 'premium' ? '👑 Premium' : '🆓 Free'}
          </>
        ) : (
          'Not logged in'
        )}
      </div>

      {/* Demo Account Actions */}
      <div className="space-y-2 mb-4">
        <div className="text-sm font-semibold text-gray-700">Demo Accounts:</div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleDemoAccountAction('create', 'free')}
            disabled={loading}
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Create Free Demo
          </button>
          
          <button
            onClick={() => handleDemoAccountAction('create', 'premium')}
            disabled={loading}
            className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Create Pro Demo
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleDemoAccountAction('login')}
            disabled={loading}
            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
          >
            Login Demo
          </button>
          
          <button
            onClick={() => handleDemoAccountAction('reset')}
            disabled={loading}
            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Usage Tracking */}
      <div className="space-y-2 mb-4">
        <div className="text-sm font-semibold text-gray-700">Usage Tracking:</div>
        
        <button
          onClick={resetUsageTracking}
          disabled={loading}
          className="w-full px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Reset Usage Limits
        </button>
      </div>

      {/* Promo Codes */}
      <div className="space-y-2 mb-4">
        <div className="text-sm font-semibold text-gray-700">Test Promo Codes:</div>
        <div className="text-xs text-gray-600 space-y-1">
          <div><code className="bg-gray-100 px-1 rounded">TELESCOPE2025</code> - 3 months free</div>
          <div><code className="bg-gray-100 px-1 rounded">PAPERCLIP</code> - 1 month free</div>
          <div><code className="bg-gray-100 px-1 rounded">MIDNIGHT50</code> - 50% off</div>
          <div><code className="bg-gray-100 px-1 rounded">DEVTEST</code> - 12 months free</div>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
          <span className="text-xs text-gray-600">Working...</span>
        </div>
      )}

      {/* Message display */}
      {message && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-xs whitespace-pre-line">
          {message}
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        Environment: {process.env.NODE_ENV || 'development'}
      </div>
    </div>
  );
};

export default DevTools;