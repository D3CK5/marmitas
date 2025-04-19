// Typography tokens for the design system
// These tokens define all typography styles used throughout the application

/**
 * Font family tokens
 */
export const fontFamilies = {
  sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  display: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

/**
 * Font size tokens
 * Each size includes the font size and line height
 */
export const fontSizes = {
  xs: { fontSize: '0.75rem', lineHeight: '1rem' },     // 12px
  sm: { fontSize: '0.875rem', lineHeight: '1.25rem' }, // 14px
  base: { fontSize: '1rem', lineHeight: '1.5rem' },    // 16px
  lg: { fontSize: '1.125rem', lineHeight: '1.75rem' }, // 18px
  xl: { fontSize: '1.25rem', lineHeight: '1.75rem' },  // 20px
  '2xl': { fontSize: '1.5rem', lineHeight: '2rem' },   // 24px
  '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem' }, // 30px
  '4xl': { fontSize: '2.25rem', lineHeight: '2.5rem' }, // 36px
  '5xl': { fontSize: '3rem', lineHeight: '1' },        // 48px
  '6xl': { fontSize: '3.75rem', lineHeight: '1' },     // 60px
  '7xl': { fontSize: '4.5rem', lineHeight: '1' },      // 72px
  '8xl': { fontSize: '6rem', lineHeight: '1' },        // 96px
  '9xl': { fontSize: '8rem', lineHeight: '1' },        // 128px
};

/**
 * Font weight tokens
 */
export const fontWeights = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

/**
 * Line height tokens
 */
export const lineHeights = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
};

/**
 * Letter spacing tokens
 */
export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

/**
 * Text decoration tokens
 */
export const textDecorations = {
  none: 'none',
  underline: 'underline',
  'line-through': 'line-through',
};

/**
 * Text transform tokens
 */
export const textTransforms = {
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  capitalize: 'capitalize',
  'normal-case': 'none',
};

/**
 * Typography style compositions
 * These combine the above tokens into complete typography styles
 */
export const typographyStyles = {
  // Headings
  h1: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['4xl'].fontSize,
    lineHeight: fontSizes['4xl'].lineHeight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.tight,
  },
  h2: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['3xl'].fontSize,
    lineHeight: fontSizes['3xl'].lineHeight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.tight,
  },
  h3: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['2xl'].fontSize,
    lineHeight: fontSizes['2xl'].lineHeight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.normal,
  },
  h4: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.xl.fontSize,
    lineHeight: fontSizes.xl.lineHeight,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.normal,
  },
  h5: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.lg.fontSize,
    lineHeight: fontSizes.lg.lineHeight,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.normal,
  },
  h6: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.base.fontSize,
    lineHeight: fontSizes.base.lineHeight,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.normal,
  },

  // Body text
  bodyLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg.fontSize,
    lineHeight: fontSizes.lg.lineHeight,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  bodyDefault: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base.fontSize,
    lineHeight: fontSizes.base.lineHeight,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  bodySmall: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm.fontSize,
    lineHeight: fontSizes.sm.lineHeight,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  bodyXSmall: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs.fontSize,
    lineHeight: fontSizes.xs.lineHeight,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },

  // Special text styles
  lead: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl.fontSize,
    lineHeight: fontSizes.xl.lineHeight,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  caption: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs.fontSize,
    lineHeight: fontSizes.xs.lineHeight,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.wide,
  },
  overline: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs.fontSize,
    lineHeight: fontSizes.xs.lineHeight,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.widest,
    textTransform: textTransforms.uppercase,
  },
  button: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm.fontSize,
    lineHeight: fontSizes.sm.lineHeight,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.wide,
  },
  code: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm.fontSize,
    lineHeight: fontSizes.sm.lineHeight,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
}; 