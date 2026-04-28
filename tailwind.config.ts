
import type { Config } from "tailwindcss";
import { designSystem } from "./src/lib/design-tokens";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: designSystem.layout.container.padding,
      screens: {
        'sm': designSystem.layout.breakpoints.sm,
        'md': designSystem.layout.breakpoints.md,
        'lg': designSystem.layout.breakpoints.lg,
        'xl': designSystem.layout.breakpoints.xl,
        '2xl': designSystem.layout.container.maxWidth
      }
    },
    extend: {
      colors: {
        // Brand colors from design tokens
        'tpg-blue': designSystem.colors.brand.primary,
        'tpg-red': designSystem.colors.brand.secondary,
        'brand-accent': designSystem.colors.brand.accent,
        
        // Semantic colors
        semantic: {
          view: {
            DEFAULT: designSystem.colors.semantic.view.border,
            bg: designSystem.colors.semantic.view.background,
            text: designSystem.colors.semantic.view.text,
            'hover-bg': designSystem.colors.semantic.view.hover.background,
            'hover-text': designSystem.colors.semantic.view.hover.text,
          },
          edit: {
            DEFAULT: designSystem.colors.semantic.edit.background,
            bg: designSystem.colors.semantic.edit.background,
            text: designSystem.colors.semantic.edit.text,
            'hover-bg': designSystem.colors.semantic.edit.hover.background,
          },
          export: {
            DEFAULT: designSystem.colors.semantic.export.background,
            bg: designSystem.colors.semantic.export.background,
            text: designSystem.colors.semantic.export.text,
            'hover-bg': designSystem.colors.semantic.export.hover.background,
            'hover-text': designSystem.colors.semantic.export.hover.text,
          },
          delete: {
            DEFAULT: designSystem.colors.semantic.delete.text,
            text: designSystem.colors.semantic.delete.text,
            'hover-bg': designSystem.colors.semantic.delete.hover.background,
            'hover-text': designSystem.colors.semantic.delete.hover.text,
          },
          create: {
            DEFAULT: designSystem.colors.semantic.create.background,
            bg: designSystem.colors.semantic.create.background,
            text: designSystem.colors.semantic.create.text,
            'hover-bg': designSystem.colors.semantic.create.hover.background,
          },
        },
        
        // Status colors
        status: {
          draft: {
            DEFAULT: designSystem.colors.status.draft.background,
            bg: designSystem.colors.status.draft.background,
            text: designSystem.colors.status.draft.text,
            border: designSystem.colors.status.draft.border,
          },
          submitted: {
            DEFAULT: designSystem.colors.status.submitted.background,
            bg: designSystem.colors.status.submitted.background,
            text: designSystem.colors.status.submitted.text,
            border: designSystem.colors.status.submitted.border,
          },
          final: {
            DEFAULT: designSystem.colors.status.final.background,
            bg: designSystem.colors.status.final.background,
            text: designSystem.colors.status.final.text,
            border: designSystem.colors.status.final.border,
          },
          published: {
            DEFAULT: designSystem.colors.status.published.background,
            bg: designSystem.colors.status.published.background,
            text: designSystem.colors.status.published.text,
            border: designSystem.colors.status.published.border,
          },
          overdue: {
            DEFAULT: designSystem.colors.status.overdue.background,
            bg: designSystem.colors.status.overdue.background,
            text: designSystem.colors.status.overdue.text,
            border: designSystem.colors.status.overdue.border,
          },
        },
        
        // Neutral colors
        neutral: designSystem.colors.neutral,
        
        // Feedback colors
        feedback: {
          success: {
            DEFAULT: designSystem.colors.feedback.success.background,
            bg: designSystem.colors.feedback.success.background,
            text: designSystem.colors.feedback.success.text,
            border: designSystem.colors.feedback.success.border,
          },
          warning: {
            DEFAULT: designSystem.colors.feedback.warning.background,
            bg: designSystem.colors.feedback.warning.background,
            text: designSystem.colors.feedback.warning.text,
            border: designSystem.colors.feedback.warning.border,
          },
          error: {
            DEFAULT: designSystem.colors.feedback.error.background,
            bg: designSystem.colors.feedback.error.background,
            text: designSystem.colors.feedback.error.text,
            border: designSystem.colors.feedback.error.border,
          },
          info: {
            DEFAULT: designSystem.colors.feedback.info.background,
            bg: designSystem.colors.feedback.info.background,
            text: designSystem.colors.feedback.info.text,
            border: designSystem.colors.feedback.info.border,
          },
        },
        
        // Keep existing CSS variables for shadcn/ui compatibility
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        
        // Sidebar colors
        sidebar: {
          background: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          input: 'hsl(var(--sidebar-input))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      fontFamily: {
        sans: designSystem.typography.fontFamily.sans,
        mono: designSystem.typography.fontFamily.mono,
      },
      fontSize: designSystem.typography.fontSize,
      fontWeight: designSystem.typography.fontWeight,
      lineHeight: designSystem.typography.lineHeight,
      letterSpacing: designSystem.typography.letterSpacing,
      spacing: designSystem.spacing,
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      boxShadow: designSystem.shadows,
      transitionDuration: designSystem.animations.duration,
      transitionTimingFunction: designSystem.animations.easing,
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
