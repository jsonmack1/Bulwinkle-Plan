'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { PasswordResetConfirm } from '../../types/auth'
import { cn } from '../../lib/utils'
import { useDeviceDetection } from '../../components/ui/ResponsiveLayout'
import Navigation from '../../components/Navigation'
import Link from 'next/link'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { confirmPasswordReset, loading, error, clearError } = useAuth()
  const { type: deviceType, isTouch } = useDeviceDetection()
  
  const token = searchParams.get('token')
  
  const [formData, setFormData] = useState<PasswordResetConfirm>({
    token: token || '',
    newPassword: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (token) {
      setFormData(prev => ({ ...prev, token }))
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationError('')
    
    // Validate passwords match
    if (formData.newPassword !== confirmPassword) {
      setValidationError('Passwords do not match')
      return
    }

    // Validate password strength
    if (formData.newPassword.length < 6) {
      setValidationError('Password must be at least 6 characters long')
      return
    }
    
    try {
      await confirmPasswordReset(formData)
      setSuccess(true)
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'confirmPassword') {
      setConfirmPassword(value)
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    if (error) clearError()
    if (validationError) setValidationError('')
  }

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-xl p-6 shadow-xl text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-xl p-6 shadow-xl text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful</h1>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Link 
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className={cn(
        "mx-auto px-4 py-16",
        deviceType === 'mobile' ? "max-w-sm" : "max-w-md"
      )}>
        <div className={cn(
          "bg-white shadow-xl",
          deviceType === 'mobile' 
            ? "rounded-t-3xl px-6 pt-8 pb-6" 
            : "rounded-xl p-6"
        )}>
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img 
                src="/peabody-logo.svg" 
                alt="Peabody" 
                className="h-12 w-auto"
              />
            </div>
            <h1 className={cn(
              "font-bold text-gray-900 mb-2",
              deviceType === 'mobile' ? "text-xl" : "text-2xl"
            )}>Set New Password</h1>
            <p className={cn(
              "text-gray-600",
              deviceType === 'mobile' ? "text-sm" : "text-base"
            )}>Enter your new password below</p>
          </div>

          {(error || validationError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error || validationError}
            </div>
          )}

          <form onSubmit={handleSubmit} className={cn(
            deviceType === 'mobile' ? "space-y-5" : "space-y-4"
          )}>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                  className={cn(
                    "w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 transition-colors pr-12",
                    deviceType === 'mobile' 
                      ? "px-4 py-4 text-base min-h-touch" 
                      : "px-3 py-2 text-sm",
                    isTouch && "touch-manipulation"
                  )}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors",
                    deviceType === 'mobile' && "min-h-touch min-w-touch flex items-center justify-center"
                  )}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                  className={cn(
                    "w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 transition-colors pr-12",
                    deviceType === 'mobile' 
                      ? "px-4 py-4 text-base min-h-touch" 
                      : "px-3 py-2 text-sm",
                    isTouch && "touch-manipulation"
                  )}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors",
                    deviceType === 'mobile' && "min-h-touch min-w-touch flex items-center justify-center"
                  )}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm",
                deviceType === 'mobile' 
                  ? "py-4 text-base min-h-touch mt-6" 
                  : "py-3 text-sm mt-4",
                isTouch && "touch-manipulation active:scale-98"
              )}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Resetting Password...</span>
                </div>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className={cn(
            "text-center",
            deviceType === 'mobile' ? "mt-8 text-sm" : "mt-6 text-sm"
          )}>
            <Link
              href="/"
              className={cn(
                "text-gray-600 hover:text-gray-800 font-medium transition-colors inline-flex items-center space-x-2",
                deviceType === 'mobile' && "min-h-touch min-w-touch justify-center",
                isTouch && "touch-manipulation"
              )}
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}