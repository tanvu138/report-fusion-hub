System Prompt: Design System Consolidation Task

  Objective

  Consolidate scattered CSS files into a unified design system with centralized tokens, comprehensive
   documentation, and semantic component variants.

  Prerequisites

  - TypeScript/React project with Tailwind CSS
  - Multiple CSS files scattered across the codebase
  - Existing shadcn/ui components
  - Git repository with feature branch workflow

  Step-by-Step Implementation

  1. Analysis Phase

  # Find all CSS files in the project
  find . -name "*.css" -not -path "./node_modules/*"

  # Identify files to consolidate (typical targets):
  # - src/App.css
  # - src/styles/*.css
  # - src/components/**/*.css
  # - Any component-specific CSS files

  # Review existing Tailwind config
  cat tailwind.config.ts

  2. Design Token Architecture

  Create src/lib/design-tokens.ts with this structure:

  // === COLOR TOKENS ===
  export const colors = {
    brand: {
      primary: '#0A2463',    // Your brand primary
      secondary: '#D90429',  // Your brand secondary
    },
    semantic: {
      view: { background: '', border: '', text: '', hover: { background: '', text: '' } },
      edit: { background: '', text: '', hover: { background: '' } },
      export: { background: '', text: '', hover: { background: '', text: '' } },
      delete: { text: '', hover: { background: '', text: '' } },
      create: { background: '', text: '', hover: { background: '' } },
    },
    status: {
      draft: { background: '', text: '', border: '' },
      submitted: { background: '', text: '', border: '' },
      final: { background: '', text: '', border: '' },
      published: { background: '', text: '', border: '' },
      overdue: { background: '', text: '', border: '' },
    },
    neutral: { /* 50-900 scale */ },
    feedback: { success: {}, warning: {}, error: {}, info: {} },
  };

  // === TYPOGRAPHY TOKENS ===
  export const typography = {
    fontFamily: { sans: ['Inter', 'sans-serif'] },
    fontSize: { xs: '0.75rem', sm: '0.875rem', /* ... */ },
    fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
    lineHeight: { tight: '1.25', normal: '1.5', relaxed: '1.75' },
  };

  // === SPACING TOKENS ===
  export const spacing = {
    px: '1px', 0: '0', 1: '0.25rem', 2: '0.5rem', /* ... 24: '6rem' */
  };

  // === COMPONENT TOKENS ===
  export const components = {
    button: { borderRadius: '', padding: {}, fontSize: {} },
    card: { borderRadius: '', padding: '', shadow: '' },
    input: { borderRadius: '', padding: '', fontSize: '' },
  };

  // === ANIMATION TOKENS ===
  export const animations = {
    transition: { fast: '150ms ease-in-out', normal: '200ms ease-in-out', slow: '300ms ease-in-out'
  },
    easing: { easeIn: '', easeOut: '', easeInOut: '' },
  };

  // Export as const for type safety
  export const designSystem = { colors, typography, spacing, components, animations } as const;

  3. Utility Functions

  Create src/lib/design-utils.ts:

  import { designSystem } from './design-tokens';

  export function getSemanticColor(action: keyof typeof designSystem.colors.semantic) {
    return designSystem.colors.semantic[action];
  }

  export function getStatusColor(status: keyof typeof designSystem.colors.status) {
    return designSystem.colors.status[status];
  }

  export function getButtonVariantClasses(variant: keyof typeof designSystem.colors.semantic) {
    const classMap = {
      view: 'border border-semantic-view bg-background text-semantic-view-text 
  hover:bg-semantic-view-hover',
      edit: 'bg-semantic-edit text-white hover:bg-semantic-edit-hover',
      export: 'bg-semantic-export text-semantic-export-text hover:bg-semantic-export-hover',
      delete: 'text-semantic-delete-text hover:bg-semantic-delete-hover',
      create: 'bg-primary text-primary-foreground hover:bg-primary/90',
    };
    return classMap[variant];
  }

  // Add type guards, constants, and CSS custom properties generator

  4. Tailwind Configuration Integration

  Update tailwind.config.ts:

  import { designSystem } from "./src/lib/design-tokens";

  export default {
    theme: {
      extend: {
        colors: {
          // Brand colors
          'tpg-blue': designSystem.colors.brand.primary,
          'tpg-red': designSystem.colors.brand.secondary,

          // Semantic colors
          semantic: {
            view: { DEFAULT: designSystem.colors.semantic.view.border, /* ... */ },
            edit: { DEFAULT: designSystem.colors.semantic.edit.background, /* ... */ },
            // ... other semantic colors
          },

          // Status colors
          status: {
            draft: designSystem.colors.status.draft.background,
            // ... other status colors
          },

          // Keep existing CSS variables for shadcn/ui compatibility
          border: 'hsl(var(--border))',
          // ... other CSS variables
        },
        fontFamily: designSystem.typography.fontFamily,
        fontSize: designSystem.typography.fontSize,
        spacing: designSystem.spacing,
      }
    },
  } satisfies Config;

  5. Component Updates

  Update src/components/ui/button.tsx to add semantic variants:

  const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium 
  ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 
  focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none 
  disabled:opacity-50",
    {
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground hover:bg-primary/90",
          // ... existing variants

          // Add semantic variants
          view: "border border-semantic-view bg-background text-semantic-view-text 
  hover:bg-semantic-view-hover",
          edit: "bg-semantic-edit text-white hover:bg-semantic-edit-hover",
          export: "bg-semantic-export text-semantic-export-text hover:bg-semantic-export-hover",
          delete: "text-semantic-delete-text hover:bg-semantic-delete-hover",
          create: "bg-primary text-primary-foreground hover:bg-primary/90",
        },
      },
    }
  );

  6. CSS Consolidation Strategy

  Consolidate all CSS into src/index.css:

  @import
  url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  /* === CSS VARIABLES === */
  @layer base {
    :root {
      /* Keep existing CSS variables */
      --background: 0 0% 100%;
      /* ... */
    }
  }

  /* === CONSOLIDATED COMPONENT STYLES === */
  @layer components {

    /* Sidebar styles */
    .sidebar {
      transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Report management styles */
    .tab-transition {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Document preview styles */
    .document-container {
      line-height: 1.6;
      color: #374151;
    }

    /* Utility classes */
    .card-hover {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .focus-ring {
      @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
    }
  }

  /* === ANIMATIONS === */
  @layer utilities {
    .fade-in { animation: fadeIn 0.3s ease-in-out; }
    .slide-up { animation: slideUp 0.3s ease-out; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  }

  /* === RESPONSIVE DESIGN === */
  @media (max-width: 768px) {
    .responsive-grid { grid-template-columns: 1fr; }
  }

  /* === ACCESSIBILITY === */
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }

  7. Documentation Creation

  Create .labs/DESIGN-SYSTEM.md:

  # Design System Guide

  ## 🎨 Design Philosophy
  - **Consistency**: Unified visual language
  - **Accessibility**: WCAG 2.1 AA compliance
  - **Maintainability**: Centralized tokens
  - **Simplicity**: Clean, practical approach

  ## 🎯 Design Tokens
  ### Color System
  [Document all color tokens with examples]

  ### Typography
  [Document font families, sizes, weights]

  ### Spacing
  [Document spacing scale]

  ## 🔧 Component Patterns
  ### Button Component
  ```typescript
  <Button variant="view">View Report</Button>
  <Button variant="edit">Edit</Button>
  <Button variant="export">Export</Button>
  <Button variant="delete">Delete</Button>

  📱 Responsive Design

  [Document breakpoints and mobile patterns]

  ♿ Accessibility

  [Document accessibility features and requirements]

  🛠️ Development Guidelines

  [Document how to add new components and modify colors]

  #### 8. File Cleanup Process
  ```bash
  # Remove old CSS files
  rm src/App.css
  rm src/styles/sidebar.css
  rm src/styles/report-management.css
  rm src/components/reports/preview/document-preview.css

  # Verify no imports reference deleted files
  grep -r "import.*\.css" src/
  grep -r "App\.css\|sidebar\.css\|report-management\.css" src/

  9. Testing and Validation

  # Test the application
  npm run dev

  # Run linting
  npm run lint

  # Run type checking
  npm run type-check

  # Test responsive design
  # Test accessibility with screen reader
  # Test all button variants
  # Test print styles

  10. Git Workflow

  # Create feature branch
  git checkout -b feature/design-system-consolidation

  # Stage changes
  git add .

  # Commit with descriptive message
  git commit -m "feat: consolidate design system with centralized tokens and documentation

  - Consolidate 4 separate CSS files into unified index.css
  - Add comprehensive design tokens in TypeScript with semantic color system
  - Implement semantic button variants (view, edit, export, delete, create)
  - Create extensive design system documentation
  - Add utility functions for design token management
  - Integrate design tokens with Tailwind configuration"

  # Push branch
  git push -u origin feature/design-system-consolidation

  # Create pull request
  gh pr create --title "feat: consolidate design system with centralized tokens and documentation"
  --body "## Summary
  - Consolidate CSS files and create centralized design system
  - Add semantic button variants and comprehensive documentation
  - Maintain full accessibility compliance and responsive design

  ## Test plan
  - [ ] Verify all UI components render correctly
  - [ ] Test semantic button variants
  - [ ] Confirm responsive design works
  - [ ] Validate accessibility compliance"

  Key Success Metrics

  - Reduction in CSS files: 4+ files → 1 consolidated file
  - Lines of code: Reduce total CSS lines while maintaining functionality
  - Type safety: All design tokens properly typed
  - Documentation: Complete design system guide
  - Accessibility: WCAG 2.1 AA compliance maintained
  - Performance: No regression in bundle size or runtime performance

  Common Pitfalls to Avoid

  1. Breaking existing styles: Test thoroughly before removing CSS files
  2. Missing imports: Use grep to find all CSS imports before deletion
  3. Hardcoded values: Convert all hardcoded colors/spacing to tokens
  4. Missing accessibility: Ensure focus states and screen reader support
  5. Poor documentation: Include usage examples and guidelines
  6. Type safety: Use as const and proper TypeScript types