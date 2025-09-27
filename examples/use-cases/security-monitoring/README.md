# Security Monitoring with cPanel MCP

This directory contains examples for implementing security monitoring using the cPanel MCP server.

## Overview

Security monitoring helps you:
- Track unauthorized access attempts
- Monitor SSL certificate status
- Detect unusual resource usage patterns
- Audit file system changes
- Monitor email account security
- Track database access patterns

## Components

### 1. Real-time Monitoring (`realtime-monitor.js`)
- Continuous monitoring of security events
- Real-time alerts for suspicious activity
- Dashboard integration for live metrics

### 2. Security Audit (`security-audit.js`)
- Comprehensive security assessments
- SSL certificate validation
- File permission audits
- User account reviews

### 3. Alert System (`alert-system.js`)
- Multi-channel notification system
- Configurable alert thresholds
- Escalation procedures
- Alert deduplication

### 4. Compliance Reporting (`compliance-report.js`)
- Automated compliance reports
- Security policy validation
- Audit trail generation
- Regulatory compliance checks

## Features

### SSL Certificate Monitoring
- Certificate expiration alerts
- Certificate chain validation
- Weak cipher detection
- Certificate transparency monitoring

### Access Pattern Analysis
- Failed login attempt tracking
- Unusual access time detection
- Geographic access analysis
- Brute force attack detection

### File System Security
- Unauthorized file changes
- Permission modifications
- Malware signature detection
- Backup integrity verification

### Database Security
- Query pattern analysis
- Privilege escalation detection
- Data export monitoring
- Connection anomaly detection

### Email Security
- Spam pattern detection
- Phishing attempt monitoring
- Email account compromise detection
- DKIM/SPF validation

## Configuration

### Basic Setup
```javascript
const monitor = new SecurityMonitor({
  cpanel: {
    hostname: 'your-server.com',
    username: 'your_username',
    apiToken: 'your_api_token'
  },
  monitoring: {
    interval: 60000, // 1 minute
    alerts: {
      email: 'security@example.com',
      webhook: 'https://hooks.slack.com/...',
      phone: '+1234567890'
    }
  }
});
```

### Advanced Configuration
```javascript
const monitor = new SecurityMonitor({
  cpanel: {
    hostname: 'your-server.com',
    username: 'your_username',
    apiToken: 'your_api_token'
  },
  monitoring: {
    interval: 30000,
    components: {
      ssl: {
        enabled: true,
        expirationThreshold: 30, // days
        checkInterval: 3600000 // 1 hour
      },
      fileSystem: {
        enabled: true,
        watchPaths: ['/public_html', '/cgi-bin'],
        checkInterval: 300000 // 5 minutes
      },
      access: {
        enabled: true,
        failedLoginThreshold: 5,
        timeWindow: 300000 // 5 minutes
      },
      database: {
        enabled: true,
        slowQueryThreshold: 5000, // ms
        connectionThreshold: 100
      }
    }
  },
  alerts: {
    channels: ['email', 'slack', 'webhook'],
    thresholds: {
      critical: 0,    // Immediate
      warning: 300,   // 5 minutes
      info: 3600      // 1 hour
    },
    escalation: {
      enabled: true,
      levels: [
        { delay: 0, channels: ['email'] },
        { delay: 300, channels: ['email', 'slack'] },
        { delay: 900, channels: ['email', 'slack', 'phone'] }
      ]
    }
  }
});
```

## Usage Examples

### Monitor SSL Certificates
```javascript
// Check all SSL certificates
const certificates = await monitor.checkSSLCertificates();

// Get expiring certificates
const expiring = certificates.filter(cert =>
  cert.daysUntilExpiration < 30
);

// Send alerts for expiring certificates
for (const cert of expiring) {
  await monitor.sendAlert('warning',
    `SSL certificate for ${cert.domain} expires in ${cert.daysUntilExpiration} days`
  );
}
```

### Monitor Failed Login Attempts
```javascript
// Get recent failed login attempts
const failedLogins = await monitor.getFailedLogins({
  timeWindow: 3600000, // Last hour
  threshold: 5
});

// Check for brute force patterns
const bruteForceAttempts = monitor.detectBruteForce(failedLogins);

if (bruteForceAttempts.length > 0) {
  await monitor.sendAlert('critical',
    `Brute force attack detected from ${bruteForceAttempts.length} IPs`
  );
}
```

### Audit File Permissions
```javascript
// Audit critical file permissions
const auditResults = await monitor.auditFilePermissions([
  '/public_html/.htaccess',
  '/public_html/wp-config.php',
  '/cgi-bin'
]);

// Check for world-writable files
const vulnerableFiles = auditResults.filter(file =>
  file.permissions.includes('w') && file.permissions.endsWith('w')
);

if (vulnerableFiles.length > 0) {
  await monitor.sendAlert('warning',
    `Found ${vulnerableFiles.length} world-writable files`
  );
}
```

### Database Security Monitoring
```javascript
// Monitor database connections
const dbConnections = await monitor.getDatabaseConnections();

// Check for unusual connection patterns
const suspiciousConnections = dbConnections.filter(conn =>
  conn.queries > 1000 || conn.connectionTime > 3600000
);

// Monitor slow queries
const slowQueries = await monitor.getSlowQueries({
  threshold: 5000, // 5 seconds
  limit: 10
});

if (slowQueries.length > 0) {
  await monitor.sendAlert('info',
    `Found ${slowQueries.length} slow database queries`
  );
}
```

## Alert Types

### Critical Alerts
- Brute force attacks
- Malware detection
- Unauthorized administrative access
- Critical SSL certificate issues
- Data breach indicators

### Warning Alerts
- Unusual access patterns
- SSL certificates expiring soon
- High resource usage
- Failed backup operations
- Permission changes

### Info Alerts
- Successful security scans
- Certificate renewals
- Routine maintenance events
- Performance metrics
- System updates

## Integration Examples

### Slack Integration
```javascript
const slackNotifier = {
  webhook: 'https://hooks.slack.com/services/...',
  channel: '#security-alerts',
  username: 'cPanel Security Monitor'
};

monitor.addNotificationChannel('slack', slackNotifier);
```

### Email Integration
```javascript
const emailNotifier = {
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'alerts@example.com',
      pass: 'app_password'
    }
  },
  from: 'cPanel Security <alerts@example.com>',
  to: ['security@example.com', 'admin@example.com']
};

monitor.addNotificationChannel('email', emailNotifier);
```

### Webhook Integration
```javascript
const webhookNotifier = {
  url: 'https://api.example.com/security-alerts',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_api_token',
    'Content-Type': 'application/json'
  }
};

monitor.addNotificationChannel('webhook', webhookNotifier);
```

## Best Practices

### 1. Monitoring Strategy
- Start with basic monitoring and gradually add complexity
- Focus on high-impact security events first
- Regularly review and tune alert thresholds
- Implement proper alert fatigue management

### 2. Alert Management
- Use different notification channels for different severity levels
- Implement alert deduplication to avoid spam
- Set up proper escalation procedures
- Maintain an incident response playbook

### 3. Data Retention
- Store security logs for compliance requirements
- Implement log rotation and archival
- Ensure secure storage of sensitive monitoring data
- Regular backup of monitoring configurations

### 4. Performance Considerations
- Optimize monitoring intervals based on resource impact
- Use efficient querying patterns
- Implement proper caching for frequently accessed data
- Monitor the monitoring system itself

## Compliance Features

### SOC 2 Compliance
- Continuous monitoring requirements
- Access control documentation
- Change management tracking
- Incident response procedures

### PCI DSS Compliance
- Cardholder data environment monitoring
- Network security monitoring
- Access control monitoring
- Vulnerability management

### GDPR Compliance
- Data access monitoring
- Data breach detection
- Privacy impact assessment
- Data retention compliance

### HIPAA Compliance
- PHI access monitoring
- Audit trail requirements
- Risk assessment procedures
- Incident notification requirements

## Troubleshooting

### High False Positive Rate
1. Review and adjust alert thresholds
2. Implement time-based filtering
3. Add contextual analysis
4. Use machine learning for pattern recognition

### Missing Security Events
1. Verify monitoring coverage
2. Check log collection completeness
3. Review detection rules
4. Validate data sources

### Performance Issues
1. Optimize monitoring queries
2. Implement proper indexing
3. Use sampling for high-volume events
4. Consider distributed monitoring

### Integration Problems
1. Verify API credentials and permissions
2. Check network connectivity
3. Validate notification channel configurations
4. Test alert delivery mechanisms