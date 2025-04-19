/**
 * API Response types
 */

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

/**
 * API Request types
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

/**
 * Resource models reflect the core business entities of the application
 */

export interface UserModel {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

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

// Request and response DTOs for each entity
export namespace User {
  export interface CreateRequest {
    email: string;
    name: string;
    password: string;
  }
  
  export interface UpdateRequest {
    name?: string;
    email?: string;
  }
  
  export type Response = Omit<UserModel, 'password'>;
}

export namespace Product {
  export interface CreateRequest {
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    category: string;
    isAvailable?: boolean;
  }
  
  export interface UpdateRequest {
    name?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    category?: string;
    isAvailable?: boolean;
  }
  
  export type Response = ProductModel;
}

export namespace Order {
  export interface CreateRequest {
    items: {
      productId: string;
      quantity: number;
    }[];
    deliveryAddress?: string;
  }
  
  export interface UpdateRequest {
    status?: 'pending' | 'processing' | 'completed' | 'cancelled';
    deliveryAddress?: string;
  }
  
  export type Response = OrderModel;
} 