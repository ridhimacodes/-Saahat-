/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#6C2BD9",
          darkPurple: "#4C1D95",
          softPurple: "#F3E8FF",
          lavender: "#F8F5FF",
          pink: "#FF4D8D",
          lightPink: "#FFF0F5",
          gold: "#FFC857",
          warmGold: "#FEF08A",
          teal: "#00C2A8",
          softTeal: "#E6FFFA",
        }
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      animation: {
        'float-slow': 'float 4s ease-in-out infinite',
        'float-medium': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s infinite',
        'draw-path': 'drawPath 2s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(255, 77, 141, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(108, 43, 217, 0.6)' },
        },
        drawPath: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        }
      }
    },
  },
  plugins: [],
}
