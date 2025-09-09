import React, { useState } from 'react'
import AdaptationCard from './AdaptationCard'
import DifferentiationPreview from './DifferentiationPreview'

interface DifferentiationEngineProps {
  activityContent: string
  gradeLevel: string
  subject: string
  topic: string
  activityType: string
  duration: string
  onClose: () => void
  isPremium?: boolean
  onUpgradeClick?: () => void
}

interface DifferentiationContent {
  title: string
  talk_track: string[]
  instructions: string[]
  modifications: string[]
  materials_changes?: string[]
  exit_ticket: {
    format: string
    questions: string[]
    time_needed: string
  }
}

interface ESLAdaptations {
  vocabulary_support: string[]
  visual_aids: string[]
  language_scaffolds: string[]
  exit_ticket: {
    format: string
    language_supports: string[]
    visual_supports: string[]
  }
}

interface IEPAdaptations {
  behavioral_supports: string[]
  sensory_accommodations: string[]
  cognitive_modifications: string[]
  exit_ticket: {
    format: string
    accommodations: string[]
    alternative_formats: string[]
  }
}

interface DifferentiationData {
  below_grade: DifferentiationContent
  at_grade: DifferentiationContent
  above_grade: DifferentiationContent
  esl_adaptations: ESLAdaptations & { title: string }
  iep_adaptations: IEPAdaptations & { title: string }
}

const DifferentiationEngine: React.FC<DifferentiationEngineProps> = ({
  activityContent,
  gradeLevel,
  subject,
  topic,
  activityType,
  duration,
  onClose,
  isPremium = false,
  onUpgradeClick
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [differentiationData, setDifferentiationData] = useState<DifferentiationData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateDifferentiation = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🎯 Starting differentiation generation...')
      
      const response = await fetch('/api/premium/differentiation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityContent,
          gradeLevel,
          subject,
          topic,
          activityType,
          duration
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success && result.differentiationData) {
        console.log('✅ Differentiation generated successfully')
        setDifferentiationData(result.differentiationData)
      } else {
        throw new Error(result.error || 'Failed to generate differentiation')
      }
    } catch (error) {
      console.error('❌ Differentiation generation failed:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyAll = async () => {
    if (!differentiationData) return

    try {
      const allAdaptations = [
        `${differentiationData.below_grade.title}\n${formatAdaptationForCopy(differentiationData.below_grade)}`,
        `${differentiationData.at_grade.title}\n${formatAdaptationForCopy(differentiationData.at_grade)}`,
        `${differentiationData.above_grade.title}\n${formatAdaptationForCopy(differentiationData.above_grade)}`,
        `${differentiationData.esl_adaptations.title}\n${formatESLForCopy(differentiationData.esl_adaptations)}`,
        `${differentiationData.iep_adaptations.title}\n${formatIEPForCopy(differentiationData.iep_adaptations)}`
      ].join('\n\n' + '='.repeat(50) + '\n\n')

      const fullContent = `DIFFERENTIATED LESSON PLAN\n${topic} - ${gradeLevel} ${subject}\n\n${allAdaptations}`
      
      await navigator.clipboard.writeText(fullContent)
      alert('All differentiated content copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy content:', error)
      alert('Failed to copy content to clipboard')
    }
  }

  const formatAdaptationForCopy = (adaptation: DifferentiationContent): string => {
    const sections = []
    
    if (adaptation.talk_track?.length) {
      sections.push(`Teacher Talk Track:\n• ${adaptation.talk_track.join('\n• ')}`)
    }
    if (adaptation.instructions?.length) {
      sections.push(`Instructions:\n• ${adaptation.instructions.join('\n• ')}`)
    }
    if (adaptation.modifications?.length) {
      sections.push(`Modifications:\n• ${adaptation.modifications.join('\n• ')}`)
    }
    if (adaptation.materials_changes?.length) {
      sections.push(`Materials Changes:\n• ${adaptation.materials_changes.join('\n• ')}`)
    }
    
    // Add exit ticket section
    if (adaptation.exit_ticket) {
      const exitTicketSection = [`Exit Ticket Format: ${adaptation.exit_ticket.format}`]
      if (adaptation.exit_ticket.questions?.length) {
        exitTicketSection.push(`Questions:\n• ${adaptation.exit_ticket.questions.join('\n• ')}`)
      }
      if (adaptation.exit_ticket.time_needed) {
        exitTicketSection.push(`Time Needed: ${adaptation.exit_ticket.time_needed}`)
      }
      sections.push(`Exit Ticket:\n${exitTicketSection.join('\n')}`)
    }
    
    return sections.join('\n\n')
  }

  const formatESLForCopy = (adaptation: ESLAdaptations): string => {
    const sections = []
    
    if (adaptation.vocabulary_support?.length) {
      sections.push(`Vocabulary Support:\n• ${adaptation.vocabulary_support.join('\n• ')}`)
    }
    if (adaptation.visual_aids?.length) {
      sections.push(`Visual Aids:\n• ${adaptation.visual_aids.join('\n• ')}`)
    }
    if (adaptation.language_scaffolds?.length) {
      sections.push(`Language Scaffolds:\n• ${adaptation.language_scaffolds.join('\n• ')}`)
    }
    
    // Add exit ticket section
    if (adaptation.exit_ticket) {
      const exitTicketSection = [`Exit Ticket Format: ${adaptation.exit_ticket.format}`]
      if (adaptation.exit_ticket.language_supports?.length) {
        exitTicketSection.push(`Language Supports:\n• ${adaptation.exit_ticket.language_supports.join('\n• ')}`)
      }
      if (adaptation.exit_ticket.visual_supports?.length) {
        exitTicketSection.push(`Visual Supports:\n• ${adaptation.exit_ticket.visual_supports.join('\n• ')}`)
      }
      sections.push(`Exit Ticket:\n${exitTicketSection.join('\n')}`)
    }
    
    return sections.join('\n\n')
  }

  const formatIEPForCopy = (adaptation: IEPAdaptations): string => {
    const sections = []
    
    if (adaptation.behavioral_supports?.length) {
      sections.push(`Behavioral Supports:\n• ${adaptation.behavioral_supports.join('\n• ')}`)
    }
    if (adaptation.sensory_accommodations?.length) {
      sections.push(`Sensory Accommodations:\n• ${adaptation.sensory_accommodations.join('\n• ')}`)
    }
    if (adaptation.cognitive_modifications?.length) {
      sections.push(`Cognitive Modifications:\n• ${adaptation.cognitive_modifications.join('\n• ')}`)
    }
    
    // Add exit ticket section
    if (adaptation.exit_ticket) {
      const exitTicketSection = [`Exit Ticket Format: ${adaptation.exit_ticket.format}`]
      if (adaptation.exit_ticket.accommodations?.length) {
        exitTicketSection.push(`Accommodations:\n• ${adaptation.exit_ticket.accommodations.join('\n• ')}`)
      }
      if (adaptation.exit_ticket.alternative_formats?.length) {
        exitTicketSection.push(`Alternative Formats:\n• ${adaptation.exit_ticket.alternative_formats.join('\n• ')}`)
      }
      sections.push(`Exit Ticket:\n${exitTicketSection.join('\n')}`)
    }
    
    return sections.join('\n\n')
  }

  // Helper function to check if a differentiation card has meaningful content
  const hasContent = (data: any): boolean => {
    if (!data) return false
    
    // Check all possible array fields for content
    const arrayFields = [
      'talk_track', 'instructions', 'modifications', 'materials_changes',
      'vocabulary_support', 'visual_aids', 'language_scaffolds',
      'behavioral_supports', 'sensory_accommodations', 'cognitive_modifications'
    ]
    
    const hasArrayContent = arrayFields.some(field => {
      const fieldData = data[field]
      return fieldData && Array.isArray(fieldData) && 
             fieldData.length > 0 && 
             !fieldData.every(item => 
               !item || 
               item === 'No content generated' || 
               item.includes('No ') && item.includes(' generated')
             )
    })
    
    // Check exit ticket content
    const hasExitTicketContent = data.exit_ticket && (
      (data.exit_ticket.questions && data.exit_ticket.questions.length > 0 && 
       !data.exit_ticket.questions.every((q: string) => !q || q.includes('No ') || q === 'What did you learn today?')) ||
      (data.exit_ticket.language_supports && data.exit_ticket.language_supports.length > 0) ||
      (data.exit_ticket.visual_supports && data.exit_ticket.visual_supports.length > 0) ||
      (data.exit_ticket.accommodations && data.exit_ticket.accommodations.length > 0) ||
      (data.exit_ticket.alternative_formats && data.exit_ticket.alternative_formats.length > 0)
    )
    
    return hasArrayContent || hasExitTicketContent
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🎯 Enhanced Differentiation Intelligence
              </h2>
              <p className="text-gray-600 text-sm">
                Generate 5 specialized adaptations for: <strong>{topic}</strong> ({gradeLevel} {subject})
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {differentiationData && (
                <button
                  onClick={handleCopyAll}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Copy All Adaptations
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!differentiationData && !isLoading && (
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to Create Differentiated Versions
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Generate 5 comprehensive adaptations of your activity: below-grade, at-grade, above-grade, ESL-friendly, and IEP accommodations. Each includes specific teacher scripts and implementation guidance.
                </p>
              </div>
              
              <button
                onClick={generateDifferentiation}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              >
                <span>🚀</span>
                <span>Generate All 5 Adaptations</span>
              </button>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
                {[
                  { icon: '📚', label: 'Below Grade', desc: 'Simplified instructions' },
                  { icon: '🎯', label: 'At Grade', desc: 'Standard level' },
                  { icon: '🚀', label: 'Above Grade', desc: 'Enhanced complexity' },
                  { icon: '🌍', label: 'ESL Support', desc: 'Language scaffolds' },
                  { icon: '🤝', label: 'IEP Ready', desc: 'Accommodations' }
                ].map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-sm text-gray-600">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-4xl sm:text-6xl mb-4 animate-spin">⚙️</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Generating Differentiated Adaptations...
              </h3>
              <p className="text-gray-600 text-center max-w-md font-bold">
                Differentiating content for different learning levels and needs. This may take 30-45 seconds.
              </p>
              <div className="mt-4 w-48 sm:w-64 bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-red-900 mb-2">
                Generation Failed
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={generateDifferentiation}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {differentiationData && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ✅ All 5 Adaptations Generated Successfully!
                </h3>
                <p className="text-gray-600">
                  Click on any adaptation below to expand and view detailed teacher scripts and implementation guidance.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {hasContent(differentiationData.below_grade) && (
                  <DifferentiationPreview
                    isPremium={isPremium}
                    onUpgradeClick={onUpgradeClick}
                    content={
                      <AdaptationCard
                        title={differentiationData.below_grade.title}
                        type="below"
                        data={differentiationData.below_grade}
                      />
                    }
                  />
                )}
                
                {hasContent(differentiationData.at_grade) && (
                  <DifferentiationPreview
                    isPremium={isPremium}
                    onUpgradeClick={onUpgradeClick}
                    content={
                      <AdaptationCard
                        title={differentiationData.at_grade.title}
                        type="at"
                        data={differentiationData.at_grade}
                      />
                    }
                  />
                )}
                
                {hasContent(differentiationData.above_grade) && (
                  <DifferentiationPreview
                    isPremium={isPremium}
                    onUpgradeClick={onUpgradeClick}
                    content={
                      <AdaptationCard
                        title={differentiationData.above_grade.title}
                        type="above"
                        data={differentiationData.above_grade}
                      />
                    }
                  />
                )}
                
                {hasContent(differentiationData.esl_adaptations) && (
                  <DifferentiationPreview
                    isPremium={isPremium}
                    onUpgradeClick={onUpgradeClick}
                    content={
                      <AdaptationCard
                        title={differentiationData.esl_adaptations.title}
                        type="esl"
                        data={differentiationData.esl_adaptations}
                      />
                    }
                  />
                )}
                
                {hasContent(differentiationData.iep_adaptations) && (
                  <DifferentiationPreview
                    isPremium={isPremium}
                    onUpgradeClick={onUpgradeClick}
                    content={
                      <AdaptationCard
                        title={differentiationData.iep_adaptations.title}
                        type="iep"
                        data={differentiationData.iep_adaptations}
                      />
                    }
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DifferentiationEngine