/**
 * Hook to completely prevent scroll from interfering with focused form fields
 * Aggressively blocks ANY scroll-related field deselection
 */

import { useEffect } from 'react'

export const useScrollMomentumFix = () => {
  useEffect(() => {
    let currentFocusedElement: HTMLElement | null = null

    // Track which element is currently focused
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        currentFocusedElement = target
        console.log('🎯 Field focused:', target.tagName, target.id || (target as HTMLInputElement).name || 'unnamed')
      }
    }

    // Completely prevent blur events during scroll
    const handleBlur = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      
      if (currentFocusedElement && (
        target.tagName === 'INPUT' || 
        target.tagName === 'SELECT' || 
        target.tagName === 'TEXTAREA'
      )) {
        console.log('🚫 Attempting to prevent blur on:', target.tagName, target.id || (target as HTMLInputElement).name || 'unnamed')
        
        // Immediately prevent the blur and restore focus
        event.preventDefault()
        event.stopImmediatePropagation()
        
        // Force focus back immediately
        setTimeout(() => {
          if (currentFocusedElement && document.contains(currentFocusedElement)) {
            currentFocusedElement.focus()
            console.log('✅ Focus restored to:', currentFocusedElement.tagName)
          }
        }, 1)
        
        return false
      }
    }

    // Clear focus tracking when user explicitly clicks elsewhere
    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement
      
      // If clicking on a form element, update tracking
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        currentFocusedElement = target
      } 
      // If clicking completely outside form elements, clear tracking
      else if (!target.closest('input, select, textarea, form')) {
        currentFocusedElement = null
        console.log('🔄 Focus tracking cleared - clicked outside form')
      }
    }

    // Prevent scroll from affecting focused elements
    const handleScroll = (event: Event) => {
      if (currentFocusedElement && document.contains(currentFocusedElement)) {
        // Keep the element focused during scroll
        if (document.activeElement !== currentFocusedElement) {
          console.log('📜 Restoring focus during scroll')
          currentFocusedElement.focus()
        }
        
        // For select elements, prevent scroll from closing dropdowns
        if (currentFocusedElement.tagName === 'SELECT') {
          event.stopPropagation()
        }
      }
    }

    // Prevent keyboard events from being lost
    const handleKeyDown = (event: KeyboardEvent) => {
      if (currentFocusedElement && document.activeElement !== currentFocusedElement) {
        // Restore focus if it was lost
        currentFocusedElement.focus()
      }
    }

    // Add event listeners with high priority (capture phase)
    document.addEventListener('focus', handleFocus, true)
    document.addEventListener('blur', handleBlur, true)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('scroll', handleScroll, true)
    document.addEventListener('keydown', handleKeyDown, true)

    // Also add to window for broader coverage
    window.addEventListener('scroll', handleScroll, true)

    // Cleanup
    return () => {
      document.removeEventListener('focus', handleFocus, true)
      document.removeEventListener('blur', handleBlur, true)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [])
}