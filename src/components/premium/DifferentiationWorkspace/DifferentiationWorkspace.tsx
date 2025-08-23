import React, { useState, useEffect, useCallback } from 'react'
import DifferentiationMenu from './DifferentiationMenu'
import LiveLessonEditor from './LiveLessonEditor'
import AddReplaceDialog from './AddReplaceDialog'

interface DifferentiationWorkspaceProps {
  activityContent: string
  gradeLevel: string
  subject: string
  topic: string
  activityType: string
  duration: string
  selectedDate: string
  isSubMode: boolean
  emergencyContacts?: string
  techPassword?: string
  onClose: () => void
}

interface DifferentiationData {
  below_grade?: any
  at_grade?: any
  above_grade?: any
  esl_adaptations?: any
  iep_adaptations?: any
}

interface DifferentiationAddition {
  id: string
  type: string
  title: string
  content: string
  section: 'materials' | 'instructions' | 'objectives' | 'general'
  placement: 'add' | 'replace'
  timestamp: number
}

interface PendingAddition {
  type: string
  title: string
  data: any
}

const DifferentiationWorkspace: React.FC<DifferentiationWorkspaceProps> = ({
  activityContent,
  gradeLevel,
  subject,
  topic,
  activityType,
  duration,
  selectedDate,
  isSubMode,
  emergencyContacts,
  techPassword,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [differentiationData, setDifferentiationData] = useState<DifferentiationData>({})
  const [requestedTypes, setRequestedTypes] = useState<string[]>([])
  const [gradeContext, setGradeContext] = useState<any>({})
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false)
  
  // Addition management
  const [additions, setAdditions] = useState<DifferentiationAddition[]>([])
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  const [lastActionId, setLastActionId] = useState<string | null>(null)
  
  // Dialog state
  const [showDialog, setShowDialog] = useState(false)
  const [pendingAddition, setPendingAddition] = useState<PendingAddition | null>(null)

  // Load differentiation data on mount
  useEffect(() => {
    loadDifferentiation()
  }, [])

  const loadDifferentiation = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🎯 Loading differentiation workspace...')
      
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
      
      if (result.success) {
        console.log('✅ Differentiation data loaded successfully')
        setDifferentiationData(result.differentiationData)
        setRequestedTypes(result.requestedTypes || [])
        setGradeContext(result.gradeContext || {})
      } else {
        throw new Error(result.error || 'Failed to load differentiation data')
      }
    } catch (error) {
      console.error('❌ Failed to load differentiation:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = useCallback((type: string, data: any) => {
    setPendingAddition({ type, title: data.title, data })
    setShowDialog(true)
  }, [])

  const handleConfirmAdd = useCallback((placement: 'add' | 'replace') => {
    if (!pendingAddition) return

    const id = `${pendingAddition.type}_${Date.now()}`
    const content = formatAdditionContent(pendingAddition.data, pendingAddition.type)
    
    const addition: DifferentiationAddition = {
      id,
      type: pendingAddition.type,
      title: pendingAddition.title,
      content,
      section: determineSection(pendingAddition.type),
      placement,
      timestamp: Date.now()
    }

    setAdditions(prev => [...prev, addition])
    setAddedItems(prev => new Set([...prev, pendingAddition.type]))
    setLastActionId(id)
    
    setShowDialog(false)
    setPendingAddition(null)

    console.log(`✅ Added ${pendingAddition.type} as ${placement}`)
  }, [pendingAddition])

  const handleRemoveItem = useCallback((type: string) => {
    setAdditions(prev => prev.filter(add => add.type !== type))
    setAddedItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(type)
      return newSet
    })
    console.log(`🗑️ Removed ${type}`)
  }, [])

  const handleRemoveAddition = useCallback((id: string) => {
    const addition = additions.find(add => add.id === id)
    if (addition) {
      setAdditions(prev => prev.filter(add => add.id !== id))
      
      // If this was the only addition of this type, remove from addedItems
      const remainingOfType = additions.filter(add => add.type === addition.type && add.id !== id)
      if (remainingOfType.length === 0) {
        setAddedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(addition.type)
          return newSet
        })
      }
    }
  }, [additions])

  const formatAdditionContent = (data: any, type: string): string => {
    let content = ''
    
    if (type === 'esl_adaptations') {
      if (data.vocabulary_support?.length) {
        content += '<strong>📖 Vocabulary Support:</strong><br>'
        content += data.vocabulary_support.map((item: string) => `• ${item}`).join('<br>') + '<br><br>'
      }
      if (data.visual_aids?.length) {
        content += '<strong>🖼️ Visual Aids:</strong><br>'
        content += data.visual_aids.map((item: string) => `• ${item}`).join('<br>') + '<br><br>'
      }
      if (data.language_scaffolds?.length) {
        content += '<strong>🏗️ Language Scaffolds:</strong><br>'
        content += data.language_scaffolds.map((item: string) => `• ${item}`).join('<br>')
      }
    } else if (type === 'iep_adaptations') {
      if (data.behavioral_supports?.length) {
        content += '<strong>🎭 Behavioral Supports:</strong><br>'
        content += data.behavioral_supports.map((item: string) => `• ${item}`).join('<br>') + '<br><br>'
      }
      if (data.sensory_accommodations?.length) {
        content += '<strong>👂 Sensory Accommodations:</strong><br>'
        content += data.sensory_accommodations.map((item: string) => `• ${item}`).join('<br>') + '<br><br>'
      }
      if (data.cognitive_modifications?.length) {
        content += '<strong>🧠 Cognitive Modifications:</strong><br>'
        content += data.cognitive_modifications.map((item: string) => `• ${item}`).join('<br>')
      }
    } else {
      // Grade level adaptations
      if (data.talk_track?.length) {
        content += '<strong>💬 Teacher Talk Track:</strong><br>'
        content += data.talk_track.map((item: string) => `• "${item}"`).join('<br>') + '<br><br>'
      }
      if (data.instructions?.length) {
        content += '<strong>📋 Modified Instructions:</strong><br>'
        content += data.instructions.map((item: string) => `• ${item}`).join('<br>') + '<br><br>'
      }
      if (data.modifications?.length) {
        content += '<strong>🔧 Key Modifications:</strong><br>'
        content += data.modifications.map((item: string) => `• ${item}`).join('<br>') + '<br><br>'
      }
      if (data.materials_changes?.length) {
        content += '<strong>📦 Materials Changes:</strong><br>'
        content += data.materials_changes.map((item: string) => `• ${item}`).join('<br>')
      }
    }
    
    return content
  }

  const determineSection = (type: string): 'materials' | 'instructions' | 'objectives' | 'general' => {
    if (type.includes('materials')) return 'materials'
    if (type.includes('instructions') || type.includes('grade')) return 'instructions'
    if (type.includes('objectives')) return 'objectives'
    return 'general'
  }

  const generatePrintContent = () => {
    // Process activity content to add video URLs
    const processedActivity = processActivityContentForPrint(activityContent)
    
    // Escape content properly for HTML
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }

    const safeGradeLevel = escapeHtml(gradeLevel)
    const safeSubject = escapeHtml(subject)
    const safeTopic = escapeHtml(topic)
    const safeDuration = escapeHtml(duration)
    const safeSelectedDate = escapeHtml(selectedDate)
    const safeEmergencyContacts = emergencyContacts ? escapeHtml(emergencyContacts) : ''
    const safeTechPassword = techPassword ? escapeHtml(techPassword) : ''

    return `
      <div style="margin-bottom: 24px; border-bottom: 2px solid #000; padding-bottom: 16px; text-align: center;">
        <h1 style="margin: 0 0 8px 0; font-size: 20pt;">${isSubMode ? 'Substitute Activity Plan' : 'Lesson Activity Plan'}</h1>
        <div style="font-size: 14pt; margin-bottom: 8px;">
          <strong>Grade:</strong> ${safeGradeLevel} | <strong>Subject:</strong> ${safeSubject} | <strong>Topic:</strong> ${safeTopic}
        </div>
        <div style="font-size: 12pt;">
          <strong>Duration:</strong> ${safeDuration} minutes | <strong>Date:</strong> ${safeSelectedDate}
        </div>
      </div>
      
      ${isSubMode && (emergencyContacts || techPassword) ? `
        <div style="margin-bottom: 24px; padding: 16px; border: 2px solid #000;">
          <h3 style="margin: 0 0 12px 0; font-size: 14pt;">🚨 EMERGENCY INFORMATION</h3>
          <div style="padding: 12px; border: 1px solid #000;">
            ${emergencyContacts ? `<p style="margin: 0 0 8px 0; font-weight: bold;">${safeEmergencyContacts}</p>` : ''}
            ${techPassword ? `<p style="margin: 0; font-weight: bold;"><strong>Technology Password:</strong> ${safeTechPassword}</p>` : ''}
          </div>
        </div>
      ` : ''}
      
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16pt; border-bottom: 2px solid #000; padding-bottom: 8px;">Complete Activity Details</h3>
        <div style="border: 1px solid #000; padding: 16px;">
          ${processedActivity}
        </div>
      </div>
      
      ${additions.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16pt; border-bottom: 2px solid #000; padding-bottom: 8px;">Differentiation Adaptations</h3>
          ${additions.map(addition => {
            const safeTitle = escapeHtml(addition.title)
            const safeContent = addition.content // Already formatted as HTML
            const safeSection = escapeHtml(addition.section)
            const timestamp = new Date(addition.timestamp).toLocaleTimeString()
            
            return `
              <div style="border: 1px solid #666; background: #f9f9f9; margin: 12px 0; padding: 12px; page-break-inside: avoid;">
                <h4 style="margin: 0 0 8px 0; font-size: 13pt; font-weight: bold;">${safeTitle}</h4>
                <div style="margin: 0 0 8px 0;">${safeContent}</div>
                <div style="font-size: 10pt; color: #666; border-top: 1px solid #ccc; padding-top: 8px;">
                  Added to ${safeSection} • ${timestamp}
                </div>
              </div>
            `
          }).join('')}
        </div>
        
        <div style="margin-top: 32px; padding: 16px; background: #f0f0f0; border: 1px solid #ccc;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">✨ Differentiation Summary</h4>
          <p style="margin: 0 0 8px 0;"><strong>${additions.length}</strong> differentiation(s) added to this lesson</p>
          <div style="margin-top: 8px;">
            ${additions.map(addition => {
              const safeTitle = escapeHtml(addition.title)
              return `<span style="display: inline-block; background: #ddd; color: #333; padding: 4px 8px; margin: 2px; border-radius: 12px; font-size: 10pt;">${safeTitle}</span>`
            }).join('')}
          </div>
        </div>
      ` : ''}
    `
  }

  const processActivityContentForPrint = (content: string) => {
    let processed = content
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Activity names
      .replace(/ACTIVITY NAME: (.*?)(?=\n|$)/gi, '<div style="background: #f0f8ff; border: 2px solid #0066cc; padding: 12px; margin: 16px 0; text-align: center; font-size: 14pt; font-weight: bold;">🎯 ACTIVITY: $1</div>')
      .replace(/Activity Name: (.*?)(?=\n|$)/gi, '<div style="background: #f0f8ff; border: 2px solid #0066cc; padding: 12px; margin: 16px 0; text-align: center; font-size: 14pt; font-weight: bold;">🎯 ACTIVITY: $1</div>')
      .replace(/^\*\*([^*]+ACTIVITY[^*]*)\*\*$/gm, '<div style="background: #f0f8ff; border: 2px solid #0066cc; padding: 12px; margin: 16px 0; text-align: center; font-size: 14pt; font-weight: bold;">🎯 $1</div>')
      // Video URLs - Convert video mentions to include URLs
      .replace(/(watch|view|see)\s+(.*?video.*?)(?=\.|\n|$)/gi, (match, action, videoText) => {
        const shortUrl = generateVideoUrl(videoText)
        return `${action} ${videoText} (${shortUrl})`
      })
      // Video links pattern
      .replace(/\[([^\]]+video[^\]]+)\]\(([^)]+)\)/gi, (match, text, url) => {
        const shortUrl = shortenUrl(url)
        return `${text} (${shortUrl})`
      })
      // Generic video mentions
      .replace(/(video|Video)([^.\n]*)/g, (match, videoWord, rest) => {
        if (rest.includes('http')) return match // Already has URL
        const shortUrl = generateVideoUrl(`${videoWord}${rest}`)
        return `${videoWord}${rest} (${shortUrl})`
      })
    
    // Convert to HTML structure
    return processed.split('\n').map(line => {
      const trimmed = line.trim()
      if (trimmed === '') return '<br>'
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return '<li style="margin-bottom: 4px;">' + trimmed.substring(2) + '</li>'
      }
      if (trimmed.match(/^#+\s/)) {
        const level = trimmed.match(/^#+/)?.[0]?.length || 1
        const text = trimmed.replace(/^#+\s/, '')
        return `<h${Math.min(level + 1, 6)} style="margin: 16px 0 8px 0; font-weight: bold; page-break-after: avoid;">${text}</h${Math.min(level + 1, 6)}>`
      }
      return '<p style="margin: 8px 0;">' + line + '</p>'
    }).join('')
  }

  const generateVideoUrl = (videoDescription: string) => {
    // Generate relevant short URLs based on video content
    const description = videoDescription.toLowerCase()
    
    if (description.includes('solar') || description.includes('planet')) {
      return 'bit.ly/solar-system-101'
    }
    if (description.includes('math') || description.includes('calculator')) {
      return 'bit.ly/math-basics-vid'
    }
    if (description.includes('science') || description.includes('experiment')) {
      return 'bit.ly/science-demo'
    }
    if (description.includes('reading') || description.includes('literature')) {
      return 'bit.ly/reading-guide'
    }
    if (description.includes('history') || description.includes('social')) {
      return 'bit.ly/history-lesson'
    }
    
    // Default educational video URL
    return 'bit.ly/edu-video-' + Math.random().toString(36).substr(2, 3)
  }

  const shortenUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1]
      return videoId ? `youtu.be/${videoId}` : 'bit.ly/yt-' + Math.random().toString(36).substr(2, 3)
    }
    if (url.includes('vimeo.com')) {
      return 'vimeo.com/' + url.split('/').pop()
    }
    
    // Generate a shortened version
    const domain = url.split('/')[2] || 'link'
    return `${domain.replace('www.', '')}/` + Math.random().toString(36).substr(2, 4)
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4 animate-spin">⚙️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Generating Smart Adaptations...
          </h3>
          <p className="text-gray-600 max-w-md">
            Creating differentiated content based on {gradeLevel} level. This usually takes 15-25 seconds.
          </p>
          <div className="mt-4 w-64 bg-gray-200 rounded-full h-2 mx-auto">
            <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-900 mb-2">
            Generation Failed
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button
              onClick={loadDifferentiation}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Print-Only Content - Hidden Div for Print */}
      <div id="print-only-content" style={{ display: 'none' }}>
        <div style={{ 
          fontFamily: 'Arial, sans-serif',
          fontSize: '12pt',
          lineHeight: '1.5',
          color: 'black',
          padding: '20px',
          maxWidth: '8.5in',
          margin: '0 auto'
        }}>
          {/* Create a clean print version here */}
          <div dangerouslySetInnerHTML={{ 
            __html: generatePrintContent()
          }} />
        </div>
      </div>

      {/* Print Styles - Simple and Direct */}
      <style jsx global>{`
        @media print {
          /* Hide everything */
          body > * {
            display: none !important;
          }
          
          /* Show only the print content */
          #print-only-content {
            display: block !important;
          }
          
          /* Reset body */
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Typography for print */
          #print-only-content h1, 
          #print-only-content h2, 
          #print-only-content h3, 
          #print-only-content h4 {
            page-break-after: avoid !important;
            color: black !important;
          }
          
          #print-only-content p, 
          #print-only-content li, 
          #print-only-content div {
            color: black !important;
          }
          
          /* Page breaks */
          .page-break-avoid {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Main Split-Screen Interface */}
      <div className="fixed inset-0 bg-white z-40 flex">
        
        {/* Left Panel - Differentiation Menu */}
        <div className="differentiation-menu">
          <DifferentiationMenu
            data={differentiationData}
            requestedTypes={requestedTypes}
            gradeContext={gradeContext}
            addedItems={addedItems}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            isCollapsed={isMenuCollapsed}
            onToggleCollapse={() => setIsMenuCollapsed(!isMenuCollapsed)}
          />
        </div>

        {/* Right Panel - Live Lesson Editor */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="workspace-header bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">
                🎯 Differentiation Workspace
              </h2>
              <p className="text-purple-100 text-sm">
                {topic} - {gradeLevel} {subject} • {additions.length} adaptations added
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.print()}
                className="bg-white/30 hover:bg-white/40 backdrop-blur-sm text-white border border-white/20 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-sm"
                title="Print lesson plan"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                </svg>
                <span>Print</span>
              </button>
              <button
                onClick={() => {
                  // Share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: 'Differentiated Lesson Plan',
                      text: `${topic} - ${gradeLevel} ${subject}`
                    })
                  }
                }}
                className="bg-white/30 hover:bg-white/40 backdrop-blur-sm text-white border border-white/20 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-sm"
                title="Share lesson plan"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                </svg>
                <span>Share</span>
              </button>
              <button
                onClick={onClose}
                className="bg-white/30 hover:bg-white/40 backdrop-blur-sm text-white border border-white/20 w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:bg-red-500/20 group"
                title="Close differentiation workspace"
              >
                <svg className="w-5 h-5 group-hover:text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="print-content">
            <LiveLessonEditor
              originalActivity={activityContent}
              gradeLevel={gradeLevel}
              subject={subject}
              topic={topic}
              duration={duration}
              selectedDate={selectedDate}
              isSubMode={isSubMode}
              emergencyContacts={emergencyContacts}
              techPassword={techPassword}
              additions={additions}
              onRemoveAddition={handleRemoveAddition}
              lastActionId={lastActionId || undefined}
            />
          </div>
        </div>
      </div>

      {/* Add/Replace Dialog */}
      <AddReplaceDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false)
          setPendingAddition(null)
        }}
        onAdd={() => handleConfirmAdd('add')}
        onReplace={() => handleConfirmAdd('replace')}
        itemTitle={pendingAddition?.title || ''}
        itemType={pendingAddition?.type as any}
      />
    </>
  )
}

export default DifferentiationWorkspace