# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of cPanel MCP Server

## [1.0.0] - 2025-01-26

### Added
- **Core MCP Server**: Full Model Context Protocol server implementation
- **cPanel UAPI Integration**: Complete integration with cPanel's Unified API
- **File Management**: List files and directories through cPanel File Manager
- **Database Operations**:
  - List all MySQL databases
  - Create new databases
  - Delete existing databases
- **Email Account Management**:
  - List email accounts with optional domain filtering
  - Create new email accounts with quota support
  - Delete email accounts
- **Domain Information**: List all domains and subdomains in the account
- **Cron Job Management**:
  - List all scheduled cron jobs
  - Add new cron jobs with full schedule control
  - Delete existing cron jobs
- **System Monitoring**: Get detailed disk usage statistics
- **Backup Operations**:
  - Create full account backups
  - List available backups
- **Authentication Support**:
  - cPanel API token authentication (recommended)
  - Username/password authentication
  - Secure HTTPS connections by default
- **Configuration Management**:
  - Environment variable configuration
  - SSL/TLS support
  - Custom port configuration
- **Error Handling**: Comprehensive error handling and reporting
- **TypeScript Support**: Full TypeScript implementation with type definitions

### Security
- Secure authentication via API tokens
- HTTPS/SSL connections enforced by default
- Environment variable protection for credentials
- Input validation and sanitization

### Documentation
- Comprehensive README with installation and usage instructions
- Contributing guidelines for open source development
- MIT license for open source distribution
- Example configurations and usage patterns
- API reference documentation
- Troubleshooting guide

## Development Notes

### Technical Stack
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Framework**: Model Context Protocol SDK
- **HTTP Client**: Axios
- **Build System**: TypeScript Compiler

### cPanel UAPI Modules Integrated
- **Fileman**: File management operations
- **Mysql**: Database operations
- **Email**: Email account management
- **DomainInfo**: Domain information retrieval
- **Cron**: Cron job management
- **StatsBar**: Usage statistics
- **Backup**: Backup operations

### Future Roadmap
- Additional cPanel module integrations
- Enhanced error reporting and logging
- Performance optimizations
- Extended test coverage
- Plugin system for custom operations

---

For more details about any release, please see the [GitHub releases page](https://github.com/ringo380/cpanel-mcp/releases).