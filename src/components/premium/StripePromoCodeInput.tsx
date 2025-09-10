'use client'

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface StripePromoCodeInputProps {
  priceId: string;
  billingPeriod: 'monthly' | 'annual';
  className?: string;
  fingerprint?: string;
  onAccountRequired?: (promoCode: string) => void;
}

export const StripePromoCodeInput: React.FC<StripePromoCodeInputProps> = ({
  priceId,
  billingPeriod,
  className = '',
  fingerprint,
  onAccountRequired
}) => {
  const { user } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);

  // Clear error when promo code changes
  React.useEffect(() => {
    if (error && promoCode) {
      setError(null);
    }
  }, [promoCode, error]);

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setError('Please enter a promo code');
      return;
    }

    // Check if user has account first (same logic as monthly/annual plans)
    if (!user?.id) {
      if (onAccountRequired) {
        onAccountRequired(promoCode.trim().toUpperCase());
      } else {
        setError('Please create an account or log in to use promo codes');
      }
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('🎟️ Applying Stripe promotion code:', promoCode);
      
      // Create Stripe checkout session with promotion code
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          billingPeriod,
          promoCode: promoCode.trim().toUpperCase(),
          userId: user?.id,
          email: user?.email,
          fingerprintHash: fingerprint,
          successUrl: `${window.location.origin}/dashboard?upgraded=true&promo=${promoCode}`,
          cancelUrl: `${window.location.origin}/pricing?promo_failed=${promoCode}`
        })
      });

      const result = await response.json();

      if (result.success && result.checkoutUrl) {
        console.log('✅ Stripe checkout created with promo code');
        
        // Redirect to Stripe checkout
        window.location.href = result.checkoutUrl;
        
      } else {
        console.error('❌ Failed to create checkout:', result.error);
        setError(result.error || 'Failed to apply promotion code. Please check the code and try again.');
      }
      
    } catch (error) {
      console.error('❌ Error applying promotion code:', error);
      setError('Failed to apply promotion code. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyPromoCode();
    }
  };

  if (!showInput) {
    return (
      <div className={`stripe-promo-toggle ${className}`}>
        <button
          onClick={() => setShowInput(true)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center transition-colors"
        >
          <span className="mr-2">🎟️</span>
          Have a promo code?
        </button>
      </div>
    );
  }

  return (
    <div className={`stripe-promo-input bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <label htmlFor="stripe-promo-code" className="block text-sm font-medium text-gray-700 mb-2">
            Promotion Code
          </label>
          <input
            id="stripe-promo-code"
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="Enter promo code"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isProcessing}
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleApplyPromoCode}
            disabled={isProcessing || !promoCode.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Applying...
              </div>
            ) : (
              'Apply Code'
            )}
          </button>
          <button
            onClick={() => setShowInput(false)}
            className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors"
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
      
      {/* Help text */}
      <div className="mt-3 text-xs text-gray-500">
        <div className="flex items-center">
          <span className="mr-2">💡</span>
          {!user?.id ? (
            <span>Enter your promo code - you'll be prompted to create an account to redeem it</span>
          ) : (
            <span>Enter your promo code to get discounts or free months of premium access</span>
          )}
        </div>
      </div>
      
      {/* Sample codes hint for development */}
      {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_DEMO_CODES === 'true') && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-xs font-semibold text-yellow-800 mb-1">Available Codes:</div>
          <div className="text-xs text-yellow-700 space-y-1">
            <div><code className="bg-yellow-100 px-1 rounded">PAPERCLIP</code> - 30 days free</div>
            <div><code className="bg-yellow-100 px-1 rounded">TELESCOPE2025</code> - 3 months free</div>
            <div><code className="bg-yellow-100 px-1 rounded">MIDNIGHT50</code> - 50% off first payment</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StripePromoCodeInput;