/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Keep class-based dark mode consistent with the existing data-theme system
  darkMode: 'class',
  theme: {
    extend: {
      // ── Design Tokens (replaces all hardcoded hex values in CSS) ──────────
      colors: {
        // Dark navy palette (sidebar, topnav, active tab, sub-header)
        navy: {
          950: '#09122a',
          900: '#0b1426',
          800: '#0f2544',
          700: '#112555',
          600: '#15223c',
          500: '#1c2d4a',
          400: '#1e293b',
        },
        // Brand gold accent (border highlight, active row, icons)
        gold: {
          DEFAULT: '#c9973c',
          dark:    '#a87c26',
          deep:    '#412402',
          light:   '#f4e6c8',
          muted:   '#e8cf9c',
        },
        // Panel backgrounds (light mode)
        panel: {
          DEFAULT: 'var(--panel)',
          2:       'var(--panel2)',
        },
        // Semantic text
        'text-body': 'var(--text)',
        'text-heading': 'var(--text-h)',
        'text-muted': 'var(--muted)',
        // Borders
        'border-base': 'var(--border)',
        // Background
        'bg-base': 'var(--bg)',
        // Accent (same as gold but CSS-var-driven)
        accent: 'var(--accent)',
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['8.5px', { lineHeight: '1.2' }],
        xs:    ['9.5px', { lineHeight: '1.3' }],
        sm:    ['10.5px', { lineHeight: '1.4' }],
        base:  ['11px',  { lineHeight: '1.5' }],
        md:    ['12px',  { lineHeight: '1.5' }],
        lg:    ['13px',  { lineHeight: '1.6' }],
        xl:    ['14px',  { lineHeight: '1.6' }],
      },

      // ── Spacing ─────────────────────────────────────────────────────────────
      spacing: {
        '4.5': '18px',
        '13':  '52px',
        '15':  '60px',
        '18':  '72px',
      },

      // ── Height/Width tokens ─────────────────────────────────────────────────
      height: {
        topnav:  '40px',
        sidebar: 'calc(100vh - 40px)',
        'tab-bar': '40px',
      },
      width: {
        sidebar: '220px',
      },

      // ── Border Radius ────────────────────────────────────────────────────────
      borderRadius: {
        tab: '8px',
      },

      // ── Box Shadow ───────────────────────────────────────────────────────────
      boxShadow: {
        panel: 'var(--shadow)',
        'gold-inset': 'inset 0 3px 0 0 #c9973c',
        'tab-left':   '4px 0 0 0 #0f2544',
        'tab-right':  '-4px 0 0 0 #0f2544',
      },
    },
  },
  plugins: [],
}
