'use client'

import React, { useState } from 'react'
import { FileDown, Download, ExternalLink, Lock } from 'lucide-react'
import { useSubscription } from '../lib/subscription-mock'

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
  onUpgradeClick?: () => void
}

interface UploadState {
  status: 'idle' | 'authenticating' | 'uploading' | 'success' | 'error'
  message?: string
  link?: string
}

export function GoogleDriveButton({ lessonData, lessonContentId, className = '', onUpgradeClick }: GoogleDriveButtonProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' })
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { isPremium } = useSubscription()

  const handleExport = async () => {
    // Check if user is premium before proceeding
    if (!isPremium) {
      setShowUpgradeModal(true)
      return
    }

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
    const baseClass = `px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 shadow-sm hover:shadow-md text-sm ${className} relative`
    
    if (uploadState.status === 'authenticating' || uploadState.status === 'uploading') {
      return `${baseClass} bg-gray-400 text-gray-600 cursor-not-allowed`
    } else if (uploadState.status === 'success') {
      return `${baseClass} bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md`
    } else if (uploadState.status === 'error') {
      return `${baseClass} bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md`
    } else if (!isPremium) {
      return `${baseClass} bg-blue-100 text-blue-700 hover:bg-blue-200 border-2 border-dashed border-blue-300`
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
          <span>Export to Google Docs</span>
          {!isPremium && <Lock size={14} />}
        </>
      )
    }
  }

  return (
    <>
      <div className="flex flex-col relative">
        <button
          onClick={handleExport}
          disabled={uploadState.status === 'uploading' || uploadState.status === 'authenticating'}
          className={getButtonClass()}
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {getButtonContent()}
        </button>
        
        {!isPremium && (
          <div className="absolute -top-2 -right-2">
            <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">PRO</span>
          </div>
        )}
      
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

      {/* Export Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          {/* Blurred Document Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <div className="bg-white shadow-2xl rounded-lg p-8 max-w-4xl w-full mx-4 transform scale-110" style={{ filter: 'blur(3px)', opacity: 0.7 }}>
                {/* Mock Document Content */}
                <div className="border-b-2 border-gray-800 pb-4 mb-6 text-center">
                  <h1 className="text-2xl font-bold mb-2">{lessonData.topic} - Lesson Plan</h1>
                  <div className="text-sm text-gray-600">
                    <strong>Grade:</strong> {lessonData.grade} | <strong>Subject:</strong> {lessonData.subject} | <strong>Duration:</strong> {lessonData.duration} min
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2">📚 Learning Objectives</h3>
                    <div className="h-3 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg mb-2">🎯 Activity Instructions</h3>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-300 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-3 bg-gray-300 rounded w-4/5"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg mb-2">📦 Materials Needed</h3>
                    <div className="space-y-1">
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg mb-2">💬 Teacher Script</h3>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-300 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative shadow-2xl" style={{ zIndex: 100 }}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">📄</div>
              <h2 className="text-2xl font-bold mb-2">Export to Google Docs</h2>
              <p className="text-gray-600">
                Save time with one-click export to Google Docs for easy sharing and editing.
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">✨ Teacher Pro Export Features:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Export to Google Docs with formatting</li>
                <li>• Save to Google Drive automatically</li>
                <li>• Share easily with colleagues</li>
                <li>• Print-ready formatting</li>
              </ul>
            </div>
            
            <button
              onClick={() => {
                setShowUpgradeModal(false)
                if (onUpgradeClick) {
                  onUpgradeClick()
                }
              }}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors mb-4"
            >
              Upgrade for $7.99/month
            </button>
            
            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="w-full text-gray-500 hover:text-gray-700"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default GoogleDriveButton