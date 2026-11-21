// Tailwind runtime config. Colour and font values mirror the CSS variables in public/theme.css.
const IH_SANS = ['"Atkinson Hyperlegible Next"', 'ui-sans-serif', 'system-ui', 'sans-serif'];
const IH_DISPLAY = ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'];

tailwind.config = {
  // Light only: no element ever carries a .dark class, so any stray dark: utility stays inert.
  darkMode: 'class',
  theme: {
    extend: {
      // Nested keys merge with Tailwind's default scales, so emerald-500, amber-100 … keep working.
      colors: {
        paper: { DEFAULT: '#F7F5EF', deep: '#EFEBE1' },
        surface: '#FFFFFF',
        ink: { DEFAULT: '#14211F', soft: '#2A3936' },
        muted: { DEFAULT: '#5B6B68', faint: '#8A9794' },
        line: { DEFAULT: '#E3DFD3', strong: '#CEC8B6' },
        emerald: { DEFAULT: '#059669', bright: '#10B981', deep: '#047857', tint: '#E6F4EC' },
        teal: { DEFAULT: '#14B8A6', deep: '#0F766E', tint: '#E3F4F1' },
        kontrak: { DEFAULT: '#3B2E8C', soft: '#5B4DB0', tint: '#EEEBF8', line: '#CFC8EC' },
        amber: { DEFAULT: '#B45309', tint: '#FDF4E4', line: '#EBC98E' },
        danger: { DEFAULT: '#B42318', tint: '#FCEBE8', line: '#EFB8B0' },
      },
      fontFamily: {
        sans: IH_SANS,
        display: IH_DISPLAY,
        // Legacy keys kept so existing pages keep rendering; they now resolve to the v2 families.
        jakarta: IH_DISPLAY,
        geist: IH_SANS,
      },
      fontSize: {
        'display-xl': ['2.75rem', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '800' }],
        'display-l': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-m': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '700' }],
        title: ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '700' }],
      },
      borderRadius: {
        'ih-sm': '8px',
        'ih-md': '12px',
        'ih-lg': '18px',
        'ih-xl': '24px',
      },
      boxShadow: {
        DEFAULT: 'none',
        sm: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        'inner': 'none',
      },
      backdropBlur: {
        DEFAULT: '0',
        sm: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'pulse-slow': 'none',
      }
    }
  }
};
