import React from 'react'

interface AnimatedLoadingScreenProps {
  animation?: 'orbital' | 'wave' | 'leapfrog' | 'pulse'
  message?: string
  isVisible: boolean
}

const AnimatedLoadingScreen: React.FC<AnimatedLoadingScreenProps> = ({ 
  animation = 'orbital', 
  message = 'Loading...',
  isVisible 
}) => {
  if (!isVisible) return null

  const animations = {
    orbital: 'orbital-rotate',
    wave: 'wave-bounce',
    leapfrog: 'leapfrog-jump',
    pulse: 'pulse-scale'
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className={`relative w-32 h-32 sm:w-64 sm:h-64 mx-auto mb-4 animate-${animations[animation]}`}>
          {/* Red dot */}
          <div 
            className="absolute w-8 h-8 sm:w-16 sm:h-16 rounded-full dot-1"
            style={{ backgroundColor: '#e22020' }}
          />
          {/* Blue dot */}
          <div 
            className="absolute w-8 h-8 sm:w-16 sm:h-16 rounded-full dot-2"
            style={{ backgroundColor: '#2737cc' }}
          />
          {/* Yellow dot */}
          <div 
            className="absolute w-8 h-8 sm:w-16 sm:h-16 rounded-full dot-3"
            style={{ backgroundColor: '#ffce00' }}
          />
        </div>
        
        {message && (
          <p className="text-white text-lg sm:text-2xl font-bold">{message}</p>
        )}
      </div>

      <style jsx global>{`
        /* Orbital Animation */
        @keyframes orbital-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .animate-orbital-rotate .dot-1 {
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          animation: orbital-dot-1 2s ease-in-out infinite;
        }
        
        .animate-orbital-rotate .dot-2 {
          top: 50%;
          right: 0;
          transform: translateY(-50%);
          animation: orbital-dot-2 2s ease-in-out infinite 0.66s;
        }
        
        .animate-orbital-rotate .dot-3 {
          bottom: 0;
          left: 25%;
          animation: orbital-dot-3 2s ease-in-out infinite 1.33s;
        }

        @keyframes orbital-dot-1 {
          0%, 100% { transform: translateX(-50%) scale(1) rotate(0deg); }
          50% { transform: translateX(-50%) scale(1.2) rotate(180deg); }
        }
        
        @keyframes orbital-dot-2 {
          0%, 100% { transform: translateY(-50%) scale(1) rotate(0deg); }
          50% { transform: translateY(-50%) scale(1.2) rotate(180deg); }
        }
        
        @keyframes orbital-dot-3 {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
        }

        /* Wave Bounce Animation */
        @keyframes wave-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        
        .animate-wave-bounce .dot-1 {
          top: 50%;
          left: 16%;
          transform: translateY(-50%);
          animation: wave-bounce 1.2s ease-in-out infinite;
        }
        
        .animate-wave-bounce .dot-2 {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: wave-bounce 1.2s ease-in-out infinite 0.2s;
        }
        
        .animate-wave-bounce .dot-3 {
          top: 50%;
          right: 16%;
          transform: translateY(-50%);
          animation: wave-bounce 1.2s ease-in-out infinite 0.4s;
        }

        /* Leapfrog Animation */
        @keyframes leapfrog-jump {
          0%, 100% { transform: translateX(0) translateY(0) scale(1); }
          33% { transform: translateX(24px) translateY(-16px) scale(0.8); }
          66% { transform: translateX(48px) translateY(0) scale(1); }
        }
        
        .animate-leapfrog-jump .dot-1 {
          top: 50%;
          left: 8%;
          transform: translateY(-50%);
          animation: leapfrog-jump 2s ease-in-out infinite;
        }
        
        .animate-leapfrog-jump .dot-2 {
          top: 50%;
          left: 28%;
          transform: translateY(-50%);
          animation: leapfrog-jump 2s ease-in-out infinite 0.66s;
        }
        
        .animate-leapfrog-jump .dot-3 {
          top: 50%;
          left: 48%;
          transform: translateY(-50%);
          animation: leapfrog-jump 2s ease-in-out infinite 1.33s;
        }

        /* Pulse Scale Animation */
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 0.7; }
        }
        
        .animate-pulse-scale .dot-1 {
          top: 25%;
          left: 50%;
          transform: translateX(-50%);
          animation: pulse-scale 1.8s ease-in-out infinite;
        }
        
        .animate-pulse-scale .dot-2 {
          top: 50%;
          left: 25%;
          transform: translateY(-50%);
          animation: pulse-scale 1.8s ease-in-out infinite 0.6s;
        }
        
        .animate-pulse-scale .dot-3 {
          top: 50%;
          right: 25%;
          transform: translateY(-50%);
          animation: pulse-scale 1.8s ease-in-out infinite 1.2s;
        }

        /* Performance optimizations */
        .animate-orbital-rotate,
        .animate-wave-bounce,
        .animate-leapfrog-jump,
        .animate-pulse-scale {
          will-change: transform;
        }
        
        .animate-orbital-rotate .dot-1,
        .animate-orbital-rotate .dot-2,
        .animate-orbital-rotate .dot-3,
        .animate-wave-bounce .dot-1,
        .animate-wave-bounce .dot-2,
        .animate-wave-bounce .dot-3,
        .animate-leapfrog-jump .dot-1,
        .animate-leapfrog-jump .dot-2,
        .animate-leapfrog-jump .dot-3,
        .animate-pulse-scale .dot-1,
        .animate-pulse-scale .dot-2,
        .animate-pulse-scale .dot-3 {
          will-change: transform, opacity;
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  )
}

export default AnimatedLoadingScreen