'use client'

import { useState, useEffect } from 'react'

interface TutorialState {
  isFirstTime: boolean
  showTutorial: boolean
  hasCompletedTutorial: boolean
  tutorialStep: number
}

export const useTutorial = () => {
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    isFirstTime: false,
    showTutorial: false,
    hasCompletedTutorial: false,
    tutorialStep: 0
  })

  // Check if this is a first-time user
  useEffect(() => {
    const checkFirstTimeUser = () => {
      try {
        const hasVisited = localStorage.getItem('lesson-builder-visited')
        const hasCompletedTutorial = localStorage.getItem('lesson-builder-tutorial-completed')
        
        console.log('🔍 Tutorial check:', { hasVisited, hasCompletedTutorial })
        
        const isFirstTime = !hasVisited
        const hasTutorialCompleted = hasCompletedTutorial === 'true'
        
        console.log('🎯 Tutorial state:', { isFirstTime, hasTutorialCompleted })
        
        setTutorialState(prev => ({
          ...prev,
          isFirstTime,
          hasCompletedTutorial: hasTutorialCompleted,
          showTutorial: false // Don't auto-show, let component decide
        }))

        // Mark as visited
        if (!hasVisited) {
          localStorage.setItem('lesson-builder-visited', 'true')
          console.log('✅ Marked as visited')
        }
      } catch (error) {
        console.warn('Tutorial localStorage access failed:', error)
        // Fallback: assume not first time if localStorage fails
        setTutorialState(prev => ({
          ...prev,
          isFirstTime: false,
          showTutorial: false,
          hasCompletedTutorial: true
        }))
      }
    }

    checkFirstTimeUser()
  }, [])

  const startTutorial = () => {
    console.log('🚀 Starting tutorial')
    setTutorialState(prev => ({
      ...prev,
      showTutorial: true,
      tutorialStep: 0
    }))
  }

  const completeTutorial = () => {
    try {
      localStorage.setItem('lesson-builder-tutorial-completed', 'true')
    } catch (error) {
      console.warn('Failed to save tutorial completion:', error)
    }
    
    setTutorialState(prev => ({
      ...prev,
      showTutorial: false,
      hasCompletedTutorial: true
    }))
  }

  const skipTutorial = () => {
    try {
      localStorage.setItem('lesson-builder-tutorial-completed', 'true')
    } catch (error) {
      console.warn('Failed to save tutorial skip:', error)
    }
    
    setTutorialState(prev => ({
      ...prev,
      showTutorial: false,
      hasCompletedTutorial: true
    }))
  }

  const resetTutorial = () => {
    try {
      localStorage.removeItem('lesson-builder-tutorial-completed')
      localStorage.removeItem('lesson-builder-visited')
    } catch (error) {
      console.warn('Failed to reset tutorial:', error)
    }
    
    setTutorialState({
      isFirstTime: true,
      showTutorial: true,
      hasCompletedTutorial: false,
      tutorialStep: 0
    })
  }

  const nextStep = () => {
    setTutorialState(prev => ({
      ...prev,
      tutorialStep: prev.tutorialStep + 1
    }))
  }

  const prevStep = () => {
    setTutorialState(prev => ({
      ...prev,
      tutorialStep: Math.max(0, prev.tutorialStep - 1)
    }))
  }

  const setStep = (step: number) => {
    setTutorialState(prev => ({
      ...prev,
      tutorialStep: step
    }))
  }

  return {
    ...tutorialState,
    startTutorial,
    completeTutorial,
    skipTutorial,
    resetTutorial,
    nextStep,
    prevStep,
    setStep
  }
}