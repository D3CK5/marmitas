# Frontend Build Process Documentation

This document outlines the build process for the Marmitas frontend application.

## Environment Configuration

The build process uses environment-specific configuration files:

- `.env.development` - Development environment settings
- `.env.test` - Test environment settings
- `.env.production` - Production environment settings

Each environment file contains configuration variables that control the build process and runtime behavior.

## Build Commands

The following build commands are available:

- `npm run dev` - Start the development server
- `npm run build` - Build for production (default)
- `npm run build:dev` - Build for development environment
- `npm run build:test` - Build for test environment
- `npm run build:prod` - Build for production environment
- `npm run analyze` - Analyze the bundle size
- `npm run preview` - Preview the built application

## Build Configuration

The build process is configured in `vite.config.ts` and includes:

### Optimization Settings

- Source maps are enabled for development and test builds
- Minification is enabled for production builds
- Code is targeted for ES2020
- Bundle chunks are optimized for vendor libraries and UI components
- CSS is processed with source maps for development

### Proxy Configuration

The development server includes a proxy configuration that forwards API requests to the backend server.

### Path Aliases

The `@` alias is configured to point to the `src` directory, enabling cleaner imports.

## Bundle Analysis

You can analyze the bundle size using:

```bash
npm run analyze
```

This will generate a report showing the size of each bundle chunk. 