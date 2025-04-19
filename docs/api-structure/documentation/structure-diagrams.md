# API Structure Diagrams

This document provides visual representations of the Marmitas API structure to help developers understand the organization and relationships between components.

## Directory Structure Diagram

```
marmitas-backend/
│
├── src/
│   ├── controllers/     # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── example.controller.ts
│   │   └── ...
│   │
│   ├── routes/          # API routes
│   │   ├── index.ts     # Main router
│   │   ├── auth.routes.ts
│   │   ├── docs.routes.ts
│   │   └── ...
│   │
│   ├── services/        # Business logic
│   │   ├── auth.service.ts
│   │   ├── database.service.ts
│   │   └── ...
│   │
│   ├── models/          # Data models
│   │   └── ...
│   │
│   ├── middleware/      # Request processing
│   │   ├── auth.middleware.ts
│   │   └── ...
│   │
│   ├── utils/           # Utilities
│   │   ├── api.utils.ts
│   │   └── ...
│   │
│   ├── config/          # Configuration
│   │   └── ...
│   │
│   ├── types/           # TypeScript types
│   │   └── ...
│   │
│   ├── docs/            # API documentation
│   │   ├── api-spec.ts
│   │   └── ...
│   │
│   └── test/            # Tests
│       └── ...
│
├── dist/                # Compiled JavaScript
│   └── ...
│
└── ...                  # Other project files
```

## Component Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │     │                 │
│      Client     │────▶│      Routes     │────▶│   Controllers   │────▶│    Services     │
│                 │     │                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
                              │                        │                        │
                              │                        │                        │
                              ▼                        ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │     │                 │
                        │   Middleware    │     │     Utils       │     │     Models      │
                        │                 │     │                 │     │                 │
                        └─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Request Flow Diagram

```
┌────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│        │     │            │     │            │     │            │     │            │
│ Client │────▶│ Middleware │────▶│   Router   │────▶│ Controller │────▶│  Service   │
│        │     │            │     │            │     │            │     │            │
└────────┘     └────────────┘     └────────────┘     └────────────┘     └────────────┘
    ▲                                                       │                  │
    │                                                       │                  │
    │                                                       │                  ▼
    │                                                       │           ┌────────────┐
    │                                                       │           │            │
    │           ┌───────────────────────────────────────────┘           │   Model    │
    │           │                                                       │            │
    │           │                                                       └────────────┘
    │           ▼
┌────────────────────────┐
│                        │
│    HTTP Response        │
│                        │
└────────────────────────┘
```

## Module Dependency Diagram

```
┌──────────────────┐
│                  │     imports
│     Routes       │───────────────┐
│                  │               │
└──────────────────┘               ▼
                            ┌──────────────────┐
                            │                  │     imports
                            │   Controllers    │───────────────┐
                            │                  │               │
                            └──────────────────┘               ▼
                                                       ┌──────────────────┐
                                                       │                  │     imports
                                                       │    Services      │───────────────┐
                                                       │                  │               │
                                                       └──────────────────┘               ▼
                                                                                 ┌──────────────────┐
                                                                                 │                  │
                                                                                 │     Models       │
                                                                                 │                  │
                                                                                 └──────────────────┘
          imports                            imports                                     ▲
┌──────────────────┐               ┌──────────────────┐                                  │
│                  │               │                  │               imports            │
│   Middleware     │───────────────│     Utils        │───────────────────────────────────
│                  │               │                  │
└──────────────────┘               └──────────────────┘
```

## Authentication Flow Diagram

```
┌─────────┐         ┌────────────┐         ┌────────────┐         ┌────────────┐
│         │ Request │            │ Check   │            │ Verify  │            │
│ Client  │────────▶│ Middleware │────────▶│ Auth       │────────▶│ Auth       │
│         │         │            │ Token   │ Middleware │ Token   │ Service    │
└─────────┘         └────────────┘         └────────────┘         └────────────┘
     │                    │                      │                      │
     │                    │                      │                      │
     │                    │                      │                      │
     │                    ▼                      ▼                      ▼
     │              ┌────────────┐         ┌────────────┐         ┌────────────┐
     │              │            │ No      │            │ Invalid │            │
     │              │ Token      │────────▶│ Return     │◀───────┤ Token      │
     │              │ Exists?    │ Token   │ 401        │ Token   │ Valid?     │
     │              └────────────┘         └────────────┘         └────────────┘
     │                    │                                             │
     │                    │ Yes                                         │ Valid
     │                    ▼                                             ▼
     │              ┌────────────┐                                ┌────────────┐
     │              │            │                                │            │
     │              │ Continue   │                                │ Add User   │
     │              │ to Route   │                                │ to Request │
     │              └────────────┘                                └────────────┘
     │                    │                                             │
     │                    └─────────────────────────────────────────────┘
     │                                        │
     │                                        ▼
     │                                 ┌────────────┐
     │                                 │            │
     └────────────────────────────────▶│ Controller │
                                       │            │
                                       └────────────┘
```

## API Endpoint Structure Diagram

```
/api
 │
 ├── /auth
 │    ├── POST /login       - Authenticate user
 │    ├── POST /register    - Register new user
 │    ├── POST /logout      - Logout user
 │    └── GET  /profile     - Get user profile
 │
 ├── /users
 │    ├── GET  /            - List users
 │    ├── GET  /:id         - Get user by ID
 │    ├── PUT  /:id         - Update user
 │    └── DELETE /:id       - Delete user
 │
 ├── /products
 │    ├── GET  /            - List products
 │    ├── GET  /:id         - Get product by ID
 │    ├── POST /            - Create product
 │    ├── PUT  /:id         - Update product
 │    └── DELETE /:id       - Delete product
 │
 └── /docs
      ├── GET  /            - API documentation
      └── GET  /endpoints   - List all endpoints
```

## Controller Structure Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ ExampleController                                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ getItems(req: Request, res: Response): Promise<void>     │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 1. Extract query parameters                              │ │
│ │ 2. Call service method                                   │ │
│ │ 3. Return formatted response                             │ │
│ │ 4. Handle errors                                         │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ getItemById(req: Request, res: Response): Promise<void>  │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 1. Extract item ID from request parameters               │ │
│ │ 2. Call service method                                   │ │
│ │ 3. Return formatted response                             │ │
│ │ 4. Handle errors                                         │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ createItem(req: Request, res: Response): Promise<void>   │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 1. Extract item data from request body                   │ │
│ │ 2. Validate data                                         │ │
│ │ 3. Call service method                                   │ │
│ │ 4. Return formatted response                             │ │
│ │ 5. Handle errors                                         │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Comparison to Original Plan Structure

```
Current Structure                  Original Plan Structure
───────────────────                ──────────────────────
src/                               src/
├── controllers/                   ├── api/
├── routes/                        │   ├── endpoints/
├── middleware/                    │   ├── dto/
├── services/                      │   ├── validation/
├── models/                        │   └── documentation/
├── utils/                         ├── domain/
├── config/                        ├── infrastructure/
├── types/                         └── utils/
├── docs/
└── test/
```

## Migration Path Visualization

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Current        │     │  Intermediate    │     │  Target         │
│  Structure      │────▶│  Structure       │────▶│  Structure      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      │                        │                       │
      ▼                        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ controllers/    │     │ api/            │     │ api/            │
│ routes/         │     │ └─ endpoints/   │     │ ├─ endpoints/   │
└─────────────────┘     │    (part 1)     │     │ ├─ dto/         │
      │                 └─────────────────┘     │ ├─ validation/  │
      ▼                        │                │ └─ documentation│
┌─────────────────┐     ┌─────────────────┐     └─────────────────┘
│ types/          │     │ types/          │             │
│ docs/           │     │ api/            │             ▼
└─────────────────┘     │ └─ dto/ (part 1)│     ┌─────────────────┐
                        └─────────────────┘     │ domain/         │
                                                │ infrastructure/  │
                                                │ utils/           │
                                                └─────────────────┘
``` 