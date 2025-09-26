import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { CpanelConfig, CpanelResponse } from './types/cpanel.js';

export class CpanelClient {
  private client: AxiosInstance;
  private config: CpanelConfig;

  constructor(config: CpanelConfig) {
    this.config = config;

    const baseURL = `${config.ssl !== false ? 'https' : 'http'}://${config.hostname}:${config.port || 2083}`;

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'User-Agent': 'cPanel-MCP/1.0.0',
      },
    });

    if (config.apiToken) {
      this.client.defaults.headers.common['Authorization'] = `cpanel ${config.username}:${config.apiToken}`;
    } else if (config.password) {
      this.client.defaults.auth = {
        username: config.username,
        password: config.password,
      };
    }
  }

  async executeUAPI(module: string, func: string, params: Record<string, any> = {}): Promise<any> {
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

      if (response.data.cpanelresult.event.result === 0) {
        throw new Error(`cPanel API error: ${JSON.stringify(response.data.cpanelresult.data)}`);
      }

      return response.data.cpanelresult.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`cPanel API request failed: ${error.message}`);
      }
      throw error;
    }
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
}