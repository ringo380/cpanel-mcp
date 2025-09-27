# Production Deployment Guide

This guide covers deploying the cPanel MCP server in production environments with proper security, monitoring, and scalability considerations.

## Table of Contents

- [Infrastructure Requirements](#infrastructure-requirements)
- [Security Configuration](#security-configuration)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Backup and Recovery](#backup-and-recovery)
- [Performance Tuning](#performance-tuning)
- [Troubleshooting](#troubleshooting)

## Infrastructure Requirements

### Minimum System Requirements

```yaml
Production Environment:
  CPU: 2 cores minimum, 4 cores recommended
  RAM: 4GB minimum, 8GB recommended
  Storage: 50GB SSD minimum
  Network: 1Gbps connection recommended
  OS: Ubuntu 20.04 LTS, CentOS 8, or RHEL 8+

Development Environment:
  CPU: 1 core minimum
  RAM: 2GB minimum
  Storage: 20GB
  Network: 100Mbps sufficient
```

### Network Configuration

```bash
# Required outbound connections
# cPanel API (typically port 2083 HTTPS)
curl -I https://your-cpanel-server.com:2083

# Optional: External monitoring services
# Prometheus metrics endpoint (port 9090)
# Health check endpoints (port 3000)

# Firewall rules (iptables example)
iptables -A OUTPUT -p tcp --dport 2083 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 80 -j ACCEPT
```

## Security Configuration

### Environment Variables Security

```bash
# Use a secure secrets management system
# Examples: HashiCorp Vault, AWS Secrets Manager, Kubernetes Secrets

# .env.production (never commit this file)
CPANEL_HOSTNAME=your-panel.domain.com
CPANEL_USERNAME=api_user
CPANEL_API_TOKEN=${SECRET_MANAGER_TOKEN}
LOG_LEVEL=INFO
NODE_ENV=production

# Rotate API tokens regularly
CPANEL_TOKEN_ROTATION_DAYS=30
```

### API Token Security

```bash
#!/bin/bash
# api-token-rotation.sh
# Script to rotate cPanel API tokens

CURRENT_TOKEN=${CPANEL_API_TOKEN}
NEW_TOKEN=$(generate_new_cpanel_token.sh)

# Test new token
if test_cpanel_connection.sh ${NEW_TOKEN}; then
    echo "New token validated, updating configuration..."
    update_secret_manager.sh "CPANEL_API_TOKEN" "${NEW_TOKEN}"
    restart_application.sh

    # Revoke old token after grace period
    sleep 300  # 5 minute grace period
    revoke_cpanel_token.sh ${CURRENT_TOKEN}
else
    echo "New token validation failed, keeping current token"
    exit 1
fi
```

### Network Security

```yaml
# nginx reverse proxy configuration
server {
    listen 443 ssl http2;
    server_name cpanel-mcp.yourdomain.com;

    ssl_certificate /etc/ssl/certs/cpanel-mcp.crt;
    ssl_certificate_key /etc/ssl/private/cpanel-mcp.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # IP whitelist (optional)
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

## Docker Deployment

### Production Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cpanel -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Set ownership
RUN chown -R cpanel:nodejs /app

# Switch to non-root user
USER cpanel

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Environment
ENV NODE_ENV=production
ENV LOG_LEVEL=INFO

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  cpanel-mcp:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=INFO
      - CPANEL_HOSTNAME=${CPANEL_HOSTNAME}
      - CPANEL_USERNAME=${CPANEL_USERNAME}
      - CPANEL_API_TOKEN=${CPANEL_API_TOKEN}
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - logs:/app/logs
      - ./config:/app/config:ro
    networks:
      - cpanel-network
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/ssl:ro
      - logs:/var/log/nginx
    networks:
      - cpanel-network
    depends_on:
      - cpanel-mcp

  log-aggregator:
    image: fluent/fluent-bit:latest
    restart: unless-stopped
    volumes:
      - logs:/logs:ro
      - ./fluent-bit/fluent-bit.conf:/fluent-bit/etc/fluent-bit.conf:ro
    networks:
      - cpanel-network

volumes:
  logs:
    driver: local

networks:
  cpanel-network:
    driver: bridge
```

### Build and Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -euo pipefail

# Configuration
IMAGE_NAME="cpanel-mcp"
CONTAINER_NAME="cpanel-mcp-prod"
BACKUP_DIR="/opt/backups/cpanel-mcp"
LOG_FILE="/var/log/cpanel-mcp-deploy.log"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "${LOG_FILE}"
}

# Pre-deployment checks
check_prerequisites() {
    log "Running pre-deployment checks..."

    # Check if required environment variables are set
    if [[ -z "${CPANEL_HOSTNAME:-}" || -z "${CPANEL_USERNAME:-}" || -z "${CPANEL_API_TOKEN:-}" ]]; then
        log "ERROR: Required environment variables not set"
        exit 1
    fi

    # Test cPanel connectivity
    if ! curl -sf "https://${CPANEL_HOSTNAME}:2083" > /dev/null; then
        log "WARNING: Cannot reach cPanel server"
    fi

    # Check available disk space
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [[ ${AVAILABLE_SPACE} -lt 1048576 ]]; then  # Less than 1GB
        log "WARNING: Low disk space available"
    fi

    log "Pre-deployment checks completed"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."

    mkdir -p "${BACKUP_DIR}/$(date +%Y%m%d_%H%M%S)"
    BACKUP_PATH="${BACKUP_DIR}/$(date +%Y%m%d_%H%M%S)"

    # Backup configuration
    if [[ -f ".env.production" ]]; then
        cp .env.production "${BACKUP_PATH}/"
    fi

    # Backup current image
    if docker image inspect "${IMAGE_NAME}:current" > /dev/null 2>&1; then
        docker save "${IMAGE_NAME}:current" | gzip > "${BACKUP_PATH}/image.tar.gz"
    fi

    log "Backup created at ${BACKUP_PATH}"
}

# Build new image
build_image() {
    log "Building new Docker image..."

    # Build with build args for caching
    docker build \
        --target production \
        --tag "${IMAGE_NAME}:latest" \
        --tag "${IMAGE_NAME}:$(date +%Y%m%d_%H%M%S)" \
        --build-arg NODE_ENV=production \
        .

    log "Docker image built successfully"
}

# Deploy new version
deploy() {
    log "Deploying new version..."

    # Tag current as previous
    if docker image inspect "${IMAGE_NAME}:current" > /dev/null 2>&1; then
        docker tag "${IMAGE_NAME}:current" "${IMAGE_NAME}:previous"
    fi

    # Tag latest as current
    docker tag "${IMAGE_NAME}:latest" "${IMAGE_NAME}:current"

    # Stop existing container gracefully
    if docker ps -q -f name="${CONTAINER_NAME}" | grep -q .; then
        log "Stopping existing container..."
        docker stop "${CONTAINER_NAME}" || true
        docker rm "${CONTAINER_NAME}" || true
    fi

    # Start new container
    docker-compose -f docker-compose.prod.yml up -d

    log "New version deployed"
}

# Health check
health_check() {
    log "Performing health checks..."

    local max_attempts=30
    local attempt=1

    while [[ ${attempt} -le ${max_attempts} ]]; do
        if curl -sf http://localhost:3000/health > /dev/null; then
            log "Health check passed"
            return 0
        fi

        log "Health check attempt ${attempt}/${max_attempts} failed, retrying..."
        sleep 10
        ((attempt++))
    done

    log "ERROR: Health checks failed"
    return 1
}

# Rollback function
rollback() {
    log "Rolling back to previous version..."

    if docker image inspect "${IMAGE_NAME}:previous" > /dev/null 2>&1; then
        docker stop "${CONTAINER_NAME}" || true
        docker rm "${CONTAINER_NAME}" || true

        docker tag "${IMAGE_NAME}:previous" "${IMAGE_NAME}:current"
        docker-compose -f docker-compose.prod.yml up -d

        log "Rollback completed"
    else
        log "ERROR: No previous version available for rollback"
        exit 1
    fi
}

# Cleanup old images
cleanup() {
    log "Cleaning up old images..."

    # Remove images older than 7 days
    docker image prune -a --filter "until=168h" -f

    # Remove old backups (keep last 5)
    if [[ -d "${BACKUP_DIR}" ]]; then
        ls -1t "${BACKUP_DIR}" | tail -n +6 | xargs -I {} rm -rf "${BACKUP_DIR}/{}"
    fi

    log "Cleanup completed"
}

# Main deployment flow
main() {
    log "Starting deployment process..."

    check_prerequisites
    backup_current
    build_image
    deploy

    if health_check; then
        cleanup
        log "Deployment completed successfully"
    else
        rollback
        exit 1
    fi
}

# Handle interruption
trap 'log "Deployment interrupted"; exit 1' INT TERM

# Run deployment
main "$@"
```

## Kubernetes Deployment

### Kubernetes Manifests

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: cpanel-mcp
  labels:
    app.kubernetes.io/name: cpanel-mcp
---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: cpanel-credentials
  namespace: cpanel-mcp
type: Opaque
stringData:
  hostname: your-cpanel-server.com
  username: api_user
  api-token: your-secure-api-token
---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cpanel-config
  namespace: cpanel-mcp
data:
  log-level: "INFO"
  port: "3000"
  ssl: "true"
  retry-max-attempts: "3"
  retry-base-delay: "1000"
---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cpanel-mcp
  namespace: cpanel-mcp
  labels:
    app.kubernetes.io/name: cpanel-mcp
    app.kubernetes.io/version: "1.0.0"
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app.kubernetes.io/name: cpanel-mcp
  template:
    metadata:
      labels:
        app.kubernetes.io/name: cpanel-mcp
    spec:
      serviceAccountName: cpanel-mcp
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001
      containers:
      - name: cpanel-mcp
        image: cpanel-mcp:latest
        ports:
        - containerPort: 3000
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: cpanel-config
              key: log-level
        - name: CPANEL_HOSTNAME
          valueFrom:
            secretKeyRef:
              name: cpanel-credentials
              key: hostname
        - name: CPANEL_USERNAME
          valueFrom:
            secretKeyRef:
              name: cpanel-credentials
              key: username
        - name: CPANEL_API_TOKEN
          valueFrom:
            secretKeyRef:
              name: cpanel-credentials
              key: api-token
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: tmp
        emptyDir: {}
      - name: logs
        emptyDir: {}
      terminationGracePeriodSeconds: 30
---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: cpanel-mcp-service
  namespace: cpanel-mcp
  labels:
    app.kubernetes.io/name: cpanel-mcp
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app.kubernetes.io/name: cpanel-mcp
---
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cpanel-mcp-hpa
  namespace: cpanel-mcp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cpanel-mcp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
---
# k8s/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: cpanel-mcp-pdb
  namespace: cpanel-mcp
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: cpanel-mcp
```

### Kubernetes Deployment Script

```bash
#!/bin/bash
# k8s-deploy.sh

set -euo pipefail

NAMESPACE="cpanel-mcp"
IMAGE_NAME="cpanel-mcp"
IMAGE_TAG="${1:-latest}"

# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml

# Build and push image (if using registry)
if [[ "${PUSH_TO_REGISTRY:-false}" == "true" ]]; then
    docker build -t "${REGISTRY_URL}/${IMAGE_NAME}:${IMAGE_TAG}" .
    docker push "${REGISTRY_URL}/${IMAGE_NAME}:${IMAGE_TAG}"
fi

# Update image in deployment
kubectl set image deployment/cpanel-mcp cpanel-mcp="${IMAGE_NAME}:${IMAGE_TAG}" -n ${NAMESPACE}

# Apply remaining configurations
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/pdb.yaml

# Wait for rollout
kubectl rollout status deployment/cpanel-mcp -n ${NAMESPACE} --timeout=300s

# Verify deployment
kubectl get pods -n ${NAMESPACE}
kubectl get svc -n ${NAMESPACE}

echo "Deployment completed successfully!"
```

## Monitoring and Alerting

### Prometheus Metrics

```typescript
// metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

export const metrics = {
  httpRequests: new Counter({
    name: 'cpanel_mcp_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  }),

  apiCalls: new Counter({
    name: 'cpanel_api_calls_total',
    help: 'Total number of cPanel API calls',
    labelNames: ['module', 'function', 'status']
  }),

  apiDuration: new Histogram({
    name: 'cpanel_api_duration_seconds',
    help: 'Duration of cPanel API calls',
    labelNames: ['module', 'function'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),

  activeConnections: new Gauge({
    name: 'cpanel_mcp_active_connections',
    help: 'Number of active connections'
  }),

  retryAttempts: new Counter({
    name: 'cpanel_mcp_retry_attempts_total',
    help: 'Total number of retry attempts',
    labelNames: ['operation', 'attempt']
  })
};

// Register all metrics
register.registerMetric(metrics.httpRequests);
register.registerMetric(metrics.apiCalls);
register.registerMetric(metrics.apiDuration);
register.registerMetric(metrics.activeConnections);
register.registerMetric(metrics.retryAttempts);
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "cPanel MCP Server",
    "panels": [
      {
        "title": "API Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(cpanel_api_calls_total[5m])",
            "legendFormat": "{{module}}.{{function}}"
          }
        ]
      },
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(cpanel_api_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(cpanel_api_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(cpanel_api_calls_total{status=\"error\"}[5m]) / rate(cpanel_api_calls_total[5m]) * 100"
          }
        ]
      }
    ]
  }
}
```

This production deployment guide provides comprehensive coverage of deploying the cPanel MCP server in enterprise environments with proper security, scalability, and monitoring configurations.