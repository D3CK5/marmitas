# Resilience Examples

This directory contains example components that demonstrate how to use the resilience patterns implemented in this module.

## Fallback Hooks Example

The `fallback-hooks-example.tsx` file demonstrates how to use the various fallback hooks:

- **Basic Fallback**: Using the `useFallback` hook with a custom fallback handler.
- **Default Response Fallback**: Using the `useDefaultFallback` hook to return predefined values.
- **Empty Array Fallback**: Using the convenience factory methods to quickly create common fallbacks.
- **Cached Fallback**: Using the `useCachedFallback` hook to cache successful responses and use them as fallbacks.
- **Combined Resilience**: Using the `useResilientOperation` hook to combine circuit breaker, retry, and fallback policies.

## Usage

To use these examples in your application, you can import them and include them in your component tree:

```tsx
import { FallbackHooksExample } from '../integrations/resilience/examples/fallback-hooks-example';

function MyComponent() {
  return (
    <div>
      <h1>Resilience Patterns Demo</h1>
      <FallbackHooksExample />
    </div>
  );
}
```

## Notes

These examples include simulated API failures to demonstrate fallback behavior. In a real application, you would replace the mock API calls with actual API service calls.

The components also demonstrate various UI patterns for informing users about fallback states and providing manual recovery options. 