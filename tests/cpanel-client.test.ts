import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import axios from 'axios';
import { CpanelClient } from '../src/cpanel-client.js';
import { CpanelConfig } from '../src/types/cpanel.js';
import { CpanelAuthenticationError, CpanelTimeoutError } from '../src/errors.js';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CpanelClient', () => {
  let config: CpanelConfig;
  let client: CpanelClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    config = {
      hostname: 'test.example.com',
      username: 'testuser',
      apiToken: 'test-token-123'
    };

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      head: jest.fn(),
      options: jest.fn(),
      request: jest.fn(),
      getUri: jest.fn(),
      create: jest.fn(),
      postForm: jest.fn(),
      putForm: jest.fn(),
      patchForm: jest.fn(),
      defaults: {
        headers: {
          common: {}
        }
      },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    client = new CpanelClient(config);
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://test.example.com:2083',
        timeout: 30000,
        headers: {
          'User-Agent': 'cPanel-MCP/1.0.0'
        }
      });
    });

    it('should set API token authentication', () => {
      expect(mockAxiosInstance.defaults.headers.common['Authorization'])
        .toBe('cpanel testuser:test-token-123');
    });

    it('should use password authentication when no token', () => {
      const passwordConfig = {
        hostname: 'test.example.com',
        username: 'testuser',
        password: 'password123'
      };

      const mockPasswordInstance = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        head: jest.fn(),
        options: jest.fn(),
        request: jest.fn(),
        getUri: jest.fn(),
        create: jest.fn(),
        postForm: jest.fn(),
        putForm: jest.fn(),
        patchForm: jest.fn(),
        defaults: {
          headers: { common: {} },
          auth: {}
        },
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };

      mockedAxios.create.mockReturnValue(mockPasswordInstance as any);
      new CpanelClient(passwordConfig);

      expect(mockPasswordInstance.defaults.auth).toEqual({
        username: 'testuser',
        password: 'password123'
      });
    });

    it('should throw error when no authentication provided', () => {
      const invalidConfig = {
        hostname: 'test.example.com',
        username: 'testuser'
      };

      expect(() => new CpanelClient(invalidConfig))
        .toThrow(CpanelAuthenticationError);
    });

    it('should use HTTP when SSL is disabled', () => {
      const httpConfig = {
        ...config,
        ssl: false,
        port: 2082
      };

      mockedAxios.create.mockClear();
      new CpanelClient(httpConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://test.example.com:2082'
        })
      );
    });
  });

  describe('executeUAPI', () => {
    it('should make successful API call', async () => {
      const mockResponse = {
        data: {
          cpanelresult: {
            event: { result: 1 },
            data: [{ success: true }]
          }
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.executeUAPI('TestModule', 'test_function', {
        param1: 'value1'
      });

      expect(result).toEqual([{ success: true }]);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/execute/TestModule/test_function?cpanel_jsonapi_user=testuser&cpanel_jsonapi_apiversion=3&cpanel_jsonapi_module=TestModule&cpanel_jsonapi_func=test_function&param1=value1'
      );
    });

    it('should handle API error response', async () => {
      const mockResponse = {
        data: {
          cpanelresult: {
            event: { result: 0 },
            data: [{ reason: 'Test error' }]
          }
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await expect(client.executeUAPI('TestModule', 'test_function'))
        .rejects.toThrow('cPanel API error: Test error');
    });

    it('should retry on timeout', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.name = 'TimeoutError';

      mockAxiosInstance.get
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValue({
          data: {
            cpanelresult: {
              event: { result: 1 },
              data: [{ success: true }]
            }
          }
        });

      // Create client with shorter retry delays for testing
      const testClient = new CpanelClient(config, {
        maxAttempts: 2,
        baseDelay: 10
      });

      const result = await testClient.executeUAPI('TestModule', 'test_function');

      expect(result).toEqual([{ success: true }]);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('API Methods', () => {
    beforeEach(() => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          cpanelresult: {
            event: { result: 1 },
            data: [{ success: true }]
          }
        }
      });
    });

    it('should list files', async () => {
      await client.listFiles('/home/user');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('Fileman/list_files')
      );
    });

    it('should list databases', async () => {
      await client.listDatabases();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('Mysql/list_databases')
      );
    });

    it('should create database', async () => {
      await client.createDatabase('test_db');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('Mysql/create_database')
      );
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('name=test_db')
      );
    });

    it('should create email account', async () => {
      await client.createEmailAccount('test@example.com', 'password123', 500);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('Email/add_pop')
      );
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('email=test%40example.com')
      );
    });

    it('should add cron job', async () => {
      await client.addCronJob('0', '2', '*', '*', '*', '/path/to/script.sh');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('Cron/add_line')
      );
    });

    it('should upload SSL certificate', async () => {
      await client.uploadSSLCertificate('cert-content', 'key-content', 'ca-bundle');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('SSL/upload_cert')
      );
    });

    it('should create subdomain', async () => {
      await client.createSubdomain('sub', 'example.com', '/public_html/sub');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('SubDomain/add_subdomain')
      );
    });

    it('should add DNS record', async () => {
      await client.addDNSRecord('example.com', 'www', 'A', '192.168.1.1', 3600);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('DNS/add_zone_record')
      );
    });
  });
});