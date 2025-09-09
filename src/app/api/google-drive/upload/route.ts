import { NextRequest, NextResponse } from 'next/server'
import { createDriveService, LessonPlanData } from '../../../../lib/google/drive'
import { GoogleTokens } from '../../../../lib/googleAuth'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

async function generateEnhancedDocxFile(htmlContent: string, lessonData: LessonPlanData): Promise<Buffer> {
  const children = []

  // Add Peabody header with branding
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Peabody Lesson Plan",
          bold: true,
          size: 36,
          color: "2563eb"
        })
      ],
      alignment: "center",
      spacing: { after: 200 }
    })
  )

  // Add lesson information section
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${lessonData.grade} ${lessonData.subject}`,
          bold: true,
          size: 28
        })
      ],
      alignment: "center",
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Topic: ${lessonData.topic}`,
          size: 22,
          color: "4b5563"
        })
      ],
      alignment: "center"
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Duration: ${lessonData.duration}`,
          size: 22,
          color: "4b5563"
        })
      ],
      alignment: "center"
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${new Date().toLocaleDateString()}`,
          size: 22,
          color: "4b5563"
        })
      ],
      alignment: "center",
      spacing: { after: 400 }
    })
  )

  // Parse HTML content and properly identify sections
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  
  // Split content by common lesson plan sections
  const sectionPattern = /(?=(?:Activity|Vocabulary Flow|Key Reference|Learning Objectives|Materials|Phase \d+|Introduction|Conclusion|Assessment|Homework|Objective|Overview|Summary|Instructions|Procedures|Extension|Reflection|Standards|Time|Duration|Grade Level|Subject)(?:\s|:))/i
  
  const sections = textContent.split(sectionPattern).filter(section => section.trim())
  
  sections.forEach((section, index) => {
    const trimmed = section.trim()
    if (!trimmed) return
    
    // Check if this section starts with a known header
    const headerMatch = trimmed.match(/^(Activity|Vocabulary Flow|Key Reference|Learning Objectives|Materials|Phase \d+|Introduction|Conclusion|Assessment|Homework|Objective|Overview|Summary|Instructions|Procedures|Extension|Reflection|Standards|Time|Duration|Grade Level|Subject)(?:\s*:?\s*)/i)
    
    if (headerMatch) {
      const headerText = headerMatch[1]
      const contentText = trimmed.substring(headerMatch[0].length).trim()
      
      // Add the header as a separate paragraph
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: headerText,
              bold: true,
              size: 26,
              color: "1f2937"
            })
          ],
          spacing: { before: 400, after: 200 }
        })
      )
      
      // Add the content if there is any
      if (contentText) {
        // Split content into smaller paragraphs for readability
        const contentParagraphs = contentText.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(p => p.trim())
        
        contentParagraphs.forEach(contentPara => {
          if (contentPara.trim()) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: contentPara.trim(),
                    size: 22,
                    color: "374151"
                  })
                ],
                spacing: { after: 150 }
              })
            )
          }
        })
      }
    } else {
      // This is regular content, check if it contains multiple sentences
      const sentences = trimmed.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(s => s.trim())
      
      sentences.forEach(sentence => {
        if (sentence.trim()) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: sentence.trim(),
                  size: 22,
                  color: "374151"
                })
              ],
              spacing: { after: 150 }
            })
          )
        }
      })
    }
  })

  const docxDocument = new Document({
    sections: [{
      children,
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            right: 1440,  // 1 inch  
            bottom: 1440, // 1 inch
            left: 1440    // 1 inch
          }
        }
      }
    }]
  })

  return Buffer.from(await Packer.toBuffer(docxDocument))
}

export async function POST(request: NextRequest) {
  console.log('Google Drive upload route called')
  
  try {
    const body = await request.json()
    console.log('Request body parsed successfully')
    
    const { lessonData, htmlContent, format, accessToken } = body

    if (!lessonData || !htmlContent || !format || !accessToken) {
      console.error('Missing required fields:', { 
        hasLessonData: !!lessonData, 
        hasHtmlContent: !!htmlContent, 
        hasFormat: !!format, 
        hasAccessToken: !!accessToken 
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['pdf', 'docx'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be pdf or docx' },
        { status: 400 }
      )
    }

    // Create tokens object
    const tokens: GoogleTokens = {
      access_token: accessToken
      // In production, you'd also handle refresh_token and expiry_date
    }

    // Create Google Drive service
    const driveService = await createDriveService(tokens)

    // Convert content to the requested format
    let fileContent: Buffer
    
    if (format === 'pdf') {
      try {
        const PDFDocument = require('pdfkit')
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4'
        })
        
        const chunks: Buffer[] = []
        doc.on('data', (chunk: Buffer) => chunks.push(chunk))
        
        await new Promise<void>((resolve, reject) => {
          doc.on('end', resolve)
          doc.on('error', reject)
          
          try {
            // Header with Peabody branding
            doc.fontSize(20).fillColor('#2563eb').text('Peabody Lesson Plan', { align: 'center' })
            doc.moveDown(0.5)
            
            // Lesson details
            doc.fontSize(16).fillColor('#000000')
            doc.text(`${lessonData.grade} ${lessonData.subject}`, { align: 'center' })
            doc.moveDown(0.3)
            
            doc.fontSize(14).fillColor('#4b5563')
            doc.text(`Topic: ${lessonData.topic}`, { align: 'center' })
            doc.text(`Duration: ${lessonData.duration}`, { align: 'center' })
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' })
            doc.moveDown(1)
            
            // Content section
            doc.fontSize(12).fillColor('#000000')
            
            // Parse HTML content into structured sections
            const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
            const sections = textContent.split(/(?=\d+\.|Objective|Materials|Activity|Assessment|Homework)/i)
            
            sections.forEach((section: string, index: number) => {
              const trimmed = section.trim()
              if (trimmed) {
                // Check if it's a heading (starts with number or common section names)
                if (/^(\d+\.|Objective|Materials|Activity|Assessment|Homework)/i.test(trimmed)) {
                  doc.fontSize(14).fillColor('#1f2937').text(trimmed, { paragraphGap: 8 })
                } else {
                  doc.fontSize(12).fillColor('#374151').text(trimmed, { paragraphGap: 6 })
                }
                doc.moveDown(0.5)
              }
            })
            
            doc.end()
          } catch (error) {
            reject(error)
          }
        })
        
        fileContent = Buffer.concat(chunks)
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError)
        throw new Error(`PDF generation failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`)
      }
    } else {
      try {
        fileContent = await generateEnhancedDocxFile(htmlContent, lessonData)
      } catch (docxError) {
        console.error('DOCX generation failed:', docxError)
        throw new Error(`DOCX generation failed: ${docxError instanceof Error ? docxError.message : 'Unknown error'}`)
      }
    }

    // Upload to Google Drive
    const uploadResult = await driveService.uploadLessonPlan(
      lessonData,
      fileContent,
      format
    )

    return NextResponse.json({
      success: true,
      ...uploadResult
    })

  } catch (error) {
    console.error('Google Drive upload error:', error)
    
    // More detailed error information
    let errorMessage = 'Unknown error'
    let errorDetails = ''
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || ''
    } else if (typeof error === 'string') {
      errorMessage = error
    } else {
      errorMessage = 'Unexpected error type'
      errorDetails = JSON.stringify(error)
    }
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorDetails,
      errorType: typeof error
    })
    
    // Ensure we always return a valid JSON response
    try {
      return NextResponse.json(
        { 
          error: 'Upload failed', 
          message: errorMessage,
          details: errorDetails.substring(0, 1000) // Limit details length
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (responseError) {
      console.error('Failed to create error response:', responseError)
      // Return a minimal error response if JSON creation fails
      return new Response(
        JSON.stringify({ error: 'Internal server error', message: 'Failed to create error response' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }
  }
}