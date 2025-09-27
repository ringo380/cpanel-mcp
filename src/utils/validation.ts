import { CpanelValidationError } from '../errors.js';

/**
 * Validation schema for input parameters
 */
export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    validator?: (value: any) => boolean;
    message?: string;
  };
}

/**
 * Validates input parameters against a schema
 */
export function validateInput(input: any, schema: ValidationSchema): void {
  if (!input || typeof input !== 'object') {
    throw new CpanelValidationError('Input must be an object');
  }

  for (const [key, rules] of Object.entries(schema)) {
    const value = input[key];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      throw new CpanelValidationError(
        rules.message || `Field '${key}' is required`,
        key
      );
    }

    // Skip validation for optional undefined values
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    if (!validateType(value, rules.type)) {
      throw new CpanelValidationError(
        rules.message || `Field '${key}' must be of type ${rules.type}`,
        key
      );
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        throw new CpanelValidationError(
          rules.message || `Field '${key}' must be at least ${rules.minLength} characters long`,
          key
        );
      }

      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        throw new CpanelValidationError(
          rules.message || `Field '${key}' must be no more than ${rules.maxLength} characters long`,
          key
        );
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        throw new CpanelValidationError(
          rules.message || `Field '${key}' format is invalid`,
          key
        );
      }
    }

    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        throw new CpanelValidationError(
          rules.message || `Field '${key}' must be at least ${rules.min}`,
          key
        );
      }

      if (rules.max !== undefined && value > rules.max) {
        throw new CpanelValidationError(
          rules.message || `Field '${key}' must be no more than ${rules.max}`,
          key
        );
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      throw new CpanelValidationError(
        rules.message || `Field '${key}' must be one of: ${rules.enum.join(', ')}`,
        key
      );
    }

    // Custom validator
    if (rules.validator && !rules.validator(value)) {
      throw new CpanelValidationError(
        rules.message || `Field '${key}' failed custom validation`,
        key
      );
    }
  }
}

/**
 * Validates value type
 */
function validateType(value: any, expectedType: string): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return false;
  }
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  DOMAIN: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  CRON_FIELD: /^(\*|([0-9]|[1-5][0-9])(-([0-9]|[1-5][0-9]))?(,([0-9]|[1-5][0-9])(-([0-9]|[1-5][0-9]))?)*)$/,
  DATABASE_NAME: /^[a-zA-Z0-9_]+$/,
  USERNAME: /^[a-zA-Z0-9_.-]+$/
};

/**
 * Validation schemas for different operations
 */
export const ValidationSchemas = {
  createDatabase: {
    name: {
      type: 'string' as const,
      required: true,
      minLength: 1,
      maxLength: 64,
      pattern: ValidationPatterns.DATABASE_NAME,
      message: 'Database name must contain only letters, numbers, and underscores'
    }
  },

  createEmailAccount: {
    email: {
      type: 'string' as const,
      required: true,
      pattern: ValidationPatterns.EMAIL,
      message: 'Invalid email address format'
    },
    password: {
      type: 'string' as const,
      required: true,
      minLength: 8,
      message: 'Password must be at least 8 characters long'
    },
    quota: {
      type: 'number' as const,
      min: 0,
      max: 10240,
      message: 'Quota must be between 0 and 10240 MB'
    }
  },

  addCronJob: {
    minute: {
      type: 'string' as const,
      required: true,
      validator: (value: string) => validateCronField(value, 0, 59),
      message: 'Invalid minute field (0-59 or *)'
    },
    hour: {
      type: 'string' as const,
      required: true,
      validator: (value: string) => validateCronField(value, 0, 23),
      message: 'Invalid hour field (0-23 or *)'
    },
    day: {
      type: 'string' as const,
      required: true,
      validator: (value: string) => validateCronField(value, 1, 31),
      message: 'Invalid day field (1-31 or *)'
    },
    month: {
      type: 'string' as const,
      required: true,
      validator: (value: string) => validateCronField(value, 1, 12),
      message: 'Invalid month field (1-12 or *)'
    },
    weekday: {
      type: 'string' as const,
      required: true,
      validator: (value: string) => validateCronField(value, 0, 6),
      message: 'Invalid weekday field (0-6 or *)'
    },
    command: {
      type: 'string' as const,
      required: true,
      minLength: 1,
      message: 'Command cannot be empty'
    }
  },

  createSubdomain: {
    subdomain: {
      type: 'string' as const,
      required: true,
      pattern: /^[a-zA-Z0-9-]+$/,
      message: 'Subdomain must contain only letters, numbers, and hyphens'
    },
    rootdomain: {
      type: 'string' as const,
      required: true,
      pattern: ValidationPatterns.DOMAIN,
      message: 'Invalid domain format'
    },
    dir: {
      type: 'string' as const,
      required: false,
      message: 'Directory path must be valid'
    }
  },

  uploadSSLCertificate: {
    certificate: {
      type: 'string' as const,
      required: true,
      minLength: 100,
      message: 'Certificate content is required'
    },
    private_key: {
      type: 'string' as const,
      required: true,
      minLength: 100,
      message: 'Private key is required'
    },
    ca_bundle: {
      type: 'string' as const,
      required: false,
      message: 'CA bundle must be valid if provided'
    }
  }
};

/**
 * Validates a cron field value
 */
function validateCronField(value: string, min: number, max: number): boolean {
  if (value === '*') return true;

  // Handle ranges (e.g., "1-5")
  if (value.includes('-')) {
    const [start, end] = value.split('-').map(Number);
    return start >= min && end <= max && start <= end;
  }

  // Handle lists (e.g., "1,3,5")
  if (value.includes(',')) {
    const values = value.split(',').map(Number);
    return values.every(v => v >= min && v <= max);
  }

  // Handle single values
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}
