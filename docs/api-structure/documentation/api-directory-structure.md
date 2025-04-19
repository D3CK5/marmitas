# Marmitas API Directory Structure Documentation

This document provides a comprehensive overview of the Marmitas backend API directory structure, detailing the organization, purpose, and relationships between components.

## Directory Structure Overview

The Marmitas backend API follows a traditional Express.js application structure with the following organization:

```
marmitas-backend/src/
├── controllers/        # Request handlers implementing business logic
├── routes/             # API route definitions and registration
├── models/             # Data models and schemas
├── services/           # Business logic services
├── middleware/         # Request processing middleware
├── utils/              # Utility functions and helpers
├── config/             # Application configuration
├── types/              # TypeScript type definitions
├── docs/               # API documentation
└── test/               # Test files
```

## Directory Purposes and Contents

### controllers/

**Purpose**: Contains controller classes that handle requests for specific API endpoints.

**Contents**:
- Controller classes organized by resource or feature
- Each controller typically handles CRUD operations for a specific resource
- Controllers implement the business logic for API endpoints
- Controllers interact with services and models to fulfill requests

**Example files**:
- `auth.controller.ts` - Handles authentication operations
- `example.controller.ts` - Example controller demonstrating API patterns
- `user.controller.ts` - User-related operations

### routes/

**Purpose**: Defines API routes and maps them to controller methods.

**Contents**:
- Route definition files organized by resource or feature
- Router configuration and middleware application
- Registration of routes with the Express application
- Authentication requirements for routes

**Example files**:
- `index.ts` - Main router that combines all route modules
- `auth.routes.ts` - Authentication-related routes
- `docs.routes.ts` - Documentation access routes

### models/

**Purpose**: Defines data models, schemas, and database interaction.

**Contents**:
- Data model definitions
- Schema validations
- Database interaction methods
- Data structure definitions

### services/

**Purpose**: Implements business logic and external service integration.

**Contents**:
- Service classes that implement business logic
- Integration with external services and APIs
- Database operations and data processing
- Reusable business logic shared across controllers

**Example files**:
- `auth.service.ts` - Authentication and authorization logic
- `database.service.ts` - Database interaction service

### middleware/

**Purpose**: Provides request processing middleware for Express application.

**Contents**:
- Authentication middleware
- Request validation middleware
- Error handling middleware
- Logging and monitoring middleware

### utils/

**Purpose**: Contains utility functions and helper methods.

**Contents**:
- Helper functions for common tasks
- Utility classes for reusable functionality
- Formatting and validation utilities
- API response formatting helpers

**Example files**:
- `api.utils.ts` - Utilities for API response formatting

### config/

**Purpose**: Contains application configuration.

**Contents**:
- Environment-specific configuration
- Default configuration values
- Configuration loading and processing

### types/

**Purpose**: Contains TypeScript type definitions.

**Contents**:
- Interface definitions for API requests and responses
- Type definitions for data models
- Custom type definitions for application functionality
- Shared types used across the application

### docs/

**Purpose**: Contains API documentation.

**Contents**:
- API specification
- OpenAPI/Swagger documentation
- API usage examples
- Developer documentation

**Example files**:
- `api-spec.ts` - API specification defining endpoints and data structures

### test/

**Purpose**: Contains test files for application components.

**Contents**:
- Unit tests
- Integration tests
- Test utilities and mocks
- Test configuration

## Dependency Relationships

The components in the directory structure have the following dependency relationships:

```
routes/ -> controllers/ -> services/ -> models/
    │           │             │
    │           │             └─> utils/
    │           └─> utils/
    └─> middleware/
```

- Routes depend on controllers and middleware
- Controllers depend on services and utils
- Services depend on models and utils
- Middleware may depend on utils and services

## API Request Flow

The typical flow of an API request through the directory structure is:

1. A request is received by the Express application
2. The request is routed through appropriate middleware (in `middleware/`)
3. The router (in `routes/`) matches the request to a controller method
4. The controller method (in `controllers/`) processes the request
5. The controller may call services (in `services/`) to execute business logic
6. The services may interact with models (in `models/`) for data operations
7. The response is formatted and returned to the client

## Directory Structure Conventions

The API follows these conventions in its directory structure:

1. **File Naming**: Uses descriptive names with functionality type as suffix (e.g., `auth.controller.ts`)
2. **Module Organization**: Groups related functionality by resource or feature
3. **Separation of Concerns**: Separates routing, request handling, and business logic
4. **Controller Pattern**: Uses controller classes for request handling
5. **Service Layer**: Implements business logic in service classes
6. **Type Safety**: Uses TypeScript interfaces and types for API contracts

## Configuration and Environment

The application configuration is managed through:

1. Environment variables
2. Configuration files in the `config/` directory
3. Default values defined in application code

## Documentation Approach

API documentation is maintained through:

1. API specification in `docs/api-spec.ts`
2. Code comments in TypeScript files
3. External documentation in Markdown format 