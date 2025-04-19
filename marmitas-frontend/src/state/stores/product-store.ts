import { create } from 'zustand';
import { logger, persist, withReset } from '../utils/store-utils';
import { 
  AsyncState, 
  AsyncStatus, 
  createInitialAsyncState, 
  setLoadingState, 
  setSuccessState, 
  setErrorState,
  NormalizedData,
  createEmptyNormalizedData,
  normalizeData,
  Entity
} from '../types';

/**
 * Product Category interface
 */
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

/**
 * Product interface
 */
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

/**
 * Product filter options interface
 */
export interface ProductFilters {
  categoryId?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
}

/**
 * Product state interface
 */
export interface ProductState {
  // All products
  products: AsyncState<NormalizedData<Product>>;
  
  // Product categories
  categories: AsyncState<ProductCategory[]>;
  
  // Current product view
  currentProduct: AsyncState<Product>;
  
  // Filters and sorting
  filters: ProductFilters;
  
  // Optimistic updates
  pendingChanges: Record<string, boolean>;
  
  // UI state
  isInitialized: boolean;
}

/**
 * Product actions interface
 */
export interface ProductActions {
  // Fetch products
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  
  // Fetch product by ID
  fetchProductById: (id: string) => Promise<void>;
  
  // Fetch categories
  fetchCategories: () => Promise<void>;
  
  // Create product
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  
  // Update product
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  
  // Delete product
  deleteProduct: (id: string) => Promise<void>;
  
  // Set filters
  setFilters: (filters: ProductFilters) => void;
  clearFilters: () => void;
  
  // Reset state
  resetState: () => void;
}

/**
 * Initial product state
 */
const initialState: ProductState = {
  products: createInitialAsyncState<NormalizedData<Product>>(),
  categories: createInitialAsyncState<ProductCategory[]>(),
  currentProduct: createInitialAsyncState<Product>(),
  filters: {},
  pendingChanges: {},
  isInitialized: false,
};

/**
 * Mock product data for examples
 */
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Frango ao Curry',
    description: 'Frango ao curry com arroz e legumes',
    price: 24.90,
    imageUrl: 'https://example.com/frango-curry.jpg',
    categoryId: '1',
    isAvailable: true,
    ingredients: ['frango', 'curry', 'arroz', 'legumes'],
    nutritionalInfo: {
      calories: 450,
      protein: 30,
      carbs: 45,
      fat: 15,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Picadinho de Carne',
    description: 'Picadinho de carne com purê de batata e arroz',
    price: 26.90,
    imageUrl: 'https://example.com/picadinho.jpg',
    categoryId: '2',
    isAvailable: true,
    ingredients: ['carne', 'batata', 'arroz'],
    nutritionalInfo: {
      calories: 520,
      protein: 35,
      carbs: 50,
      fat: 18,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockCategories: ProductCategory[] = [
  { id: '1', name: 'Frango', description: 'Pratos com frango' },
  { id: '2', name: 'Carne', description: 'Pratos com carne' },
  { id: '3', name: 'Vegetariano', description: 'Pratos vegetarianos' },
  { id: '4', name: 'Peixe', description: 'Pratos com peixe' },
];

/**
 * Reset function for product store
 */
const resetProductState = () => initialState;

/**
 * Product store creation
 */
export const useProductStore = create<ProductState & ProductActions>()(
  logger(
    persist(
      withReset(
        (set, get) => ({
          ...initialState,
          
          // Fetch products
          fetchProducts: async (filters?: ProductFilters) => {
            set(state => ({
              ...state,
              products: setLoadingState(state.products),
              filters: filters || state.filters,
            }));
            
            try {
              // This would be an actual API call in a real application
              // Simulating API call for example purposes
              const mockApiCall = () => new Promise<Product[]>((resolve) => {
                setTimeout(() => {
                  let filteredProducts = [...mockProducts];
                  
                  // Apply filters if provided
                  if (filters) {
                    if (filters.categoryId) {
                      filteredProducts = filteredProducts.filter(p => p.categoryId === filters.categoryId);
                    }
                    
                    if (filters.query) {
                      const query = filters.query.toLowerCase();
                      filteredProducts = filteredProducts.filter(p => 
                        p.name.toLowerCase().includes(query) || 
                        p.description.toLowerCase().includes(query)
                      );
                    }
                    
                    if (filters.minPrice !== undefined) {
                      filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!);
                    }
                    
                    if (filters.maxPrice !== undefined) {
                      filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!);
                    }
                    
                    if (filters.available !== undefined) {
                      filteredProducts = filteredProducts.filter(p => p.isAvailable === filters.available);
                    }
                  }
                  
                  resolve(filteredProducts);
                }, 500);
              });
              
              const products = await mockApiCall();
              const normalizedProducts = normalizeData(products);
              
              set({
                products: setSuccessState(normalizedProducts),
                isInitialized: true,
              });
            } catch (error) {
              set({
                products: setErrorState(error as Error),
              });
            }
          },
          
          // Fetch product by ID
          fetchProductById: async (id: string) => {
            set(state => ({
              ...state,
              currentProduct: setLoadingState(state.currentProduct),
            }));
            
            try {
              // This would be an actual API call in a real application
              // Simulating API call for example purposes
              const mockApiCall = () => new Promise<Product | undefined>((resolve) => {
                setTimeout(() => {
                  const product = mockProducts.find(p => p.id === id);
                  resolve(product);
                }, 300);
              });
              
              const product = await mockApiCall();
              
              if (!product) {
                throw new Error(`Product with ID ${id} not found`);
              }
              
              set({
                currentProduct: setSuccessState(product),
              });
            } catch (error) {
              set({
                currentProduct: setErrorState(error as Error),
              });
            }
          },
          
          // Fetch categories
          fetchCategories: async () => {
            set(state => ({
              ...state,
              categories: setLoadingState(state.categories),
            }));
            
            try {
              // This would be an actual API call in a real application
              // Simulating API call for example purposes
              const mockApiCall = () => new Promise<ProductCategory[]>((resolve) => {
                setTimeout(() => {
                  resolve(mockCategories);
                }, 300);
              });
              
              const categories = await mockApiCall();
              
              set({
                categories: setSuccessState(categories),
              });
            } catch (error) {
              set({
                categories: setErrorState(error as Error),
              });
            }
          },
          
          // Create product
          createProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
            const timestamp = new Date().toISOString();
            
            // Create a new product with generated ID and timestamps
            const newProduct: Product = {
              ...product as any,
              id: `new-${Date.now()}`,
              createdAt: timestamp,
              updatedAt: timestamp,
            };
            
            // Add optimistic update
            set(state => {
              // Current products
              const currentProducts = state.products.data 
                ? { ...state.products.data } 
                : createEmptyNormalizedData<Product>();
              
              // Add new product to normalized data
              const updatedProducts = {
                byId: {
                  ...currentProducts.byId,
                  [newProduct.id]: newProduct,
                },
                allIds: [...currentProducts.allIds, newProduct.id],
              };
              
              return {
                ...state,
                products: setSuccessState(updatedProducts),
                pendingChanges: {
                  ...state.pendingChanges,
                  [newProduct.id]: true,
                },
              };
            });
            
            try {
              // This would be an actual API call in a real application
              // Simulating API call for example purposes
              const mockApiCall = () => new Promise<Product>((resolve) => {
                setTimeout(() => {
                  // Generate server-side ID and return
                  const serverProduct = {
                    ...newProduct,
                    id: `server-${Date.now()}`,
                  };
                  resolve(serverProduct);
                }, 500);
              });
              
              const createdProduct = await mockApiCall();
              
              // Update with real product from server
              set(state => {
                // Current products
                const currentProducts = state.products.data 
                  ? { ...state.products.data } 
                  : createEmptyNormalizedData<Product>();
                
                // Remove optimistic product and add real one
                const { [newProduct.id]: optimisticProduct, ...remainingProducts } = currentProducts.byId;
                
                const updatedProducts = {
                  byId: {
                    ...remainingProducts,
                    [createdProduct.id]: createdProduct,
                  },
                  allIds: currentProducts.allIds
                    .filter(id => id !== newProduct.id)
                    .concat(createdProduct.id),
                };
                
                // Remove from pending changes
                const { [newProduct.id]: _, ...remainingChanges } = state.pendingChanges;
                
                return {
                  ...state,
                  products: setSuccessState(updatedProducts),
                  pendingChanges: remainingChanges,
                };
              });
              
              return createdProduct;
            } catch (error) {
              // Revert optimistic update on error
              set(state => {
                // Current products
                const currentProducts = state.products.data 
                  ? { ...state.products.data } 
                  : createEmptyNormalizedData<Product>();
                
                // Remove optimistic product
                const { [newProduct.id]: optimisticProduct, ...remainingProducts } = currentProducts.byId;
                
                const updatedProducts = {
                  byId: remainingProducts,
                  allIds: currentProducts.allIds.filter(id => id !== newProduct.id),
                };
                
                // Remove from pending changes
                const { [newProduct.id]: _, ...remainingChanges } = state.pendingChanges;
                
                return {
                  ...state,
                  products: setSuccessState(updatedProducts),
                  pendingChanges: remainingChanges,
                };
              });
              
              throw error;
            }
          },
          
          // Update product
          updateProduct: async (id: string, updates: Partial<Product>) => {
            const { products } = get();
            
            if (products.status !== AsyncStatus.SUCCESS || !products.data) {
              throw new Error('Products not loaded');
            }
            
            const product = products.data.byId[id];
            
            if (!product) {
              throw new Error(`Product with ID ${id} not found`);
            }
            
            // Create updated product for optimistic update
            const updatedProduct: Product = {
              ...product,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            
            // Apply optimistic update
            set(state => {
              const currentProducts = { ...state.products.data! };
              
              return {
                ...state,
                products: setSuccessState({
                  ...currentProducts,
                  byId: {
                    ...currentProducts.byId,
                    [id]: updatedProduct,
                  },
                }),
                pendingChanges: {
                  ...state.pendingChanges,
                  [id]: true,
                },
              };
            });
            
            try {
              // This would be an actual API call in a real application
              // Simulating API call for example purposes
              const mockApiCall = () => new Promise<Product>((resolve) => {
                setTimeout(() => {
                  resolve(updatedProduct);
                }, 500);
              });
              
              const result = await mockApiCall();
              
              // Update with real result from server
              set(state => {
                const currentProducts = { ...state.products.data! };
                
                // Remove from pending changes
                const { [id]: _, ...remainingChanges } = state.pendingChanges;
                
                return {
                  ...state,
                  products: setSuccessState({
                    ...currentProducts,
                    byId: {
                      ...currentProducts.byId,
                      [id]: result,
                    },
                  }),
                  pendingChanges: remainingChanges,
                };
              });
              
              return result;
            } catch (error) {
              // Revert optimistic update on error
              set(state => {
                const currentProducts = { ...state.products.data! };
                
                // Remove from pending changes
                const { [id]: _, ...remainingChanges } = state.pendingChanges;
                
                return {
                  ...state,
                  products: setSuccessState({
                    ...currentProducts,
                    byId: {
                      ...currentProducts.byId,
                      [id]: product, // Revert to original product
                    },
                  }),
                  pendingChanges: remainingChanges,
                };
              });
              
              throw error;
            }
          },
          
          // Delete product
          deleteProduct: async (id: string) => {
            const { products } = get();
            
            if (products.status !== AsyncStatus.SUCCESS || !products.data) {
              throw new Error('Products not loaded');
            }
            
            const product = products.data.byId[id];
            
            if (!product) {
              throw new Error(`Product with ID ${id} not found`);
            }
            
            // Apply optimistic update (remove product)
            set(state => {
              const currentProducts = { ...state.products.data! };
              const { [id]: removedProduct, ...remainingProducts } = currentProducts.byId;
              
              return {
                ...state,
                products: setSuccessState({
                  byId: remainingProducts,
                  allIds: currentProducts.allIds.filter(pid => pid !== id),
                }),
                pendingChanges: {
                  ...state.pendingChanges,
                  [id]: true,
                },
              };
            });
            
            try {
              // This would be an actual API call in a real application
              // Simulating API call for example purposes
              const mockApiCall = () => new Promise<void>((resolve) => {
                setTimeout(() => {
                  resolve();
                }, 500);
              });
              
              await mockApiCall();
              
              // Confirm deletion (already applied optimistically)
              set(state => {
                // Remove from pending changes
                const { [id]: _, ...remainingChanges } = state.pendingChanges;
                
                return {
                  ...state,
                  pendingChanges: remainingChanges,
                };
              });
            } catch (error) {
              // Revert optimistic update on error
              set(state => {
                const currentProducts = { ...state.products.data! };
                
                // Add back the product
                return {
                  ...state,
                  products: setSuccessState({
                    byId: {
                      ...currentProducts.byId,
                      [id]: product,
                    },
                    allIds: [...currentProducts.allIds, id].sort(),
                  }),
                  pendingChanges: {
                    ...state.pendingChanges,
                    [id]: false,
                  },
                };
              });
              
              throw error;
            }
          },
          
          // Set filters
          setFilters: (filters: ProductFilters) => {
            set(state => ({
              ...state,
              filters: {
                ...state.filters,
                ...filters,
              },
            }));
            
            // Re-fetch with new filters
            get().fetchProducts(filters);
          },
          
          // Clear filters
          clearFilters: () => {
            set({
              filters: {},
            });
            
            // Re-fetch without filters
            get().fetchProducts({});
          },
          
          // Reset state
          resetState: () => {
            set(resetProductState());
          },
        }),
        resetProductState
      ),
      'products'
    )
  )
);

// Product selectors
export const selectProducts = (state: ProductState) => state.products;
export const selectCategories = (state: ProductState) => state.categories;
export const selectCurrentProduct = (state: ProductState) => state.currentProduct;
export const selectFilters = (state: ProductState) => state.filters;
export const selectPendingChanges = (state: ProductState) => state.pendingChanges; 