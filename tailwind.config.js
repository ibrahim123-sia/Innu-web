/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        'primary-blue': {
          DEFAULT: '#002868',
          light: '#003a99',
          dark: '#001f4d',
          hover: '#0056b3',
          50: '#e6e9f2',
          100: '#ccd3e6',
          200: '#99a6cc',
          300: '#667ab3',
          400: '#334d99',
          500: '#002868',
          600: '#002053',
          700: '#00183e',
          800: '#00102a',
          900: '#000815',
        },
        'primary-red': {
          DEFAULT: '#BF0A30',
          light: '#d61c43',
          dark: '#990823',
          hover: '#8B0000',
          50: '#fde8ec',
          100: '#fbd1d9',
          200: '#f7a3b3',
          300: '#f3758e',
          400: '#ef4768',
          500: '#BF0A30',
          600: '#990823',
          700: '#73061a',
          800: '#4d0411',
          900: '#260209',
        },
        // Secondary Colors
        'secondary-blue': {
          DEFAULT: '#0056b3',
          light: '#0066cc',
          dark: '#004080',
        },
        'secondary-red': {
          DEFAULT: '#8B0000',
          light: '#a30000',
          dark: '#660000',
        },
        // Semantic Colors
        'brand': '#002868',
        'accent': '#BF0A30',
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'info': '#3b82f6',
      },
      backgroundColor: {
        'primary-blue': '#002868',
        'primary-red': '#BF0A30',
        'primary-blue-hover': '#0056b3',
        'primary-red-hover': '#8B0000',
        'primary-blue-light': '#e6e9f2',
        'primary-red-light': '#fde8ec',
      },
      textColor: {
        'primary-blue': '#002868',
        'primary-red': '#BF0A30',
        'primary-blue-hover': '#0056b3',
        'primary-red-hover': '#8B0000',
      },
      borderColor: {
        'primary-blue': '#002868',
        'primary-red': '#BF0A30',
      },
      ringColor: {
        'primary-blue': '#002868',
        'primary-red': '#BF0A30',
      },
      gradientColorStops: {
        'primary-blue': '#002868',
        'primary-red': '#BF0A30',
      },
    },
  },
  plugins: [],
}