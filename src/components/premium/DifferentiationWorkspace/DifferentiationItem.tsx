import React, { useState, useRef, useEffect } from 'react'

interface DifferentiationItemProps {
  type: 'below_grade' | 'at_grade' | 'above_grade' | 'esl_adaptations' | 'iep_adaptations'
  title: string
  preview: string
  data: {
    talk_track?: string[]
    instructions?: string[]
    modifications?: string[]
    materials_changes?: string[]
    vocabulary_support?: string[]
    visual_aids?: string[]
    language_scaffolds?: string[]
    behavioral_supports?: string[]
    sensory_accommodations?: string[]
    cognitive_modifications?: string[]
  }
  onAddToPlan?: () => void
  isAdded: boolean
  onRemove?: () => void
  onApply?: (mode: 'replace' | 'include') => void
  onPreview?: () => void
  showApplyOptions?: boolean
}

const DifferentiationItem: React.FC<DifferentiationItemProps> = ({
  type,
  title,
  preview,
  data,
  onAddToPlan,
  isAdded,
  onRemove,
  onApply,
  onPreview,
  showApplyOptions = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActions(false)
      }
    }

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActions])

  const getTypeConfig = () => {
    switch (type) {
      case 'below_grade':
        return {
          icon: '📚',
          color: 'bg-blue-50 border-blue-200',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          textColor: 'text-blue-800',
          description: 'Simplified for struggling learners'
        }
      case 'at_grade':
        return {
          icon: '🎯',
          color: 'bg-gray-50 border-gray-200',
          buttonColor: 'bg-gray-600 hover:bg-gray-700',
          textColor: 'text-gray-800',
          description: 'Standard grade-level expectations'
        }
      case 'above_grade':
        return {
          icon: '🚀',
          color: 'bg-purple-50 border-purple-200',
          buttonColor: 'bg-purple-600 hover:bg-purple-700',
          textColor: 'text-purple-800',
          description: 'Enhanced for advanced students'
        }
      case 'esl_adaptations':
        return {
          icon: '🌍',
          color: 'bg-green-50 border-green-200',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          textColor: 'text-green-800',
          description: 'Language support strategies'
        }
      case 'iep_adaptations':
        return {
          icon: '🤝',
          color: 'bg-orange-50 border-orange-200',
          buttonColor: 'bg-orange-600 hover:bg-orange-700',
          textColor: 'text-orange-800',
          description: 'Special needs accommodations'
        }
      default:
        return {
          icon: '📝',
          color: 'bg-gray-50 border-gray-200',
          buttonColor: 'bg-gray-600 hover:bg-gray-700',
          textColor: 'text-gray-800',
          description: 'Custom adaptation'
        }
    }
  }

  const config = getTypeConfig()

  const getContentSections = () => {
    const sections = []
    
    if (data.talk_track?.length) {
      sections.push({ title: 'Teacher Scripts', items: data.talk_track, icon: '💬' })
    }
    if (data.instructions?.length) {
      sections.push({ title: 'Instructions', items: data.instructions, icon: '📋' })
    }
    if (data.modifications?.length) {
      sections.push({ title: 'Modifications', items: data.modifications, icon: '🔧' })
    }
    if (data.materials_changes?.length) {
      sections.push({ title: 'Materials', items: data.materials_changes, icon: '📦' })
    }
    if (data.vocabulary_support?.length) {
      sections.push({ title: 'Vocabulary', items: data.vocabulary_support, icon: '📖' })
    }
    if (data.visual_aids?.length) {
      sections.push({ title: 'Visual Aids', items: data.visual_aids, icon: '🖼️' })
    }
    if (data.language_scaffolds?.length) {
      sections.push({ title: 'Language Support', items: data.language_scaffolds, icon: '🏗️' })
    }
    if (data.behavioral_supports?.length) {
      sections.push({ title: 'Behavior Support', items: data.behavioral_supports, icon: '🎭' })
    }
    if (data.sensory_accommodations?.length) {
      sections.push({ title: 'Sensory Support', items: data.sensory_accommodations, icon: '👂' })
    }
    if (data.cognitive_modifications?.length) {
      sections.push({ title: 'Cognitive Support', items: data.cognitive_modifications, icon: '🧠' })
    }
    
    return sections
  }

  return (
    <div className={`border rounded-lg ${config.color} transition-all duration-200 ${isAdded ? 'opacity-60' : 'hover:shadow-md'}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center flex-1">
            <span className="text-2xl mr-3">{config.icon}</span>
            <div className="flex-1">
              <h4 className={`font-semibold ${config.textColor}`}>{title}</h4>
              <p className="text-xs text-gray-600 mt-1">{config.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {showApplyOptions && onApply ? (
              <>
                {isAdded && onRemove ? (
                  <button
                    onClick={onRemove}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                    title="Remove from lesson"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowActions(!showActions)}
                      className={`${config.buttonColor} text-white text-xs px-3 py-2 rounded-lg font-medium transition-all flex items-center space-x-1`}
                    >
                      <span>Apply</span>
                      <svg className={`w-3 h-3 transform transition-transform ${showActions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showActions && (
                      <div 
                        className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-32"
                        style={{ zIndex: 1000 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            onApply?.('include')
                            setShowActions(false)
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          📌 Include
                          <div className="text-xs text-gray-500">Add alongside existing</div>
                        </button>
                        <button
                          onClick={() => {
                            onApply?.('replace')
                            setShowActions(false)
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                        >
                          🔄 Replace
                          <div className="text-xs text-gray-500">Swap out sections</div>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {isAdded && onRemove ? (
                  <button
                    onClick={onRemove}
                    className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                    title="Remove from lesson"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={onAddToPlan}
                    disabled={isAdded}
                    className={`${config.buttonColor} disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs px-3 py-1 rounded font-medium transition-colors`}
                  >
                    {isAdded ? 'Added' : 'Add to Plan'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="text-sm text-gray-700 mb-3">
          {preview}
        </div>

        {/* Toggle Details Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-xs text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span className="mr-1">{isExpanded ? '▼' : '▶'}</span>
          {isExpanded ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-white bg-opacity-50">
          <div className="space-y-3">
            {getContentSections().map((section, index) => (
              <div key={index}>
                <div className="flex items-center mb-1">
                  <span className="mr-2">{section.icon}</span>
                  <h5 className="font-medium text-sm text-gray-800">{section.title}</h5>
                </div>
                <ul className="text-xs text-gray-700 space-y-1 ml-6">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex">
                      <span className="mr-2 text-gray-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DifferentiationItem