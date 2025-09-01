'use client'

import React, { useState, useEffect } from 'react';
import { trackAnalyticsEvent } from '../../lib/usageTracker';

interface AnalyticsData {
  overview: {
    totalEvents: number;
    newUsers: number;
    premiumUsers: number;
    totalLessonsGenerated: number;
    eventsByCategory: Record<string, number>;
  };
  conversion: {
    funnel: {
      landing_page_visit: number;
      first_generation_complete: number;
      account_created: number;
      limit_warning_shown: number;
      paywall_encountered: number;
      stripe_checkout_initiated: number;
      subscription_completed: number;
    };
    conversionRates: {
      visitToGeneration: number;
      generationToAccount: number;
      paywallToCheckout: number;
      checkoutToSubscription: number;
    };
  };
  usage: {
    totalLessons: number;
    uniqueUsers: number;
    averageLessonsPerUser: number;
    featureUsage: Record<string, number>;
  };
  churn: {
    totalChurnEvents: number;
    churnReasons: Record<string, number>;
    activeSubscriptions: number;
  };
}

interface AnalyticsDashboardProps {
  adminKey: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  adminKey
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedView, setSelectedView] = useState<'overview' | 'conversion' | 'usage' | 'churn'>('overview');

  const fetchAnalytics = async (type: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        adminKey
      });

      const response = await fetch(`/api/analytics/track?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadAllAnalytics = async () => {
    const [overview, conversion, usage, churn] = await Promise.all([
      fetchAnalytics('overview'),
      fetchAnalytics('conversion'),
      fetchAnalytics('usage'),
      fetchAnalytics('churn')
    ]);

    if (overview && conversion && usage && churn) {
      setAnalyticsData({
        overview,
        conversion,
        usage,
        churn
      });
    }
  };

  useEffect(() => {
    loadAllAnalytics();
  }, [dateRange, adminKey]);

  const renderOverviewSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Events</h3>
        <p className="text-3xl font-bold text-blue-600">{analyticsData?.overview.totalEvents?.toLocaleString() || 0}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">New Users</h3>
        <p className="text-3xl font-bold text-green-600">{analyticsData?.overview.newUsers?.toLocaleString() || 0}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Premium Users</h3>
        <p className="text-3xl font-bold text-purple-600">{analyticsData?.overview.premiumUsers?.toLocaleString() || 0}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Lessons Generated</h3>
        <p className="text-3xl font-bold text-orange-600">{analyticsData?.overview.totalLessonsGenerated?.toLocaleString() || 0}</p>
      </div>
    </div>
  );

  const renderConversionFunnel = () => {
    const funnel = analyticsData?.conversion.funnel;
    const rates = analyticsData?.conversion.conversionRates;
    
    if (!funnel || !rates) return null;

    const funnelSteps = [
      { name: 'Landing Page Visits', value: funnel.landing_page_visit, color: 'bg-blue-500' },
      { name: 'First Lesson Generated', value: funnel.first_generation_complete, color: 'bg-green-500' },
      { name: 'Account Created', value: funnel.account_created, color: 'bg-yellow-500' },
      { name: 'Paywall Encountered', value: funnel.paywall_encountered, color: 'bg-orange-500' },
      { name: 'Checkout Started', value: funnel.stripe_checkout_initiated, color: 'bg-red-500' },
      { name: 'Subscription Completed', value: funnel.subscription_completed, color: 'bg-purple-500' },
    ];

    return (
      <div className="space-y-6">
        {/* Conversion rates */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <h4 className="text-sm font-medium text-gray-600">Visit → Generation</h4>
            <p className="text-2xl font-bold text-blue-600">{rates.visitToGeneration.toFixed(1)}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <h4 className="text-sm font-medium text-gray-600">Generation → Account</h4>
            <p className="text-2xl font-bold text-green-600">{rates.generationToAccount.toFixed(1)}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <h4 className="text-sm font-medium text-gray-600">Paywall → Checkout</h4>
            <p className="text-2xl font-bold text-orange-600">{rates.paywallToCheckout.toFixed(1)}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <h4 className="text-sm font-medium text-gray-600">Checkout → Subscription</h4>
            <p className="text-2xl font-bold text-purple-600">{rates.checkoutToSubscription.toFixed(1)}%</p>
          </div>
        </div>

        {/* Funnel visualization */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
          <div className="space-y-4">
            {funnelSteps.map((step, index) => {
              const maxValue = Math.max(...funnelSteps.map(s => s.value));
              const width = (step.value / maxValue) * 100;
              
              return (
                <div key={step.name} className="flex items-center">
                  <div className="w-40 text-sm text-gray-600">{step.name}</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-6">
                      <div 
                        className={`h-6 rounded-full ${step.color} flex items-center justify-end pr-2`}
                        style={{ width: `${width}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {step.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderUsageSection = () => {
    const usage = analyticsData?.usage;
    if (!usage) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Lessons</h3>
            <p className="text-3xl font-bold text-blue-600">{usage.totalLessons.toLocaleString()}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Unique Users</h3>
            <p className="text-3xl font-bold text-green-600">{usage.uniqueUsers.toLocaleString()}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Avg Lessons/User</h3>
            <p className="text-3xl font-bold text-purple-600">{usage.averageLessonsPerUser.toFixed(1)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Feature Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(usage.featureUsage).map(([feature, count]) => (
              <div key={feature} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600 capitalize">{feature.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-gray-900">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderChurnSection = () => {
    const churn = analyticsData?.churn;
    if (!churn) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Churn Events</h3>
            <p className="text-3xl font-bold text-red-600">{churn.totalChurnEvents.toLocaleString()}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Subscriptions</h3>
            <p className="text-3xl font-bold text-green-600">{churn.activeSubscriptions.toLocaleString()}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Churn Rate</h3>
            <p className="text-3xl font-bold text-orange-600">
              {churn.activeSubscriptions > 0 
                ? ((churn.totalChurnEvents / churn.activeSubscriptions) * 100).toFixed(1) 
                : 0}%
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Churn Reasons</h3>
          <div className="space-y-3">
            {Object.entries(churn.churnReasons).map(([reason, count]) => (
              <div key={reason} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-700 capitalize">{reason.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-red-600">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Analytics</h2>
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadAllAnalytics}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Peabody Analytics Dashboard</h1>
          
          {/* Date range selector */}
          <div className="flex items-center space-x-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              onClick={loadAllAnalytics}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Navigation tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {['overview', 'conversion', 'usage', 'churn'].map((view) => (
                <button
                  key={view}
                  onClick={() => setSelectedView(view as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    selectedView === view
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {view}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading analytics...</span>
          </div>
        )}

        {!loading && analyticsData && (
          <div>
            {selectedView === 'overview' && renderOverviewSection()}
            {selectedView === 'conversion' && renderConversionFunnel()}
            {selectedView === 'usage' && renderUsageSection()}
            {selectedView === 'churn' && renderChurnSection()}
          </div>
        )}
      </div>
    </div>
  );
};