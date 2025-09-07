'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useDeviceDetection } from '../ui/ResponsiveLayout'

interface TutorialStep {
  id: string
  title: string
  description: string
  targetSelector: string
  position: 'top' | 'bottom' | 'left' | 'right'
  actionRequired: 'click' | 'select' | 'input' | 'none'
  validator?: () => boolean
}

interface FirstTimeTutorialProps {
  isOpen: boolean
  onComplete: () => void
  onSkip: () => void
  formState: {
    gradeLevel: string
    subject: string
    lessonTopic: string
    activityType: string
    customActivityType: string
  }
}

const FirstTimeTutorial: React.FC<FirstTimeTutorialProps> = ({
  isOpen,
  onComplete,
  onSkip,
  formState
}) => {
  const { type: deviceType } = useDeviceDetection()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [tutorialPosition, setTutorialPosition] = useState({ top: 0, left: 0 })

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'grade-level',
      title: "First, pick your grade level",
      description: "Select the grade level you're teaching. Don't worry, you can always change this later!",
      targetSelector: 'select[data-tutorial="grade-level"]',
      position: 'bottom',
      actionRequired: 'select',
      validator: () => !!formState.gradeLevel
    },
    {
      id: 'subject',
      title: "Choose your subject area", 
      description: "What subject will you be teaching today? Pick the one that fits your lesson.",
      targetSelector: 'select[data-tutorial="subject"]',
      position: 'bottom',
      actionRequired: 'select',
      validator: () => !!formState.subject
    },
    {
      id: 'lesson-topic',
      title: "What's your lesson about?",
      description: "Type in your lesson topic. Be specific - like 'photosynthesis' or 'adding fractions'.",
      targetSelector: 'input[data-tutorial="lesson-topic"]',
      position: 'bottom',
      actionRequired: 'input',
      validator: () => !!formState.lessonTopic.trim()
    },
    {
      id: 'activity-type',
      title: "Choose your activity type",
      description: "Pick the type of activity that works best for your lesson and classroom.",
      targetSelector: 'select[data-tutorial="activity-type"]',
      position: 'bottom',
      actionRequired: 'select',
      validator: () => !!formState.activityType && (formState.activityType !== 'other' || !!formState.customActivityType?.trim())
    },
    {
      id: 'build-lesson',
      title: "Ready to build!",
      description: "Hit this button to create your lesson plan. You can also explore advanced options if needed.",
      targetSelector: 'button[data-tutorial="build-lesson"]',
      position: 'top',
      actionRequired: 'none'
    }
  ]

  const currentStep = tutorialSteps[currentStepIndex]

  // Calculate position of tutorial prompt relative to target element
  const calculatePosition = useCallback(() => {
    if (!currentStep || !isOpen) return

    const targetElement = document.querySelector(currentStep.targetSelector)
    if (!targetElement) return

    const rect = targetElement.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    let top = 0
    let left = 0

    switch (currentStep.position) {
      case 'bottom':
        top = rect.bottom + scrollTop + 20
        left = rect.left + scrollLeft + (rect.width / 2) - 150
        break
      case 'top':
        top = rect.top + scrollTop - 120
        left = rect.left + scrollLeft + (rect.width / 2) - 150
        break
      case 'right':
        top = rect.top + scrollTop + (rect.height / 2) - 60
        left = rect.right + scrollLeft + 20
        break
      case 'left':
        top = rect.top + scrollTop + (rect.height / 2) - 60
        left = rect.left + scrollLeft - 320
        break
    }

    // Ensure tutorial doesn't go off screen
    const maxLeft = window.innerWidth - 320
    const maxTop = window.innerHeight + scrollTop - 140

    setTutorialPosition({
      top: Math.max(20, Math.min(top, maxTop)),
      left: Math.max(20, Math.min(left, maxLeft))
    })
  }, [currentStep, isOpen])

  // Check if current step is complete and advance
  useEffect(() => {
    if (!isOpen || !currentStep) return

    const checkCompletion = () => {
      if (currentStep.validator && currentStep.validator()) {
        setTimeout(() => {
          if (currentStepIndex < tutorialSteps.length - 1) {
            setCurrentStepIndex(prev => prev + 1)
          }
        }, 800) // Small delay to show completion
      }
    }

    const interval = setInterval(checkCompletion, 500)
    return () => clearInterval(interval)
  }, [currentStep, currentStepIndex, tutorialSteps.length, isOpen, formState])

  // Position calculation on step change and scroll
  useEffect(() => {
    if (!isOpen) return

    calculatePosition()
    
    const handleScroll = () => calculatePosition()
    const handleResize = () => calculatePosition()
    
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [calculatePosition, isOpen, currentStepIndex])

  // Show/hide animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  // Highlight target element
  useEffect(() => {
    if (!currentStep || !isOpen) return

    const targetElement = document.querySelector(currentStep.targetSelector)
    if (targetElement) {
      targetElement.classList.add('tutorial-highlight')
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    return () => {
      if (targetElement) {
        targetElement.classList.remove('tutorial-highlight')
      }
    }
  }, [currentStep, isOpen])

  console.log('🎬 Tutorial render check:', { isOpen, isVisible, currentStep: currentStep?.id })
  
  if (!isOpen || !isVisible || !currentStep) return null

  const HandDrawnArrow = () => {
    const arrowSVGs = {
      bottom: (
        <svg width="50" height="35" viewBox="0 0 50 35" className="absolute -top-9 left-1/2 transform -translate-x-1/2 tutorial-arrow">
          <path
            d="M25 5 Q23 8 20 12 Q22 14 25 18 Q28 14 30 12 Q27 8 25 5 Z M25 18 L25 30 M20 25 Q22 27 25 30 Q28 27 30 25"
            className="hand-drawn-arrow-bottom"
          />
        </svg>
      ),
      top: (
        <svg width="50" height="35" viewBox="0 0 50 35" className="absolute -bottom-9 left-1/2 transform -translate-x-1/2 tutorial-arrow">
          <path
            d="M25 30 Q27 27 30 23 Q28 21 25 17 Q22 21 20 23 Q23 27 25 30 Z M25 17 L25 5 M30 10 Q28 8 25 5 Q22 8 20 10"
            className="hand-drawn-arrow-top"
          />
        </svg>
      ),
      left: (
        <svg width="35" height="50" viewBox="0 0 35 50" className="absolute -right-9 top-1/2 transform -translate-y-1/2 tutorial-arrow">
          <path
            d="M30 25 Q27 23 23 20 Q21 22 17 25 Q21 28 23 30 Q27 27 30 25 Z M17 25 L5 25 M10 20 Q8 22 5 25 Q8 28 10 30"
            className="hand-drawn-arrow-left"
          />
        </svg>
      ),
      right: (
        <svg width="35" height="50" viewBox="0 0 35 50" className="absolute -left-9 top-1/2 transform -translate-y-1/2 tutorial-arrow">
          <path
            d="M5 25 Q8 27 12 30 Q14 28 18 25 Q14 22 12 20 Q8 23 5 25 Z M18 25 L30 25 M25 30 Q27 28 30 25 Q27 22 25 20"
            className="hand-drawn-arrow-right"
          />
        </svg>
      )
    }

    return arrowSVGs[currentStep.position] || arrowSVGs.bottom
  }

  return (
    <>
      {/* Semi-transparent overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] tutorial-overlay" />
      
      {/* Tutorial prompt */}
      <div
        className={cn(
          "fixed z-[70] tutorial-prompt",
          deviceType === 'mobile' ? "w-72" : "w-80"
        )}
        style={{
          top: `${tutorialPosition.top}px`,
          left: `${tutorialPosition.left}px`
        }}
      >
        <div className="relative">
          <HandDrawnArrow />
          
          <div className="bg-slate-800 text-white rounded-xl p-4 shadow-2xl border-2 border-white/20">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="tutorial-title text-lg font-bold mb-1">
                  {currentStep.title}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-gray-300">
                  <span>Step {currentStepIndex + 1} of {tutorialSteps.length}</span>
                  <div className="flex space-x-1">
                    {tutorialSteps.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          "w-2 h-2 rounded-full",
                          index <= currentStepIndex ? "bg-yellow-400" : "bg-gray-600"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <button
                onClick={onSkip}
                className="text-gray-400 hover:text-white transition-colors ml-2"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Content */}
            <p className="tutorial-description text-gray-100 text-sm leading-relaxed mb-4">
              {currentStep.description}
            </p>
            
            {/* Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={onSkip}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Skip Tutorial
              </button>
              
              {currentStepIndex === tutorialSteps.length - 1 && (
                <button
                  onClick={onComplete}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-800 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Got it!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default FirstTimeTutorial