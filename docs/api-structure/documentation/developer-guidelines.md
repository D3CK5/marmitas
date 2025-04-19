# Marmitas API Developer Guidelines

This document provides guidelines and best practices for developers working with the Marmitas API structure. It aims to ensure consistency, maintainability, and proper integration with the existing codebase.

## General Architecture Guidelines

### API Request Flow

Follow the established request flow pattern:
1. Define routes in appropriate route files
2. Implement controller methods to handle requests
3. Use services for business logic implementation
4. Use models for data operations

### Separation of Concerns

Maintain clear separation between:
- **Routes**: Define API endpoints and routing
- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Models**: Define data structures and database interactions

### File Organization

Organize files according to these principles:
- Group related functionality by resource or feature
- Use consistent naming conventions
- Place files in appropriate directories based on their role
- Create new directories only when a clear organizational need exists

## Adding New API Endpoints

### 1. Route Definition

Create or update route files in the `routes/` directory:

```typescript
// Example: routes/products.routes.ts
import { Router } from 'express';
import { ProductsController } from '../controllers/products.controller.js';

const router = Router();
const productsController = new ProductsController();

// GET /api/products
router.get('/', productsController.getAllProducts);

// GET /api/products/:id
router.get('/:id', productsController.getProductById);

// POST /api/products
router.post('/', productsController.createProduct);

// PUT /api/products/:id
router.put('/:id', productsController.updateProduct);

// DELETE /api/products/:id
router.delete('/:id', productsController.deleteProduct);

export { router as productsRoutes };
```

Register the route in `routes/index.ts`:

```typescript
// In routes/index.ts
import { productsRoutes } from './products.routes.js';

// ...

apiGateway.registerRoute('/products', productsRoutes, {
  authRequired: false, // Set according to your requirements
  description: 'Product management endpoints'
});
```

### 2. Controller Implementation

Create or update controller files in the `controllers/` directory:

```typescript
// Example: controllers/products.controller.ts
import { Request, Response } from 'express';
import { productsService } from '../services/products.service.js';
import { apiResponse } from '../utils/api.utils.js';

export class ProductsController {
  /**
   * Get all products
   */
  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const products = await productsService.findAll({
        limit: parseInt(req.query.limit as string) || 10,
        offset: parseInt(req.query.offset as string) || 0,
      });
      
      apiResponse.success(res, { products });
    } catch (error: any) {
      apiResponse.error(res, error.message || 'Failed to retrieve products');
    }
  }
  
  // Implement other methods: getProductById, createProduct, updateProduct, deleteProduct
}
```

### 3. Service Implementation

Create or update service files in the `services/` directory:

```typescript
// Example: services/products.service.ts
import { dbService } from './database.service.js';
import { Product } from '../types/product.types.js';

class ProductsService {
  async findAll({ limit = 10, offset = 0 } = {}) {
    return dbService.find('products', { limit, offset });
  }
  
  async findById(id: string) {
    return dbService.findOne('products', { id });
  }
  
  // Implement other methods: create, update, delete
}

export const productsService = new ProductsService();
```

### 4. Type Definitions

Create or update type definitions in the `types/` directory:

```typescript
// Example: types/product.types.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCreateInput {
  name: string;
  description: string;
  price: number;
  category: string;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
}
```

### 5. API Documentation

Update the API specification in `docs/api-spec.ts`:

```typescript
// Example addition to docs/api-spec.ts
export const apiSpec = {
  // ... existing spec
  endpoints: [
    // ... existing endpoints
    {
      path: '/products',
      methods: {
        get: {
          description: 'Get all products',
          parameters: {
            limit: 'number',
            offset: 'number'
          },
          response: {
            200: {
              products: 'Product[]'
            }
          }
        },
        post: {
          description: 'Create a new product',
          request: {
            body: 'ProductCreateInput'
          },
          response: {
            201: {
              product: 'Product'
            }
          }
        }
      }
    }
  ]
};
```

## Code Style Guidelines

### Naming Conventions

- **Files**: Use lowercase, hyphen-separated names with functionality type as suffix:
  - `auth.controller.ts`
  - `product.types.ts`
  - `auth.routes.ts`
  
- **Classes**: Use PascalCase with functionality type as suffix:
  - `AuthController`
  - `ProductsService`
  
- **Interfaces and Types**: Use PascalCase:
  - `Product`
  - `UserCredentials`
  
- **Functions and Methods**: Use camelCase:
  - `getAllProducts`
  - `authenticateUser`
  
- **Variables**: Use camelCase:
  - `productList`
  - `authToken`

### Documentation

- Document all public APIs, classes, and methods
- Include descriptions of parameters and return values
- Document expected errors and edge cases
- Use JSDoc format for code documentation

Example:
```typescript
/**
 * Retrieves a product by its ID
 * 
 * @param id - The unique identifier of the product
 * @returns The product if found
 * @throws {NotFoundError} If the product doesn't exist
 */
async getProductById(id: string): Promise<Product> {
  // Implementation
}
```

### Error Handling

- Use consistent error handling patterns
- Catch and handle errors at the controller level
- Use the `apiResponse` utility for error responses
- Include meaningful error messages and appropriate status codes

Example:
```typescript
try {
  const result = await someOperation();
  apiResponse.success(res, result);
} catch (error: any) {
  apiResponse.error(
    res, 
    error.message || 'An unexpected error occurred',
    error.status || 500,
    error.code || 'UNKNOWN_ERROR'
  );
}
```

## Testing Guidelines

- Write unit tests for controllers, services, and utilities
- Test happy path and error scenarios
- Mock external dependencies when testing
- Organize tests to mirror the structure of the code being tested

## API Extension and Modification

### Adding New Resources

1. Define types in `types/`
2. Create or update service in `services/`
3. Implement controller in `controllers/`
4. Define routes in `routes/`
5. Register routes in `routes/index.ts`
6. Update API documentation in `docs/`

### Modifying Existing Resources

1. Update types if the data model changes
2. Modify service methods as needed
3. Update controller methods for new behavior
4. Update routes if endpoint patterns change
5. Update API documentation to reflect changes

## Migration Considerations

When adding new functionality, consider these guidelines for aligning with the originally planned structure:

1. Keep related functionality together (routes, controllers, types, etc.)
2. Document the relationship to the planned API structure
3. Consider future refactoring to the planned structure
4. Follow consistent patterns even if directory structure differs

## Security Guidelines

- Validate all input data
- Implement proper authentication checks
- Use middleware for cross-cutting security concerns
- Apply consistent authorization checks in controllers
- Sanitize data before returning in responses

## Performance Considerations

- Implement pagination for list endpoints
- Use efficient database queries
- Consider caching for frequently accessed data
- Minimize response payload size
- Structure code to allow for performance optimization 