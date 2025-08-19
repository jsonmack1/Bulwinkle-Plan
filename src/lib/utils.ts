import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Device detection utilities
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'mobile'
  
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export const getOrientation = (): 'portrait' | 'landscape' => {
  if (typeof window === 'undefined') return 'portrait'
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
}

// Responsive breakpoint utilities
export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export const isBreakpoint = (breakpoint: keyof typeof breakpoints, direction: 'up' | 'down' = 'up'): boolean => {
  if (typeof window === 'undefined') return false
  
  const width = window.innerWidth
  const value = breakpoints[breakpoint]
  
  return direction === 'up' ? width >= value : width < value
}

// Touch-friendly size calculations
export const getTouchFriendlySize = (baseSize: number): number => {
  return isTouchDevice() ? Math.max(baseSize, 44) : baseSize
}

// Safe area utilities
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 }
  
  const style = getComputedStyle(document.documentElement)
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
  }
}

// Viewport utilities for mobile browsers
export const getViewportHeight = (): number => {
  if (typeof window === 'undefined') return 0
  
  // Use dynamic viewport height if available (modern mobile browsers)
  const dvh = window.visualViewport?.height
  if (dvh) return dvh
  
  // Fallback to window.innerHeight
  return window.innerHeight
}

// Scroll utilities
export const preventBodyScroll = (prevent: boolean) => {
  if (typeof document === 'undefined') return
  
  if (prevent) {
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
  } else {
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
  }
}

// Format utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | undefined
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = undefined
      func(...args)
    }
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}