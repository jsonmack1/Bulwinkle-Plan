// Real subscription system with database integration
// Handles authentic Stripe subscriptions and database queries

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

// Helper functions for subscription management
export const canUseDifferentiation = (status: SubscriptionStatus): boolean => {
  return status === 'premium' || status === 'school'
}

export const getRemainingFeatures = (currentStatus: SubscriptionStatus): string[] => {
  if (currentStatus === 'free') {
    return SUBSCRIPTION_PLANS.premium.features
  }
  
  if (currentStatus === 'premium') {
    return SUBSCRIPTION_PLANS.school.features.filter(
      feature => !SUBSCRIPTION_PLANS.premium.features.includes(feature)
    )
  }
  
  return []
}

// Function to trigger subscription refresh across components
export const triggerSubscriptionRefresh = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('subscription-changed'))
    window.dispatchEvent(new Event('real-subscription-refresh'))
  }
}

// Import the auth context to get real user data
import { useAuth } from '../contexts/AuthContext';

// Real subscription hook that queries the database
export const useSubscription = () => {
  const { user } = useAuth() // Use proper auth context
  const [status, setStatus] = React.useState<SubscriptionStatus>('free')
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [subscriptionData, setSubscriptionData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  
  const fetchRealSubscription = async (userId: string) => {
    if (loading) return // Prevent multiple simultaneous requests
    
    setLoading(true)
    try {
      console.log('🔍 Fetching real subscription for user:', userId);
      const response = await fetch(`/api/user/subscription?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real subscription data:', data);
        setSubscriptionData(data);
        
        // Set status based on real database data
        const isPremium = data.subscription?.isPremium || 
                         data.subscription?.status === 'premium' ||
                         data.subscription?.subscription_status === 'premium';
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
    } finally {
      setLoading(false)
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
        console.log('🔄 Subscription change event detected, refreshing...');
        await fetchRealSubscription(user.id);
      }
    }
    
    // Listen for subscription changes (from successful payments)
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
    canUseDifferentiation: canUseDifferentiation(status),
    isHydrated,
    loading,
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