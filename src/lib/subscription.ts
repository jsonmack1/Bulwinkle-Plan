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

// Real subscription hook that queries the database
export const useSubscription = () => {
  const [status, setStatus] = React.useState<SubscriptionStatus>('free')
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [subscriptionData, setSubscriptionData] = React.useState<any>(null)
  
  // Get user from auth context
  let user = null;
  if (typeof window !== 'undefined') {
    try {
      // Try to get user from auth storage or context
      const authData = localStorage.getItem('auth-user');
      if (authData) {
        user = JSON.parse(authData);
      }
    } catch (error) {
      console.log('No auth data found, continuing as anonymous user');
    }
  }
  
  const fetchRealSubscription = async (userId: string) => {
    try {
      console.log('🔍 Fetching real subscription for user:', userId);
      const response = await fetch(`/api/user/subscription?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real subscription data:', data);
        setSubscriptionData(data);
        
        // Set status based on real database data
        const isPremium = data.subscription?.isPremium || false;
        setStatus(isPremium ? 'premium' : 'free');
        
        return data;
      } else {
        console.warn('⚠️ Subscription API failed, using free status');
        setStatus('free');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching subscription:', error);
      setStatus('free');
      return null;
    }
  };
  
  React.useEffect(() => {
    setIsHydrated(true)
    
    if (user?.id) {
      // User is logged in - fetch real subscription
      fetchRealSubscription(user.id);
    } else {
      // Anonymous user - always free
      setStatus('free');
    }
    
    const handleSubscriptionChange = async () => {
      if (user?.id) {
        await fetchRealSubscription(user.id);
      }
    }
    
    // Listen for subscription changes
    window.addEventListener('subscription-changed', handleSubscriptionChange)
    window.addEventListener('real-subscription-refresh', handleSubscriptionChange)
    
    return () => {
      window.removeEventListener('subscription-changed', handleSubscriptionChange)
      window.removeEventListener('real-subscription-refresh', handleSubscriptionChange)
    }
  }, [user?.id])
  
  const info = React.useMemo(() => SUBSCRIPTION_PLANS[status], [status])
  
  return {
    status,
    info,
    isPremium: status === 'premium' || status === 'school',
    canUseDifferentiation: status === 'premium' || status === 'school',
    isHydrated,
    subscriptionData, // Real subscription data from database
    refreshSubscription: () => {
      if (user?.id) {
        fetchRealSubscription(user.id);
      }
    }
  }
}

// Import React for the hook
import React from 'react'