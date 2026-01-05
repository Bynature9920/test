# Deployment Guide

## Production Deployment

### Prerequisites

- Docker and Docker Compose installed
- Domain name configured
- SSL certificates (Let's Encrypt recommended)
- Production database credentials
- External API credentials

## Docker Deployment

### 1. Build Docker Images

```bash
# Build backend services
docker-compose -f docker-compose.prod.yml build

# Or build individually
docker build -t fintech-api-gateway ./backend/api-gateway
docker build -t fintech-auth-service ./backend/services/auth
# ... etc for each service
```

### 2. Configure Environment

Create `.env.production` with production values:

```bash
APP_ENV=production
DEBUG=False
DATABASE_URL=mysql+pymysql://user:password@mysql:3306/fintech_db
JWT_SECRET_KEY=<strong-random-secret>
# ... other production configs
```

### 3. Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Run Migrations

```bash
docker-compose -f docker-compose.prod.yml exec api-gateway python scripts/migrate.py
```

## Server Deployment

### Using PM2 (Node.js Process Manager)

1. Install PM2:
```bash
npm install -g pm2
```

2. Create ecosystem file:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: 'python',
      args: '-m api_gateway.main',
      cwd: '/path/to/backend',
      interpreter: '/path/to/venv/bin/python',
    },
    // ... other services
  ]
}
```

3. Start services:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Database Setup

### Production Database

1. Use managed database service (AWS RDS, Google Cloud SQL, etc.)
2. Enable automated backups
3. Set up read replicas for scaling
4. Configure connection pooling

### Migration Strategy

```bash
# Create migration
python scripts/create_initial_migration.py "Migration description"

# Review migration file
# Apply to production (with backup first!)
python scripts/migrate.py
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS only
- [ ] Set up firewall rules
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts
- [ ] Regular security audits
- [ ] Database encryption at rest
- [ ] Secure API keys storage
- [ ] Enable 2FA for admin accounts

## Monitoring

### Application Monitoring

- Use services like:
  - **Sentry** for error tracking
  - **Datadog** or **New Relic** for APM
  - **Prometheus** + **Grafana** for metrics

### Logging

- Centralized logging with ELK stack or similar
- Log rotation and retention policies
- Structured logging (JSON format)

## Scaling

### Horizontal Scaling

- Use load balancer (nginx, HAProxy)
- Multiple instances of each service
- Database read replicas
- Redis cluster for caching

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Add caching layers
- Use CDN for static assets

## Backup Strategy

1. **Database Backups:**
   - Daily automated backups
   - Point-in-time recovery
   - Off-site backup storage

2. **Application Backups:**
   - Configuration files
   - Environment variables (encrypted)
   - SSL certificates

## Disaster Recovery

1. Document recovery procedures
2. Test backup restoration regularly
3. Maintain off-site backups
4. Define RTO and RPO targets

## Performance Optimization

- Database indexing
- Query optimization
- Caching frequently accessed data
- CDN for static assets
- Connection pooling
- Async processing for heavy operations

