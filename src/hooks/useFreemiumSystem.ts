'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usageTracker, trackAnalyticsEvent, UsageData } from '../lib/usageTracker';
import { useSubscription } from '../lib/subscription-mock';

interface FreemiumSystemHook {
  // Usage data
  usageData: UsageData | null;
  isLoading: boolean;
  error: string | null;

  // Modal states
  showAccountModal: boolean;
  showUpgradeModal: boolean;
  upgradeModalType: 'warning' | 'paywall';

  // Actions
  checkUsage: () => Promise<void>;
  trackLessonGeneration: (lessonData?: any) => Promise<{ canGenerate: boolean; shouldShowModal: boolean }>;
  handleAccountCreated: () => void;
  handleUpgradeCompleted: () => void;
  closeModals: () => void;
  
  // Utils
  canAccessPremiumFeatures: boolean;
  shouldPromptForAccount: boolean;
  isOverLimit: boolean;
}

export const useFreemiumSystem = (): FreemiumSystemHook => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalType, setUpgradeModalType] = useState<'warning' | 'paywall'>('warning');

  // Initialize usage tracker
  useEffect(() => {
    const initializeTracker = async () => {
      try {
        await usageTracker.initialize();
        await checkUsage();
      } catch (err) {
        console.error('Failed to initialize usage tracker:', err);
        setError('Failed to initialize usage tracking');
      }
    };

    initializeTracker();
  }, []);

  // Check usage when user changes
  useEffect(() => {
    if (user) {
      checkUsage();
    }
  }, [user?.id]);

  const checkUsage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await usageTracker.getRemainingLessons(user?.id);
      setUsageData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check usage';
      setError(errorMessage);
      console.error('Usage check failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const trackLessonGeneration = useCallback(async (lessonData?: any): Promise<{ canGenerate: boolean; shouldShowModal: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await usageTracker.trackLessonGeneration(user?.id, lessonData);
      
      // Update usage data
      setUsageData(result.usageData);

      // Handle modal display logic - but don't block generation for account prompts
      if (result.shouldShowModal === 'account') {
        setShowAccountModal(true);
        return { canGenerate: true, shouldShowModal: true }; // Allow generation to continue
      } else if (result.shouldShowModal === 'paywall') {
        setUpgradeModalType('paywall');
        setShowUpgradeModal(true);
        return { canGenerate: result.success, shouldShowModal: true };
      } else if (result.usageData.remainingLessons === 1 && result.usageData.subscriptionStatus === 'free') {
        // Show warning modal for last free lesson but allow generation
        setUpgradeModalType('warning');
        setShowUpgradeModal(true);
        return { canGenerate: true, shouldShowModal: true }; // Allow last lesson
      }

      return { canGenerate: result.success, shouldShowModal: false };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track lesson generation';
      setError(errorMessage);
      console.error('Lesson generation tracking failed:', err);
      
      // Graceful fallback - for free users, show modals based on estimated usage
      if (!isPremium) {
        const estimatedCount = (usageData?.lessonCount || 0) + 1;
        
        if (!user && estimatedCount >= 3) {
          setShowAccountModal(true);
          return { canGenerate: true, shouldShowModal: true };
        } else if (estimatedCount >= 5) {
          setUpgradeModalType('paywall');
          setShowUpgradeModal(true);
          return { canGenerate: false, shouldShowModal: true };
        } else if (estimatedCount === 4) {
          setUpgradeModalType('warning');
          setShowUpgradeModal(true);
          return { canGenerate: true, shouldShowModal: true };
        }
      }
      
      // CRITICAL FIX: When tracking fails, only allow if user is confirmed premium
      // This prevents bypassing freemium restrictions when API fails
      if (isPremium) {
        return { canGenerate: true, shouldShowModal: false };
      } else {
        // For free users when tracking fails, show paywall to prevent bypass
        setUpgradeModalType('paywall');
        setShowUpgradeModal(true);
        return { canGenerate: false, shouldShowModal: true };
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isPremium, usageData]);

  const handleAccountCreated = useCallback(() => {
    setShowAccountModal(false);
    checkUsage(); // Refresh usage data
    
    trackAnalyticsEvent('account_creation_completed', {
      userId: user?.id,
      source: 'freemium_system'
    });
  }, [user?.id]);

  const handleUpgradeCompleted = useCallback(() => {
    setShowUpgradeModal(false);
    checkUsage(); // Refresh usage data
    
    trackAnalyticsEvent('upgrade_completed', {
      userId: user?.id,
      source: 'freemium_system'
    });
  }, [user?.id]);

  const closeModals = useCallback(() => {
    setShowAccountModal(false);
    setShowUpgradeModal(false);
  }, []);

  // Computed values
  const canAccessPremiumFeatures = usageData?.subscriptionStatus === 'premium';
  const shouldPromptForAccount = !user && (usageData?.lessonCount || 0) >= 2;
  const isOverLimit = usageData?.isOverLimit || false;

  return {
    usageData,
    isLoading,
    error,
    showAccountModal,
    showUpgradeModal,
    upgradeModalType,
    checkUsage,
    trackLessonGeneration,
    handleAccountCreated,
    handleUpgradeCompleted,
    closeModals,
    canAccessPremiumFeatures,
    shouldPromptForAccount,
    isOverLimit
  };
};

// Hook for premium feature access checking
export const usePremiumFeatures = () => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'premium'>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id) {
        setSubscriptionStatus('free');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user/subscription?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data.subscription?.isPremium ? 'premium' : 'free');
        } else {
          setSubscriptionStatus('free');
        }
      } catch (error) {
        console.error('Failed to check subscription status:', error);
        setSubscriptionStatus('free');
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [user?.id]);

  const canAccess = useCallback((feature: string) => {
    return subscriptionStatus === 'premium';
  }, [subscriptionStatus]);

  return {
    subscriptionStatus,
    isLoading,
    canAccess,
    isPremium: subscriptionStatus === 'premium'
  };
};