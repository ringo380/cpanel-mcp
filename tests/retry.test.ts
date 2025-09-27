import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { retryOperation, withRetry } from '../src/utils/retry.js';
import { CpanelTimeoutError, CpanelConnectionError } from '../src/errors.js';

describe('Retry Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('retryOperation', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn<() => Promise<string>>().mockResolvedValue('success');

      const result = await retryOperation(operation, { maxAttempts: 3 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn<() => Promise<string>>()
        .mockRejectedValueOnce(new CpanelTimeoutError())
        .mockRejectedValueOnce(new CpanelConnectionError())
        .mockResolvedValue('success');

      const result = await retryOperation(operation, {
        maxAttempts: 3,
        baseDelay: 10 // Faster for testing
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = jest.fn<() => Promise<string>>().mockRejectedValue(new Error('Validation error'));

      await expect(retryOperation(operation, { maxAttempts: 3 }))
        .rejects.toThrow('Validation error');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should fail after max attempts', async () => {
      const operation = jest.fn<() => Promise<string>>().mockRejectedValue(new CpanelTimeoutError('Timeout'));

      await expect(retryOperation(operation, {
        maxAttempts: 2,
        baseDelay: 10
      })).rejects.toThrow('Timeout');

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('ECONNRESET');
      const operation = jest.fn<() => Promise<string>>()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');

      const result = await retryOperation(operation, {
        maxAttempts: 2,
        baseDelay: 10
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      const operation = jest.fn<() => Promise<string>>()
        .mockRejectedValueOnce(new CpanelTimeoutError())
        .mockRejectedValueOnce(new CpanelTimeoutError())
        .mockResolvedValue('success');

      const startTime = Date.now();
      const result = await retryOperation(operation, {
        maxAttempts: 3,
        baseDelay: 50,
        backoffFactor: 2
      });
      const endTime = Date.now();

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      // Should take at least 50ms + 100ms (exponential backoff)
      expect(endTime - startTime).toBeGreaterThan(100);
    });
  });

  describe('withRetry', () => {
    it('should create a retry wrapper function', async () => {
      const originalFn = jest.fn<(...args: any[]) => Promise<string>>().mockResolvedValue('success');
      const retryFn = withRetry(originalFn, { maxAttempts: 2 });

      const result = await retryFn('arg1', 'arg2');

      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should retry wrapped function', async () => {
      const originalFn = jest.fn<(...args: any[]) => Promise<string>>()
        .mockRejectedValueOnce(new CpanelTimeoutError())
        .mockResolvedValue('success');

      const retryFn = withRetry(originalFn, {
        maxAttempts: 2,
        baseDelay: 10
      });

      const result = await retryFn();

      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledTimes(2);
    });
  });
});