'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Home, Crown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useDeviceDetection } from './ui/ResponsiveLayout'
import { cn } from '../lib/utils'
import AuthModal from './auth/AuthModal'
import UserMenu from './auth/UserMenu'

const Navigation: React.FC = () => {
  const { user, loading } = useAuth()
  const { type: deviceType, isTouch } = useDeviceDetection()
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
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo/Brand */}
            <div className="flex items-center flex-shrink-0">
              <Link 
                href="/" 
                className="flex items-center space-x-2 sm:space-x-3"
                onClick={closeMobileMenu}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm sm:text-base">LP</span>
                </div>
                <span className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  {deviceType === 'mobile' ? 'LPB' : 'Lesson Plan Builder'}
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <span className="flex items-center space-x-2">
                  <Home size={18} />
                  <span>Activity Builder</span>
                </span>
              </Link>
              {user && (
                <Link 
                  href="/memory-bank" 
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 lg:px-5 lg:py-3 rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all flex items-center space-x-2 min-h-touch"
                >
                  <Crown size={18} />
                  <span>Memory Bank</span>
                </Link>
              )}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
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
              <span className="font-medium">Activity Builder</span>
            </Link>
            
            {user && (
              <Link 
                href="/memory-bank"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-md min-h-touch"
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