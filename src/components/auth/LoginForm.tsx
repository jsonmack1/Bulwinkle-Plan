import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { LoginCredentials } from '../../types/auth'
import { cn } from '../../lib/utils'
import { useDeviceDetection } from '../ui/ResponsiveLayout'

interface LoginFormProps {
  onSwitchToSignup: () => void
  onSwitchToReset: () => void
  onClose?: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, onSwitchToReset, onClose }) => {
  const { login, loading, error, clearError } = useAuth()
  const { type: deviceType, isTouch } = useDeviceDetection()
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    try {
      await login(credentials)
      if (onClose) onClose()
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials(prev => ({ ...prev, [name]: value }))
    if (error) clearError() // Clear error when user starts typing
  }

  const handleDemoLogin = async () => {
    setCredentials({
      email: 'demo@lessonbuilder.com',
      password: 'demo123'
    })
    
    clearError()
    
    try {
      await login({
        email: 'demo@lessonbuilder.com',
        password: 'demo123'
      })
      if (onClose) onClose()
    } catch (error) {
      // If demo account doesn't exist, create it first then login
      try {
        const { authService } = await import('../../lib/auth')
        await authService.createDemoAccount()
        if (onClose) onClose()
      } catch (createError) {
        // Error is handled by the auth context
      }
    }
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
        )}>Welcome Back!</h2>
        <p className={cn(
          "text-gray-600",
          deviceType === 'mobile' ? "text-sm" : "text-base"
        )}>Sign in to access your Memory Bank and premium features</p>
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
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={credentials.email}
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
              required
              autoComplete="current-password"
              className={cn(
                "w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 transition-colors pr-12",
                deviceType === 'mobile' 
                  ? "px-4 py-4 text-base min-h-touch" 
                  : "px-3 py-2 text-sm",
                isTouch && "touch-manipulation"
              )}
              placeholder="Enter your password"
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

        {/* Forgot Password Link */}
        <div className="text-right">
          <button
            type="button"
            onClick={onSwitchToReset}
            className={cn(
              "text-blue-600 hover:text-blue-500 font-medium transition-colors text-sm",
              deviceType === 'mobile' && "min-h-touch min-w-touch inline-flex items-center justify-center",
              isTouch && "touch-manipulation"
            )}
          >
            Forgot your password?
          </button>
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
              <span>Signing in...</span>
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Demo Login */}
      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or try demo</span>
          </div>
        </div>
        
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className={cn(
            "w-full bg-green-100 text-green-800 rounded-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium",
            deviceType === 'mobile' 
              ? "py-4 text-base min-h-touch mt-4" 
              : "py-3 text-sm mt-3",
            isTouch && "touch-manipulation active:scale-98"
          )}
        >
          🎭 Try Demo Account
        </button>
      </div>

      {/* Switch to Signup */}
      <div className={cn(
        "text-center",
        deviceType === 'mobile' ? "mt-8 text-sm" : "mt-6 text-sm"
      )}>
        <span className="text-gray-600">Don't have an account? </span>
        <button
          onClick={onSwitchToSignup}
          className={cn(
            "text-blue-600 hover:text-blue-500 font-medium transition-colors",
            deviceType === 'mobile' && "min-h-touch min-w-touch inline-flex items-center justify-center",
            isTouch && "touch-manipulation"
          )}
        >
          Create one now
        </button>
      </div>
    </div>
  )
}

export default LoginForm