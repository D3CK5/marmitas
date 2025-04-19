# Current Backend API Structure Analysis

## Directory Structure

The current Marmitas backend follows a traditional Express.js application structure with the following main directories:

```
marmitas-backend/src/
├── controllers/     # Contains controller classes handling request logic
├── routes/          # Contains route definitions
├── models/          # Contains data models
├── services/        # Contains business logic services
├── middleware/      # Contains middleware functions
├── utils/           # Contains utility functions
├── config/          # Contains configuration files
├── types/           # Contains TypeScript type definitions
├── docs/            # Contains API documentation
└── test/            # Contains test files
```

## Request Flow Pattern

The current backend implements a traditional pattern for handling API requests:

1. Routes are defined in `routes/` directory files
2. Routes are registered on the Express router (in `routes/index.ts`)
3. Routes delegate processing to controller methods
4. Controllers (in `controllers/`) implement the request handling logic
5. Controllers may use services for business logic implementation
6. Controllers return responses directly to the client

## API Documentation

The API is documented in `src/docs/api-spec.ts`, which defines:

- API information (title, version, description)
- Base path (`/api`)
- Endpoints with their paths, methods, and expected request/response formats

## Authentication Pattern

Authentication is implemented through middleware with:
- Some routes requiring authentication and others being publicly accessible
- Authentication state checked in controllers for routes with mixed access requirements

## Example Controller Structure

Controllers are implemented as classes with methods handling specific endpoints. Example:

```typescript
export class ExampleController {
  async getItems(req: Request, res: Response): Promise<void> {
    // Implementation logic
  }
  
  // Other methods
}
```

## API Response Pattern

Responses appear to follow a standardized format, with:
- Success responses including the requested data
- Error responses including error message and potentially error code

## Divergence from Original Plan

The current implementation diverges from the original separation plan in the following ways:

1. Uses `controllers/` and `routes/` directories instead of `api/endpoints`
2. No explicit `api/dto` directory for data transfer objects
3. Type definitions are kept in a general `types/` directory instead of a dedicated DTO location 