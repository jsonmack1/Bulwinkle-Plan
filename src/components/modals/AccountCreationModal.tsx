'use client'

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { trackAnalyticsEvent } from '../../lib/usageTracker';

interface AccountCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  remainingLessons: number;
  currentLesson: number;
  mode?: 'prompt' | 'required';
}

export const AccountCreationModal: React.FC<AccountCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  remainingLessons,
  currentLesson,
  mode = 'prompt'
}) => {
  const { signup, login, loading, error } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [localError, setLocalError] = useState<string | null>(null);

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
      }

      onSuccess();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed');
      
      await trackAnalyticsEvent('account_creation_failed', {
        error: err instanceof Error ? err.message : 'Unknown error',
        isLogin,
        source: 'account_creation_modal'
      });
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'microsoft') => {
    try {
      await trackAnalyticsEvent('social_auth_attempted', {
        provider,
        source: 'account_creation_modal',
        currentLesson,
        remainingLessons
      });

      // TODO: Implement social auth with Supabase
      // For now, just track the attempt
      setLocalError(`${provider} authentication will be available soon`);
    } catch (error) {
      setLocalError(`${provider} authentication failed`);
    }
  };

  const canSkip = mode === 'prompt' && remainingLessons > 0;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'required' ? 'Create Account to Continue' : 'Save Your Progress!'}
          </h2>
          <p className="text-gray-600">
            {mode === 'required' 
              ? 'You\'ve used all your free lessons this month. Create an account to track your usage and upgrade for unlimited access.'
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
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading 
              ? (isLogin ? 'Signing In...' : 'Creating Account...') 
              : (isLogin ? 'Sign In' : 'Create Free Account')
            }
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

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialAuth('google')}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm">Google</span>
            </button>

            <button
              onClick={() => handleSocialAuth('microsoft')}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#f25022" d="M11.4 11.4H0V0h11.4v11.4z"/>
                <path fill="#00a4ef" d="M24 11.4H12.6V0H24v11.4z"/>
                <path fill="#7fba00" d="M11.4 24H0V12.6h11.4V24z"/>
                <path fill="#ffb900" d="M24 24H12.6V12.6H24V24z"/>
              </svg>
              <span className="text-sm">Microsoft</span>
            </button>
          </div>
        </div>

        {/* Toggle login/signup */}
        <div className="mt-6 text-center">
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

        {/* Action buttons */}
        <div className="mt-6 flex gap-3">
          {canSkip && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Maybe Later
            </button>
          )}
          
          {mode === 'required' && (
            <button
              onClick={() => {
                trackAnalyticsEvent('upgrade_button_clicked', {
                  source: 'account_creation_modal',
                  trigger: 'required_mode'
                });
                // TODO: Navigate to upgrade flow
              }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
              🚀 Upgrade Now
            </button>
          )}
        </div>

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
  );
};