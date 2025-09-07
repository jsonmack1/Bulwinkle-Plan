'use client'

import { useEffect } from 'react'

// Preload critical components after initial render
const ComponentPreloader = () => {
  useEffect(() => {
    // Preload critical components after a short delay
    const preloadComponents = () => {
      // Preload ActivityCreationModal since it's the primary user interaction
      import('../modals/ActivityCreationModal')
      
      // Preload commonly used premium components
      setTimeout(() => {
        import('../premium/PremiumFeatureLock')
        import('../premium/UpgradeModal')
      }, 1000)
      
      // Preload Google Drive functionality for authenticated users
      setTimeout(() => {
        import('../GoogleDriveButton')
      }, 2000)
    }

    // Only preload after initial page render
    const timer = setTimeout(preloadComponents, 500)
    return () => clearTimeout(timer)
  }, [])

  return null // This component doesn't render anything
}

export default ComponentPreloader