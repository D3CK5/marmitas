import {
  createDefaultResponseFallback,
  DefaultResponseFallbacks,
  DefaultResponseFallbackOptions
} from './default-response-fallback';

import {
  createCachedResponseFallback,
  CachedResponseFallbackOptions,
  CacheStorage,
  getGlobalCache,
  withCaching
} from './cached-response-fallback';

export {
  // Default response fallback
  createDefaultResponseFallback,
  DefaultResponseFallbacks,
  DefaultResponseFallbackOptions,
  
  // Cached response fallback
  createCachedResponseFallback,
  CachedResponseFallbackOptions,
  CacheStorage,
  getGlobalCache,
  withCaching,
}; 