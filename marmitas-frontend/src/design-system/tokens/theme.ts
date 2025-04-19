// Theme system for the design system
// Defines theme settings and creates CSS variables

import { colors } from './colors';
import { fontFamilies, fontSizes, fontWeights, lineHeights, letterSpacings } from './typography';
import { spacing } from './spacing';

/**
 * Theme interface that defines the structure of a theme
 */
export interface Theme {
  name: string;
  colors: Record<string, string>;
  typography: {
    fontFamilies: Record<string, string>;
    fontSizes: Record<string, string>;
    fontWeights: Record<string, string>;
    lineHeights: Record<string, string>;
    letterSpacings: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  animations: Record<string, string>;
}

/**
 * Light theme definition
 */
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    // Base colors
    primary: colors.primary.DEFAULT,
    'primary-foreground': colors.primary.foreground,
    secondary: colors.secondary.DEFAULT,
    'secondary-foreground': colors.secondary.foreground,
    accent: colors.accent.DEFAULT,
    'accent-foreground': colors.accent.foreground,
    
    // Semantic UI colors
    background: colors.background.DEFAULT,
    foreground: colors.foreground.DEFAULT,
    muted: colors.muted.DEFAULT,
    'muted-foreground': colors.muted.foreground,
    
    // Component colors
    border: colors.border.DEFAULT,
    input: colors.border.input,
    ring: colors.ring.DEFAULT,
    
    // Status colors
    destructive: colors.destructive.DEFAULT,
    'destructive-foreground': colors.destructive.foreground,
    success: colors.success.DEFAULT,
    'success-foreground': colors.success.foreground,
    warning: colors.warning.DEFAULT,
    'warning-foreground': colors.warning.foreground,
    error: colors.error.DEFAULT,
    'error-foreground': colors.error.foreground,
    info: colors.info.DEFAULT,
    'info-foreground': colors.info.foreground,
  },
  typography: {
    fontFamilies: {
      sans: fontFamilies.sans,
      serif: fontFamilies.serif,
      mono: fontFamilies.mono,
      display: fontFamilies.display,
    },
    fontSizes: {
      xs: fontSizes.xs.fontSize,
      sm: fontSizes.sm.fontSize,
      base: fontSizes.base.fontSize,
      lg: fontSizes.lg.fontSize,
      xl: fontSizes.xl.fontSize,
      '2xl': fontSizes['2xl'].fontSize,
      '3xl': fontSizes['3xl'].fontSize,
      '4xl': fontSizes['4xl'].fontSize,
    },
    fontWeights: {
      light: fontWeights.light,
      normal: fontWeights.normal,
      medium: fontWeights.medium,
      semibold: fontWeights.semibold,
      bold: fontWeights.bold,
    },
    lineHeights: {
      none: lineHeights.none,
      tight: lineHeights.tight,
      normal: lineHeights.normal,
      relaxed: lineHeights.relaxed,
    },
    letterSpacings: {
      tighter: letterSpacings.tighter,
      tight: letterSpacings.tight,
      normal: letterSpacings.normal,
      wide: letterSpacings.wide,
      wider: letterSpacings.wider,
    },
  },
  spacing: {
    px: spacing.px,
    0: spacing[0],
    1: spacing[1],
    2: spacing[2],
    3: spacing[3],
    4: spacing[4],
    5: spacing[5],
    6: spacing[6],
    8: spacing[8],
    10: spacing[10],
    12: spacing[12],
    16: spacing[16],
  },
  borderRadius: {
    none: '0',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  animations: {
    'spin': 'spin 1s linear infinite',
    'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
    'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    'bounce': 'bounce 1s infinite',
  },
};

/**
 * Dark theme definition
 */
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    // Base colors - darker variants
    primary: colors.primary.DEFAULT,
    'primary-foreground': colors.primary.foreground,
    secondary: colors.secondary[800],
    'secondary-foreground': colors.secondary[100],
    accent: colors.accent.DEFAULT,
    'accent-foreground': colors.accent.foreground,
    
    // Semantic UI colors - dark mode
    background: colors.neutral[900],
    foreground: colors.neutral[100],
    muted: colors.neutral[800],
    'muted-foreground': colors.neutral[400],
    
    // Component colors - dark mode
    border: colors.neutral[700],
    input: colors.neutral[700],
    ring: `rgba(${parseInt(colors.primary.DEFAULT.slice(1, 3), 16)}, ${parseInt(colors.primary.DEFAULT.slice(3, 5), 16)}, ${parseInt(colors.primary.DEFAULT.slice(5, 7), 16)}, 0.5)`,
    
    // Status colors - remain the same
    destructive: colors.destructive.DEFAULT,
    'destructive-foreground': colors.destructive.foreground,
    success: colors.success.DEFAULT,
    'success-foreground': colors.success.foreground,
    warning: colors.warning.DEFAULT,
    'warning-foreground': colors.warning.foreground,
    error: colors.error.DEFAULT,
    'error-foreground': colors.error.foreground,
    info: colors.info.DEFAULT,
    'info-foreground': colors.info.foreground,
  },
  // All other properties remain the same
  typography: { ...lightTheme.typography },
  spacing: { ...lightTheme.spacing },
  borderRadius: { ...lightTheme.borderRadius },
  shadows: {
    ...lightTheme.shadows,
    // Adjust shadows for dark mode - more subtle
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
  },
  animations: { ...lightTheme.animations },
};

/**
 * Generate CSS variables from a theme
 * @param theme The theme to generate CSS variables from
 * @returns CSS variable string
 */
export function generateCSSVariables(theme: Theme): string {
  let cssVars = '';
  
  // Add color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    cssVars += `--${key}: ${value};\n`;
  });
  
  // Add typography variables
  Object.entries(theme.typography.fontFamilies).forEach(([key, value]) => {
    cssVars += `--font-family-${key}: ${value};\n`;
  });
  
  Object.entries(theme.typography.fontSizes).forEach(([key, value]) => {
    cssVars += `--font-size-${key}: ${value};\n`;
  });
  
  Object.entries(theme.typography.fontWeights).forEach(([key, value]) => {
    cssVars += `--font-weight-${key}: ${value};\n`;
  });
  
  // Add spacing variables
  Object.entries(theme.spacing).forEach(([key, value]) => {
    cssVars += `--space-${key}: ${value};\n`;
  });
  
  // Add border radius variables
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    cssVars += `--radius-${key}: ${value};\n`;
  });
  
  // Add shadow variables
  Object.entries(theme.shadows).forEach(([key, value]) => {
    cssVars += `--shadow-${key}: ${value};\n`;
  });
  
  return cssVars;
}

// Default theme
export const defaultTheme = lightTheme; 