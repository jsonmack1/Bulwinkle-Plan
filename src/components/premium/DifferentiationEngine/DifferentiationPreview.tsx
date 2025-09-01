'use client'

import React, { useState, useEffect } from 'react';
import { trackAnalyticsEvent } from '../../../lib/usageTracker';

interface DifferentiationPreviewProps {
  content: React.ReactNode;
  isPremium: boolean;
  onUpgradeClick?: () => void;
  className?: string;
}

export const DifferentiationPreview: React.FC<DifferentiationPreviewProps> = ({
  content,
  isPremium,
  onUpgradeClick,
  className = ''
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  const startPreview = () => {
    setShowPreview(true);
    setTimeLeft(5);
    
    trackAnalyticsEvent('differentiation_preview_started', {
      source: 'differentiation_engine'
    });

    // 5-second countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowPreview(false);
          showUpgradeModal();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const showUpgradeModal = () => {
    trackAnalyticsEvent('differentiation_preview_ended', {
      source: 'differentiation_engine',
      action: 'auto_upgrade_modal'
    });
    
    if (onUpgradeClick) {
      onUpgradeClick();
    }
  };

  const handleUpgradeClick = () => {
    trackAnalyticsEvent('upgrade_button_clicked', {
      source: 'differentiation_preview',
      trigger: 'manual_click'
    });
    
    if (onUpgradeClick) {
      onUpgradeClick();
    }
  };

  // Add copy protection when preview is active
  useEffect(() => {
    if (showPreview) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && (e.key === 'c' || e.key === 'a' || e.key === 's')) {
          e.preventDefault();
          e.stopPropagation();
          showCopyProtectionMessage();
        }
      };

      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        showCopyProtectionMessage();
      };

      const handleDragStart = (e: DragEvent) => {
        e.preventDefault();
        showCopyProtectionMessage();
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('dragstart', handleDragStart);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('dragstart', handleDragStart);
      };
    }
  }, [showPreview]);

  const showCopyProtectionMessage = () => {
    trackAnalyticsEvent('copy_protection_triggered', {
      source: 'differentiation_preview'
    });
    
    // You could show a toast notification here if you have a toast system
    alert('🔒 Upgrade to Teacher Pro to access full differentiation content');
  };

  if (isPremium) {
    return <div className={className}>{content}</div>;
  }

  if (!showPreview) {
    return (
      <div className={`relative bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200 ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 rounded-lg"></div>
        <div className="relative">
          <div className="filter blur-sm opacity-60 pointer-events-none select-none">
            {content}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg">
            <div className="text-center text-white bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Intelligence Differentiation Preview</h3>
              <p className="mb-4 text-gray-100">See how we create 5 versions automatically</p>
              <button 
                onClick={startPreview}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
              >
                <span>▶️</span>
                <span>Preview (5 seconds)</span>
              </button>
              <div className="mt-3">
                <button
                  onClick={handleUpgradeClick}
                  className="text-sm text-purple-200 hover:text-white underline"
                >
                  Upgrade for full access
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="copy-protected select-none">
        {content}
      </div>
      
      {/* Preview timer overlay */}
      <div className="fixed top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold z-50 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Preview: {timeLeft}s remaining</span>
        </div>
      </div>
      
      {/* Copy protection overlay (invisible but functional) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      />
    </div>
  );
};

export default DifferentiationPreview;