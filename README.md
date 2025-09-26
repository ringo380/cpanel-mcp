# cPanel MCP Server

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)

A comprehensive Model Context Protocol (MCP) server for managing cPanel web hosting accounts. This server provides tools to interact with cPanel's UAPI (Unified API) for common hosting management tasks, enabling seamless integration with AI assistants and automation workflows.

## 🚀 Features

- **File Management**: Browse, list, and manage files through cPanel's File Manager
- **Database Operations**: Create, delete, and list MySQL databases
- **Email Management**: Manage email accounts with full CRUD operations
- **Domain Information**: Retrieve domain and subdomain details
- **Cron Job Management**: Schedule and manage automated tasks
- **System Monitoring**: Monitor disk usage and account statistics
- **Backup Operations**: Create and manage account backups
- **Secure Authentication**: Support for both API tokens and password authentication

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- A cPanel hosting account with API access
- Either a cPanel password or API token for authentication

## 🛠️ Installation

### Option 1: Clone and Build

```bash
git clone https://github.com/ringo380/cpanel-mcp.git
cd cpanel-mcp
npm install
npm run build
```

### Option 2: Direct Installation

```bash
npm install -g cpanel-mcp
```

## ⚙️ Configuration

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Configure your cPanel credentials in `.env`:

```env
# Required: cPanel server details
CPANEL_HOSTNAME=your-cpanel-hostname.com
CPANEL_USERNAME=your-cpanel-username

# Authentication (choose one method)
CPANEL_API_TOKEN=your-api-token-here
# OR
CPANEL_PASSWORD=your-cpanel-password

# Optional: Connection settings
CPANEL_PORT=2083
CPANEL_SSL=true
```

### Generating a cPanel API Token (Recommended)

1. Log into your cPanel account
2. Navigate to **Security** → **Manage API Tokens**
3. Click **Create Token**
4. Give it a descriptive name and set permissions
5. Copy the generated token to your `.env` file

## 🚀 Usage

### Starting the Server

```bash
npm start
```

The server will start and listen for MCP connections via stdio.

### Integration with Claude Desktop

Add the server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "cpanel": {
      "command": "node",
      "args": ["/path/to/cpanel-mcp/dist/index.js"],
      "env": {
        "CPANEL_HOSTNAME": "your-hostname.com",
        "CPANEL_USERNAME": "your-username",
        "CPANEL_API_TOKEN": "your-token"
      }
    }
  }
}
```

## 🛠️ Available Tools

### File Management
- **`list_files`** - List files and directories in specified path
  ```json
  {
    "name": "list_files",
    "arguments": {
      "path": "/public_html"
    }
  }
  ```

### Database Management
- **`list_databases`** - List all MySQL databases
- **`create_database`** - Create a new MySQL database
- **`delete_database`** - Delete an existing database

### Email Management
- **`list_email_accounts`** - List all email accounts (optionally filter by domain)
- **`create_email_account`** - Create a new email account
- **`delete_email_account`** - Delete an email account

### Domain Operations
- **`list_domains`** - List all domains and subdomains

### Cron Job Management
- **`list_cron_jobs`** - List all scheduled cron jobs
- **`add_cron_job`** - Schedule a new cron job
- **`delete_cron_job`** - Remove a cron job

### System Information
- **`get_disk_usage`** - Get detailed disk usage statistics

### Backup Operations
- **`create_backup`** - Create a full account backup
- **`list_backups`** - List available backups

## 💡 Examples

### Creating a Database and Email Account

```typescript
// Create a new database
await callTool("create_database", {
  name: "myapp_db"
});

// Create an email account with 500MB quota
await callTool("create_email_account", {
  email: "support@mydomain.com",
  password: "secure_password_123",
  quota: 500
});
```

### Managing Cron Jobs

```typescript
// Add a daily backup cron job
await callTool("add_cron_job", {
  minute: "0",
  hour: "2",
  day: "*",
  month: "*",
  weekday: "*",
  command: "/usr/local/bin/backup_script.sh"
});
```

## 🔒 Security Considerations

- **Use API Tokens**: Prefer API tokens over passwords for better security
- **Environment Variables**: Never commit credentials to version control
- **Limited Scope**: The server only exposes safe, account-level operations
- **HTTPS**: Always use SSL/TLS connections to cPanel (enabled by default)

## 🧪 Development

### Setup Development Environment

```bash
git clone https://github.com/ringo380/cpanel-mcp.git
cd cpanel-mcp
npm install
cp .env.example .env
# Edit .env with your test cPanel credentials
```

### Development Commands

```bash
npm run dev        # Start in watch mode
npm run build      # Build TypeScript to JavaScript
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

### Testing

```bash
npm test           # Run test suite
npm run test:watch # Run tests in watch mode
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure tests pass: `npm test`
5. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
6. Push to your fork and submit a pull request

## 📚 API Reference

### cPanel UAPI Modules Used

- **Fileman**: File management operations
- **Mysql**: Database operations
- **Email**: Email account management
- **DomainInfo**: Domain information
- **Cron**: Cron job management
- **StatsBar**: Usage statistics
- **Backup**: Backup operations

For detailed cPanel UAPI documentation, visit: [cPanel UAPI Documentation](https://documentation.cpanel.net/display/DD/Guide+to+UAPI)

## 🐛 Troubleshooting

### Common Issues

**Connection Failed**
- Verify `CPANEL_HOSTNAME` is correct and accessible
- Check that the specified port is open (default: 2083 for HTTPS)
- Ensure SSL setting matches your cPanel configuration

**Authentication Failed**
- Verify username and password/API token are correct
- Check that API access is enabled for your account
- Ensure API token has sufficient permissions

**Tool Execution Errors**
- Check cPanel error logs for detailed error messages
- Verify you have necessary permissions for the operation
- Ensure target resources (databases, emails, etc.) exist

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=cpanel-mcp:*
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic
- [cPanel UAPI](https://documentation.cpanel.net/display/DD/Guide+to+UAPI) documentation
- The open source community for inspiration and tools

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/ringo380/cpanel-mcp/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/ringo380/cpanel-mcp/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/ringo380/cpanel-mcp/wiki)

---

**Star ⭐ this repository if you find it helpful!**