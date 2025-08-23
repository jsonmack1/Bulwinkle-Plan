import { useState, useEffect } from 'react'

type AnimationType = 'orbital' | 'wave' | 'leapfrog' | 'pulse'
type LoadingScenario = 'generating' | 'regenerating' | 'differentiating'

interface LoadingState {
  isVisible: boolean
  animation: AnimationType
  message: string
  scenario: LoadingScenario | null
}

const animationPatterns: AnimationType[] = ['orbital', 'wave', 'leapfrog', 'pulse']

const scenarioMessages = {
  generating: 'Creating your lesson plan...',
  regenerating: 'Regenerating your lesson plan...',  
  differentiating: 'Differentiating content...'
}

export const useAnimatedLoading = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isVisible: false,
    animation: 'orbital',
    message: '',
    scenario: null
  })

  // Cycle through animations every 3 seconds while loading
  useEffect(() => {
    if (!loadingState.isVisible) return

    const interval = setInterval(() => {
      setLoadingState(prev => ({
        ...prev,
        animation: animationPatterns[
          (animationPatterns.indexOf(prev.animation) + 1) % animationPatterns.length
        ]
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [loadingState.isVisible])

  const showLoading = (scenario: LoadingScenario, customMessage?: string) => {
    const randomAnimation = animationPatterns[Math.floor(Math.random() * animationPatterns.length)]
    
    setLoadingState({
      isVisible: true,
      animation: randomAnimation,
      message: customMessage || scenarioMessages[scenario],
      scenario
    })
  }

  const hideLoading = () => {
    setLoadingState(prev => ({
      ...prev,
      isVisible: false
    }))
  }

  return {
    loadingState,
    showLoading,
    hideLoading
  }
}