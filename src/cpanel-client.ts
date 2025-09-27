import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { CpanelConfig, CpanelResponse } from './types/cpanel.js';
import {
  CpanelError,
  CpanelAuthenticationError,
  CpanelConnectionError,
  CpanelTimeoutError,
  createCpanelError
} from './errors.js';
import { retryOperation, RetryOptions } from './utils/retry.js';
import { logger } from './utils/logger.js';

export class CpanelClient {
  private client: AxiosInstance;
  private config: CpanelConfig;
  private retryOptions: RetryOptions;

  constructor(config: CpanelConfig, retryOptions?: RetryOptions) {
    this.config = config;
    this.retryOptions = retryOptions || {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2
    };

    const baseURL = `${config.ssl !== false ? 'https' : 'http'}://${config.hostname}:${config.port || 2083}`;

    logger.info('Initializing cPanel client', { hostname: config.hostname, username: config.username });

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'User-Agent': 'cPanel-MCP/1.0.0',
      },
    });

    if (config.apiToken) {
      this.client.defaults.headers.common['Authorization'] = `cpanel ${config.username}:${config.apiToken}`;
      logger.debug('Using API token authentication');
    } else if (config.password) {
      this.client.defaults.auth = {
        username: config.username,
        password: config.password,
      };
      logger.debug('Using password authentication');
    } else {
      throw new CpanelAuthenticationError('No authentication method provided');
    }

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.trace('Making HTTP request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params
        });
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.trace('Received HTTP response', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url
        });
        return response;
      },
      (error: AxiosError) => {
        if (error.code === 'ECONNABORTED') {
          logger.error('Request timeout', { url: error.config?.url, timeout: error.config?.timeout });
          return Promise.reject(new CpanelTimeoutError(`Request timeout after ${error.config?.timeout}ms`));
        }

        if (error.response) {
          logger.error('HTTP error response', {
            status: error.response.status,
            statusText: error.response.statusText,
            url: error.config?.url
          });

          if (error.response.status === 401 || error.response.status === 403) {
            return Promise.reject(new CpanelAuthenticationError('Authentication failed: Invalid credentials'));
          }
        } else if (error.request) {
          logger.error('Network error', { message: error.message, code: error.code });
          return Promise.reject(new CpanelConnectionError(`Network error: ${error.message}`, { code: error.code }));
        }

        return Promise.reject(createCpanelError(error.message, error));
      }
    );
  }

  async executeUAPI(module: string, func: string, params: Record<string, any> = {}): Promise<any> {
    const startTime = Date.now();

    logger.logApiRequest(module, func, params);

    return retryOperation(async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('cpanel_jsonapi_user', this.config.username);
        queryParams.append('cpanel_jsonapi_apiversion', '3');
        queryParams.append('cpanel_jsonapi_module', module);
        queryParams.append('cpanel_jsonapi_func', func);

        for (const [key, value] of Object.entries(params)) {
          queryParams.append(key, String(value));
        }

        const response: AxiosResponse<CpanelResponse> = await this.client.get(
          `/execute/${module}/${func}?${queryParams.toString()}`
        );

        const duration = Date.now() - startTime;

        // Check cPanel API response status
        if (response.data.cpanelresult.event.result === 0) {
          const errorData = response.data.cpanelresult.data;
          const errorMessage = Array.isArray(errorData) && errorData.length > 0 && errorData[0].reason
            ? errorData[0].reason
            : JSON.stringify(errorData);

          logger.logApiError(module, func, new Error(errorMessage), duration);
          throw createCpanelError(`cPanel API error: ${errorMessage}`, response.data);
        }

        logger.logApiResponse(module, func, response.data.cpanelresult.data, duration);
        return response.data.cpanelresult.data;

      } catch (error) {
        const duration = Date.now() - startTime;

        if (error instanceof CpanelError) {
          throw error;
        }

        if (axios.isAxiosError(error)) {
          logger.logApiError(module, func, error, duration);
          throw createCpanelError(`cPanel API request failed: ${error.message}`, error.response?.data);
        }

        const unknownError = error instanceof Error ? error : new Error(String(error));
        logger.logApiError(module, func, unknownError, duration);
        throw createCpanelError(unknownError.message, error);
      }
    }, this.retryOptions);
  }

  async listFiles(path: string = '/'): Promise<any> {
    return this.executeUAPI('Fileman', 'list_files', { dir: path });
  }

  async listDatabases(): Promise<any> {
    return this.executeUAPI('Mysql', 'list_databases');
  }

  async listEmailAccounts(domain?: string): Promise<any> {
    const params = domain ? { domain } : {};
    return this.executeUAPI('Email', 'list_pops', params);
  }

  async listDomains(): Promise<any> {
    return this.executeUAPI('DomainInfo', 'list_domains');
  }

  async listCronJobs(): Promise<any> {
    return this.executeUAPI('Cron', 'list_cron');
  }

  async getDiskUsage(): Promise<any> {
    return this.executeUAPI('StatsBar', 'stat');
  }

  async createDatabase(name: string): Promise<any> {
    return this.executeUAPI('Mysql', 'create_database', { name });
  }

  async deleteDatabase(name: string): Promise<any> {
    return this.executeUAPI('Mysql', 'delete_database', { name });
  }

  async createEmailAccount(email: string, password: string, quota?: number): Promise<any> {
    const params: Record<string, any> = { email, password };
    if (quota) params.quota = quota;
    return this.executeUAPI('Email', 'add_pop', params);
  }

  async deleteEmailAccount(email: string): Promise<any> {
    return this.executeUAPI('Email', 'delete_pop', { email });
  }

  async addCronJob(minute: string, hour: string, day: string, month: string, weekday: string, command: string): Promise<any> {
    return this.executeUAPI('Cron', 'add_line', {
      minute, hour, day, month, weekday, command
    });
  }

  async deleteCronJob(linekey: string): Promise<any> {
    return this.executeUAPI('Cron', 'remove_line', { line: linekey });
  }

  async createBackup(destinations?: string[]): Promise<any> {
    const params = destinations ? { dest: destinations.join(',') } : {};
    return this.executeUAPI('Backup', 'fullbackup_to_homedir', params);
  }

  async listBackups(): Promise<any> {
    return this.executeUAPI('Backup', 'list_backups');
  }

  // SSL Certificate Management
  async listSSLCertificates(): Promise<any> {
    return this.executeUAPI('SSL', 'list_certs');
  }

  async uploadSSLCertificate(certificate: string, privateKey: string, caBundle?: string): Promise<any> {
    const params: Record<string, any> = {
      cert: certificate,
      key: privateKey
    };
    if (caBundle) params.cabundle = caBundle;
    return this.executeUAPI('SSL', 'upload_cert', params);
  }

  async deleteSSLCertificate(id: string): Promise<any> {
    return this.executeUAPI('SSL', 'delete_cert', { id });
  }

  async installSSLCertificate(domain: string, certificateId: string): Promise<any> {
    return this.executeUAPI('SSL', 'install_ssl', {
      domain,
      cert: certificateId
    });
  }

  async generateCSR(domains: string[], keySize: number = 2048, countryCode: string = 'US',
                   state: string = '', city: string = '', organization: string = '',
                   organizationalUnit: string = '', email: string = ''): Promise<any> {
    return this.executeUAPI('SSL', 'generate_csr', {
      domains: domains.join(','),
      key_size: keySize,
      country: countryCode,
      state,
      city,
      company: organization,
      company_division: organizationalUnit,
      email
    });
  }

  // Subdomain Management
  async listSubdomains(): Promise<any> {
    return this.executeUAPI('SubDomain', 'list_subdomains');
  }

  async createSubdomain(subdomain: string, rootdomain: string, dir?: string): Promise<any> {
    const params: Record<string, any> = {
      domain: subdomain,
      rootdomain
    };
    if (dir) params.dir = dir;
    return this.executeUAPI('SubDomain', 'add_subdomain', params);
  }

  async deleteSubdomain(subdomain: string): Promise<any> {
    return this.executeUAPI('SubDomain', 'del_subdomain', { domain: subdomain });
  }

  // DNS Zone Management
  async listDNSRecords(domain: string): Promise<any> {
    return this.executeUAPI('DNS', 'parse_zone', { domain });
  }

  async addDNSRecord(domain: string, name: string, type: string, record: string, ttl: number = 14400, priority?: number): Promise<any> {
    const params: Record<string, any> = {
      domain,
      name,
      type,
      record,
      ttl
    };
    if (priority && (type === 'MX' || type === 'SRV')) {
      params.priority = priority;
    }
    return this.executeUAPI('DNS', 'add_zone_record', params);
  }

  async deleteDNSRecord(domain: string, linekey: string): Promise<any> {
    return this.executeUAPI('DNS', 'delete_zone_record', { domain, line: linekey });
  }

  async editDNSRecord(domain: string, linekey: string, newRecord: string, ttl?: number): Promise<any> {
    const params: Record<string, any> = {
      domain,
      line: linekey,
      record: newRecord
    };
    if (ttl) params.ttl = ttl;
    return this.executeUAPI('DNS', 'edit_zone_record', params);
  }

  // FTP Account Management
  async listFTPAccounts(): Promise<any> {
    return this.executeUAPI('Ftp', 'list_ftp');
  }

  async createFTPAccount(user: string, password: string, quota?: number, homedir?: string): Promise<any> {
    const params: Record<string, any> = {
      user,
      pass: password
    };
    if (quota) params.quota = quota;
    if (homedir) params.homedir = homedir;
    return this.executeUAPI('Ftp', 'add_ftp', params);
  }

  async deleteFTPAccount(user: string): Promise<any> {
    return this.executeUAPI('Ftp', 'del_ftp', { user });
  }

  // Database User Management
  async listDatabaseUsers(): Promise<any> {
    return this.executeUAPI('Mysql', 'list_users');
  }

  async createDatabaseUser(user: string, password: string): Promise<any> {
    return this.executeUAPI('Mysql', 'create_user', { name: user, password });
  }

  async deleteDatabaseUser(user: string): Promise<any> {
    return this.executeUAPI('Mysql', 'delete_user', { name: user });
  }

  async setDatabasePrivileges(user: string, database: string, privileges: string[]): Promise<any> {
    return this.executeUAPI('Mysql', 'set_privileges_on_database', {
      user,
      database,
      privileges: privileges.join(',')
    });
  }

  // File Operations
  async uploadFile(path: string, content: string): Promise<any> {
    return this.executeUAPI('Fileman', 'save_file_content', {
      dir: path.substring(0, path.lastIndexOf('/')),
      file: path.substring(path.lastIndexOf('/') + 1),
      content
    });
  }

  async downloadFile(path: string): Promise<any> {
    return this.executeUAPI('Fileman', 'get_file_content', { file: path });
  }

  async deleteFile(path: string): Promise<any> {
    return this.executeUAPI('Fileman', 'delete_files', { files: path });
  }

  async createDirectory(path: string): Promise<any> {
    return this.executeUAPI('Fileman', 'mkdir', { path });
  }
}
