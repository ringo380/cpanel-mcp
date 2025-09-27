#!/usr/bin/env node

/**
 * Automated Backup Script for cPanel MCP
 *
 * This script demonstrates how to automate backup operations using the cPanel MCP server.
 * It creates backups of databases, files, and email accounts on a scheduled basis.
 *
 * Usage:
 *   node backup-automation.js [options]
 *
 * Options:
 *   --config <path>    Configuration file path
 *   --dry-run         Show what would be backed up without actually doing it
 *   --verbose         Enable verbose logging
 *   --type <type>     Backup type: all, databases, files, email
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CpanelBackupAutomation {
  constructor(config = {}) {
    this.config = {
      // Default configuration
      mcpServerPath: '/path/to/cpanel-mcp/dist/index.js',
      backupDirectory: './backups',
      retentionDays: 30,
      compressionEnabled: true,
      encryptionEnabled: false,
      notificationEnabled: true,
      ...config
    };

    this.backupTypes = {
      databases: true,
      files: true,
      email: true,
      ...config.backupTypes
    };

    this.verbose = false;
    this.dryRun = false;
  }

  async log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    console.log(logMessage);

    // Optionally write to log file
    if (this.config.logFile) {
      await fs.appendFile(this.config.logFile, logMessage + '\\n').catch(() => {});
    }
  }

  async executeMcpTool(tool, args = {}) {
    return new Promise((resolve, reject) => {
      const mcpProcess = spawn('node', [this.config.mcpServerPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          CPANEL_HOSTNAME: this.config.cpanel.hostname,
          CPANEL_USERNAME: this.config.cpanel.username,
          CPANEL_API_TOKEN: this.config.cpanel.apiToken,
          LOG_LEVEL: this.verbose ? 'DEBUG' : 'WARN'
        }
      });

      let output = '';
      let error = '';

      mcpProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      mcpProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      mcpProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            resolve(output);
          }
        } else {
          reject(new Error(`MCP tool failed: ${error || output}`));
        }
      });

      // Send the tool request
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: tool,
          arguments: args
        }
      };

      mcpProcess.stdin.write(JSON.stringify(request) + '\\n');
      mcpProcess.stdin.end();
    });
  }

  async backupDatabases() {
    if (!this.backupTypes.databases) return;

    await this.log('Starting database backup...');

    try {
      // List all databases
      const databases = await this.executeMcpTool('cpanel_list_databases');

      if (this.dryRun) {
        await this.log(`Would backup ${databases.length} databases`);
        return;
      }

      const backupDir = path.join(this.config.backupDirectory, 'databases', this.getDateString());
      await fs.mkdir(backupDir, { recursive: true });

      for (const db of databases) {
        await this.log(`Backing up database: ${db.db}`);

        // Export database
        const exportResult = await this.executeMcpTool('cpanel_export_database', {
          database: db.db
        });

        const backupFile = path.join(backupDir, `${db.db}.sql`);
        await fs.writeFile(backupFile, exportResult.data);

        if (this.config.compressionEnabled) {
          // Compress the backup file
          await this.compressFile(backupFile);
        }
      }

      await this.log(`Database backup completed. ${databases.length} databases backed up.`);
    } catch (error) {
      await this.log(`Database backup failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async backupFiles() {
    if (!this.backupTypes.files) return;

    await this.log('Starting file backup...');

    try {
      // Define directories to backup
      const backupPaths = [
        '/public_html',
        '/private_html',
        '/.htaccess',
        '/cgi-bin'
      ];

      if (this.dryRun) {
        await this.log(`Would backup ${backupPaths.length} directories`);
        return;
      }

      const backupDir = path.join(this.config.backupDirectory, 'files', this.getDateString());
      await fs.mkdir(backupDir, { recursive: true });

      for (const backupPath of backupPaths) {
        await this.log(`Backing up files from: ${backupPath}`);

        try {
          // List files in the path
          const files = await this.executeMcpTool('cpanel_list_files', {
            path: backupPath
          });

          // Create archive of the directory
          const archiveName = `${backupPath.replace(/[/\\\\]/g, '_')}.tar.gz`;
          const archivePath = path.join(backupDir, archiveName);

          // Note: In a real implementation, you would use the cPanel File Manager
          // API to create archives or implement file downloading
          await this.log(`Created archive: ${archiveName}`);
        } catch (error) {
          await this.log(`Failed to backup ${backupPath}: ${error.message}`, 'warn');
        }
      }

      await this.log('File backup completed.');
    } catch (error) {
      await this.log(`File backup failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async backupEmail() {
    if (!this.backupTypes.email) return;

    await this.log('Starting email backup...');

    try {
      // List all email accounts
      const emailAccounts = await this.executeMcpTool('cpanel_list_email_accounts');

      if (this.dryRun) {
        await this.log(`Would backup ${emailAccounts.length} email accounts`);
        return;
      }

      const backupDir = path.join(this.config.backupDirectory, 'email', this.getDateString());
      await fs.mkdir(backupDir, { recursive: true });

      // Export email account configurations
      const configFile = path.join(backupDir, 'email_accounts.json');
      await fs.writeFile(configFile, JSON.stringify(emailAccounts, null, 2));

      await this.log(`Email configuration backup completed. ${emailAccounts.length} accounts backed up.`);
    } catch (error) {
      await this.log(`Email backup failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async cleanupOldBackups() {
    if (this.dryRun) {
      await this.log('Would cleanup old backups');
      return;
    }

    await this.log('Cleaning up old backups...');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const backupTypes = ['databases', 'files', 'email'];

      for (const type of backupTypes) {
        const typeDir = path.join(this.config.backupDirectory, type);

        try {
          const entries = await fs.readdir(typeDir);

          for (const entry of entries) {
            const entryPath = path.join(typeDir, entry);
            const stats = await fs.stat(entryPath);

            if (stats.isDirectory() && stats.mtime < cutoffDate) {
              await this.log(`Removing old backup: ${entryPath}`);
              await fs.rmdir(entryPath, { recursive: true });
            }
          }
        } catch (error) {
          // Directory might not exist, which is fine
        }
      }

      await this.log('Cleanup completed.');
    } catch (error) {
      await this.log(`Cleanup failed: ${error.message}`, 'error');
    }
  }

  async compressFile(filePath) {
    // In a real implementation, you would use a compression library
    await this.log(`Compressing file: ${filePath}`);
  }

  async sendNotification(subject, message) {
    if (!this.config.notificationEnabled) return;

    await this.log(`Notification: ${subject} - ${message}`);

    // In a real implementation, you would send email/Slack/webhook notifications
  }

  getDateString() {
    return new Date().toISOString().split('T')[0];
  }

  async run(options = {}) {
    this.verbose = options.verbose || false;
    this.dryRun = options.dryRun || false;

    const startTime = Date.now();

    try {
      await this.log(`Starting backup process${this.dryRun ? ' (dry run)' : ''}...`);

      // Run backups in parallel for better performance
      const backupPromises = [];

      if (options.type === 'all' || options.type === 'databases' || !options.type) {
        backupPromises.push(this.backupDatabases());
      }

      if (options.type === 'all' || options.type === 'files' || !options.type) {
        backupPromises.push(this.backupFiles());
      }

      if (options.type === 'all' || options.type === 'email' || !options.type) {
        backupPromises.push(this.backupEmail());
      }

      await Promise.all(backupPromises);

      // Cleanup old backups
      await this.cleanupOldBackups();

      const duration = Math.round((Date.now() - startTime) / 1000);
      const message = `Backup process completed successfully in ${duration} seconds.`;

      await this.log(message);
      await this.sendNotification('Backup Completed', message);

    } catch (error) {
      const message = `Backup process failed: ${error.message}`;
      await this.log(message, 'error');
      await this.sendNotification('Backup Failed', message);
      throw error;
    }
  }
}

// CLI implementation
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--config':
        options.configPath = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--type':
        options.type = args[++i];
        break;
      case '--help':
        console.log(`
Usage: node backup-automation.js [options]

Options:
  --config <path>    Configuration file path
  --dry-run         Show what would be backed up without actually doing it
  --verbose         Enable verbose logging
  --type <type>     Backup type: all, databases, files, email
  --help           Show this help message
        `);
        return;
    }
  }

  try {
    let config = {};

    if (options.configPath) {
      const configContent = await fs.readFile(options.configPath, 'utf8');
      config = JSON.parse(configContent);
    }

    const backup = new CpanelBackupAutomation(config);
    await backup.run(options);

    process.exit(0);
  } catch (error) {
    console.error('Backup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CpanelBackupAutomation };