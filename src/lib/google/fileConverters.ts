import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { LessonPlanData } from './drive'

export async function convertHTMLToPDF(
  htmlContent: string,
  lessonData: LessonPlanData
): Promise<Buffer> {
  try {
    // Create a temporary div to render the HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    tempDiv.style.width = '800px'
    tempDiv.style.padding = '20px'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.backgroundColor = 'white'
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    document.body.appendChild(tempDiv)

    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      width: 840,
      height: tempDiv.scrollHeight + 40,
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    })

    // Clean up
    document.body.removeChild(tempDiv)

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgWidth = 190 // A4 width minus margins
    const pageHeight = 277 // A4 height minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 10

    // Add title page
    pdf.setFontSize(20)
    pdf.text(`${lessonData.grade} ${lessonData.subject} Lesson Plan`, 20, 30)
    pdf.setFontSize(16)
    pdf.text(`Topic: ${lessonData.topic}`, 20, 45)
    pdf.text(`Duration: ${lessonData.duration}`, 20, 55)
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 65)

    if (heightLeft <= pageHeight - 80) {
      // Content fits on first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 80, imgWidth, imgHeight)
    } else {
      // Need multiple pages
      pdf.addPage()
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
    }

    return Buffer.from(pdf.output('arraybuffer'))
  } catch (error) {
    console.error('Error converting HTML to PDF:', error)
    throw new Error('Failed to convert lesson plan to PDF')
  }
}

export async function convertHTMLToDocx(
  htmlContent: string,
  lessonData: LessonPlanData
): Promise<Buffer> {
  try {
    // Parse HTML content to extract text and structure
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    const children = []

    // Add title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${lessonData.grade} ${lessonData.subject} Lesson Plan`,
            bold: true,
            size: 32
          })
        ],
        heading: HeadingLevel.TITLE
      })
    )

    // Add metadata
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Topic: ${lessonData.topic}`,
            bold: true,
            size: 24
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Duration: ${lessonData.duration}`,
            size: 20
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${new Date().toLocaleDateString()}`,
            size: 20
          })
        ]
      }),
      new Paragraph({ text: '' }) // Empty line
    )

    // Process HTML content
    const processElement = (element: Element): Paragraph[] => {
      const paragraphs: Paragraph[] = []
      
      if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3') {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: element.textContent || '',
                bold: true,
                size: element.tagName === 'H1' ? 28 : element.tagName === 'H2' ? 24 : 20
              })
            ],
            heading: element.tagName === 'H1' ? HeadingLevel.HEADING_1 : 
                    element.tagName === 'H2' ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3
          })
        )
      } else if (element.tagName === 'P' || element.tagName === 'DIV') {
        const text = element.textContent?.trim()
        if (text) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text,
                  size: 20
                })
              ]
            })
          )
        }
      } else if (element.tagName === 'UL' || element.tagName === 'OL') {
        Array.from(element.children).forEach(li => {
          const text = li.textContent?.trim()
          if (text) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${text}`,
                    size: 20
                  })
                ]
              })
            )
          }
        })
      }

      // Process child elements
      Array.from(element.children).forEach(child => {
        if (child.tagName !== 'UL' && child.tagName !== 'OL' && child.tagName !== 'LI') {
          paragraphs.push(...processElement(child))
        }
      })

      return paragraphs
    }

    // Process all content
    Array.from(tempDiv.children).forEach(element => {
      children.push(...processElement(element))
    })

    // If no structured content found, add raw text
    if (children.length <= 4) {
      const text = tempDiv.textContent?.trim()
      if (text) {
        const lines = text.split('\n').filter(line => line.trim())
        lines.forEach(line => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line.trim(),
                  size: 20
                })
              ]
            })
          )
        })
      }
    }

    const doc = new Document({
      sections: [{
        children
      }]
    })

    return Buffer.from(await Packer.toBuffer(doc))
  } catch (error) {
    console.error('Error converting HTML to DOCX:', error)
    throw new Error('Failed to convert lesson plan to DOCX')
  }
}