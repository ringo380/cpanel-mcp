# Claude Desktop Integration

This directory contains examples for integrating the cPanel MCP server with Claude Desktop.

## Quick Setup

1. **Install cPanel MCP**:
   ```bash
   npm install -g cpanel-mcp
   # or clone and build from source
   ```

2. **Configure Claude Desktop**:
   Add to your Claude Desktop configuration file:

   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
   **Linux**: `~/.config/Claude/claude_desktop_config.json`

3. **Basic Configuration**:
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

4. **Restart Claude Desktop**

## Configuration Files

- `basic-setup.json` - Minimal configuration to get started
- `secure-setup.json` - Production-ready secure configuration
- `development-setup.json` - Development environment with debugging
- `multi-account-setup.json` - Multiple cPanel accounts
- `proxy-setup.json` - Configuration using a proxy server

## Environment Variables

You can use environment variables instead of hardcoding credentials:

```json
{
  "mcpServers": {
    "cpanel": {
      "command": "node",
      "args": ["/path/to/cpanel-mcp/dist/index.js"],
      "env": {
        "CPANEL_HOSTNAME": "${CPANEL_HOSTNAME}",
        "CPANEL_USERNAME": "${CPANEL_USERNAME}",
        "CPANEL_API_TOKEN": "${CPANEL_API_TOKEN}"
      }
    }
  }
}
```

Set these in your shell:
```bash
export CPANEL_HOSTNAME="your-server.com"
export CPANEL_USERNAME="your_username"
export CPANEL_API_TOKEN="your_api_token"
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use API tokens** instead of passwords
3. **Enable SSL** for all connections
4. **Restrict IP access** in cPanel if possible
5. **Use environment variables** for credentials
6. **Rotate API tokens** regularly

## Troubleshooting

### Claude Desktop Not Connecting

1. Check the configuration file location
2. Verify JSON syntax is valid
3. Ensure the path to index.js is correct
4. Check Claude Desktop logs

### Authentication Errors

1. Verify API token is valid and not expired
2. Check username format (no domain)
3. Ensure cPanel user has sufficient permissions
4. Test credentials with cPanel directly

### Permission Errors

1. Check file permissions on the MCP server
2. Verify cPanel user has required permissions
3. Check if 2FA is enabled and causing issues

### Performance Issues

1. Check network latency to cPanel server
2. Verify server resources are adequate
3. Consider using a proxy or load balancer
4. Enable caching if available

## Common Use Cases

### Website Management
- List and manage domains
- Configure subdomains
- Manage DNS records
- Upload and manage files

### Database Operations
- Create and delete databases
- Manage database users
- View database statistics
- Backup databases

### Email Management
- Create email accounts
- Set up email forwarding
- Manage email quotas
- Configure spam filters

### SSL Management
- View SSL certificates
- Upload new certificates
- Configure SSL settings
- Monitor certificate expiration

### Security & Monitoring
- View security logs
- Monitor resource usage
- Check for malware
- Review access logs

## Example Commands

Once configured, you can ask Claude to help with tasks like:

- "List all my databases"
- "Create a new subdomain called 'blog' for my main domain"
- "Show me my current disk usage"
- "Create a new email account for support@mydomain.com"
- "List all SSL certificates that are expiring soon"
- "Upload these files to my public_html directory"

## Advanced Features

### Custom Prompts
Create custom prompts for common tasks in the `prompts/` directory.

### Automation Scripts
Use the automation examples in `automation-scripts/` for complex workflows.

### Monitoring Integration
Set up monitoring dashboards using the examples in `monitoring/`.

## Support

For issues specific to Claude Desktop integration:
1. Check Claude Desktop documentation
2. Verify MCP server logs
3. Test the MCP server independently
4. Check network connectivity

For cPanel MCP server issues:
1. Check the main documentation
2. Run integration tests
3. Review server logs
4. Verify cPanel connectivity