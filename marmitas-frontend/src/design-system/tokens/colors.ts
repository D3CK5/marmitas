// Color tokens for the design system
// These tokens define all colors used throughout the application

/**
 * Color tokens object
 * Color names follow a hierarchical structure with semantic naming
 */
export const colors = {
  // Primary brand colors
  primary: {
    DEFAULT: '#4CAF50',
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    foreground: '#ffffff',
  },

  // Secondary colors
  secondary: {
    DEFAULT: '#F9F7F7',
    50: '#FFFFFF',
    100: '#F9F7F7',
    200: '#E8E8E8',
    300: '#D1D1D1',
    400: '#B8B8B8',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    foreground: '#1A1A1A',
  },

  // Accent colors
  accent: {
    DEFAULT: '#FE9A22',
    50: '#FFF8F0',
    100: '#FEEBD3',
    200: '#FEDDA7',
    300: '#FEC27A',
    400: '#FEA94E',
    500: '#FE9A22',
    600: '#F38000',
    700: '#C16600',
    800: '#8F4C00',
    900: '#5E3200',
    foreground: '#ffffff',
  },

  // Semantic status colors
  success: {
    DEFAULT: '#10B981',
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    foreground: '#FFFFFF',
  },

  warning: {
    DEFAULT: '#FBBF24',
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    foreground: '#1A1A1A',
  },

  error: {
    DEFAULT: '#FF5252',
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    foreground: '#FFFFFF',
  },

  info: {
    DEFAULT: '#3B82F6',
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    foreground: '#FFFFFF',
  },

  // System colors
  neutral: {
    DEFAULT: '#9E9E9E',
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },

  // Semantic UI colors
  background: {
    DEFAULT: '#FFFFFF',
    muted: '#F1F5F9',
    subtle: '#F8FAFC',
    page: '#FFFFFF',
  },

  foreground: {
    DEFAULT: '#1A1A1A',
    muted: '#64748B',
    subtle: '#94A3B8',
    contrast: '#FFFFFF',
  },

  border: {
    DEFAULT: '#E2E8F0',
    muted: '#F1F5F9',
    active: '#4CAF50',
    input: '#CBD5E1',
  },

  ring: {
    DEFAULT: 'rgba(76, 175, 80, 0.5)', // primary with opacity
  },

  // Special colors
  destructive: {
    DEFAULT: '#FF5252',
    foreground: '#FFFFFF',
  },
  
  muted: {
    DEFAULT: '#F1F5F9',
    foreground: '#64748B',
  },
};

// CSS Variables map for colors
// These are converted to CSS variables in the theme system
export const colorVariables = {
  'primary': 'var(--primary)',
  'primary-foreground': 'var(--primary-foreground)',
  'secondary': 'var(--secondary)',
  'secondary-foreground': 'var(--secondary-foreground)',
  'accent': 'var(--accent)',
  'accent-foreground': 'var(--accent-foreground)',
  'background': 'var(--background)',
  'foreground': 'var(--foreground)',
  'muted': 'var(--muted)',
  'muted-foreground': 'var(--muted-foreground)',
  'border': 'var(--border)',
  'input': 'var(--input)',
  'ring': 'var(--ring)',
  'destructive': 'var(--destructive)',
  'destructive-foreground': 'var(--destructive-foreground)',
  'success': 'var(--success)',
  'success-foreground': 'var(--success-foreground)',
  'warning': 'var(--warning)',
  'warning-foreground': 'var(--warning-foreground)',
  'error': 'var(--error)',
  'error-foreground': 'var(--error-foreground)',
  'info': 'var(--info)',
  'info-foreground': 'var(--info-foreground)',
}; 