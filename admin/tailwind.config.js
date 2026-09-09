/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep Modern Navy / Royal Blue Palette (Sidebar & Accents)
        adminNavy: {
          DEFAULT: '#0F172A',
          dark: '#070C1E',
          sidebar: '#0F172A', // Deep Navy / Slate 900
          sidebarCard: '#1E293B',
          border: '#334155',
          active: '#2563EB',
          hover: '#1E293B',
          accent: '#38BDF8',
        },
        brandBlue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#0F172A',
        },
        // White Content Surface Mappings
        obsidian: {
          DEFAULT: '#F8FAFC',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          elevated: '#F8FAFC',
          border: '#E2E8F0',
          borderLight: '#CBD5E1',
        },
        plum: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#64748B',
          400: '#475569',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#0F172A',
          950: '#0B132B',
        },
        gold: {
          light: '#60A5FA',
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#2563EB',
          400: '#1D4ED8',
          500: '#1E40AF',
          600: '#1E3A8A',
        },
        sensein: {
          DEFAULT: '#5A3859',
          plum: '#5A3859',
          gold: '#D4AF37',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Outfit"', 'monospace'],
      },
      boxShadow: {
        adminCard: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        adminCardHover: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        cardLuxury: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        blueGlow: '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        goldGlow: '0 0 15px -3px rgba(37, 99, 235, 0.25)',
      },
    },
  },
  plugins: [],
}
