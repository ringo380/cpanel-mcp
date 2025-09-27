export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  operation?: string;
}

class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(prefix: string = 'cpanel-mcp', level: LogLevel = LogLevel.INFO) {
    this.prefix = prefix;
    this.level = this.parseLogLevel(process.env.LOG_LEVEL) ?? level;
  }

  private parseLogLevel(levelStr?: string): LogLevel | undefined {
    if (!levelStr) return undefined;

    const upperLevel = levelStr.toUpperCase();
    switch (upperLevel) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'TRACE': return LogLevel.TRACE;
      default: return undefined;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(level: LogLevel, message: string, context?: any, operation?: string): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const operationStr = operation ? ` [${operation}]` : '';
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';

    return `${timestamp} [${this.prefix}] ${levelName}${operationStr}: ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: any, operation?: string): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context, operation);

    // Use appropriate console method based on level
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(formattedMessage);
        break;
    }
  }

  error(message: string, context?: any, operation?: string): void {
    this.log(LogLevel.ERROR, message, context, operation);
  }

  warn(message: string, context?: any, operation?: string): void {
    this.log(LogLevel.WARN, message, context, operation);
  }

  info(message: string, context?: any, operation?: string): void {
    this.log(LogLevel.INFO, message, context, operation);
  }

  debug(message: string, context?: any, operation?: string): void {
    this.log(LogLevel.DEBUG, message, context, operation);
  }

  trace(message: string, context?: any, operation?: string): void {
    this.log(LogLevel.TRACE, message, context, operation);
  }

  /**
   * Logs API request details
   */
  logApiRequest(module: string, func: string, params: any): void {
    this.debug('API Request', {
      module,
      function: func,
      params
    }, 'API');
  }

  /**
   * Logs API response details
   */
  logApiResponse(module: string, func: string, response: any, duration?: number): void {
    this.debug('API Response', {
      module,
      function: func,
      duration: duration ? `${duration}ms` : undefined,
      dataLength: response?.length || (Array.isArray(response) ? response.length : 'N/A')
    }, 'API');
  }

  /**
   * Logs API errors
   */
  logApiError(module: string, func: string, error: Error, duration?: number): void {
    this.error('API Error', {
      module,
      function: func,
      error: error.message,
      duration: duration ? `${duration}ms` : undefined
    }, 'API');
  }

  /**
   * Creates a child logger with additional context
   */
  child(operation: string): Logger {
    const childLogger = new Logger(`${this.prefix}:${operation}`, this.level);
    return childLogger;
  }

  /**
   * Sets the log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Gets the current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Export factory function for creating loggers
export function createLogger(prefix: string, level?: LogLevel): Logger {
  return new Logger(prefix, level);
}
