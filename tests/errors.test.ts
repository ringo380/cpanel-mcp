import { describe, it, expect } from '@jest/globals';
import {
  CpanelError,
  CpanelAuthenticationError,
  CpanelConnectionError,
  CpanelAPIError,
  CpanelValidationError,
  CpanelTimeoutError,
  CpanelQuotaError,
  CpanelResourceNotFoundError,
  CpanelPermissionError,
  createCpanelError,
  formatErrorForMCP
} from '../src/errors.js';

describe('CpanelError Classes', () => {
  describe('CpanelError', () => {
    it('should create error with message and code', () => {
      const error = new CpanelError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('CpanelError');
    });

    it('should create error with context', () => {
      const context = { key: 'value' };
      const error = new CpanelError('Test error', 'TEST_CODE', context);
      expect(error.context).toBe(context);
    });
  });

  describe('CpanelAuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new CpanelAuthenticationError('Auth failed');
      expect(error.message).toBe('Auth failed');
      expect(error.code).toBe('AUTH_FAILED');
      expect(error.name).toBe('CpanelAuthenticationError');
    });

    it('should use default message', () => {
      const error = new CpanelAuthenticationError();
      expect(error.message).toBe('Authentication failed');
    });
  });

  describe('CpanelConnectionError', () => {
    it('should create connection error', () => {
      const error = new CpanelConnectionError('Connection failed');
      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('CONNECTION_FAILED');
      expect(error.name).toBe('CpanelConnectionError');
    });
  });

  describe('CpanelValidationError', () => {
    it('should create validation error with field', () => {
      const error = new CpanelValidationError('Invalid field', 'email');
      expect(error.message).toBe('Invalid field');
      expect(error.field).toBe('email');
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('CpanelQuotaError', () => {
    it('should create quota error with type', () => {
      const error = new CpanelQuotaError('Quota exceeded', 'disk');
      expect(error.message).toBe('Quota exceeded');
      expect(error.quotaType).toBe('disk');
      expect(error.code).toBe('QUOTA_EXCEEDED');
    });
  });
});

describe('createCpanelError', () => {
  it('should create authentication error for auth messages', () => {
    const error = createCpanelError('Authentication failed');
    expect(error).toBeInstanceOf(CpanelAuthenticationError);
  });

  it('should create connection error for connection messages', () => {
    const error = createCpanelError('Connection timeout');
    expect(error).toBeInstanceOf(CpanelConnectionError);
  });

  it('should create validation error for validation messages', () => {
    const error = createCpanelError('Invalid parameter');
    expect(error).toBeInstanceOf(CpanelValidationError);
  });

  it('should create quota error for quota messages', () => {
    const error = createCpanelError('Disk quota exceeded');
    expect(error).toBeInstanceOf(CpanelQuotaError);
  });

  it('should create resource not found error', () => {
    const error = createCpanelError('Database not found');
    expect(error).toBeInstanceOf(CpanelResourceNotFoundError);
  });

  it('should create permission error', () => {
    const error = createCpanelError('Permission denied');
    expect(error).toBeInstanceOf(CpanelPermissionError);
  });

  it('should create generic API error for unknown messages', () => {
    const error = createCpanelError('Unknown error');
    expect(error).toBeInstanceOf(CpanelAPIError);
  });
});

describe('formatErrorForMCP', () => {
  it('should format CpanelError as JSON', () => {
    const error = new CpanelError('Test error', 'TEST_CODE', { detail: 'extra info' });
    const formatted = formatErrorForMCP(error);
    const parsed = JSON.parse(formatted);

    expect(parsed.type).toBe('CpanelError');
    expect(parsed.code).toBe('TEST_CODE');
    expect(parsed.message).toBe('Test error');
    expect(parsed.context).toEqual({ detail: 'extra info' });
  });

  it('should format regular Error as simple string', () => {
    const error = new Error('Regular error');
    const formatted = formatErrorForMCP(error);
    expect(formatted).toBe('Error: Regular error');
  });
});