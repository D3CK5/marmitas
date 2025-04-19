# Type Analysis Document

This document catalogs the types found in the frontend and backend that need to be shared in the common package.

## Core Domain Models

### User/Profile Related

**Backend (api.types.ts):**
```typescript
export interface UserModel {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

**Frontend (auth-store.ts):**
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'customer';
  avatarUrl?: string;
}
```

**Observations:**
- Backend version is simpler
- Frontend includes role and avatarUrl
- Frontend doesn't have timestamps
- Need to create a merged version that satisfies both

### Product Related

**Backend (api.types.ts):**
```typescript
export interface ProductModel {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Frontend (product-store.ts):**
```typescript
export interface Product extends Entity {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isAvailable: boolean;
  ingredients?: string[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

**Observations:**
- Frontend has more fields (ingredients, nutritionalInfo)
- Backend has "category" while frontend has "categoryId"
- Both have timestamps
- Need to create a merged version

### Order Related

**Backend (api.types.ts):**
```typescript
export interface OrderModel {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
  items: OrderItemModel[];
  deliveryAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemModel {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
```

**Frontend has similar models in various places**

### Address Related

**Frontend has various Address interfaces:**
- In profile hooks
- In customer hooks
- In checkout components

### API Related Types

**Backend (api.types.ts):**
```typescript
export interface ApiResponse<T> {
  data: T;
  status: 'success';
  timestamp: string;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
  status: 'error';
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  status: 'success';
  timestamp: string;
}
```

## Common Enums

**Order Status:**
- Backend: 'pending' | 'processing' | 'completed' | 'cancelled'
- Frontend: 'pending' | 'awaiting_payment' | 'preparing' | 'completed' | 'cancelled'
- Need to create a unified enum

**User Role:**
- Frontend: 'admin' | 'user' | 'customer'

## Implementation Plan

1. Create base model interfaces in `models` directory
2. Create request/response interfaces in `api` directory
3. Create unified enums and constants
4. Ensure proper exports from index files 