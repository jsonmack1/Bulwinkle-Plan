'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { ActivityNode, SearchFilters } from '../../types/memoryBank'
import ActivityNodeComponent from '../../components/memory-bank/ActivityNode'
import SearchAndFilter from '../../components/memory-bank/SearchAndFilter'
import ActivityPreview from '../../components/memory-bank/ActivityPreview'
import MemoryBankPremiumLock from '../../components/memory-bank/MemoryBankPremiumLock'
import UsageAnalytics from '../../components/memory-bank/UsageAnalytics'
import SmartFeedbackPrompt from '../../components/memory-bank/SmartFeedbackPrompt'
import { StorageLimitPrompt, FeatureUpgradeModal, GentleSuggestionPrompt, SuccessPrompt, StorageProgressIndicator } from '../../components/memory-bank/UpgradePrompts'
import { useSubscription } from '../../lib/subscription-mock'
import { PremiumAccessControl, UsageAnalytics as UsageTracker } from '../../lib/premiumControls'
import { TeacherFeedback } from '../../types/memoryBank'
import { useAuth } from '../../contexts/AuthContext'
import { useMemoryBank } from '../../lib/memoryBank'
import Navigation from '../../components/Navigation'

// Mock data for demonstration - real implementation will use database
const mockActivities: ActivityNode[] = [
  {
    id: 'demo_activity_1',
    title: 'Sample Revolutionary War Analysis',
    subject: 'Social Studies',
    gradeLevel: 'AP US History', 
    topic: 'American Revolution',
    activityType: 'Document Analysis',
    duration: 90,
    rating: 5,
    useCount: 12,
    createdAt: '2024-01-15T10:30:00Z',
    lastUsed: '2024-01-20T14:20:00Z',
    preview: '[Demo] Students analyze primary source documents from the Revolutionary War period using HIPP method.',
    tags: ['Demo Data', 'Historical Thinking'],
    isFavorite: true,
    mode: 'teacher',
    fullContent: 'This is demo content. Your generated lessons will appear here automatically.',
    templateUseCount: 3,
    successScore: 92
  }
]

export default function MemoryBankPage() {
  const { user, loading: authLoading } = useAuth()
  const { isPremium, isHydrated } = useSubscription()
  const { getAllLessons } = useMemoryBank()
  const [activities, setActivities] = useState<ActivityNode[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<ActivityNode | null>(null)
  const [showPremiumLock, setShowPremiumLock] = useState(false)
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: '',
    subject: '',
    gradeLevel: '',
    timeframe: 'all',
    mode: 'all',
    sortBy: 'recent'
  })

  // Phase 4: Premium and feedback state
  const [feedbackPrompt, setFeedbackPrompt] = useState<{
    activity: ActivityNode
    type: 'rating' | 'quick' | 'detailed' | 'return_visit'
  } | null>(null)
  const [upgradeModal, setUpgradeModal] = useState<{
    show: boolean
    featureName?: string
    featureDescription?: string
    featureIcon?: string
  }>({ show: false })
  const [showGentleSuggestion, setShowGentleSuggestion] = useState(false)
  const [showSuccessPrompt, setShowSuccessPrompt] = useState(false)

  // Initialize premium access control
  const accessControl = useMemo(() => new PremiumAccessControl(isPremium), [isPremium])

  // Load real lessons from database
  React.useEffect(() => {
    const loadLessons = async () => {
      try {
        setIsLoadingActivities(true)
        const realLessons = await getAllLessons()
        
        // If no real lessons exist, show demo data with a helpful message
        if (realLessons.length === 0) {
          setActivities(mockActivities)
        } else {
          setActivities(realLessons)
        }
      } catch (error) {
        console.error('Failed to load lessons from Memory Bank:', error)
        setActivities(mockActivities) // Fallback to demo data
      } finally {
        setIsLoadingActivities(false)
      }
    }
    
    loadLessons()
  }, [getAllLessons])

  // Track page visit
  React.useEffect(() => {
    if (isHydrated) {
      UsageTracker.trackFeatureUsage('memory-bank', 'page_visit')
    }
  }, [isHydrated])

  // Show premium lock if not premium user (after hydration to avoid SSR mismatch)
  React.useEffect(() => {
    if (isHydrated && !authLoading) {
      if (!isPremium && user) {
        // Only show premium lock for authenticated non-premium users
        setShowPremiumLock(true)
      } else {
        // Premium users or unauthenticated users don't see the premium lock
        setShowPremiumLock(false)
      }
    }
  }, [isHydrated, authLoading, isPremium, user])

  // Smart feedback prompting
  React.useEffect(() => {
    if (!isHydrated || activities.length === 0) return

    // Find activities that might need feedback
    const recentActivity = activities.find(a => 
      a.lastUsed && 
      new Date(a.lastUsed) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
      !a.rating
    )

    const highUseActivity = activities.find(a => 
      a.useCount >= 3 && !a.rating
    )

    // Show feedback prompt with 30% probability for natural feel
    if (recentActivity && Math.random() < 0.3) {
      setFeedbackPrompt({
        activity: recentActivity,
        type: 'return_visit'
      })
    } else if (highUseActivity && Math.random() < 0.2) {
      setFeedbackPrompt({
        activity: highUseActivity,
        type: 'quick'
      })
    }
  }, [activities, isHydrated])

  // Gentle upgrade suggestions
  React.useEffect(() => {
    if (!isHydrated || isPremium) return

    const ratedActivities = activities.filter(a => a.rating)
    const avgRating = ratedActivities.length > 0 
      ? ratedActivities.reduce((sum, a) => sum + (a.rating || 0), 0) / ratedActivities.length 
      : 0

    // Show suggestions based on engagement
    setTimeout(() => {
      if (activities.length >= 3 && !showGentleSuggestion) {
        setShowGentleSuggestion(true)
      } else if (avgRating >= 4 && ratedActivities.length >= 2 && !showSuccessPrompt) {
        setShowSuccessPrompt(true)
      }
    }, 5000) // Delay to avoid overwhelming user
  }, [activities, isHydrated, isPremium, accessControl, showGentleSuggestion, showSuccessPrompt])

  // Filter and sort activities based on search criteria
  const filteredActivities = useMemo(() => {
    let filtered = activities


    // Search term filter
    if (searchFilters.searchTerm) {
      const term = searchFilters.searchTerm.toLowerCase()
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(term) ||
        activity.topic.toLowerCase().includes(term) ||
        activity.tags.some(tag => tag.toLowerCase().includes(term))
      )
    }

    // Subject filter
    if (searchFilters.subject && searchFilters.subject !== 'all') {
      filtered = filtered.filter(activity => activity.subject === searchFilters.subject)
    }

    // Grade level filter  
    if (searchFilters.gradeLevel && searchFilters.gradeLevel !== 'all') {
      filtered = filtered.filter(activity => activity.gradeLevel === searchFilters.gradeLevel)
    }

    // Mode filter
    if (searchFilters.mode && searchFilters.mode !== 'all') {
      filtered = filtered.filter(activity => activity.mode === searchFilters.mode)
    }

    // Timeframe filter
    if (searchFilters.timeframe !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (searchFilters.timeframe) {
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3)
          break
      }
      
      filtered = filtered.filter(activity => new Date(activity.createdAt) >= filterDate)
    }

    // Sort
    let sorted: ActivityNode[]
    switch (searchFilters.sortBy) {
      case 'recent':
        sorted = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'popular':
        sorted = filtered.sort((a, b) => b.useCount - a.useCount)
        break
      case 'rating':
        sorted = filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'alphabetical':
        sorted = filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        sorted = filtered
    }

    // Apply free tier search result limitations
    return accessControl.getLimitedSearchResults(sorted)
  }, [activities, searchFilters, accessControl])

  const handleActivitySelect = useCallback((activity: ActivityNode) => {
    setSelectedActivity(activity)
  }, [])

  const handleSearchFilterChange = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters)
  }, [])

  const handleActivityAction = useCallback(async (activityId: string, action: 'reuse' | 'favorite' | 'delete' | 'template' | 'similar') => {
    const activity = activities.find(a => a.id === activityId)
    if (!activity) return

    switch (action) {
      case 'reuse':
        UsageTracker.trackFeatureUsage('memory-bank', 'activity_reuse', { activityId })
        // Update use count in database
        await updateLessonUsage(activityId)
        // Update local state for immediate UI feedback
        setActivities(prev => prev.map(a => 
          a.id === activityId 
            ? { ...a, useCount: a.useCount + 1, lastUsed: new Date().toISOString() }
            : a
        ))
        console.log('Reusing activity:', activityId)
        break

      case 'favorite':
        UsageTracker.trackFeatureUsage('memory-bank', 'toggle_favorite', { activityId })
        // Toggle favorite in database
        await toggleFavorite(activityId)
        // Update local state for immediate UI feedback
        setActivities(prev => prev.map(a => 
          a.id === activityId ? { ...a, isFavorite: !a.isFavorite } : a
        ))
        break

      case 'delete':
        UsageTracker.trackFeatureUsage('memory-bank', 'activity_delete', { activityId })
        // Delete from database
        await deleteLesson(activityId)
        // Update local state for immediate UI feedback
        setActivities(prev => prev.filter(a => a.id !== activityId))
        if (selectedActivity?.id === activityId) {
          setSelectedActivity(null)
        }
        break

      case 'template':
        if (!accessControl.canUseTemplates()) {
          setUpgradeModal({
            show: true,
            featureName: 'Template System',
            featureDescription: 'Use your successful activities as templates to create new ones faster.',
            featureIcon: '📋'
          })
          return
        }
        
        UsageTracker.trackFeatureUsage('memory-bank', 'use_template', { activityId })
        // Update template use count
        setActivities(prev => prev.map(a => 
          a.id === activityId 
            ? { ...a, templateUseCount: a.templateUseCount + 1 }
            : a
        ))
        console.log('Using activity as template:', activityId)
        break

      case 'similar':
        if (!accessControl.canAccessSmartSuggestions()) {
          setUpgradeModal({
            show: true,
            featureName: 'Smart Suggestions',
            featureDescription: 'Get intelligent recommendations to create similar activities based on your successful lessons.',
            featureIcon: '🧠'
          })
          return
        }
        
        UsageTracker.trackFeatureUsage('memory-bank', 'create_similar', { activityId })
        console.log('Creating similar activity:', activityId)
        break
    }
  }, [activities, accessControl, selectedActivity?.id])

  // Handle feedback submission
  const handleFeedbackSubmit = useCallback((activityId: string, feedback: TeacherFeedback) => {
    UsageTracker.trackFeatureUsage('memory-bank', 'feedback_submit', { 
      activityId, 
      rating: feedback.rating 
    })
    
    setActivities(prev => prev.map(a => 
      a.id === activityId 
        ? { ...a, rating: feedback.rating || a.rating, ...feedback }
        : a
    ))
    
    setFeedbackPrompt(null)
  }, [])

  // Handle upgrade attempts
  const handleUpgrade = useCallback(() => {
    UsageTracker.trackFeatureUsage('memory-bank', 'upgrade_click')
    // In real app, would redirect to payment flow
    console.log('Redirecting to upgrade flow...')
    setUpgradeModal({ show: false })
    setShowGentleSuggestion(false)
    setShowSuccessPrompt(false)
  }, [])

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
            <p className="text-gray-600 mb-6">You need to sign in to access your Memory Bank.</p>
            <div className="text-sm text-gray-500">
              The Memory Bank stores your lesson activities and provides smart suggestions to save you time.
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-25 to-orange-25" style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #fef2c7 100%)' }}>
      {/* Custom Header for Memory Bank */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Header Layout: Logo Left, Title Center, Navigation Right */}
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex-shrink-0">
              <img 
                src="/peabody-logo-new.svg" 
                alt="Peabody" 
                className="h-20 sm:h-24 w-auto"
              />
            </div>
            
            {/* Center: Title and Premium Badge */}
            <div className="flex flex-col items-center flex-1 mx-8">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Memory Bank</h1>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                  <span>💎</span>
                  <span className="hidden sm:inline">Premium</span>
                </div>
              </div>
              <p className="text-gray-600 mt-2 text-center max-w-2xl">
                Search, browse, and reuse your previously generated lesson activities. Build on your successful lessons and save time with your personal teaching library.
              </p>
            </div>
            
            {/* Right: Navigation and Stats */}
            <div className="flex flex-col items-end space-y-2 flex-shrink-0">
              <nav className="flex items-center space-x-2 text-sm text-gray-600">
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  🏠 Activity Builder
                </Link>
                <span>›</span>
                <span className="text-blue-600 font-medium">💎 Memory Bank</span>
              </nav>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span>📊</span>
                  <span>{activities.length} Activities</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>⭐</span>
                  <span>{activities.filter(a => a.isFavorite).length} Favorites</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Premium Prompts and Storage Status */}
        {!isPremium && isHydrated && (
          <div className="mb-6 space-y-4">
            {/* Storage Progress Indicator */}
            <StorageProgressIndicator
              current={activities.length}
              limit={5}
              onUpgrade={handleUpgrade}
            />

            {/* Storage Limit Prompt */}
            {!accessControl.canStoreActivity(activities.length) && (
              <StorageLimitPrompt
                onUpgrade={handleUpgrade}
                onDismiss={() => {}}
              />
            )}

            {/* Gentle Suggestion Prompt */}
            {showGentleSuggestion && (
              <GentleSuggestionPrompt
                activityCount={activities.length}
                onUpgrade={handleUpgrade}
                onDismiss={() => setShowGentleSuggestion(false)}
              />
            )}

            {/* Success-Based Prompt */}
            {showSuccessPrompt && (() => {
              const ratedActivities = activities.filter(a => a.rating)
              const avgRating = ratedActivities.length > 0 
                ? ratedActivities.reduce((sum, a) => sum + (a.rating || 0), 0) / ratedActivities.length 
                : 0
              return avgRating >= 4 && (
                <SuccessPrompt
                  averageRating={avgRating}
                  ratedActivities={ratedActivities.length}
                  onUpgrade={handleUpgrade}
                  onDismiss={() => setShowSuccessPrompt(false)}
                />
              )
            })()}
          </div>
        )}

        {/* Smart Feedback Prompt */}
        {feedbackPrompt && (
          <div className="mb-6">
            <SmartFeedbackPrompt
              activity={feedbackPrompt.activity}
              promptType={feedbackPrompt.type}
              onFeedbackSubmit={handleFeedbackSubmit}
              onDismiss={() => setFeedbackPrompt(null)}
            />
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Sidebar: Search + Activity List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Usage Analytics - Premium Only */}
            {accessControl.canAccessAnalytics() ? (
              <UsageAnalytics activities={activities} />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-3">📊</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Teaching Insights</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Get detailed analytics about your teaching patterns and activity success rates.
                  </p>
                  <button 
                    onClick={() => setUpgradeModal({
                      show: true,
                      featureName: 'Teaching Analytics',
                      featureDescription: 'Get insights into your teaching patterns, success rates, and optimization opportunities.',
                      featureIcon: '📊'
                    })}
                    className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                  >
                    Unlock Premium Analytics
                  </button>
                </div>
              </div>
            )}

            {/* Search & Filter Component */}
            <SearchAndFilter
              filters={searchFilters}
              onFiltersChange={handleSearchFilterChange}
              totalCount={activities.length}
              filteredCount={filteredActivities.length}
              activities={activities}
            />

            {/* Activities List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Your Activities</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {filteredActivities.length} of {activities.length}
                  </span>
                  {!isPremium && filteredActivities.length === 3 && activities.length > 3 && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Limited results
                    </span>
                  )}
                </div>
              </div>

              {filteredActivities.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-2">📭</div>
                  <p className="text-gray-500">No activities found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredActivities.map((activity) => (
                    <ActivityNodeComponent
                      key={activity.id}
                      activity={activity}
                      isSelected={selectedActivity?.id === activity.id}
                      onSelect={handleActivitySelect}
                      onAction={handleActivityAction}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Activity Preview */}
          <div className="lg:col-span-3">
            {selectedActivity ? (
              <ActivityPreview
                activity={selectedActivity}
                onAction={handleActivityAction}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select an Activity</h3>
                <p className="text-gray-600 mb-6">
                  Choose an activity from your memory bank to preview its content, reuse it, or make modifications.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-gray-600 text-2xl mb-2">🔍</div>
                    <div className="font-medium text-gray-900">Search & Filter</div>
                    <div className="text-gray-700">Find specific activities quickly</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-gray-600 text-2xl mb-2">🔄</div>
                    <div className="font-medium text-gray-900">Reuse</div>
                    <div className="text-gray-700">Adapt existing lessons for new classes</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-gray-600 text-2xl mb-2">⭐</div>
                    <div className="font-medium text-gray-900">Organize</div>
                    <div className="text-gray-700">Favorite and categorize your best activities</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Feature Lock Modal */}
      {showPremiumLock && (
        <MemoryBankPremiumLock
          onClose={() => setShowPremiumLock(false)}
          onUpgrade={() => setShowPremiumLock(false)}
        />
      )}

      {/* Feature Upgrade Modal */}
      {upgradeModal.show && (
        <FeatureUpgradeModal
          featureName={upgradeModal.featureName || 'Premium Feature'}
          featureDescription={upgradeModal.featureDescription || 'This feature is available with Premium subscription.'}
          featureIcon={upgradeModal.featureIcon || '💎'}
          onUpgrade={handleUpgrade}
          onDismiss={() => setUpgradeModal({ show: false })}
        />
      )}
      </div>
    </>
  )
}