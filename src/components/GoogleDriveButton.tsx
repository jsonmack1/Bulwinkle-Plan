'use client'

import React, { useState } from 'react'
import { Upload, CloudUpload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { LessonPlanData } from '../lib/google/drive'

interface GoogleDriveButtonProps {
  lessonData: LessonPlanData
  lessonContentId: string
  className?: string
}

interface UploadState {
  status: 'idle' | 'authenticating' | 'uploading' | 'success' | 'error'
  message?: string
  driveLink?: string
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

      // Check if user has stored tokens from previous authentication
      let accessToken = localStorage.getItem('google_access_token')

      if (!accessToken) {
        // Need to authenticate
        const authUrlResponse = await fetch('/api/auth/google')
        const authUrlData = await authUrlResponse.json()
        
        if (!authUrlData.success) {
          throw new Error('Failed to get authentication URL')
        }

        // Open authentication window
        const authWindow = window.open(
          authUrlData.url,
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        )

        // Wait for authentication to complete
        accessToken = await new Promise<string>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Authentication timed out'))
          }, 300000) // 5 minute timeout

          // Listen for messages from the popup window
          const messageHandler = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return
            
            if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
              clearTimeout(timeout)
              window.removeEventListener('message', messageHandler)
              
              const { access_token, refresh_token } = event.data
              
              // Store tokens in localStorage for future use
              localStorage.setItem('google_access_token', access_token)
              if (refresh_token) {
                localStorage.setItem('google_refresh_token', refresh_token)
              }
              
              resolve(access_token)
            } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
              clearTimeout(timeout)
              window.removeEventListener('message', messageHandler)
              reject(new Error(event.data.error || 'Authentication failed'))
            }
          }

          window.addEventListener('message', messageHandler)

          // Also check if popup was closed without authentication
          const checkClosed = () => {
            if (authWindow?.closed) {
              clearTimeout(timeout)
              window.removeEventListener('message', messageHandler)
              reject(new Error('Authentication window was closed'))
            } else {
              setTimeout(checkClosed, 1000)
            }
          }
          checkClosed()
        })
      }

      setUploadState({ status: 'uploading', message: 'Creating DOCX and uploading to Google Drive...' })

      // Upload to Google Drive
      const uploadResponse = await fetch('/api/google-drive/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonData,
          htmlContent,
          format: 'docx',
          accessToken
        })
      })

      let uploadResult
      if (!uploadResponse.ok) {
        // For error responses, try to get text first
        let errorText = ''
        try {
          errorText = await uploadResponse.text()
          console.error('Server error response:', errorText)
        } catch (e) {
          console.error('Could not read error response')
        }
        throw new Error(`Server error: ${uploadResponse.status} ${uploadResponse.statusText}${errorText ? ` - ${errorText}` : ''}`)
      }

      try {
        uploadResult = await uploadResponse.json()
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError)
        throw new Error(`Invalid server response: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }

      setUploadState({
        status: 'success',
        message: `Successfully saved to Google Drive!`,
        driveLink: uploadResult.webViewLink
      })

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setUploadState({ status: 'idle' })
      }, 5000)

    } catch (error) {
      console.error('Google Drive export error:', error)
      setUploadState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Export failed. Please try again.'
      })

      // Auto-hide error message after 8 seconds
      setTimeout(() => {
        setUploadState({ status: 'idle' })
      }, 8000)
    }
  }

  const getButtonContent = () => {
    switch (uploadState.status) {
      case 'authenticating':
        return (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Authenticating...</span>
          </>
        )
      case 'uploading':
        return (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Uploading...</span>
          </>
        )
      case 'success':
        return (
          <>
            <CheckCircle size={16} className="text-green-600" />
            <span>Saved!</span>
          </>
        )
      case 'error':
        return (
          <>
            <AlertCircle size={16} className="text-red-600" />
            <span>Try Again</span>
          </>
        )
      default:
        return (
          <>
            <CloudUpload size={16} />
            <span>Save to Drive</span>
          </>
        )
    }
  }

  const getButtonClass = () => {
    const baseClass = `${className} px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 shadow-sm hover:shadow-md text-sm relative`
    
    switch (uploadState.status) {
      case 'success':
        return `${baseClass} bg-green-100 hover:bg-green-200 border border-green-300 text-green-700 hover:text-green-800`
      case 'error':
        return `${baseClass} bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 hover:text-red-800`
      case 'authenticating':
      case 'uploading':
        return `${baseClass} bg-blue-100 border border-blue-300 text-blue-700 cursor-not-allowed`
      default:
        return `${baseClass} bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-700 hover:text-blue-800`
    }
  }

  const isDisabled = uploadState.status === 'authenticating' || uploadState.status === 'uploading'

  return (
    <div className="relative">
      <button
        onClick={() => !isDisabled && handleExport()}
        className={getButtonClass()}
        disabled={isDisabled}
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {getButtonContent()}
      </button>

      {uploadState.message && (
        <div className={`absolute top-full left-0 mt-1 px-3 py-2 rounded-lg text-xs z-20 whitespace-nowrap ${
          uploadState.status === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200'
            : uploadState.status === 'error'
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {uploadState.message}
          {uploadState.driveLink && (
            <a 
              href={uploadState.driveLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 underline hover:no-underline"
            >
              Open
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default GoogleDriveButton