'use client'

import React, { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { useDeviceDetection, ResponsiveContainer } from './ResponsiveLayout'
import Navigation from '../Navigation'

interface AppLayoutProps {
  children: ReactNode
  className?: string
  showNavigation?: boolean
  containerSize?: 'full' | 'mobile' | 'tablet' | 'desktop'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  className = '',
  showNavigation = true,
  containerSize = 'full',
  padding = 'md',
}) => {
  const { type: deviceType, isTouch } = useDeviceDetection()

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-4 sm:p-6 lg:p-8',
    lg: 'p-6 sm:p-8 lg:p-12',
  }

  return (
    <div className={cn(
      'min-h-screen-mobile bg-gray-50',
      isTouch && 'touch-manipulation overscroll-none',
      className
    )}>
      {showNavigation && <Navigation />}
      
      <main className={cn(
        'flex-1 relative',
        deviceType === 'mobile' && 'pb-safe',
        paddingClasses[padding]
      )}>
        <ResponsiveContainer size={containerSize}>
          {children}
        </ResponsiveContainer>
      </main>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  children,
  className = '',
}) => {
  const { type: deviceType } = useDeviceDetection()

  return (
    <div className={cn(
      'text-center mb-8 lg:mb-12',
      className
    )}>
      <h1 className={cn(
        'font-bold text-gray-900 mb-4 text-render-optimized',
        deviceType === 'mobile' 
          ? 'text-2xl leading-tight' 
          : 'text-3xl lg:text-4xl leading-tight'
      )}>
        {title}
      </h1>
      
      {subtitle && (
        <p className={cn(
          'text-gray-600 max-w-2xl mx-auto text-render-optimized',
          deviceType === 'mobile' 
            ? 'text-sm leading-relaxed px-4' 
            : 'text-lg leading-normal'
        )}>
          {subtitle}
        </p>
      )}
      
      {children && (
        <div className={cn(
          deviceType === 'mobile' ? 'mt-6' : 'mt-8'
        )}>
          {children}
        </div>
      )}
    </div>
  )
}

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
}) => {
  const { type: deviceType } = useDeviceDetection()

  const paddingClasses = {
    none: '',
    sm: deviceType === 'mobile' ? 'p-3' : 'p-4',
    md: deviceType === 'mobile' ? 'p-4' : 'p-6',
    lg: deviceType === 'mobile' ? 'p-6' : 'p-8',
  }

  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: deviceType === 'mobile' ? 'shadow-mobile' : 'shadow-md',
    lg: deviceType === 'mobile' ? 'shadow-mobile-lg' : 'shadow-lg',
    xl: deviceType === 'mobile' ? 'shadow-mobile-lg' : 'shadow-xl',
  }

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  }

  return (
    <div className={cn(
      'bg-white border border-gray-200',
      paddingClasses[padding],
      shadowClasses[shadow],
      roundedClasses[rounded],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveModalProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  children,
  isOpen,
  onClose,
  title,
  className = '',
  maxWidth = 'md',
}) => {
  const { type: deviceType, isTouch } = useDeviceDetection()

  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  }

  return (
    <div className={cn(
      'fixed inset-0 z-50 bg-black bg-opacity-50 animate-fade-in',
      deviceType === 'mobile' 
        ? 'flex items-end justify-center p-4 pb-safe' 
        : 'flex items-center justify-center p-6',
      isTouch && 'touch-manipulation'
    )}>
      {/* Background overlay */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-label="Close modal"
      />
      
      {/* Modal content */}
      <div className={cn(
        'relative bg-white w-full animate-slide-up',
        deviceType === 'mobile' 
          ? 'rounded-t-3xl max-h-[90vh] overflow-y-auto' 
          : 'rounded-xl max-h-[85vh] overflow-y-auto',
        maxWidthClasses[maxWidth],
        className
      )}>
        {title && (
          <div className={cn(
            'sticky top-0 bg-white z-10 border-b border-gray-200',
            deviceType === 'mobile' 
              ? 'px-6 pt-6 pb-4 rounded-t-3xl' 
              : 'px-6 py-4 rounded-t-xl'
          )}>
            <h2 className={cn(
              'font-semibold text-gray-900 text-center',
              deviceType === 'mobile' ? 'text-lg' : 'text-xl'
            )}>
              {title}
            </h2>
          </div>
        )}
        
        <div className={cn(
          deviceType === 'mobile' ? 'p-6' : 'p-6'
        )}>
          {children}
        </div>
      </div>
    </div>
  )
}

interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
}) => {
  const { type: deviceType } = useDeviceDetection()

  const gapClasses = {
    sm: deviceType === 'mobile' ? 'gap-3' : 'gap-4',
    md: deviceType === 'mobile' ? 'gap-4' : 'gap-6',
    lg: deviceType === 'mobile' ? 'gap-6' : 'gap-8',
    xl: deviceType === 'mobile' ? 'gap-8' : 'gap-12',
  }

  return (
    <div className={cn(
      'grid',
      `grid-cols-${columns.mobile}`,
      `md:grid-cols-${columns.tablet}`,
      `lg:grid-cols-${columns.desktop}`,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

interface LoadingStateProps {
  message?: string
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  className = '',
}) => {
  const { type: deviceType } = useDeviceDetection()

  return (
    <div className={cn(
      'flex flex-col items-center justify-center',
      deviceType === 'mobile' ? 'py-12' : 'py-16',
      className
    )}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 mb-4',
        deviceType === 'mobile' ? 'w-8 h-8' : 'w-12 h-12'
      )} />
      <p className={cn(
        'text-gray-600 text-center',
        deviceType === 'mobile' ? 'text-sm' : 'text-base'
      )}>
        {message}
      </p>
    </div>
  )
}

const AppLayoutComponents = {
  AppLayout,
  PageHeader,
  Card,
  ResponsiveModal,
  ResponsiveGrid,
  LoadingState,
}

export default AppLayoutComponents