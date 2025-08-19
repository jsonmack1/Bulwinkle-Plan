import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LoginCredentials } from '../../types/auth'

interface LoginFormProps {
  onSwitchToSignup: () => void
  onClose?: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, onClose }) => {
  const { login, loading, error, clearError } = useAuth()
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  })

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
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
        <p className="text-gray-600">Sign in to access your Memory Bank and premium features</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 placeholder:italic placeholder:font-light"
            placeholder="e.g., teacher@school.edu"
          />
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
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 placeholder:italic placeholder:font-light"
            placeholder="e.g., your secure password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          className="w-full mt-4 bg-green-100 text-green-800 py-2 px-4 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🎭 Try Demo Account
        </button>
      </div>

      {/* Switch to Signup */}
      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600">Don't have an account? </span>
        <button
          onClick={onSwitchToSignup}
          className="text-blue-600 hover:text-blue-500 font-medium"
        >
          Create one now
        </button>
      </div>
    </div>
  )
}

export default LoginForm