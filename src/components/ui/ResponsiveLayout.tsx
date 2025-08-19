'use client'

import React, { useState, useEffect, ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface ResponsiveLayoutProps {
  children: ReactNode
  className?: string
  mobileClassName?: string
  tabletClassName?: string
  desktopClassName?: string
  enableSafeArea?: boolean
  enableTouchOptimization?: boolean
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className = '',
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = '',
  enableSafeArea = false,
  enableTouchOptimization = true,
}) => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      setIsTouch(hasTouch)

      if (width < 768) {
        setDeviceType('mobile')
      } else if (width < 1024) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }

    detectDevice()
    window.addEventListener('resize', detectDevice)
    window.addEventListener('orientationchange', detectDevice)

    return () => {
      window.removeEventListener('resize', detectDevice)
      window.removeEventListener('orientationchange', detectDevice)
    }
  }, [])

  const baseClasses = cn(
    className,
    {
      [mobileClassName]: deviceType === 'mobile' && mobileClassName,
      [tabletClassName]: deviceType === 'tablet' && tabletClassName,
      [desktopClassName]: deviceType === 'desktop' && desktopClassName,
      'safe-area': enableSafeArea,
      'touch-manipulation tap-highlight-transparent': enableTouchOptimization && isTouch,
    }
  )

  return (
    <div className={baseClasses} data-device={deviceType} data-touch={isTouch}>
      {children}
    </div>
  )
}

// Hook for device detection
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'mobile' as 'mobile' | 'tablet' | 'desktop',
    isTouch: false,
    orientation: 'portrait' as 'portrait' | 'landscape',
    screenSize: { width: 0, height: 0 },
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isLandscape = width > height

      let type: 'mobile' | 'tablet' | 'desktop' = 'mobile'
      if (width >= 1024) {
        type = 'desktop'
      } else if (width >= 768) {
        type = 'tablet'
      }

      setDeviceInfo({
        type,
        isTouch: hasTouch,
        orientation: isLandscape ? 'landscape' : 'portrait',
        screenSize: { width, height },
      })
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  return deviceInfo
}

// Responsive container component
interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  size?: 'full' | 'mobile' | 'tablet' | 'desktop'
  centerContent?: boolean
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  size = 'full',
  centerContent = false,
}) => {
  const containerClasses = cn(
    'w-full mx-auto',
    {
      'px-4 sm:px-6 lg:px-8': size === 'full',
      'max-w-sm px-4': size === 'mobile',
      'max-w-2xl px-4 sm:px-6': size === 'tablet',
      'max-w-7xl px-4 sm:px-6 lg:px-8': size === 'desktop',
      'flex flex-col items-center justify-center': centerContent,
    },
    className
  )

  return <div className={containerClasses}>{children}</div>
}

// Responsive grid component
interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: string
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'gap-4',
}) => {
  const gridClasses = cn(
    'grid',
    gap,
    {
      [`grid-cols-${columns.mobile}`]: columns.mobile,
      [`sm:grid-cols-${columns.tablet}`]: columns.tablet,
      [`lg:grid-cols-${columns.desktop}`]: columns.desktop,
    },
    className
  )

  return <div className={gridClasses}>{children}</div>
}

// Touch-friendly button component
interface TouchButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
}) => {
  const buttonClasses = cn(
    'btn-mobile inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible disabled:opacity-50 disabled:cursor-not-allowed',
    {
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800': variant === 'primary',
      'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400': variant === 'secondary',
      'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100': variant === 'outline',
      'px-3 py-2 text-sm min-h-10': size === 'sm',
      'px-4 py-3 text-base min-h-11': size === 'md',
      'px-6 py-4 text-lg min-h-12': size === 'lg',
    },
    className
  )

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {children}
    </button>
  )
}

export default ResponsiveLayout