// --- START OF FILE frontend/tailwind.config.js ---
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable dark mode via class
  theme: {
    extend: {
      colors: {
        // Define custom colors for sci-fi minimalist palette
        // Example: dark background, accent colors
        primary: { // Dark background
          DEFAULT: '#1a202c', // Equivalent to Tailwind gray-900
          light: '#2d3748', // Equivalent to Tailwind gray-800
          lighter: '#4a5568', // Equivalent to Tailwind gray-700
        },
        accent: { // Accent colors
          blue: '#4299e1', // Tailwind blue-500
          green: '#48bb78', // Tailwind green-500
          red: '#f56565', // Tailwind red-500
          yellow: '#f6e05e', // Tailwind yellow-400
        },
      },
      fontFamily: {
        // Optional: Add a sci-fi looking font
        // mono: ['Space Mono', 'monospace'],
        // sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        // Optional: Custom shadow for panels
        'sci-fi': '0 0 10px rgba(66, 153, 225, 0.5)', // Accent blue glow
      }
    },
  },
  plugins: [],
}
// --- END OF FILE frontend/tailwind.config.js ---