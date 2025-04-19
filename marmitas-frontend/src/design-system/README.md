# Marmitas Design System

The Marmitas Design System is a comprehensive collection of reusable components, design tokens, and guidelines that ensure a consistent, accessible, and high-quality user experience across the Marmitas application.

## Overview

This design system implements the strategies and mechanisms required to maintain a coherent user experience while operating with separated frontend and backend components. It focuses on component consistency, theming, accessibility, and performance.

## Structure

The design system is organized into two main parts:

1. **Components**: Reusable UI components that form the building blocks of the application
2. **Tokens**: Design tokens that define the visual properties of the components

### Components

Components are organized by type and function:

- **Core**: Basic interactive elements like buttons, inputs, and form controls
- **Typography**: Text elements like headings, paragraphs, and lists
- **Layout**: Structural elements like containers, grids, and flexbox components
- **Feedback**: Elements that provide feedback like alerts, toasts, and spinners
- **Navigation**: Elements for navigation like menus, tabs, and breadcrumbs
- **Overlay**: Elements that appear above the page like modals, drawers, and tooltips

Each component follows these principles:

- **Accessible**: WCAG 2.1 AA compliant
- **Responsive**: Works on all screen sizes
- **Themable**: Adapts to light and dark modes
- **Consistent**: Follows established design patterns

### Tokens

Design tokens define the visual properties of the components:

- **Colors**: Brand colors, semantic colors, and UI colors
- **Typography**: Font families, sizes, weights, and styles
- **Spacing**: Margin, padding, and layout spacing
- **Shadows**: Elevation and depth
- **Borders**: Width, style, and radius
- **Animation**: Timing, easing, and duration

## Usage

To use the design system in your components:

```tsx
// Import components
import { Button, Input } from '@/design-system/components';

// Use components
function MyForm() {
  return (
    <form>
      <Input 
        label="Email" 
        type="email" 
        placeholder="Enter your email" 
      />
      <Button variant="primary">
        Submit
      </Button>
    </form>
  );
}
```

For theme support, wrap your application with the ThemeProvider:

```tsx
import { ThemeProvider } from '@/design-system/ThemeProvider';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <YourApplication />
    </ThemeProvider>
  );
}
```

## Implementation Guidelines

When extending the design system, follow these guidelines:

1. **Component First**: Design components to be flexible, composable, and reusable
2. **Token Based**: Use design tokens for all visual properties
3. **Accessibility**: Design for accessibility from the start
4. **Documentation**: Document all components and their props
5. **Testing**: Test components for functionality, accessibility, and responsiveness

## Contributing

To add new components or tokens to the design system:

1. Follow the existing patterns and conventions
2. Use existing tokens for visual properties
3. Ensure components are accessible and responsive
4. Write documentation and examples
5. Add tests for all functionality

## Resources

For more information on the design system, see:

- [Component Documentation](./components/README.md)
- [Token Documentation](./tokens/README.md)
- [Theme System](./ThemeProvider.tsx) 