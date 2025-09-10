'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface SubscriptionData {
  status: 'free' | 'premium'
  isPremium: boolean
  isActive: boolean
  endDate?: string
  daysRemaining?: number
}

/**
 * Hook that fetches real subscription status from the database API
 * This replaces the mock subscription system when a user is logged in
 */
export const useRealSubscription = () => {
  const { user } = useAuth()
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptionStatus = async (userId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Fetching real subscription status for user:', userId)
      
      const response = await fetch(`/api/user/subscription?userId=${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Real subscription data received:', data)
        console.log('🔍 Subscription parsing:', {
          dbStatus: data.subscription?.status,
          dbIsPremium: data.subscription?.isPremium,
          dbIsActive: data.subscription?.isActive,
          endDate: data.subscription?.endDate
        })
        
        const subscriptionData: SubscriptionData = {
          status: data.subscription?.isPremium ? 'premium' : 'free',
          isPremium: data.subscription?.isPremium || false,
          isActive: data.subscription?.isActive || false,
          endDate: data.subscription?.endDate,
          daysRemaining: data.subscription?.daysRemaining
        }
        
        console.log('📊 Final subscription data:', subscriptionData)
        setSubscriptionData(subscriptionData)
        
        // Trigger subscription-changed event to update other components
        window.dispatchEvent(new CustomEvent('real-subscription-changed', { 
          detail: subscriptionData 
        }))
        
      } else {
        const errorText = await response.text()
        console.warn('⚠️ Failed to fetch subscription status:', response.status, errorText)
        setError(`Failed to fetch subscription: ${response.status}`)
      }
    } catch (err) {
      console.error('❌ Error fetching real subscription:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchSubscriptionStatus(user.id)
    } else {
      // No user - reset to free
      setSubscriptionData({
        status: 'free',
        isPremium: false,
        isActive: false
      })
    }
  }, [user?.id])

  // Listen for external subscription changes (like from promo codes)
  useEffect(() => {
    const handleSubscriptionChange = () => {
      if (user?.id) {
        console.log('🔄 Subscription change event - refetching...')
        fetchSubscriptionStatus(user.id)
      }
    }

    window.addEventListener('subscription-changed', handleSubscriptionChange)
    window.addEventListener('real-subscription-refresh', handleSubscriptionChange)
    
    return () => {
      window.removeEventListener('subscription-changed', handleSubscriptionChange)
      window.removeEventListener('real-subscription-refresh', handleSubscriptionChange)
    }
  }, [user?.id])

  const refetch = () => {
    if (user?.id) {
      fetchSubscriptionStatus(user.id)
    }
  }

  return {
    subscriptionData,
    isLoading,
    error,
    refetch,
    // Convenience properties
    isPremium: subscriptionData?.isPremium || false,
    status: subscriptionData?.status || 'free',
    isActive: subscriptionData?.isActive || false,
    endDate: subscriptionData?.endDate,
    daysRemaining: subscriptionData?.daysRemaining
  }
}