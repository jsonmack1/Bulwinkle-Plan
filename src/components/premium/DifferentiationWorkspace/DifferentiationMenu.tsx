import React, { useState } from 'react'
import DifferentiationItem from './DifferentiationItem'

interface DifferentiationData {
  below_grade?: {
    title: string
    talk_track?: string[]
    instructions?: string[]
    modifications?: string[]
    materials_changes?: string[]
  }
  at_grade?: {
    title: string
    talk_track?: string[]
    instructions?: string[]
    modifications?: string[]
    materials_changes?: string[]
  }
  above_grade?: {
    title: string
    talk_track?: string[]
    instructions?: string[]
    modifications?: string[]
    materials_changes?: string[]
  }
  esl_adaptations?: {
    title: string
    vocabulary_support?: string[]
    visual_aids?: string[]
    language_scaffolds?: string[]
  }
  iep_adaptations?: {
    title: string
    behavioral_supports?: string[]
    sensory_accommodations?: string[]
    cognitive_modifications?: string[]
  }
}

interface DifferentiationMenuProps {
  data: DifferentiationData
  requestedTypes: string[]
  gradeContext: {
    level: string
    isElementary: boolean
    isMiddleSchool: boolean
    isHighSchool: boolean
  }
  addedItems: Set<string>
  onAddItem: (type: string, data: any) => void
  onRemoveItem: (type: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const DifferentiationMenu: React.FC<DifferentiationMenuProps> = ({
  data,
  requestedTypes,
  gradeContext,
  addedItems,
  onAddItem,
  onRemoveItem,
  isCollapsed,
  onToggleCollapse
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['adaptations']))

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  // Validate that differentiation content has meaningful data
  const hasValidContent = (type: string, itemData: any): boolean => {
    if (!itemData || !itemData.title) return false
    
    // Check if title indicates empty content
    const title = itemData.title.toLowerCase()
    if (title.includes('support for struggling students') || 
        title.includes('extensions for advanced learners') ||
        title.includes('iep accommodations version') ||
        title.includes('esl-friendly version')) {
      
      // For standard template titles, check if there's actual content
      if (type === 'iep_adaptations') {
        const hasContent = (itemData.behavioral_supports && 
                           itemData.behavioral_supports.length > 0 && 
                           !itemData.behavioral_supports.every((item: string) => 
                             item.includes('No behavioral supports generated') ||
                             item.includes('No sensory accommodations generated') ||
                             item.includes('No cognitive modifications generated')
                           )) ||
                          (itemData.sensory_accommodations && 
                           itemData.sensory_accommodations.length > 0 &&
                           !itemData.sensory_accommodations.every((item: string) => 
                             item.includes('No behavioral supports generated') ||
                             item.includes('No sensory accommodations generated') ||
                             item.includes('No cognitive modifications generated')
                           )) ||
                          (itemData.cognitive_modifications && 
                           itemData.cognitive_modifications.length > 0 &&
                           !itemData.cognitive_modifications.every((item: string) => 
                             item.includes('No behavioral supports generated') ||
                             item.includes('No sensory accommodations generated') ||
                             item.includes('No cognitive modifications generated')
                           ))
        return hasContent
      }
      
      // For other types, check if they have meaningful arrays
      const contentKeys = ['talk_track', 'instructions', 'modifications', 'materials_changes', 
                          'vocabulary_support', 'visual_aids', 'language_scaffolds']
      
      return contentKeys.some(key => {
        const content = itemData[key]
        return Array.isArray(content) && content.length > 0 && 
               content.some((item: string) => item.trim().length > 10) // Has substantial content
      })
    }
    
    // For non-template titles, assume they have content
    return true
  }

  const getGradeInfo = () => {
    if (gradeContext.isElementary) {
      return {
        title: 'Elementary Adaptations',
        subtitle: 'K-5 focused on concrete, hands-on learning',
        icon: '🎨'
      }
    } else if (gradeContext.isMiddleSchool) {
      return {
        title: 'Middle School Adaptations',
        subtitle: '6-8 balancing concrete and abstract thinking',
        icon: '🔬'
      }
    } else if (gradeContext.isHighSchool) {
      return {
        title: 'High School Adaptations',
        subtitle: '9-12 focused on abstract thinking and independence',
        icon: '🎓'
      }
    }
    return {
      title: 'Grade Level Adaptations',
      subtitle: 'Customized for your students',
      icon: '📚'
    }
  }

  const gradeInfo = getGradeInfo()

  const generatePreview = (type: string, itemData: any) => {
    if (type === 'esl_adaptations') {
      const vocab = itemData.vocabulary_support?.[0] || 'Vocabulary support'
      const visual = itemData.visual_aids?.[0] || 'Visual aids'
      return `${vocab.substring(0, 50)}${vocab.length > 50 ? '...' : ''} • ${visual.substring(0, 30)}${visual.length > 30 ? '...' : ''}`
    }
    
    if (type === 'iep_adaptations') {
      const behavioral = itemData.behavioral_supports?.[0] || 'Behavioral supports'
      const sensory = itemData.sensory_accommodations?.[0] || 'Sensory accommodations'
      return `${behavioral.substring(0, 50)}${behavioral.length > 50 ? '...' : ''} • ${sensory.substring(0, 30)}${sensory.length > 30 ? '...' : ''}`
    }
    
    // For grade level adaptations
    const instruction = itemData.instructions?.[0] || itemData.talk_track?.[0] || itemData.modifications?.[0] || 'Adapted content'
    return `${instruction.substring(0, 80)}${instruction.length > 80 ? '...' : ''}`
  }

  const organizeItems = () => {
    const gradeLevelItems: any[] = []
    const supportItems: any[] = []
    
    requestedTypes.forEach(type => {
      const itemData = data[type as keyof DifferentiationData]
      if (!itemData) return
      
      // Validate that the item has meaningful content
      if (!hasValidContent(type, itemData)) return
      
      const item = {
        type: type as any,
        data: itemData,
        preview: generatePreview(type, itemData)
      }
      
      if (type === 'esl_adaptations' || type === 'iep_adaptations') {
        supportItems.push(item)
      } else {
        gradeLevelItems.push(item)
      }
    })
    
    return { gradeLevelItems, supportItems }
  }

  const { gradeLevelItems, supportItems } = organizeItems()

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors mb-4"
          title="Expand differentiation menu"
        >
          <svg className="w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Vertical indicators */}
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 text-sm font-bold">{gradeLevelItems.length}</span>
          </div>
          <div className="text-xs text-gray-500 transform -rotate-90 whitespace-nowrap origin-center">
            Grade
          </div>
          
          {supportItems.length > 0 && (
            <>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-4">
                <span className="text-green-600 text-sm font-bold">{supportItems.length}</span>
              </div>
              <div className="text-xs text-gray-500 transform -rotate-90 whitespace-nowrap origin-center">
                Support
              </div>
            </>
          )}
        </div>
        
        {/* Added items indicator */}
        {addedItems.size > 0 && (
          <div className="mt-auto">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">{addedItems.size}</span>
            </div>
            <div className="text-xs text-gray-500 text-center mt-1 transform -rotate-90 whitespace-nowrap origin-center">
              Added
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col min-h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{gradeInfo.icon}</span>
            <div>
              <h3 className="font-bold text-gray-900">{gradeInfo.title}</h3>
              <p className="text-sm text-gray-600">{gradeInfo.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-white rounded transition-colors"
            title="Collapse menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center text-purple-600">
            <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
            <span>{requestedTypes.length} Generated</span>
          </div>
          {addedItems.size > 0 && (
            <div className="flex items-center text-green-600">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
              <span>{addedItems.size} Added</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Grade Level Adaptations */}
        {gradeLevelItems.length > 0 && (
          <div className="p-4">
            <button
              onClick={() => toggleSection('adaptations')}
              className="flex items-center justify-between w-full mb-3 text-left"
            >
              <h4 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🎯</span>
                Learning Level Adaptations
              </h4>
              <span className={`transform transition-transform ${expandedSections.has('adaptations') ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            
            {expandedSections.has('adaptations') && (
              <div className="space-y-3">
                {gradeLevelItems.map((item) => (
                  <DifferentiationItem
                    key={item.type}
                    type={item.type}
                    title={item.data.title}
                    preview={item.preview}
                    data={item.data}
                    onAddToPlan={() => onAddItem(item.type, item.data)}
                    isAdded={addedItems.has(item.type)}
                    onRemove={() => onRemoveItem(item.type)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Support Adaptations */}
        {supportItems.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => toggleSection('supports')}
              className="flex items-center justify-between w-full mb-3 text-left"
            >
              <h4 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🤝</span>
                Learning Support Adaptations
              </h4>
              <span className={`transform transition-transform ${expandedSections.has('supports') ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            
            {expandedSections.has('supports') && (
              <div className="space-y-3">
                {supportItems.map((item) => (
                  <DifferentiationItem
                    key={item.type}
                    type={item.type}
                    title={item.data.title}
                    preview={item.preview}
                    data={item.data}
                    onAddToPlan={() => onAddItem(item.type, item.data)}
                    isAdded={addedItems.has(item.type)}
                    onRemove={() => onRemoveItem(item.type)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="p-4 border-t border-gray-100 mt-auto">
          <div className="bg-blue-50 rounded-lg p-3">
            <h5 className="font-medium text-blue-900 text-sm mb-1 flex items-center">
              <span className="mr-2">💡</span>
              Quick Tips
            </h5>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Click "Add to Plan" to integrate adaptations</li>
              <li>• Choose "Add alongside" for mixed-ability classes</li>
              <li>• Use "Replace" for consistent level instruction</li>
              <li>• Remove adaptations anytime with the X button</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DifferentiationMenu