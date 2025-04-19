import { useCircuitBreaker, UseCircuitBreakerOptions, UseCircuitBreakerResult } from './use-circuit-breaker';
import { useFallback, UseFallbackOptions, UseFallbackResult } from './use-fallback';
import { useDefaultFallback, UseDefaultFallbackOptions, DefaultFallbacks } from './use-default-fallback';
import { useCachedFallback, UseCachedFallbackOptions, UseCachedFallbackResult, CachedFallbacks } from './use-cached-fallback';
import { useResilientOperation, UseResilientOperationOptions, UseResilientOperationResult } from './use-resilient-operation';

export {
  // Circuit Breaker Hook
  useCircuitBreaker,
  UseCircuitBreakerOptions,
  UseCircuitBreakerResult,
  
  // General Fallback Hook
  useFallback,
  UseFallbackOptions,
  UseFallbackResult,
  
  // Default Response Fallback Hook
  useDefaultFallback,
  UseDefaultFallbackOptions,
  DefaultFallbacks,
  
  // Cached Response Fallback Hook
  useCachedFallback,
  UseCachedFallbackOptions,
  UseCachedFallbackResult,
  CachedFallbacks,
  
  // Combined Resilience Hook
  useResilientOperation,
  UseResilientOperationOptions,
  UseResilientOperationResult,
}; 