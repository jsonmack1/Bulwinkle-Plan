import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
    setIsOpen(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isPremium = user.subscription?.plan === 'premium'

  return (
    <div className="relative">
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
          {getInitials(user.name)}
        </div>
        <div className="text-left hidden sm:block">
          <div className="font-medium text-gray-900">{user.name}</div>
          <div className="flex items-center space-x-2">
            {isPremium ? (
              <span className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 px-2 py-0.5 rounded-full">
                💎 Premium
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                Free
              </span>
            )}
          </div>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Click overlay to close */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-12 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="font-medium text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-600">{user.email}</div>
              <div className="flex items-center mt-2 space-x-2">
                {isPremium ? (
                  <span className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 px-2 py-1 rounded-full">
                    💎 Premium Member
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    Free Account
                  </span>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <a 
                href="/memory-bank" 
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3">💎</span>
                Memory Bank
              </a>
              
              {!isPremium && (
                <button 
                  className="w-full flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                  onClick={() => {
                    setIsOpen(false)
                    window.location.href = '/pricing'
                  }}
                >
                  <span className="mr-3">⭐</span>
                  PRO starting at $9.99/mo
                </button>
              )}

              <hr className="my-2" />

              <button 
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setIsOpen(false)
                  console.log('Account Settings')
                }}
              >
                <span className="mr-3">⚙️</span>
                Account Settings
              </button>

              <button 
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setIsOpen(false)
                  console.log('Help & Support')
                }}
              >
                <span className="mr-3">❓</span>
                Help & Support
              </button>

              <hr className="my-2" />

              <button 
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="mr-3">🚪</span>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default UserMenu