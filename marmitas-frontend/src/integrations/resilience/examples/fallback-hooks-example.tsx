import React, { useEffect, useState } from 'react';
import { 
  useFallback, 
  useDefaultFallback, 
  DefaultFallbacks,
  useCachedFallback,
  CachedFallbacks,
  useResilientOperation 
} from '../hooks';
import { createDefaultResponseFallback, DefaultResponseFallbacks } from '../fallback';
import { RetryStrategy } from '../retry';

// Mock API client for demonstration
const api = {
  getProducts: async (): Promise<any[]> => {
    // Simulate API failures 50% of the time
    if (Math.random() < 0.5) {
      throw new Error('Network failure while fetching products');
    }
    return [{ id: 1, name: 'Product 1' }, { id: 2, name: 'Product 2' }];
  },
  
  getUserProfile: async (): Promise<any> => {
    // Simulate API failures 50% of the time
    if (Math.random() < 0.5) {
      throw new Error('Network failure while fetching user profile');
    }
    return { id: 123, name: 'John Doe', email: 'john@example.com' };
  }
};

/**
 * Example component demonstrating different fallback hooks
 */
export function FallbackHooksExample() {
  // Basic Fallback Example
  const basicFallback = useFallback({
    fallbackHandler: (error) => {
      console.log('Basic fallback activated:', error.message);
      return [{ id: 0, name: 'Fallback Product' }];
    }
  });
  
  // Default Response Fallback Example
  const defaultFallback = useDefaultFallback({
    defaultValue: [{ id: 0, name: 'Default Fallback Product' }],
    onFallback: (error) => console.log('Default fallback activated:', error.message)
  });
  
  // Convenience Method Example
  const emptyArrayFallback = DefaultFallbacks.emptyArray<any>();
  
  // Cached Fallback Example
  const cachedFallback = useCachedFallback({
    cacheKey: 'products',
    cacheTtlMs: 60000, // 1 minute
    secondaryFallback: DefaultResponseFallbacks.emptyArray(),
    onFallback: (error) => console.log('Cached fallback activated:', error.message)
  });
  
  // Combined Resilience Example
  const resilientOp = useResilientOperation({
    circuitBreaker: {
      name: 'products-service',
      failureThreshold: 3,
      resetTimeoutMs: 10000 // 10 seconds
    },
    retry: {
      maxRetries: 2,
      retryStrategy: new RetryStrategy.ExponentialBackoff()
    },
    fallback: {
      fallbackHandler: DefaultResponseFallbacks.emptyArray()
    }
  });
  
  // State for storing results
  const [basicResult, setBasicResult] = useState<any[]>([]);
  const [defaultResult, setDefaultResult] = useState<any[]>([]);
  const [emptyResult, setEmptyResult] = useState<any[]>([]);
  const [cachedResult, setCachedResult] = useState<any[]>([]);
  const [resilientResult, setResilientResult] = useState<any[]>([]);
  
  // Load data on mount - for demonstration only
  useEffect(() => {
    const loadData = async () => {
      // Using basic fallback
      const basicProducts = await basicFallback.execute(() => api.getProducts());
      setBasicResult(basicProducts);
      
      // Using default value fallback
      const defaultProducts = await defaultFallback.execute(() => api.getProducts());
      setDefaultResult(defaultProducts);
      
      // Using empty array fallback
      const emptyProducts = await emptyArrayFallback.execute(() => api.getProducts());
      setEmptyResult(emptyProducts);
      
      // Using cached fallback
      const cachedProducts = await cachedFallback.execute(() => api.getProducts());
      setCachedResult(cachedProducts);
      
      // Using combined resilience
      const resilientProducts = await resilientOp.execute(() => api.getProducts());
      setResilientResult(resilientProducts);
    };
    
    loadData();
  }, []);
  
  return (
    <div>
      <h1>Fallback Hooks Examples</h1>
      
      <section>
        <h2>Basic Fallback</h2>
        <button onClick={async () => {
          const result = await basicFallback.execute(() => api.getProducts());
          setBasicResult(result);
        }}>
          Retry with Basic Fallback
        </button>
        <div>Used Fallback: {basicFallback.usedFallback ? 'Yes' : 'No'}</div>
        <div>Products: {JSON.stringify(basicResult)}</div>
      </section>
      
      <section>
        <h2>Default Response Fallback</h2>
        <button onClick={async () => {
          const result = await defaultFallback.execute(() => api.getProducts());
          setDefaultResult(result);
        }}>
          Retry with Default Fallback
        </button>
        <div>Used Fallback: {defaultFallback.usedFallback ? 'Yes' : 'No'}</div>
        <div>Products: {JSON.stringify(defaultResult)}</div>
      </section>
      
      <section>
        <h2>Empty Array Fallback</h2>
        <button onClick={async () => {
          const result = await emptyArrayFallback.execute(() => api.getProducts());
          setEmptyResult(result);
        }}>
          Retry with Empty Array Fallback
        </button>
        <div>Used Fallback: {emptyArrayFallback.usedFallback ? 'Yes' : 'No'}</div>
        <div>Products: {JSON.stringify(emptyResult)}</div>
      </section>
      
      <section>
        <h2>Cached Fallback</h2>
        <button onClick={async () => {
          const result = await cachedFallback.execute(() => api.getProducts());
          setCachedResult(result);
        }}>
          Retry with Cached Fallback
        </button>
        <div>Used Fallback: {cachedFallback.usedFallback ? 'Yes' : 'No'}</div>
        <div>Has Cached Value: {cachedFallback.hasCachedValue() ? 'Yes' : 'No'}</div>
        <div>Products: {JSON.stringify(cachedResult)}</div>
        <button onClick={() => cachedFallback.clearCache()}>
          Clear Cache
        </button>
      </section>
      
      <section>
        <h2>Combined Resilience</h2>
        <button onClick={async () => {
          const result = await resilientOp.execute(() => api.getProducts());
          setResilientResult(result);
        }}>
          Retry with Combined Resilience
        </button>
        <div>Circuit State: {resilientOp.circuitState}</div>
        <div>Circuit Open: {resilientOp.isCircuitOpen ? 'Yes' : 'No'}</div>
        <div>Used Fallback: {resilientOp.usedFallback ? 'Yes' : 'No'}</div>
        <div>Products: {JSON.stringify(resilientResult)}</div>
        <button onClick={() => resilientOp.resetCircuit()}>
          Reset Circuit
        </button>
      </section>
    </div>
  );
} 