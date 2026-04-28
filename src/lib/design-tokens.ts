/**
 * Design System Tokens
 * Centralized design tokens for consistent styling across the application
 */

// === COLOR TOKENS ===
export const colors = {
  brand: {
    primary: '#0A2463',    // TPG Blue
    secondary: '#D90429',  // TPG Red
    accent: '#3B82F6',     // Blue-500 for interactive elements
  },
  semantic: {
    view: {
      background: '#F8FAFC',
      border: '#CBD5E1',
      text: '#1E40AF',
      hover: {
        background: '#EFF6FF',
        text: '#1D4ED8',
      },
    },
    edit: {
      background: '#2563EB',
      text: '#FFFFFF',
      hover: {
        background: '#1D4ED8',
      },
    },
    export: {
      background: '#DCFCE7',
      text: '#166534',
      hover: {
        background: '#BBF7D0',
        text: '#15803D',
      },
    },
    delete: {
      text: '#DC2626',
      hover: {
        background: '#FEF2F2',
        text: '#B91C1C',
      },
    },
    create: {
      background: '#0A2463',
      text: '#FFFFFF',
      hover: {
        background: '#082048',
      },
    },
  },
  status: {
    draft: {
      background: '#DBEAFE',
      text: '#2563EB',
      border: '#93C5FD',
    },
    submitted: {
      background: '#DCFCE7',
      text: '#16A34A',
      border: '#86EFAC',
    },
    final: {
      background: '#FEF3C7',
      text: '#D97706',
      border: '#FCD34D',
    },
    published: {
      background: '#F3E8FF',
      text: '#9333EA',
      border: '#C4B5FD',
    },
    overdue: {
      background: '#FEE2E2',
      text: '#DC2626',
      border: '#FCA5A5',
    },
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  feedback: {
    success: {
      background: '#DCFCE7',
      text: '#166534',
      border: '#86EFAC',
    },
    warning: {
      background: '#FEF3C7',
      text: '#D97706',
      border: '#FCD34D',
    },
    error: {
      background: '#FEE2E2',
      text: '#DC2626',
      border: '#FCA5A5',
    },
    info: {
      background: '#DBEAFE',
      text: '#2563EB',
      border: '#93C5FD',
    },
  },
} as const;

// === TYPOGRAPHY TOKENS ===
export const typography = {
  fontFamily: {
    sans: ['Inter', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
} as const;

// === SPACING TOKENS ===
export const spacing = {
  px: '1px',
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  11: '2.75rem',  // 44px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
} as const;

// === COMPONENT TOKENS ===
export const components = {
  button: {
    borderRadius: '0.375rem',
    padding: {
      sm: '0.5rem 0.75rem',
      md: '0.625rem 1rem',
      lg: '0.75rem 1.5rem',
    },
    fontSize: {
      sm: '0.875rem',
      md: '0.875rem',
      lg: '1rem',
    },
    fontWeight: '500',
    minHeight: {
      sm: '2.25rem',
      md: '2.5rem',
      lg: '2.75rem',
    },
  },
  card: {
    borderRadius: '0.5rem',
    padding: '1rem',
    paddingDesktop: '1.5rem',
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  input: {
    borderRadius: '0.375rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    borderWidth: '1px',
    minHeight: '2.5rem',
  },
  sidebar: {
    width: {
      collapsed: '4rem',
      expanded: '16rem',
    },
    transition: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// === ANIMATION TOKENS ===
export const animations = {
  transition: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
} as const;

// === LAYOUT TOKENS ===
export const layout = {
  container: {
    maxWidth: '1400px',
    padding: '1.5rem',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1400px',
  },
  zIndex: {
    modal: 50,
    dropdown: 40,
    header: 30,
    sidebar: 20,
    overlay: 10,
  },
} as const;

// === SHADOWS ===
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
} as const;

// === EXPORT CONSOLIDATED DESIGN SYSTEM ===
export const designSystem = {
  colors,
  typography,
  spacing,
  components,
  animations,
  layout,
  shadows,
} as const;

// === TYPE EXPORTS ===
export type SemanticAction = keyof typeof colors.semantic;
export type StatusType = keyof typeof colors.status;
export type FeedbackType = keyof typeof colors.feedback;
export type NeutralShade = keyof typeof colors.neutral;
export type ComponentSize = 'sm' | 'md' | 'lg';
export type TransitionSpeed = keyof typeof animations.transition;