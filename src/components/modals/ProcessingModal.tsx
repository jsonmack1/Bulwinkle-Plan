import React from 'react'

interface ProcessingModalProps {
  isSubMode: boolean
  showPreview?: boolean
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({ isSubMode, showPreview }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        <div className="text-center py-8">
          

          {/* Dynamic Activity Icon */}
          <div className="mb-6 relative">
            <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${
              isSubMode 
                ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-4 border-green-300' 
                : 'bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-blue-300'
            }`}
            style={{
              animation: 'bounce-gentle 1.5s ease-in-out infinite'
            }}>
              <div className={`text-4xl ${isSubMode ? 'text-green-600' : 'text-blue-600'}`}>
                {isSubMode ? '👥' : '🎓'}
              </div>
            </div>
          </div>

          {/* Title and Messages */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {showPreview ? 'Regenerating Your Activity' : (isSubMode ? 'Creating Your Substitute-Ready Activity' : 'Building Your Professional Activity')}
          </h3>
          
          <div className="h-6">
            <p className="text-gray-600 text-lg">
              {isSubMode 
                ? 'Generating simple, hands-off activities...'
                : 'Creating comprehensive content with teaching insights...'
              }
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes bounce-gentle {
          0%, 100% { 
            transform: translateY(0px) scale(1); 
          }
          50% { 
            transform: translateY(-12px) scale(1.05); 
          }
        }
      `}</style>
    </div>
  )
}

export default ProcessingModal