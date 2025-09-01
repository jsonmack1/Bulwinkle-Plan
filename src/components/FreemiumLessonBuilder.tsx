'use client'

import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFreemiumSystem } from '../hooks/useFreemiumSystem';
import { UsageMeter } from './ui/UsageMeter';
import { AccountCreationModal } from './modals/AccountCreationModal';
import { UpgradeModal } from './modals/UpgradeModal';
import { trackAnalyticsEvent } from '../lib/usageTracker';

interface FreemiumLessonBuilderProps {
  children: React.ReactNode;
  onLessonGenerate: (lessonData: any) => Promise<void>;
}

export const FreemiumLessonBuilder: React.FC<FreemiumLessonBuilderProps> = ({
  children,
  onLessonGenerate
}) => {
  const { user } = useAuth();
  const {
    usageData,
    isLoading,
    showAccountModal,
    showUpgradeModal,
    upgradeModalType,
    trackLessonGeneration,
    handleAccountCreated,
    handleUpgradeCompleted,
    closeModals,
    canAccessPremiumFeatures,
    isOverLimit
  } = useFreemiumSystem();

  const [isGenerating, setIsGenerating] = useState(false);

  const handleLessonGeneration = useCallback(async (lessonData: any) => {
    // Check if user can generate lessons
    if (isOverLimit && !canAccessPremiumFeatures) {
      // Force show paywall modal
      trackAnalyticsEvent('blocked_generation_attempt', {
        userId: user?.id,
        currentUsage: usageData?.lessonCount || 0,
        subscriptionStatus: usageData?.subscriptionStatus || 'free'
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Track the generation attempt
      const { canGenerate, shouldShowModal } = await trackLessonGeneration(lessonData);
      
      if (canGenerate) {
        // Proceed with lesson generation
        await onLessonGenerate(lessonData);
        
        // Track successful generation
        await trackAnalyticsEvent('lesson_generated', {
          userId: user?.id,
          currentUsage: (usageData?.lessonCount || 0) + 1,
          subscriptionStatus: usageData?.subscriptionStatus || 'free',
          subject: lessonData.subject,
          gradeLevel: lessonData.gradeLevel
        });
      } else {
        console.warn('Lesson generation blocked by usage limits');
      }
    } catch (error) {
      console.error('Lesson generation failed:', error);
      
      await trackAnalyticsEvent('lesson_generation_failed', {
        userId: user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        lessonData
      });
    } finally {
      setIsGenerating(false);
    }
  }, [isOverLimit, canAccessPremiumFeatures, trackLessonGeneration, onLessonGenerate, user?.id, usageData]);

  const handleUpgradeClick = useCallback(() => {
    trackAnalyticsEvent('upgrade_button_clicked', {
      source: 'lesson_builder',
      userId: user?.id,
      currentUsage: usageData?.lessonCount || 0
    });
    // Upgrade modal will be shown by the freemium system
  }, [user?.id, usageData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Usage meter at the top */}
      {usageData && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <UsageMeter
              userId={user?.id}
              currentUsage={usageData.lessonCount}
              limit={5}
              subscriptionStatus={usageData.subscriptionStatus}
              resetDate={usageData.resetDate}
              onUpgradeClick={handleUpgradeClick}
              className="max-w-md"
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative">
        {/* Disable interactions if over limit and not premium */}
        {isOverLimit && !canAccessPremiumFeatures && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 z-40 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-xl">
              <div className="text-4xl mb-4">🚫</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                You've reached your limit!
              </h3>
              <p className="text-gray-600 mb-6">
                You've used all 5 free lessons this month. Upgrade for unlimited access or wait until next month.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleUpgradeClick}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  🚀 Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pass modified onGenerate handler to children */}
        {React.cloneElement(children as React.ReactElement, {
          onGenerate: handleLessonGeneration,
          isGenerating: isGenerating || isLoading,
          canGenerate: !isOverLimit || canAccessPremiumFeatures,
          usageData
        })}
      </div>

      {/* Modals */}
      <AccountCreationModal
        isOpen={showAccountModal}
        onClose={closeModals}
        onSuccess={handleAccountCreated}
        remainingLessons={usageData?.remainingLessons || 0}
        currentLesson={usageData?.lessonCount || 0}
        mode={isOverLimit ? 'required' : 'prompt'}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={upgradeModalType === 'warning' ? closeModals : undefined} // Can't close paywall modal
        userId={user?.id}
        modalType={upgradeModalType}
        remainingLessons={usageData?.remainingLessons || 0}
        currentUsage={usageData?.lessonCount || 0}
      />

      {/* Loading overlay */}
      {(isGenerating || isLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="text-lg font-medium">
                {isGenerating ? 'Creating your lesson...' : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};