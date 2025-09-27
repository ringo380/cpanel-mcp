// Test setup file
import { jest } from '@jest/globals';

// Mock environment variables
process.env.CPANEL_HOSTNAME = 'test.example.com';
process.env.CPANEL_USERNAME = 'testuser';
process.env.CPANEL_API_TOKEN = 'test-token-123';
process.env.LOG_LEVEL = 'ERROR'; // Suppress logs during testing

// Global test timeout
jest.setTimeout(10000);

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error;
console.error = jest.fn();

// Restore after all tests
afterAll(() => {
  console.error = originalConsoleError;
});