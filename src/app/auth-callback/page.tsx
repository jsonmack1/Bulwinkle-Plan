'use client'

import { useEffect } from 'react'

export default function AuthCallback() {
  useEffect(() => {
    // Get tokens from URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token')
    const error = urlParams.get('error')

    if (window.opener) {
      if (error) {
        // Send error to parent window
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error
        }, window.location.origin)
      } else if (accessToken) {
        // Send success with tokens to parent window
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          accessToken: accessToken,
          refreshToken: refreshToken
        }, window.location.origin)
      } else {
        // Send generic error
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'No access token received'
        }, window.location.origin)
      }
      
      // Close the popup window
      window.close()
    } else {
      // Fallback if no opener (direct navigation)
      window.location.href = '/'
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Completing Authentication</h2>
        <p className="text-gray-600">Please wait while we complete your Google Drive connection...</p>
      </div>
    </div>
  )
}