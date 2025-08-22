'use client'

import React, { useState } from 'react'
import { FileDown, Download, ExternalLink } from 'lucide-react'

interface LessonData {
  topic: string
  grade: string
  subject: string
  duration: string
  activityType?: string
  isSubMode?: boolean
}

interface GoogleDriveButtonProps {
  lessonData: LessonData
  lessonContentId: string
  className?: string
}

interface UploadState {
  status: 'idle' | 'authenticating' | 'uploading' | 'success' | 'error'
  message?: string
  link?: string
}

export function GoogleDriveButton({ lessonData, lessonContentId, className = '' }: GoogleDriveButtonProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' })

  const handleExport = async () => {
    try {
      setUploadState({ status: 'authenticating', message: 'Connecting to Google Drive...' })

      // Get the lesson content HTML
      const contentElement = document.getElementById(lessonContentId)
      if (!contentElement) {
        throw new Error('Lesson content not found')
      }

      const htmlContent = contentElement.innerHTML

      // Step 1: Check Google authentication status
      const authResponse = await fetch('/api/google-drive/auth-status')
      let accessToken = null

      if (authResponse.ok) {
        const authData = await authResponse.json()
        if (authData.authenticated && authData.accessToken) {
          accessToken = authData.accessToken
        }
      }

      // Step 2: If not authenticated, initiate OAuth flow
      if (!accessToken) {
        setUploadState({ status: 'authenticating', message: 'Please authorize Google Drive access...' })
        
        const authUrlResponse = await fetch('/api/auth/google')
        if (!authUrlResponse.ok) {
          throw new Error('Failed to get Google authorization URL')
        }
        
        const authUrlData = await authUrlResponse.json()
        
        // Open popup for Google OAuth
        const popup = window.open(
          authUrlData.url,
          'google-auth',
          'width=600,height=600,scrollbars=yes,resizable=yes'
        )
        
        if (!popup) {
          throw new Error('Popup blocked. Please allow popups and try again.')
        }

        // Wait for authentication to complete
        accessToken = await new Promise((resolve, reject) => {
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed)
              reject(new Error('Authentication cancelled'))
            }
          }, 1000)

          window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return
            
            if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
              clearInterval(checkClosed)
              popup.close()
              resolve(event.data.accessToken)
            } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
              clearInterval(checkClosed)
              popup.close()
              reject(new Error(event.data.error || 'Authentication failed'))
            }
          })
        })
      }

      // Step 3: Upload to Google Drive
      setUploadState({ status: 'uploading', message: 'Saving to Google Drive...' })

      const uploadResponse = await fetch('/api/google-drive/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonData: {
            topic: lessonData.topic,
            grade: lessonData.grade,
            subject: lessonData.subject,
            duration: lessonData.duration,
            content: htmlContent
          },
          htmlContent,
          format: 'docx', // You can make this configurable
          accessToken
        })
      })

      if (!uploadResponse.ok) {
        let errorInfo = ''
        try {
          const errorData = await uploadResponse.json()
          errorInfo = errorData.message || errorData.error || 'Unknown server error'
        } catch {
          errorInfo = await uploadResponse.text().catch(() => 'Server error')
        }
        throw new Error(`Upload failed (${uploadResponse.status}): ${errorInfo}`)
      }

      const result = await uploadResponse.json()

      setUploadState({ 
        status: 'success', 
        message: 'Successfully saved to Google Drive!',
        link: result.webViewLink
      })

    } catch (error) {
      console.error('Google Drive export error:', error)
      setUploadState({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Export failed'
      })
    }
  }

  const getButtonClass = () => {
    const baseClass = `px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 shadow-sm hover:shadow-md text-sm ${className}`
    
    if (uploadState.status === 'authenticating' || uploadState.status === 'uploading') {
      return `${baseClass} bg-gray-400 text-gray-600 cursor-not-allowed`
    } else if (uploadState.status === 'success') {
      return `${baseClass} bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md`
    } else if (uploadState.status === 'error') {
      return `${baseClass} bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md`
    } else {
      return `${baseClass} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md`
    }
  }

  const getButtonContent = () => {
    if (uploadState.status === 'authenticating') {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
          <span>Connecting...</span>
        </>
      )
    } else if (uploadState.status === 'uploading') {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
          <span>Uploading...</span>
        </>
      )
    } else if (uploadState.status === 'success') {
      return (
        <>
          <ExternalLink size={16} />
          <span>Saved to Drive!</span>
        </>
      )
    } else if (uploadState.status === 'error') {
      return (
        <>
          <FileDown size={16} />
          <span>Retry Upload</span>
        </>
      )
    } else {
      return (
        <>
          <FileDown size={16} />
          <span>Save to Google Drive</span>
        </>
      )
    }
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={handleExport}
        disabled={uploadState.status === 'uploading' || uploadState.status === 'authenticating'}
        className={getButtonClass()}
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {getButtonContent()}
      </button>
      
      {uploadState.message && (
        <div className={`mt-2 p-2 rounded text-xs ${
          uploadState.status === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : uploadState.status === 'error'
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {uploadState.message}
          {uploadState.status === 'success' && uploadState.link && (
            <div className="mt-1">
              <a 
                href={uploadState.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-green-700 hover:text-green-900 underline text-xs"
              >
                <ExternalLink size={12} className="mr-1" />
                Open in Google Drive
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GoogleDriveButton