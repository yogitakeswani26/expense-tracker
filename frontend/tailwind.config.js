/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FFFBF0',
          100: '#FFF5E6',
          200: '#FFE4B5',
          300: '#FFD966',
          400: '#FFC107',
          500: '#FFB81C',
          600: '#FFA500',
          700: '#FF9500',
          800: '#FF8C00',
          900: '#DAA520',
        },
        primary: '#FFB81C',
        secondary: '#FFA500',
        accent: '#DAA520',
        danger: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        dark: '#1F2937',
        light: '#F9F9F9',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #FFB81C 0%, #FFA500 100%)',
        'gradient-dark-gold': 'linear-gradient(135deg, #1F2937 0%, #FFB81C 100%)',
      },
      boxShadow: {
        'gold': '0 10px 30px rgba(255, 184, 28, 0.2)',
        'gold-lg': '0 20px 50px rgba(255, 184, 28, 0.3)',
      },
    },
  },
  plugins: [],
}
