import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { SignupCredentials } from '../../types/auth'

interface SignupFormProps {
  onSwitchToLogin: () => void
  onClose?: () => void
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin, onClose }) => {
  const { signup, loading, error, clearError } = useAuth()
  const [credentials, setCredentials] = useState<SignupCredentials>({
    name: '',
    email: '',
    password: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

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
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
        <p className="text-gray-600">Join thousands of teachers building better lessons</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={credentials.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 placeholder:italic placeholder:font-light ${
              validationErrors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Sarah Johnson"
          />
          {validationErrors.name && (
            <p className="text-red-600 text-xs mt-1">{validationErrors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={credentials.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 placeholder:italic placeholder:font-light ${
              validationErrors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., teacher@school.edu"
          />
          {validationErrors.email && (
            <p className="text-red-600 text-xs mt-1">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={credentials.password}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 placeholder:italic placeholder:font-light ${
              validationErrors.password ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., create a secure password"
          />
          {validationErrors.password && (
            <p className="text-red-600 text-xs mt-1">{validationErrors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="••••••••"
          />
          {validationErrors.confirmPassword && (
            <p className="text-red-600 text-xs mt-1">{validationErrors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✨ 5 free activities in your Memory Bank</li>
          <li>🎯 Smart activity recommendations</li>
          <li>📊 Basic usage insights</li>
          <li>⭐ Rate and organize your activities</li>
        </ul>
      </div>

      {/* Switch to Login */}
      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600">Already have an account? </span>
        <button
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-500 font-medium"
        >
          Sign in here
        </button>
      </div>
    </div>
  )
}

export default SignupForm