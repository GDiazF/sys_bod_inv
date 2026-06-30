import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-grid': 'var(--bg-grid)',
        surface: {
          DEFAULT: 'var(--surface)',
          raised: 'var(--surface-raised)',
          inset: 'var(--surface-inset)',
        },
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        steel: {
          DEFAULT: 'var(--steel)',
          mid: 'var(--steel-mid)',
          light: 'var(--steel-light)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          bright: 'var(--accent-bright)',
          muted: 'var(--accent-muted)',
          fg: 'var(--accent-fg)',
        },
        teal: {
          DEFAULT: 'var(--teal)',
          bg: 'var(--teal-bg)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          bg: 'var(--warn-bg)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          bg: 'var(--danger-bg)',
        },
        success: {
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
        },
        info: {
          DEFAULT: 'var(--info)',
          bg: 'var(--info-bg)',
        },
        sidebar: {
          bg: 'var(--sidebar-bg)',
          surface: 'var(--sidebar-surface)',
          fg: 'var(--sidebar-fg)',
          muted: 'var(--sidebar-muted)',
          border: 'var(--sidebar-border)',
          rail: 'var(--sidebar-rail)',
          accent: 'var(--sidebar-accent)',
        },
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        gutter: 'var(--content-gutter)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        panel: 'var(--shadow-panel)',
      },
      width: {
        sidebar: 'var(--sidebar-w)',
      },
      height: {
        header: 'var(--header-h)',
      },
      maxHeight: {
        table: 'var(--table-max-h)',
        'table-tall': 'var(--table-tall-max-h)',
        'panel-scroll': 'var(--panel-scroll-max-h)',
      },
      maxWidth: {
        readable: 'var(--content-readable)',
      },
      screens: {
        tablet: '1024px',
        desktop: '1280px',
        wide: '1536px',
      },
    },
  },
  plugins: [],
} satisfies Config
