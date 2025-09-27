# cPanel MCP Examples

This directory contains comprehensive examples demonstrating various ways to use the cPanel Model Context Protocol server.

## Directory Structure

```
examples/
├── README.md                           # This file
├── configurations/                     # Configuration examples
│   ├── basic-config.json              # Simple configuration
│   ├── production-config.json         # Production-ready configuration
│   ├── multi-server-config.json       # Multiple cPanel servers
│   └── advanced-config.json           # All available options
├── integrations/                       # Integration examples
│   ├── claude-desktop/                # Claude Desktop integration
│   ├── automation-scripts/            # Automation examples
│   ├── monitoring/                     # Monitoring integrations
│   └── ci-cd/                         # CI/CD pipeline examples
├── use-cases/                         # Real-world use cases
│   ├── backup-automation/             # Automated backup workflows
│   ├── security-monitoring/           # Security monitoring
│   ├── performance-optimization/      # Performance optimization
│   └── compliance-reporting/          # Compliance and reporting
└── tools/                             # Helper tools and utilities
    ├── config-validator/              # Configuration validation
    ├── connection-tester/             # Connection testing utility
    └── bulk-operations/               # Bulk operation examples
```

## Getting Started

1. **Basic Setup**: Start with [configurations/basic-config.json](configurations/basic-config.json)
2. **Claude Desktop**: See [integrations/claude-desktop/](integrations/claude-desktop/)
3. **Production**: Follow [configurations/production-config.json](configurations/production-config.json)
4. **Advanced**: Explore [configurations/advanced-config.json](configurations/advanced-config.json)

## Configuration Examples

### Quick Start

The simplest way to get started:

```json
{
  "mcpServers": {
    "cpanel": {
      "command": "node",
      "args": ["/path/to/cpanel-mcp/dist/index.js"],
      "env": {
        "CPANEL_HOSTNAME": "your-server.com",
        "CPANEL_USERNAME": "your_username",
        "CPANEL_API_TOKEN": "your_api_token"
      }
    }
  }
}
```

### Production Configuration

For production environments with enhanced security and monitoring:

```json
{
  "mcpServers": {
    "cpanel-prod": {
      "command": "node",
      "args": ["/path/to/cpanel-mcp/dist/index.js"],
      "env": {
        "CPANEL_HOSTNAME": "your-server.com",
        "CPANEL_USERNAME": "your_username",
        "CPANEL_API_TOKEN": "your_api_token",
        "CPANEL_SSL": "true",
        "CPANEL_PORT": "2083",
        "CPANEL_TIMEOUT": "30000",
        "CPANEL_MAX_RETRIES": "3",
        "CPANEL_RETRY_DELAY": "1000",
        "LOG_LEVEL": "INFO",
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Security Best Practices

- **Never commit credentials** to version control
- **Use environment variables** for sensitive data
- **Enable SSL/TLS** for all connections
- **Implement rate limiting** in production
- **Monitor API usage** and set up alerts
- **Use API tokens** instead of passwords when possible
- **Rotate credentials** regularly
- **Restrict IP access** when possible

## Integration Patterns

### 1. Direct Integration
Connect Claude Desktop directly to cPanel MCP server.

### 2. Proxy Integration
Use a proxy server for enhanced security and logging.

### 3. Multi-Server Integration
Manage multiple cPanel servers from a single interface.

### 4. Automated Workflows
Create automated workflows using cPanel operations.

## Common Use Cases

### Website Management
- Deploy applications
- Manage domains and subdomains
- Configure SSL certificates
- Monitor disk usage

### Database Administration
- Create and manage databases
- Backup database content
- Monitor database performance
- User management

### Email Management
- Create email accounts
- Configure email forwarding
- Manage email quotas
- Monitor email usage

### Security Operations
- SSL certificate management
- Firewall configuration
- Security monitoring
- Compliance reporting

### Performance Monitoring
- Resource usage tracking
- Performance optimization
- Capacity planning
- Alert configuration

## Troubleshooting

### Connection Issues
1. Verify hostname and port
2. Check firewall settings
3. Validate credentials
4. Test network connectivity

### Authentication Problems
1. Verify API token validity
2. Check username format
3. Ensure proper permissions
4. Review cPanel logs

### Performance Issues
1. Monitor request rates
2. Optimize retry settings
3. Implement caching
4. Review network latency

### Error Handling
1. Check log levels
2. Implement proper retry logic
3. Monitor error rates
4. Set up alerting

## Support and Resources

- **Documentation**: See the main README.md
- **Integration Tests**: Use `npm run test:integration`
- **Production Guide**: See docs/production-deployment.md
- **Advanced Usage**: See docs/advanced-usage.md

For more examples and advanced configurations, explore the subdirectories in this examples folder.