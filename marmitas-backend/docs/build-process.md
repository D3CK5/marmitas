# Backend Build Process Documentation

This document outlines the build process for the Marmitas backend application.

## Environment Configuration

The build process uses environment-specific configuration files:

- `.env.development` - Development environment settings
- `.env.test` - Test environment settings
- `.env.production` - Production environment settings

Each environment file contains configuration variables that control the build process and runtime behavior.

## Build Commands

The following build commands are available:

- `npm run dev` - Start the development server with hot reloading
- `npm run build` - Build for the current NODE_ENV (defaults to development)
- `npm run build:dev` - Build for development environment
- `npm run build:test` - Build for test environment
- `npm run build:prod` - Build for production environment
- `npm run start` - Start the built application
- `npm run start:dev` - Start the built application with development environment
- `npm run start:test` - Start the built application with test environment
- `npm run start:prod` - Start the built application with production environment

## TypeScript Configuration

The TypeScript compiler is configured in `tsconfig.json` with the following optimizations:

- ES2022 target for modern Node.js compatibility
- Source maps for debugging
- Declaration files for improved type checking
- Strict type checking enabled
- Path aliases for cleaner imports (`@/*` points to `src/*`)
- Various compiler flags to ensure code quality:
  - `noImplicitAny`
  - `noUnusedLocals`
  - `noUnusedParameters`
  - `noFallthroughCasesInSwitch`

## Environment Loading

Environment variables are loaded at runtime from the appropriate `.env.*` file based on the current `NODE_ENV`. This is handled by the `src/config/env.ts` module, which provides type-safe access to configuration values.

## Code Organization

- Source code is located in the `src` directory
- Compiled output goes to the `dist` directory
- Test files are excluded from the production build

## Build Process

The build process:

1. Cleans the output directory using `rimraf`
2. Compiles TypeScript to JavaScript
3. Generates type declaration files
4. Creates source maps for debugging

This process ensures that the backend application is optimized for the target environment. 