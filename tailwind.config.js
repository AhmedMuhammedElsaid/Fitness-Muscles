/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E8DEB5',
          dark: '#C4B98A',
        },
        background: '#1A1A1A',
        surface: {
          DEFAULT: '#2A2A2A',
          elevated: '#333333',
        },
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0A0A0',
        'text-muted': '#666666',
        success: '#4CAF50',
        warning: '#FFC107',
        danger: '#EF4444',
        border: '#3A3A3A',
        'progress-track': '#3A3A3A',
        'progress-fill': '#E8DEB5',
      },
      fontFamily: {
        sans: ['Inter'],
        serif: ['PlayfairDisplay'],
      },
      borderRadius: {
        card: '16px',
        button: '24px',
      },
    },
  },
  plugins: [],
};
