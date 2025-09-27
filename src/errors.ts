/**
 * Custom error classes for cPanel MCP operations
 */

export class CpanelError extends Error {
  constructor(message: string, public code?: string, public context?: any) {
    super(message);
    this.name = 'CpanelError';
  }
}

export class CpanelAuthenticationError extends CpanelError {
  constructor(message: string = 'Authentication failed', context?: any) {
    super(message, 'AUTH_FAILED', context);
    this.name = 'CpanelAuthenticationError';
  }
}

export class CpanelConnectionError extends CpanelError {
  constructor(message: string = 'Connection failed', context?: any) {
    super(message, 'CONNECTION_FAILED', context);
    this.name = 'CpanelConnectionError';
  }
}

export class CpanelAPIError extends CpanelError {
  constructor(message: string, public apiCode?: string, context?: any) {
    super(message, 'API_ERROR', context);
    this.name = 'CpanelAPIError';
  }
}

export class CpanelValidationError extends CpanelError {
  constructor(message: string, public field?: string, context?: any) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'CpanelValidationError';
  }
}

export class CpanelTimeoutError extends CpanelError {
  constructor(message: string = 'Request timed out', context?: any) {
    super(message, 'TIMEOUT', context);
    this.name = 'CpanelTimeoutError';
  }
}

export class CpanelQuotaError extends CpanelError {
  constructor(message: string, public quotaType?: string, context?: any) {
    super(message, 'QUOTA_EXCEEDED', context);
    this.name = 'CpanelQuotaError';
  }
}

export class CpanelResourceNotFoundError extends CpanelError {
  constructor(message: string, public resourceType?: string, context?: any) {
    super(message, 'RESOURCE_NOT_FOUND', context);
    this.name = 'CpanelResourceNotFoundError';
  }
}

export class CpanelPermissionError extends CpanelError {
  constructor(message: string, public operation?: string, context?: any) {
    super(message, 'PERMISSION_DENIED', context);
    this.name = 'CpanelPermissionError';
  }
}

/**
 * Maps cPanel API error messages to specific error types
 */
export function createCpanelError(message: string, response?: any): CpanelError {
  const lowerMessage = message.toLowerCase();

  // Authentication errors
  if (lowerMessage.includes('authentication') ||
      lowerMessage.includes('invalid credentials') ||
      lowerMessage.includes('unauthorized')) {
    return new CpanelAuthenticationError(message, response);
  }

  // Connection errors
  if (lowerMessage.includes('connection') ||
      lowerMessage.includes('network') ||
      lowerMessage.includes('timeout')) {
    return new CpanelConnectionError(message, response);
  }

  // Validation errors
  if (lowerMessage.includes('invalid') ||
      lowerMessage.includes('malformed') ||
      lowerMessage.includes('required')) {
    return new CpanelValidationError(message, undefined, response);
  }

  // Quota errors
  if (lowerMessage.includes('quota') ||
      lowerMessage.includes('limit exceeded') ||
      lowerMessage.includes('disk space')) {
    return new CpanelQuotaError(message, undefined, response);
  }

  // Resource not found errors
  if (lowerMessage.includes('not found') ||
      lowerMessage.includes('does not exist') ||
      lowerMessage.includes('cannot find')) {
    return new CpanelResourceNotFoundError(message, undefined, response);
  }

  // Permission errors
  if (lowerMessage.includes('permission') ||
      lowerMessage.includes('denied') ||
      lowerMessage.includes('forbidden')) {
    return new CpanelPermissionError(message, undefined, response);
  }

  // Generic API error
  return new CpanelAPIError(message, undefined, response);
}

/**
 * Formats error for MCP response
 */
export function formatErrorForMCP(error: Error): string {
  if (error instanceof CpanelError) {
    const errorInfo = {
      type: error.name,
      code: error.code,
      message: error.message,
      ...(error.context && { context: error.context })
    };

    return JSON.stringify(errorInfo, null, 2);
  }

  return `Error: ${error.message}`;
}
