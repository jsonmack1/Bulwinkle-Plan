import React, { useState } from 'react'
import { Eye, EyeOff, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { SignupCredentials } from '../../types/auth'
import { cn } from '../../lib/utils'
import { useDeviceDetection } from '../ui/ResponsiveLayout'

interface SignupFormProps {
  onSwitchToLogin: () => void
  onClose?: () => void
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin, onClose }) => {
  const { signup, loading, error, clearError } = useAuth()
  const { type: deviceType, isTouch } = useDeviceDetection()
  const [credentials, setCredentials] = useState<SignupCredentials>({
    name: '',
    email: '',
    password: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!credentials.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!credentials.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!credentials.password) {
      errors.password = 'Password is required'
    } else if (credentials.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (credentials.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (!validateForm()) {
      return
    }
    
    try {
      await signup(credentials)
      if (onClose) onClose()
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value)
    } else {
      setCredentials(prev => ({ ...prev, [name]: value }))
    }
    
    // Clear validation errors when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (error) clearError()
  }

  return (
    <div className={cn(
      "bg-white w-full max-w-md",
      deviceType === 'mobile' 
        ? "rounded-t-3xl px-6 pt-8 pb-6" 
        : "rounded-xl p-6 shadow-xl"
    )}>
      <div className="text-center mb-6">
        <h2 className={cn(
          "font-bold text-gray-900 mb-2",
          deviceType === 'mobile' ? "text-xl" : "text-2xl"
        )}>Create Your Account</h2>
        <p className={cn(
          "text-gray-600",
          deviceType === 'mobile' ? "text-sm" : "text-base"
        )}>Join thousands of teachers building better lessons</p>
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={credentials.name}
            onChange={handleInputChange}
            autoComplete="name"
            className={cn(
              "w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 transition-colors",
              deviceType === 'mobile' 
                ? "px-4 py-4 text-base min-h-touch" 
                : "px-3 py-2 text-sm",
              validationErrors.name ? 'border-red-300' : 'border-gray-300',
              isTouch && "touch-manipulation"
            )}
            placeholder="Sarah Johnson"
          />
          {validationErrors.name && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              {validationErrors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={credentials.email}
            onChange={handleInputChange}
            autoComplete="email"
            inputMode="email"
            className={cn(
              "w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 transition-colors",
              deviceType === 'mobile' 
                ? "px-4 py-4 text-base min-h-touch" 
                : "px-3 py-2 text-sm",
              validationErrors.email ? 'border-red-300' : 'border-gray-300',
              isTouch && "touch-manipulation"
            )}
            placeholder="teacher@school.edu"
          />
          {validationErrors.email && (
            <p className="text-red-600 text-xs mt-1">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={credentials.password}
              onChange={handleInputChange}
              autoComplete="new-password"
              className={cn(
                "w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 transition-colors pr-12",
                deviceType === 'mobile' 
                  ? "px-4 py-4 text-base min-h-touch" 
                  : "px-3 py-2 text-sm",
                validationErrors.password ? 'border-red-300' : 'border-gray-300',
                isTouch && "touch-manipulation"
              )}
              placeholder="Create a secure password"
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
          {validationErrors.password && (
            <p className="text-red-600 text-xs mt-1">{validationErrors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={handleInputChange}
              autoComplete="new-password"
              className={cn(
                "w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 transition-colors pr-12",
                deviceType === 'mobile' 
                  ? "px-4 py-4 text-base min-h-touch" 
                  : "px-3 py-2 text-sm",
                validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300',
                isTouch && "touch-manipulation"
              )}
              placeholder="Confirm your password"
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
          {validationErrors.confirmPassword && (
            <p className="text-red-600 text-xs mt-1">{validationErrors.confirmPassword}</p>
          )}
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
              <span>Creating account...</span>
            </div>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Benefits */}
      <div className={cn(
        "bg-blue-50 rounded-lg p-4",
        deviceType === 'mobile' ? "mt-6" : "mt-5"
      )}>
        <h4 className="font-medium text-blue-900 mb-3">What you'll get:</h4>
        <ul className={cn(
          "text-blue-800 space-y-2",
          deviceType === 'mobile' ? "text-sm" : "text-xs"
        )}>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-blue-600 flex-shrink-0" />
            <span>5 free activities in your Memory Bank</span>
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-blue-600 flex-shrink-0" />
            <span>Smart activity recommendations</span>
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-blue-600 flex-shrink-0" />
            <span>Basic usage insights</span>
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-blue-600 flex-shrink-0" />
            <span>Rate and organize your activities</span>
          </li>
        </ul>
      </div>

      {/* Switch to Login */}
      <div className={cn(
        "text-center",
        deviceType === 'mobile' ? "mt-8 text-sm" : "mt-6 text-sm"
      )}>
        <span className="text-gray-600">Already have an account? </span>
        <button
          onClick={onSwitchToLogin}
          className={cn(
            "text-blue-600 hover:text-blue-500 font-medium transition-colors",
            deviceType === 'mobile' && "min-h-touch min-w-touch inline-flex items-center justify-center",
            isTouch && "touch-manipulation"
          )}
        >
          Sign in here
        </button>
      </div>
    </div>
  )
}

export default SignupForm