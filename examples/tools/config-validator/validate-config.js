#!/usr/bin/env node

/**
 * Configuration Validator for cPanel MCP
 *
 * This tool validates cPanel MCP configuration files to ensure they are properly
 * structured and contain all required settings.
 *
 * Usage:
 *   node validate-config.js <config-file>
 *   node validate-config.js --help
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validationRules = {
      required: [
        'mcpServers',
        'mcpServers.*.command',
        'mcpServers.*.args',
        'mcpServers.*.env.CPANEL_HOSTNAME',
        'mcpServers.*.env.CPANEL_USERNAME'
      ],
      authentication: [
        'mcpServers.*.env.CPANEL_API_TOKEN',
        'mcpServers.*.env.CPANEL_PASSWORD'
      ],
      types: {
        'mcpServers.*.env.CPANEL_SSL': 'boolean-string',
        'mcpServers.*.env.CPANEL_PORT': 'number-string',
        'mcpServers.*.env.CPANEL_TIMEOUT': 'number-string',
        'mcpServers.*.env.CPANEL_MAX_RETRIES': 'number-string',
        'mcpServers.*.env.LOG_LEVEL': 'log-level'
      }
    };
  }

  addError(message, path = '', severity = 'error') {
    this.errors.push({
      severity,
      message,
      path,
      timestamp: new Date().toISOString()
    });
  }

  addWarning(message, path = '') {
    this.warnings.push({
      severity: 'warning',
      message,
      path,
      timestamp: new Date().toISOString()
    });
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      if (key === '*') {
        return current ? Object.values(current) : undefined;
      }
      return current && current[key];
    }, obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  validateRequired(config) {
    console.log('Validating required fields...');

    for (const requiredPath of this.validationRules.required) {
      if (requiredPath.includes('*')) {
        // Handle wildcard paths
        const pathParts = requiredPath.split('.');
        const wildcardIndex = pathParts.indexOf('*');
        const basePath = pathParts.slice(0, wildcardIndex).join('.');
        const subPath = pathParts.slice(wildcardIndex + 1).join('.');

        const baseObj = this.getNestedValue(config, basePath);
        if (!baseObj) {
          this.addError(`Required section missing: ${basePath}`, basePath);
          continue;
        }

        for (const [key, value] of Object.entries(baseObj)) {
          const fullPath = `${basePath}.${key}.${subPath}`;
          const actualValue = this.getNestedValue(value, subPath);
          if (actualValue === undefined || actualValue === null || actualValue === '') {
            this.addError(`Required field missing: ${fullPath}`, fullPath);
          }
        }
      } else {
        const value = this.getNestedValue(config, requiredPath);
        if (value === undefined || value === null || value === '') {
          this.addError(`Required field missing: ${requiredPath}`, requiredPath);
        }
      }
    }
  }

  validateAuthentication(config) {
    console.log('Validating authentication configuration...');

    if (!config.mcpServers) return;

    for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
      const env = serverConfig.env || {};
      const hasApiToken = env.CPANEL_API_TOKEN && env.CPANEL_API_TOKEN.trim();
      const hasPassword = env.CPANEL_PASSWORD && env.CPANEL_PASSWORD.trim();

      if (!hasApiToken && !hasPassword) {
        this.addError(
          `No authentication method configured. Must have either CPANEL_API_TOKEN or CPANEL_PASSWORD`,
          `mcpServers.${serverName}.env`
        );
      }

      if (hasApiToken && hasPassword) {
        this.addWarning(
          `Both API token and password configured. API token will be used preferentially`,
          `mcpServers.${serverName}.env`
        );
      }

      if (hasPassword && !hasApiToken) {
        this.addWarning(
          `Using password authentication. API token is more secure and recommended`,
          `mcpServers.${serverName}.env`
        );
      }

      // Check for placeholder values
      if (hasApiToken && (
        env.CPANEL_API_TOKEN.includes('your_') ||
        env.CPANEL_API_TOKEN.includes('${') ||
        env.CPANEL_API_TOKEN === 'your_api_token'
      )) {
        this.addWarning(
          `API token appears to be a placeholder value`,
          `mcpServers.${serverName}.env.CPANEL_API_TOKEN`
        );
      }
    }
  }

  validateTypes(config) {
    console.log('Validating data types...');

    for (const [path, expectedType] of Object.entries(this.validationRules.types)) {
      if (path.includes('*')) {
        // Handle wildcard paths
        if (!config.mcpServers) continue;

        for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
          const actualPath = path.replace('*', serverName);
          const value = this.getNestedValue(config, actualPath);

          if (value !== undefined) {
            this.validateType(value, expectedType, actualPath);
          }
        }
      } else {
        const value = this.getNestedValue(config, path);
        if (value !== undefined) {
          this.validateType(value, expectedType, path);
        }
      }
    }
  }

  validateType(value, expectedType, path) {
    switch (expectedType) {
      case 'boolean-string':
        if (typeof value === 'string') {
          if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
            this.addError(
              `Expected boolean string (true/false), got: ${value}`,
              path
            );
          }
        } else if (typeof value !== 'boolean') {
          this.addError(
            `Expected boolean or boolean string, got: ${typeof value}`,
            path
          );
        }
        break;

      case 'number-string':
        if (typeof value === 'string') {
          if (isNaN(Number(value))) {
            this.addError(
              `Expected numeric string, got: ${value}`,
              path
            );
          }
        } else if (typeof value !== 'number') {
          this.addError(
            `Expected number or numeric string, got: ${typeof value}`,
            path
          );
        }
        break;

      case 'log-level':
        const validLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
        if (!validLevels.includes(value.toUpperCase())) {
          this.addError(
            `Invalid log level: ${value}. Valid levels: ${validLevels.join(', ')}`,
            path
          );
        }
        break;
    }
  }

  validateSecurity(config) {
    console.log('Validating security configuration...');

    if (!config.mcpServers) return;

    for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
      const env = serverConfig.env || {};

      // Check SSL configuration
      if (env.CPANEL_SSL === 'false' || env.CPANEL_SSL === false) {
        this.addWarning(
          `SSL is disabled. This is not recommended for production environments`,
          `mcpServers.${serverName}.env.CPANEL_SSL`
        );
      }

      // Check for default ports
      const port = env.CPANEL_PORT;
      if (port === '2082' && env.CPANEL_SSL !== 'false') {
        this.addWarning(
          `Using port 2082 with SSL enabled. Port 2083 is standard for SSL`,
          `mcpServers.${serverName}.env.CPANEL_PORT`
        );
      }

      // Check for localhost/development hostnames
      const hostname = env.CPANEL_HOSTNAME;
      if (hostname && (
        hostname.includes('localhost') ||
        hostname.includes('127.0.0.1') ||
        hostname.includes('.local') ||
        hostname.includes('dev.') ||
        hostname.includes('staging.')
      )) {
        this.addWarning(
          `Hostname appears to be for development/staging: ${hostname}`,
          `mcpServers.${serverName}.env.CPANEL_HOSTNAME`
        );
      }

      // Check for hardcoded credentials
      if (env.CPANEL_API_TOKEN && !env.CPANEL_API_TOKEN.includes('${')) {
        this.addWarning(
          `API token is hardcoded in configuration. Consider using environment variables`,
          `mcpServers.${serverName}.env.CPANEL_API_TOKEN`
        );
      }
    }
  }

  validatePerformance(config) {
    console.log('Validating performance configuration...');

    if (!config.mcpServers) return;

    for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
      const env = serverConfig.env || {};

      // Check timeout values
      const timeout = parseInt(env.CPANEL_TIMEOUT || '30000');
      if (timeout < 5000) {
        this.addWarning(
          `Timeout value is very low (${timeout}ms). This may cause connection issues`,
          `mcpServers.${serverName}.env.CPANEL_TIMEOUT`
        );
      } else if (timeout > 120000) {
        this.addWarning(
          `Timeout value is very high (${timeout}ms). This may cause slow responses`,
          `mcpServers.${serverName}.env.CPANEL_TIMEOUT`
        );
      }

      // Check retry configuration
      const maxRetries = parseInt(env.CPANEL_MAX_RETRIES || '3');
      if (maxRetries > 10) {
        this.addWarning(
          `Max retries is very high (${maxRetries}). This may cause long delays on failures`,
          `mcpServers.${serverName}.env.CPANEL_MAX_RETRIES`
        );
      }

      const retryDelay = parseInt(env.CPANEL_RETRY_DELAY || '1000');
      if (retryDelay < 100) {
        this.addWarning(
          `Retry delay is very low (${retryDelay}ms). This may overwhelm the server`,
          `mcpServers.${serverName}.env.CPANEL_RETRY_DELAY`
        );
      }
    }
  }

  validateStructure(config) {
    console.log('Validating configuration structure...');

    if (typeof config !== 'object' || config === null) {
      this.addError('Configuration must be a valid JSON object');
      return;
    }

    if (!config.mcpServers) {
      this.addError('Configuration must include mcpServers section');
      return;
    }

    if (typeof config.mcpServers !== 'object') {
      this.addError('mcpServers must be an object');
      return;
    }

    const serverNames = Object.keys(config.mcpServers);
    if (serverNames.length === 0) {
      this.addError('At least one MCP server must be configured');
      return;
    }

    // Validate server configurations
    for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
      if (typeof serverConfig !== 'object') {
        this.addError(
          `Server configuration must be an object`,
          `mcpServers.${serverName}`
        );
        continue;
      }

      if (!serverConfig.command) {
        this.addError(
          `Server must have a command`,
          `mcpServers.${serverName}.command`
        );
      }

      if (!serverConfig.args || !Array.isArray(serverConfig.args)) {
        this.addError(
          `Server must have args array`,
          `mcpServers.${serverName}.args`
        );
      }

      if (!serverConfig.env || typeof serverConfig.env !== 'object') {
        this.addError(
          `Server must have env object`,
          `mcpServers.${serverName}.env`
        );
      }
    }
  }

  generateRecommendations(config) {
    const recommendations = [];

    // Security recommendations
    recommendations.push({
      category: 'Security',
      items: [
        'Use environment variables for sensitive configuration',
        'Enable SSL/TLS for all connections',
        'Use API tokens instead of passwords',
        'Regularly rotate API tokens',
        'Implement IP whitelisting if possible'
      ]
    });

    // Performance recommendations
    recommendations.push({
      category: 'Performance',
      items: [
        'Set appropriate timeout values based on network conditions',
        'Configure retry logic for transient failures',
        'Enable compression for large responses',
        'Use connection pooling for multiple servers',
        'Monitor and tune based on actual usage patterns'
      ]
    });

    // Monitoring recommendations
    recommendations.push({
      category: 'Monitoring',
      items: [
        'Enable structured logging',
        'Set up health checks',
        'Configure alerting for failures',
        'Monitor resource usage',
        'Track API rate limiting'
      ]
    });

    return recommendations;
  }

  async validate(configPath) {
    try {
      console.log(`Validating configuration: ${configPath}`);

      // Check if file exists
      try {
        await fs.access(configPath);
      } catch (error) {
        this.addError(`Configuration file not found: ${configPath}`);
        return this.getResults();
      }

      // Read and parse configuration
      let config;
      try {
        const configContent = await fs.readFile(configPath, 'utf8');
        config = JSON.parse(configContent);
      } catch (error) {
        this.addError(`Failed to parse configuration file: ${error.message}`);
        return this.getResults();
      }

      // Run validation tests
      this.validateStructure(config);
      this.validateRequired(config);
      this.validateAuthentication(config);
      this.validateTypes(config);
      this.validateSecurity(config);
      this.validatePerformance(config);

      return this.getResults();

    } catch (error) {
      this.addError(`Validation failed: ${error.message}`);
      return this.getResults();
    }
  }

  getResults() {
    const hasErrors = this.errors.length > 0;
    const hasWarnings = this.warnings.length > 0;

    return {
      valid: !hasErrors,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        errorCount: this.errors.length,
        warningCount: this.warnings.length,
        status: hasErrors ? 'invalid' : hasWarnings ? 'valid_with_warnings' : 'valid'
      }
    };
  }

  formatOutput(results, verbose = false) {
    const { valid, errors, warnings, summary } = results;

    console.log('\\n' + '='.repeat(50));
    console.log('Configuration Validation Results');
    console.log('='.repeat(50));

    // Summary
    console.log(`\\nStatus: ${summary.status.toUpperCase()}`);
    console.log(`Errors: ${summary.errorCount}`);
    console.log(`Warnings: ${summary.warningCount}`);

    // Errors
    if (errors.length > 0) {
      console.log('\\n❌ ERRORS:');
      for (const error of errors) {
        console.log(`  • ${error.message}`);
        if (verbose && error.path) {
          console.log(`    Path: ${error.path}`);
        }
      }
    }

    // Warnings
    if (warnings.length > 0) {
      console.log('\\n⚠️  WARNINGS:');
      for (const warning of warnings) {
        console.log(`  • ${warning.message}`);
        if (verbose && warning.path) {
          console.log(`    Path: ${warning.path}`);
        }
      }
    }

    // Success message
    if (valid && warnings.length === 0) {
      console.log('\\n✅ Configuration is valid!');
    } else if (valid) {
      console.log('\\n✅ Configuration is valid with warnings.');
    } else {
      console.log('\\n❌ Configuration has errors that must be fixed.');
    }

    console.log('\\n' + '='.repeat(50));

    return valid;
  }
}

// CLI implementation
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Configuration Validator for cPanel MCP

Usage:
  node validate-config.js <config-file> [options]

Options:
  --verbose     Show detailed validation information
  --json       Output results in JSON format
  --help       Show this help message

Examples:
  node validate-config.js ./config.json
  node validate-config.js ./config.json --verbose
  node validate-config.js ./config.json --json
    `);
    return;
  }

  const configPath = args[0];
  const verbose = args.includes('--verbose');
  const jsonOutput = args.includes('--json');

  const validator = new ConfigValidator();
  const results = await validator.validate(configPath);

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    const isValid = validator.formatOutput(results, verbose);
    process.exit(isValid ? 0 : 1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Validation failed:', error.message);
    process.exit(1);
  });
}

export { ConfigValidator };