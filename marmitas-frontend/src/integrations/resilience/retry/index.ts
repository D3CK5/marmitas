import { RetryStrategy } from './retry-strategy';
import { ExponentialBackoffStrategy } from './exponential-backoff-strategy';
import { LinearBackoffStrategy } from './linear-backoff-strategy';
import { FixedDelayStrategy } from './fixed-delay-strategy';
import { JitteredBackoffStrategy } from './jittered-backoff-strategy';

// Add strategy implementations to the RetryStrategy namespace
// This provides a convenient way to access the strategies: RetryStrategy.ExponentialBackoff
RetryStrategy.ExponentialBackoff = ExponentialBackoffStrategy;
RetryStrategy.LinearBackoff = LinearBackoffStrategy;
RetryStrategy.FixedDelay = FixedDelayStrategy;
RetryStrategy.JitteredBackoff = JitteredBackoffStrategy;

export { RetryStrategy }; 