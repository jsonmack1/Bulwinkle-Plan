'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { trackAnalyticsEvent } from '../../lib/usageTracker';

interface AccountCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userId: string) => void;
  remainingLessons: number;
  currentLesson: number;
  mode?: 'prompt' | 'required';
  selectedPlan?: {
    name: string;
    price: number;
    billing: 'monthly' | 'annual';
  };
}

export const AccountCreationModal: React.FC<AccountCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  remainingLessons,
  currentLesson,
  mode = 'prompt',
  selectedPlan
}) => {
  const { signup, login, loading, error } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      // Restore scrolling
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setLocalError('Password must be at least 6 characters');
        return;
      }
    }

    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password
        });
        
        await trackAnalyticsEvent('user_login', {
          source: 'account_creation_modal',
          currentLesson,
          remainingLessons
        });
        
        // Get user from auth context after successful login
        const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
        onSuccess(currentUser?.id || 'authenticated');
      } else {
        await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        
        await trackAnalyticsEvent('account_created', {
          source: 'account_creation_modal',
          currentLesson,
          remainingLessons,
          mode
        });
        
        // Get user from auth context after successful signup
        const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
        onSuccess(currentUser?.id || 'authenticated');
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed');
      
      await trackAnalyticsEvent('account_creation_failed', {
        error: err instanceof Error ? err.message : 'Unknown error',
        isLogin,
        source: 'account_creation_modal'
      });
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await trackAnalyticsEvent('social_auth_attempted', {
        provider: 'google',
        source: 'account_creation_modal',
        currentLesson,
        remainingLessons
      });

      // Open Google OAuth popup using existing Google Auth API
      const authResponse = await fetch('/api/auth/google');
      if (!authResponse.ok) {
        throw new Error('Failed to get Google authorization URL');
      }
      
      const authData = await authResponse.json();
      
      const popup = window.open(
        authData.url,
        'google-auth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }

      // Wait for authentication to complete
      const user = await new Promise<any>((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            reject(new Error('Authentication cancelled'));
          }
        }, 1000);

        window.addEventListener('message', (event) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            clearInterval(checkClosed);
            popup.close();
            resolve(event.data.user);
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            clearInterval(checkClosed);
            popup.close();
            reject(new Error(event.data.error || 'Authentication failed'));
          }
        });
      });

      await trackAnalyticsEvent('social_auth_successful', {
        provider: 'google',
        userId: user?.id || 'google_user',
        source: 'account_creation_modal'
      });

      onSuccess(user?.id || 'google_authenticated');
    } catch (error) {
      console.error('Google authentication failed:', error);
      setLocalError(error instanceof Error ? error.message : 'Google authentication failed');
      
      await trackAnalyticsEvent('social_auth_failed', {
        provider: 'google',
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'account_creation_modal'
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    try {
      // Simulate forgot password API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setForgotPasswordSent(true);
      
      await trackAnalyticsEvent('password_reset_requested', {
        email: forgotEmail,
        source: 'account_creation_modal'
      });
    } catch (error) {
      setLocalError('Failed to send password reset email');
    }
  };

  const canSkip = mode === 'prompt' && remainingLessons > 0;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm backdrop-brightness-[0.6] flex items-center justify-center z-[60] p-4"
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] relative overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Premium Context Banner */}
        {selectedPlan && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 text-center">
            <div className="text-sm opacity-90">Almost there! Create your account to continue</div>
            <div className="font-semibold">
              Upgrading to {selectedPlan.name} - {selectedPlan.billing === 'annual' ? 'as low as $7.99/mo*' : `$${selectedPlan.price}/mo`}
            </div>
          </div>
        )}
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {showForgotPassword 
                ? 'Reset Password' 
                : mode === 'required' 
                  ? 'Create Account to Continue' 
                  : selectedPlan
                    ? 'Almost There! 🚀'
                    : 'Save Your Progress!'
              }
            </h2>
            <p className="text-gray-600">
              {showForgotPassword
                ? 'Enter your email to receive reset instructions'
                : mode === 'required' 
                  ? 'You\'ve used all your free lessons this month. Create an account to track your usage and upgrade for unlimited access.'
                  : selectedPlan
                    ? 'Create your account to access premium features'
                    : `You have ${remainingLessons} free lessons remaining this month. Create an account to save your progress and unlock premium features!`
              }
            </p>
          </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Free lessons used</span>
            <span className="text-sm font-semibold text-purple-600">
              {currentLesson} of 5
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentLesson / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Error display */}
        {(error || localError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{localError || error}</p>
          </div>
        )}

        {/* Forgot Password Form */}
        {showForgotPassword ? (
          forgotPasswordSent ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
              <p className="text-gray-600 mb-6">
                We've sent password reset instructions to {forgotEmail}
              </p>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordSent(false);
                  setForgotEmail('');
                }}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )
        ) : (
          <>
            {/* Auth form */}
            <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required={!isLogin}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={isLogin ? "Enter your password" : "Create a password (6+ characters)"}
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required={!isLogin}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Confirm your password"
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
              </div>
            ) : (
              <span>{isLogin ? 'Sign In & Continue' : 'Create Account & Continue'}</span>
            )}
          </button>
        </form>

        {/* Social auth options */}
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or continue with</span>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium">Continue with Google</span>
            </button>
          </div>
        </div>

          {/* Toggle login/signup */}
          <div className="mt-6 text-center">
            {isLogin && (
              <div className="mb-3">
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  disabled={loading}
                >
                  Forgot your password?
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setLocalError(null);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
              }}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              disabled={loading}
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>

          {/* Always visible exit option */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Maybe Later - Continue as Guest
            </button>
          </div>
          </>
        )}

        {/* Skip option for prompt mode only */}
        {canSkip && (
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Maybe Later
            </button>
          </div>
        )}

        {/* Benefits section */}
        {mode === 'prompt' && (
          <div className="mt-6 bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">
              Why create an account?
            </h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>✓ Track your monthly usage</li>
              <li>✓ Access to differentiation features</li>
              <li>✓ Save lessons to Memory Bank</li>
              <li>✓ Easy upgrade to unlimited</li>
            </ul>
          </div>
        )}

        {/* Close button */}
        {mode === 'prompt' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        </div>
      </div>
    </div>
  );
};