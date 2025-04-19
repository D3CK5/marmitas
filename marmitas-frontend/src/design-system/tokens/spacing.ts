// Spacing tokens for the design system
// These tokens define all spacing values used throughout the application

/**
 * Spacing scale tokens
 * Based on a 4px grid system with additional values for finer control
 */
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  44: '11rem',     // 176px
  48: '12rem',     // 192px
  52: '13rem',     // 208px
  56: '14rem',     // 224px
  60: '15rem',     // 240px
  64: '16rem',     // 256px
  72: '18rem',     // 288px
  80: '20rem',     // 320px
  96: '24rem',     // 384px
};

/**
 * Semantic spacing tokens
 * Adds meaning to spacing values for specific contexts
 */
export const semanticSpacing = {
  // Layout spacing
  container: {
    padding: spacing[4], // 16px
    sm: spacing[2],      // 8px
    lg: spacing[6],      // 24px
  },
  
  // Component spacing
  component: {
    padding: {
      xs: spacing[2],    // 8px
      sm: spacing[3],    // 12px
      md: spacing[4],    // 16px
      lg: spacing[6],    // 24px
      xl: spacing[8],    // 32px
    },
    gap: {
      xs: spacing[1],    // 4px
      sm: spacing[2],    // 8px
      md: spacing[4],    // 16px
      lg: spacing[6],    // 24px
      xl: spacing[8],    // 32px
    },
  },
  
  // Form element spacing
  form: {
    gap: spacing[4],     // 16px
    fieldGap: spacing[2], // 8px
    labelGap: spacing[1.5], // 6px
    inputPadding: {
      x: spacing[3],     // 12px
      y: spacing[2],     // 8px
    },
  },
  
  // Section spacing
  section: {
    padding: {
      y: spacing[16],    // 64px
      x: spacing[4],     // 16px
    },
    gap: spacing[8],     // 32px
  },
  
  // Card spacing
  card: {
    padding: spacing[6], // 24px
    gap: spacing[4],     // 16px
  },
  
  // Modal/dialog spacing
  modal: {
    padding: spacing[6], // 24px
    gap: spacing[4],     // 16px
  },
};

/**
 * CSS Variable mapping for spacing
 */
export const spacingVariables = {
  'space-1': 'var(--space-1)',
  'space-2': 'var(--space-2)',
  'space-3': 'var(--space-3)',
  'space-4': 'var(--space-4)',
  'space-5': 'var(--space-5)',
  'space-6': 'var(--space-6)',
  'space-8': 'var(--space-8)',
  'space-10': 'var(--space-10)',
  'space-12': 'var(--space-12)',
  'space-16': 'var(--space-16)',
}; 