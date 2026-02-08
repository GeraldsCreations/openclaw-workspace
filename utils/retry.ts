/**
 * retry.ts - Exponential Backoff Retry Utility
 * 
 * Provides a robust retry mechanism with exponential backoff for handling
 * transient failures in network requests, file operations, and other
 * potentially unreliable operations.
 * 
 * @module utils/retry
 */

/**
 * Configuration options for retry behavior
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts (default: 3)
   * Total attempts will be maxRetries + 1 (initial attempt + retries)
   */
  maxRetries?: number;
  
  /**
   * Base delay in milliseconds for exponential backoff (default: 1000)
   * Delay progression: baseDelay, baseDelay*2, baseDelay*4, etc.
   */
  baseDelay?: number;
  
  /**
   * Descriptive name of the operation for logging (default: 'operation')
   */
  operation?: string;
  
  /**
   * Custom error filter - return true to retry, false to fail immediately
   * Useful for skipping retries on auth errors, validation errors, etc.
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  
  /**
   * Callback invoked before each retry with error and attempt number
   */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

/**
 * Error thrown when all retry attempts are exhausted
 */
export class RetryExhaustedError extends Error {
  constructor(
    public operation: string,
    public attempts: number,
    public lastError: Error
  ) {
    super(`Retry exhausted for '${operation}' after ${attempts} attempts. Last error: ${lastError.message}`);
    this.name = 'RetryExhaustedError';
  }
}

/**
 * Sleep utility for introducing delays between retries
 * @param ms Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 * @param attempt Current attempt number (0-indexed)
 * @param baseDelay Base delay in milliseconds
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, baseDelay: number): number {
  // Exponential backoff: baseDelay * 2^attempt
  // attempt 0: baseDelay (1000ms)
  // attempt 1: baseDelay * 2 (2000ms)
  // attempt 2: baseDelay * 4 (4000ms)
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Retry a function with exponential backoff
 * 
 * @template T The return type of the function
 * @param fn The async function to retry
 * @param options Retry configuration options
 * @returns Promise resolving to the function's return value
 * @throws RetryExhaustedError if all retries are exhausted
 * 
 * @example
 * ```typescript
 * // Basic usage with defaults (3 retries, 1s base delay)
 * const data = await retryWithBackoff(async () => {
 *   return await fetch('https://api.example.com/data');
 * });
 * 
 * // Custom configuration
 * const result = await retryWithBackoff(
 *   async () => await someUnreliableOperation(),
 *   {
 *     maxRetries: 5,
 *     baseDelay: 500,
 *     operation: 'fetch-user-data',
 *     shouldRetry: (error) => error.message !== 'Unauthorized',
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
 *     }
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    operation = 'operation',
    shouldRetry = () => true,
    onRetry
  } = options;

  let lastError: Error;
  
  // Initial attempt + retries
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt the operation
      const result = await fn();
      
      // Success! Log if this was a retry
      if (attempt > 0) {
        console.log(`✅ ${operation} succeeded on attempt ${attempt + 1}`);
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry this error
      if (!shouldRetry(lastError, attempt)) {
        console.error(`❌ ${operation} failed with non-retryable error:`, lastError.message);
        throw lastError;
      }
      
      // If this was the last attempt, throw
      if (attempt === maxRetries) {
        console.error(`❌ ${operation} failed after ${attempt + 1} attempts:`, lastError.message);
        throw new RetryExhaustedError(operation, attempt + 1, lastError);
      }
      
      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, baseDelay);
      
      // Log retry
      console.warn(`⚠️  ${operation} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      console.warn(`   Error: ${lastError.message}`);
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt, delay);
      }
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // This should never be reached due to the throw in the loop,
  // but TypeScript needs it for type safety
  throw new RetryExhaustedError(operation, maxRetries + 1, lastError!);
}

/**
 * Convenience wrapper for retrying with custom max retries
 * 
 * @example
 * ```typescript
 * const data = await retry(5, async () => await fetchData());
 * ```
 */
export async function retry<T>(
  maxRetries: number,
  fn: () => Promise<T>,
  operation?: string
): Promise<T> {
  return retryWithBackoff(fn, { maxRetries, operation });
}

/**
 * Default export for common usage
 */
export default retryWithBackoff;
