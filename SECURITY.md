# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | ✅ Fully supported |
| 1.0.x   | ⚠️ Critical fixes only |
| < 1.0   | ❌ Not supported   |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in the cPanel MCP server, please report it responsibly.

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email security reports to: [Your security email here]
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 5 business days
- **Updates**: We will keep you informed of progress every 7 days
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days

### Security Measures

The cPanel MCP server implements several security measures:

#### Authentication Security
- **API Token Support**: Secure authentication using cPanel API tokens
- **Password Protection**: Secure password handling when API tokens are not available
- **Environment Variables**: Credentials stored securely in environment variables
- **No Credential Logging**: Sensitive information is never logged

#### Connection Security
- **HTTPS/SSL by Default**: All connections use SSL/TLS encryption
- **Certificate Validation**: SSL certificates are properly validated
- **Secure Headers**: Appropriate security headers are set
- **Connection Timeouts**: Prevents hanging connections

#### Input Validation
- **Parameter Validation**: All input parameters are validated before use
- **Type Checking**: TypeScript provides compile-time type safety
- **Schema Validation**: Custom validation schemas for complex operations
- **Sanitization**: Input is sanitized to prevent injection attacks

#### Error Handling
- **Secure Error Messages**: Error messages don't leak sensitive information
- **Proper Exception Handling**: All exceptions are caught and handled appropriately
- **Logging**: Security events are logged for audit purposes
- **Rate Limiting**: Protection against brute force attacks

## Best Practices for Users

### Secure Configuration
- Use API tokens instead of passwords when possible
- Store credentials in environment variables, never in code
- Use strong, unique passwords for cPanel accounts
- Enable two-factor authentication on cPanel accounts
- Regularly rotate API tokens and passwords

### Network Security
- Use HTTPS/SSL for all connections
- Implement proper firewall rules
- Restrict access to necessary IP addresses only
- Use VPN connections when accessing from public networks

### Monitoring
- Monitor logs for suspicious activity
- Set up alerts for failed authentication attempts
- Regularly review access logs
- Implement proper log retention policies

### Updates
- Keep the cPanel MCP server updated to the latest version
- Subscribe to security notifications
- Test updates in a staging environment first
- Have a rollback plan for updates

## Vulnerability Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1-2**: Acknowledgment sent to reporter
3. **Day 3-7**: Initial assessment and severity classification
4. **Day 8-21**: Develop and test fix
5. **Day 22-28**: Prepare security advisory and release
6. **Day 29-30**: Release security update and public disclosure

## Security Resources

- [cPanel Security Guide](https://docs.cpanel.net/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [TypeScript Security Guidelines](https://typescript-eslint.io/docs/linting/troubleshooting/performance-troubleshooting)

## Contact

For security-related questions or concerns:
- Security Email: [Your security email]
- General Issues: [GitHub Issues](https://github.com/ringo380/cpanel-mcp/issues)
- Documentation: [Project Wiki](https://github.com/ringo380/cpanel-mcp/wiki)

## Acknowledgments

We appreciate responsible disclosure of security vulnerabilities and will acknowledge security researchers who help improve the security of this project.