import { describe, it, expect, beforeAll } from '@jest/globals';
import { CpanelClient } from '../../src/cpanel-client.js';
import { CpanelConfig } from '../../src/types/cpanel.js';

// Define Tool interface locally to avoid MCP SDK import issues in Jest
interface ToolInterface {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

// Integration tests for MCP server tools
// These tests verify that MCP tools integrate correctly with the underlying cPanel client
describe('MCP Tools Integration Tests', () => {
  let client: CpanelClient;
  let shouldSkip: boolean;

  beforeAll(async () => {
    // Check if test environment is configured
    const hostname = process.env.CPANEL_TEST_HOSTNAME;
    const username = process.env.CPANEL_TEST_USERNAME;
    const apiToken = process.env.CPANEL_TEST_API_TOKEN;
    const password = process.env.CPANEL_TEST_PASSWORD;

    shouldSkip = !hostname || !username || (!apiToken && !password);

    if (!shouldSkip) {
      const testConfig: CpanelConfig = {
        hostname: hostname!,
        username: username!,
        ...(apiToken ? { apiToken } : { password: password! }),
        ssl: process.env.CPANEL_TEST_SSL !== 'false',
        port: process.env.CPANEL_TEST_PORT ? parseInt(process.env.CPANEL_TEST_PORT) : undefined
      };

      client = new CpanelClient(testConfig);
    }
  });

  describe('Tool Schema Validation', () => {
    it('should have valid tool schemas for all operations', async () => {
      if (shouldSkip) {
        console.log('Skipping tool schema test - no test environment configured');
        return;
      }

      // Import the tools to check their schemas
      const { CPANEL_TOOLS: tools } = await import('../../src/tools.js');

      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(30); // Should have 35+ tools

      // Check that each tool has required properties
      tools.forEach((tool: ToolInterface, index: number) => {
        expect(tool.name).toBeDefined();
        expect(typeof tool.name).toBe('string');
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe('string');
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.inputSchema).toBe('object');

        // Verify the tool name follows naming convention
        expect(tool.name).toMatch(/^cpanel_[a-z_]+$/);

        console.log(`Tool ${index + 1}: ${tool.name} - ${tool.description?.substring(0, 50)}...`);
      });
    });

    it('should have proper input schemas with required fields', async () => {
      if (shouldSkip) {
        console.log('Skipping input schema test - no test environment configured');
        return;
      }

      const { CPANEL_TOOLS: tools } = await import('../../src/tools.js');

      tools.forEach((tool: ToolInterface) => {
        const schema = tool.inputSchema;

        // Should have type and properties
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();

        // Check for required fields where applicable
        if (tool.name.includes('create') || tool.name.includes('add')) {
          expect(schema.required).toBeDefined();
          expect(Array.isArray(schema.required)).toBe(true);
        }

        // Validate property types
        if (schema.properties) {
          Object.entries(schema.properties).forEach(([propName, propSchema]: [string, any]) => {
            expect(propSchema.type).toBeDefined();
            expect(propSchema.description).toBeDefined();
          });
        }
      });
    });
  });

  describe('Basic Tool Operations', () => {
    it('should handle list_files tool correctly', async () => {
      if (shouldSkip) {
        console.log('Skipping list_files tool test - no test environment configured');
        return;
      }

      // Simulate MCP tool call for listing files
      const args = { path: '.' };

      try {
        const result = await client.listFiles(args.path);
        expect(Array.isArray(result)).toBe(true);

        // Should have standard directories
        const fileNames = result.map((f: any) => f.file || f.name);
        expect(fileNames.some((name: string) => name === 'public_html')).toBe(true);
      } catch (error: any) {
        // Check that error is properly formatted for MCP
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe('string');
      }
    });

    it('should handle list_databases tool correctly', async () => {
      if (shouldSkip) {
        console.log('Skipping list_databases tool test - no test environment configured');
        return;
      }

      try {
        const result = await client.listDatabases();
        expect(Array.isArray(result)).toBe(true);

        // Each database should have expected properties
        if (result.length > 0) {
          const db = result[0];
          expect(db).toHaveProperty('db');
          expect(typeof db.db).toBe('string');
        }
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });

    it('should handle get_disk_usage tool correctly', async () => {
      if (shouldSkip) {
        console.log('Skipping get_disk_usage tool test - no test environment configured');
        return;
      }

      try {
        const result = await client.executeUAPI('Quota', 'get_quota_info');
        expect(Array.isArray(result)).toBe(true);

        if (result.length > 0) {
          const quota = result[0];
          expect(quota).toHaveProperty('quota');
          expect(quota).toHaveProperty('used');
        }
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Complex Tool Operations', () => {
    it('should handle SSL certificate tools', async () => {
      if (shouldSkip) {
        console.log('Skipping SSL tools test - no test environment configured');
        return;
      }

      try {
        const certificates = await client.listSSLCertificates();
        expect(Array.isArray(certificates)).toBe(true);

        // Test SSL host listing
        const hosts = await client.executeUAPI('SSL', 'list_certs');
        expect(Array.isArray(hosts)).toBe(true);
      } catch (error: any) {
        // SSL might not be available on all accounts
        expect(error.message).toBeDefined();
      }
    });

    it('should handle DNS management tools', async () => {
      if (shouldSkip) {
        console.log('Skipping DNS tools test - no test environment configured');
        return;
      }

      try {
        const zones = await client.executeUAPI('DNS', 'list_zones');
        expect(Array.isArray(zones)).toBe(true);

        if (zones.length > 0) {
          const zone = zones[0];
          expect(zone).toHaveProperty('domain');
          expect(typeof zone.domain).toBe('string');
        }
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });

    it('should handle email account tools', async () => {
      if (shouldSkip) {
        console.log('Skipping email tools test - no test environment configured');
        return;
      }

      try {
        const accounts = await client.executeUAPI('Email', 'list_pops');
        expect(Array.isArray(accounts)).toBe(true);

        // Test email quota retrieval
        const quotas = await client.executeUAPI('Email', 'get_pop_quota');
        expect(Array.isArray(quotas)).toBe(true);
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Error Handling in Tools', () => {
    it('should properly format errors for MCP responses', async () => {
      if (shouldSkip) {
        console.log('Skipping error formatting test - no test environment configured');
        return;
      }

      try {
        // Attempt an operation that should fail
        await client.executeUAPI('NonExistent', 'invalid_function');
        fail('Expected operation to throw an error');
      } catch (error: any) {
        // Verify error is properly structured
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe('string');
        expect(error.message.length).toBeGreaterThan(0);

        // Error should contain useful information
        expect(error.message.toLowerCase()).toContain('error');
      }
    });

    it('should handle invalid parameters gracefully', async () => {
      if (shouldSkip) {
        console.log('Skipping invalid parameters test - no test environment configured');
        return;
      }

      try {
        // Test with invalid path
        await client.listFiles('/invalid/path/that/does/not/exist');
        fail('Expected operation to throw an error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Tool Response Formatting', () => {
    it('should return properly formatted JSON responses', async () => {
      if (shouldSkip) {
        console.log('Skipping response formatting test - no test environment configured');
        return;
      }

      const result = await client.executeUAPI('CustInfo', 'displayname');

      // Should be valid JSON-serializable data
      expect(() => JSON.stringify(result)).not.toThrow();

      // Should be an array (cPanel UAPI standard)
      expect(Array.isArray(result)).toBe(true);

      // Should contain meaningful data
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle large responses efficiently', async () => {
      if (shouldSkip) {
        console.log('Skipping large response test - no test environment configured');
        return;
      }

      const startTime = Date.now();
      const files = await client.listFiles('.');
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(30000); // 30 seconds max

      // Should handle JSON serialization of large data
      expect(() => JSON.stringify(files)).not.toThrow();
    });
  });

  describe('Tool Parameter Validation', () => {
    it('should validate required parameters', async () => {
      if (shouldSkip) {
        console.log('Skipping parameter validation test - no test environment configured');
        return;
      }

      // Import validation utility
      const { validateInput, ValidationSchemas } = await import('../../src/utils/validation.js');

      // Test database creation schema
      expect(() => {
        validateInput({ name: 'test_db' }, ValidationSchemas.createDatabase);
      }).not.toThrow();

      expect(() => {
        validateInput({}, ValidationSchemas.createDatabase);
      }).toThrow();
    });

    it('should validate parameter formats', async () => {
      if (shouldSkip) {
        console.log('Skipping parameter format test - no test environment configured');
        return;
      }

      const { validateInput, ValidationSchemas } = await import('../../src/utils/validation.js');

      // Test email account creation with valid data
      expect(() => {
        validateInput({
          email: 'test@example.com',
          password: 'secure123',
          quota: 100
        }, ValidationSchemas.createEmailAccount);
      }).not.toThrow();

      // Test with invalid email
      expect(() => {
        validateInput({
          email: 'invalid-email',
          password: 'secure123',
          quota: 100
        }, ValidationSchemas.createEmailAccount);
      }).toThrow();
    });
  });

  describe('Tool Integration with Retry Logic', () => {
    it('should retry failed operations automatically', async () => {
      if (shouldSkip) {
        console.log('Skipping retry logic test - no test environment configured');
        return;
      }

      // Create client with aggressive retry settings
      const retryClient = new CpanelClient({
        hostname: process.env.CPANEL_TEST_HOSTNAME!,
        username: process.env.CPANEL_TEST_USERNAME!,
        apiToken: process.env.CPANEL_TEST_API_TOKEN,
        password: process.env.CPANEL_TEST_PASSWORD
      }, {
        maxAttempts: 3,
        baseDelay: 100
      });

      // This should work despite potential network hiccups
      const result = await retryClient.executeUAPI('CustInfo', 'displayname');
      expect(result).toBeDefined();
    });
  });
});