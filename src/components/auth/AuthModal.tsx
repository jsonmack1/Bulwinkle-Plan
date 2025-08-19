import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn, preventBodyScroll } from '../../lib/utils'
import { useDeviceDetection } from '../ui/ResponsiveLayout'
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
  const { type: deviceType, isTouch } = useDeviceDetection()

  // Prevent body scroll when modal is open
  useEffect(() => {
    preventBodyScroll(isOpen)
    return () => preventBodyScroll(false)
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSwitchToLogin = () => setMode('login')
  const handleSwitchToSignup = () => setMode('signup')

  return (
    <div className={cn(
      "fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 bg-opacity-95 z-50 animate-fade-in",
      deviceType === 'mobile' 
        ? "p-4 flex items-end sm:items-center justify-center" 
        : "flex items-center justify-center p-6",
      isTouch && "touch-manipulation"
    )}>
      {/* Background overlay - click to close */}
      <div 
        className="absolute inset-0 bg-transparent" 
        onClick={onClose}
        aria-label="Close modal"
      />
      
      <div className={cn(
        "relative w-full max-w-md animate-slide-up",
        deviceType === 'mobile' && "mb-safe"
      )}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={cn(
            "absolute z-20 bg-white rounded-full shadow-lg text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center",
            deviceType === 'mobile' 
              ? "top-4 right-4 w-10 h-10 min-h-touch min-w-touch" 
              : "-top-3 -right-3 w-8 h-8"
          )}
          aria-label="Close modal"
        >
          <X size={deviceType === 'mobile' ? 20 : 16} />
        </button>

        {/* Auth Form */}
        <div className={cn(
          "relative z-10",
          deviceType === 'mobile' && "rounded-t-3xl"
        )}>
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
    </div>
  )
}

export default AuthModal