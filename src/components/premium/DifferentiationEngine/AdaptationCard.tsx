import React, { useState } from 'react'

interface AdaptationCardProps {
  title: string
  type: 'below' | 'at' | 'above' | 'esl' | 'iep'
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
    exit_ticket?: {
      format?: string
      questions?: string[]
      time_needed?: string
      language_supports?: string[]
      visual_supports?: string[]
      accommodations?: string[]
      alternative_formats?: string[]
    }
  }
}

const AdaptationCard: React.FC<AdaptationCardProps> = ({ title, type, data }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const handleCopy = async (content: string, sectionName: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedSection(sectionName)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const getCardColors = () => {
    switch (type) {
      case 'below':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          header: 'bg-blue-100',
          text: 'text-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700',
          copyBtn: 'text-blue-600 hover:text-blue-800 border-blue-200 hover:bg-blue-100'
        }
      case 'at':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          header: 'bg-gray-100',
          text: 'text-gray-800',
          button: 'bg-gray-600 hover:bg-gray-700',
          copyBtn: 'text-gray-600 hover:text-gray-800 border-gray-200 hover:bg-gray-100'
        }
      case 'above':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          header: 'bg-purple-100',
          text: 'text-purple-800',
          button: 'bg-purple-600 hover:bg-purple-700',
          copyBtn: 'text-purple-600 hover:text-purple-800 border-purple-200 hover:bg-purple-100'
        }
      case 'esl':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          header: 'bg-green-100',
          text: 'text-green-800',
          button: 'bg-green-600 hover:bg-green-700',
          copyBtn: 'text-green-600 hover:text-green-800 border-green-200 hover:bg-green-100'
        }
      case 'iep':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          header: 'bg-orange-100',
          text: 'text-orange-800',
          button: 'bg-orange-600 hover:bg-orange-700',
          copyBtn: 'text-orange-600 hover:text-orange-800 border-orange-200 hover:bg-orange-100'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          header: 'bg-gray-100',
          text: 'text-gray-800',
          button: 'bg-gray-600 hover:bg-gray-700',
          copyBtn: 'text-gray-600 hover:text-gray-800 border-gray-200 hover:bg-gray-100'
        }
    }
  }

  const colors = getCardColors()

  const renderSection = (sectionTitle: string, items: string[] | undefined, icon: string) => {
    if (!items || items.length === 0) return null

    const sectionContent = items.join('\n• ')
    const fullContent = `${sectionTitle}:\n• ${sectionContent}`

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h5 className={`font-semibold ${colors.text} flex items-center`}>
            <span className="mr-2">{icon}</span>
            {sectionTitle}
          </h5>
          <button
            onClick={() => handleCopy(fullContent, sectionTitle)}
            className={`text-xs px-2 py-1 border rounded transition-colors ${colors.copyBtn}`}
            title={`Copy ${sectionTitle}`}
          >
            {copiedSection === sectionTitle ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <ul className="text-sm space-y-1">
          {items.map((item, index) => (
            <li key={index} className="flex">
              <span className="mr-2">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const getTypeIcon = () => {
    switch (type) {
      case 'below': return '📚'
      case 'at': return '🎯'
      case 'above': return '🚀'
      case 'esl': return '🌍'
      case 'iep': return '🤝'
      default: return '📝'
    }
  }

  return (
    <div className={`border rounded-lg ${colors.bg} ${colors.border} overflow-hidden`}>
      {/* Card Header */}
      <div className={`${colors.header} p-4 cursor-pointer`} onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getTypeIcon()}</span>
            <div>
              <h4 className={`font-bold ${colors.text}`}>{title}</h4>
              <p className={`text-sm ${colors.text} opacity-80`}>
                Click to {isExpanded ? 'collapse' : 'expand'} details
              </p>
            </div>
          </div>
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Standard Differentiation Sections */}
          {data.talk_track && renderSection('Teacher Talk Track', data.talk_track, '💬')}
          {data.instructions && renderSection('Modified Instructions', data.instructions, '📋')}
          {data.modifications && renderSection('Key Modifications', data.modifications, '🔧')}
          {data.materials_changes && renderSection('Materials Changes', data.materials_changes, '📦')}

          {/* ESL Specific Sections */}
          {data.vocabulary_support && renderSection('Vocabulary Support', data.vocabulary_support, '📖')}
          {data.visual_aids && renderSection('Visual Aids', data.visual_aids, '🖼️')}
          {data.language_scaffolds && renderSection('Language Scaffolds', data.language_scaffolds, '🏗️')}

          {/* IEP Specific Sections */}
          {data.behavioral_supports && renderSection('Behavioral Supports', data.behavioral_supports, '🎭')}
          {data.sensory_accommodations && renderSection('Sensory Accommodations', data.sensory_accommodations, '👂')}
          {data.cognitive_modifications && renderSection('Cognitive Modifications', data.cognitive_modifications, '🧠')}

          {/* Exit Ticket Section - Always show with prominent styling */}
          {data.exit_ticket && (
            <div className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-bold text-indigo-800 flex items-center text-lg">
                  <span className="mr-2 text-xl">🎯</span>
                  Exit Ticket
                </h5>
                <button
                  onClick={() => {
                    const exitTicketContent = [
                      `Exit Ticket Format: ${data.exit_ticket?.format || 'Standard format'}`,
                      data.exit_ticket?.time_needed ? `Time Needed: ${data.exit_ticket.time_needed}` : '',
                      data.exit_ticket?.questions?.length ? `Questions:\n• ${data.exit_ticket.questions.join('\n• ')}` : '',
                      data.exit_ticket?.language_supports?.length ? `Language Supports:\n• ${data.exit_ticket.language_supports.join('\n• ')}` : '',
                      data.exit_ticket?.visual_supports?.length ? `Visual Supports:\n• ${data.exit_ticket.visual_supports.join('\n• ')}` : '',
                      data.exit_ticket?.accommodations?.length ? `Accommodations:\n• ${data.exit_ticket.accommodations.join('\n• ')}` : '',
                      data.exit_ticket?.alternative_formats?.length ? `Alternative Formats:\n• ${data.exit_ticket.alternative_formats.join('\n• ')}` : ''
                    ].filter(Boolean).join('\n\n')
                    handleCopy(exitTicketContent, 'Exit Ticket')
                  }}
                  className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                  title="Copy Exit Ticket"
                >
                  {copiedSection === 'Exit Ticket' ? 'Copied!' : 'Copy Exit Ticket'}
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-indigo-700">Format:</span>
                  <span className="ml-2 text-gray-800">{data.exit_ticket.format}</span>
                </div>
                
                {data.exit_ticket.time_needed && (
                  <div>
                    <span className="font-medium text-indigo-700">Time Needed:</span>
                    <span className="ml-2 text-gray-800">{data.exit_ticket.time_needed}</span>
                  </div>
                )}
                
                {data.exit_ticket.questions && data.exit_ticket.questions.length > 0 && (
                  <div>
                    <span className="font-medium text-indigo-700 block mb-1">Questions:</span>
                    <ul className="ml-4 space-y-1">
                      {data.exit_ticket.questions.map((question, index) => (
                        <li key={index} className="flex">
                          <span className="mr-2 text-indigo-500">•</span>
                          <span className="text-gray-800">{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {data.exit_ticket.language_supports && data.exit_ticket.language_supports.length > 0 && (
                  <div>
                    <span className="font-medium text-indigo-700 block mb-1">Language Supports:</span>
                    <ul className="ml-4 space-y-1">
                      {data.exit_ticket.language_supports.map((support, index) => (
                        <li key={index} className="flex">
                          <span className="mr-2 text-indigo-500">•</span>
                          <span className="text-gray-800">{support}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {data.exit_ticket.visual_supports && data.exit_ticket.visual_supports.length > 0 && (
                  <div>
                    <span className="font-medium text-indigo-700 block mb-1">Visual Supports:</span>
                    <ul className="ml-4 space-y-1">
                      {data.exit_ticket.visual_supports.map((support, index) => (
                        <li key={index} className="flex">
                          <span className="mr-2 text-indigo-500">•</span>
                          <span className="text-gray-800">{support}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {data.exit_ticket.accommodations && data.exit_ticket.accommodations.length > 0 && (
                  <div>
                    <span className="font-medium text-indigo-700 block mb-1">Accommodations:</span>
                    <ul className="ml-4 space-y-1">
                      {data.exit_ticket.accommodations.map((accommodation, index) => (
                        <li key={index} className="flex">
                          <span className="mr-2 text-indigo-500">•</span>
                          <span className="text-gray-800">{accommodation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {data.exit_ticket.alternative_formats && data.exit_ticket.alternative_formats.length > 0 && (
                  <div>
                    <span className="font-medium text-indigo-700 block mb-1">Alternative Formats:</span>
                    <ul className="ml-4 space-y-1">
                      {data.exit_ticket.alternative_formats.map((format, index) => (
                        <li key={index} className="flex">
                          <span className="mr-2 text-indigo-500">•</span>
                          <span className="text-gray-800">{format}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Copy All Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                const sections = []
                
                // Add regular array sections
                Object.entries(data)
                  .filter(([key, value]) => key !== 'exit_ticket' && value && Array.isArray(value) && value.length > 0)
                  .forEach(([key, value]) => {
                    const sectionName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    sections.push(`${sectionName}:\n• ${(value as string[]).join('\n• ')}`)
                  })
                
                // Add exit ticket section
                if (data.exit_ticket) {
                  const exitTicketContent = [
                    `Exit Ticket Format: ${data.exit_ticket.format || 'Standard format'}`,
                    data.exit_ticket.time_needed ? `Time Needed: ${data.exit_ticket.time_needed}` : '',
                    data.exit_ticket.questions?.length ? `Questions:\n• ${data.exit_ticket.questions.join('\n• ')}` : '',
                    data.exit_ticket.language_supports?.length ? `Language Supports:\n• ${data.exit_ticket.language_supports.join('\n• ')}` : '',
                    data.exit_ticket.visual_supports?.length ? `Visual Supports:\n• ${data.exit_ticket.visual_supports.join('\n• ')}` : '',
                    data.exit_ticket.accommodations?.length ? `Accommodations:\n• ${data.exit_ticket.accommodations.join('\n• ')}` : '',
                    data.exit_ticket.alternative_formats?.length ? `Alternative Formats:\n• ${data.exit_ticket.alternative_formats.join('\n• ')}` : ''
                  ].filter(Boolean).join('\n')
                  
                  if (exitTicketContent) {
                    sections.push(`Exit Ticket:\n${exitTicketContent}`)
                  }
                }
                
                const allContent = sections.join('\n\n')
                const fullContent = `${title}\n\n${allContent}`
                handleCopy(fullContent, 'entire adaptation')
              }}
              className={`w-full ${colors.button} text-white px-4 py-2 rounded font-medium transition-colors`}
            >
              {copiedSection === 'entire adaptation' ? 'Copied Entire Adaptation!' : 'Copy Entire Adaptation'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdaptationCard