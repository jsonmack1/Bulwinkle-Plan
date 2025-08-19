import React, { useState } from 'react'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'signup'
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode)

  if (!isOpen) return null

  const handleSwitchToLogin = () => setMode('login')
  const handleSwitchToSignup = () => setMode('signup')

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 bg-opacity-95 flex items-center justify-center p-4 z-50">
      <div className="relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg text-gray-500 hover:text-gray-700 z-10"
        >
          ✕
        </button>

        {/* Auth Form */}
        {mode === 'login' ? (
          <LoginForm 
            onSwitchToSignup={handleSwitchToSignup}
            onClose={onClose}
          />
        ) : (
          <SignupForm 
            onSwitchToLogin={handleSwitchToLogin}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}

export default AuthModal