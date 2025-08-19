import React from 'react'

interface AddReplaceDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: () => void
  onReplace: () => void
  itemTitle: string
  itemType: 'below_grade' | 'at_grade' | 'above_grade' | 'esl_adaptations' | 'iep_adaptations'
}

const AddReplaceDialog: React.FC<AddReplaceDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  onReplace,
  itemTitle,
  itemType
}) => {
  if (!isOpen) return null

  const getSmartDefaults = () => {
    // ESL and IEP adaptations typically get added alongside existing content
    if (itemType === 'esl_adaptations' || itemType === 'iep_adaptations') {
      return {
        preferredAction: 'add',
        addDescription: 'These supports work alongside your existing instructions',
        replaceDescription: 'Replace all instructions with this adaptation only'
      }
    }
    
    // Grade level adaptations can go either way
    return {
      preferredAction: 'replace',
      addDescription: 'Keep existing instructions and add these as alternatives',
      replaceDescription: 'Replace existing instructions with this level-specific version'
    }
  }

  const { preferredAction, addDescription, replaceDescription } = getSmartDefaults()

  const getIcon = () => {
    switch (itemType) {
      case 'below_grade': return '📚'
      case 'at_grade': return '🎯'
      case 'above_grade': return '🚀'
      case 'esl_adaptations': return '🌍'
      case 'iep_adaptations': return '🤝'
      default: return '📝'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 text-center">
          <div className="text-4xl mb-2">{getIcon()}</div>
          <h3 className="text-xl font-bold mb-1">Add "{itemTitle}"</h3>
          <p className="text-purple-100 text-sm">How would you like to integrate this into your lesson?</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Option 1: Add Alongside */}
          <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
            preferredAction === 'add' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
          }`} onClick={onAdd}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                  +
                </div>
                <h4 className="font-semibold text-gray-900">Add Alongside Existing</h4>
              </div>
              {preferredAction === 'add' && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 ml-9">{addDescription}</p>
            <div className="mt-2 ml-9">
              <div className="text-xs text-green-600 font-medium">Good for:</div>
              <div className="text-xs text-gray-500">
                Mixed-ability classes, differentiated groups, providing options
              </div>
            </div>
          </div>

          {/* Option 2: Replace Existing */}
          <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
            preferredAction === 'replace' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`} onClick={onReplace}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                  ↻
                </div>
                <h4 className="font-semibold text-gray-900">Replace Existing Instructions</h4>
              </div>
              {preferredAction === 'replace' && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 ml-9">{replaceDescription}</p>
            <div className="mt-2 ml-9">
              <div className="text-xs text-blue-600 font-medium">Good for:</div>
              <div className="text-xs text-gray-500">
                Uniform class level, cleaner lesson plans, specific adaptations
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-3 mt-4">
            <div className="text-xs font-medium text-gray-700 mb-1">💡 Quick Tip:</div>
            <div className="text-xs text-gray-600">
              You can always add more adaptations later or remove ones you've added. 
              The lesson plan stays editable throughout your session.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 font-medium px-4 py-2 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default AddReplaceDialog