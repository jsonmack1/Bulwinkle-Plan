'use client'

import React, { useState, useEffect, useMemo, useCallback, useReducer, Suspense, lazy } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronDown, Printer, Share } from 'lucide-react'
import { formReducer, initialFormState, FormAction } from '../utils/formReducer'
import { useActivityGeneration } from '../hooks/useActivityGeneration'
import { useSubscription } from '../lib/subscription-mock'
import { useMemoryBank } from '../lib/memoryBank'
import { useFreemiumSystem } from '../hooks/useFreemiumSystem'
import Navigation from '../components/Navigation'
import { useAnimatedLoading } from '../hooks/useAnimatedLoading'
import { useScrollMomentumFix } from '../hooks/useScrollMomentumFix'
import ComponentPreloader from '../components/optimization/ComponentPreloader'

// Lazy load components that aren't immediately needed
const GoogleDriveButton = lazy(() => import('../components/GoogleDriveButton'))
const AnimatedLoadingScreen = lazy(() => import('../components/ui/AnimatedLoadingScreen'))

// Lazy load heavy components with preloading hints
const ActivityCreationModal = lazy(() => 
  import('../components/modals/ActivityCreationModal')
)
const DifferentiationMenu = lazy(() => 
  import('../components/premium/DifferentiationWorkspace/DifferentiationMenu')
)
const DifferentiationItem = lazy(() => 
  import('../components/premium/DifferentiationWorkspace/DifferentiationItem')
)
const PremiumFeatureLock = lazy(() => 
  import('../components/premium/PremiumFeatureLock')
)
const SubscriptionToggle = lazy(() => 
  import('../components/premium/SubscriptionToggle')
)
const YouTubeVideoMenu = lazy(() => 
  import('../components/premium/YouTubeVideoWorkspace').then(mod => ({ default: mod.YouTubeVideoMenu }))
)
const PremiumMathContent = lazy(() => 
  import('../components/math/PremiumMathContent')
)
const UpgradeModal = lazy(() => 
  import('../components/premium/UpgradeModal')
)
const EnhancedLoadingProgress = lazy(() => 
  import('../components/EnhancedLoadingProgress')
)
import { YouTubeVideo } from '../types/youtube'

// Type definitions for activity-based lesson building
interface ActivityOption {
  value: string
  label: string
  description?: string
  icon?: string
  emoji?: string
  requiresPrep?: boolean
  complexityLevel?: 'basic' | 'intermediate' | 'advanced'
}

interface DifferentiationContent {
  title: string
  talk_track: string[]
  instructions: string[]
  modifications: string[]
  materials_changes?: string[]
}

interface ESLAdaptations {
  vocabulary_support: string[]
  visual_aids: string[]
  language_scaffolds: string[]
}

interface IEPAdaptations {
  behavioral_supports: string[]
  sensory_accommodations: string[]
  cognitive_modifications: string[]
}

interface DifferentiationData {
  below_grade: DifferentiationContent
  at_grade: DifferentiationContent
  above_grade: DifferentiationContent
  esl_adaptations: ESLAdaptations & { title: string }
  iep_adaptations: IEPAdaptations & { title: string }
}

interface ParsedActivityContent {
  welcomeMessage: string
  objectives: string[]
  materials: string[]
  instructions: Array<{
    phase: string
    duration: string
    description: string
    teacherActions?: string
    studentActions?: string
    script?: string
  }>
  differentiation?: Array<{
    category: string
    strategies: string[]
  }>
  assessment?: string
  troubleshooting?: Array<{
    scenario: string
    solution: string
  }>
  managementTips?: string[]
  cerScripts?: {
    claims: string[]
    evidence: string[]
    reasoning: string[]
  }
  isSubstituteMode: boolean
}

// Activity Icon Carousel Component
const ActivityIconCarousel: React.FC<{ isSubMode: boolean }> = ({ isSubMode }) => {
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const icons = isSubMode ? ['📋', '🎯', '⏰', '📝', '🔄'] : ['🎓', '💡', '🚀', '📊', '✨'];
  const labels = isSubMode 
    ? ['Ready Plans', 'Clear Goals', 'Timed Activities', 'Easy Setup', 'Flexible Options']
    : ['Professional', 'Creative', 'Engaging', 'Data-Driven', 'Outstanding'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIconIndex((prev) => (prev + 1) % icons.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [icons.length]);

  return (
    <div className="text-center">
      <div className="text-6xl mb-2 transition-all duration-500">
        {icons[currentIconIndex]}
      </div>
      <div className="text-lg font-semibold text-gray-800 min-h-[1.5rem]">
        {labels[currentIconIndex]}
      </div>
    </div>
  );
};

// Rotating Messages Component
const RotatingMessages: React.FC = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  const messages = [
    "🎯 Analyzing your requirements...",
    "📚 Selecting age-appropriate activities...", 
    "✨ Adding engaging elements...",
    "🔧 Customizing for your classroom...",
    "🎉 Almost ready!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="text-center">
      <p className="text-gray-700 transition-all duration-500">
        {messages[currentMessageIndex]}
      </p>
    </div>
  );
};

function ActivityLessonBuilderContent() {
  // Fix scroll momentum interfering with form fields
  useScrollMomentumFix()
  
  // Get search params to check for builder=true
  const searchParams = useSearchParams()
  
  // Direct inline fix for field deselection
  useEffect(() => {
    const preventFieldBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'SELECT' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        console.log('🚫 BLOCKING blur on', target.tagName, target.id || 'unnamed')
        e.preventDefault()
        e.stopImmediatePropagation()
        setTimeout(() => target.focus(), 1)
        return false
      }
    }

    const handleScroll = (e: Event) => {
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && (activeElement.tagName === 'SELECT' || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        console.log('📜 Maintaining focus during scroll on', activeElement.tagName)
        e.stopPropagation()
        setTimeout(() => activeElement.focus(), 1)
      }
    }

    document.addEventListener('blur', preventFieldBlur, true)
    document.addEventListener('scroll', handleScroll, true)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('blur', preventFieldBlur, true)
      document.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [])
  
  // Consolidated form state with useReducer
  const [formState, dispatch] = useReducer(formReducer, initialFormState)
  
  // Auto-trigger builder mode when builder=true parameter is present
  useEffect(() => {
    const shouldShowBuilder = searchParams.get('builder');
    if (shouldShowBuilder === 'true') {
      console.log('🚀 Builder parameter detected - auto-showing builder form');
      
      // Look for "Start Creating Now" button and click it
      setTimeout(() => {
        const startButton = document.querySelector('[data-testid="start-creating-desktop"], [data-testid="start-creating-mobile"]') as HTMLButtonElement;
        if (startButton) {
          console.log('🎯 Auto-clicking Start Creating button');
          startButton.click();
        } else {
          console.log('⚠️ Start Creating button not found, dispatching action directly');
          // If button not found, dispatch the action directly
          dispatch({ type: 'SET_SHOW_ACTIVITY_CREATION', payload: true });
        }
      }, 1000); // Increased delay to ensure page is fully loaded
    }
  }, [searchParams, dispatch]);
  
  const [parsedContent, setParsedContent] = useState<ParsedActivityContent | null>(null)
  const [showPremiumLock, setShowPremiumLock] = useState(false)
  const [showInlineDifferentiation, setShowInlineDifferentiation] = useState(false)
  const [differentiationData, setDifferentiationData] = useState<Record<string, unknown> | null>(null)
  const [isLoadingDifferentiation, setIsLoadingDifferentiation] = useState(false)
  const [appliedDifferentiation, setAppliedDifferentiation] = useState<Record<string, unknown>>({})
  const [originalLessonContent, setOriginalLessonContent] = useState<string>('')
  const [differentiationSuggestions, setDifferentiationSuggestions] = useState<Record<string, unknown> | null>(null)
  const [differentiationMessage, setDifferentiationMessage] = useState<string>('')
  const [isDifferentiationPanelCollapsed, setIsDifferentiationPanelCollapsed] = useState<boolean>(false)
  
  // YouTube Video Integration State - Phase 1
  const [showYouTubeVideos, setShowYouTubeVideos] = useState(false)
  
  // Animated loading screen state
  const { loadingState, showLoading, hideLoading } = useAnimatedLoading()
  const [isYouTubePanelCollapsed, setIsYouTubePanelCollapsed] = useState(false)
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set())
  const [selectedVideos, setSelectedVideos] = useState<YouTubeVideo[]>([])
  
  // Share Dropdown State
  const [showShareDropdown, setShowShareDropdown] = useState(false)
  const [isExportingToGoogle, setIsExportingToGoogle] = useState(false)
  
  // Step-by-Step Math Panel State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  // Custom hooks
  const { generateActivity: generateActivityAPI, parseActivityContent } = useActivityGeneration()
  const { isPremium, canUseDifferentiation } = useSubscription()
  const { saveLesson } = useMemoryBank()
  const { 
    usageData, 
    showAccountModal, 
    showUpgradeModal: showFreemiumUpgradeModal, 
    upgradeModalType,
    trackLessonGeneration, 
    handleAccountCreated, 
    handleUpgradeCompleted, 
    closeModals,
    isOverLimit 
  } = useFreemiumSystem()

  // Differentiation handlers for inline menu
  const handleAddDifferentiation = useCallback((type: string, data: unknown) => {
    console.log(`🎯 Adding differentiation: ${type}`, data)
    
    // Add to applied differentiation state
    setAppliedDifferentiation(prev => ({
      ...prev,
      [type]: data
    }))
    
    // Regenerate lesson content with the new differentiation
    if (originalLessonContent) {
      const updatedContent = insertDifferentiationIntoContent(originalLessonContent, {
        ...appliedDifferentiation,
        [type]: data
      })
      dispatch({ type: 'SET_GENERATED_ACTIVITY', payload: updatedContent })
      setParsedContent(parseActivityContent(
        updatedContent,
        formState.isSubMode ? 'substitute' : 'teacher',
        formState.lessonTopic,
        formState.gradeLevel,
        formState.subject
      ))
    }
  }, [appliedDifferentiation, originalLessonContent, parseActivityContent, formState.isSubMode, formState.lessonTopic, formState.gradeLevel, formState.subject])

  const handleRemoveDifferentiation = useCallback((type: string) => {
    console.log(`🗑️ Removing differentiation: ${type}`)
    
    // Remove from applied differentiation state
    const newApplied = { ...appliedDifferentiation }
    delete newApplied[type]
    setAppliedDifferentiation(newApplied)
    
    // Regenerate lesson content without this differentiation
    if (originalLessonContent) {
      const updatedContent = insertDifferentiationIntoContent(originalLessonContent, newApplied)
      dispatch({ type: 'SET_GENERATED_ACTIVITY', payload: updatedContent })
      setParsedContent(parseActivityContent(
        updatedContent,
        formState.isSubMode ? 'substitute' : 'teacher',
        formState.lessonTopic,
        formState.gradeLevel,
        formState.subject
      ))
    }
  }, [appliedDifferentiation, originalLessonContent, parseActivityContent, formState.isSubMode, formState.lessonTopic, formState.gradeLevel, formState.subject])

  const insertDifferentiationIntoContent = (content: string, differentiations: Record<string, unknown>) => {
    let modifiedContent = content
    
    // Insert differentiation adaptations into the lesson content
    Object.entries(differentiations).forEach(([type, data]) => {
      const diffSection = formatDifferentiationForLesson(type, data)
      modifiedContent += `\n\n### ${data.title || type}\n${diffSection}`
    })
    
    return modifiedContent
  }

  const formatDifferentiationForLesson = (type: string, data: unknown) => {
    let content = ''
    
    if (type === 'esl_adaptations') {
      if (data.vocabulary_support?.length) {
        content += '**📖 Vocabulary Support:**\n'
        content += data.vocabulary_support.map((item: string) => `• ${item}`).join('\n') + '\n\n'
      }
      if (data.visual_aids?.length) {
        content += '**🖼️ Visual Aids:**\n'
        content += data.visual_aids.map((item: string) => `• ${item}`).join('\n') + '\n\n'
      }
      if (data.language_scaffolds?.length) {
        content += '**🏗️ Language Scaffolds:**\n'
        content += data.language_scaffolds.map((item: string) => `• ${item}`).join('\n')
      }
    } else if (type === 'iep_adaptations') {
      if (data.behavioral_supports?.length) {
        content += '**🎭 Behavioral Supports:**\n'
        content += data.behavioral_supports.map((item: string) => `• ${item}`).join('\n') + '\n\n'
      }
      if (data.sensory_accommodations?.length) {
        content += '**👂 Sensory Accommodations:**\n'
        content += data.sensory_accommodations.map((item: string) => `• ${item}`).join('\n') + '\n\n'
      }
      if (data.cognitive_modifications?.length) {
        content += '**🧠 Cognitive Modifications:**\n'
        content += data.cognitive_modifications.map((item: string) => `• ${item}`).join('\n')
      }
    } else {
      // Grade level adaptations
      if (data.talk_track?.length) {
        content += '**💬 Teacher Talk Track:**\n'
        content += data.talk_track.map((item: string) => `• "${item}"`).join('\n') + '\n\n'
      }
      if (data.instructions?.length) {
        content += '**📋 Modified Instructions:**\n'
        content += data.instructions.map((item: string) => `• ${item}`).join('\n') + '\n\n'
      }
      if (data.modifications?.length) {
        content += '**🔧 Key Modifications:**\n'
        content += data.modifications.map((item: string) => `• ${item}`).join('\n') + '\n\n'
      }
      if (data.materials_changes?.length) {
        content += '**📦 Materials Changes:**\n'
        content += data.materials_changes.map((item: string) => `• ${item}`).join('\n')
      }
    }
    
    return content
  }

  // Helper function to get differentiation type icon
  const getDifferentiationIcon = useCallback((strategyKey: string) => {
    switch (strategyKey) {
      case 'below_grade': return '📚'
      case 'at_grade': return '🎯'
      case 'above_grade': return '🚀'
      case 'esl_adaptations': return '🌍'
      case 'iep_adaptations': return '🤝'
      default: return '📝'
    }
  }, [])


  // Generate fallback differentiation strategies when intelligence fails
  const generateFallbackDifferentiation = useCallback((formState: Record<string, unknown>) => {
    const subject = formState.subject.toLowerCase()
    const topic = formState.lessonTopic
    const grade = formState.gradeLevel.toLowerCase()
    
    return {
      below_grade: {
        title: `Simplified ${topic} Support`,
        talk_track: [
          `"Let's break ${topic} into smaller, manageable steps"`,
          `"Take your time - we'll work through this together"`,
          `"Use the visual aids to help you understand ${topic}"`
        ],
        instructions: [
          `Provide visual aids and manipulatives for ${topic}`,
          `Break content into 2-3 smaller chunks`,
          `Use peer partnerships for support`,
          `Offer multiple practice opportunities`
        ],
        modifications: [
          `Reduce complexity while maintaining core concepts`,
          `Allow extended time for completion`,
          `Provide step-by-step guides`
        ]
      },
      above_grade: {
        title: `Advanced ${topic} Challenge`,
        talk_track: [
          `"Ready for an extra challenge with ${topic}?"`,
          `"Can you find connections to other concepts?"`,
          `"How might this apply to real-world situations?"`
        ],
        instructions: [
          `Extend ${topic} concepts to real-world applications`,
          `Add analytical or creative components`,
          `Encourage independent research`,
          `Create presentations or teach others`
        ],
        modifications: [
          `Add higher-order thinking questions`,
          `Include cross-curricular connections`,
          `Offer leadership opportunities`
        ]
      },
      esl_adaptations: {
        title: `${topic} Language Support`,
        vocabulary_support: [
          `Pre-teach key ${topic} vocabulary with visual cards`,
          `Provide bilingual glossary when possible`,
          `Use cognates to connect to native language`
        ],
        visual_aids: [
          `Graphic organizers for ${topic} concepts`,
          `Picture cards and diagrams`,
          `Interactive visual displays`
        ],
        language_scaffolds: [
          `Sentence frames for discussing ${topic}`,
          `Think-pair-share in native language first`,
          `Encourage use of gesture and drawing`
        ]
      }
    }
  }, [])

  // Load differentiation data
  // Apply differentiation strategy to lesson content
  const applyDifferentiation = useCallback((strategy: Record<string, unknown>, mode: 'replace' | 'include', strategyKey: string) => {
    if (!formState.generatedActivity || !strategy) return

    console.log(`🎯 Applying ${mode} differentiation:`, strategyKey)
    
    // Show instant feedback
    const modeText = mode === 'include' ? 'added to' : 'replaced in'
    setDifferentiationMessage(`✅ ${strategy.title || 'Strategy'} ${modeText} lesson plan!`)
    setTimeout(() => setDifferentiationMessage(''), 3000)
    
    let modifiedContent = formState.generatedActivity
    const icon = getDifferentiationIcon(strategyKey)
    
    if (mode === 'replace') {
      // Replace sections with differentiated versions
      if (strategy.instructions && strategy.instructions.length > 0) {
        const instructionsSection = strategy.instructions.join('\n- ')
        modifiedContent = modifiedContent.replace(
          /(\*\*Main Activity\*\*[\s\S]*?)(\*\*Phase \d+[\s\S]*?)(\*\*Wrap-Up)/,
          `$1**${icon} ${strategy.title || 'Differentiated Version'}** *(Applied)*\n- ${instructionsSection}\n\n$3`
        )
      }
    } else {
      // Include mode - add differentiation as additional section with ALL available content
      let differentiationSection = `\n\n**${icon} ${strategy.title || 'Differentiation Strategy'}** *(Applied)*\n\n`
      
      // Add all available sections from the strategy
      if (strategy.talk_track && strategy.talk_track.length > 0) {
        differentiationSection += `**Teacher Talk Track:**\n${strategy.talk_track.map((t: string) => `- "${t}"`).join('\n')}\n\n`
      }
      
      if (strategy.instructions && strategy.instructions.length > 0) {
        differentiationSection += `**Instructions:**\n${strategy.instructions.map((i: string) => `- ${i}`).join('\n')}\n\n`
      }
      
      if (strategy.modifications && strategy.modifications.length > 0) {
        differentiationSection += `**Key Modifications:**\n${strategy.modifications.map((m: string) => `- ${m}`).join('\n')}\n\n`
      }
      
      if (strategy.materials_changes && strategy.materials_changes.length > 0) {
        differentiationSection += `**Materials Changes:**\n${strategy.materials_changes.map((m: string) => `- ${m}`).join('\n')}\n\n`
      }
      
      if (strategy.vocabulary_support && strategy.vocabulary_support.length > 0) {
        differentiationSection += `**Vocabulary Support:**\n${strategy.vocabulary_support.map((v: string) => `- ${v}`).join('\n')}\n\n`
      }
      
      if (strategy.visual_aids && strategy.visual_aids.length > 0) {
        differentiationSection += `**Visual Aids:**\n${strategy.visual_aids.map((v: string) => `- ${v}`).join('\n')}\n\n`
      }
      
      if (strategy.language_scaffolds && strategy.language_scaffolds.length > 0) {
        differentiationSection += `**Language Scaffolds:**\n${strategy.language_scaffolds.map((l: string) => `- ${l}`).join('\n')}\n\n`
      }
      
      if (strategy.behavioral_supports && strategy.behavioral_supports.length > 0) {
        differentiationSection += `**Behavioral Supports:**\n${strategy.behavioral_supports.map((b: string) => `- ${b}`).join('\n')}\n\n`
      }
      
      if (strategy.sensory_accommodations && strategy.sensory_accommodations.length > 0) {
        differentiationSection += `**Sensory Accommodations:**\n${strategy.sensory_accommodations.map((s: string) => `- ${s}`).join('\n')}\n\n`
      }
      
      if (strategy.cognitive_modifications && strategy.cognitive_modifications.length > 0) {
        differentiationSection += `**Cognitive Modifications:**\n${strategy.cognitive_modifications.map((c: string) => `- ${c}`).join('\n')}\n\n`
      }
      
      // Remove trailing newlines
      differentiationSection = differentiationSection.trim()
      
      modifiedContent = modifiedContent + differentiationSection
    }

    // Update applied differentiation tracking
    setAppliedDifferentiation(prev => ({
      ...prev,
      [strategyKey]: { strategy, mode, applied: true }
    }))

    // Update the lesson content
    dispatch({ type: 'SET_GENERATED_ACTIVITY', payload: modifiedContent })
    setParsedContent(parseActivityContent(
      modifiedContent, 
      formState.isSubMode ? 'substitute' : 'teacher',
      formState.lessonTopic,
      formState.gradeLevel,
      formState.subject
    ))
    
    console.log('✅ Differentiation applied successfully')
  }, [formState.generatedActivity, formState.isSubMode, parseActivityContent])

  // Remove applied differentiation and restore original
  const removeDifferentiation = useCallback((strategyKey: string) => {
    console.log(`🔄 Removing differentiation:`, strategyKey)
    
    // Show instant feedback
    setDifferentiationMessage('✅ Strategy removed from lesson plan!')
    setTimeout(() => setDifferentiationMessage(''), 3000)
    
    // Remove from applied tracking
    setAppliedDifferentiation(prev => {
      const updated = { ...prev }
      delete updated[strategyKey]
      return updated
    })

    // Check if any differentiation is still applied
    const remainingDiff = Object.entries(appliedDifferentiation).filter(([key]) => key !== strategyKey)
    
    if (remainingDiff.length === 0) {
      // No differentiation left, restore original
      dispatch({ type: 'SET_GENERATED_ACTIVITY', payload: originalLessonContent })
      setParsedContent(parseActivityContent(
        originalLessonContent, 
        formState.isSubMode ? 'substitute' : 'teacher',
        formState.lessonTopic,
        formState.gradeLevel,
        formState.subject
      ))
    } else {
      // Reapply remaining differentiation strategies
      let content = originalLessonContent
      remainingDiff.forEach(([key, diff]: [string, Record<string, unknown>]) => {
        // Reapply each remaining differentiation
        // This is a simplified version - in production, you'd want more sophisticated merging
        const strategy = diff.strategy
        const mode = diff.mode
        
        if (mode === 'include') {
          const differentiationSection = `\n\n**🎯 ${strategy.title || 'Differentiation Strategy'}**\n\n` +
            `**Teacher Talk Track:**\n${strategy.talk_track ? strategy.talk_track.map((t: string) => `- "${t}"`).join('\n') : '- Use encouraging, supportive language'}\n\n` +
            `**Additional Strategies:**\n${strategy.instructions ? strategy.instructions.map((i: string) => `- ${i}`).join('\n') : '- No specific instructions provided'}`
          content = content + differentiationSection
        }
      })
      
      dispatch({ type: 'SET_GENERATED_ACTIVITY', payload: content })
      setParsedContent(parseActivityContent(
        content, 
        formState.isSubMode ? 'substitute' : 'teacher',
        formState.lessonTopic,
        formState.gradeLevel,
        formState.subject
      ))
    }
    
    console.log('✅ Differentiation removed successfully')
  }, [appliedDifferentiation, originalLessonContent, formState.isSubMode, parseActivityContent])

  const loadInlineDifferentiation = useCallback(async () => {
    if (!formState.generatedActivity || isLoadingDifferentiation) return

    setIsLoadingDifferentiation(true)
    // Show animated loading screen for differentiation
    showLoading('differentiating')
    
    try {
      console.log('🎯 Loading inline differentiation...')
      
      const response = await fetch('/api/premium/differentiation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityContent: formState.generatedActivity,
          gradeLevel: formState.gradeLevel,
          subject: formState.subject,
          topic: formState.lessonTopic,
          activityType: formState.activityType === 'other' ? formState.customActivityType : formState.activityType,
          duration: formState.duration
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Inline differentiation loaded successfully')
        setDifferentiationData({
          data: result.differentiationData,
          requestedTypes: result.requestedTypes || [],
          gradeContext: result.gradeContext || {}
        })
        setShowInlineDifferentiation(true)
      } else {
        throw new Error(result.error || 'Failed to load differentiation data')
      }
    } catch (error) {
      console.error('❌ Failed to load inline differentiation:', error)
      // Show error message instead of fallback workspace
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load differentiation options. Please try again.' })
    } finally {
      setIsLoadingDifferentiation(false)
      // Hide animated loading screen
      hideLoading()
    }
  }, [formState.generatedActivity, formState.gradeLevel, formState.subject, formState.lessonTopic, formState.activityType, formState.customActivityType, formState.duration, isLoadingDifferentiation, showLoading, hideLoading])
  
  // YouTube Video Integration Handlers - Phase 1
  const handleVideosSelected = useCallback((videos: YouTubeVideo[]) => {
    setSelectedVideos(videos)
    const videoIds = new Set(videos.map(v => v.id))
    setSelectedVideoIds(videoIds)
    console.log('🎬 Selected videos:', videos.length)
    // Debug duration data
    videos.forEach(video => {
      console.log(`📹 Video: ${video.title}`)
      console.log(`⏱️ Duration: "${video.duration}" | Seconds: ${video.durationSeconds}`)
    })
  }, [])

  const toggleYouTubeVideos = useCallback(() => {
    if (showYouTubeVideos) {
      setShowYouTubeVideos(false)
      setIsYouTubePanelCollapsed(false)
    } else {
      setShowYouTubeVideos(true)
      setIsYouTubePanelCollapsed(false)
    }
  }, [showYouTubeVideos])
  


  // Initialize date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    dispatch({ type: 'SET_SELECTED_DATE', payload: today })
  }, [])

  // Activity options enhanced - now reactive to sub mode
  const activityOptions = useMemo(() => {
    if (formState.isSubMode) {
      // Simple, substitute-friendly activities - meaningful but achievable
      return [
        { value: 'guided_discussion', label: 'Guided Discussion', icon: '💬', emoji: '💬', description: 'Discussion with clear talking points and questions', complexityLevel: 'basic' },
        { value: 'reading_response', label: 'Reading & Response', icon: '📖', emoji: '📖', description: 'Read provided text and respond to questions', complexityLevel: 'basic' },
        { value: 'compare_contrast', label: 'Compare & Contrast', icon: '⚖️', emoji: '⚖️', description: 'Simple comparison activities with clear structure', complexityLevel: 'basic' },
        { value: 'guided_practice', label: 'Guided Practice', icon: '📝', emoji: '📝', description: 'Step-by-step practice with answer key provided', complexityLevel: 'basic' },
        { value: 'creative_expression', label: 'Creative Expression', icon: '🎨', emoji: '🎨', description: 'Drawing, writing, or creating with clear templates', complexityLevel: 'basic' },
        { value: 'video_discussion', label: 'Video & Discussion', icon: '📺', emoji: '📺', description: 'Watch educational video and discuss with prompts', complexityLevel: 'basic' },
        { value: 'reflection_writing', label: 'Reflection Writing', icon: '✍️', emoji: '✍️', description: 'Thoughtful writing with guided prompts', complexityLevel: 'basic' }
      ]
    }

    // Full teacher mode options - Danielson Framework-aligned
    return [
      // Analysis & Reasoning (Domain 3b - Using Questioning and Discussion Techniques)
      { value: 'investigate_analyze', label: 'Investigate & Analyze', icon: '🔍', emoji: '🔍', description: 'Student-driven analysis and inquiry', complexityLevel: 'intermediate' },
      { value: 'compare_contrast', label: 'Compare & Contrast', icon: '⚖️', emoji: '⚖️', description: 'Deep analytical comparison tasks', complexityLevel: 'basic' },
      { value: 'evidence_discussion', label: 'Evidence-Based Discussion', icon: '💭', emoji: '💭', description: 'Student-led evidence analysis and debate', complexityLevel: 'intermediate' },
      
      // Collaboration & Communication (Domain 3c - Engaging Students in Learning)
      { value: 'collaborative_solving', label: 'Collaborative Problem Solving', icon: '🤝', emoji: '🤝', description: 'Complex group problem solving', complexityLevel: 'advanced' },
      { value: 'peer_teaching', label: 'Peer Teaching', icon: '👥', emoji: '👥', description: 'Student-led instruction and mentoring', complexityLevel: 'intermediate' },
      { value: 'group_investigation', label: 'Group Investigation', icon: '🔬', emoji: '🔬', description: 'Collaborative research and discovery', complexityLevel: 'advanced' },
      
      // Application & Practice (Domain 3c - Engaging Students in Learning)
      { value: 'guided_practice', label: 'Guided Practice', icon: '📝', emoji: '📝', description: 'Scaffolded skill development', complexityLevel: 'basic' },
      { value: 'real_world_application', label: 'Real-World Application', icon: '🌍', emoji: '🌍', description: 'Authentic application of learning', complexityLevel: 'intermediate' },
      { value: 'hands_on_exploration', label: 'Hands-On Exploration', icon: '🧪', emoji: '🧪', description: 'Inquiry-based exploration and discovery', complexityLevel: 'intermediate' },
      
      // Creative & Synthesis (Domain 3c - Engaging Students in Learning)
      { value: 'creative_expression', label: 'Creative Expression', icon: '🎨', emoji: '🎨', description: 'Open-ended creative projects', complexityLevel: 'basic' },
      { value: 'design_build', label: 'Design & Build', icon: '🔨', emoji: '🔨', description: 'Engineering design process projects', complexityLevel: 'advanced' },
      { value: 'student_led_discovery', label: 'Student-Led Discovery', icon: '💡', emoji: '💡', description: 'Independent student inquiry and exploration', complexityLevel: 'advanced' },
      
      // Assessment & Reflection (Domain 3d - Using Assessment in Instruction)
      { value: 'self_assessment', label: 'Self-Assessment', icon: '✅', emoji: '✅', description: 'Metacognitive reflection and goal setting', complexityLevel: 'basic' },
      { value: 'reflection_goals', label: 'Reflection & Goal Setting', icon: '🎯', emoji: '🎯', description: 'Student-driven learning goal development', complexityLevel: 'intermediate' },
      { value: 'demonstration_learning', label: 'Demonstration of Learning', icon: '📢', emoji: '📢', description: 'Student presentations and performance tasks', complexityLevel: 'intermediate' }
    ]
  }, [formState.isSubMode])

  const subjectSpecificActivities = useMemo(() => {
    if (!formState.subject) return []
    
    if (formState.isSubMode) {
      // Very simple subject-specific activities for subs
      const subjectMap: Record<string, ActivityOption[]> = {
        'Math': [
          { value: 'math_practice', label: 'Math Practice', icon: '🧮', emoji: '🧮', description: 'Practice problems with step-by-step solutions', complexityLevel: 'basic' }
        ],
        'Science': [
          { value: 'science_reading', label: 'Science Reading', icon: '📖', emoji: '📖', description: 'Read about science concepts and answer questions', complexityLevel: 'basic' }
        ],
        'English Language Arts': [
          { value: 'reading_comprehension', label: 'Reading Comprehension', icon: '📚', emoji: '📚', description: 'Read passages and answer comprehension questions', complexityLevel: 'basic' }
        ],
        'Social Studies': [
          { value: 'history_reading', label: 'History Reading', icon: '📜', emoji: '📜', description: 'Read historical texts and discuss key points', complexityLevel: 'basic' }
        ],
        'Advisory/SEL': [
          { value: 'simple_check_in', label: 'Simple Check-in Circle', icon: '🧘', emoji: '🧘', description: 'Easy conversation starters for connecting and sharing', complexityLevel: 'basic' },
          { value: 'gratitude_sharing', label: 'Gratitude & Good Things', icon: '🙏', emoji: '🙏', description: 'Natural sharing about positive moments and appreciation', complexityLevel: 'basic' },
          { value: 'question_of_day', label: 'Question of the Day', icon: '💭', emoji: '💭', description: 'Thought-provoking questions that spark easy discussion', complexityLevel: 'basic' }
        ]
      }
      return subjectMap[formState.subject] || []
    }

    // Full teacher mode subject-specific activities
    const subjectMap: Record<string, ActivityOption[]> = {
      'Math': [
        { value: 'mathematical_modeling', label: 'Mathematical Modeling', icon: '📐', emoji: '📐', description: 'Complex real-world mathematical modeling', complexityLevel: 'advanced' },
        { value: 'problem_solving_strategies', label: 'Problem Solving Strategies', icon: '🧩', emoji: '🧩', description: 'Multi-strategy mathematical problem solving', complexityLevel: 'intermediate' }
      ],
      'Science': [
        { value: 'scientific_inquiry', label: 'Scientific Inquiry', icon: '🔬', emoji: '🔬', description: 'Full inquiry cycle and investigation', complexityLevel: 'advanced' },
        { value: 'hypothesis_testing', label: 'Hypothesis Testing', icon: '🧠', emoji: '🧠', description: 'Scientific method and hypothesis validation', complexityLevel: 'intermediate' }
      ],
      'English Language Arts': [
        { value: 'literary_analysis', label: 'Literary Analysis', icon: '📚', emoji: '📚', description: 'Deep literary criticism and interpretation', complexityLevel: 'intermediate' },
        { value: 'creative_writing', label: 'Creative Writing Workshop', icon: '✍️', emoji: '✍️', description: 'Writer\'s workshop and peer review', complexityLevel: 'basic' }
      ],
      'Social Studies': [
        { value: 'historical_thinking', label: 'Historical Thinking', icon: '🏛️', emoji: '🏛️', description: 'Complex historical analysis and causation', complexityLevel: 'intermediate' },
        { value: 'civic_engagement', label: 'Civic Engagement', icon: '🗳️', emoji: '🗳️', description: 'Active citizenship and community involvement', complexityLevel: 'advanced' }
      ],
      'Advisory/SEL': [
        { value: 'goals_and_dreams', label: 'Goals, Dreams & Self-Discovery', icon: '🎯', emoji: '🎯', description: 'Conversations about personal aspirations and self-understanding', complexityLevel: 'basic' },
        { value: 'friendship_relationships', label: 'Friendship & Relationships', icon: '🤝', emoji: '🤝', description: 'Talking through social connections and communication', complexityLevel: 'basic' },
        { value: 'digital_life_balance', label: 'Digital Life & Real Life', icon: '💻', emoji: '💻', description: 'Exploring healthy relationships with technology and social media', complexityLevel: 'intermediate' },
        { value: 'stress_overwhelm', label: 'Stress, Overwhelm & Coping', icon: '🧘', emoji: '🧘', description: 'Discussing stress and sharing strategies for managing life challenges', complexityLevel: 'basic' },
        { value: 'identity_belonging', label: 'Identity, Culture & Belonging', icon: '🌍', emoji: '🌍', description: 'Conversations about who we are and where we fit in', complexityLevel: 'intermediate' },
        { value: 'communication_conflict', label: 'Communication & Working Through Conflict', icon: '💬', emoji: '💬', description: 'Talking about how we connect and handle disagreements', complexityLevel: 'basic' },
        { value: 'future_anxiety', label: 'Future Planning & Anxiety', icon: '🔮', emoji: '🔮', description: 'Conversations about the future and managing uncertainty', complexityLevel: 'intermediate' },
        { value: 'authenticity_pressure', label: 'Being Yourself vs. Fitting In', icon: '🎭', emoji: '🎭', description: 'Discussing authenticity and social pressures', complexityLevel: 'intermediate' }
      ]
    }
    
    return subjectMap[formState.subject] || []
  }, [formState.subject, formState.isSubMode])

  // Check if form is valid - MEMOIZED
  const isFormValid = useMemo(() => {
    const hasActivityType = !!formState.activityType && (formState.activityType !== 'other' || !!formState.customActivityType?.trim())
    const hasBasicInfo = !!formState.gradeLevel && !!formState.subject && !!formState.lessonTopic.trim()
    
    // For both modes, only require basic info and activity type
    return hasBasicInfo && hasActivityType
  }, [formState.activityType, formState.customActivityType, formState.gradeLevel, formState.subject, formState.lessonTopic])


  // Event handlers for preview modal - MEMOIZED
  const toggleSection = useCallback((section: string) => {
    // Implementation for toggling sections in preview modal
  }, [])

  const togglePhase = useCallback((index: number) => {
    // Implementation for toggling instruction phases
  }, [])

  const copyActivityText = useCallback(() => {
    if (formState.generatedActivity) {
      navigator.clipboard.writeText(formState.generatedActivity)
    }
  }, [formState.generatedActivity])

  const printActivity = useCallback(() => {
    window.print()
  }, [])

  const submitFeedback = useCallback((feedback: string) => {
    console.log('📝 Feedback submitted:', feedback)
  }, [])

  // Google Docs Export Handler
  const handleGoogleDocsExport = useCallback(async () => {
    setIsExportingToGoogle(true)
    setShowShareDropdown(false)
    
    try {
      // Check if user has Google access token
      const accessToken = localStorage.getItem('google_access_token')
      
      if (!accessToken) {
        // Redirect to Google OAuth
        const response = await fetch('/api/auth/google')
        const authData = await response.json()
        
        if (authData.success) {
          window.location.href = authData.url
          return
        } else {
          throw new Error('Failed to get Google authorization URL')
        }
      }
      
      // Get lesson content from the same source as PDF
      const printContent = document.getElementById('lesson-content')?.innerText || ''
      const docTitle = `${formState.subject} - ${formState.lessonTopic} - ${new Date().toLocaleDateString()}`
      
      // Send to Google Docs API
      const response = await fetch('/api/export/google-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonContent: printContent,
          accessToken: accessToken,
          title: docTitle
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Open the new Google Doc
        window.open(result.documentUrl, '_blank')
        alert('✅ Lesson plan exported to Google Docs!')
      } else {
        // Handle specific error cases
        let errorMessage = result.error || 'Export failed'
        if (result.action) {
          errorMessage += `\n\n${result.action}`
        }
        throw new Error(errorMessage)
      }
      
    } catch (error) {
      console.error('Google Docs export failed:', error)
      
      // Provide specific error messages based on the error type
      let userMessage = '❌ Failed to export to Google Docs.'
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        
        if (errorMsg.includes('google docs api not enabled')) {
          userMessage = '❌ Google Docs API is not enabled. Please enable it in your Google Cloud Console.'
        } else if (errorMsg.includes('google drive api not enabled')) {
          userMessage = '❌ Google Drive API is not enabled. Please enable it in your Google Cloud Console.'
        } else if (errorMsg.includes('authentication expired')) {
          userMessage = '❌ Google authentication expired. Please try again to re-authorize.'
        } else if (errorMsg.includes('insufficient permission') || errorMsg.includes('caller does not have permission')) {
          userMessage = '❌ Permission denied. This might be due to:\n• Google Drive storage full\n• APIs not enabled\n• Insufficient permissions\n\nPlease check your Google Drive storage and API settings.'
        } else if (errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
          userMessage = '❌ Google API quota exceeded. Please try again later.'
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          userMessage = '❌ Network error. Please check your connection and try again.'
        } else {
          userMessage = `❌ Export failed: ${error.message.substring(0, 100)}...`
        }
      }
      
      alert(userMessage)
    } finally {
      setIsExportingToGoogle(false)
    }
  }, [formState.subject, formState.lessonTopic])

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const googleAuth = urlParams.get('google_auth')
    const accessToken = urlParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token')

    if (googleAuth === 'success' && accessToken) {
      // Store tokens in localStorage
      localStorage.setItem('google_access_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('google_refresh_token', refreshToken)
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Show success message
      alert('✅ Google account connected! You can now export to Google Docs.')
    } else if (googleAuth === 'denied') {
      alert('❌ Google authorization was denied. You can try again anytime.')
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (googleAuth && googleAuth !== 'success') {
      alert('❌ There was an issue connecting to Google. Please try again.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // Handle clicking outside share dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showShareDropdown && !target.closest('.share-dropdown-container')) {
        setShowShareDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showShareDropdown])

  // Helper function to get activity type icon and label
  const getActivityTypeDisplay = useCallback((activityType: string, customActivityType?: string) => {
    if (activityType === 'other' && customActivityType) {
      return { icon: '📝', label: customActivityType }
    }

    // Get all activity options from current state
    const allOptions = [...activityOptions, ...subjectSpecificActivities]
    const option = allOptions.find(opt => opt.value === activityType)
    
    if (option) {
      return { icon: option.icon, label: option.label }
    }

    // Fallback for unknown activity types
    return { icon: '📝', label: activityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }
  }, [activityOptions, subjectSpecificActivities])

  // Main generate activity handler - ENHANCED
  const generateActivity = useCallback(async () => {
    console.log('🚀 Starting activity generation with enhanced features...')
    
    try {
      // Check usage limits before generating (but don't block on failure)
      let shouldContinue = true
      try {
        const usageCheck = await trackLessonGeneration({
          topic: formState.topic,
          subject: formState.subject,
          gradeLevel: formState.gradeLevel
        })
        
        // If usage check shows we can't generate, stop here
        if (!usageCheck.canGenerate) {
          console.log('❌ Generation blocked due to usage limits')
          // Show upgrade modal when user hits usage limits
          setShowUpgradeModal(true)
          return
        }
        
        // If modal is shown but generation is allowed, continue with generation
        shouldContinue = true
      } catch (trackingError) {
        console.warn('Usage tracking failed, continuing with generation:', trackingError)
        // Continue with generation even if tracking fails
        shouldContinue = true
      }
      
      if (!shouldContinue) return
      
      dispatch({ type: 'SET_PROCESSING', payload: true })
      dispatch({ type: 'SET_SHOW_ACTIVITY_CREATION', payload: false })
      
      // Show animated loading screen
      showLoading(formState.showPreview ? 'regenerating' : 'generating')
      
      const result = await generateActivityAPI(formState)
      
      dispatch({ type: 'SET_GENERATED_ACTIVITY', payload: result.activityData })
      dispatch({ type: 'SET_PROCESSING', payload: false })
      dispatch({ type: 'SET_SHOW_PREVIEW', payload: true })
      
      // Hide animated loading screen
      hideLoading()
      
      // Show fallback notice if applicable
      if (result.fromFallback) {
        const notice = 'Successfully generated using our backup system to ensure high quality during peak times'
        // Show a temporary success message about fallback
        setTimeout(() => {
          // Use a success-style notification instead of error style
          dispatch({ type: 'SET_ERROR', payload: `✅ ${notice}` })
          // Clear the success message after 8 seconds
          setTimeout(() => {
            dispatch({ type: 'SET_ERROR', payload: null })
          }, 8000)
        }, 1000)
      }
      
      // Set parsed content for enhanced preview
      setParsedContent(result.parsedContent)
      
      // Store original content
      setOriginalLessonContent(result.activityData)
      
      // 🎯 AUTO-SAVE TO MEMORY BANK (Database)
      try {
        console.log('💾 Starting lesson save process...')
        
        // Get user context from auth
        const authResponse = await fetch('/api/auth/user', { method: 'GET' })
        let userId = null
        let userEmail = null
        
        console.log('Auth response status:', authResponse.status)
        
        if (authResponse.ok) {
          const authData = await authResponse.json()
          console.log('Auth data received:', { hasUser: !!authData.user, email: authData.user?.email })
          userId = authData.user?.id
          userEmail = authData.user?.email
        }
        
        // For anonymous users, provide a default context
        if (!userId && !userEmail) {
          console.log('🔄 No user context found, using anonymous mode')
          userEmail = 'anonymous@lesson-builder.com'
        }
        
        const lessonData = {
          title: `${formState.subject} - ${formState.lessonTopic}`,
          subject: formState.subject,
          gradeLevel: formState.gradeLevel,
          topic: formState.lessonTopic,
          activityType: formState.activityType === 'other' ? formState.customActivityType : formState.activityType,
          duration: formState.duration,
          content: result.activityData,
          selectedVideos: selectedVideos,
          userId: userId,
          userEmail: userEmail
        }
        
        console.log('📝 Attempting to save lesson:', lessonData.title)
        
        // Save lesson to database with proper user association
        const savedLessonId = await saveLesson(lessonData)
        console.log('✅ Lesson automatically saved to database Memory Bank! ID:', savedLessonId)
        
      } catch (error) {
        console.error('❌ Failed to auto-save lesson to database:', error)
        console.error('Error details:', error)
        // Don't block the UI if auto-save fails
      }
      
      // Generate differentiation suggestions separately for teacher mode with retry logic
      if (!formState.isSubMode) {
        let diffSuggestions = null
        const maxRetries = 3
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`🎯 Generating differentiation suggestions (attempt ${attempt}/${maxRetries})...`)
            
            const diffResponse = await fetch('/api/premium/differentiation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                activityContent: result.activityData,
                gradeLevel: formState.gradeLevel,
                subject: formState.subject,
                topic: formState.lessonTopic,
                activityType: formState.activityType === 'other' ? formState.customActivityType : formState.activityType,
                duration: formState.duration,
                retryAttempt: attempt
              })
            })

            if (diffResponse.ok) {
              const diffResult = await diffResponse.json()
              if (diffResult.success && diffResult.differentiationData) {
                console.log('✅ Differentiation suggestions generated successfully on attempt', attempt)
                diffSuggestions = diffResult.differentiationData
                break
              } else {
                console.warn(`⚠️ Differentiation API returned empty/error on attempt ${attempt}:`, diffResult.error)
              }
            } else {
              console.warn(`⚠️ Differentiation API call failed on attempt ${attempt}:`, diffResponse.status)
            }
          } catch (error) {
            console.warn(`⚠️ Differentiation attempt ${attempt} failed:`, error)
          }
          
          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000))
          }
        }
        
        // Set suggestions or fallback
        if (diffSuggestions) {
          setDifferentiationSuggestions(diffSuggestions)
        } else {
          console.log('🔄 Using fallback differentiation strategies')
          setDifferentiationSuggestions(generateFallbackDifferentiation(formState))
        }
      }
      
      console.log('✅ Activity generation completed successfully')
      
    } catch (error) {
      console.error('❌ Activity generation failed:', error)
      
      // Enhanced error handling with user-friendly messages
      let userMessage = 'Activity generation failed'
      let shouldShowRetryOption = false
      
      if (error && typeof error === 'object') {
        const enhancedError = error as any
        
        if (enhancedError.userFriendly) {
          userMessage = enhancedError.message
        } else if (error instanceof Error) {
          userMessage = error.message
        }
        
        // Check if this is a retryable error
        if (enhancedError.retryable || enhancedError.type === 'service_overloaded' || 
            enhancedError.type === 'rate_limited' || enhancedError.type === 'service_unavailable') {
          shouldShowRetryOption = true
        }
        
        // Special handling for 529 errors - they should be less scary
        if (enhancedError.status === 529 || enhancedError.type === 'service_overloaded') {
          userMessage = 'The intelligent service is experiencing high demand. We\'re working on generating your lesson plan with our backup system. Please wait a moment...'
          shouldShowRetryOption = false // Don't show retry for 529 as backend handles it
        }
      } else if (error instanceof Error) {
        userMessage = error.message
      }
      
      dispatch({ type: 'SET_ERROR', payload: userMessage })
      dispatch({ type: 'SET_PROCESSING', payload: false })
      
      // Hide animated loading screen on error
      hideLoading()
      
      // Auto-retry for certain error types after a delay
      if (shouldShowRetryOption && error && typeof error === 'object') {
        const enhancedError = error as any
        if (enhancedError.type === 'service_overloaded' || enhancedError.status === 529) {
          setTimeout(() => {
            console.log('🔄 Auto-retrying after service overload...')
            // Clear error and retry
            dispatch({ type: 'SET_ERROR', payload: null })
            handleSubmit(event) // Retry the submission
          }, 3000) // Wait 3 seconds before retry
        }
      }
    }
  }, [formState, generateActivityAPI, showLoading, hideLoading, trackLessonGeneration])

  return (
    <>
      {/* Global Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide navigation and all UI controls */
          nav, .navigation, .workspace-header, .differentiation-menu { display: none !important; }
          
          /* Hide all buttons, forms, and interactive elements */
          button, input, select, textarea, form { display: none !important; }
          
          /* Hide mode toggles, alerts, and notifications */
          .fixed { display: none !important; }
          .sticky { position: static !important; }
          
          /* Hide background decorations */
          .absolute, .bg-gradient-to-br, .bg-gradient-to-r, .backdrop-blur-sm { display: none !important; }
          
          /* Ensure only lesson content is visible */
          body { 
            background: white !important; 
            color: black !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
          }
          
          /* Show only the main lesson content */
          #lesson-content { 
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
          }
          
          /* Optimize text for print */
          .text-white, .text-blue-600, .text-purple-600, .text-indigo-600 { 
            color: #000 !important; 
          }
          
          /* Remove shadows and effects */
          .shadow-lg, .shadow-md, .shadow-sm { box-shadow: none !important; }
          .rounded-lg, .rounded-md { border-radius: 0 !important; }
          
          /* Page break handling */
          h1, h2, h3 { page-break-after: avoid !important; }
          .no-break { page-break-inside: avoid !important; }
          
          /* Clean borders */
          .border-purple-200, .border-blue-200, .border-indigo-200 { 
            border-color: #ccc !important; 
          }
        }
      `}</style>

      <Navigation 
        isSubMode={formState.isSubMode}
        onToggleMode={!formState.showPreview ? (isSubMode) => dispatch({ type: 'SET_SUB_MODE', payload: isSubMode }) : undefined}
      />
      
      {/* Enhanced Error/Status Notification */}
      {formState.error && (
        <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 border-b ${
          formState.error.startsWith('✅') 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {formState.error.startsWith('✅') ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className={`text-sm font-medium ${
                  formState.error.startsWith('✅') ? 'text-green-800' : 'text-red-800'
                }`}>
                  {formState.error.startsWith('✅') ? 'Success' : 'Generation Issue'}
                </h3>
                <p className={`text-sm ${
                  formState.error.startsWith('✅') ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formState.error.replace('✅ ', '')}
                </p>
              </div>
            </div>
            <button
              onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
              className={`flex-shrink-0 ml-4 hover:opacity-75 ${
                formState.error.startsWith('✅') ? 'text-green-400' : 'text-red-400'
              }`}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* API Status Indicator */}
      {formState.aiProcessing && !formState.error && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gray-50 border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-800">Generating Your Lesson Plan</h3>
              <p className="text-sm text-gray-700">Our intelligence is creating an intelligent lesson plan. This may take a moment during high-demand periods...</p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden relative" style={{ 
        paddingTop: formState.error || formState.aiProcessing ? '80px' : '0'
      }}>
      

      {/* Landing Page / Form Interface */}
      {!formState.aiProcessing && !formState.showPreview && (
        <div className="relative z-10" style={{
          backgroundImage: 'url(/classroom-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          backgroundRepeat: 'no-repeat'
        }}>
          {/* Subtle overlay for better text readability - behind content only */}
          <div className="absolute inset-0 bg-white/60 pointer-events-none -z-10"></div>

          {/* Dynamic Hero Section */}
          <div className="relative pt-24 sm:pt-28 px-4 py-8 sm:p-8 pb-24 sm:pb-28 z-10">
            <div className="w-full max-w-7xl mx-auto relative z-10">
              
              {/* Desktop Hero Layout - Left Text, Right CTA */}
              <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8 lg:h-[50vh] lg:items-center mb-8">
                {/* Left Column - Header, Subtext, and Value Props */}
                <div className="flex flex-col justify-center space-y-6 pl-8">
                  {/* Main Title - Left Half */}
                  <h1 className={`font-bebas text-left ${formState.isSubMode ? 'text-[75px] xl:text-[90px]' : 'text-[70px] xl:text-[85px]'} font-normal leading-[0.9] bg-gradient-to-r ${
                    formState.isSubMode 
                      ? 'from-green-600 to-emerald-600' 
                      : 'from-blue-600 to-indigo-600'
                  } bg-clip-text text-transparent text-render-optimized`}>
                    {formState.isSubMode ? 'Emergency Sub Plans That Actually Work' : 'Lesson Planning Doesn\'t Have to Feel Overwhelming'}
                  </h1>
                  
                  {/* Subtitle - Below headline in left half */}
                  <p className={`text-left ${formState.isSubMode ? 'text-[25px] xl:text-[38px]' : 'text-[23px] xl:text-[35px]'} text-gray-600 leading-[1.1] text-render-optimized font-normal`} style={{fontFamily: 'Arial Narrow, Arial, sans-serif'}}>
                    {formState.isSubMode 
                      ? 'Save your sanity with sub plans that work for any teacher, any grade, any subject.'
                      : 'Plan engaging lessons in minutes, and step into the classroom confident and prepared.'
                    }
                  </p>

                  {/* Value Propositions - List format with green checkmarks */}
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                    <div className="space-y-3">
                      {formState.isSubMode ? (
                        // Sub Mode Value Props
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-lg text-gray-700 font-medium">No prep required - just print and go</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-lg text-gray-700 font-medium">Step-by-step scripts any substitute can follow</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-lg text-gray-700 font-medium">Works for any subject, K-12, any time of year</span>
                          </div>
                        </>
                      ) : (
                        // Teacher Mode Value Props
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-lg text-gray-700 font-medium">Rich, engaging activities that excite students</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-lg text-gray-700 font-medium">Complete teaching support with tips and scripts</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-lg text-gray-700 font-medium">Standards-aligned curriculum requirements</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Video + CTA Button */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  {/* YouTube Video */}
                  <div className="relative max-w-lg w-full">
                    <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ paddingBottom: '54%' }}>
                      <iframe
                        src="https://www.youtube.com/embed/3cXjPsI4WZw?autoplay=1&loop=1&playlist=3cXjPsI4WZw&mute=1&controls=1&showinfo=0&rel=0&modestbranding=1&vq=hd720"
                        title="How It Works - Lesson Plan Builder Demo"
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ height: '110%', top: '-5%' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => dispatch({ type: 'SET_SHOW_ACTIVITY_CREATION', payload: true })}
                    data-testid="start-creating-desktop"
                    className={`${formState.isSubMode ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-500' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500'} text-white font-bold shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 transform active:scale-95 hover:scale-105 flex items-center justify-center touch-manipulation min-h-touch rounded-2xl text-2xl px-12 py-6`}
                  >
                    <span className="mr-3 text-3xl flex-shrink-0">{formState.isSubMode ? '🚀' : '⭐'}</span>
                    <span className="leading-tight">{formState.isSubMode ? 'Get Sub Plans Now' : 'Start Creating Now'}</span>
                  </button>
                </div>
              </div>
              
              {/* Mobile/Tablet Layout - Stacked */}
              <div className="lg:hidden">
                {/* Main Title - Mobile Optimized */}
                <h1 className={`font-bebas text-center sm:text-left ${formState.isSubMode ? 'text-4xl sm:text-8xl md:text-9xl' : 'text-4xl sm:text-8xl md:text-8xl'} font-normal mb-4 leading-tight bg-gradient-to-r ${
                  formState.isSubMode 
                    ? 'from-green-600 to-emerald-600' 
                    : 'from-blue-600 to-indigo-600'
                } bg-clip-text text-transparent px-4`} style={{ fontFamily: 'var(--font-bebas-neue), Bebas Neue, Arial Black, sans-serif' }}>
                  {formState.isSubMode ? 'Emergency Sub Plans That Actually Work' : 'Lesson Planning Doesn\'t Have to Feel Overwhelming'}
                </h1>
                
                {/* Subtitle - Mobile Optimized */}
                <p className={`text-center sm:text-left ${formState.isSubMode ? 'text-xl sm:text-3xl md:text-4xl' : 'text-lg sm:text-2xl md:text-3xl'} text-gray-600 leading-relaxed px-4 text-render-optimized font-normal mb-8`} style={{fontFamily: 'Arial Narrow, Arial, sans-serif'}}>
                  {formState.isSubMode 
                    ? 'Save your sanity with sub plans that work for any teacher, any grade, any subject.'
                    : 'Plan engaging lessons in minutes, and step into the classroom confident and prepared.'
                  }
                </p>

                {/* Value Propositions - Mobile/Tablet with green checkmarks */}
                <div className="px-4 mb-8">
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/20">
                    <div className="space-y-4">
                      {formState.isSubMode ? (
                        // Sub Mode Value Props - Mobile
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-base sm:text-lg text-gray-700 font-medium">No prep required - just print and go</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-base sm:text-lg text-gray-700 font-medium">Step-by-step scripts any substitute can follow</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-base sm:text-lg text-gray-700 font-medium">Works for any subject, K-12, any time of year</span>
                          </div>
                        </>
                      ) : (
                        // Teacher Mode Value Props - Mobile
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-base sm:text-lg text-gray-700 font-medium">Rich, engaging activities that excite students</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-base sm:text-lg text-gray-700 font-medium">Complete teaching support with tips and scripts</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-base sm:text-lg text-gray-700 font-medium">Standards-aligned curriculum requirements</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Video + CTA Button - Mobile Optimized */}
                <div className="px-4 mb-12">
                  {/* Video - Mobile */}
                  <div className="relative max-w-md mx-auto mb-4">
                    <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ paddingBottom: '54%' }}>
                      <iframe
                        src="https://www.youtube.com/embed/3cXjPsI4WZw?autoplay=1&loop=1&playlist=3cXjPsI4WZw&mute=1&controls=1&showinfo=0&rel=0&modestbranding=1&vq=hd720"
                        title="How It Works - Lesson Plan Builder Demo"
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ height: '110%', top: '-5%' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => dispatch({ type: 'SET_SHOW_ACTIVITY_CREATION', payload: true })}
                    data-testid="start-creating-mobile"
                    className={`w-full ${formState.isSubMode ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-500' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500'} text-white font-bold shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 transform active:scale-95 flex items-center justify-center touch-manipulation rounded-2xl text-lg sm:text-xl px-6 py-4 sm:py-5 min-h-[56px]`}
                  >
                    <span className="mr-3 text-2xl sm:text-3xl flex-shrink-0">{formState.isSubMode ? '🚀' : '⭐'}</span>
                    <span className="leading-tight">{formState.isSubMode ? 'Get Sub Plans Now' : 'Start Creating Now'}</span>
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}


      {/* Testimonials Section */}
      <div className="relative bg-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            What Teachers Are Saying
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 - Layla */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-100">
              <div className="text-4xl text-blue-500 mb-4">"</div>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                The Intelligent Sub Plans are a life saver! Full scripts and activities that keep the class in order and actually fun!
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  L
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">Layla</div>
                  <div className="text-gray-600 text-sm">2nd Grade Teacher Special Ed</div>
                  <div className="text-gray-600 text-xs">Flowery Branch, GA</div>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 - Cindy */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl shadow-lg border border-purple-100">
              <div className="text-4xl text-purple-500 mb-4">"</div>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                The fact that these are standards aligned is the cherry on top, no going back for me!
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  C
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">Cindy</div>
                  <div className="text-gray-600 text-sm">11th Grade Chemistry</div>
                  <div className="text-gray-600 text-xs">Valley Stream, NY</div>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3 - Danielle */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl shadow-lg border border-green-100">
              <div className="text-4xl text-green-500 mb-4">"</div>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                Removes the headaches of lesson planning, it even does the differentiation! So simple.
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  D
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">Danielle</div>
                  <div className="text-gray-600 text-sm">8th Grade Science</div>
                  <div className="text-gray-600 text-xs">Huntington, NY</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Teaching?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join top performing teachers who are saving time and creating better lessons with Peabody Pro.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Start Free (5 Lessons)
            </button>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="bg-orange-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-orange-600 transition-colors border-2 border-orange-400"
            >
              Go Pro Now - $7.99/mo
            </button>
          </div>
          
          <p className="text-sm opacity-75 mt-6">
            30-day money-back guarantee • Cancel anytime • No long-term commitment
          </p>
        </div>
      </section>

      {/* White Bottom Ribbon with Blue Gradient and Newsletter Form */}
      <div className="relative bg-white">
        {/* Blue Gradient at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-600 to-transparent opacity-20"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-12 md:py-16 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Stay Updated with Exciting Announcements!</h2>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">Be the first to know about new features, educational resources, and special offers.</p>
          
          <form 
            className="max-w-md mx-auto flex flex-col sm:flex-row gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const email = formData.get('email') as string;
              
              try {
                // Send email to jason@jmackcreative.com
                const response = await fetch('/api/newsletter-signup', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ email }),
                });
                
                if (response.ok) {
                  alert('Thank you for subscribing! You\'ll be the first to know about exciting updates.');
                  (e.target as HTMLFormElement).reset();
                } else {
                  alert('There was an error subscribing. Please try again.');
                }
              } catch (error) {
                console.error('Newsletter signup error:', error);
                alert('There was an error subscribing. Please try again.');
              }
            }}
          >
            <input
              type="email"
              name="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[48px]"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[48px] touch-manipulation"
            >
              Subscribe
            </button>
          </form>
          
          <p className="text-xs text-gray-500 mt-4">We respect your privacy. Unsubscribe at any time.</p>
        </div>
      </div>

      {/* Activity Creation Modal */}
      {formState.showActivityCreation && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div></div>}>
          <ActivityCreationModal
          isSubMode={formState.isSubMode}
          onToggleMode={(isSubMode) => dispatch({ type: 'SET_SUB_MODE', payload: isSubMode })}
          selectedDate={formState.selectedDate}
          setSelectedDate={(date) => dispatch({ type: 'SET_SELECTED_DATE', payload: date })}
          gradeLevel={formState.gradeLevel}
          setGradeLevel={(level) => dispatch({ type: 'SET_GRADE_LEVEL', payload: level })}
          subject={formState.subject}
          setSubject={(subject) => dispatch({ type: 'SET_SUBJECT', payload: subject })}
          lessonTopic={formState.lessonTopic}
          setLessonTopic={(topic) => dispatch({ type: 'SET_LESSON_TOPIC', payload: topic })}
          activityType={formState.activityType}
          handleActivityTypeChange={(type) => dispatch({ type: 'SET_ACTIVITY_TYPE', payload: type })}
          customActivityType={formState.customActivityType}
          setCustomActivityType={(type) => dispatch({ type: 'SET_CUSTOM_ACTIVITY_TYPE', payload: type })}
          showCustomInput={formState.activityType === 'other'}
          duration={formState.duration}
          setDuration={(duration) => dispatch({ type: 'SET_DURATION', payload: duration })}
          substituteName={formState.substituteName}
          setSubstituteName={(name) => dispatch({ type: 'SET_SUBSTITUTE_NAME', payload: name })}
          techPassword={formState.techPassword}
          setTechPassword={(password) => dispatch({ type: 'SET_TECH_PASSWORD', payload: password })}
          emergencyContacts={formState.emergencyContacts}
          setEmergencyContacts={(contacts) => dispatch({ type: 'SET_EMERGENCY_CONTACTS', payload: contacts })}
          classSize={formState.classSize}
          setClassSize={(size) => dispatch({ type: 'SET_CLASS_SIZE', payload: size })}
          specialNotes={formState.specialNotes}
          setSpecialNotes={(notes) => dispatch({ type: 'SET_SPECIAL_NOTES', payload: notes })}
          showAdvancedOptions={formState.showAdvancedOptions}
          setShowAdvancedOptions={(show) => dispatch({ type: 'SET_SHOW_ADVANCED_OPTIONS', payload: show })}
          isFormValid={isFormValid}
          activityOptions={activityOptions}
          subjectSpecificActivities={subjectSpecificActivities}
          onClose={() => dispatch({ type: 'SET_SHOW_ACTIVITY_CREATION', payload: false })}
          onGenerate={generateActivity}
        />
        </Suspense>
      )}


      {/* MOBILE-OPTIMIZED PREVIEW MODAL */}
      {formState.showPreview && parsedContent && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm z-50 touch-manipulation">
          <div className="h-full w-full bg-white flex flex-col overflow-hidden sm:h-auto sm:max-h-[95vh] sm:w-auto sm:max-w-7xl sm:mx-4 sm:my-6 sm:rounded-lg sm:shadow-2xl sm:relative sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2">
            
            
            {/* Mobile-Optimized Header */}
            <div className="bg-white border-b border-gray-200 print:hidden">
              
              {/* Mobile Header - Enhanced */}
              <div className="block sm:hidden sticky top-0 bg-white z-20 border-b border-gray-100">
                {/* Mobile Top Bar - Close and Title with Better Info */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 truncate">
                      {formState.isSubMode ? 'Substitute Plan' : 'Lesson Plan'}
                    </h2>
                    <p className="text-xs text-gray-600 truncate mt-0.5">
                      {formState.gradeLevel} • {formState.subject} • {formState.duration}min
                    </p>
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'SET_SHOW_PREVIEW', payload: false })}
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 transition-colors flex-shrink-0 touch-manipulation"
                    aria-label="Close preview"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Mobile Action Buttons - Horizontal Scroll with Touch-Friendly Design */}
                <div className="flex space-x-3 px-4 pb-3 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => {
                      if (!formState.generatedActivity) {
                        alert('Please generate an activity first before adding differentiation.')
                        return
                      }
                      if (canUseDifferentiation) {
                        if (showInlineDifferentiation) {
                          setShowInlineDifferentiation(false)
                          setDifferentiationData(null)
                        } else {
                          loadInlineDifferentiation()
                        }
                      } else {
                        setShowPremiumLock(true)
                      }
                    }}
                    disabled={isLoadingDifferentiation || !formState.generatedActivity}
                    className={`flex-shrink-0 min-h-touch px-4 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 text-sm ${
                      (isLoadingDifferentiation || !formState.generatedActivity) 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : isPremium 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                          : 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-white animate-pulse shadow-md'
                    }`}
                  >
                    {isLoadingDifferentiation ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span>{showInlineDifferentiation ? 'Hide Diff' : 'Differentiate'}</span>
                        {!isPremium && <span className="text-xs">✨</span>}
                      </>
                    )}
                  </button>

                  {/* Peabody Logo - Mobile */}
                  <div className="flex-shrink-0 flex items-center justify-center px-4">
                    <img 
                      src="/peabody-logo-new.svg" 
                      alt="Peabody" 
                      className="h-16 w-auto opacity-70"
                    />
                  </div>

                  <button
                    onClick={toggleYouTubeVideos}
                    className={`flex-shrink-0 min-h-touch px-4 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 text-sm ${
                      isPremium 
                        ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md' 
                        : 'bg-gradient-to-r from-red-400 via-orange-500 to-pink-500 text-white animate-pulse shadow-md'
                    }`}
                  >
                    <span>🎬</span>
                    <span>{showYouTubeVideos ? 'Hide Videos' : 'Add Videos'}</span>
                    {!isPremium && <span className="text-xs">✨</span>}
                  </button>
                  
                </div>
              </div>
              
              {/* Desktop Header */}
              <div className="hidden sm:block">
                <div className="grid grid-cols-3 items-center p-4 border-b border-gray-100">
                  {/* Left: Action Buttons */}
                  <div className="flex items-center space-x-3">
                    {/* Differentiation Button - Premium Feature */}
                    <button
                      onClick={() => {
                        if (!formState.generatedActivity) {
                          alert('Please generate an activity first before adding differentiation.')
                          return
                        }
                        if (canUseDifferentiation) {
                          if (showInlineDifferentiation) {
                            setShowInlineDifferentiation(false)
                            setDifferentiationData(null)
                          } else {
                            loadInlineDifferentiation()
                          }
                        } else {
                          setShowPremiumLock(true)
                        }
                      }}
                      disabled={isLoadingDifferentiation || !formState.generatedActivity}
                      className={`${(isLoadingDifferentiation || !formState.generatedActivity) 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : isPremium 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl' 
                          : 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-500 hover:via-orange-600 hover:to-pink-600 text-white animate-pulse shadow-lg hover:shadow-xl border-2 border-amber-300/50'
                      } px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 text-sm relative overflow-hidden`}
                    >
                      {isLoadingDifferentiation ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <span>{showInlineDifferentiation ? 'Hide Differentiation' : 'Differentiate'}</span>
                          {!isPremium && (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                              <span className="ml-1 bg-white bg-opacity-25 px-1.5 py-0.5 rounded-full text-xs font-black shadow-sm">
                                ✨ PRO
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </button>

                    {/* YouTube Videos Button - Premium Feature */}
                    <button
                      onClick={toggleYouTubeVideos}
                      className={`${isPremium 
                        ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl' 
                        : 'bg-gradient-to-r from-red-400 via-orange-500 to-pink-500 hover:from-red-500 hover:via-orange-600 hover:to-pink-600 text-white animate-pulse shadow-lg hover:shadow-xl border-2 border-red-300/50'
                      } px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 text-sm relative overflow-hidden`}
                    >
                      <>
                        <span className="text-lg">🎬</span>
                        <span>{showYouTubeVideos ? 'Hide Videos' : 'Add Videos'}</span>
                        {!isPremium && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                            <span className="ml-1 bg-white bg-opacity-25 px-1.5 py-0.5 rounded-full text-xs font-black shadow-sm">
                              ✨ PRO
                            </span>
                          </>
                        )}
                      </>
                    </button>
                  </div>

                {/* Center: Peabody Logo */}
                <div className="flex items-center justify-center">
                  <img 
                    src="/peabody-logo-new.svg" 
                    alt="Peabody" 
                    className="h-20 w-auto opacity-70"
                  />
                </div>

                {/* Right: Close Button */}
                <div className="flex justify-end">
                  <button
                  onClick={() => dispatch({ type: 'SET_SHOW_PREVIEW', payload: false })}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
                  aria-label="Close preview"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  </button>
                </div>
              </div>

              {/* Top Action Bar - Export/Share at Very Top */}
              <div className="print:hidden border-b border-gray-100 px-3 py-2">
                <div className="flex justify-between items-center">
                  {/* Left: Title and Details */}
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>
                      {formState.isSubMode ? 'Substitute Activity Plan' : 'Lesson Activity Plan'}
                    </h2>
                    <p className="text-gray-600 text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                      {formState.gradeLevel} {formState.subject} | {formState.lessonTopic} | {formState.duration} minutes
                    </p>
                  </div>
                  
                  {/* Right: Action buttons */}
                  <div className="flex space-x-2">
                  {/* Print Button (replaces Export PDF) */}
                  <button
                    onClick={() => {
                      // Create a clean print window with just the lesson content
                      const printContent = document.getElementById('lesson-content')?.innerHTML || '';
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <title>${formState.isSubMode ? 'Substitute Activity Plan' : 'Lesson Activity Plan'}</title>
                            <style>
                              @page { 
                                margin: 0.75in; 
                                size: letter; 
                              }
                              body { 
                                font-family: 'Times New Roman', serif; 
                                line-height: 1.4; 
                                color: #333;
                                margin: 0;
                                padding: 0;
                              }
                              h1, h2, h3 { color: #1a1a1a; margin-top: 1.2em; margin-bottom: 0.6em; }
                              h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 0.3em; }
                              h2 { font-size: 20px; border-bottom: 1px solid #666; padding-bottom: 0.2em; }
                              h3 { font-size: 18px; }
                              p, li { margin-bottom: 0.6em; }
                              ul, ol { margin-left: 1.2em; }
                              .print-only { display: block !important; }
                              .no-print { display: none !important; }
                              table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                              th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                              th { background-color: #f5f5f5; font-weight: bold; }
                            </style>
                          </head>
                          <body>${printContent}</body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                        printWindow.close();
                      }
                    }}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-800 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 shadow-sm hover:shadow-md text-sm"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  >
                    <Printer size={16} />
                    <span>Print</span>
                  </button>
                  
                  {/* Google Drive Export Button */}
                  {formState.generatedActivity && (
                    <Suspense fallback={<div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>}>
                      <GoogleDriveButton
                        lessonData={{
                          topic: formState.lessonTopic,
                          grade: formState.gradeLevel,
                          subject: formState.subject,
                          duration: formState.duration,
                          content: formState.generatedActivity
                        }}
                        lessonContentId="lesson-content"
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-800"
                      />
                    </Suspense>
                  )}

                  {/* Share Dropdown */}
                  <div className="relative share-dropdown-container">
                    <button
                      onClick={() => setShowShareDropdown(!showShareDropdown)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center space-x-2"
                      style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                      <Share size={16} />
                      <span>Share</span>
                      <ChevronDown size={14} className={`transition-transform ${showShareDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showShareDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setShowShareDropdown(false);
                              // Create a clean print window and trigger PDF save
                              const printContent = document.getElementById('lesson-content')?.innerHTML || '';
                              const printWindow = window.open('', '_blank');
                              if (printWindow) {
                                printWindow.document.write(`
                                  <!DOCTYPE html>
                                  <html>
                                  <head>
                                    <title>${formState.isSubMode ? 'Substitute Activity Plan' : 'Lesson Activity Plan'}</title>
                                    <style>
                                      @page { 
                                        margin: 0.75in; 
                                        size: letter; 
                                      }
                                      body { 
                                        font-family: 'Times New Roman', serif; 
                                        line-height: 1.4; 
                                        color: #333;
                                        margin: 0;
                                        padding: 0;
                                      }
                                      h1, h2, h3 { color: #1a1a1a; margin-top: 1.2em; margin-bottom: 0.6em; }
                                      h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 0.3em; }
                                      h2 { font-size: 20px; border-bottom: 1px solid #666; padding-bottom: 0.2em; }
                                      h3 { font-size: 18px; }
                                      p, li { margin-bottom: 0.6em; }
                                      ul, ol { margin-left: 1.2em; }
                                      .print-only { display: block !important; }
                                      .no-print { display: none !important; }
                                      table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                                      th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                                      th { background-color: #f5f5f5; font-weight: bold; }
                                    </style>
                                  </head>
                                  <body>${printContent}</body>
                                  </html>
                                `);
                                printWindow.document.close();
                                // Trigger the browser's save as PDF dialog
                                setTimeout(() => {
                                  printWindow.print();
                                  printWindow.close();
                                }, 500);
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                          >
                            <span className="text-lg">📄</span>
                            <div>
                              <div className="font-medium">Export as PDF</div>
                              <div className="text-xs text-gray-500">Download lesson plan</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              </div>

              {/* Activity Details Section */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  {/* Left: Activity Type Tag */}
                  <div className="flex-1">
                    {(() => {
                      const activityDisplay = getActivityTypeDisplay(
                        formState.activityType === 'other' ? formState.customActivityType : formState.activityType,
                        formState.customActivityType
                      )
                      return (
                        <button
                          onClick={() => {
                            dispatch({ type: 'SET_SHOW_PREVIEW', payload: false })
                            dispatch({ type: 'SET_SHOW_ACTIVITY_CREATION', payload: true })
                            // Keep form data intact - don't reset
                          }}
                          className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 transition-all duration-200 flex items-center space-x-2 group cursor-pointer hover:shadow-sm"
                          style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                          <span className="text-base">{activityDisplay.icon}</span>
                          <span className="font-medium text-gray-900 text-sm group-hover:text-gray-700">
                            Activity Type: {activityDisplay.label}
                          </span>
                          <span className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✏️ Edit</span>
                        </button>
                      )
                    })()}
                  </div>

                  {/* Right: Regenerate Button */}
                  <button
                    onClick={generateActivity}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center space-x-2 ml-4"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  >
                    <span>🔄</span>
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
            </div>
            </div>

            {/* Main Content - Split Screen or Standard */}
            {((showInlineDifferentiation && (differentiationSuggestions || differentiationData)) || showYouTubeVideos) && (
              // Split-screen layout with premium features - Using CSS Grid for proper side-by-side layout
              <div className="flex-1 grid" style={{
                gridTemplateColumns: `${showInlineDifferentiation && (differentiationSuggestions || differentiationData) ? (isDifferentiationPanelCollapsed ? '48px' : '400px') + ' ' : ''}${showYouTubeVideos ? (isYouTubePanelCollapsed ? '56px' : '400px') + ' ' : ''}1fr`,
                height: 'calc(100vh - 300px)',
                minHeight: '600px'
              }}>
                {/* Differentiation Panel */}
                {showInlineDifferentiation && (differentiationSuggestions || differentiationData) && (
                  <div className="bg-white border-r border-gray-200 flex flex-col overflow-y-auto transition-all duration-300">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                    {isDifferentiationPanelCollapsed ? (
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => setIsDifferentiationPanelCollapsed(false)}
                          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors mb-2"
                          title="Expand differentiation menu"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        {/* Vertical indicators */}
                        <div className="space-y-4 text-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-sm">
                            <span className="text-indigo-600 text-xl">🎬</span>
                          </div>
                          
                          <div className="text-xs text-slate-500 transform -rotate-90 whitespace-nowrap origin-center mt-8 font-medium">
                            Differentiation
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">🎯</span>
                          <div>
                            <h3 className="font-bold text-gray-900">Intelligent Differentiation</h3>
                            <p className="text-sm text-gray-600">Contextual strategies for {formState.lessonTopic}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsDifferentiationPanelCollapsed(true)}
                          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-white rounded transition-colors"
                          title="Minimize differentiation panel"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    {differentiationData ? (
                      <DifferentiationMenu
                        data={differentiationData.data || differentiationData}
                        requestedTypes={differentiationData.requestedTypes || []}
                        gradeContext={differentiationData.gradeContext || {}}
                        addedItems={new Set(Object.keys(appliedDifferentiation))}
                        onAddItem={handleAddDifferentiation}
                        onRemoveItem={handleRemoveDifferentiation}
                        isCollapsed={isDifferentiationPanelCollapsed}
                        onToggleCollapse={() => setIsDifferentiationPanelCollapsed(!isDifferentiationPanelCollapsed)}
                      />
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <span className="text-4xl block mb-4">🎯</span>
                        <p>Click &quot;Differentiate&quot; to generate adaptive strategies</p>
                      </div>
                    )}
                  </div>
                </div>
                )}
                
                {/* YouTube Video Panel */}
                {showYouTubeVideos && (
                  <div className="bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
                    <YouTubeVideoMenu
                      topic={formState.lessonTopic}
                      gradeLevel={formState.gradeLevel}
                      subject={formState.subject}
                      duration={parseInt(formState.duration)}
                      isCollapsed={isYouTubePanelCollapsed}
                      onToggleCollapse={() => setIsYouTubePanelCollapsed(!isYouTubePanelCollapsed)}
                      onVideosSelected={handleVideosSelected}
                      selectedVideoIds={new Set(selectedVideos.map(v => v.id))}
                    />
                  </div>
                )}
                
                {/* Mobile-Optimized Main Content Panel */}
                <div className="bg-white overflow-y-auto px-4 py-4 sm:p-6 text-render-optimized">
                  {/* Premium Features Banner - Mobile Optimized */}
                  {(showInlineDifferentiation || showYouTubeVideos) && (
                    <div className="mb-4 space-y-3">
                      {showInlineDifferentiation && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex flex-col sm:flex-row sm:items-center text-purple-800 text-sm space-y-1 sm:space-y-0">
                            <div className="flex items-center">
                              <span className="mr-2 text-base">🎯</span>
                              <span className="font-medium">Differentiation Active</span>
                            </div>
                            <span className="text-purple-600 sm:ml-2 leading-relaxed">Select adaptations from the side panel to enhance your lesson</span>
                          </div>
                        </div>
                      )}
                      {showYouTubeVideos && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex flex-col sm:flex-row sm:items-center text-gray-700 text-sm space-y-2 sm:space-y-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="mr-2 text-base">🎬</span>
                                <span className="font-medium">Video Integration Active</span>
                              </div>
                              {selectedVideos.length > 0 && (
                                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-bold flex-shrink-0">
                                  {selectedVideos.length} selected
                                </span>
                              )}
                            </div>
                            <span className="text-gray-600 sm:ml-2 leading-relaxed">Add educational videos from the side panel to support your lesson</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Mobile-Optimized Lesson Content */}
                  <div id="lesson-content" className="w-full max-w-none mobile-content mobile-no-stretch">
                    {formState.aiProcessing ? (
                      <Suspense fallback={
                        <div className="text-center py-8 sm:py-12">
                          <div className="text-4xl sm:text-6xl mb-4 animate-bounce">🎯</div>
                          <div className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 px-4">Loading enhanced progress...</div>
                        </div>
                      }>
                        <EnhancedLoadingProgress
                          isSubMode={formState.isSubMode}
                          duration={formState.duration}
                          subject={formState.subject}
                          topic={formState.lessonTopic}
                        />
                      </Suspense>
                    ) : (
                      <Suspense fallback={
                        <div className="animate-pulse text-center py-8">
                          <div className="text-lg text-gray-600">Loading lesson content...</div>
                        </div>
                      }>
                        {formState.generatedActivity && (
                          <div className="lesson-content-wrapper">
                            <div id="lesson-content">
                              <PremiumMathContent 
                                content={formState.generatedActivity} 
                                selectedVideos={selectedVideos}
                                subject={formState.subject}
                                gradeLevel={formState.gradeLevel}
                              />
                            </div>
                          </div>
                        )}
                      </Suspense>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {!((showInlineDifferentiation && (differentiationSuggestions || differentiationData)) || showYouTubeVideos) && (
              // Mobile-Optimized Standard single-panel layout
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:p-6 text-render-optimized">
                <div id="lesson-content" className="w-full max-w-none mobile-content mobile-no-stretch">
                  {formState.aiProcessing ? (
                    <Suspense fallback={
                      <div className="text-center py-8 sm:py-12">
                        <div className="text-4xl sm:text-6xl mb-4 animate-bounce">🎯</div>
                        <div className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 px-4">Loading enhanced progress...</div>
                      </div>
                    }>
                      <EnhancedLoadingProgress
                        isSubMode={formState.isSubMode}
                        duration={formState.duration}
                        subject={formState.subject}
                        topic={formState.lessonTopic}
                      />
                    </Suspense>
                  ) : (
                    <Suspense fallback={
                      <div className="animate-pulse text-center py-8">
                        <div className="text-lg text-gray-600">Loading lesson content...</div>
                      </div>
                    }>
                      {formState.generatedActivity && (
                        <div className="lesson-content-wrapper">
                          <div id="lesson-content">
                            <PremiumMathContent 
                              content={formState.generatedActivity} 
                              selectedVideos={selectedVideos}
                              subject={formState.subject}
                              gradeLevel={formState.gradeLevel}
                            />
                          </div>
                        </div>
                      )}
                    </Suspense>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <Suspense fallback={null}>
        {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
      </Suspense>

      {/* Premium Feature Lock Modal */}
      <Suspense fallback={null}>
        {showPremiumLock && <PremiumFeatureLock onClose={() => setShowPremiumLock(false)} />}
      </Suspense>

      {/* Freemium Usage Modals */}
      <Suspense fallback={null}>
        {showAccountModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[60]">
            {/* Blurred App Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50">
              <div className="absolute inset-0 filter blur-sm opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)' }}>
                <div className="p-8 max-w-4xl mx-auto">
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-20 bg-gray-100 rounded"></div>
                      <div className="h-20 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 backdrop-blur-sm"></div>
            <div className="bg-white rounded-lg p-6 max-w-md w-full relative shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">👋</div>
                <h2 className="text-2xl font-bold mb-2">You're doing great!</h2>
                <p className="text-gray-600">
                  You've generated {usageData?.lessonCount || 3} lessons. Create a free account to track your progress and get premium features.
                </p>
              </div>
              <button
                onClick={() => {
                  handleAccountCreated()
                  closeModals()
                }}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors mb-4"
              >
                Create Free Account
              </button>
              <button 
                onClick={() => {
                  closeModals()
                  // Continue with lesson generation after modal dismissal
                  setTimeout(() => {
                    if (!formState.showPreview && !formState.processing) {
                      console.log('🔄 Resuming lesson generation after modal dismissal')
                      // The generation should continue automatically since tracking was successful
                    }
                  }, 100)
                }}
                className="w-full text-gray-500 hover:text-gray-700"
              >
                Continue Without Account
              </button>
            </div>
          </div>
        )}
        
        {showFreemiumUpgradeModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[60]">
            {/* Blurred App Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50">
              <div className="absolute inset-0 filter blur-sm opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(239, 68, 68, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)' }}>
                <div className="p-8 max-w-4xl mx-auto">
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                    <div className="h-6 bg-gray-400 rounded mb-3"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 backdrop-blur-sm"></div>
            <div className="bg-white rounded-lg p-6 max-w-md w-full relative shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">⚡</div>
                <h2 className="text-2xl font-bold mb-2">
                  {upgradeModalType === 'warning' 
                    ? 'Last Free Lesson This Month!' 
                    : "You've Used All 5 Free Lessons"}
                </h2>
                <p className="text-gray-600">
                  {upgradeModalType === 'warning'
                    ? 'This is your final free lesson this month. Upgrade for unlimited access.'
                    : 'Upgrade to Teacher Pro for unlimited lesson generation and premium features.'}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-purple-800 mb-2">✨ Teacher Pro Features:</h3>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Unlimited lesson plans</li>
                  <li>• Full Intelligence Differentiation Engine</li>
                  <li>• Memory Bank lesson library</li>
                  <li>• Google Docs export</li>
                </ul>
              </div>
              
              <button
                onClick={() => {
                  window.location.href = '/pricing'
                }}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors mb-4"
              >
                Upgrade for $7.99/month
              </button>
              
              <button 
                onClick={closeModals}
                className="w-full text-gray-500 hover:text-gray-700"
              >
                {upgradeModalType === 'warning' ? 'Use Last Free Lesson' : 'Maybe Later'}
              </button>
            </div>
          </div>
        )}
      </Suspense>

      {/* Animated Loading Screen */}
      {loadingState.isVisible && (
        <Suspense fallback={null}>
          <AnimatedLoadingScreen
            isVisible={loadingState.isVisible}
            animation={loadingState.animation}
            message={loadingState.message}
          />
        </Suspense>
      )}
      
      {/* Component Preloader - Hidden optimization */}
      <ComponentPreloader />
    </div>
    </>
  )
}

export default function ActivityLessonBuilder() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson builder...</p>
        </div>
      </div>
    }>
      <ActivityLessonBuilderContent />
    </Suspense>
  );
}

// Helper function to process activity content for display
const processActivityContent = (content: string): string => {
  if (!content) return 'No activity content available'
  
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/ACTIVITY NAME: (.*?)(?=\n|$)/gi, '<div class="activity-name font-bold text-lg text-gray-700 border-l-4 border-gray-500 pl-3 mb-4">🎯 ACTIVITY: $1</div>')
    .replace(/Activity Name: (.*?)(?=\n|$)/gi, '<div class="activity-name font-bold text-lg text-gray-700 border-l-4 border-gray-500 pl-3 mb-4">🎯 ACTIVITY: $1</div>')
    .replace(/^\*\*([^*]+ACTIVITY[^*]*)\*\*$/gm, '<div class="activity-name font-bold text-lg text-gray-700 border-l-4 border-gray-500 pl-3 mb-4">🎯 $1</div>')
}
