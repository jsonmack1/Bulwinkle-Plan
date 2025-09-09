'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthContextType, LoginCredentials, SignupCredentials } from '../types/auth'
import { authService } from '../lib/auth'
import { mockSubscription } from '../lib/subscription'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load current user on app start
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const user = await authService.login(credentials)
      setUser(user)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signup = async (credentials: SignupCredentials): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const user = await authService.signup(credentials)
      setUser(user)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Signup failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setLoading(true)
    
    try {
      await authService.logout()
      setUser(null)
      
      // CRITICAL: Clear subscription status when user logs out
      mockSubscription.setStatus('free')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Logout failed')
    } finally {
      setLoading(false)
    }
  }

  const clearError = (): void => {
    setError(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}