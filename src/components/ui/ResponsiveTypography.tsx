'use client'

import React, { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { useDeviceDetection } from './ResponsiveLayout'

interface ResponsiveHeadingProps {
  children: ReactNode
  level?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold'
  color?: 'primary' | 'secondary' | 'muted' | 'accent'
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'span'
}

export const ResponsiveHeading: React.FC<ResponsiveHeadingProps> = ({
  children,
  level = 1,
  className = '',
  weight = 'bold',
  color = 'primary',
  as,
}) => {
  const { type: deviceType } = useDeviceDetection()

  const Element = as || (`h${level}` as keyof JSX.IntrinsicElements)

  const baseClasses = cn(
    'text-render-optimized leading-tight',
    {
      // Font sizes - mobile first
      'text-2xl sm:text-3xl lg:text-4xl': level === 1,
      'text-xl sm:text-2xl lg:text-3xl': level === 2,
      'text-lg sm:text-xl lg:text-2xl': level === 3,
      'text-base sm:text-lg lg:text-xl': level === 4,
      'text-sm sm:text-base lg:text-lg': level === 5,
      'text-xs sm:text-sm lg:text-base': level === 6,
      
      // Font weights
      'font-normal': weight === 'normal',
      'font-medium': weight === 'medium',
      'font-semibold': weight === 'semibold',
      'font-bold': weight === 'bold',
      'font-extrabold': weight === 'extrabold',
      
      // Colors
      'text-gray-900': color === 'primary',
      'text-gray-700': color === 'secondary',
      'text-gray-500': color === 'muted',
      'text-blue-600': color === 'accent',
    },
    className
  )

  return React.createElement(Element, { className: baseClasses }, children)
}

interface ResponsiveTextProps {
  children: ReactNode
  className?: string
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'primary' | 'secondary' | 'muted' | 'accent' | 'error' | 'success'
  as?: 'p' | 'span' | 'div' | 'strong' | 'em'
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className = '',
  size = 'base',
  weight = 'normal',
  color = 'primary',
  as = 'p',
}) => {
  const { type: deviceType } = useDeviceDetection()

  const baseClasses = cn(
    'text-render-optimized',
    {
      // Font sizes - mobile optimized
      'text-xs': size === 'xs',
      'text-sm': size === 'sm',
      'text-base leading-relaxed': size === 'base',
      'text-lg': size === 'lg',
      'text-xl': size === 'xl',
      
      // Font weights
      'font-normal': weight === 'normal',
      'font-medium': weight === 'medium',
      'font-semibold': weight === 'semibold',
      'font-bold': weight === 'bold',
      
      // Colors
      'text-gray-900': color === 'primary',
      'text-gray-700': color === 'secondary',
      'text-gray-500': color === 'muted',
      'text-blue-600': color === 'accent',
      'text-red-600': color === 'error',
      'text-green-600': color === 'success',
      
      // Mobile line height adjustments
      'leading-relaxed': deviceType === 'mobile' && size === 'base',
      'leading-normal': deviceType === 'mobile' && (size === 'sm' || size === 'xs'),
    },
    className
  )

  return React.createElement(as, { className: baseClasses }, children)
}

interface ResponsiveLabelProps {
  children: ReactNode
  className?: string
  required?: boolean
  htmlFor?: string
}

export const ResponsiveLabel: React.FC<ResponsiveLabelProps> = ({
  children,
  className = '',
  required = false,
  htmlFor,
}) => {
  const { type: deviceType } = useDeviceDetection()

  const baseClasses = cn(
    'block text-sm font-medium text-gray-700 text-render-optimized',
    deviceType === 'mobile' ? 'mb-2' : 'mb-1',
    className
  )

  return (
    <label htmlFor={htmlFor} className={baseClasses}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

interface ResponsiveListProps {
  children: ReactNode
  className?: string
  type?: 'bulleted' | 'numbered' | 'none'
  spacing?: 'tight' | 'normal' | 'loose'
}

export const ResponsiveList: React.FC<ResponsiveListProps> = ({
  children,
  className = '',
  type = 'bulleted',
  spacing = 'normal',
}) => {
  const { type: deviceType } = useDeviceDetection()

  const Element = type === 'numbered' ? 'ol' : 'ul'

  const baseClasses = cn(
    'text-render-optimized',
    {
      'list-disc list-inside': type === 'bulleted',
      'list-decimal list-inside': type === 'numbered',
      'list-none': type === 'none',
      
      // Mobile-optimized spacing
      'space-y-1': spacing === 'tight' && deviceType === 'mobile',
      'space-y-1.5': spacing === 'tight' && deviceType !== 'mobile',
      'space-y-2': spacing === 'normal' && deviceType === 'mobile',
      'space-y-1.5': spacing === 'normal' && deviceType !== 'mobile',
      'space-y-3': spacing === 'loose' && deviceType === 'mobile',
      'space-y-2': spacing === 'loose' && deviceType !== 'mobile',
    },
    className
  )

  return React.createElement(Element, { className: baseClasses }, children)
}

interface ResponsiveCodeProps {
  children: ReactNode
  className?: string
  block?: boolean
}

export const ResponsiveCode: React.FC<ResponsiveCodeProps> = ({
  children,
  className = '',
  block = false,
}) => {
  const { type: deviceType } = useDeviceDetection()

  if (block) {
    return (
      <pre className={cn(
        'bg-gray-100 rounded-lg p-4 text-sm font-mono text-gray-800 overflow-x-auto text-render-optimized',
        deviceType === 'mobile' && 'text-xs scrollbar-hide',
        className
      )}>
        <code>{children}</code>
      </pre>
    )
  }

  return (
    <code className={cn(
      'bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800 text-render-optimized',
      deviceType === 'mobile' && 'text-xs px-1.5 py-0.5',
      className
    )}>
      {children}
    </code>
  )
}

// Utility component for readable paragraphs
interface ReadableParagraphProps {
  children: ReactNode
  className?: string
}

export const ReadableParagraph: React.FC<ReadableParagraphProps> = ({
  children,
  className = '',
}) => {
  const { type: deviceType } = useDeviceDetection()

  return (
    <p className={cn(
      'text-render-optimized',
      deviceType === 'mobile' 
        ? 'text-base leading-relaxed text-gray-800' 
        : 'text-base leading-normal text-gray-700',
      className
    )}>
      {children}
    </p>
  )
}

// Typography scale component for consistent sizing
export const typographyScale = {
  mobile: {
    xs: 'text-xs leading-tight',
    sm: 'text-sm leading-normal',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-relaxed',
    xl: 'text-xl leading-tight',
    '2xl': 'text-2xl leading-tight',
    '3xl': 'text-3xl leading-tight',
  },
  tablet: {
    xs: 'text-xs leading-normal',
    sm: 'text-sm leading-normal',
    base: 'text-base leading-normal',
    lg: 'text-lg leading-normal',
    xl: 'text-xl leading-normal',
    '2xl': 'text-2xl leading-tight',
    '3xl': 'text-3xl leading-tight',
  },
  desktop: {
    xs: 'text-xs leading-normal',
    sm: 'text-sm leading-normal',
    base: 'text-base leading-normal',
    lg: 'text-lg leading-normal',
    xl: 'text-xl leading-normal',
    '2xl': 'text-2xl leading-normal',
    '3xl': 'text-3xl leading-normal',
  },
} as const

export const getTypographyClasses = (
  size: keyof typeof typographyScale.mobile,
  deviceType: 'mobile' | 'tablet' | 'desktop' = 'mobile'
) => {
  return typographyScale[deviceType][size]
}

const ResponsiveTypographyComponents = {
  ResponsiveHeading,
  ResponsiveText,
  ResponsiveLabel,
  ResponsiveList,
  ResponsiveCode,
  ReadableParagraph,
  typographyScale,
  getTypographyClasses,
}

export default ResponsiveTypographyComponents