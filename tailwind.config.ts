import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./actions/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['var(--font-poppins)', 'sans-serif'],
      },
      colors: {
        // Pastel page palette
        lavender:  '#F5F0FF',
        lavender2: '#EDE9FE',
        lavender3: '#DDD6FE',

        // Light theme surfaces
        surface:   '#FFFFFF',
        surface2:  '#F5F0FF',
        surface3:  '#F1F5FF',

        // Brand
        primary:      '#4F46E5',
        primaryLight: '#EEF2FF',
        primaryDark:  '#3730A3',

        // Sidebar (deep indigo → violet)
        sidebar: {
          from: '#3730A3',
          mid:  '#4338CA',
          to:   '#5B21B6',
        },

        // Text
        textPrimary:   '#1E1B4B',
        textSecondary: '#6B7280',
        textMuted:     '#9CA3AF',

        // Borders
        borderColor: '#E0E7FF',

        // Legacy — kept for meeting-room dark theme
        dark1:  "var(--dark1)",
        dark2:  "var(--dark2)",
        blue1:  "var(--blue1)",
        sky1:   "var(--sky1)",
        sky2:   "#ECF0FF",
        sky3:   "#F5FCFF",
        orange: "#FF742E",
        purple: "#830EF9",
        yellow: "#F9A90E",
      },
      backgroundImage: {
        'hero':              "url('/icons/image-home.png')",
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'sidebar-gradient':  'linear-gradient(180deg, #3730A3 0%, #4338CA 50%, #5B21B6 100%)',
        'card-shimmer':      'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      },
      boxShadow: {
        'card':        '0 2px 12px rgba(99,102,241,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'card-hover':  '0 12px 32px rgba(99,102,241,0.14), 0 4px 8px rgba(0,0,0,0.06)',
        'nav':         '0 1px 3px rgba(0,0,0,0.05)',
        'sidebar':     '4px 0 24px rgba(67,56,202,0.18)',
        'glow-violet': '0 0 20px rgba(124,58,237,0.25)',
        'glow-indigo': '0 0 20px rgba(99,102,241,0.25)',
      },
      animation: {
        'fade-in':       'fadeIn 0.3s ease-in-out',
        'slide-up':      'slideUp 0.35s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'float':         'float 3s ease-in-out infinite',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        slideInLeft: {
          '0%':   { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl':   '1.5rem',
        '4xl':   '2rem',
      },
    },
  },
  plugins: [],
};

export default config;
