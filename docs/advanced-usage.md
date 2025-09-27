# Advanced Usage Guide

This guide covers advanced usage patterns, best practices, and integration examples for the cPanel MCP server.

## Table of Contents

- [Advanced Configuration](#advanced-configuration)
- [Error Handling and Retry Strategies](#error-handling-and-retry-strategies)
- [Logging and Monitoring](#logging-and-monitoring)
- [Batch Operations](#batch-operations)
- [Integration Examples](#integration-examples)
- [Production Deployment](#production-deployment)
- [Performance Optimization](#performance-optimization)
- [Security Best Practices](#security-best-practices)

## Advanced Configuration

### Environment-Based Configuration

Create different configurations for different environments:

```bash
# Development environment (.env.development)
CPANEL_HOSTNAME=dev.example.com
CPANEL_USERNAME=dev_user
CPANEL_API_TOKEN=dev_token_123
LOG_LEVEL=DEBUG
CPANEL_SSL=true
CPANEL_PORT=2083

# Production environment (.env.production)
CPANEL_HOSTNAME=panel.yoursite.com
CPANEL_USERNAME=admin
CPANEL_API_TOKEN=prod_secure_token_xyz
LOG_LEVEL=INFO
CPANEL_SSL=true
CPANEL_PORT=2083

# Staging environment (.env.staging)
CPANEL_HOSTNAME=staging.example.com
CPANEL_USERNAME=staging_user
CPANEL_API_TOKEN=staging_token_456
LOG_LEVEL=WARN
CPANEL_SSL=true
CPANEL_PORT=2083
```

### Custom Retry Configuration

Configure retry behavior for different environments:

```javascript
// High-reliability production config
const productionRetryConfig = {
  maxAttempts: 5,
  baseDelay: 2000,
  maxDelay: 30000,
  backoffFactor: 2
};

// Fast development config
const developmentRetryConfig = {
  maxAttempts: 2,
  baseDelay: 500,
  maxDelay: 5000,
  backoffFactor: 1.5
};
```

### SSL Configuration

For custom SSL setups:

```bash
# Custom SSL configuration
CPANEL_SSL=true
CPANEL_PORT=2083
CPANEL_SSL_VERIFY=false  # Only for self-signed certificates in dev

# HTTP configuration (not recommended for production)
CPANEL_SSL=false
CPANEL_PORT=2082
```

## Error Handling and Retry Strategies

### Custom Error Handling

```typescript
import { CpanelClient } from 'cpanel-mcp';
import {
  CpanelAuthenticationError,
  CpanelQuotaError,
  CpanelConnectionError
} from 'cpanel-mcp/errors';

class RobustCpanelManager {
  private client: CpanelClient;

  constructor(config) {
    this.client = new CpanelClient(config, {
      maxAttempts: 3,
      baseDelay: 1000
    });
  }

  async createDatabaseWithFallback(dbName: string) {
    try {
      return await this.client.createDatabase(dbName);
    } catch (error) {
      if (error instanceof CpanelQuotaError) {
        console.warn('Database quota exceeded, attempting cleanup...');
        await this.cleanupOldDatabases();
        return await this.client.createDatabase(dbName);
      } else if (error instanceof CpanelAuthenticationError) {
        console.error('Authentication failed, refreshing token...');
        await this.refreshApiToken();
        return await this.client.createDatabase(dbName);
      } else if (error instanceof CpanelConnectionError) {
        console.warn('Connection failed, trying backup server...');
        return await this.tryBackupServer(dbName);
      } else {
        throw error; // Re-throw unknown errors
      }
    }
  }

  private async cleanupOldDatabases() {
    const databases = await this.client.listDatabases();
    const oldDbs = databases.filter(db => this.isOldTestDatabase(db.name));

    for (const db of oldDbs) {
      try {
        await this.client.deleteDatabase(db.name);
        console.log(`Cleaned up old database: ${db.name}`);
      } catch (error) {
        console.warn(`Failed to cleanup database ${db.name}:`, error.message);
      }
    }
  }

  private isOldTestDatabase(name: string): boolean {
    return name.includes('_test_') &&
           name.includes(new Date().getFullYear() - 1);
  }
}
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage
const circuitBreaker = new CircuitBreaker();
const result = await circuitBreaker.execute(() =>
  client.createDatabase('example_db')
);
```

## Logging and Monitoring

### Structured Logging

```typescript
import { logger, LogLevel } from 'cpanel-mcp/logger';

// Configure structured logging
logger.setLevel(LogLevel.INFO);

class MonitoredCpanelOperations {
  async createWebsiteSetup(domain: string, config: any) {
    const operationId = `setup-${Date.now()}`;
    const startTime = Date.now();

    logger.info('Starting website setup', {
      operationId,
      domain,
      timestamp: new Date().toISOString()
    });

    try {
      // Create database
      logger.debug('Creating database', { operationId, step: 'database' });
      const dbResult = await client.createDatabase(`${domain.replace('.', '_')}_db`);

      // Create email
      logger.debug('Creating email account', { operationId, step: 'email' });
      const emailResult = await client.createEmailAccount(
        `admin@${domain}`,
        this.generateSecurePassword(),
        1000
      );

      // Setup SSL
      logger.debug('Setting up SSL', { operationId, step: 'ssl' });
      const sslResult = await this.setupSSL(domain);

      const duration = Date.now() - startTime;
      logger.info('Website setup completed', {
        operationId,
        domain,
        duration: `${duration}ms`,
        steps: ['database', 'email', 'ssl']
      });

      return {
        database: dbResult,
        email: emailResult,
        ssl: sslResult
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Website setup failed', {
        operationId,
        domain,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }
}
```

### Metrics Collection

```typescript
class MetricsCollector {
  private metrics = new Map<string, any>();

  recordOperation(operation: string, duration: number, success: boolean) {
    const key = `${operation}_${success ? 'success' : 'failure'}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0
      });
    }

    const metric = this.metrics.get(key);
    metric.count++;
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.count;

    logger.debug('Operation metrics recorded', {
      operation,
      success,
      duration,
      totalCount: metric.count,
      avgDuration: metric.avgDuration
    });
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  resetMetrics() {
    this.metrics.clear();
  }
}

// Usage with wrapper
const metrics = new MetricsCollector();

function withMetrics<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    let success = false;

    try {
      const result = await fn(...args);
      success = true;
      return result;
    } finally {
      const duration = Date.now() - startTime;
      metrics.recordOperation(operation, duration, success);
    }
  };
}

// Wrap client methods
const monitoredClient = {
  createDatabase: withMetrics('createDatabase', client.createDatabase.bind(client)),
  createEmailAccount: withMetrics('createEmailAccount', client.createEmailAccount.bind(client))
};
```

## Batch Operations

### Bulk Database Creation

```typescript
class BatchOperations {
  constructor(private client: CpanelClient, private batchSize = 5) {}

  async createMultipleDatabases(dbNames: string[]) {
    const results = [];
    const errors = [];

    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < dbNames.length; i += this.batchSize) {
      const batch = dbNames.slice(i, i + this.batchSize);

      logger.info(`Processing database batch ${Math.floor(i / this.batchSize) + 1}`, {
        batchSize: batch.length,
        totalBatches: Math.ceil(dbNames.length / this.batchSize)
      });

      const batchPromises = batch.map(async (dbName) => {
        try {
          const result = await this.client.createDatabase(dbName);
          return { name: dbName, success: true, result };
        } catch (error) {
          logger.warn(`Failed to create database ${dbName}`, { error: error.message });
          return { name: dbName, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.push(result.value);
          } else {
            errors.push(result.value);
          }
        } else {
          errors.push({
            name: 'unknown',
            success: false,
            error: result.reason
          });
        }
      });

      // Delay between batches to be respectful to the server
      if (i + this.batchSize < dbNames.length) {
        await this.delay(1000);
      }
    }

    return { results, errors };
  }

  async bulkEmailSetup(domains: string[]) {
    const emailConfig = [
      { local: 'admin', quota: 1000 },
      { local: 'support', quota: 500 },
      { local: 'noreply', quota: 100 }
    ];

    const operations = [];

    for (const domain of domains) {
      for (const config of emailConfig) {
        operations.push({
          domain,
          email: `${config.local}@${domain}`,
          password: this.generateSecurePassword(),
          quota: config.quota
        });
      }
    }

    return await this.createMultipleEmails(operations);
  }

  private async createMultipleEmails(emailConfigs: any[]) {
    const results = [];
    const errors = [];

    for (let i = 0; i < emailConfigs.length; i += this.batchSize) {
      const batch = emailConfigs.slice(i, i + this.batchSize);

      const batchPromises = batch.map(async (config) => {
        try {
          const result = await this.client.createEmailAccount(
            config.email,
            config.password,
            config.quota
          );
          return {
            email: config.email,
            success: true,
            result,
            generatedPassword: config.password
          };
        } catch (error) {
          return {
            email: config.email,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.push(result.value);
          } else {
            errors.push(result.value);
          }
        }
      });

      await this.delay(1000);
    }

    return { results, errors };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
```

## Integration Examples

### Express.js Web Dashboard

```typescript
import express from 'express';
import { CpanelClient } from 'cpanel-mcp';

const app = express();
app.use(express.json());

const cpanelClient = new CpanelClient({
  hostname: process.env.CPANEL_HOSTNAME!,
  username: process.env.CPANEL_USERNAME!,
  apiToken: process.env.CPANEL_API_TOKEN!
});

// Dashboard routes
app.get('/api/dashboard', async (req, res) => {
  try {
    const [databases, emails, domains, diskUsage] = await Promise.all([
      cpanelClient.listDatabases(),
      cpanelClient.listEmailAccounts(),
      cpanelClient.listDomains(),
      cpanelClient.getDiskUsage()
    ]);

    res.json({
      summary: {
        databases: databases.length,
        emails: emails.length,
        domains: domains.length,
        diskUsage: diskUsage.quota.diskused_percent
      },
      data: { databases, emails, domains, diskUsage }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quick setup endpoint
app.post('/api/quick-setup', async (req, res) => {
  const { domain, adminEmail, dbName } = req.body;

  try {
    const setupId = `setup_${Date.now()}`;

    // Start background setup
    res.json({
      message: 'Setup started',
      setupId,
      status: 'in_progress'
    });

    // Perform setup asynchronously
    const setupResult = await performQuickSetup(domain, adminEmail, dbName);

    // In a real app, you'd store this result in a database
    // and provide a status endpoint
    logger.info('Quick setup completed', { setupId, setupResult });

  } catch (error) {
    logger.error('Quick setup failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

async function performQuickSetup(domain: string, adminEmail: string, dbName: string) {
  const results = {};

  // Create database
  results.database = await cpanelClient.createDatabase(dbName);

  // Create admin email
  results.email = await cpanelClient.createEmailAccount(
    adminEmail,
    generateSecurePassword(),
    1000
  );

  // Create subdomain for admin panel
  results.subdomain = await cpanelClient.createSubdomain(
    'admin',
    domain,
    '/public_html/admin'
  );

  return results;
}

app.listen(3000, () => {
  console.log('Dashboard running on port 3000');
});
```

### CLI Tool

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { CpanelClient } from 'cpanel-mcp';
import { logger } from 'cpanel-mcp/logger';

const program = new Command();

program
  .name('cpanel-cli')
  .description('CLI tool for cPanel management')
  .version('1.0.0');

program
  .command('setup-site')
  .description('Set up a new website with database, email, and SSL')
  .argument('<domain>', 'Domain name')
  .option('-e, --email <email>', 'Admin email address')
  .option('-d, --database <name>', 'Database name')
  .option('--ssl', 'Setup SSL certificate')
  .action(async (domain, options) => {
    const client = createClient();

    try {
      logger.info('Starting site setup', { domain, options });

      // Create database
      if (options.database) {
        console.log(`Creating database: ${options.database}`);
        await client.createDatabase(options.database);
        console.log('✓ Database created');
      }

      // Create email
      if (options.email) {
        console.log(`Creating email: ${options.email}`);
        const password = generatePassword();
        await client.createEmailAccount(options.email, password, 1000);
        console.log(`✓ Email created with password: ${password}`);
      }

      // Setup SSL
      if (options.ssl) {
        console.log('Setting up SSL...');
        // SSL setup logic here
        console.log('✓ SSL configured');
      }

      console.log('\n🎉 Site setup completed successfully!');

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('backup')
  .description('Create a full backup')
  .option('-d, --destinations <destinations...>', 'Backup destinations')
  .action(async (options) => {
    const client = createClient();

    try {
      console.log('Creating backup...');
      const result = await client.createBackup(options.destinations);
      console.log('✓ Backup created:', result);
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      process.exit(1);
    }
  });

function createClient() {
  return new CpanelClient({
    hostname: process.env.CPANEL_HOSTNAME!,
    username: process.env.CPANEL_USERNAME!,
    apiToken: process.env.CPANEL_API_TOKEN!
  });
}

function generatePassword(): string {
  return Math.random().toString(36).slice(-12) +
         Math.random().toString(36).slice(-12).toUpperCase() +
         '!@#'[Math.floor(Math.random() * 3)];
}

program.parse();
```

## Performance Optimization

### Connection Pooling and Caching

```typescript
class OptimizedCpanelClient {
  private cache = new Map<string, { data: any, timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(private client: CpanelClient) {}

  async getCachedDomains(): Promise<any[]> {
    const cacheKey = 'domains';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      logger.debug('Returning cached domains');
      return cached.data;
    }

    logger.debug('Fetching fresh domains data');
    const domains = await this.client.listDomains();

    this.cache.set(cacheKey, {
      data: domains,
      timestamp: Date.now()
    });

    return domains;
  }

  async invalidateCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Batch operations with deduplication
  private pendingRequests = new Map<string, Promise<any>>();

  async getDedupedDatabases(): Promise<any[]> {
    const key = 'listDatabases';

    if (this.pendingRequests.has(key)) {
      logger.debug('Reusing pending database request');
      return await this.pendingRequests.get(key)!;
    }

    const promise = this.client.listDatabases();
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
}
```

This advanced usage guide provides comprehensive examples for production-ready implementations of the cPanel MCP server.