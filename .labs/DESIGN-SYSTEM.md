# Design System Guide

> **🎨 Unified Design Language**: A comprehensive design system with centralized tokens, semantic components, and consistent patterns across the Report Fusion application.

## 🎯 Design Philosophy

- **Consistency**: Unified visual language with standardized spacing, colors, and typography
- **Accessibility**: WCAG 2.1 AA compliance with proper contrast ratios and keyboard navigation
- **Maintainability**: Centralized design tokens for easy updates and consistency
- **Simplicity**: Clean, practical approach focused on usability and clarity
- **Scalability**: Design patterns that work across different screen sizes and use cases

## 📋 Table of Contents

1. [Design Tokens](#design-tokens)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Patterns](#component-patterns)
6. [Responsive Design](#responsive-design)
7. [Accessibility](#accessibility)
8. [Development Guidelines](#development-guidelines)
9. [Usage Examples](#usage-examples)

## 🎨 Design Tokens

### File Structure
```
src/lib/
├── design-tokens.ts    # Central token definitions
├── design-utils.ts     # Utility functions
└── utils.ts           # General utilities
```

### Core Token Categories

#### Colors
- **Brand Colors**: Primary brand identity (TPG Blue, TPG Red)
- **Semantic Colors**: Action-specific colors (view, edit, export, delete, create)
- **Status Colors**: Report state indicators (draft, submitted, final, published, overdue)
- **Neutral Colors**: Grayscale palette for text and backgrounds
- **Feedback Colors**: Success, warning, error, and info states

#### Typography
- **Font Family**: Inter (primary), Monospace (code)
- **Font Sizes**: xs (12px) to 5xl (48px)
- **Font Weights**: 300-700 range
- **Line Heights**: Tight (1.25), Normal (1.5), Relaxed (1.75)

#### Spacing
- **Scale**: 0-64 with consistent 4px increments
- **Component Spacing**: Predefined padding and margins
- **Layout Spacing**: Container and grid spacing

## 🎨 Color System

### Brand Colors
```typescript
const brandColors = {
  primary: '#0A2463',    // TPG Blue
  secondary: '#D90429',  // TPG Red
  accent: '#3B82F6',     // Interactive blue
}
```

### Semantic Action Colors
Consistent colors for user actions across the application:

#### View Actions
- **Background**: `#F8FAFC` (Slate 50)
- **Text**: `#1E40AF` (Blue 700)
- **Border**: `#CBD5E1` (Slate 300)
- **Hover**: `#EFF6FF` (Blue 50) with `#1D4ED8` (Blue 600) text

#### Edit Actions
- **Background**: `#2563EB` (Blue 600)
- **Text**: `#FFFFFF` (White)
- **Hover**: `#1D4ED8` (Blue 700)

#### Export Actions
- **Background**: `#DCFCE7` (Green 100)
- **Text**: `#166534` (Green 700)
- **Hover**: `#BBF7D0` (Green 200) with `#15803D` (Green 600) text

#### Delete Actions
- **Text**: `#DC2626` (Red 600)
- **Hover**: `#FEF2F2` (Red 50) with `#B91C1C` (Red 700) text

#### Create Actions
- **Background**: `#0A2463` (TPG Blue)
- **Text**: `#FFFFFF` (White)
- **Hover**: `#082048` (Darker TPG Blue)

### Status Colors
Report workflow state indicators:

| Status | Background | Text | Border | Usage |
|--------|------------|------|--------|-------|
| **Draft** | `#DBEAFE` | `#2563EB` | `#93C5FD` | Initial state |
| **Submitted** | `#DCFCE7` | `#16A34A` | `#86EFAC` | Under review |
| **Final** | `#FEF3C7` | `#D97706` | `#FCD34D` | Ready for publication |
| **Published** | `#F3E8FF` | `#9333EA` | `#C4B5FD` | Live/published |
| **Overdue** | `#FEE2E2` | `#DC2626` | `#FCA5A5` | Past deadline |

### Neutral Colors
Grayscale palette for text, backgrounds, and borders:

| Shade | Value | Usage |
|-------|-------|-------|
| **50** | `#F9FAFB` | Subtle backgrounds |
| **100** | `#F3F4F6` | Light backgrounds |
| **200** | `#E5E7EB` | Borders, dividers |
| **300** | `#D1D5DB` | Disabled states |
| **400** | `#9CA3AF` | Placeholder text |
| **500** | `#6B7280` | Secondary text |
| **600** | `#4B5563` | Primary text |
| **700** | `#374151` | Headings |
| **800** | `#1F2937` | Dark text |
| **900** | `#111827` | Highest contrast |

## 🔤 Typography

### Font Family
```css
font-family: 'Inter', sans-serif;
```

### Font Scale
| Size | Value | Usage |
|------|-------|-------|
| **xs** | 12px | Captions, small labels |
| **sm** | 14px | Body text, buttons |
| **base** | 16px | Default body text |
| **lg** | 18px | Emphasized text |
| **xl** | 20px | Small headings |
| **2xl** | 24px | Section headings |
| **3xl** | 30px | Page headings |
| **4xl** | 36px | Large headings |
| **5xl** | 48px | Display headings |

### Font Weights
| Weight | Value | Usage |
|--------|-------|-------|
| **Light** | 300 | Subtle text |
| **Normal** | 400 | Body text |
| **Medium** | 500 | Emphasis |
| **Semibold** | 600 | Subheadings |
| **Bold** | 700 | Headings |

## 📐 Spacing & Layout

### Spacing Scale
Consistent spacing using 4px increments:

```typescript
const spacing = {
  1: '4px',    // 0.25rem
  2: '8px',    // 0.5rem
  3: '12px',   // 0.75rem
  4: '16px',   // 1rem
  5: '20px',   // 1.25rem
  6: '24px',   // 1.5rem
  8: '32px',   // 2rem
  10: '40px',  // 2.5rem
  12: '48px',  // 3rem
  16: '64px',  // 4rem
  20: '80px',  // 5rem
  24: '96px',  // 6rem
}
```

### Layout Containers
- **Max Width**: 1280px (constrained content)
- **Padding**: 2rem horizontal
- **Responsive**: Adjusts on mobile devices

### Breakpoints
```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1400px' // Extra large
}
```

## 🧩 Component Patterns

### Button Component

#### Semantic Variants
```typescript
<Button variant="view">View Report</Button>
<Button variant="edit">Edit Report</Button>
<Button variant="export">Export PDF</Button>
<Button variant="delete">Delete</Button>
<Button variant="create">Create New</Button>
```

#### Size Variants
```typescript
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>
```

#### Loading States
```typescript
<Button variant="edit" disabled>
  <LoadingSpinner />
  Processing...
</Button>
```

### Status Indicators

#### Basic Status
```typescript
<StatusIndicator status="draft" />
<StatusIndicator status="submitted" />
<StatusIndicator status="final" />
<StatusIndicator status="published" />
<StatusIndicator status="overdue" />
```

#### Custom Status
```typescript
<div className="status-indicator status-draft">
  Draft
</div>
```

### Card Components

#### Interactive Cards
```typescript
<Card className="card-hover">
  <CardHeader>
    <CardTitle>Report Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

#### Loading Cards
```typescript
<Card className="skeleton-pulse">
  <div className="h-4 bg-gray-300 rounded mb-2"></div>
  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
</Card>
```

### Form Components

#### Input Fields
```typescript
<Input
  placeholder="Enter report title"
  className="focus-ring"
/>
```

#### Form Validation
```typescript
<Input
  error={hasError}
  className={getFormFieldClasses(hasError)}
/>
```

## 📱 Responsive Design

### Mobile-First Approach
All components are designed mobile-first with progressive enhancement:

```css
/* Mobile first (default) */
.component {
  padding: 1rem;
  font-size: 0.875rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: 1.5rem;
    font-size: 1rem;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    padding: 2rem;
    font-size: 1.125rem;
  }
}
```

### Touch Targets
All interactive elements meet WCAG minimum touch target size:

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

### Responsive Grid
```typescript
<div className="responsive-grid">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>
```

## ♿ Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast
All color combinations meet WCAG AA standards:
- **Normal text**: 4.5:1 contrast ratio
- **Large text**: 3:1 contrast ratio
- **UI components**: 3:1 contrast ratio

#### Keyboard Navigation
```typescript
<Button className="focus-ring">
  Keyboard accessible
</Button>
```

#### Screen Reader Support
```typescript
<Button aria-label="Edit report">
  <EditIcon />
</Button>

<div role="status" aria-live="polite">
  Report saved successfully
</div>
```

#### Skip Links
```typescript
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  .component {
    border: 2px solid currentColor;
    outline: 2px solid currentColor;
  }
}
```

## 🛠️ Development Guidelines

### Using Design Tokens

#### Import and Usage
```typescript
import { designSystem } from '@/lib/design-tokens';
import { getSemanticColor, getButtonVariantClasses } from '@/lib/design-utils';

// Access color tokens
const primaryColor = designSystem.colors.brand.primary;
const semanticColors = getSemanticColor('edit');

// Use utility functions
const buttonClasses = getButtonVariantClasses('view');
```

#### CSS Variables
```css
.custom-component {
  background-color: var(--semantic-view-bg);
  color: var(--semantic-view-text);
  border: 1px solid var(--semantic-view-border);
}

.custom-component:hover {
  background-color: var(--semantic-view-hover-bg);
  color: var(--semantic-view-hover-text);
}
```

### Creating New Components

#### 1. Follow Existing Patterns
```typescript
// ✅ Good: Uses existing button patterns
<Button variant="view" size="sm">
  View Details
</Button>

// ❌ Bad: Custom styling that breaks consistency
<button className="bg-blue-500 text-white px-3 py-1">
  View Details
</button>
```

#### 2. Use Design Tokens
```typescript
// ✅ Good: Uses design tokens
const styles = {
  backgroundColor: designSystem.colors.semantic.edit.background,
  color: designSystem.colors.semantic.edit.text,
  padding: designSystem.spacing[4],
};

// ❌ Bad: Hard-coded values
const styles = {
  backgroundColor: '#2563EB',
  color: '#FFFFFF',
  padding: '16px',
};
```

#### 3. Add Accessibility
```typescript
// ✅ Good: Accessible component
<Button
  variant="delete"
  aria-label="Delete report"
  className="focus-ring"
  disabled={isDeleting}
>
  {isDeleting ? <LoadingSpinner /> : <DeleteIcon />}
  {isDeleting ? 'Deleting...' : 'Delete'}
</Button>
```

### Extending the Design System

#### Adding New Colors
```typescript
// 1. Add to design-tokens.ts
export const colors = {
  // ... existing colors
  semantic: {
    // ... existing semantic colors
    archive: {
      background: '#F3F4F6',
      text: '#4B5563',
      hover: { background: '#E5E7EB', text: '#374151' },
    },
  },
};

// 2. Add to design-utils.ts
export function getButtonVariantClasses(variant: SemanticAction) {
  const variantMap = {
    // ... existing variants
    archive: 'bg-semantic-archive-bg text-semantic-archive-text hover:bg-semantic-archive-hover-bg',
  };
  return variantMap[variant] || '';
}

// 3. Add to tailwind.config.ts
colors: {
  semantic: {
    // ... existing colors
    archive: {
      DEFAULT: designSystem.colors.semantic.archive.background,
      bg: designSystem.colors.semantic.archive.background,
      text: designSystem.colors.semantic.archive.text,
      'hover-bg': designSystem.colors.semantic.archive.hover.background,
      'hover-text': designSystem.colors.semantic.archive.hover.text,
    },
  },
}

// 4. Add CSS variables to index.css
:root {
  /* ... existing variables */
  --semantic-archive-bg: #F3F4F6;
  --semantic-archive-text: #4B5563;
  --semantic-archive-hover-bg: #E5E7EB;
  --semantic-archive-hover-text: #374151;
}
```

#### Adding New Component Patterns
```typescript
// 1. Create component with design tokens
export const Badge = ({ variant, children }) => {
  const variantClasses = {
    success: 'bg-feedback-success-bg text-feedback-success-text border-feedback-success-border',
    warning: 'bg-feedback-warning-bg text-feedback-warning-text border-feedback-warning-border',
    error: 'bg-feedback-error-bg text-feedback-error-text border-feedback-error-border',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

// 2. Add corresponding CSS classes
.badge-success {
  background-color: var(--feedback-success-bg);
  color: var(--feedback-success-text);
  border-color: var(--feedback-success-border);
}
```

## 💡 Usage Examples

### Report Dashboard
```typescript
function ReportDashboard() {
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-8">Reports Dashboard</h1>
      
      <div className="responsive-grid">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Monthly Report</CardTitle>
            <StatusIndicator status="draft" />
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600 mb-4">
              Monthly performance summary for Q1 2024
            </p>
            <div className="flex gap-2">
              <Button variant="view" size="sm">
                View
              </Button>
              <Button variant="edit" size="sm">
                Edit
              </Button>
              <Button variant="export" size="sm">
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Quarterly Analysis</CardTitle>
            <StatusIndicator status="submitted" />
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600 mb-4">
              Comprehensive quarterly business analysis
            </p>
            <div className="flex gap-2">
              <Button variant="view" size="sm">
                View
              </Button>
              <Button variant="edit" size="sm" disabled>
                Edit
              </Button>
              <Button variant="export" size="sm">
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Form Components
```typescript
function ReportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Report Title
        </label>
        <Input
          placeholder="Enter report title"
          className="focus-ring"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-md focus-ring"
          rows={4}
          placeholder="Enter report description"
        />
      </div>
      
      <div className="flex gap-4">
        <Button
          type="submit"
          variant="create"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner />
              Creating...
            </>
          ) : (
            'Create Report'
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

### Mobile Navigation
```typescript
function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
      >
        <MenuIcon />
      </Button>

      <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="sidebar-mobile-overlay" onClick={() => setIsOpen(false)} />
        <nav className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
          <div className="p-4 border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation menu"
            >
              <CloseIcon />
            </Button>
          </div>
          
          <div className="p-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Reports
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Settings
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Color Not Updating
```typescript
// ❌ Problem: Using hard-coded color
<div className="bg-blue-600">Content</div>

// ✅ Solution: Use design tokens
<div className="bg-semantic-edit-bg">Content</div>
```

#### 2. Inconsistent Spacing
```typescript
// ❌ Problem: Random spacing values
<div className="p-3 mb-5">Content</div>

// ✅ Solution: Use design system spacing
<div className="p-4 mb-6">Content</div>
```

#### 3. Button Variant Not Working
```typescript
// ❌ Problem: CSS classes not being generated
<Button variant="custom">Button</Button>

// ✅ Solution: Use existing semantic variants
<Button variant="view">Button</Button>
```

### Performance Optimization

#### 1. CSS Purging
Ensure Tailwind CSS is properly configured to purge unused styles:

```javascript
// tailwind.config.ts
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  // ... rest of config
}
```

#### 2. Bundle Size
Monitor bundle size impact when adding new design tokens:

```bash
npm run build
npm run analyze  # If bundle analyzer is set up
```

## 📝 Changelog

### Version 1.0.0 (2025-01-09)
- **Added**: Complete design token system with TypeScript support
- **Added**: Semantic button variants (view, edit, export, delete, create)
- **Added**: Comprehensive status color system
- **Added**: Unified CSS consolidation from 5 separate files
- **Added**: Full accessibility compliance (WCAG 2.1 AA)
- **Added**: Responsive design patterns
- **Added**: Dark mode support infrastructure
- **Added**: Print styles optimization
- **Added**: Comprehensive documentation and usage examples

## 🤝 Contributing

When contributing to the design system:

1. **Follow existing patterns** - Use established design tokens and utilities
2. **Test accessibility** - Ensure WCAG 2.1 AA compliance
3. **Document changes** - Update this guide with new patterns
4. **Test responsiveness** - Verify components work on all screen sizes
5. **Performance check** - Ensure changes don't impact bundle size significantly

## 📚 Resources

- [Design Tokens Specification](https://design-tokens.github.io/community-group/format/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Inter Font Family](https://rsms.me/inter/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

> **📖 Living Document**: This design system guide is continuously updated as the system evolves. Last updated: 2025-01-09