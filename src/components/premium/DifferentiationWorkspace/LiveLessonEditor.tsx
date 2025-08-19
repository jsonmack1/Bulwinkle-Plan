import React, { useState, useEffect } from 'react'

interface DifferentiationAddition {
  id: string
  type: string
  title: string
  content: string
  section: 'materials' | 'instructions' | 'objectives' | 'general'
  placement: 'add' | 'replace'
  timestamp: number
}

interface LiveLessonEditorProps {
  originalActivity: string
  gradeLevel: string
  subject: string
  topic: string
  duration: string
  selectedDate: string
  isSubMode: boolean
  emergencyContacts?: string
  techPassword?: string
  additions: DifferentiationAddition[]
  onRemoveAddition: (id: string) => void
  lastActionId?: string // For highlighting new additions
}

const LiveLessonEditor: React.FC<LiveLessonEditorProps> = ({
  originalActivity,
  gradeLevel,
  subject,
  topic,
  duration,
  selectedDate,
  isSubMode,
  emergencyContacts,
  techPassword,
  additions,
  onRemoveAddition,
  lastActionId
}) => {
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  useEffect(() => {
    if (lastActionId) {
      setHighlightedId(lastActionId)
      const timer = setTimeout(() => setHighlightedId(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [lastActionId])

  const renderDifferentiationAddition = (addition: DifferentiationAddition) => {
    const isHighlighted = highlightedId === addition.id
    
    return (
      <div
        key={addition.id}
        className={`differentiation-addition border rounded-lg p-4 my-4 transition-all duration-500 ${
          isHighlighted 
            ? 'border-green-400 bg-green-50 shadow-md' 
            : 'border-purple-200 bg-purple-50'
        } relative group`}
      >
        {/* Remove Button */}
        <button
          onClick={() => onRemoveAddition(addition.id)}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 z-10"
          title="Remove this adaptation"
        >
          ×
        </button>

        {/* Addition Header */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-purple-800 text-sm flex items-center">
            <span className="mr-2">✨</span>
            {addition.title}
            <span className="ml-2 bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full text-xs">
              {addition.placement === 'add' ? 'Added' : 'Replaced'}
            </span>
          </h4>
          {isHighlighted && (
            <div className="flex items-center text-green-600 text-sm">
              <span className="mr-1">🎉</span>
              <span className="font-medium">Just Added!</span>
            </div>
          )}
        </div>

        {/* Addition Content */}
        <div className="prose prose-sm max-w-none">
          <div 
            className="text-gray-800"
            dangerouslySetInnerHTML={{
              __html: addition.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>')
            }}
          />
        </div>

        {/* Addition Meta */}
        <div className="mt-2 pt-2 border-t border-purple-200 text-xs text-purple-600">
          Added to {addition.section} • {new Date(addition.timestamp).toLocaleTimeString()}
        </div>
      </div>
    )
  }

  const insertAdditions = (content: string, section: 'materials' | 'instructions' | 'objectives' | 'general') => {
    const sectionAdditions = additions.filter(add => add.section === section)
    if (sectionAdditions.length === 0) return content

    let modifiedContent = content
    
    // Insert additions at the end of the section
    sectionAdditions.forEach(addition => {
      modifiedContent += '\n\n' + renderDifferentiationAddition(addition)
    })

    return modifiedContent
  }

  const processLessonContent = () => {
    // Parse the original activity into sections
    const sections = {
      emergency: '',
      header: '',
      materials: '',
      objectives: '',
      mainContent: '',
      footer: ''
    }

    // Emergency section for substitute mode
    if (isSubMode && (emergencyContacts || techPassword)) {
      sections.emergency = `
        <div class="mb-6 p-4 border-2 border-black no-break">
          <h3 class="text-lg font-bold mb-3">🚨 EMERGENCY INFORMATION</h3>
          <div class="p-3 border border-black">
            ${emergencyContacts ? `<p class="font-medium">${emergencyContacts}</p>` : ''}
            ${techPassword ? `<p class="font-medium mt-2"><strong>Technology Password:</strong> ${techPassword}</p>` : ''}
          </div>
        </div>
      `
    }

    // Header section
    sections.header = `
      <div class="mb-6 border-b-2 border-gray-300 pb-4">
        <h1 class="text-2xl font-bold text-center mb-2">
          ${isSubMode ? 'Substitute Activity Plan' : 'Lesson Activity Plan'}
        </h1>
        <div class="text-center text-lg">
          <strong>Grade:</strong> ${gradeLevel} | <strong>Subject:</strong> ${subject} | <strong>Topic:</strong> ${topic}
        </div>
        <div class="text-center">
          <strong>Duration:</strong> ${duration} minutes | <strong>Date:</strong> ${new Date(selectedDate).toLocaleDateString()}
        </div>
      </div>
    `

    // Process main content and identify sections
    let processedContent = originalActivity
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/ACTIVITY NAME: (.*?)(?=\n|$)/gi, '<div class="activity-name">🎯 ACTIVITY: $1</div>')
      .replace(/Activity Name: (.*?)(?=\n|$)/gi, '<div class="activity-name">🎯 ACTIVITY: $1</div>')
      .replace(/^\*\*([^*]+ACTIVITY[^*]*)\*\*$/gm, '<div class="activity-name">🎯 $1</div>')

    sections.mainContent = processedContent

    return sections
  }

  const sections = processLessonContent()

  return (
    <div className="flex-1 bg-white overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 print-lesson-content">
        
        {/* Header */}
        <div dangerouslySetInnerHTML={{ __html: sections.header }} />
        
        {/* Emergency Information */}
        {sections.emergency && (
          <div dangerouslySetInnerHTML={{ __html: sections.emergency }} />
        )}

        {/* Differentiation Additions - General */}
        {additions.filter(add => add.section === 'general').map(renderDifferentiationAddition)}

        {/* Main Activity Content */}
        <div className="mb-6 no-break">
          <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
            Complete Activity Details
          </h3>
          <div className="border rounded p-4">
            <div className="prose max-w-none">
              <div 
                className="whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sections.mainContent }}
              />
            </div>
          </div>
        </div>

        {/* Differentiation Additions - Materials */}
        {additions.filter(add => add.section === 'materials').map(renderDifferentiationAddition)}

        {/* Differentiation Additions - Instructions */}
        {additions.filter(add => add.section === 'instructions').map(renderDifferentiationAddition)}

        {/* Differentiation Additions - Objectives */}
        {additions.filter(add => add.section === 'objectives').map(renderDifferentiationAddition)}

        {/* Summary Section */}
        {additions.length > 0 && (
          <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
              <span className="mr-2">✨</span>
              Differentiation Summary
            </h4>
            <div className="text-sm text-purple-700 space-y-1">
              <p><strong>{additions.length}</strong> differentiation(s) added to this lesson</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {additions.map(addition => (
                  <span
                    key={addition.id}
                    className="bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-xs"
                  >
                    {addition.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Print-friendly styling */}
        <style jsx>{`
          @media print {
            /* Ensure the lesson content container is fully visible */
            .print-lesson-content {
              display: block !important;
              visibility: visible !important;
              position: static !important;
              overflow: visible !important;
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
              color: black !important;
            }
            
            /* Make all content within the lesson editor visible */
            .print-lesson-content,
            .print-lesson-content *,
            .print-lesson-content div,
            .print-lesson-content h1,
            .print-lesson-content h2,
            .print-lesson-content h3,
            .print-lesson-content h4,
            .print-lesson-content p,
            .print-lesson-content ul,
            .print-lesson-content li,
            .print-lesson-content strong {
              visibility: visible !important;
              display: block !important;
              color: black !important;
            }
            
            /* Inline elements */
            .print-lesson-content span,
            .print-lesson-content strong,
            .print-lesson-content em {
              display: inline !important;
            }
            
            /* List elements */
            .print-lesson-content ul,
            .print-lesson-content ol {
              display: block !important;
              list-style: disc !important;
              padding-left: 20px !important;
            }
            
            .print-lesson-content li {
              display: list-item !important;
              margin-bottom: 4px !important;
            }
            
            /* Hide all interactive elements */
            .group button { display: none !important; }
            .hover\\:bg-red-100 { display: none !important; }
            
            /* Clean color scheme for print */
            .border-purple-200 { border-color: #666 !important; }
            .bg-purple-50 { background-color: #f8f9fa !important; }
            .bg-gradient-to-r { background: #f0f0f0 !important; }
            .text-purple-800, .text-purple-700, .text-purple-600 { color: #000 !important; }
            
            /* Activity name styling */
            .activity-name {
              background-color: #f0f8ff !important;
              border: 2px solid #4a90e2 !important;
              border-radius: 8px !important;
              padding: 12px !important;
              margin: 16px 0 !important;
              text-align: center !important;
              font-size: 1.2em !important;
              font-weight: bold !important;
              page-break-inside: avoid !important;
              display: block !important;
              visibility: visible !important;
            }
            
            /* Differentiation addition styling */
            .differentiation-addition {
              border: 1px solid #ccc !important;
              background: #f9f9f9 !important;
              margin: 10px 0 !important;
              padding: 10px !important;
              border-radius: 4px !important;
              page-break-inside: avoid !important;
              display: block !important;
              visibility: visible !important;
            }
            
            /* Remove button containers */
            .absolute { display: none !important; }
            
            /* Ensure proper spacing */
            .mb-6 { margin-bottom: 24px !important; }
            .mt-8 { margin-top: 32px !important; }
            .p-4 { padding: 16px !important; }
            
            /* Typography improvements */
            .print-lesson-content h1 { font-size: 18pt !important; margin-bottom: 12pt !important; }
            .print-lesson-content h2 { font-size: 16pt !important; margin-bottom: 10pt !important; }
            .print-lesson-content h3 { font-size: 14pt !important; margin-bottom: 8pt !important; }
            .print-lesson-content h4 { font-size: 12pt !important; margin-bottom: 6pt !important; }
            
            .print-lesson-content p {
              margin-bottom: 8px !important;
            }
            
            /* Proper page breaks */
            .no-break { page-break-inside: avoid !important; }
            
            /* Clean borders */
            .border { border: 1px solid #ccc !important; }
            .border-2 { border: 2px solid #666 !important; }
            .border-b-2 { border-bottom: 2px solid #666 !important; }
          }
        `}</style>
      </div>
    </div>
  )
}

export default LiveLessonEditor