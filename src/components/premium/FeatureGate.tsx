'use client'

import React, { useState } from 'react';
import { trackAnalyticsEvent } from '../../lib/usageTracker';

interface FeatureGateProps {
  featureName: string;
  subscriptionStatus: 'free' | 'premium';
  userId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showTeaser?: boolean;
  onUpgradeClick?: () => void;
}

interface FeatureTeaserProps {
  featureName: string;
  userId?: string;
  onUpgradeClick?: () => void;
  children: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  featureName,
  subscriptionStatus,
  userId,
  children,
  fallback,
  showTeaser = true,
  onUpgradeClick
}) => {
  const [hasTrackedView, setHasTrackedView] = useState(false);

  // Track feature gate view (only once per component)
  React.useEffect(() => {
    if (!hasTrackedView && subscriptionStatus === 'free') {
      trackAnalyticsEvent('feature_gate_viewed', {
        featureName,
        userId,
        subscriptionStatus
      });
      setHasTrackedView(true);
    }
  }, [featureName, userId, subscriptionStatus, hasTrackedView]);

  // Premium users get access
  if (subscriptionStatus === 'premium') {
    return <>{children}</>;
  }

  // Show teaser or fallback for free users
  if (showTeaser) {
    return (
      <FeatureTeaser 
        featureName={featureName} 
        userId={userId} 
        onUpgradeClick={onUpgradeClick}
      >
        {children}
      </FeatureTeaser>
    );
  }

  return <>{fallback}</>;
};

export const FeatureTeaser: React.FC<FeatureTeaserProps> = ({
  featureName,
  userId,
  onUpgradeClick,
  children
}) => {
  const handleUpgradeClick = () => {
    trackAnalyticsEvent('feature_teaser_clicked', {
      feature: featureName,
      userId,
      source: 'feature_gate'
    });

    if (onUpgradeClick) {
      onUpgradeClick();
    }
  };

  const getFeatureDetails = (feature: string) => {
    const features: Record<string, { title: string; description: string; icon: string; benefits: string[] }> = {
      differentiation: {
        title: 'AI Differentiation Engine',
        description: 'Automatically create versions for ESL learners, IEP students, and different grade levels',
        icon: '🎯',
        benefits: [
          'ESL-friendly adaptations',
          'IEP accommodations',
          'Multiple reading levels',
          'Visual supports included'
        ]
      },
      memory_bank: {
        title: 'Memory Bank',
        description: 'Save, organize, and reuse your best lesson plans and activities',
        icon: '💾',
        benefits: [
          'Save unlimited lessons',
          'Smart organization',
          'Easy searching & tagging',
          'Share with colleagues'
        ]
      },
      cer_scripts: {
        title: 'CER Teacher Scripts',
        description: 'Get conversation starters and discussion prompts for every lesson',
        icon: '💬',
        benefits: [
          'Evidence-based questions',
          'Student talking points',
          'Discussion frameworks',
          'Engagement strategies'
        ]
      },
      advanced_templates: {
        title: 'Advanced Templates',
        description: 'Access premium lesson templates and activity formats',
        icon: '📋',
        benefits: [
          '50+ premium templates',
          'Subject-specific formats',
          'Interactive activities',
          'Assessment rubrics'
        ]
      },
      youtube_integration: {
        title: 'YouTube Video Integration',
        description: 'Find and integrate educational videos seamlessly into lessons',
        icon: '🎥',
        benefits: [
          'Curated educational content',
          'Auto-generated discussion questions',
          'Viewing guides included',
          'Safe, school-appropriate videos'
        ]
      }
    };

    return features[feature] || {
      title: 'Premium Feature',
      description: 'Unlock advanced features with a premium subscription',
      icon: '✨',
      benefits: ['Enhanced functionality', 'Premium support', 'Advanced tools']
    };
  };

  const details = getFeatureDetails(featureName);

  return (
    <div className="relative">
      {/* Blurred/disabled content */}
      <div className="filter blur-sm pointer-events-none opacity-60">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          {/* Icon and title */}
          <div className="text-4xl mb-3">{details.icon}</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {details.title}
          </h3>
          <p className="text-gray-600 mb-4">
            {details.description}
          </p>

          {/* Benefits */}
          <div className="bg-purple-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-purple-900 mb-2">Premium Benefits:</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              {details.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center">
                  <svg className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleUpgradeClick}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors inline-flex items-center"
          >
            <span className="mr-2">🚀</span>
            Unlock {details.title}
          </button>

          <p className="text-xs text-gray-500 mt-2">
            Starting at $6.66/month • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

// Specific feature gates for common features
export const DifferentiationGate: React.FC<Omit<FeatureGateProps, 'featureName'>> = (props) => (
  <FeatureGate {...props} featureName="differentiation" />
);

export const MemoryBankGate: React.FC<Omit<FeatureGateProps, 'featureName'>> = (props) => (
  <FeatureGate {...props} featureName="memory_bank" />
);

export const CERScriptsGate: React.FC<Omit<FeatureGateProps, 'featureName'>> = (props) => (
  <FeatureGate {...props} featureName="cer_scripts" />
);

export const AdvancedTemplatesGate: React.FC<Omit<FeatureGateProps, 'featureName'>> = (props) => (
  <FeatureGate {...props} featureName="advanced_templates" />
);

export const YouTubeIntegrationGate: React.FC<Omit<FeatureGateProps, 'featureName'>> = (props) => (
  <FeatureGate {...props} featureName="youtube_integration" />
);