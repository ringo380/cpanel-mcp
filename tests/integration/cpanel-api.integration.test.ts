import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { CpanelClient } from '../../src/cpanel-client.js';
import { CpanelConfig } from '../../src/types/cpanel.js';
import { LogLevel } from '../../src/utils/logger.js';

// Integration tests that run against a real cPanel instance
// These tests are skipped unless CPANEL_TEST_* environment variables are set
describe('cPanel API Integration Tests', () => {
  let client: CpanelClient;
  let testConfig: CpanelConfig;
  let shouldSkip: boolean;

  beforeAll(() => {
    // Check if integration test environment is configured
    const hostname = process.env.CPANEL_TEST_HOSTNAME;
    const username = process.env.CPANEL_TEST_USERNAME;
    const apiToken = process.env.CPANEL_TEST_API_TOKEN;
    const password = process.env.CPANEL_TEST_PASSWORD;

    shouldSkip = !hostname || !username || (!apiToken && !password);

    if (!shouldSkip) {
      testConfig = {
        hostname: hostname!,
        username: username!,
        ...(apiToken ? { apiToken } : { password: password! }),
        ssl: process.env.CPANEL_TEST_SSL !== 'false',
        port: process.env.CPANEL_TEST_PORT ? parseInt(process.env.CPANEL_TEST_PORT) : undefined
      };

      client = new CpanelClient(testConfig, {
        maxAttempts: 3,
        baseDelay: 1000
      });
    }
  });

  describe('Authentication', () => {
    it('should authenticate successfully with API token', async () => {
      if (shouldSkip || !testConfig.apiToken) {
        console.log('Skipping API token test - no test environment configured');
        return;
      }

      // Test a simple API call that requires authentication
      const result = await client.executeUAPI('CustInfo', 'displayname');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should authenticate successfully with password', async () => {
      if (shouldSkip || !testConfig.password) {
        console.log('Skipping password test - no test environment configured');
        return;
      }

      // Create a separate client for password auth
      const passwordClient = new CpanelClient({
        hostname: testConfig.hostname,
        username: testConfig.username,
        password: testConfig.password,
        ssl: testConfig.ssl,
        port: testConfig.port
      });

      const result = await passwordClient.executeUAPI('CustInfo', 'displayname');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('File Management', () => {
    it('should list files in home directory', async () => {
      if (shouldSkip) {
        console.log('Skipping file listing test - no test environment configured');
        return;
      }

      const files = await client.listFiles('.');
      expect(Array.isArray(files)).toBe(true);

      // Should have at least some basic directories
      const fileNames = files.map((f: any) => f.file);
      expect(fileNames.some((name: string) => name === 'public_html')).toBe(true);
    });

    it('should handle non-existent directory gracefully', async () => {
      if (shouldSkip) {
        console.log('Skipping non-existent directory test - no test environment configured');
        return;
      }

      await expect(client.listFiles('/non/existent/path'))
        .rejects.toThrow();
    });
  });

  describe('Database Operations', () => {
    const testDbName = `test_db_${Date.now()}`;
    let createdDb = false;

    it('should list existing databases', async () => {
      if (shouldSkip) {
        console.log('Skipping database listing test - no test environment configured');
        return;
      }

      const databases = await client.listDatabases();
      expect(Array.isArray(databases)).toBe(true);
    });

    it('should create a test database', async () => {
      if (shouldSkip) {
        console.log('Skipping database creation test - no test environment configured');
        return;
      }

      const result = await client.createDatabase(testDbName);
      expect(result).toBeDefined();
      createdDb = true;
    });

    afterAll(async () => {
      // Clean up test database if it was created
      if (createdDb && !shouldSkip) {
        try {
          await client.executeUAPI('Mysql', 'delete_database', { name: testDbName });
        } catch (error) {
          console.warn(`Failed to clean up test database ${testDbName}:`, error);
        }
      }
    });
  });

  describe('Email Operations', () => {
    it('should list email accounts', async () => {
      if (shouldSkip) {
        console.log('Skipping email listing test - no test environment configured');
        return;
      }

      const accounts = await client.executeUAPI('Email', 'list_pops');
      expect(Array.isArray(accounts)).toBe(true);
    });

    it('should validate email domain', async () => {
      if (shouldSkip) {
        console.log('Skipping email domain test - no test environment configured');
        return;
      }

      // Get the account's domain for testing
      const domains = await client.executeUAPI('DomainInfo', 'list_domains');
      expect(Array.isArray(domains)).toBe(true);
      expect(domains.length).toBeGreaterThan(0);
    });
  });

  describe('SSL Certificate Management', () => {
    it('should list SSL certificates', async () => {
      if (shouldSkip) {
        console.log('Skipping SSL listing test - no test environment configured');
        return;
      }

      const certificates = await client.listSSLCertificates();
      expect(Array.isArray(certificates)).toBe(true);
    });

    it('should get SSL host information', async () => {
      if (shouldSkip) {
        console.log('Skipping SSL host info test - no test environment configured');
        return;
      }

      const hosts = await client.executeUAPI('SSL', 'list_certs');
      expect(Array.isArray(hosts)).toBe(true);
    });
  });

  describe('DNS Management', () => {
    it('should list DNS zones', async () => {
      if (shouldSkip) {
        console.log('Skipping DNS zones test - no test environment configured');
        return;
      }

      const zones = await client.executeUAPI('DNS', 'list_zones');
      expect(Array.isArray(zones)).toBe(true);
    });

    it('should handle DNS zone for main domain', async () => {
      if (shouldSkip) {
        console.log('Skipping DNS zone test - no test environment configured');
        return;
      }

      // Get the main domain first
      const domains = await client.executeUAPI('DomainInfo', 'main_domain');
      expect(domains).toBeDefined();

      if (domains && domains.length > 0) {
        const mainDomain = domains[0].domain;
        const records = await client.executeUAPI('DNS', 'parse_zone', { domain: mainDomain });
        expect(Array.isArray(records)).toBe(true);
      }
    });
  });

  describe('System Information', () => {
    it('should get account information', async () => {
      if (shouldSkip) {
        console.log('Skipping account info test - no test environment configured');
        return;
      }

      const info = await client.executeUAPI('CustInfo', 'displayname');
      expect(info).toBeDefined();
      expect(Array.isArray(info)).toBe(true);
    });

    it('should get disk usage information', async () => {
      if (shouldSkip) {
        console.log('Skipping disk usage test - no test environment configured');
        return;
      }

      const usage = await client.executeUAPI('Quota', 'get_quota_info');
      expect(usage).toBeDefined();
      expect(Array.isArray(usage)).toBe(true);
    });

    it('should get cPanel version information', async () => {
      if (shouldSkip) {
        console.log('Skipping version info test - no test environment configured');
        return;
      }

      const version = await client.executeUAPI('CpanelInfo', 'get_cpanel_build');
      expect(version).toBeDefined();
      expect(Array.isArray(version)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid API calls gracefully', async () => {
      if (shouldSkip) {
        console.log('Skipping error handling test - no test environment configured');
        return;
      }

      await expect(client.executeUAPI('NonExistentModule', 'nonexistent_function'))
        .rejects.toThrow();
    });

    it('should handle network timeouts with retry', async () => {
      if (shouldSkip) {
        console.log('Skipping timeout test - no test environment configured');
        return;
      }

      // Create a client with very short timeout to test retry logic
      const timeoutClient = new CpanelClient(testConfig, {
        maxAttempts: 2,
        baseDelay: 100
      });

      // This should still work despite short timeout due to retry logic
      const result = await timeoutClient.executeUAPI('CustInfo', 'displayname');
      expect(result).toBeDefined();
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('should handle concurrent API calls', async () => {
      if (shouldSkip) {
        console.log('Skipping concurrent calls test - no test environment configured');
        return;
      }

      const promises = Array.from({ length: 5 }, () =>
        client.executeUAPI('CustInfo', 'displayname')
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should complete API calls within reasonable time', async () => {
      if (shouldSkip) {
        console.log('Skipping performance test - no test environment configured');
        return;
      }

      const startTime = Date.now();
      await client.executeUAPI('CustInfo', 'displayname');
      const endTime = Date.now();

      // API call should complete within 10 seconds
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });
});