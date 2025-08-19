/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      // Device-specific breakpoints
      'mobile': {'max': '767px'},
      'tablet': {'min': '768px', 'max': '1023px'},
      'desktop': {'min': '1024px'},
      // Orientation breakpoints
      'portrait': {'raw': '(orientation: portrait)'},
      'landscape': {'raw': '(orientation: landscape)'},
      // Touch device detection
      'touch': {'raw': '(hover: none) and (pointer: coarse)'},
      'no-touch': {'raw': '(hover: hover) and (pointer: fine)'},
    },
    extend: {
      // Mobile-first spacing system
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        '18': '4.5rem',
        '88': '22rem',
      },
      // Touch-friendly sizing
      minHeight: {
        'touch': '44px',
        'screen-mobile': '100dvh',
      },
      minWidth: {
        'touch': '44px',
      },
      // Mobile-first font sizes
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        // Mobile-optimized heading sizes
        'heading-mobile': ['1.5rem', { lineHeight: '1.75rem' }],
        'heading-tablet': ['2rem', { lineHeight: '2.5rem' }],
        'heading-desktop': ['2.5rem', { lineHeight: '3rem' }],
      },
      // Responsive typography
      typography: {
        sm: {
          css: {
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
          },
        },
        DEFAULT: {
          css: {
            maxWidth: 'none',
            fontSize: '1rem',
            lineHeight: '1.5rem',
          },
        },
      },
      // Animation for mobile interactions
      animation: {
        'bounce-subtle': 'bounce 0.3s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      // Mobile-first shadows
      boxShadow: {
        'mobile': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'mobile-lg': '0 4px 8px rgba(0, 0, 0, 0.15)',
        'tablet': '0 8px 16px rgba(0, 0, 0, 0.1)',
        'desktop': '0 12px 24px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [
    // Enhanced utilities for mobile-first responsive design
    function({ addUtilities, addComponents, theme }) {
      const newUtilities = {
        // Line clamp utilities
        '.line-clamp-1': {
          display: '-webkit-box',
          '-webkit-line-clamp': '1',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-2': {
          display: '-webkit-box',
          '-webkit-line-clamp': '2',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-3': {
          display: '-webkit-box',
          '-webkit-line-clamp': '3',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        // Touch-friendly utilities
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.tap-highlight-transparent': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        // Safe area utilities
        '.pt-safe': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.pb-safe': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.pl-safe': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.pr-safe': {
          'padding-right': 'env(safe-area-inset-right)',
        },
        // Viewport height utilities for mobile browsers
        '.h-screen-mobile': {
          height: '100vh',
          height: '100dvh', // Dynamic viewport height for mobile browsers
        },
        '.min-h-screen-mobile': {
          'min-height': '100vh',
          'min-height': '100dvh',
        },
        // Scrolling utilities
        '.scroll-smooth': {
          'scroll-behavior': 'smooth',
        },
        '.overscroll-none': {
          'overscroll-behavior': 'none',
        },
        // Text rendering optimization
        '.text-render-optimized': {
          'text-rendering': 'optimizeLegibility',
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
      }
      
      const newComponents = {
        // Responsive container components
        '.container-mobile': {
          width: '100%',
          'max-width': '100%',
          'padding-left': theme('spacing.4'),
          'padding-right': theme('spacing.4'),
          'margin-left': 'auto',
          'margin-right': 'auto',
        },
        '.container-tablet': {
          '@media (min-width: 768px)': {
            'max-width': '768px',
            'padding-left': theme('spacing.6'),
            'padding-right': theme('spacing.6'),
          },
        },
        '.container-desktop': {
          '@media (min-width: 1024px)': {
            'max-width': '1200px',
            'padding-left': theme('spacing.8'),
            'padding-right': theme('spacing.8'),
          },
        },
        // Button components with touch optimization
        '.btn-mobile': {
          'min-height': '44px',
          'min-width': '44px',
          'padding': `${theme('spacing.3')} ${theme('spacing.4')}`,
          'border-radius': theme('borderRadius.lg'),
          'font-weight': theme('fontWeight.medium'),
          'touch-action': 'manipulation',
          '-webkit-tap-highlight-color': 'transparent',
          'transition': 'all 0.2s ease-in-out',
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        // Card components with responsive design
        '.card-mobile': {
          'background-color': theme('colors.white'),
          'border-radius': theme('borderRadius.xl'),
          'box-shadow': theme('boxShadow.mobile'),
          'padding': theme('spacing.4'),
          '@media (min-width: 768px)': {
            'box-shadow': theme('boxShadow.tablet'),
            'padding': theme('spacing.6'),
          },
          '@media (min-width: 1024px)': {
            'box-shadow': theme('boxShadow.desktop'),
            'padding': theme('spacing.8'),
          },
        },
        // Modal components with responsive behavior
        '.modal-mobile': {
          'position': 'fixed',
          'inset': '0',
          'z-index': '50',
          'padding': theme('spacing.4'),
          '@media (min-width: 768px)': {
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'padding': theme('spacing.6'),
          },
        },
      }
      
      addUtilities(newUtilities)
      addComponents(newComponents)
    }
  ],
}