import React, { useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { PasswordResetRequest } from '../../types/auth'
import { cn } from '../../lib/utils'
import { useDeviceDetection } from '../ui/ResponsiveLayout'

interface PasswordResetFormProps {
  onBackToLogin: () => void
  onClose?: () => void
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ 
  onBackToLogin, 
  onClose 
}) => {
  const { requestPasswordReset, loading, error, clearError } = useAuth()
  const { type: deviceType, isTouch } = useDeviceDetection()
  const [request, setRequest] = useState<PasswordResetRequest>({
    email: ''
  })
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    try {
      await requestPasswordReset(request)
      setEmailSent(true)
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRequest(prev => ({ ...prev, [name]: value }))
    if (error) clearError() // Clear error when user starts typing
  }

  if (emailSent) {
    return (
      <div className={cn(
        "bg-white w-full max-w-md",
        deviceType === 'mobile' 
          ? "rounded-t-3xl px-6 pt-8 pb-6" 
          : "rounded-xl p-6 shadow-xl"
      )}>
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className={cn(
            "font-bold text-gray-900 mb-2",
            deviceType === 'mobile' ? "text-xl" : "text-2xl"
          )}>Check Your Email</h2>
          <p className={cn(
            "text-gray-600 mb-4",
            deviceType === 'mobile' ? "text-sm" : "text-base"
          )}>
            If an account with email <strong>{request.email}</strong> exists, 
            we've sent a password reset link.
          </p>
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded text-sm">
            <p><strong>For development:</strong> Check the console logs for the reset link since email sending is not configured yet.</p>
          </div>
        </div>

        <div className={cn(
          "space-y-4",
          deviceType === 'mobile' ? "mt-8" : "mt-6"
        )}>
          <button
            onClick={onBackToLogin}
            className={cn(
              "w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-sm",
              deviceType === 'mobile' 
                ? "py-4 text-base min-h-touch" 
                : "py-3 text-sm",
              isTouch && "touch-manipulation active:scale-98"
            )}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-white w-full max-w-md",
      deviceType === 'mobile' 
        ? "rounded-t-3xl px-6 pt-8 pb-6" 
        : "rounded-xl p-6 shadow-xl"
    )}>
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <img 
            src="/peabody-logo.svg" 
            alt="Peabody" 
            className="h-12 w-auto"
          />
        </div>
        <h2 className={cn(
          "font-bold text-gray-900 mb-2",
          deviceType === 'mobile' ? "text-xl" : "text-2xl"
        )}>Reset Your Password</h2>
        <p className={cn(
          "text-gray-600",
          deviceType === 'mobile' ? "text-sm" : "text-base"
        )}>Enter your email address and we'll send you a link to reset your password</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={cn(
        deviceType === 'mobile' ? "space-y-5" : "space-y-4"
      )}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={request.email}
            onChange={handleInputChange}
            required
            autoComplete="email"
            inputMode="email"
            className={cn(
              "w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 transition-colors",
              deviceType === 'mobile' 
                ? "px-4 py-4 text-base min-h-touch" 
                : "px-3 py-2 text-sm",
              isTouch && "touch-manipulation"
            )}
            placeholder="teacher@school.edu"
          />
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
              <span>Sending...</span>
            </div>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      {/* Back to Login */}
      <div className={cn(
        "text-center",
        deviceType === 'mobile' ? "mt-8 text-sm" : "mt-6 text-sm"
      )}>
        <button
          onClick={onBackToLogin}
          className={cn(
            "text-gray-600 hover:text-gray-800 font-medium transition-colors inline-flex items-center space-x-2",
            deviceType === 'mobile' && "min-h-touch min-w-touch justify-center",
            isTouch && "touch-manipulation"
          )}
        >
          <ArrowLeft size={16} />
          <span>Back to Sign In</span>
        </button>
      </div>
    </div>
  )
}

export default PasswordResetForm