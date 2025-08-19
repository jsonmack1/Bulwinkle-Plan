/**
 * Enhanced Content Parser for Lesson Plans with Mathematical Rendering
 * Seamlessly integrates mathematical notation rendering into existing lesson display system
 */

export interface ParsedContentSection {
  type: 'text' | 'math' | 'heading' | 'list_item' | 'activity_name'
  content: string
  rawContent: string
  className?: string
  isBlock?: boolean
}

export interface LessonSection {
  title: string
  content: ParsedContentSection[]
  type: 'objective' | 'material' | 'instruction' | 'tip' | 'example' | 'problem' | 'general'
}

/**
 * Enhanced content parser that handles mathematical expressions in lesson plans
 */
export class LessonContentParser {
  
  /**
   * Main parsing function that converts lesson text into structured sections with math rendering
   */
  static parseLesson(lessonText: string): LessonSection[] {
    if (!lessonText) return []

    const sections: LessonSection[] = []
    const lines = lessonText.split('\n')
    let currentSection: LessonSection | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Detect section headers
      const sectionHeader = this.detectSectionHeader(line)
      if (sectionHeader) {
        if (currentSection) {
          sections.push(currentSection)
        }
        currentSection = {
          title: sectionHeader.title,
          content: [],
          type: sectionHeader.type
        }
        continue
      }

      // Parse content line and add to current section
      if (currentSection) {
        const parsedContent = this.parseContentLine(line)
        currentSection.content.push(...parsedContent)
      } else {
        // Create a general section for content without headers
        if (!currentSection) {
          currentSection = {
            title: 'Lesson Content',
            content: [],
            type: 'general'
          }
        }
        const parsedContent = this.parseContentLine(line)
        currentSection.content.push(...parsedContent)
      }
    }

    // Add final section
    if (currentSection) {
      sections.push(currentSection)
    }

    return sections
  }

  /**
   * Parse individual content line with mathematical expression support
   */
  static parseContentLine(line: string): ParsedContentSection[] {
    const sections: ParsedContentSection[] = []
    
    // Handle activity names specially
    if (this.isActivityName(line)) {
      sections.push({
        type: 'activity_name',
        content: this.extractActivityName(line),
        rawContent: line,
        className: 'activity-name-header',
        isBlock: true
      })
      return sections
    }

    // Handle headings
    if (this.isHeading(line)) {
      sections.push({
        type: 'heading',
        content: this.cleanHeading(line),
        rawContent: line,
        className: 'lesson-heading',
        isBlock: true
      })
      return sections
    }

    // Handle list items
    if (this.isListItem(line)) {
      const listContent = this.parseTextWithMath(line.replace(/^[-•*]\s*/, ''))
      sections.push({
        type: 'list_item',
        content: listContent,
        rawContent: line,
        className: 'lesson-list-item',
        isBlock: false
      })
      return sections
    }

    // Handle regular text with potential math expressions
    const textContent = this.parseTextWithMath(line)
    sections.push({
      type: 'text',
      content: textContent,
      rawContent: line,
      isBlock: false
    })

    return sections
  }

  /**
   * Parse text content and convert [math] tags to proper mathematical notation
   */
  static parseTextWithMath(text: string): string {
    if (!text) return ''

    let processed = text

    // Process [math]...[/math] tags
    processed = processed.replace(/\[math\](.*?)\[\/math\]/g, (match, mathContent) => {
      const cleanMath = mathContent.trim()
      const renderedMath = this.renderMathExpression(cleanMath)
      return `<span class="math-expression" data-math="${this.escapeHtml(cleanMath)}">${renderedMath}</span>`
    })

    // Process markdown-style bold
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // Process markdown-style italic
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>')

    return processed
  }

  /**
   * Render mathematical expression using CSS-based formatting
   */
  static renderMathExpression(mathContent: string): string {
    let rendered = mathContent

    // Handle exponents
    rendered = rendered.replace(/\^{([^}]+)}/g, '<sup>$1</sup>')
    rendered = rendered.replace(/\^(\d+)/g, '<sup>$1</sup>')
    rendered = rendered.replace(/\^([a-zA-Z])/g, '<sup>$1</sup>')

    // Handle subscripts
    rendered = rendered.replace(/_{([^}]+)}/g, '<sub>$1</sub>')
    rendered = rendered.replace(/_(\d+)/g, '<sub>$1</sub>')
    rendered = rendered.replace(/_([a-zA-Z])/g, '<sub>$1</sub>')

    // Handle fractions
    rendered = rendered.replace(/\\frac{([^}]+)}{([^}]+)}/g, '<span class="math-fraction"><span class="numerator">$1</span><span class="fraction-bar"></span><span class="denominator">$2</span></span>')

    // Handle square roots
    rendered = rendered.replace(/\\sqrt{([^}]+)}/g, '<span class="math-sqrt">√<span class="sqrt-content">$1</span></span>')

    // Handle mathematical symbols
    const symbolMap: Record<string, string> = {
      '\\int': '∫',
      '\\sum': '∑',
      '\\prod': '∏',
      '\\infty': '∞',
      '\\pi': 'π',
      '\\alpha': 'α',
      '\\beta': 'β',
      '\\gamma': 'γ',
      '\\delta': 'δ',
      '\\epsilon': 'ε',
      '\\theta': 'θ',
      '\\lambda': 'λ',
      '\\mu': 'μ',
      '\\sigma': 'σ',
      '\\phi': 'φ',
      '\\omega': 'ω',
      '\\to': '→',
      '\\rightarrow': '→',
      '\\leftarrow': '←',
      '\\le': '≤',
      '\\leq': '≤',
      '\\ge': '≥',
      '\\geq': '≥',
      '\\ne': '≠',
      '\\neq': '≠',
      '\\pm': '±',
      '\\times': '×',
      '\\cdot': '·',
      '\\div': '÷',
      '\\approx': '≈',
      '\\equiv': '≡',
      '\\propto': '∝',
      '\\in': '∈',
      '\\subset': '⊂',
      '\\cup': '∪',
      '\\cap': '∩'
    }

    Object.entries(symbolMap).forEach(([latex, symbol]) => {
      rendered = rendered.replace(new RegExp(latex.replace(/\\/g, '\\\\'), 'g'), symbol)
    })

    return rendered
  }

  /**
   * Detect section headers in lesson content
   */
  static detectSectionHeader(line: string): { title: string; type: LessonSection['type'] } | null {
    const cleanLine = line.replace(/^\*\*|\*\*$/g, '').trim()
    
    // Define section patterns
    const sectionPatterns: Array<{ pattern: RegExp; type: LessonSection['type'] }> = [
      { pattern: /^(learning\s+objectives?|objectives?):?$/i, type: 'objective' },
      { pattern: /^(materials?|supplies|resources):?$/i, type: 'material' },
      { pattern: /^(instructions?|procedures?|activities?):?$/i, type: 'instruction' },
      { pattern: /^(teaching\s+tips?|tips?|guidance):?$/i, type: 'tip' },
      { pattern: /^(examples?|sample\s+problems?):?$/i, type: 'example' },
      { pattern: /^(practice\s+problems?|problems?|exercises?):?$/i, type: 'problem' },
      { pattern: /^(phase\s+\d+|step\s+\d+):?/i, type: 'instruction' }
    ]

    for (const { pattern, type } of sectionPatterns) {
      if (pattern.test(cleanLine)) {
        return { title: cleanLine, type }
      }
    }

    // Check if it's a general header (bold text)
    if (line.startsWith('**') && line.endsWith('**')) {
      return { title: cleanLine, type: 'general' }
    }

    return null
  }

  /**
   * Check if line is an activity name
   */
  static isActivityName(line: string): boolean {
    return /^(ACTIVITY\s+NAME|Activity\s+Name):\s*/i.test(line) ||
           /^\*\*.*ACTIVITY.*\*\*$/i.test(line)
  }

  /**
   * Extract activity name from line
   */
  static extractActivityName(line: string): string {
    if (line.startsWith('**') && line.endsWith('**')) {
      return line.replace(/^\*\*|\*\*$/g, '').trim()
    }
    return line.replace(/^(ACTIVITY\s+NAME|Activity\s+Name):\s*/i, '').trim()
  }

  /**
   * Check if line is a heading
   */
  static isHeading(line: string): boolean {
    return line.startsWith('**') && line.endsWith('**') && !this.isActivityName(line)
  }

  /**
   * Clean heading text
   */
  static cleanHeading(line: string): string {
    return line.replace(/^\*\*|\*\*$/g, '').trim()
  }

  /**
   * Check if line is a list item
   */
  static isListItem(line: string): boolean {
    return /^[-•*]\s+/.test(line)
  }

  /**
   * Escape HTML characters
   */
  static escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Simple function to parse content for quick math rendering
   */
  static quickMathRender(content: string): string {
    if (!content) return ''
    
    return content.replace(/\[math\](.*?)\[\/math\]/g, (match, mathContent) => {
      const rendered = this.renderMathExpression(mathContent.trim())
      return `<span class="math-expression">${rendered}</span>`
    })
  }
}

/**
 * React hook for parsing lesson content with math rendering
 */
export function useLessonContentParser(content: string) {
  const parsedSections = LessonContentParser.parseLesson(content)
  const quickRendered = LessonContentParser.quickMathRender(content)
  
  return {
    sections: parsedSections,
    quickRendered,
    hasMath: /\[math\].*?\[\/math\]/.test(content)
  }
}