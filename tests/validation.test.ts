import { describe, it, expect } from '@jest/globals';
import { validateInput, ValidationPatterns, ValidationSchemas } from '../src/utils/validation.js';
import { CpanelValidationError } from '../src/errors.js';

describe('Validation Utility', () => {
  describe('validateInput', () => {
    it('should pass valid input', () => {
      const input = { name: 'test', age: 25 };
      const schema = {
        name: { type: 'string' as const, required: true },
        age: { type: 'number' as const, required: true }
      };

      expect(() => validateInput(input, schema)).not.toThrow();
    });

    it('should throw error for missing required field', () => {
      const input = { age: 25 };
      const schema = {
        name: { type: 'string' as const, required: true },
        age: { type: 'number' as const, required: true }
      };

      expect(() => validateInput(input, schema))
        .toThrow(CpanelValidationError);
    });

    it('should throw error for wrong type', () => {
      const input = { name: 123, age: 25 };
      const schema = {
        name: { type: 'string' as const, required: true },
        age: { type: 'number' as const, required: true }
      };

      expect(() => validateInput(input, schema))
        .toThrow(CpanelValidationError);
    });

    it('should validate string length', () => {
      const input = { name: 'ab' };
      const schema = {
        name: { type: 'string' as const, minLength: 3, maxLength: 10 }
      };

      expect(() => validateInput(input, schema))
        .toThrow(CpanelValidationError);
    });

    it('should validate number range', () => {
      const input = { age: 150 };
      const schema = {
        age: { type: 'number' as const, min: 0, max: 100 }
      };

      expect(() => validateInput(input, schema))
        .toThrow(CpanelValidationError);
    });

    it('should validate pattern', () => {
      const input = { email: 'invalid-email' };
      const schema = {
        email: {
          type: 'string' as const,
          pattern: ValidationPatterns.EMAIL
        }
      };

      expect(() => validateInput(input, schema))
        .toThrow(CpanelValidationError);
    });

    it('should validate enum values', () => {
      const input = { status: 'invalid' };
      const schema = {
        status: {
          type: 'string' as const,
          enum: ['active', 'inactive', 'pending']
        }
      };

      expect(() => validateInput(input, schema))
        .toThrow(CpanelValidationError);
    });

    it('should skip optional fields', () => {
      const input = { name: 'test' };
      const schema = {
        name: { type: 'string' as const, required: true },
        age: { type: 'number' as const, required: false }
      };

      expect(() => validateInput(input, schema)).not.toThrow();
    });

    it('should use custom validator', () => {
      const input = { value: 5 };
      const schema = {
        value: {
          type: 'number' as const,
          validator: (val: number) => val % 2 === 0 // Only even numbers
        }
      };

      expect(() => validateInput(input, schema))
        .toThrow(CpanelValidationError);
    });
  });

  describe('ValidationPatterns', () => {
    describe('EMAIL', () => {
      it('should validate valid emails', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org'
        ];

        validEmails.forEach(email => {
          expect(ValidationPatterns.EMAIL.test(email)).toBe(true);
        });
      });

      it('should reject invalid emails', () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'test@',
          'test.example.com'
        ];

        invalidEmails.forEach(email => {
          expect(ValidationPatterns.EMAIL.test(email)).toBe(false);
        });
      });
    });

    describe('DOMAIN', () => {
      it('should validate valid domains', () => {
        const validDomains = [
          'example.com',
          'sub.example.com',
          'test-domain.co.uk',
          'a.b.c.example.org'
        ];

        validDomains.forEach(domain => {
          expect(ValidationPatterns.DOMAIN.test(domain)).toBe(true);
        });
      });

      it('should reject invalid domains', () => {
        const invalidDomains = [
          '-example.com',
          'example-.com',
          '.example.com',
          'example.com.',
          'ex ample.com'
        ];

        invalidDomains.forEach(domain => {
          expect(ValidationPatterns.DOMAIN.test(domain)).toBe(false);
        });
      });
    });

    describe('DATABASE_NAME', () => {
      it('should validate valid database names', () => {
        const validNames = [
          'mydb',
          'my_database',
          'db123',
          'user_data_2023'
        ];

        validNames.forEach(name => {
          expect(ValidationPatterns.DATABASE_NAME.test(name)).toBe(true);
        });
      });

      it('should reject invalid database names', () => {
        const invalidNames = [
          'my-db',
          'my db',
          'my.db',
          'my@db',
          ''
        ];

        invalidNames.forEach(name => {
          expect(ValidationPatterns.DATABASE_NAME.test(name)).toBe(false);
        });
      });
    });
  });

  describe('ValidationSchemas', () => {
    describe('createDatabase', () => {
      it('should validate valid database creation', () => {
        const input = { name: 'valid_db_name' };

        expect(() => validateInput(input, ValidationSchemas.createDatabase))
          .not.toThrow();
      });

      it('should reject invalid database name', () => {
        const input = { name: 'invalid-name' };

        expect(() => validateInput(input, ValidationSchemas.createDatabase))
          .toThrow(CpanelValidationError);
      });
    });

    describe('createEmailAccount', () => {
      it('should validate valid email account creation', () => {
        const input = {
          email: 'test@example.com',
          password: 'securepassword123',
          quota: 500
        };

        expect(() => validateInput(input, ValidationSchemas.createEmailAccount))
          .not.toThrow();
      });

      it('should reject short password', () => {
        const input = {
          email: 'test@example.com',
          password: 'short'
        };

        expect(() => validateInput(input, ValidationSchemas.createEmailAccount))
          .toThrow(CpanelValidationError);
      });

      it('should reject invalid email', () => {
        const input = {
          email: 'invalid-email',
          password: 'securepassword123'
        };

        expect(() => validateInput(input, ValidationSchemas.createEmailAccount))
          .toThrow(CpanelValidationError);
      });
    });

    describe('addCronJob', () => {
      it('should validate valid cron job', () => {
        const input = {
          minute: '30',
          hour: '2',
          day: '*',
          month: '*',
          weekday: '0',
          command: '/path/to/script.sh'
        };

        expect(() => validateInput(input, ValidationSchemas.addCronJob))
          .not.toThrow();
      });

      it('should validate wildcard values', () => {
        const input = {
          minute: '*',
          hour: '*',
          day: '*',
          month: '*',
          weekday: '*',
          command: 'echo "test"'
        };

        expect(() => validateInput(input, ValidationSchemas.addCronJob))
          .not.toThrow();
      });
    });
  });
});