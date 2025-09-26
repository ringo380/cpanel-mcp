# Usage Examples

This document provides practical examples of using the cPanel MCP Server with various AI assistants and automation tools.

## Claude Desktop Integration

### Configuration

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "cpanel": {
      "command": "node",
      "args": ["/path/to/cpanel-mcp/dist/index.js"],
      "env": {
        "CPANEL_HOSTNAME": "your-hostname.com",
        "CPANEL_USERNAME": "your-username",
        "CPANEL_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Example Conversations

#### Setting Up a New Website

**User**: "I need to set up a new website for my project. Can you help me create a database called 'myproject_db' and an email account 'admin@myproject.com'?"

**Claude**: I'll help you set up your new website by creating the database and email account.

*Uses `create_database` tool*:
```json
{
  "name": "create_database",
  "arguments": {
    "name": "myproject_db"
  }
}
```

*Uses `create_email_account` tool*:
```json
{
  "name": "create_email_account",
  "arguments": {
    "email": "admin@myproject.com",
    "password": "SecurePassword123!",
    "quota": 1000
  }
}
```

#### Managing Cron Jobs

**User**: "Set up a daily backup script that runs at 2 AM every night"

**Claude**: I'll create a cron job for your daily backup.

*Uses `add_cron_job` tool*:
```json
{
  "name": "add_cron_job",
  "arguments": {
    "minute": "0",
    "hour": "2",
    "day": "*",
    "month": "*",
    "weekday": "*",
    "command": "/home/username/scripts/daily_backup.sh"
  }
}
```

#### Monitoring Resources

**User**: "Check how much disk space I'm using and list my current databases"

**Claude**: Let me check your current resource usage and databases.

*Uses `get_disk_usage` and `list_databases` tools*

## Command Line Usage

### Basic Server Start

```bash
# Set environment variables
export CPANEL_HOSTNAME="your-hostname.com"
export CPANEL_USERNAME="your-username"
export CPANEL_API_TOKEN="your-token"

# Start the server
npm start
```

### Docker Usage

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

ENV CPANEL_HOSTNAME=""
ENV CPANEL_USERNAME=""
ENV CPANEL_API_TOKEN=""

CMD ["npm", "start"]
```

```bash
docker build -t cpanel-mcp .
docker run -e CPANEL_HOSTNAME="your-host.com" \
           -e CPANEL_USERNAME="username" \
           -e CPANEL_API_TOKEN="token" \
           cpanel-mcp
```

## Programming Integration

### TypeScript Client Example

```typescript
import { spawn } from 'child_process';

class CpanelMCPClient {
  private process: any;

  constructor(config: {
    hostname: string;
    username: string;
    apiToken: string;
  }) {
    this.process = spawn('node', ['dist/index.js'], {
      env: {
        ...process.env,
        CPANEL_HOSTNAME: config.hostname,
        CPANEL_USERNAME: config.username,
        CPANEL_API_TOKEN: config.apiToken
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
  }

  async callTool(name: string, arguments: any): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name,
        arguments
      }
    };

    return new Promise((resolve, reject) => {
      this.process.stdin.write(JSON.stringify(request) + '\n');

      this.process.stdout.once('data', (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          resolve(response.result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async createWebsiteSetup(projectName: string, domain: string) {
    // Create database
    await this.callTool('create_database', {
      name: `${projectName}_db`
    });

    // Create admin email
    await this.callTool('create_email_account', {
      email: `admin@${domain}`,
      password: 'TempPassword123!',
      quota: 500
    });

    // Set up daily backup
    await this.callTool('add_cron_job', {
      minute: '0',
      hour: '3',
      day: '*',
      month: '*',
      weekday: '*',
      command: `/home/backup_${projectName}.sh`
    });

    return { success: true, message: 'Website setup complete' };
  }
}
```

### Python Integration Example

```python
import subprocess
import json
from typing import Dict, Any

class CpanelMCPClient:
    def __init__(self, hostname: str, username: str, api_token: str):
        env = {
            'CPANEL_HOSTNAME': hostname,
            'CPANEL_USERNAME': username,
            'CPANEL_API_TOKEN': api_token
        }

        self.process = subprocess.Popen(
            ['node', 'dist/index.js'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            text=True
        )

    def call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        request = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'tools/call',
            'params': {
                'name': name,
                'arguments': arguments
            }
        }

        self.process.stdin.write(json.dumps(request) + '\n')
        self.process.stdin.flush()

        response = self.process.stdout.readline()
        return json.loads(response)

    def get_account_summary(self) -> Dict[str, Any]:
        """Get a complete account summary"""
        summary = {}

        # Get disk usage
        disk_usage = self.call_tool('get_disk_usage', {})
        summary['disk_usage'] = disk_usage

        # Get databases
        databases = self.call_tool('list_databases', {})
        summary['databases'] = databases

        # Get email accounts
        emails = self.call_tool('list_email_accounts', {})
        summary['email_accounts'] = emails

        # Get domains
        domains = self.call_tool('list_domains', {})
        summary['domains'] = domains

        return summary

# Usage
client = CpanelMCPClient(
    hostname='your-host.com',
    username='your-username',
    api_token='your-token'
)

summary = client.get_account_summary()
print(json.dumps(summary, indent=2))
```

## Automation Scripts

### Daily Maintenance Script

```bash
#!/bin/bash

# daily_maintenance.sh - Automated daily cPanel maintenance

# Set environment
export CPANEL_HOSTNAME="your-host.com"
export CPANEL_USERNAME="your-username"
export CPANEL_API_TOKEN="your-token"

# Start MCP server in background
node dist/index.js &
MCP_PID=$!

# Wait for server to start
sleep 2

# Function to call MCP tools
call_tool() {
    local tool_name="$1"
    local args="$2"

    echo "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"$tool_name\",\"arguments\":$args}}" | \
    nc localhost 8080  # Adjust if using different transport
}

# Get disk usage report
echo "Checking disk usage..."
call_tool "get_disk_usage" "{}"

# List databases for backup verification
echo "Listing databases..."
call_tool "list_databases" "{}"

# Create daily backup
echo "Creating backup..."
call_tool "create_backup" "{}"

# Cleanup
kill $MCP_PID

echo "Daily maintenance complete"
```

## Common Use Cases

### 1. Website Migration Setup

```typescript
async function setupMigrationEnvironment(domains: string[]) {
  for (const domain of domains) {
    // Create database for each domain
    await callTool('create_database', {
      name: domain.replace(/\./g, '_') + '_db'
    });

    // Create admin email
    await callTool('create_email_account', {
      email: `admin@${domain}`,
      password: generateSecurePassword(),
      quota: 1000
    });
  }
}
```

### 2. Bulk Email Account Creation

```typescript
async function createTeamEmails(domain: string, teamMembers: string[]) {
  for (const member of teamMembers) {
    await callTool('create_email_account', {
      email: `${member}@${domain}`,
      password: generateTempPassword(),
      quota: 500
    });
  }
}
```

### 3. Automated Cleanup Tasks

```typescript
async function cleanupOldResources() {
  // Get current databases
  const databases = await callTool('list_databases', {});

  // Get current emails
  const emails = await callTool('list_email_accounts', {});

  // Remove old test databases
  for (const db of databases) {
    if (db.name.includes('_test_') && isOlderThan30Days(db.created)) {
      await callTool('delete_database', { name: db.name });
    }
  }
}
```

## Error Handling Examples

### Robust Error Handling

```typescript
async function safeCreateDatabase(name: string) {
  try {
    const result = await callTool('create_database', { name });
    console.log(`Database ${name} created successfully`);
    return result;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`Database ${name} already exists, skipping`);
      return null;
    } else if (error.message.includes('quota exceeded')) {
      console.error('Database quota exceeded, cannot create new database');
      throw new Error('Database quota exceeded');
    } else {
      console.error(`Failed to create database ${name}:`, error.message);
      throw error;
    }
  }
}
```

## Performance Tips

1. **Batch Operations**: Group multiple operations when possible
2. **Connection Reuse**: Keep the MCP server running for multiple operations
3. **Error Recovery**: Implement retry logic for transient failures
4. **Resource Monitoring**: Regularly check quotas and limits

## Security Best Practices

1. **Use API Tokens**: Prefer API tokens over passwords
2. **Environment Variables**: Store credentials in environment variables
3. **Least Privilege**: Use tokens with minimal required permissions
4. **Regular Rotation**: Rotate API tokens periodically
5. **Secure Transport**: Always use HTTPS connections