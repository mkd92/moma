/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3fff8b',
        'primary-container': '#13ea79',
        'on-primary': '#005d2c',
        'surface-container': '#1a1a1a',
        'surface-container-low': '#131313',
        'surface-container-highest': '#262626',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
