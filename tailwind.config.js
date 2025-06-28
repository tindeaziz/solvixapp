/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Couleurs principales Solvix
        'solvix-blue': '#1B4B8C',
        'solvix-orange': '#FF6B35',
        'solvix-dark': '#212529',
        'solvix-light': '#F8F9FA',
        
        // Couleurs fonctionnelles
        'solvix-success': '#28A745',
        'solvix-error': '#DC3545',
        'solvix-warning': '#FFC107',
        
        // Variations pour les états
        'solvix-blue-light': '#2563EB',
        'solvix-blue-dark': '#1E3A8A',
        'solvix-orange-light': '#FB923C',
        'solvix-orange-dark': '#EA580C',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'solvix': '0 4px 6px -1px rgba(27, 75, 140, 0.1), 0 2px 4px -1px rgba(27, 75, 140, 0.06)',
        'solvix-lg': '0 10px 15px -3px rgba(27, 75, 140, 0.1), 0 4px 6px -2px rgba(27, 75, 140, 0.05)',
      },
      animation: {
        'in': 'fadeIn 0.3s ease-out',
        'zoom-in-95': 'zoomIn95 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        zoomIn95: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};