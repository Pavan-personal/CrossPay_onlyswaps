/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#000000',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f3f4f6',
          foreground: '#000000',
        },
        accent: {
          DEFAULT: '#f9fafb',
          foreground: '#000000',
        },
        muted: {
          DEFAULT: '#f3f4f6',
          foreground: '#6b7280',
        },
        border: '#e5e7eb',
        input: '#d1d5db',
        ring: '#000000',
        background: '#ffffff',
        foreground: '#000000',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#000000',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#000000',
        },
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
