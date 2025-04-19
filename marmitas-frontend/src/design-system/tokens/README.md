# Design Token System

This directory contains the design token system for our application. Design tokens are the visual design atoms of the design system — specifically, they are named entities that store visual design attributes. We use these tokens rather than hard-coded values to ensure a consistent visual language across the application.

## Token Categories

Our design system includes the following token categories:

### Colors

Color tokens define all colors used in the application, with hierarchical structure and semantic naming:

- **Primary**: Main brand colors (`primary`, `primary-50` through `primary-900`, etc.)
- **Secondary**: Secondary brand colors
- **Accent**: Accent colors for highlighting and emphasis
- **Semantic**: Status colors (`success`, `warning`, `error`, `info`)
- **System**: UI colors (`background`, `foreground`, `border`, etc.)

### Typography

Typography tokens define text styles throughout the application:

- **Font Families**: Font stacks for different text types (`sans`, `serif`, `mono`, `display`)
- **Font Sizes**: Text sizes from `xs` to `9xl`
- **Font Weights**: Text weights from `light` to `black`
- **Line Heights**: Standard line heights
- **Letter Spacings**: Text tracking values

### Spacing

Spacing tokens define consistent spacing throughout the UI:

- **Spacing Scale**: Based on a 4px grid system (4px, 8px, 12px, etc.)
- **Semantic Spacing**: Context-specific spacing values for components, layouts, etc.

### Other Token Categories

- **Shadows**: Elevation and depth values
- **Border Radius**: Corner rounding values
- **Z-Indices**: Layering and stacking values
- **Animations**: Motion and transition values

## Usage

### In Components

Import and use tokens in your components:

```tsx
import { colors, spacing } from '../design-system/tokens';

function MyComponent() {
  // Direct usage in inline styles (not recommended)
  return <div style={{ color: colors.primary.DEFAULT }}>Content</div>;
}
```

### With CSS Variables

Our tokens are also available as CSS variables:

```tsx
function MyComponent() {
  // Using CSS variables (recommended)
  return <div className="text-primary bg-background">Content</div>;
}
```

### With Theme Provider

Use our ThemeProvider to access tokens through the theme context:

```tsx
import { useTheme } from '../design-system/ThemeProvider';

function MyComponent() {
  const { theme, isDarkMode, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme.name}</p>
      <button onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}>
        Toggle theme
      </button>
    </div>
  );
}
```

## Theme System

Our token system supports multiple themes, with light and dark modes built-in. The ThemeProvider component manages theme switching and applies the correct token values throughout the application.

## Adding New Tokens

When adding new tokens:

1. Add the token to the appropriate token file (e.g., `colors.ts`)
2. Add it to the theme definitions in `theme.ts`
3. Update the CSS variable mapping if needed
4. Document usage in component examples 