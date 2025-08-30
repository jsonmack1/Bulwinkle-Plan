'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Home, Crown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useDeviceDetection } from './ui/ResponsiveLayout'
import { cn } from '../lib/utils'
import AuthModal from './auth/AuthModal'
import UserMenu from './auth/UserMenu'
import { useSubscription } from '../lib/subscription-mock'

interface NavigationProps {
  isSubMode?: boolean
  onToggleMode?: (isSubMode: boolean) => void
}

const Navigation: React.FC<NavigationProps> = ({ isSubMode = false, onToggleMode }) => {
  const { user, loading } = useAuth()
  const { type: deviceType, isTouch } = useDeviceDetection()
  const { subscription } = useSubscription()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean
    mode: 'login' | 'signup'
  }>({
    isOpen: false,
    mode: 'login'
  })

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModal({ isOpen: true, mode })
  }

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, mode: 'login' })
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <nav className={cn(
        "bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40",
        isTouch && "touch-manipulation tap-highlight-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-24 lg:h-28">
            {/* Logo/Brand */}
            <div className="flex items-center flex-shrink-0">
              <Link 
                href="/" 
                className="flex items-center space-x-2 sm:space-x-3"
                onClick={closeMobileMenu}
              >
                <img 
                  src="/peabody-logo-new.svg" 
                  alt="Peabody" 
                  className="h-20 sm:h-24 w-auto flex-shrink-0"
                />
              </Link>
            </div>

            {/* Desktop Navigation Links - Memory Bank on left */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8 ml-6 lg:ml-8">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <span className="flex items-center space-x-2">
                  <Home size={18} />
                  <span>Home</span>
                </span>
              </Link>
              <Link 
                href="/pricing" 
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <span className="flex items-center space-x-2">
                  <Crown size={18} />
                  <span>Pricing</span>
                </span>
              </Link>
              {user && (subscription?.tier === 'premium' || subscription?.tier === 'pro') && (
                <Link 
                  href="/memory-bank" 
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all flex items-center space-x-2 min-h-touch"
                >
                  <Crown size={16} />
                  <span>Memory Bank</span>
                </Link>
              )}
            </div>

            {/* Desktop Auth Section - On right with space for toggle */}
            <div className="hidden md:flex items-center space-x-4 ml-auto">
              {loading ? (
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              ) : user ? (
                <UserMenu />
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="text-gray-600 hover:text-gray-900 transition-colors font-medium min-h-touch px-3 py-2 rounded-md"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="bg-blue-600 text-white px-4 py-2 lg:px-5 lg:py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm min-h-touch"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>

            {/* Teacher/Sub Mode Toggle - Fixed in header */}
            {onToggleMode && (
              <div className="hidden md:flex items-center ml-6">
                <div className="bg-white rounded-full p-1 shadow-md border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onToggleMode(false)}
                      className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-200 ${
                        !isSubMode 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Teacher
                    </button>
                    <button
                      onClick={() => onToggleMode(true)}
                      className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-200 ${
                        isSubMode 
                          ? 'bg-green-600 text-white shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Sub
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile menu button and auth */}
            <div className="md:hidden flex items-center space-x-3">
              {loading ? (
                <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              ) : user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors min-h-touch px-3 py-2 rounded-md"
                >
                  Sign In
                </button>
              )}
              
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors min-h-touch min-w-touch flex items-center justify-center"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={cn(
          "md:hidden transition-all duration-300 ease-in-out bg-white border-t border-gray-200",
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}>
          <div className="px-4 py-4 space-y-3">
            <Link 
              href="/"
              onClick={closeMobileMenu}
              className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-h-touch"
            >
              <Home size={20} />
              <span className="font-medium">Home</span>
            </Link>
            
            <Link 
              href="/pricing"
              onClick={closeMobileMenu}
              className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-h-touch"
            >
              <Crown size={20} />
              <span className="font-medium">Pricing</span>
            </Link>
            
            {user && (subscription?.tier === 'premium' || subscription?.tier === 'pro') && (
              <Link 
                href="/memory-bank"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-md hover:from-purple-700 hover:to-indigo-700 transition-colors min-h-touch"
              >
                <Crown size={20} />
                <span>Memory Bank</span>
              </Link>
            )}
            
            {!user && (
              <button
                onClick={() => {
                  openAuthModal('signup')
                  closeMobileMenu()
                }}
                className="w-full flex items-center justify-center p-3 rounded-lg bg-blue-600 text-white font-medium shadow-md hover:bg-blue-700 transition-colors min-h-touch"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={closeAuthModal}
        defaultMode={authModal.mode}
      />
      
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-30 md:hidden" 
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </>
  )
}

export default Navigation