# Resilience Patterns Implementation

This module implements resilience patterns for API calls in the Marmitas frontend application. It provides mechanisms to handle transient failures when communicating with the backend, improving the robustness of the application.

## Features

- **Retry Policies**: Automatically retry failed API calls with configurable strategies
- **Backoff Strategies**: Various backoff strategies for spacing out retry attempts (exponential, linear, fixed, jittered)
- **Error Classification**: Smart error classification to determine which errors should be retried
- **Resilient API Client**: A drop-in replacement for the standard API client with built-in resilience

## Usage

### Basic Usage

The simplest way to use the resilience patterns is to use the `resilientApiClient` instead of the standard `apiClient`:

```typescript
import { resilientApiClient } from '../integrations/resilience';

// Use it just like the regular API client
const data = await resilientApiClient.get<User[]>('/users');
```

This will automatically apply the default retry policy (3 retries with exponential backoff) to the API call.

### Customizing Retry Behavior

You can customize the retry behavior for specific API calls:

```typescript
import { resilientApiClient, RetryStrategy } from '../integrations/resilience';

// Configure custom retry behavior
const data = await resilientApiClient.get<Product[]>('/products', {
  maxRetries: 5,  // More retries for this important call
  retryStrategy: new RetryStrategy.JitteredBackoff({
    baseDelayMs: 200,
    maxDelayMs: 5000,
    jitterFactor: 0.3
  }),
  logRetries: true  // Log retry attempts
});
```

### Available Retry Strategies

The following retry strategies are available:

- **ExponentialBackoff**: Increases delay exponentially (default)
- **LinearBackoff**: Increases delay linearly
- **FixedDelay**: Uses a fixed delay between retries
- **JitteredBackoff**: Uses exponential backoff with random jitter to prevent thundering herd problems

### Creating Custom Policies

For advanced use cases, you can create and compose policies directly:

```typescript
import { RetryPolicy, RetryStrategy } from '../integrations/resilience';

// Create a custom retry policy
const retryPolicy = new RetryPolicy({
  maxRetries: 3,
  retryStrategy: new RetryStrategy.ExponentialBackoff({
    initialDelayMs: 100,
    maxDelayMs: 10000,
    factor: 2
  }),
  onRetry: (error, retryCount, delay) => {
    console.warn(`Retrying after error: ${error.message} (attempt ${retryCount})`);
  }
});

// Use the policy directly
try {
  const result = await retryPolicy.execute(async () => {
    return await someAsyncOperation();
  });
} catch (error) {
  // Handle failures after all retries
}
```

## Configuration

The default retry policy configuration is:

- **Maximum Retries**: 3 attempts
- **Retry Strategy**: Exponential backoff (starting at 100ms, doubling each attempt, max 30s)
- **Retryable Errors**: Network errors, server errors (5xx), and rate limiting errors

You can customize these defaults by modifying the `DEFAULT_OPTIONS` in the respective files. 