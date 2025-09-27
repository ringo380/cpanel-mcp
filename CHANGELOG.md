# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-26

### Major Enhancements

#### Core Infrastructure Improvements
- **Enhanced Error Handling**: Added comprehensive error hierarchy with specific error types (CpanelAuthenticationError, CpanelConnectionError, CpanelValidationError, CpanelQuotaError, CpanelResourceNotFoundError, CpanelPermissionError)
- **Retry Logic**: Implemented exponential backoff retry mechanism for transient failures with configurable parameters
- **Structured Logging**: Added comprehensive logging system with multiple log levels (ERROR, WARN, INFO, DEBUG, TRACE) and context support
- **Type Safety**: Added complete TypeScript type definitions for all cPanel UAPI responses and tool parameters

#### New MCP Tools (20+ tools added)
- **SSL Certificate Management**:
  - `list_ssl_certificates`: List all SSL certificates
  - `get_ssl_certificate_info`: Get detailed certificate information
  - `upload_ssl_certificate`: Upload new SSL certificates
  - `install_ssl_certificate`: Install certificates on domains
  - `delete_ssl_certificate`: Remove SSL certificates
- **DNS Management**:
  - `list_dns_zones`: List all DNS zones
  - `list_dns_records`: List DNS records for a zone
  - `add_dns_record`: Add new DNS records (A, CNAME, MX, TXT, etc.)
  - `edit_dns_record`: Modify existing DNS records
  - `delete_dns_record`: Remove DNS records
- **Subdomain Management**:
  - `list_subdomains`: List all subdomains
  - `create_subdomain`: Create new subdomains
  - `delete_subdomain`: Remove subdomains
- **FTP Account Management**:
  - `list_ftp_accounts`: List all FTP accounts
  - `create_ftp_account`: Create new FTP accounts
  - `delete_ftp_account`: Remove FTP accounts
  - `change_ftp_password`: Update FTP passwords
- **Enhanced Email Management**:
  - `create_email_account`: Create email accounts with quota support
  - `delete_email_account`: Remove email accounts
  - `change_email_password`: Update email passwords
- **Enhanced Database Operations**:
  - `create_database`: Create new MySQL databases
  - `delete_database`: Remove databases
  - `create_database_user`: Create database users
  - `delete_database_user`: Remove database users
- **System Monitoring**:
  - `get_account_info`: Get comprehensive account information
  - `get_disk_usage`: Get detailed disk usage statistics
  - `get_bandwidth_usage`: Monitor bandwidth consumption

#### Testing Infrastructure
- **Jest Test Suite**: Complete unit test coverage with 73 tests covering all components
- **Integration Tests**: 34 integration tests for real cPanel API interactions with environment-based skipping
- **Test Organization**: Separate test commands (`test:unit`, `test:integration`) for different test types
- **Mock Infrastructure**: Comprehensive mocking for external dependencies (Axios, console, etc.)
- **TypeScript Test Support**: Full TypeScript support in Jest with proper ESM configuration

#### Documentation & Examples
- **Advanced Usage Guide**: Comprehensive documentation for complex scenarios (`docs/advanced-usage.md`)
- **Production Deployment Guide**: Best practices for production environments (`docs/production-deployment.md`)
- **Configuration Examples**: 5 different configuration templates:
  - `basic-config.json`: Simple single-server setup
  - `production-config.json`: Production-ready configuration
  - `multi-server-config.json`: Multi-server management
  - `advanced-config.json`: Advanced features and monitoring
  - `development-setup.json`: Development environment
- **Claude Desktop Integration**: Ready-to-use configurations for AI assistant integration
- **Automation Scripts**: Complete backup automation example with scheduling (`backup-automation.js`)
- **Security Monitoring**: Comprehensive security monitoring examples and documentation

#### Developer Tools
- **Configuration Validator**: Tool to validate cPanel MCP configuration files (`validate-config.js`)
- **Example Integrations**: Real-world usage examples for common scenarios
- **CI/CD Ready**: Proper build and test scripts for continuous integration

### Enhanced

#### Security
- **Authentication**: Improved API token and password handling with proper validation
- **SSL/TLS**: Enhanced SSL certificate management with validation and expiration monitoring
- **Input Validation**: Comprehensive parameter validation for all tools using custom validation schemas
- **Error Sanitization**: Secure error messages that don't leak sensitive information

#### Performance
- **Connection Pooling**: Optimized HTTP connections for better performance
- **Concurrent Operations**: Support for parallel API calls with proper error handling
- **Caching**: Intelligent caching of frequently accessed data
- **Resource Management**: Proper cleanup and resource management

#### Reliability
- **Error Recovery**: Automatic retry on transient failures with exponential backoff
- **Graceful Degradation**: Fallback mechanisms for partial failures
- **Health Checks**: Built-in health monitoring capabilities
- **Comprehensive Logging**: Detailed audit trail for debugging and monitoring

### Fixed

#### TypeScript Issues
- Resolved type safety issues in tool parameter handling with proper type casting
- Fixed compilation errors with proper type annotations
- Added missing type definitions for all API responses

#### Testing Issues
- Fixed Jest configuration for ESM modules
- Resolved mock function typing issues with proper generics
- Fixed integration test environment handling with graceful skipping

#### Documentation Issues
- Corrected configuration examples with proper environment variable usage
- Added missing parameter documentation for all tools
- Fixed code examples and usage patterns

## [1.0.0] - 2025-01-26

### Added
- **Core MCP Server**: Full Model Context Protocol server implementation
- **cPanel UAPI Integration**: Complete integration with cPanel's Unified API
- **File Management**: List files and directories through cPanel File Manager
- **Basic Database Operations**: List MySQL databases
- **Basic Email Management**: List email accounts with optional domain filtering
- **Domain Information**: List all domains and subdomains in the account
- **Cron Job Management**: List, add, and delete cron jobs
- **System Monitoring**: Basic disk usage statistics
- **Backup Operations**: Create and list account backups
- **Authentication Support**: API token and username/password authentication
- **Configuration Management**: Environment variable configuration
- **Basic Error Handling**: Standard error handling and reporting
- **TypeScript Support**: Basic TypeScript implementation

### Security
- Secure authentication via API tokens
- HTTPS/SSL connections enforced by default
- Environment variable protection for credentials
- Basic input validation

### Documentation
- Basic README with installation and usage instructions
- Contributing guidelines for open source development
- MIT license for open source distribution
- Basic example configurations

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