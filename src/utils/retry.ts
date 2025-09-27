import { CpanelError, CpanelTimeoutError, CpanelConnectionError } from '../errors.js';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: string[];
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  retryableErrors: [
    'TIMEOUT',
    'CONNECTION_FAILED',
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED'
  ]
};

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: Error, retryableErrors: string[]): boolean {
  if (error instanceof CpanelTimeoutError || error instanceof CpanelConnectionError) {
    return true;
  }

  if (error instanceof CpanelError && error.code) {
    return retryableErrors.includes(error.code);
  }

  // Check for common network errors
  const errorMessage = error.message.toLowerCase();
  return retryableErrors.some(retryableError =>
    errorMessage.includes(retryableError.toLowerCase())
  );
}

/**
 * Calculates delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number, backoffFactor: number): number {
  const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
  // Add jitter (±25% of the delay)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(0, delay + jitter);
}

/**
 * Sleeps for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === config.maxAttempts) {
        break;
      }

      // Check if the error is retryable
      if (!isRetryableError(lastError, config.retryableErrors)) {
        throw lastError;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay, config.backoffFactor);

      console.error(`Operation failed (attempt ${attempt}/${config.maxAttempts}): ${lastError.message}. Retrying in ${Math.round(delay)}ms...`);

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Creates a retry wrapper for a function
 */
export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options?: RetryOptions
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    return retryOperation(() => fn(...args), options);
  };
}
