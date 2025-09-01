'use client'

import React from 'react';
import { trackAnalyticsEvent } from '../../lib/usageTracker';

interface UsageMeterProps {
  userId?: string;
  currentUsage: number;
  limit: number;
  subscriptionStatus: 'free' | 'premium';
  resetDate: Date;
  onUpgradeClick?: () => void;
  className?: string;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({
  userId,
  currentUsage,
  limit,
  subscriptionStatus,
  resetDate,
  onUpgradeClick,
  className = ''
}) => {
  const remaining = Math.max(0, limit - currentUsage);
  const percentage = Math.min((currentUsage / limit) * 100, 100);
  const isOverLimit = currentUsage >= limit;

  const handleUpgradeClick = () => {
    trackAnalyticsEvent('upgrade_button_clicked', {
      source: 'usage_meter',
      currentUsage,
      limit,
      subscriptionStatus,
      userId
    });
    
    window.location.href = '/pricing';
  };

  const getStatusColor = () => {
    if (subscriptionStatus === 'premium') return 'bg-green-500';
    if (isOverLimit) return 'bg-red-500';
    if (remaining <= 1) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getStatusMessage = () => {
    if (subscriptionStatus === 'premium') {
      return '✨ Premium - Unlimited lessons';
    }
    if (isOverLimit) {
      return '🚫 Limit reached - Upgrade for unlimited';
    }
    if (remaining === 1) {
      return '⚠️ Last free lesson this month!';
    }
    if (remaining === 0) {
      return '🎯 5 free lessons used - Upgrade now';
    }
    return `${remaining} free lesson${remaining !== 1 ? 's' : ''} remaining`;
  };

  const formatResetDate = () => {
    const now = new Date();
    const diffTime = resetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      return 'tomorrow';
    } else if (diffDays <= 7) {
      return `in ${diffDays} days`;
    } else {
      return resetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (subscriptionStatus === 'premium') {
    return (
      <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span className="font-medium text-green-800">
              ✨ Premium Member - Unlimited Lessons
            </span>
          </div>
          <div className="text-sm text-green-600">
            No limits! 🚀
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor()}`}></div>
          <span className="text-sm font-medium text-gray-700">
            Monthly Usage
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {currentUsage}/{limit}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>

      {/* Status message */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${
          isOverLimit ? 'text-red-600' : 
          remaining <= 1 ? 'text-yellow-600' : 
          'text-gray-600'
        }`}>
          {getStatusMessage()}
        </span>
        
        {subscriptionStatus === 'free' && (
          <button
            onClick={handleUpgradeClick}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              isOverLimit || remaining <= 1
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            }`}
          >
            {isOverLimit ? 'PRO starting at $9.99/mo' : 'PRO starting at $9.99/mo'}
          </button>
        )}
      </div>

      {/* Reset date info */}
      {subscriptionStatus === 'free' && !isOverLimit && (
        <div className="mt-2 text-xs text-gray-500">
          Usage resets {formatResetDate()}
        </div>
      )}

      {/* Call to action for over-limit users */}
      {isOverLimit && subscriptionStatus === 'free' && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-sm text-red-700 mb-3">
            You've reached your free limit for this month.
          </div>
          
          {/* Usage-focused Value Propositions */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center text-xs">
              <svg className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Unlimited lesson generation</span>
            </div>
            <div className="flex items-center text-xs">
              <svg className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Auto-differentiation engine</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-600">
              Next reset: {formatResetDate()}
            </span>
            <button
              onClick={handleUpgradeClick}
              className="text-xs bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700 transition-colors"
            >
              PRO starting at $9.99/mo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};