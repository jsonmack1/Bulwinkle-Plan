'use client'

import React, { useRef, useEffect, useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import ProfessionalMathProcessor from '../../utils/professionalMathProcessor'

// Helper function to determine if content is for a math subject
function isMathSubject(subject?: string, gradeLevel?: string): boolean {
  if (!subject) return false;
  
  const subj = subject.toLowerCase().trim();
  const grade = gradeLevel?.toLowerCase().trim() || '';
  
  // First, explicitly exclude non-math subjects - EXPANDED LIST
  const nonMathSubjects = [
    'english', 'ela', 'language arts', 'literature', 'reading', 'writing',
    'science', 'biology', 'chemistry', 'physics', 'earth science', 'environmental science',
    'social studies', 'history', 'geography', 'civics', 'government', 'world history', 'us history', 'american history',
    'art', 'music', 'pe', 'physical education', 'health', 'wellness',
    'advisory', 'sel', 'social emotional', 'counseling', 'guidance',
    'foreign language', 'spanish', 'french', 'german', 'chinese', 'japanese', 'latin',
    'computer science', 'technology', 'engineering', 'programming', 'coding',
    'business', 'economics', 'psychology', 'philosophy', 'sociology',
    'drama', 'theater', 'theatre', 'band', 'choir', 'orchestra',
    'culinary', 'cooking', 'woodshop', 'auto', 'automotive'
  ];
  
  // Check for partial matches in subject names (more comprehensive)
  const isNonMathSubject = nonMathSubjects.some(nonMath => 
    subj.includes(nonMath) || nonMath.includes(subj) || subj === nonMath
  );
  if (isNonMathSubject) return false;
  
  // STEM subjects that might contain math but aren't pure math should be excluded
  const stemNonMath = ['stem', 'steam', 'robotics', 'engineering', 'computer', 'technology'];
  const isStemNonMath = stemNonMath.some(stem => subj.includes(stem));
  if (isStemNonMath) return false;
  
  // Only allow explicitly mathematical subjects
  const mathKeywords = [
    'math', 'mathematics', 'calculus', 'algebra', 'geometry', 
    'trigonometry', 'statistics', 'precalculus', 'pre-calculus',
    'arithmetic', 'number theory', 'discrete math', 'linear algebra',
    'differential equations', 'integral calculus', 'finite math'
  ];
  
  const mathGrades = [
    'ap calculus', 'ap statistics', 'ib math', 'honors math'
  ];
  
  // Check subject name - must be an EXACT or very close match
  const hasSubjectMath = mathKeywords.some(keyword => 
    subj === keyword || 
    subj === keyword + 's' || 
    subj.startsWith(keyword + ' ') || 
    subj.endsWith(' ' + keyword) ||
    (keyword === 'math' && (subj === 'mathematics' || subj === 'maths'))
  );
  
  // Check grade level
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
 * Premium Mathematical Content Component
 * Clean professional math rendering with KaTeX
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

  // Process content with professional mathematical notation and markdown
  const processedContent = useMemo(() => {
    if (!content) return 'No content available'

    // Check if this is actually a math subject
    const isActualMathSubject = isMathSubject(subject, gradeLevel)
    console.log(`📝 Processing content for subject: ${subject}, grade: ${gradeLevel}, isMath: ${isActualMathSubject}`)
    
    let processed = content
    
    // Only apply mathematical processing if this is actually a math subject
    if (isActualMathSubject) {
      console.log('🧮 Starting math-specific processing...')
      
      // STEP 1: Handle standard LaTeX delimiters before cleaning
      processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, '[display]$1[/display]');
      processed = processed.replace(/\$([^\$]+?)\$/g, '[math]$1[/math]');
      
      // STEP 2: Clean any existing math tags to start fresh
      processed = processed.replace(/\[math\]|\[\/math\]|\[display\]|\[\/display\]/g, '')
      console.log('🧹 Cleaned existing math tags')
      
      // STEP 3: Handle LaTeX fractions - wrap them properly
      processed = processed.replace(/\\frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, (match, num, den) => {
        const result = '[math]\\frac{' + num + '}{' + den + '}[/math]'
        console.log('🔄 Wrapping fraction:', match, '→', result)
        return result
      })
      
      // STEP 4: Handle Greek letters
      const greekLetters = ['\\\\theta', '\\\\pi', '\\\\alpha', '\\\\beta', '\\\\gamma', '\\\\delta', '\\\\phi', '\\\\omega']
      greekLetters.forEach(letter => {
        const pattern = new RegExp(letter + '\\\\b', 'g')
        processed = processed.replace(pattern, (match) => {
          const result = '[math]' + match + '[/math]'
          console.log('🔄 Wrapping Greek letter:', match, '→', result)
          return result
        })
      })
      
      // STEP 5: Handle degree symbols
      processed = processed.replace(/(\d+)°/g, '[math]$1^{\\circ}[/math]')
      
      // STEP 6: Handle other math symbols and advanced patterns
      processed = processed.replace(/\\sin|\\cos|\\tan|\\sqrt\{[^}]+\}/g, (match) => {
        return '[math]' + match + '[/math]'
      })
      
      // STEP 7: Wrap additional math patterns
      processed = processed.replace(/\\int|\\sum|\\prod|\\lim/g, (match) => '[math]' + match + '[/math]');
      processed = processed.replace(/\\begin\{(matrix|pmatrix|bmatrix|cases|aligned|gather)\}([\s\S]*?)\\end\{\1\}/g, '[display]$0[/display]');

      console.log('📝 Content after math wrapping:', processed.substring(0, 200))

      // Process with professional math processor AFTER our initial wrapping
      processed = ProfessionalMathProcessor.processContent(processed, processingOptions)
      console.log('📝 Content after ProfessionalMathProcessor:', processed.substring(0, 200))
    } else {
      console.log('📝 Skipping math processing for non-math subject')
      
      // For non-math subjects, remove any unwanted math notation
      processed = processed.replace(/\\frac\{[^{}]*\}\{[^{}]*\}/g, '') // Remove fractions
      processed = processed.replace(/\\[a-zA-Z]+\{[^}]*\}/g, '') // Remove LaTeX commands
      processed = processed.replace(/\\[a-zA-Z]+/g, '') // Remove single LaTeX commands
      processed = processed.replace(/\[math\][\s\S]*?\[\/math\]/g, '') // Remove [math] tags and content
      processed = processed.replace(/\[display\][\s\S]*?\[\/display\]/g, '') // Remove [display] tags and content
      
      // Clean up any double spaces or empty lines that might result
      processed = processed.replace(/\s{2,}/g, ' ')
      processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n')
    }

    // Process activity names first (before headers)
    processed = processed
      .replace(/ACTIVITY NAME: (.*?)(?=\n|$)/gi, '<div class="activity-name-header">🎯 ACTIVITY: $1</div>')
      .replace(/Activity Name: (.*?)(?=\n|$)/gi, '<div class="activity-name-header">🎯 ACTIVITY: $1</div>')
      .replace(/^\*\*([^*]+ACTIVITY[^*]*)\*\*$/gm, '<div class="activity-name-header">🎯 $1</div>')

    // Convert headers (### ## #)
    processed = processed.replace(/^### (.*$)/gm, '<h3>$1</h3>')
    processed = processed.replace(/^## (.*$)/gm, '<h2>$1</h2>')
    processed = processed.replace(/^# (.*$)/gm, '<h1>$1</h1>')

    // Enhance EXIT TICKET sections with prominent styling BEFORE converting bold
    processed = processed.replace(
      /\*\*(EXIT TICKET[^*]*)\*\*/gi,
      '<div class="exit-ticket-section">' +
      '<div class="exit-ticket-header">' +
      '<span class="exit-ticket-icon">🎯</span>' +
      '<strong>$1</strong>' +
      '</div>' +
      '</div>'
    )
    
    // Also catch variations like "Exit Ticket & Assessment", "Quick Exit Ticket", etc.
    processed = processed.replace(
      /\*\*((?:Exit Ticket|Quick Exit Ticket)[^*]*)\*\*/gi,
      '<div class="exit-ticket-section">' +
      '<div class="exit-ticket-header">' +
      '<span class="exit-ticket-icon">🎯</span>' +
      '<strong>$1</strong>' +
      '</div>' +
      '</div>'
    )

    // Convert section headers (bold text that appears to be headers) to proper headers
    // Look for **text** that appears on its own line or starts with common section words
    processed = processed.replace(/^\*\*([^*]+)\*\*$/gm, (match, content) => {
      const text = content.trim();
      const isLikelySectionHeader = /^(Learning Objectives?|Materials?|Instructions?|Procedures?|Activities?|Assessment|Evaluation|Differentiation|Extensions?|Vocabulary|Standards?|Tips?|Notes?|Phase \d+|Step \d+|Part \d+)/i.test(text) ||
        text.length < 50; // Short bold text is likely a header
      
      if (isLikelySectionHeader) {
        return `\n\n<strong class="section-header">${text}</strong>`;
      } else {
        return `<strong>${text}</strong>`;
      }
    });

    // Convert remaining inline markdown bold to HTML - add extra spacing for section headers
    let firstSectionHeader = true;
    processed = processed.replace(/\*\*(.*?)\*\*/g, (match, content) => {
      const text = content.trim();
      // Check if this looks like a section header
      const isLikelySectionHeader = /^(Learning Objectives?|Materials?|Instructions?|Procedures?|Activities?|Assessment|Evaluation|Differentiation|Extensions?|Vocabulary|Standards?|Tips?|Notes?|Phase \d+|Step \d+|Part \d+)/i.test(text) ||
        text.length < 50; // Short bold text is likely a header
      
      // Check if this is EXIT TICKET section
      const isExitTicket = /EXIT TICKET|Exit Ticket/i.test(text);
      
      if (isLikelySectionHeader) {
        if (firstSectionHeader) {
          firstSectionHeader = false;
          return `<strong>${content}</strong>`;
        } else if (isExitTicket) {
          return `<br><br><br><br><br><br><strong>${content}</strong>`;
        } else {
          return `<br><br><br><br><strong>${content}</strong>`;
        }
      } else {
        return `<strong>${content}</strong>`;
      }
    })

    // Process bullet lists and paragraphs more intelligently
    const lines = processed.split('\n')
    let inList = false
    const processedLines = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      if (trimmed.match(/^[-*]\s+/)) {
        // Handle bullet points
        if (!inList) {
          processedLines.push('<ul class="lesson-list">')
          inList = true
        }
        const listContent = trimmed.replace(/^[-*]\s+/, '')
        processedLines.push(`<li>${listContent}</li>`)
      } else {
        // Close list if we were in one
        if (inList) {
          processedLines.push('</ul>')
          inList = false
        }
        
        // Handle different line types
        if (trimmed === '') {
          // Empty line - add break only if previous line wasn't empty
          const prevLine = processedLines[processedLines.length - 1]
          if (prevLine && !prevLine.includes('<br>') && !prevLine.includes('</ul>')) {
            processedLines.push('<br>')
          }
        } else if (trimmed.startsWith('<')) {
          // Already HTML - keep as is
          processedLines.push(line)
        } else if (trimmed.match(/^\*\*.*\*\*$/)) {
          // Section headers (lines that are just **Header**)
          // Add empty line before section headers for better spacing
          const prevLine = processedLines[processedLines.length - 1]
          if (prevLine && prevLine.trim() !== '' && !prevLine.includes('<br>')) {
            processedLines.push('<br>')
          }
          processedLines.push(line) // Let the bold processing handle it
        } else {
          // Regular content lines - only wrap in <p> if it looks like a standalone paragraph
          const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : ''
          const prevLine = i > 0 ? lines[i - 1].trim() : ''
          
          // Check if this should be a paragraph (not part of a list context)
          if (!trimmed.match(/^[-*]\s+/) && !prevLine.match(/^[-*]\s+/) && !nextLine.match(/^[-*]\s+/)) {
            processedLines.push(`<p>${line}</p>`)
          } else {
            processedLines.push(line)
          }
        }
      }
    }

    // Close any open list
    if (inList) {
      processedLines.push('</ul>')
    }

    processed = processedLines.join('\n')

    // Clean up formatting
    processed = processed.replace(/<br>\s*<br>/g, '<br>')
    processed = processed.replace(/<p>\s*<\/p>/g, '')
    processed = processed.replace(/\n\s*\n/g, '\n')

    return processed
  }, [content, processingOptions])

  // KaTeX rendering with proper DOM manipulation
  useEffect(() => {
    if (!contentRef.current) return
    
    // Only render math if this is actually a math subject
    const isActualMathSubject = isMathSubject(subject, gradeLevel)
    if (!isActualMathSubject) {
      console.log('🚫 Skipping KaTeX rendering for non-math subject')
      return
    }

    const renderMathWithKaTeX = () => {
      const container = contentRef.current
      if (!container) return

      try {
        // Configure KaTeX options
        const katexOptions = {
          throwOnError: false,
          errorColor: '#dc3545',
          strict: false,
          trust: true,
          minRuleThickness: 0.05,
          macros: {
            "\\RR": "\\mathbb{R}",
            "\\ZZ": "\\mathbb{Z}",
            "\\NN": "\\mathbb{N}",
            "\\QQ": "\\mathbb{Q}",
            "\\CC": "\\mathbb{C}",
            "\\degree": "^{\\circ}",
            "\\degrees": "^{\\circ}",
            "\\pd": "\\partial",
            "\\dd": "\\mathrm{d}",
            "\\bra": "\\langle #1 |",
            "\\ket": "| #1 \\rangle",
            "\\braket": "\\langle #1 | #2 \\rangle",
            "\\abs": "| #1 |",
            "\\norm": "\\| #1 \\|",
            "\\vec": "\\mathbf{#1}",
            "\\hat": "\\widehat{#1}",
            "\\tr": "\\operatorname{tr}",
            "\\det": "\\operatorname{det}",
            "\\rank": "\\operatorname{rank}",
            "\\span": "\\operatorname{span}",
            "\\im": "\\operatorname{im}",
            "\\ker": "\\operatorname{ker}",
            "\\Re": "\\operatorname{Re}",
            "\\Im": "\\operatorname{Im}"
          }
        }

        console.log('🎯 Starting KaTeX rendering...')

        // Helper function to clean LaTeX expressions
        const cleanLatex = (latex: string) => {
          return latex.trim()
            .replace(/\[\/display\]/g, '')
            .replace(/\[display\]/g, '')
            .replace(/\[\/math\]/g, '')
            .replace(/\[math\]/g, '')
        }

        // Find and render inline math expressions [math]...[/math]
        const inlineMathRegex = /\[math\](.*?)\[\/math\]/g
        let inlineMatch
        const inlineMatches: Array<{match: string, latex: string}> = []
        
        while ((inlineMatch = inlineMathRegex.exec(container.innerHTML)) !== null) {
          inlineMatches.push({
            match: inlineMatch[0],
            latex: inlineMatch[1]
          })
        }

        // Process matches in reverse order to maintain correct indices
        inlineMatches.reverse().forEach(({match, latex}) => {
          // Clean the latex - remove any stray tags
          const cleanedLatex = cleanLatex(latex)
          try {
            console.log('🎯 Rendering inline math:', cleanedLatex)
            
            const katexHTML = katex.renderToString(cleanedLatex, {
              ...katexOptions,
              displayMode: false
            })
            container.innerHTML = container.innerHTML.replace(match, katexHTML)
            console.log('✅ Inline math rendered successfully')
          } catch (error: any) {
            console.warn('KaTeX inline rendering error:', error)
            container.innerHTML = container.innerHTML.replace(match, `<span class="math-error">Error: ${cleanedLatex} (${(error as any).message})</span>`)
          }
        })

        // Find and render display math expressions [display]...[/display]
        const displayMathRegex = /\[display\](.*?)\[\/display\]/g
        let displayMatch
        const displayMatches: Array<{match: string, latex: string}> = []
        
        while ((displayMatch = displayMathRegex.exec(container.innerHTML)) !== null) {
          displayMatches.push({
            match: displayMatch[0],
            latex: displayMatch[1]
          })
        }

        // Process display matches in reverse order
        displayMatches.reverse().forEach(({match, latex}) => {
          // Clean the latex
          const cleanedLatex = cleanLatex(latex)
          try {
            console.log('🎯 Rendering display math:', cleanedLatex)
            
            const katexHTML = katex.renderToString(cleanedLatex, {
              ...katexOptions,
              displayMode: true
            })
            container.innerHTML = container.innerHTML.replace(match, `<div class="katex-display">${katexHTML}</div>`)
            console.log('✅ Display math rendered successfully')
          } catch (error: any) {
            console.warn('KaTeX display rendering error:', error)
            container.innerHTML = container.innerHTML.replace(match, `<div class="math-error">Error: ${cleanedLatex} (${(error as any).message})</div>`)
          }
        })

        console.log('✅ KaTeX rendering complete')
      } catch (error) {
        console.error('❌ KaTeX rendering error:', error)
      }
    }

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(renderMathWithKaTeX, 100)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [processedContent, subject, gradeLevel])

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
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', 'Futura', 'Avenir', sans-serif;
          line-height: 1.6;
          color: #374151;
          max-width: none;
        }

        .premium-math-content .math-content-container {
          position: relative;
        }

        /* Lesson Plan Structure */
        .premium-math-content h1,
        .premium-math-content h2,
        .premium-math-content h3 {
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #111827;
          page-break-after: avoid;
        }

        .premium-math-content h1 {
          font-size: 1.5rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
          color: #1f2937;
        }

        .premium-math-content h2 {
          font-size: 1.25rem;
          color: #1f2937;
          margin-top: 2rem;
        }

        .premium-math-content h3 {
          font-size: 1.125rem;
          color: #374151;
          margin-top: 1.5rem;
        }

        .premium-math-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        .premium-math-content strong {
          font-weight: 600;
          color: #111827;
        }

        /* Add spacing for section headers - fix to only apply to actual section headers */
        .premium-math-content .section-header {
          display: block;
          margin: 30px 0 15px 0;
          padding: 10px 0 8px 0;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 600;
          color: #111827;
        }
        
        /* Ensure inline strong elements stay inline */
        .premium-math-content p strong:not(.section-header),
        .premium-math-content li strong:not(.section-header) {
          display: inline;
          margin: 0;
          padding: 0;
          border: none;
        }

        /* List Styling */
        .premium-math-content :global(.lesson-list),
        .premium-math-content ul,
        .premium-math-content ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }

        .premium-math-content :global(.lesson-list) li,
        .premium-math-content li {
          margin-bottom: 0.25rem;
          line-height: 1.5;
        }

        /* Activity Name Header */
        .premium-math-content :global(.activity-name-header) {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border-left: 4px solid #3b82f6;
          margin: 1.5rem 0;
          font-weight: 600;
          font-size: 1.2rem;
          color: #1d4ed8;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
          page-break-inside: avoid;
        }

        /* EXIT TICKET Prominent Styling */
        .premium-math-content :global(.exit-ticket-section) {
          background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 10%, #f59e0b 100%);
          border: 3px solid #d97706;
          border-radius: 12px;
          padding: 1.25rem;
          margin: 2rem 0;
          box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25), 0 2px 6px rgba(251, 191, 36, 0.2);
          page-break-inside: avoid;
          position: relative;
          overflow: hidden;
        }

        .premium-math-content :global(.exit-ticket-section::before) {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #dc2626, #ea580c, #d97706, #ca8a04);
          border-radius: 12px 12px 0 0;
        }

        .premium-math-content :global(.exit-ticket-header) {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          font-size: 1.3rem;
          font-weight: 700;
          color: #92400e;
        }

        .premium-math-content :global(.exit-ticket-icon) {
          font-size: 1.5rem;
          margin-right: 0.75rem;
          display: inline-block;
          animation: pulse 2s infinite;
        }

        .premium-math-content :global(.exit-ticket-content) {
          color: #78350f;
          font-weight: 500;
          line-height: 1.7;
          background: rgba(255, 255, 255, 0.7);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid rgba(217, 119, 6, 0.3);
        }

        .premium-math-content :global(.exit-ticket-content) strong {
          color: #92400e;
          font-weight: 700;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* KaTeX Integration Styles */
        .premium-math-content :global(.katex) {
          font-size: inherit !important;
          color: inherit !important;
        }

        .premium-math-content :global(.katex-display) {
          margin: 1.2em 0;
          text-align: center;
        }

        .premium-math-content :global(.katex-display) > :global(.katex) {
          white-space: normal;
        }

        .premium-math-content :global(.katex-display) > :global(.base) {
          margin: 0.25em 0;
        }

        .premium-math-content :global(.katex-display .katex) {
          font-size: 1.15em;
        }

        .premium-math-content :global(.katex:not(.katex-display .katex)) {
          font-size: 1.1em;
          margin: 0.2em 0.3em;
          vertical-align: -0.25em;
        }

        /* Math Error Styles */
        .premium-math-content :global(.math-error) {
          background-color: #fee;
          color: #c53030;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.9em;
        }

        /* Videos Section Styles */
        .premium-math-content .videos-section {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 2px solid #e5e7eb;
          page-break-inside: avoid;
        }

        .premium-math-content .videos-section h2 {
          color: #1f2937;
          margin-bottom: 0.75rem;
        }

        .premium-math-content .videos-list {
          margin: 1rem 0;
        }

        .premium-math-content .video-item {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #f9fafb;
          border-left: 4px solid #6366f1;
          border-radius: 0.375rem;
          page-break-inside: avoid;
        }

        .premium-math-content .video-header {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .premium-math-content .video-number {
          font-weight: 600;
          color: #6366f1;
          flex-shrink: 0;
        }

        .premium-math-content .video-details {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .premium-math-content .video-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.25rem;
          flex-wrap: wrap;
        }

        .premium-math-content .video-url {
          font-family: monospace;
          font-size: 0.85rem;
          word-break: break-all;
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          margin-top: 0.5rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .premium-math-content {
            font-size: 0.95rem;
          }

          .premium-math-content h1 {
            font-size: 1.35rem;
          }

          .premium-math-content h2 {
            font-size: 1.15rem;
          }

          .premium-math-content h3 {
            font-size: 1.05rem;
          }

          .premium-math-content :global(.katex) {
            font-size: 1em !important;
          }

          .premium-math-content :global(.katex-display .katex) {
            font-size: 1.1em !important;
          }

          .premium-math-content :global(.activity-name-header) {
            font-size: 1.1rem;
            padding: 0.6rem 0.8rem;
          }
        }

        /* Print Styles */
        @media print {
          .premium-math-content {
            font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', 'Times New Roman', serif;
            color: #000 !important;
            background: #fff !important;
            font-size: 12pt;
            line-height: 1.6;
          }

          .premium-math-content h1,
          .premium-math-content h2,
          .premium-math-content h3 {
            color: #000 !important;
            page-break-after: avoid;
          }

          .premium-math-content h1 {
            border-bottom: 2px solid #000 !important;
          }

          .premium-math-content :global(.katex) {
            color: #000 !important;
            font-size: 1.1em !important;
          }

          .premium-math-content :global(.katex-display) {
            margin: 1.2em 0 !important;
            page-break-inside: avoid;
          }

          .premium-math-content :global(.katex-display .katex) {
            font-size: 1.2em !important;
          }

          .premium-math-content :global(.activity-name-header) {
            background: #f5f5f5 !important;
            border: 2px solid #000 !important;
            color: #000 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            page-break-after: avoid;
          }

          .premium-math-content strong {
            color: #000 !important;
            font-weight: 700 !important;
          }

          .premium-math-content p {
            margin-bottom: 0.5em !important;
          }

          .premium-math-content :global(.lesson-list),
          .premium-math-content ul,
          .premium-math-content ol {
            margin: 0.5em 0 !important;
          }

          /* Print styles for videos section */
          .premium-math-content .videos-section {
            border-top: 2px solid #000 !important;
            margin-top: 1.5em !important;
            padding-top: 1em !important;
            page-break-inside: avoid;
          }

          .premium-math-content .video-item {
            background: #f9f9f9 !important;
            border: 1px solid #000 !important;
            border-left: 4px solid #000 !important;
            margin-bottom: 0.75em !important;
            page-break-inside: avoid;
          }

          .premium-math-content .video-url {
            background: #f5f5f5 !important;
            border: 1px solid #ccc !important;
            font-size: 0.8em !important;
          }
        }

        .premium-math-content.print-mode {
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', 'Times New Roman', serif;
          color: #000;
          background: #fff;
          line-height: 1.7;
        }

        .premium-math-content.print-mode :global(.katex) {
          font-size: 1.1em !important;
        }

        .premium-math-content.print-mode :global(.katex-display .katex) {
          font-size: 1.2em !important;
          margin: 1.5em 0;
        }

        /* High-contrast mode support */
        @media (prefers-contrast: high) {
          .premium-math-content {
            color: #000;
          }

          .premium-math-content h1,
          .premium-math-content h2,
          .premium-math-content h3 {
            color: #000;
          }

          .premium-math-content :global(.katex) {
            color: #000 !important;
          }

          .premium-math-content :global(.activity-name-header) {
            background: #fff;
            border: 3px solid #000;
            color: #000;
          }

          .premium-math-content strong {
            color: #000;
          }
        }
      `}</style>
    </div>
  )
}

export default PremiumMathContent