# Marmitas Types

This package contains shared TypeScript type definitions for the Marmitas application. It serves as the single source of truth for data structures passing between frontend and backend.

## Installation

```bash
# From within frontend or backend project
npm install --save ../marmitas-types
```

## Usage

Import types from the package in your TypeScript files:

```typescript
// Frontend or backend code
import { User, Order, Delivery } from 'marmitas-types';

// Use the types
const user: User = {
  // ...
};
```

## Versioning

This package follows semantic versioning:

- **MAJOR** version for incompatible API changes
- **MINOR** version for functionality added in a backward compatible manner
- **PATCH** version for backward compatible bug fixes

## Development

### Building the package

```bash
npm run build
```

### Publishing a new version

To publish a new version with appropriate semantic versioning:

```bash
# Patch update (backward compatible bug fixes)
npm run version:patch

# Minor update (backward compatible features)
npm run version:minor

# Major update (breaking changes)
npm run version:major
```

## Type Organization

Types are organized by domain namespace:

- `models/` - Domain model types representing core business entities
- `api/` - API request and response types for frontend-backend communication 