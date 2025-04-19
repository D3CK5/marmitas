import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './client';
import { Product, ProductCategory, ProductFilters } from '../stores/product-store';

/**
 * API endpoint constants
 */
const ENDPOINTS = {
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
};

/**
 * Query key factory for products
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters = {}) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  categories: ['productCategories'] as const,
};

/**
 * Fetch products from API
 */
export const fetchProducts = async (
  filters: ProductFilters = {}
): Promise<Product[]> => {
  // Build query parameters from filters
  const params = new URLSearchParams();
  
  if (filters.categoryId) {
    params.append('categoryId', filters.categoryId);
  }
  
  if (filters.query) {
    params.append('q', filters.query);
  }
  
  if (filters.minPrice !== undefined) {
    params.append('minPrice', filters.minPrice.toString());
  }
  
  if (filters.maxPrice !== undefined) {
    params.append('maxPrice', filters.maxPrice.toString());
  }
  
  if (filters.available !== undefined) {
    params.append('available', filters.available.toString());
  }
  
  // Construct URL with query parameters
  const url = `${ENDPOINTS.PRODUCTS}?${params.toString()}`;
  
  try {
    return await api.get<Product[]>(url, {
      cacheKey: `products:${params.toString()}`,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Fetch product by ID
 */
export const fetchProductById = async (id: string): Promise<Product> => {
  try {
    return await api.get<Product>(`${ENDPOINTS.PRODUCTS}/${id}`, {
      cacheKey: `product:${id}`,
    });
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch product categories
 */
export const fetchProductCategories = async (): Promise<ProductCategory[]> => {
  try {
    return await api.get<ProductCategory[]>(ENDPOINTS.CATEGORIES, {
      cacheKey: 'productCategories',
    });
  } catch (error) {
    console.error('Error fetching product categories:', error);
    throw error;
  }
};

/**
 * Create product
 */
export const createProduct = async (
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> => {
  try {
    return await api.post<Product>(ENDPOINTS.PRODUCTS, product);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update product
 */
export const updateProduct = async (
  id: string,
  updates: Partial<Product>
): Promise<Product> => {
  try {
    return await api.patch<Product>(`${ENDPOINTS.PRODUCTS}/${id}`, updates);
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await api.delete<void>(`${ENDPOINTS.PRODUCTS}/${id}`);
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
};

/**
 * Custom hook for fetching products
 */
export const useProducts = (filters: ProductFilters = {}) => {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchProducts(filters),
  });
};

/**
 * Custom hook for fetching a product by ID
 */
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProductById(id),
    enabled: !!id, // Only run if ID is provided
  });
};

/**
 * Custom hook for fetching product categories
 */
export const useProductCategories = () => {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: fetchProductCategories,
  });
};

/**
 * Custom hook for creating a product
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => 
      createProduct(product),
    onSuccess: () => {
      // Invalidate products list query
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

/**
 * Custom hook for updating a product
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) => 
      updateProduct(id, updates),
    onSuccess: (updatedProduct) => {
      // Update product in cache
      queryClient.setQueryData(
        productKeys.detail(updatedProduct.id),
        updatedProduct
      );
      
      // Invalidate products list query
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

/**
 * Custom hook for deleting a product
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: (_, id) => {
      // Remove product from cache
      queryClient.removeQueries({ queryKey: productKeys.detail(id) });
      
      // Invalidate products list query
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}; 