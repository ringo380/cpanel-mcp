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
  },

  // SSL Certificate Management
  {
    name: 'list_ssl_certificates',
    description: 'List all SSL certificates in the cPanel account',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'upload_ssl_certificate',
    description: 'Upload an SSL certificate',
    inputSchema: {
      type: 'object',
      properties: {
        certificate: {
          type: 'string',
          description: 'The SSL certificate content (PEM format)'
        },
        private_key: {
          type: 'string',
          description: 'The private key content (PEM format)'
        },
        ca_bundle: {
          type: 'string',
          description: 'The CA bundle content (PEM format, optional)'
        }
      },
      required: ['certificate', 'private_key']
    }
  },
  {
    name: 'delete_ssl_certificate',
    description: 'Delete an SSL certificate',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The certificate ID to delete'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'install_ssl_certificate',
    description: 'Install an SSL certificate on a domain',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'The domain to install the certificate on'
        },
        certificate_id: {
          type: 'string',
          description: 'The certificate ID to install'
        }
      },
      required: ['domain', 'certificate_id']
    }
  },
  {
    name: 'generate_csr',
    description: 'Generate a Certificate Signing Request (CSR)',
    inputSchema: {
      type: 'object',
      properties: {
        domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of domains for the CSR'
        },
        key_size: {
          type: 'number',
          description: 'Key size in bits (default: 2048)',
          default: 2048
        },
        country_code: {
          type: 'string',
          description: 'Country code (default: US)',
          default: 'US'
        },
        state: {
          type: 'string',
          description: 'State or province'
        },
        city: {
          type: 'string',
          description: 'City'
        },
        organization: {
          type: 'string',
          description: 'Organization name'
        },
        organizational_unit: {
          type: 'string',
          description: 'Organizational unit'
        },
        email: {
          type: 'string',
          description: 'Email address'
        }
      },
      required: ['domains']
    }
  },

  // Subdomain Management
  {
    name: 'list_subdomains',
    description: 'List all subdomains in the cPanel account',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'create_subdomain',
    description: 'Create a new subdomain',
    inputSchema: {
      type: 'object',
      properties: {
        subdomain: {
          type: 'string',
          description: 'The subdomain name (without the root domain)'
        },
        rootdomain: {
          type: 'string',
          description: 'The root domain for the subdomain'
        },
        dir: {
          type: 'string',
          description: 'Directory path for the subdomain (optional)'
        }
      },
      required: ['subdomain', 'rootdomain']
    }
  },
  {
    name: 'delete_subdomain',
    description: 'Delete a subdomain',
    inputSchema: {
      type: 'object',
      properties: {
        subdomain: {
          type: 'string',
          description: 'The full subdomain to delete (e.g., sub.example.com)'
        }
      },
      required: ['subdomain']
    }
  },

  // DNS Management
  {
    name: 'list_dns_records',
    description: 'List DNS records for a domain',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'The domain to list DNS records for'
        }
      },
      required: ['domain']
    }
  },
  {
    name: 'add_dns_record',
    description: 'Add a DNS record',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'The domain to add the record to'
        },
        name: {
          type: 'string',
          description: 'The record name'
        },
        type: {
          type: 'string',
          description: 'The record type (A, AAAA, CNAME, MX, TXT, etc.)'
        },
        record: {
          type: 'string',
          description: 'The record value'
        },
        ttl: {
          type: 'number',
          description: 'Time to live in seconds (default: 14400)',
          default: 14400
        },
        priority: {
          type: 'number',
          description: 'Priority for MX and SRV records'
        }
      },
      required: ['domain', 'name', 'type', 'record']
    }
  },
  {
    name: 'delete_dns_record',
    description: 'Delete a DNS record',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'The domain the record belongs to'
        },
        linekey: {
          type: 'string',
          description: 'The line key of the record to delete'
        }
      },
      required: ['domain', 'linekey']
    }
  },

  // FTP Account Management
  {
    name: 'list_ftp_accounts',
    description: 'List all FTP accounts',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'create_ftp_account',
    description: 'Create a new FTP account',
    inputSchema: {
      type: 'object',
      properties: {
        user: {
          type: 'string',
          description: 'FTP username'
        },
        password: {
          type: 'string',
          description: 'FTP password'
        },
        quota: {
          type: 'number',
          description: 'Disk quota in MB (optional)'
        },
        homedir: {
          type: 'string',
          description: 'Home directory path (optional)'
        }
      },
      required: ['user', 'password']
    }
  },
  {
    name: 'delete_ftp_account',
    description: 'Delete an FTP account',
    inputSchema: {
      type: 'object',
      properties: {
        user: {
          type: 'string',
          description: 'FTP username to delete'
        }
      },
      required: ['user']
    }
  },

  // Database User Management
  {
    name: 'list_database_users',
    description: 'List all database users',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'create_database_user',
    description: 'Create a new database user',
    inputSchema: {
      type: 'object',
      properties: {
        user: {
          type: 'string',
          description: 'Database username'
        },
        password: {
          type: 'string',
          description: 'Database password'
        }
      },
      required: ['user', 'password']
    }
  },
  {
    name: 'delete_database_user',
    description: 'Delete a database user',
    inputSchema: {
      type: 'object',
      properties: {
        user: {
          type: 'string',
          description: 'Database username to delete'
        }
      },
      required: ['user']
    }
  },
  {
    name: 'set_database_privileges',
    description: 'Set privileges for a database user on a specific database',
    inputSchema: {
      type: 'object',
      properties: {
        user: {
          type: 'string',
          description: 'Database username'
        },
        database: {
          type: 'string',
          description: 'Database name'
        },
        privileges: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of privileges (SELECT, INSERT, UPDATE, DELETE, etc.)'
        }
      },
      required: ['user', 'database', 'privileges']
    }
  },

  // File Operations
  {
    name: 'upload_file',
    description: 'Upload a file to the server',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Full path where to upload the file'
        },
        content: {
          type: 'string',
          description: 'File content'
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'download_file',
    description: 'Download a file from the server',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Full path of the file to download'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the server',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Full path of the file to delete'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'create_directory',
    description: 'Create a new directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Full path of the directory to create'
        }
      },
      required: ['path']
    }
  }
];
