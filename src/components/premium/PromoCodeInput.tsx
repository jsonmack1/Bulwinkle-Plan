'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface PromoCode {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'free_subscription' | 'discount_percent' | 'discount_amount' | 'free_trial';
  discountPercent?: number;
  discountAmountCents?: number;
  freeMonths?: number;
  trialDays?: number;
}

interface DiscountPreview {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

interface PromoCodeInputProps {
  orderAmount?: number; // in cents
  billingPeriod: 'monthly' | 'annual';
  onPromoApplied?: (promo: PromoCode, discount: DiscountPreview) => void;
  onPromoRemoved?: () => void;
  className?: string;
  fingerprint?: string;
}

export const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  orderAmount,
  billingPeriod,
  onPromoApplied,
  onPromoRemoved,
  className = '',
  fingerprint
}) => {
  const { user } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validPromo, setValidPromo] = useState<PromoCode | null>(null);
  const [discountPreview, setDiscountPreview] = useState<DiscountPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);

  // Clear error when promo code changes
  useEffect(() => {
    if (error && promoCode !== validPromo?.code) {
      setError(null);
    }
  }, [promoCode, error, validPromo]);

  const applyFreeSubscriptionPromo = async (promoCode: any) => {
    try {
      console.log('🎁 Applying free subscription promo code:', promoCode.code);
      
      const response = await fetch('/api/promo/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promoCode.code,
          userId: user?.id,
          fingerprintHash: fingerprint,
          orderAmount: 0, // Free subscription
          metadata: {
            appliedFrom: 'promo_code_input',
            timestamp: new Date().toISOString()
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Free subscription promo applied successfully', result);
        
        // Show success message
        setError(null);
        
        if (result.subscriptionModification?.type === 'free_subscription_granted') {
          // Subscription was created in database - trigger refresh
          console.log('🎉 Subscription granted, refreshing status...');
          
          // Trigger subscription refresh events
          window.dispatchEvent(new Event('subscription-changed'));
          window.dispatchEvent(new Event('real-subscription-refresh'));
          
          // Show success message and let the user see the status change
          console.log('✅ Premium access activated! Header should update shortly...');
        } else if (result.subscriptionModification?.type === 'free_subscription_pending') {
          // Anonymous user - show message about creating account
          setError(result.subscriptionModification.description);
        } else {
          // Generic success
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
        
      } else {
        console.error('❌ Failed to apply promo code:', result.error_message);
        setError('Failed to activate free subscription. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error applying free subscription promo:', error);
      setError('Failed to activate free subscription. Please try again.');
    }
  };

  const validatePromoCode = async (code: string) => {
    if (!code.trim()) {
      setError('Please enter a promo code');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          userId: user?.id,
          fingerprintHash: fingerprint,
          orderAmount: orderAmount
        })
      });

      const result = await response.json();

      if (result.valid && result.promoCode) {
        setValidPromo(result.promoCode);
        setDiscountPreview(result.discountPreview || null);
        setError(null);
        
        // For free subscription promo codes, automatically apply them
        if (result.promoCode.type === 'free_subscription') {
          await applyFreeSubscriptionPromo(result.promoCode);
        }
        
        if (onPromoApplied) {
          onPromoApplied(result.promoCode, result.discountPreview);
        }
      } else {
        setValidPromo(null);
        setDiscountPreview(null);
        setError(result.error || 'Invalid promo code');
      }
    } catch (err) {
      console.error('Promo validation error:', err);
      setError('Failed to validate promo code');
      setValidPromo(null);
      setDiscountPreview(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleApply = () => {
    validatePromoCode(promoCode);
  };

  const handleRemove = () => {
    setPromoCode('');
    setValidPromo(null);
    setDiscountPreview(null);
    setError(null);
    setShowInput(false);
    
    if (onPromoRemoved) {
      onPromoRemoved();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getPromoTypeDisplay = (promo: PromoCode) => {
    switch (promo.type) {
      case 'free_subscription':
        return `${promo.freeMonths} month${promo.freeMonths !== 1 ? 's' : ''} free`;
      case 'discount_percent':
        return `${promo.discountPercent}% off`;
      case 'discount_amount':
        return `${formatAmount(promo.discountAmountCents || 0)} off`;
      case 'free_trial':
        return `${promo.trialDays} day${promo.trialDays !== 1 ? 's' : ''} free trial`;
      default:
        return 'Discount applied';
    }
  };

  if (validPromo) {
    return (
      <div className={`promo-code-applied bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-green-500 text-xl mr-3">✅</div>
            <div>
              <div className="font-semibold text-green-900">
                Promo Code Applied: {validPromo.code}
              </div>
              <div className="text-sm text-green-700">
                {validPromo.name} - {getPromoTypeDisplay(validPromo)}
                {validPromo.type === 'free_subscription' && (
                  <div className="text-green-800 font-medium mt-1">
                    🎉 Activating your premium access...
                  </div>
                )}
              </div>
              {discountPreview && (
                <div className="text-sm text-green-600 mt-1">
                  <span className="line-through">{formatAmount(discountPreview.originalAmount)}</span>
                  <span className="ml-2 font-semibold">{formatAmount(discountPreview.finalAmount)}</span>
                  <span className="ml-2 text-green-700">
                    (Save {formatAmount(discountPreview.discountAmount)})
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-green-600 hover:text-green-800 text-sm underline"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  if (!showInput) {
    return (
      <div className={`promo-code-toggle ${className}`}>
        <button
          onClick={() => setShowInput(true)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          <span className="mr-2">🎟️</span>
          Have a promo code?
        </button>
      </div>
    );
  }

  return (
    <div className={`promo-code-input bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <label htmlFor="promo-code" className="block text-sm font-medium text-gray-700 mb-2">
            Promo Code
          </label>
          <input
            id="promo-code"
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="Enter promo code"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isValidating}
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleApply}
            disabled={isValidating || !promoCode.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking...
              </div>
            ) : (
              'Apply'
            )}
          </button>
          <button
            onClick={() => setShowInput(false)}
            className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center">
          <span className="mr-2">❌</span>
          {error}
        </div>
      )}
      
      {/* Sample codes hint for development */}
      {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_DEMO_CODES === 'true') && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-xs font-semibold text-yellow-800 mb-1">Development Codes:</div>
          <div className="text-xs text-yellow-700 space-y-1">
            <div><code className="bg-yellow-100 px-1 rounded">TELESCOPE2025</code> - 3 months free</div>
            <div><code className="bg-yellow-100 px-1 rounded">PAPERCLIP</code> - 1 month free</div>
            <div><code className="bg-yellow-100 px-1 rounded">MIDNIGHT50</code> - 50% off</div>
            <div><code className="bg-yellow-100 px-1 rounded">DEVTEST</code> - 12 months free (dev only)</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodeInput;