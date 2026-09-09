/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 🎨 Primary Brand Color: Sensein.in Signature Plum (#5A3859)
        primary: {
          DEFAULT: '#5A3859',
          light: '#7B4D7A',
          dark: '#4B2F4A',
          deep: '#3A2339',
        },
        sensein: {
          DEFAULT: '#5A3859',
          plum: '#5A3859',
          dark: '#4B2F4A',
          light: '#F2EDF1',
          cream: '#FAF7F9',
          accent: '#D4AF37',
        },
        rosegold: {
          DEFAULT: '#5A3859',
          light: '#7B4D7A',
          dark: '#4B2F4A',
        },
        plum: {
          DEFAULT: '#5A3859',
          light: '#F2EDF1',
          dark: '#4B2F4A',
        },
        ivory: {
          DEFAULT: '#FAF6F7',
          50: '#FFFFFF',
          100: '#FAF6F7',
          200: '#F5EDF1',
          300: '#EAE1E6',
        },
        cream: {
          DEFAULT: '#FAF6F7',
          light: '#FAF6F7',
          dark: '#F5EDF1',
        },
        secondary: {
          DEFAULT: '#ffffff',
        },
        charcoal: {
          DEFAULT: '#111111',
          light: '#333333',
          dark: '#000000',
        },
        rosegold: {
          DEFAULT: '#1c1c1c',
          light: '#333333',
          dark: '#000000',
        },

        // ✨ Luxury Gold Accent (#D4AF37)
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E6CA65',
          dark: '#A88820',
        },
        accent: {
          DEFAULT: '#D4AF37',
          light: '#E6CA65',
          dark: '#A88820',
        },
        amber: {
          400: '#D4AF37',
          500: '#5B2C54',
          600: '#3E1C39',
        },
        nude: {
          50: '#F8F3F7',
          100: '#EFE4EE',
          200: '#E0CFDF',
          300: '#7D4174',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        luxury: ['"Cinzel"', 'serif'],
        mono: ['"Outfit"', 'monospace'],
      },
      borderRadius: {
        card: '1rem',
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(91, 44, 84, 0.22)',
        luxury: '0 10px 30px -10px rgba(91, 44, 84, 0.35)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
