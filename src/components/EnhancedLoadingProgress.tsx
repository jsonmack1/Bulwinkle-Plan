import React, { useState, useEffect } from 'react'

interface EnhancedLoadingProgressProps {
  isSubMode: boolean
  duration: string
  subject: string
  topic: string
}

interface ProgressStep {
  id: number
  label: string
  description: string
  icon: string
  duration: number // seconds
}

const EnhancedLoadingProgress: React.FC<EnhancedLoadingProgressProps> = ({
  isSubMode,
  duration,
  subject,
  topic
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)

  const steps: ProgressStep[] = [
    {
      id: 0,
      label: "Analyzing Requirements",
      description: `Reviewing ${subject} standards for ${topic}`,
      icon: "📋",
      duration: 3
    },
    {
      id: 1,
      label: "Designing Structure", 
      description: `Creating ${duration}-minute lesson framework`,
      icon: "🏗️",
      duration: 4
    },
    {
      id: 2,
      label: "Generating Content",
      description: "Crafting engaging activities and materials",
      icon: "✨",
      duration: 8
    },
    {
      id: 3,
      label: "Adding Differentiation",
      description: "Tailoring for diverse learning needs",
      icon: "🎯",
      duration: 4
    },
    {
      id: 4,
      label: "Quality Review",
      description: "Ensuring pedagogical excellence",
      icon: "🔍",
      duration: 3
    },
    {
      id: 5,
      label: "Finalizing",
      description: isSubMode ? "Preparing substitute-ready format" : "Polishing your lesson plan",
      icon: "🎉",
      duration: 2
    }
  ]

  const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0)

  useEffect(() => {
    let stepTimer: NodeJS.Timeout
    let progressTimer: NodeJS.Timeout
    let stepProgressTimer: NodeJS.Timeout
    
    const startStepProgress = () => {
      let elapsed = 0
      const currentStepDuration = steps[currentStep]?.duration || 3
      
      stepProgressTimer = setInterval(() => {
        elapsed += 0.1
        const stepPct = Math.min((elapsed / currentStepDuration) * 100, 100)
        setStepProgress(stepPct)
        
        // Update overall progress
        const stepsCompleted = currentStep
        const currentStepProgress = stepPct / 100
        const overallProgress = ((stepsCompleted + currentStepProgress) / steps.length) * 100
        setProgress(Math.min(overallProgress, 95)) // Cap at 95% until complete
        
        if (stepPct >= 100) {
          clearInterval(stepProgressTimer)
          setTimeout(() => {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
            setStepProgress(0)
          }, 200)
        }
      }, 100)
    }

    if (currentStep < steps.length) {
      startStepProgress()
    }

    return () => {
      clearInterval(stepTimer)
      clearInterval(progressTimer)
      clearInterval(stepProgressTimer)
    }
  }, [currentStep, steps])

  return (
    <div className="text-center py-12 max-w-2xl mx-auto">
      {/* Main Progress Icon */}
      <div className="text-8xl sm:text-[12rem] mb-6 animate-bounce">
        {steps[currentStep]?.icon || "🎯"}
      </div>
      
      {/* Main Status */}
      <div className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
        {isSubMode ? 'Creating Your Substitute Plan' : 'Crafting Your Lesson Plan'}
      </div>
      
      {/* Current Step Description */}
      <div className="text-lg sm:text-2xl text-blue-600 font-semibold mb-1">
        {steps[currentStep]?.label || "Processing..."}
      </div>
      <div className="text-base sm:text-xl text-gray-600 mb-6 font-bold">
        {steps[currentStep]?.description || "Working on your lesson plan..."}
      </div>
      
      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Overall Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Step Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Current Step</span>
          <span>{Math.round(stepProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${stepProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            {/* Step Circle */}
            <div className={`w-8 h-8 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-sm sm:text-xl font-medium mb-2 transition-all duration-300 ${
              index < currentStep 
                ? 'bg-green-500 text-white' 
                : index === currentStep 
                ? 'bg-blue-500 text-white animate-pulse' 
                : 'bg-gray-200 text-gray-400'
            }`}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            
            {/* Step Label */}
            <div className={`text-xs sm:text-lg text-center transition-colors duration-300 font-bold ${
              index <= currentStep ? 'text-gray-700 font-medium' : 'text-gray-400'
            }`}>
              {step.label}
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`h-0.5 w-full mt-4 transition-colors duration-300 ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Time Estimate */}
      <div className="text-sm text-gray-500">
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span>
            Estimated time: {totalDuration - Math.floor((currentStep * 3) + (stepProgress / 100 * 3))}s remaining
          </span>
        </div>
        <div className="mt-1">
          Generating a comprehensive {duration}-minute lesson plan
        </div>
      </div>
      
      {/* Reassuring Message */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800">
          <div className="font-semibold mb-1">✨ What we're creating for you:</div>
          <div className="text-blue-700">
            • Standards-aligned activities and objectives<br/>
            • Differentiation strategies for all learners<br/>
            • Assessment rubrics and reflection prompts<br/>
            • Ready-to-use materials and resources
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedLoadingProgress