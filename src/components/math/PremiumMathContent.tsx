'use client'

import React, { useRef, useEffect, useMemo, useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Helper function to determine if content is for a math subject
function isMathSubject(subject?: string, gradeLevel?: string): boolean {
  if (!subject) return false;
  
  const subj = subject.toLowerCase().trim();
  const grade = gradeLevel?.toLowerCase().trim() || '';
  
  // Math subjects and keywords
  const mathKeywords = [
    'math', 'mathematics', 'calculus', 'algebra', 'geometry', 
    'trigonometry', 'statistics', 'precalculus', 'pre-calculus',
    'arithmetic', 'number theory', 'discrete math', 'linear algebra'
  ];
  
  const mathGrades = [
    'ap calculus', 'ap statistics', 'ib math', 'honors math'
  ];
  
  const hasSubjectMath = mathKeywords.some(keyword => 
    subj === keyword || subj.includes(keyword)
  );
  
  const hasGradeMath = mathGrades.some(gradeKeyword => grade.includes(gradeKeyword));
  
  return hasSubjectMath || hasGradeMath;
}

interface PremiumMathContentProps {
  /** Content that may contain mathematical expressions */
  content: string
  /** Custom className for the container */
  className?: string
  /** Whether this content is for PDF export */
  forPrint?: boolean
  /** Processing options for mathematical expressions */
  processingOptions?: {
    autoDetectDisplayMode?: boolean
    enhanceFractions?: boolean
    smartSubscripts?: boolean
    professionalSpacing?: boolean
  }
  /** Selected videos to display in the lesson plan */
  selectedVideos?: Array<{
    id: string
    title: string
    channelTitle: string
    thumbnailUrl: string
    url?: string
    durationSeconds: number
  }>
  /** Subject area - if provided, will determine whether to apply math processing */
  subject?: string
  /** Grade level - used with subject to determine math processing */
  gradeLevel?: string
}

/**
 * Premium Mathematical Content Component with Hybrid Caching Approach
 * - Uses KaTeX for textbook-quality math rendering
 * - Implements caching for scalability 
 * - Stable rendering without reversion issues
 */
const PremiumMathContent: React.FC<PremiumMathContentProps> = ({
  content,
  className = '',
  forPrint = false,
  processingOptions = {
    autoDetectDisplayMode: true,
    enhanceFractions: true,
    smartSubscripts: true,
    professionalSpacing: true
  },
  selectedVideos = [],
  subject,
  gradeLevel
}) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [renderingCache] = useState(new Map<string, string>())

  // Cached KaTeX renderer
  const renderMathExpression = (latex: string, displayMode: boolean = false): string => {
    const cacheKey = `${latex}:${displayMode}`
    
    // Check cache first for performance
    if (renderingCache.has(cacheKey)) {
      return renderingCache.get(cacheKey)!
    }

    try {
      const rendered = katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        errorColor: '#dc3545',
        strict: false,
        trust: true,
        macros: {
          "\\times": "\\times",
          "\\cdot": "\\cdot", 
          "\\div": "\\div",
          "\\pm": "\\pm",
          "\\degree": "^{\\circ}",
          "\\pi": "\\pi",
          "\\theta": "\\theta"
        }
      })
      
      // Cache for future use
      renderingCache.set(cacheKey, rendered)
      return rendered
    } catch (error) {
      console.warn('KaTeX rendering error:', error)
      return `<span class="math-error">${latex}</span>`
    }
  }

  // Process content with clean math handling
  const processedContent = useMemo(() => {
    if (!content) return 'No content available'

    const isActualMathSubject = isMathSubject(subject, gradeLevel)
    const hasAnyMathContent = content.includes('\\frac') || content.includes('[math]') || content.includes('[display]') || content.includes('$')
    
    console.log(`📝 Processing content for subject: "${subject}", mathContent: ${hasAnyMathContent}`)
    
    let processed = content
    
    if (isActualMathSubject || hasAnyMathContent) {
      console.log('🧮 Processing math content...')
      
      // Clean problematic patterns
      processed = processed.replace(/\[times\]/g, '\\times')
      processed = processed.replace(/\[display\]\[math\]/g, '[display]')
      processed = processed.replace(/\[\/math\]\[\/display\]/g, '[/display]')
      processed = processed.replace(/\[math\]\[display\]/g, '[display]')
      processed = processed.replace(/\[\/display\]\[\/math\]/g, '[/display]')
      
      // Convert $ delimiters to our tags
      processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, '[display]$1[/display]')
      processed = processed.replace(/\$([^\$]+?)\$/g, '[math]$1[/math]')
      
      // AUTO-DETECT: Wrap standalone LaTeX expressions
      // Handle cases where AI generates raw LaTeX: \frac{2}{3} \times \frac{1}{4}
      
      console.log('🔍 Auto-detection input:', processed.substring(0, 200) + '...')
      
      // Simple pattern: find lines with LaTeX commands that aren't already wrapped
      const lines = processed.split('\n')
      const processedLines = []
      
      for (const line of lines) {
        let processedLine = line
        
        // Skip lines that already have math tags or are HTML
        if (!line.includes('[math]') && !line.includes('[display]') && !line.includes('<')) {
          // Check if line contains LaTeX math expressions (single or double backslashes)
          if (line.includes('\\frac') || line.includes('\frac') || 
              line.includes('\\times') || line.includes('\times') || 
              line.includes('\\cdot') || line.includes('\cdot') || 
              line.includes('\\div') || line.includes('\div')) {
            console.log('🎯 Auto-wrapping line with LaTeX:', line.trim())
            processedLine = '[math]' + line.trim() + '[/math]'
          }
        }
        
        processedLines.push(processedLine)
      }
      
      processed = processedLines.join('\n')
      console.log('🔍 After auto-detection:', processed.substring(0, 200) + '...')
    }
    
    // Standard markdown processing
    processed = processed
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Process bullet lists
    const lines = processed.split('\n')
    const processedLines = []
    let inList = false
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      if (trimmed.match(/^[-*]\s+/)) {
        if (!inList) {
          processedLines.push('<ul>')
          inList = true
        }
        const listContent = trimmed.replace(/^[-*]\s+/, '')
        processedLines.push(`<li>${listContent}</li>`)
      } else {
        if (inList) {
          processedLines.push('</ul>')
          inList = false
        }
        
        if (trimmed === '') {
          processedLines.push('<br>')
        } else if (!trimmed.startsWith('<')) {
          processedLines.push(`<p>${line}</p>`)
        } else {
          processedLines.push(line)
        }
      }
    }
    
    if (inList) {
      processedLines.push('</ul>')
    }
    
    return processedLines.join('\n')
  }, [content, subject, gradeLevel])

  // Stable math rendering with caching
  useEffect(() => {
    if (!contentRef.current) return
    
    const container = contentRef.current
    const isActualMathSubject = isMathSubject(subject, gradeLevel)
    const hasAnyMathContent = processedContent.includes('[math]') || processedContent.includes('[display]')
    
    if (!isActualMathSubject && !hasAnyMathContent) {
      return
    }

    console.log(`🎯 Rendering math for: "${subject}"`)
    console.log('📄 Container innerHTML before processing:', container.innerHTML.substring(0, 200) + '...')
    
    let updatedContent = container.innerHTML
    
    // Render inline math
    const inlineMathMatches = updatedContent.match(/\[math\](.*?)\[\/math\]/g)
    console.log('🔢 Found inline math tags:', inlineMathMatches)
    
    updatedContent = updatedContent.replace(/\[math\](.*?)\[\/math\]/g, (match, latex) => {
      const cleanLatex = latex.trim()
      console.log('🎯 Rendering inline LaTeX:', cleanLatex)
      const rendered = renderMathExpression(cleanLatex, false)
      console.log('✅ Inline rendered result:', rendered.substring(0, 100) + '...')
      return rendered
    })
    
    // Render display math  
    const displayMathMatches = updatedContent.match(/\[display\](.*?)\[\/display\]/g)
    console.log('🔢 Found display math tags:', displayMathMatches)
    
    updatedContent = updatedContent.replace(/\[display\](.*?)\[\/display\]/g, (match, latex) => {
      const cleanLatex = latex.trim()
      console.log('🎯 Rendering display LaTeX:', cleanLatex)
      const rendered = renderMathExpression(cleanLatex, true)
      console.log('✅ Display rendered result:', rendered.substring(0, 100) + '...')
      return `<div class="katex-display">${rendered}</div>`
    })
    
    // Only update if content actually changed
    if (updatedContent !== container.innerHTML) {
      container.innerHTML = updatedContent
      console.log('✅ Math rendered with caching')
      console.log('📄 Final innerHTML:', container.innerHTML.substring(0, 200) + '...')
    } else {
      console.log('⚠️ No changes detected - math rendering skipped')
    }
    
  }, [processedContent, renderMathExpression])

  // Generate container classes
  const containerClasses = [
    'premium-math-content',
    'lesson-plan-content', 
    className,
    forPrint ? 'print-mode' : ''
  ].filter(Boolean).join(' ')

  // Helper function to format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={containerClasses}>
      <div 
        ref={contentRef}
        className="math-content-container"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
      
      {/* Videos Section */}
      {selectedVideos && selectedVideos.length > 0 && (
        <div className="videos-section">
          <h2>📹 Educational Videos</h2>
          <p>The following videos support this lesson:</p>
          <div className="videos-list">
            {selectedVideos.map((video, index) => (
              <div key={video.id} className="video-item">
                <div className="video-header">
                  <span className="video-number">{index + 1}.</span>
                  <strong>{video.title}</strong>
                </div>
                <div className="video-details">
                  <div className="video-meta">
                    <span className="channel">By: {video.channelTitle}</span>
                    <span className="duration">Duration: {formatDuration(video.durationSeconds)}</span>
                  </div>
                  <div className="video-url">
                    URL: {video.url || `https://youtube.com/watch?v=${video.id}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .premium-math-content {
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
          line-height: 1.6;
          color: #374151;
          max-width: none;
        }

        .premium-math-content .math-content-container {
          position: relative;
        }

        .premium-math-content h1,
        .premium-math-content h2, 
        .premium-math-content h3 {
          font-family: 'Century Gothic', 'CenturyGothic', sans-serif;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #111827;
        }

        .premium-math-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        .premium-math-content strong {
          font-weight: 600;
          color: #111827;
        }

        .premium-math-content ul {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }

        .premium-math-content li {
          margin-bottom: 0.25rem;
          line-height: 1.5;
        }

        /* KaTeX math styling */
        .premium-math-content :global(.katex) {
          font-size: inherit !important;
          color: inherit !important;
        }

        .premium-math-content :global(.katex-display) {
          margin: 1.2em 0;
          text-align: center;
        }

        .premium-math-content :global(.math-error) {
          background-color: #fee;
          color: #c53030;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
        }

        /* Videos section */
        .videos-section {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 2px solid #e5e7eb;
        }

        .video-item {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #f9fafb;
          border-left: 4px solid #6366f1;
          border-radius: 0.375rem;
        }

        .video-header {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .video-number {
          font-weight: 600;
          color: #6366f1;
          flex-shrink: 0;
        }

        .video-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.25rem;
          flex-wrap: wrap;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .video-url {
          font-family: monospace;
          font-size: 0.85rem;
          word-break: break-all;
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          margin-top: 0.5rem;
        }

        /* Print styles */
        @media print {
          .premium-math-content {
            color: #000 !important;
            background: #fff !important;
          }
          
          .premium-math-content :global(.katex) {
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  )
}

export default PremiumMathContent