import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const CPANEL_TOOLS: Tool[] = [
  {
    name: 'list_files',
    description: 'List files and directories in cPanel File Manager',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path to list (defaults to home directory)',
          default: '/'
        }
      }
    }
  },
  {
    name: 'list_databases',
    description: 'List all MySQL databases in the cPanel account',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'create_database',
    description: 'Create a new MySQL database',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Database name to create'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'delete_database',
    description: 'Delete a MySQL database',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Database name to delete'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'list_email_accounts',
    description: 'List all email accounts in the cPanel account',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Filter by specific domain (optional)'
        }
      }
    }
  },
  {
    name: 'create_email_account',
    description: 'Create a new email account',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Full email address to create'
        },
        password: {
          type: 'string',
          description: 'Password for the email account'
        },
        quota: {
          type: 'number',
          description: 'Disk quota in MB (optional)'
        }
      },
      required: ['email', 'password']
    }
  },
  {
    name: 'delete_email_account',
    description: 'Delete an email account',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Full email address to delete'
        }
      },
      required: ['email']
    }
  },
  {
    name: 'list_domains',
    description: 'List all domains associated with the cPanel account',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'list_cron_jobs',
    description: 'List all cron jobs in the cPanel account',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'add_cron_job',
    description: 'Add a new cron job',
    inputSchema: {
      type: 'object',
      properties: {
        minute: {
          type: 'string',
          description: 'Minute field (0-59 or *)'
        },
        hour: {
          type: 'string',
          description: 'Hour field (0-23 or *)'
        },
        day: {
          type: 'string',
          description: 'Day field (1-31 or *)'
        },
        month: {
          type: 'string',
          description: 'Month field (1-12 or *)'
        },
        weekday: {
          type: 'string',
          description: 'Weekday field (0-6 or *)'
        },
        command: {
          type: 'string',
          description: 'Command to execute'
        }
      },
      required: ['minute', 'hour', 'day', 'month', 'weekday', 'command']
    }
  },
  {
    name: 'delete_cron_job',
    description: 'Delete a cron job',
    inputSchema: {
      type: 'object',
      properties: {
        linekey: {
          type: 'string',
          description: 'Line key of the cron job to delete'
        }
      },
      required: ['linekey']
    }
  },
  {
    name: 'get_disk_usage',
    description: 'Get disk usage statistics for the cPanel account',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'create_backup',
    description: 'Create a full backup of the cPanel account',
    inputSchema: {
      type: 'object',
      properties: {
        destinations: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Backup destinations (optional)'
        }
      }
    }
  },
  {
    name: 'list_backups',
    description: 'List available backups for the cPanel account',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];