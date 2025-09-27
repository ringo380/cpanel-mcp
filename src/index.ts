#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { CpanelClient } from './cpanel-client.js';
import { CPANEL_TOOLS } from './tools.js';
import { CpanelConfig } from './types/cpanel.js';
import { CpanelError, formatErrorForMCP } from './errors.js';
import { logger } from './utils/logger.js';

class CpanelMCPServer {
  private server: Server;
  private cpanelClient: CpanelClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'cpanel-mcp',
        version: '1.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: CPANEL_TOOLS,
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const safeArgs = args as Record<string, any> || {};

      if (!this.cpanelClient) {
        throw new Error('cPanel client not configured. Set CPANEL_HOSTNAME, CPANEL_USERNAME, and CPANEL_API_TOKEN or CPANEL_PASSWORD environment variables.');
      }

      try {
        logger.info(`Executing tool: ${name}`, { arguments: safeArgs });
        let result;

        switch (name) {
          case 'list_files':
            result = await this.cpanelClient.listFiles(safeArgs.path);
            break;

          case 'list_databases':
            result = await this.cpanelClient.listDatabases();
            break;

          case 'create_database':
            if (!safeArgs.name) throw new CpanelError('Database name is required', 'VALIDATION_ERROR');
            result = await this.cpanelClient.createDatabase(safeArgs.name);
            break;

          case 'delete_database':
            if (!safeArgs.name) throw new CpanelError('Database name is required', 'VALIDATION_ERROR');
            result = await this.cpanelClient.deleteDatabase(safeArgs.name);
            break;

          case 'list_email_accounts':
            result = await this.cpanelClient.listEmailAccounts(safeArgs.domain);
            break;

          case 'create_email_account':
            if (!safeArgs.email || !safeArgs.password) {
              throw new CpanelError('Email and password are required', 'VALIDATION_ERROR');
            }
            result = await this.cpanelClient.createEmailAccount(
              safeArgs.email,
              safeArgs.password,
              safeArgs.quota
            );
            break;

          case 'delete_email_account':
            if (!safeArgs.email) throw new CpanelError('Email is required', 'VALIDATION_ERROR');
            result = await this.cpanelClient.deleteEmailAccount(safeArgs.email);
            break;

          case 'list_domains':
            result = await this.cpanelClient.listDomains();
            break;

          case 'list_cron_jobs':
            result = await this.cpanelClient.listCronJobs();
            break;

          case 'add_cron_job': {
            const { minute, hour, day, month, weekday, command } = safeArgs;
            if (!minute || !hour || !day || !month || !weekday || !command) {
              throw new CpanelError('All cron job fields are required', 'VALIDATION_ERROR');
            }
            result = await this.cpanelClient.addCronJob(
              minute, hour, day, month, weekday, command
            );
            break;
          }

          case 'delete_cron_job':
            if (!safeArgs.linekey) throw new CpanelError('Line key is required', 'VALIDATION_ERROR');
            result = await this.cpanelClient.deleteCronJob(safeArgs.linekey);
            break;

          case 'get_disk_usage':
            result = await this.cpanelClient.getDiskUsage();
            break;

          case 'create_backup':
            result = await this.cpanelClient.createBackup(safeArgs.destinations);
            break;

          case 'list_backups':
            result = await this.cpanelClient.listBackups();
            break;

          // SSL Certificate Management
          case 'list_ssl_certificates':
            result = await this.cpanelClient.listSSLCertificates();
            break;

          case 'upload_ssl_certificate':
            if (!safeArgs.certificate || !safeArgs.private_key) {
              throw new CpanelError('Certificate and private key are required', 'VALIDATION_ERROR');
            }
            result = await this.cpanelClient.uploadSSLCertificate(
              safeArgs.certificate,
              safeArgs.private_key,
              safeArgs.ca_bundle
            );
            break;

          case 'delete_ssl_certificate':
            if (!safeArgs.id) throw new CpanelError('Certificate ID is required', 'VALIDATION_ERROR');
            result = await this.cpanelClient.deleteSSLCertificate(safeArgs.id);
            break;

          case 'install_ssl_certificate':
            if (!safeArgs.domain || !safeArgs.certificate_id) {
              throw new CpanelError('Domain and certificate ID are required', 'VALIDATION_ERROR');
            }
            result = await this.cpanelClient.installSSLCertificate(safeArgs.domain, safeArgs.certificate_id);
            break;

          case 'generate_csr':
            if (!safeArgs.domains || !Array.isArray(safeArgs.domains)) {
              throw new CpanelError('Domains array is required', 'VALIDATION_ERROR');
            }
            result = await this.cpanelClient.generateCSR(
              safeArgs.domains,
              safeArgs.key_size,
              safeArgs.country_code,
              safeArgs.state,
              safeArgs.city,
              safeArgs.organization,
              safeArgs.organizational_unit,
              safeArgs.email
            );
            break;

          // Subdomain Management
          case 'list_subdomains':
            result = await this.cpanelClient.listSubdomains();
            break;

          case 'create_subdomain':
            if (!safeArgs.subdomain || !safeArgs.rootdomain) {
              throw new CpanelError('Subdomain and root domain are required', 'VALIDATION_ERROR');
            }
            result = await this.cpanelClient.createSubdomain(safeArgs.subdomain, safeArgs.rootdomain, safeArgs.dir);
            break;

          case 'delete_subdomain':
            if (!safeArgs.subdomain) throw new CpanelError('Subdomain is required', 'VALIDATION_ERROR');
            result = await this.cpanelClient.deleteSubdomain(safeArgs.subdomain);
            break;

          // DNS Management
          case 'list_dns_records':
            if (!safeArgs.domain) throw new CpanelError('Domain is required', 'VALIDATION_ERROR');
            result = await this.cpanelClient.listDNSRecords(safeArgs.domain);
            break;

          case 'add_dns_record':
            if (!safeArgs.domain || !safeArgs.name || !safeArgs.type || !safeArgs.record) {
              throw new CpanelError('Domain, name, type, and record are required', 'VALIDATION_ERROR');
            }
            result = await this.cpanelClient.addDNSRecord(
              safeArgs.domain,
              safeArgs.name,
              safeArgs.type,
              safeArgs.record,
              safeArgs.ttl,
              safeArgs.priority
            );
            break;

          case 'delete_dns_record':
            if (!safeArgs.domain || !safeArgs.linekey) {
              throw new CpanelError('Domain and linekey are required', 'VALIDATION_ERROR');
            }
            result = await this.cpanelClient.deleteDNSRecord(safeArgs.domain, safeArgs.linekey);
            break;

          case 'edit_dns_record':
            if (!safeArgs.domain || !safeArgs.linekey || !safeArgs.record) {
              throw new CpanelError('Domain, linekey, and record are required', 'VALIDATION_ERROR');
            }
            result = await this.cpanelClient.editDNSRecord(safeArgs.domain, safeArgs.linekey, safeArgs.record, safeArgs.ttl);
            break;

          // FTP Account Management
          case 'list_ftp_accounts':
            result = await this.cpanelClient.listFTPAccounts();
            break;

          case 'create_ftp_account':
            if (!safeArgs.user || !safeArgs.password) {
              throw new CpanelError('User and password are required', 'VALIDATION_ERROR');
            }
            result = await this.cpanelClient.createFTPAccount(
              safeArgs.user,
              safeArgs.password,
              safeArgs.quota,
              safeArgs.homedir
            );
            break;

          case 'delete_ftp_account':
            if (!safeArgs.user) throw new CpanelError('User is required', 'VALIDATION_ERROR');
            result = await this.cpanelClient.deleteFTPAccount(safeArgs.user);
            break;

          // Database User Management
          case 'list_database_users':
            result = await this.cpanelClient.listDatabaseUsers();
            break;

          case 'create_database_user':
            if (!safeArgs.user || !safeArgs.password) {
              throw new CpanelError('User and password are required', 'VALIDATION_ERROR');
            }
            result = await this.cpanelClient.createDatabaseUser(safeArgs.user, safeArgs.password);
            break;

          case 'delete_database_user':
            if (!safeArgs.user) throw new CpanelError('User is required', 'VALIDATION_ERROR');
            result = await this.cpanelClient.deleteDatabaseUser(safeArgs.user);
            break;

          case 'set_database_privileges':
            if (!safeArgs.user || !safeArgs.database || !safeArgs.privileges) {
              throw new CpanelError('User, database, and privileges are required', 'VALIDATION_ERROR');
            }
            result = await this.cpanelClient.setDatabasePrivileges(safeArgs.user, safeArgs.database, safeArgs.privileges);
            break;

          // File Operations
          case 'upload_file':
            if (!safeArgs.path || !safeArgs.content) {
              throw new CpanelError('Path and content are required', 'VALIDATION_ERROR');
            }
            result = await this.cpanelClient.uploadFile(safeArgs.path, safeArgs.content);
            break;

          case 'download_file':
            if (!safeArgs.path) throw new CpanelError('Path is required', 'VALIDATION_ERROR');
            result = await this.cpanelClient.downloadFile(safeArgs.path);
            break;

          case 'delete_file':
            if (!safeArgs.path) throw new CpanelError('Path is required', 'VALIDATION_ERROR');
            result = await this.cpanelClient.deleteFile(safeArgs.path);
            break;

          case 'create_directory':
            if (!safeArgs.path) throw new CpanelError('Path is required', 'VALIDATION_ERROR');
            result = await this.cpanelClient.createDirectory(safeArgs.path);
            break;

          default:
            throw new CpanelError(`Unknown tool: ${name}`, 'INVALID_TOOL');
        }

        logger.info(`Tool executed successfully: ${name}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof CpanelError
          ? formatErrorForMCP(error)
          : `Error: ${error instanceof Error ? error.message : String(error)}`;

        logger.error(`Tool execution failed: ${name}`, {
          error: error instanceof Error ? error.message : String(error),
          arguments: safeArgs
        });

        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private initializeCpanelClient() {
    const config: CpanelConfig = {
      hostname: process.env.CPANEL_HOSTNAME || '',
      username: process.env.CPANEL_USERNAME || '',
      password: process.env.CPANEL_PASSWORD,
      apiToken: process.env.CPANEL_API_TOKEN,
      port: process.env.CPANEL_PORT ? parseInt(process.env.CPANEL_PORT) : undefined,
      ssl: process.env.CPANEL_SSL !== 'false',
    };

    if (!config.hostname || !config.username) {
      throw new Error('CPANEL_HOSTNAME and CPANEL_USERNAME environment variables are required');
    }

    if (!config.password && !config.apiToken) {
      throw new Error('Either CPANEL_PASSWORD or CPANEL_API_TOKEN environment variable is required');
    }

    this.cpanelClient = new CpanelClient(config);
  }

  async run() {
    try {
      this.initializeCpanelClient();

      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      console.error('cPanel MCP Server running on stdio');
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

const server = new CpanelMCPServer();
server.run().catch(console.error);
