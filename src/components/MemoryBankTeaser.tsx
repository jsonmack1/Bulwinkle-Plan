'use client'

import React from 'react'
import { Bookmark } from 'lucide-react'
import { useSubscription } from '../lib/subscription-mock'

interface MemoryBankTeaserProps {
  lessonTitle: string
  onUpgradeClick?: () => void
  className?: string
}

export const MemoryBankTeaser: React.FC<MemoryBankTeaserProps> = ({
  lessonTitle,
  onUpgradeClick,
  className = ''
}) => {
  const { isPremium } = useSubscription()

  if (isPremium) return null

  const showMemoryBankUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick()
    } else {
      alert('🏦 Upgrade to Teacher Pro to save lessons to your Memory Bank!')
    }
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Bookmark className="text-yellow-600 mr-3 w-5 h-5" />
          <div>
            <div className="font-medium text-yellow-800">
              Save &quot;{lessonTitle}&quot; to Memory Bank?
            </div>
            <div className="text-sm text-yellow-700">
              Never lose a great lesson again with auto-save and smart organization
            </div>
          </div>
        </div>
        <button 
          onClick={showMemoryBankUpgrade}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-700 transition-colors"
        >
          Upgrade to Save
        </button>
      </div>
    </div>
  )
}

export default MemoryBankTeaser