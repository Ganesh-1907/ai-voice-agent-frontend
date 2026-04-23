/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          dark: '#6366F1',
        },
        background: {
          light: '#F9FAFB',
          dark: '#0F172A',
        },
        card: {
          light: '#FFFFFF',
          dark: '#1E293B',
        },
        text: {
          primary: {
            light: '#111827',
            dark: '#E5E7EB',
          },
          secondary: {
            light: '#6B7280',
            dark: '#94A3B8',
          },
        },
        border: {
          light: '#E5E7EB',
          dark: '#334155',
        },
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
    },
  },
  plugins: [],
}
