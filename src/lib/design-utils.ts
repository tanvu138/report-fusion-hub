/**
 * Design System Utility Functions
 * Helper functions for working with design tokens and generating consistent styles
 */

import { designSystem, SemanticAction, StatusType, FeedbackType, ComponentSize } from './design-tokens';

// === SEMANTIC COLOR UTILITIES ===
export function getSemanticColor(action: SemanticAction) {
  return designSystem.colors.semantic[action];
}

export function getStatusColor(status: StatusType) {
  return designSystem.colors.status[status];
}

export function getFeedbackColor(type: FeedbackType) {
  return designSystem.colors.feedback[type];
}

// === BUTTON VARIANT UTILITIES ===
export function getButtonVariantClasses(variant: SemanticAction) {
  const variantMap: Record<SemanticAction, string> = {
    view: 'border border-blue-300 bg-background text-blue-700 hover:bg-blue-50 hover:text-blue-800',
    edit: 'bg-blue-600 text-white hover:bg-blue-700',
    export: 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800',
    delete: 'text-red-600 hover:bg-red-50 hover:text-red-700',
    create: 'bg-tpg-blue text-white hover:bg-tpg-blue/90',
  };
  
  return variantMap[variant] || '';
}

// === STATUS INDICATOR UTILITIES ===
export function getStatusIndicatorClasses(status: StatusType) {
  const statusMap: Record<StatusType, string> = {
    draft: 'bg-blue-100 text-blue-700 border-blue-200',
    submitted: 'bg-green-100 text-green-700 border-green-200',
    final: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    published: 'bg-purple-100 text-purple-700 border-purple-200',
    overdue: 'bg-red-100 text-red-700 border-red-200',
  };
  
  return `inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${statusMap[status]}`;
}

// === COMPONENT SIZE UTILITIES ===
export function getComponentSize(component: 'button' | 'input', size: ComponentSize) {
  const sizeMap = {
    button: {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    },
    input: {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    },
  };
  
  return sizeMap[component][size] || sizeMap[component].md;
}

// === CSS CUSTOM PROPERTIES GENERATOR ===
export function generateCSSCustomProperties() {
  const { colors, spacing, typography, animations } = designSystem;
  
  const cssVars: Record<string, string> = {};
  
  // Generate color variables
  Object.entries(colors.semantic).forEach(([action, colorSet]) => {
    cssVars[`--semantic-${action}-bg`] = colorSet.background;
    cssVars[`--semantic-${action}-text`] = colorSet.text;
    if (colorSet.border) {
      cssVars[`--semantic-${action}-border`] = colorSet.border;
    }
    cssVars[`--semantic-${action}-hover-bg`] = colorSet.hover.background;
    if (colorSet.hover.text) {
      cssVars[`--semantic-${action}-hover-text`] = colorSet.hover.text;
    }
  });
  
  // Generate status variables
  Object.entries(colors.status).forEach(([status, colorSet]) => {
    cssVars[`--status-${status}-bg`] = colorSet.background;
    cssVars[`--status-${status}-text`] = colorSet.text;
    cssVars[`--status-${status}-border`] = colorSet.border;
  });
  
  // Generate spacing variables
  Object.entries(spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });
  
  // Generate typography variables
  cssVars['--font-sans'] = typography.fontFamily.sans.join(', ');
  cssVars['--font-mono'] = typography.fontFamily.mono.join(', ');
  
  return cssVars;
}

// === RESPONSIVE UTILITIES ===
export function getResponsiveClasses(base: string, responsive: Record<string, string>) {
  const classes = [base];
  
  Object.entries(responsive).forEach(([breakpoint, className]) => {
    classes.push(`${breakpoint}:${className}`);
  });
  
  return classes.join(' ');
}

// === ACCESSIBILITY UTILITIES ===
export function getFocusRingClasses(color: string = 'blue-500') {
  return `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}`;
}

export function getSkipLinkClasses() {
  return 'absolute left-[-9999px] z-50 px-4 py-2 bg-primary text-primary-foreground focus:left-4 focus:top-4 rounded-md';
}

// === ANIMATION UTILITIES ===
export function getTransitionClasses(
  property: string = 'all',
  duration: keyof typeof designSystem.animations.transition = 'normal',
  easing: keyof typeof designSystem.animations.easing = 'easeInOut'
) {
  return `transition-${property} duration-${designSystem.animations.duration[duration]} ${designSystem.animations.easing[easing]}`;
}

// === LAYOUT UTILITIES ===
export function getContainerClasses(maxWidth: string = '1280px') {
  return `max-w-[${maxWidth}] mx-auto px-4 sm:px-6 lg:px-8`;
}

export function getCardClasses(variant: 'default' | 'hover' | 'interactive' = 'default') {
  const baseClasses = 'bg-white rounded-lg shadow-md border border-gray-200';
  
  const variantClasses = {
    default: '',
    hover: 'hover:shadow-lg transition-shadow duration-200',
    interactive: 'hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1',
  };
  
  return `${baseClasses} ${variantClasses[variant]}`;
}

// === SIDEBAR UTILITIES ===
export function getSidebarClasses(isCollapsed: boolean) {
  return `
    transition-all duration-200 ease-in-out
    ${isCollapsed ? 'w-16' : 'w-64'}
    bg-sidebar-background border-r border-sidebar-border
  `;
}

// === FORM UTILITIES ===
export function getFormFieldClasses(hasError: boolean = false) {
  const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm';
  const errorClasses = 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500';
  
  return hasError ? `${baseClasses} ${errorClasses}` : baseClasses;
}

// === TYPE GUARDS ===
export function isSemanticAction(value: string): value is SemanticAction {
  return ['view', 'edit', 'export', 'delete', 'create'].includes(value);
}

export function isStatusType(value: string): value is StatusType {
  return ['draft', 'submitted', 'final', 'published', 'overdue'].includes(value);
}

export function isFeedbackType(value: string): value is FeedbackType {
  return ['success', 'warning', 'error', 'info'].includes(value);
}

// === UTILITY CONSTANTS ===
export const TOUCH_TARGET_SIZE = '44px'; // WCAG minimum touch target size
export const FOCUS_RING_COLOR = 'blue-500';
export const TRANSITION_DURATION = '200ms';
export const SIDEBAR_BREAKPOINT = '768px';

// === DARK MODE UTILITIES ===
export function getDarkModeClasses(lightClass: string, darkClass: string) {
  return `${lightClass} dark:${darkClass}`;
}

export function getThemeAwareColor(lightColor: string, darkColor: string) {
  return `hsl(var(--${lightColor}) / <alpha-value>) dark:hsl(var(--${darkColor}) / <alpha-value>)`;
}

// === PRINT UTILITIES ===
export function getPrintHiddenClasses() {
  return 'print:hidden';
}

export function getPrintOnlyClasses() {
  return 'hidden print:block';
}

// === LOADING STATE UTILITIES ===
export function getLoadingClasses(isLoading: boolean) {
  return isLoading ? 'opacity-50 pointer-events-none' : '';
}

export function getSkeletonClasses() {
  return 'animate-pulse bg-gray-200 rounded';
}

// === VALIDATION UTILITIES ===
export function validateDesignToken(token: string, category: string): boolean {
  // Simple validation to ensure design tokens are being used correctly
  const validCategories = ['colors', 'typography', 'spacing', 'components', 'animations', 'layout', 'shadows'];
  return validCategories.includes(category) && token.length > 0;
}

// === EXPORT ALL UTILITIES ===
export default {
  getSemanticColor,
  getStatusColor,
  getFeedbackColor,
  getButtonVariantClasses,
  getStatusIndicatorClasses,
  getComponentSize,
  generateCSSCustomProperties,
  getResponsiveClasses,
  getFocusRingClasses,
  getSkipLinkClasses,
  getTransitionClasses,
  getContainerClasses,
  getCardClasses,
  getSidebarClasses,
  getFormFieldClasses,
  getDarkModeClasses,
  getThemeAwareColor,
  getPrintHiddenClasses,
  getPrintOnlyClasses,
  getLoadingClasses,
  getSkeletonClasses,
  validateDesignToken,
  isSemanticAction,
  isStatusType,
  isFeedbackType,
};