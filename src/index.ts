#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { CpanelClient } from './cpanel-client.js';
import { CPANEL_TOOLS } from './tools.js';
import { CpanelConfig } from './types/cpanel.js';

class CpanelMCPServer {
  private server: Server;
  private cpanelClient: CpanelClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'cpanel-mcp',
        version: '1.0.0',
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

      if (!this.cpanelClient) {
        throw new Error('cPanel client not configured. Set CPANEL_HOSTNAME, CPANEL_USERNAME, and CPANEL_API_TOKEN or CPANEL_PASSWORD environment variables.');
      }

      try {
        let result;

        switch (name) {
          case 'list_files':
            result = await this.cpanelClient.listFiles(args?.path);
            break;

          case 'list_databases':
            result = await this.cpanelClient.listDatabases();
            break;

          case 'create_database':
            if (!args?.name) throw new Error('Database name is required');
            result = await this.cpanelClient.createDatabase(args.name);
            break;

          case 'delete_database':
            if (!args?.name) throw new Error('Database name is required');
            result = await this.cpanelClient.deleteDatabase(args.name);
            break;

          case 'list_email_accounts':
            result = await this.cpanelClient.listEmailAccounts(args?.domain);
            break;

          case 'create_email_account':
            if (!args?.email || !args?.password) {
              throw new Error('Email and password are required');
            }
            result = await this.cpanelClient.createEmailAccount(
              args.email,
              args.password,
              args?.quota
            );
            break;

          case 'delete_email_account':
            if (!args?.email) throw new Error('Email is required');
            result = await this.cpanelClient.deleteEmailAccount(args.email);
            break;

          case 'list_domains':
            result = await this.cpanelClient.listDomains();
            break;

          case 'list_cron_jobs':
            result = await this.cpanelClient.listCronJobs();
            break;

          case 'add_cron_job':
            const { minute, hour, day, month, weekday, command } = args || {};
            if (!minute || !hour || !day || !month || !weekday || !command) {
              throw new Error('All cron job fields are required');
            }
            result = await this.cpanelClient.addCronJob(
              minute, hour, day, month, weekday, command
            );
            break;

          case 'delete_cron_job':
            if (!args?.linekey) throw new Error('Line key is required');
            result = await this.cpanelClient.deleteCronJob(args.linekey);
            break;

          case 'get_disk_usage':
            result = await this.cpanelClient.getDiskUsage();
            break;

          case 'create_backup':
            result = await this.cpanelClient.createBackup(args?.destinations);
            break;

          case 'list_backups':
            result = await this.cpanelClient.listBackups();
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
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