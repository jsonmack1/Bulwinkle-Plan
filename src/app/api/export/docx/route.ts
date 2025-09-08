import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun } from 'docx'

interface LessonData {
  topic: string
  grade: string
  subject: string
  duration: string
  activityType?: string
  isSubMode?: boolean
}

async function generateDocxFile(htmlContent: string, lessonData: LessonData): Promise<Buffer> {
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

  // Parse HTML content and convert to paragraphs
  const textContent = htmlContent
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  // Split content into paragraphs
  const paragraphs = textContent
    .split(/\n\n|\n|\. (?=[A-Z])|(?<=\.)\s+(?=[A-Z])/g)
    .filter(p => p.trim().length > 0)
  
  paragraphs.forEach((paragraph) => {
    const trimmed = paragraph.trim()
    if (!trimmed) return
    
    // Check if this looks like a header
    const isHeader = /^(Activity|Objective|Materials|Phase \d+|Introduction|Conclusion|Assessment|Instructions|Overview|Summary)(?:\s*:?\s*)/i.test(trimmed)
    
    if (isHeader) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 26,
              color: "1f2937"
            })
          ],
          spacing: { before: 400, after: 200 }
        })
      )
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              size: 22,
              color: "374151"
            })
          ],
          spacing: { after: 150 }
        })
      )
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
  try {
    console.log('DOCX export route called')
    
    const body = await request.json()
    const { lessonData, htmlContent } = body

    if (!lessonData || !htmlContent) {
      console.error('Missing required fields:', { 
        hasLessonData: !!lessonData, 
        hasHtmlContent: !!htmlContent
      })
      return NextResponse.json(
        { error: 'Missing lesson data or content' },
        { status: 400 }
      )
    }

    console.log('Generating DOCX file...')
    const docxBuffer = await generateDocxFile(htmlContent, lessonData)
    
    console.log('DOCX file generated successfully, size:', docxBuffer.length)

    // Return the DOCX file as a download
    return new Response(docxBuffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Peabody_Lesson_Plan_${Date.now()}.docx"`,
        'Content-Length': docxBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('DOCX export error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Export failed', 
        message: errorMessage
      },
      { status: 500 }
    )
  }
}