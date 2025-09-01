// Mock subscription system for testing premium features
// In production, this would be replaced with real subscription logic

export type SubscriptionStatus = 'free' | 'premium' | 'school'

export interface SubscriptionInfo {
  status: SubscriptionStatus
  plan: string
  features: string[]
  monthlyPrice?: string
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionStatus, SubscriptionInfo> = {
  free: {
    status: 'free',
    plan: 'Free Plan',
    features: ['5 lesson plans per month', 'CER teacher scripts', '5-second differentiation previews', 'Basic activity generation', 'Standard templates', 'Print activities'],
    monthlyPrice: undefined
  },
  premium: {
    status: 'premium',
    plan: 'Premium Plan',
    features: [
      'Unlimited lesson plans',
      'Full Intelligence Differentiation Engine',
      'ESL & IEP adaptations', 
      'Memory Bank lesson library',
      'Google Docs export',
      'Activity search and reuse',
      'Priority support'
    ],
    monthlyPrice: '$7.99'
  },
  school: {
    status: 'school',
    plan: 'School District Plan',
    features: [
      'All premium features',
      'Bulk teacher accounts',
      'Admin dashboard',
      'Usage analytics',
      'Custom branding',
      'Priority phone support'
    ],
    monthlyPrice: 'Contact Sales'
  }
}

export const mockSubscription = {
  getStatus: (): SubscriptionStatus => {
    if (typeof window === 'undefined') return 'free' // Server-side default
    return (localStorage.getItem('mockSubscription') as SubscriptionStatus) || 'free'
  },
  
  setStatus: (status: SubscriptionStatus) => {
    if (typeof window === 'undefined') return
    localStorage.setItem('mockSubscription', status)
    // Trigger a storage event to update other components
    window.dispatchEvent(new Event('subscription-changed'))
  },
  
  getInfo: (): SubscriptionInfo => {
    const status = mockSubscription.getStatus()
    return SUBSCRIPTION_PLANS[status]
  },
  
  isPremium: (): boolean => {
    const status = mockSubscription.getStatus()
    return status === 'premium' || status === 'school'
  },
  
  canUseDifferentiation: (): boolean => {
    return true // Allow all users to access differentiation (free users get preview)
  },
  
  getRemainingFeatures: (): string[] => {
    const currentStatus = mockSubscription.getStatus()
    
    if (currentStatus === 'free') {
      return SUBSCRIPTION_PLANS.premium.features
    }
    
    if (currentStatus === 'premium') {
      return SUBSCRIPTION_PLANS.school.features.filter(
        feature => !SUBSCRIPTION_PLANS.premium.features.includes(feature)
      )
    }
    
    return []
  },
  
  // Mock upgrade function
  mockUpgrade: (newStatus: SubscriptionStatus) => {
    mockSubscription.setStatus(newStatus)
    return Promise.resolve({ success: true, status: newStatus })
  },
  
  // Development helper
  isDevelopment: (): boolean => {
    return process.env.NODE_ENV === 'development'
  }
}

// React hook for subscription status
export const useSubscription = () => {
  const [status, setStatus] = React.useState<SubscriptionStatus>('free') // Always start with 'free' for SSR
  const [isHydrated, setIsHydrated] = React.useState(false)
  
  React.useEffect(() => {
    // This runs only on the client, preventing hydration mismatches
    setIsHydrated(true)
    setStatus(mockSubscription.getStatus())
    
    const handleStorageChange = () => {
      setStatus(mockSubscription.getStatus())
    }
    
    window.addEventListener('subscription-changed', handleStorageChange)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('subscription-changed', handleStorageChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
  
  const info = React.useMemo(() => SUBSCRIPTION_PLANS[status], [status])
  
  return {
    status,
    info,
    isPremium: status === 'premium' || status === 'school',
    canUseDifferentiation: status === 'premium' || status === 'school',
    upgrade: mockSubscription.mockUpgrade,
    setStatus: mockSubscription.setStatus,
    isHydrated
  }
}

// Import React for the hook
import React from 'react'