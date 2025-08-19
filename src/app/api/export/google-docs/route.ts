import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createOAuth2Client } from '../../../../lib/googleAuth'

export async function POST(request: NextRequest) {
  try {
    const { lessonContent, accessToken, title } = await request.json()

    if (!lessonContent || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonContent and accessToken' },
        { status: 400 }
      )
    }

    // Initialize OAuth2 client with access token
    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({ access_token: accessToken })

    // Initialize Google APIs
    const docs = google.docs({ version: 'v1', auth: oauth2Client })
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    // Generate document title
    const docTitle = title || `Lesson Plan - ${new Date().toLocaleDateString()}`

    // Create new Google Doc
    const doc = await docs.documents.create({
      requestBody: {
        title: docTitle
      }
    })

    const documentId = doc.data.documentId
    if (!documentId) {
      throw new Error('Failed to create document')
    }

    // Process lesson content to handle mathematical expressions
    let processedContent = lessonContent
    
    // Convert [math] tags to plain text for Google Docs
    processedContent = processedContent.replace(/\[math\](.*?)\[\/math\]/g, '$1')
    processedContent = processedContent.replace(/\[display\](.*?)\[\/display\]/g, '$1')
    
    // Clean up any HTML tags
    processedContent = processedContent.replace(/<[^>]*>/g, '')
    
    // Insert content into the document
    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: processedContent
            }
          }
        ]
      }
    })

    // Make the document shareable (optional - you might want to keep it private)
    try {
      await drive.permissions.create({
        fileId: documentId,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: 'me' // This gives the authenticated user write access
        }
      })
    } catch (permissionError) {
      console.warn('Could not set document permissions:', permissionError)
      // Continue anyway - the document was created successfully
    }

    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`

    return NextResponse.json({
      success: true,
      documentId,
      documentUrl,
      title: docTitle
    })

  } catch (error) {
    console.error('Google Docs export failed:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Invalid Credentials')) {
        return NextResponse.json(
          { error: 'Google authentication expired. Please sign in again.' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('insufficient authentication scopes')) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Please re-authorize with Google.' },
          { status: 403 }
        )
      }
    }

    // Provide more specific error messages
    let userFriendlyMessage = 'Failed to export to Google Docs'
    
    if (error instanceof Error) {
      if (error.message.includes('Google Docs API has not been used')) {
        userFriendlyMessage = 'Google Docs API not enabled. Please enable the Google Docs API in your Google Cloud Console, then try again.'
      } else if (error.message.includes('Google Drive API has not been used')) {
        userFriendlyMessage = 'Google Drive API not enabled. Please enable the Google Drive API in your Google Cloud Console, then try again.'
      } else if (error.message.includes('Invalid Credentials')) {
        userFriendlyMessage = 'Google authentication expired. Please sign in again.'
      } else if (error.message.includes('insufficient authentication scopes')) {
        userFriendlyMessage = 'Insufficient permissions. Please re-authorize with Google.'
      }
    }

    return NextResponse.json(
      { 
        error: userFriendlyMessage, 
        details: error instanceof Error ? error.message : 'Unknown error',
        action: error instanceof Error && error.message.includes('API has not been used') ? 
          'Enable APIs in Google Cloud Console' : 'Try again or re-authenticate'
      },
      { status: 500 }
    )
  }
}