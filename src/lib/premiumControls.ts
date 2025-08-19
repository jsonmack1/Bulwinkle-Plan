import { FreeTierLimits, PremiumFeatures } from '../types/memoryBank'

/**
 * Premium Access Control System for Memory Bank Phase 4
 * Manages free tier limitations and premium feature gating
 */

export const FREE_TIER_LIMITS: FreeTierLimits = {
  maxStoredActivities: 5,
  maxSearchResults: 3,
  noSmartSuggestions: true,
  noAnalytics: true,
  noTemplateCreation: true,
  noExport: true
}

export const PREMIUM_FEATURES: PremiumFeatures = {
  unlimitedStorage: true,
  smartSuggestions: true,
  advancedAnalytics: true,
  templateSystem: true,
  exportOptions: true,
  prioritySupport: true
}

export class PremiumAccessControl {
  private isPremium: boolean

  constructor(isPremium: boolean) {
    this.isPremium = isPremium
  }

  // Check if user can store more activities
  canStoreActivity(currentActivityCount: number): boolean {
    if (this.isPremium) return true
    return currentActivityCount < FREE_TIER_LIMITS.maxStoredActivities
  }

  // Check if user can access smart suggestions
  canAccessSmartSuggestions(): boolean {
    return this.isPremium
  }

  // Check if user can use template features
  canUseTemplates(): boolean {
    return this.isPremium
  }

  // Check if user can access analytics dashboard
  canAccessAnalytics(): boolean {
    return this.isPremium
  }

  // Check if user can export activities
  canExportActivities(): boolean {
    return this.isPremium
  }

  // Get limited search results for free users
  getLimitedSearchResults<T>(results: T[]): T[] {
    if (this.isPremium) return results
    return results.slice(0, FREE_TIER_LIMITS.maxSearchResults)
  }

  // Get feature availability status
  getFeatureStatus() {
    return {
      storage: {
        available: this.isPremium ? 'unlimited' : `${FREE_TIER_LIMITS.maxStoredActivities} activities`,
        limit: this.isPremium ? null : FREE_TIER_LIMITS.maxStoredActivities
      },
      smartSuggestions: {
        available: this.isPremium,
        reason: this.isPremium ? null : 'Premium feature'
      },
      analytics: {
        available: this.isPremium,
        reason: this.isPremium ? null : 'Premium feature'
      },
      templates: {
        available: this.isPremium,
        reason: this.isPremium ? null : 'Premium feature'
      },
      export: {
        available: this.isPremium,
        reason: this.isPremium ? null : 'Premium feature'
      }
    }
  }

  // Calculate how close user is to limits
  getUsageStatus(currentActivityCount: number) {
    if (this.isPremium) {
      return {
        status: 'unlimited',
        percentage: 0,
        remaining: null
      }
    }

    const percentage = (currentActivityCount / FREE_TIER_LIMITS.maxStoredActivities) * 100
    const remaining = Math.max(0, FREE_TIER_LIMITS.maxStoredActivities - currentActivityCount)

    return {
      status: percentage >= 100 ? 'limit_reached' : percentage >= 80 ? 'near_limit' : 'normal',
      percentage: Math.min(100, percentage),
      remaining
    }
  }
}

// Conversion tracking
export interface ConversionTrigger {
  trigger: 'storage_limit' | 'feature_attempt' | 'suggestion_click' | 'analytics_view' | 'template_attempt'
  context: string
  timestamp: string
}

export class ConversionTracker {
  private static triggers: ConversionTrigger[] = []

  static trackTrigger(trigger: ConversionTrigger['trigger'], context: string) {
    this.triggers.push({
      trigger,
      context,
      timestamp: new Date().toISOString()
    })

    // Store in localStorage for persistence
    try {
      localStorage.setItem('memorybank_conversion_triggers', JSON.stringify(this.triggers))
    } catch (error) {
      console.warn('Failed to store conversion triggers:', error)
    }
  }

  static getTriggers(): ConversionTrigger[] {
    try {
      const stored = localStorage.getItem('memorybank_conversion_triggers')
      if (stored) {
        this.triggers = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load conversion triggers:', error)
    }
    return this.triggers
  }

  static getMostCommonTrigger(): ConversionTrigger['trigger'] | null {
    const triggers = this.getTriggers()
    if (triggers.length === 0) return null

    const counts = triggers.reduce((acc, trigger) => {
      acc[trigger.trigger] = (acc[trigger.trigger] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0][0] as ConversionTrigger['trigger']
  }

  static getConversionReadiness(): 'low' | 'medium' | 'high' {
    const triggers = this.getTriggers()
    const uniqueTriggers = new Set(triggers.map(t => t.trigger)).size
    const totalTriggers = triggers.length

    if (totalTriggers >= 5 && uniqueTriggers >= 3) return 'high'
    if (totalTriggers >= 3 || uniqueTriggers >= 2) return 'medium'
    return 'low'
  }
}

interface UsageRecord {
  feature: string
  action: string
  metadata?: Record<string, unknown>
  timestamp: string
}

interface FeatureCount {
  feature: string
  count: number
}

// Usage analytics helpers
export const UsageAnalytics = {
  // Track feature usage
  trackFeatureUsage(feature: string, action: string, metadata?: Record<string, unknown>) {
    try {
      const usage = {
        feature,
        action,
        metadata,
        timestamp: new Date().toISOString()
      }

      // Store in localStorage (in real app, would send to backend)
      const existing = JSON.parse(localStorage.getItem('memorybank_usage') || '[]')
      existing.push(usage)
      
      // Keep only last 100 entries to avoid storage bloat
      const recent = existing.slice(-100)
      localStorage.setItem('memorybank_usage', JSON.stringify(recent))
    } catch (error) {
      console.warn('Failed to track usage:', error)
    }
  },

  // Get usage statistics
  getUsageStats() {
    try {
      const usage = JSON.parse(localStorage.getItem('memorybank_usage') || '[]')
      const today = new Date().toDateString()
      const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      return {
        totalActions: usage.length,
        todayActions: usage.filter((u: UsageRecord) => new Date(u.timestamp).toDateString() === today).length,
        weekActions: usage.filter((u: UsageRecord) => new Date(u.timestamp) >= thisWeek).length,
        topFeatures: this.getTopFeatures(usage),
        engagementScore: this.calculateEngagementScore(usage)
      }
    } catch (error) {
      console.warn('Failed to get usage stats:', error)
      return {
        totalActions: 0,
        todayActions: 0,
        weekActions: 0,
        topFeatures: [],
        engagementScore: 0
      }
    }
  },

  // Calculate engagement score (0-100)
  calculateEngagementScore(usage: UsageRecord[]): number {
    if (usage.length === 0) return 0

    const recentUsage = usage.filter(u => 
      new Date(u.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    const uniqueFeatures = new Set(recentUsage.map(u => u.feature)).size
    const dailyAverage = recentUsage.length / 7
    const featureVariety = Math.min(uniqueFeatures / 5, 1) // Max 5 features
    
    return Math.round((dailyAverage * 10 + featureVariety * 50) * 2)
  },

  // Get most used features
  getTopFeatures(usage: UsageRecord[]): FeatureCount[] {
    const counts = usage.reduce((acc, u) => {
      acc[u.feature] = (acc[u.feature] || 0) + 1
      return acc
    }, {})

    return Object.entries(counts)
      .map(([feature, count]) => ({ feature, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }
}