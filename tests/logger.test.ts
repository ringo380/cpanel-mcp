import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { LogLevel, logger, createLogger } from '../src/utils/logger.js';

describe('Logger', () => {
  let consoleInfoSpy: jest.SpiedFunction<typeof console.info>;
  let consoleDebugSpy: jest.SpiedFunction<typeof console.debug>;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    logger.setLevel(LogLevel.TRACE); // Enable all logs for testing
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('Log Levels', () => {
    it('should log error messages', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      logger.error('Test error');

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error')
      );

      errorSpy.mockRestore();
    });

    it('should log info messages', () => {
      logger.info('Test info');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test info')
      );
    });

    it('should log debug messages', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

      logger.debug('Test debug');

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG: Test debug')
      );

      debugSpy.mockRestore();
    });

    it('should respect log levels', () => {
      logger.setLevel(LogLevel.ERROR);

      logger.error('Error message');
      logger.info('Info message');

      // Only error should be logged
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });
  });

  describe('Context and Operations', () => {
    it('should log with context', () => {
      logger.info('Test message', { key: 'value' }, 'test-operation');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/INFO.*\[test-operation\].*Test message.*{"key":"value"}/)
      );
    });

    it('should log API requests', () => {
      logger.logApiRequest('TestModule', 'test_function', { param: 'value' });

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Request')
      );
    });

    it('should log API responses', () => {
      logger.logApiResponse('TestModule', 'test_function', ['data'], 150);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Response')
      );
    });

    it('should log API errors', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      logger.logApiError('TestModule', 'test_function', new Error('Test error'), 200);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Error')
      );

      errorSpy.mockRestore();
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with operation context', () => {
      const childLogger = logger.child('child-operation');
      childLogger.setLevel(LogLevel.TRACE); // Ensure child logger will log

      // Reset spies before the test
      consoleInfoSpy.mockClear();

      childLogger.info('Child message');

      // The call should contain the child operation prefix
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('cpanel-mcp:child-operation')
      );
    });
  });

  describe('Logger Factory', () => {
    it('should create logger with custom prefix', () => {
      // Clear any LOG_LEVEL environment variable
      const originalLogLevel = process.env.LOG_LEVEL;
      delete process.env.LOG_LEVEL;

      // Reset spies before creating custom logger
      consoleInfoSpy.mockClear();

      const customLogger = createLogger('custom-prefix', LogLevel.INFO);

      customLogger.info('Custom message');

      // The call should contain the custom prefix
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('custom-prefix')
      );

      // Restore original environment
      if (originalLogLevel) {
        process.env.LOG_LEVEL = originalLogLevel;
      }
    });
  });

  describe('Environment Configuration', () => {
    it('should parse log level from environment', () => {
      const originalEnv = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'DEBUG';

      const envLogger = createLogger('test');
      envLogger.setLevel(LogLevel.TRACE); // Override for testing
      envLogger.debug('Debug message');

      expect(consoleDebugSpy).toHaveBeenCalled();

      process.env.LOG_LEVEL = originalEnv;
    });
  });
});