# Integration Tests

This directory contains integration tests that run against real cPanel instances. These tests are designed to verify that the cPanel MCP client works correctly with actual cPanel servers.

## Setup

Integration tests require a real cPanel environment to test against. They are automatically skipped if the required environment variables are not provided.

### Environment Variables

Set the following environment variables to enable integration tests:

**Required:**
- `CPANEL_TEST_HOSTNAME` - The hostname of your cPanel server (e.g., `example.com`)
- `CPANEL_TEST_USERNAME` - Your cPanel username

**Authentication (choose one):**
- `CPANEL_TEST_API_TOKEN` - Your cPanel API token (recommended)
- `CPANEL_TEST_PASSWORD` - Your cPanel password (less secure)

**Optional:**
- `CPANEL_TEST_SSL` - Set to `false` to disable SSL (default: `true`)
- `CPANEL_TEST_PORT` - Custom port number (default: 2083 for SSL, 2082 for non-SSL)

### Example Configuration

Create a `.env.integration` file in the project root:

```bash
# cPanel Integration Test Configuration
CPANEL_TEST_HOSTNAME=your-server.example.com
CPANEL_TEST_USERNAME=your_username
CPANEL_TEST_API_TOKEN=your_api_token_here
CPANEL_TEST_SSL=true
CPANEL_TEST_PORT=2083
```

## Running Integration Tests

### Run All Tests (including integration)
```bash
npm test
```

### Run Only Integration Tests
```bash
npm test -- --testPathPattern=integration
```

### Run Only Unit Tests (skip integration)
```bash
npm test -- --testPathIgnorePatterns=integration
```

### Run Integration Tests with Environment File
```bash
# Load environment variables and run tests
export $(cat .env.integration | xargs) && npm test -- --testPathPattern=integration
```

## Test Categories

### Authentication Tests
- API token authentication
- Password authentication
- Invalid credential handling

### File Management Tests
- Directory listing
- File operations
- Permission handling

### Database Tests
- Database listing
- Database creation/deletion
- Database user management

### Email Tests
- Email account listing
- Email quota management
- Domain validation

### SSL Certificate Tests
- Certificate listing
- Certificate information retrieval
- SSL host management

### DNS Management Tests
- DNS zone listing
- DNS record parsing
- Domain information

### System Information Tests
- Account information
- Disk usage
- cPanel version information

### Error Handling Tests
- Invalid API calls
- Network timeout handling
- Rate limiting

### Performance Tests
- Concurrent request handling
- Response time validation
- Load testing

## Safety Considerations

⚠️ **Important:** Integration tests may create and delete test resources on your cPanel account:

- Test databases (automatically cleaned up)
- Temporary files (in designated test directories)
- Test email accounts (if configured)

**Recommendations:**
1. Use a dedicated test cPanel account or subdomain
2. Never run integration tests on production accounts
3. Review test code before running on important accounts
4. Monitor your account during test runs
5. Keep backups of important data

## Test Database Naming

Integration tests create temporary databases with names like:
- `test_db_1640995200000` (timestamp-based)

These are automatically cleaned up after tests complete.

## Troubleshooting

### Tests Are Skipped
- Verify all required environment variables are set
- Check that your cPanel credentials are valid
- Ensure the cPanel server is accessible from your network

### Authentication Failures
- Verify your API token or password is correct
- Check that the username matches your cPanel account
- Ensure the hostname is correct (without protocol prefixes)

### Network Errors
- Check firewall settings
- Verify the cPanel server allows connections on the specified port
- Test connectivity with a simple ping or curl command

### API Errors
- Some tests may fail if certain cPanel features are disabled
- Check your cPanel account permissions and quotas
- Review cPanel error logs for additional details

## Adding New Integration Tests

When adding new integration tests:

1. Always check `shouldSkip` condition first
2. Include descriptive console.log messages for skipped tests
3. Clean up any resources created during tests
4. Use realistic timeouts for network operations
5. Handle expected errors gracefully
6. Add appropriate test categories and descriptions

Example test structure:
```typescript
it('should perform some operation', async () => {
  if (shouldSkip) {
    console.log('Skipping test - no test environment configured');
    return;
  }

  // Test implementation here
  const result = await client.someOperation();
  expect(result).toBeDefined();
});
```