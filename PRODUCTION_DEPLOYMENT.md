# Jewelry Inventory Management - Production Deployment Guide

## Server Requirements

### Minimum System Requirements
- **CPU**: 2 vCPU cores
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04 LTS or higher, CentOS 8+, or RHEL 8+
- **Network**: Static IP address, ports 80/443 open

### Recommended System Requirements
- **CPU**: 4 vCPU cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Backup**: Automated database backups
- **CDN**: Cloudflare or similar for static assets

## 🔒 PRODUCTION VERSION LOCK (MANDATORY)

| Component | EXACT Version Required | Lock Command |
|-----------|----------------------|--------------|
| **Node.js** | `22.17.0` | `sudo apt-mark hold nodejs` |
| **npm** | `10.9.2` | (comes with Node.js) |
| **PostgreSQL** | `17.5` | `sudo apt-mark hold postgresql-17` |
| **PM2** | `5.3.0` | `npm install -g pm2@5.3.0` |
| **Nginx** | `1.18.0` | `sudo apt-mark hold nginx` |
| **Certbot** | `1.21.0` | `sudo apt-mark hold certbot` |
| **Ubuntu** | `20.04 LTS` or `22.04 LTS` | System requirement |

**⚠️ PRODUCTION CRITICAL: All versions must be locked to prevent automatic updates that could break the system.**

## Initial Server Setup

### 1. Update System & Install Base Packages

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install build essentials
sudo apt install -y build-essential

# Create application user
sudo useradd -m -s /bin/bash jewelry-app
sudo usermod -aG sudo jewelry-app
```

### 2. Install Node.js 22.17.0 (EXACT VERSION)

```bash
# Install Node.js 22.17.0 via NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs=22.17.0*

# Lock the version to prevent updates
sudo apt-mark hold nodejs

# Verify EXACT installation
node --version  # MUST be v22.17.0
npm --version   # MUST be 10.9.2

# Install PM2 process manager globally (EXACT VERSION)
sudo npm install -g pm2@5.3.0
```

### 3. Install PostgreSQL 17.5 (EXACT VERSION)

```bash
# Add PostgreSQL official repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install PostgreSQL 17.5 (EXACT VERSION)
sudo apt install -y postgresql-17=17.5* postgresql-client-17=17.5* postgresql-contrib-17=17.5*

# Lock PostgreSQL version to prevent updates
sudo apt-mark hold postgresql-17 postgresql-client-17 postgresql-contrib-17

# Verify EXACT version
psql --version  # MUST be psql (PostgreSQL) 17.5

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Secure PostgreSQL installation
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your-secure-postgres-password';"
```

### 4. Install Nginx 1.18.0 (EXACT VERSION)

```bash
# Install specific Nginx version
sudo apt install -y nginx=1.18.0*

# Lock Nginx version
sudo apt-mark hold nginx

# Verify exact version
nginx -v  # MUST be nginx version: nginx/1.18.0

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### 5. Install SSL Certificate (Let's Encrypt) - EXACT VERSIONS

```bash
# Install Certbot with exact versions
sudo apt install -y certbot=1.21.0* python3-certbot-nginx=1.21.0*

# Lock Certbot version
sudo apt-mark hold certbot python3-certbot-nginx

# Verify version
certbot --version  # MUST be certbot 1.21.0

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## Application Deployment

### 1. Setup Application Directory

```bash
# Switch to application user
sudo su - jewelry-app

# Create application directory
mkdir -p /home/jewelry-app/jewelry-inventory
cd /home/jewelry-app/jewelry-inventory

# Clone repository
git clone <your-repo-url> .

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Database Setup

```bash
# Switch to postgres user and create database
sudo -u postgres createdb jewelry_inventory

# Create application database user
sudo -u postgres psql << EOF
CREATE USER jewelry_user WITH PASSWORD 'your-secure-db-password';
GRANT ALL PRIVILEGES ON DATABASE jewelry_inventory TO jewelry_user;
ALTER USER jewelry_user CREATEDB;
\q
EOF

# Test connection
psql -h localhost -U jewelry_user -d jewelry_inventory -c "SELECT version();"
```

### 3. Environment Configuration

Create production environment file:

```bash
# Create backend environment file
cat > /home/jewelry-app/jewelry-inventory/backend/.env << 'EOF'
# Environment
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://jewelry_user:your-secure-db-password@localhost:5432/jewelry_inventory

# Database Pool Settings
DB_POOL_MIN=5
DB_POOL_MAX=20

# Authentication (GENERATE SECURE VALUES!)
JWT_SECRET=generate-a-super-secure-jwt-secret-key-at-least-64-characters-long
JWT_EXPIRATION=24h

# WhatsApp Business API
WHATSAPP_BUSINESS_PHONE=+1234567890

# File Upload Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Frontend URL (your domain)
FRONTEND_URL=https://yourdomain.com

# Rate Limiting (stricter for production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# Monitoring
ENABLE_TRACING=true
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Redis (if using)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# External APIs
IMGUR_CLIENT_ID=your-imgur-client-id
EOF

# Secure environment file
chmod 600 /home/jewelry-app/jewelry-inventory/backend/.env
```

### 3.1. Lock Package Versions for Production (CRITICAL)

**Lock all package versions to prevent dependency conflicts:**

```bash
cd /home/jewelry-app/jewelry-inventory

# Update package.json files to use EXACT versions
cat > backend/package.json << 'EOF'
{
  "name": "jewelry-inventory-backend",
  "version": "1.0.0",
  "main": "dist/app.js",
  "type": "module",
  "engines": {
    "node": "22.17.0",
    "npm": "10.9.2"
  },
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/app.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:seed": "tsx src/db/seed.ts"
  },
  "dependencies": {
    "express": "4.19.2",
    "cors": "2.8.5",
    "helmet": "7.1.0",
    "compression": "1.7.4",
    "express-rate-limit": "7.1.5",
    "drizzle-orm": "0.32.2",
    "postgres": "3.4.4",
    "zod": "3.23.8",
    "jose": "5.6.3",
    "argon2": "0.41.1",
    "dotenv": "16.4.5"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "tsx": "4.16.2",
    "tsc-alias": "1.8.10",
    "@types/node": "20.14.12",
    "drizzle-kit": "0.23.2"
  }
}
EOF

cat > frontend/package.json << 'EOF'
{
  "name": "jewelry-inventory-frontend",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": "22.17.0",
    "npm": "10.9.2"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-router-dom": "6.24.1",
    "zustand": "4.5.4",
    "@tanstack/react-query": "5.51.1",
    "axios": "1.7.2",
    "zod": "3.23.8",
    "tailwindcss": "3.4.6",
    "autoprefixer": "10.4.19",
    "postcss": "8.4.39",
    "tailwindcss-animate": "1.0.7"
  },
  "devDependencies": {
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "@vitejs/plugin-react": "4.3.1",
    "typescript": "5.5.4",
    "vite": "5.3.4"
  }
}
EOF

# Clean install with exact versions
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf node_modules package-lock.json

# Install exact versions only
npm ci --only=production
cd backend && npm ci --only=production
cd ../frontend && npm ci --only=production
cd ..
```

### 4. Database Migration & Seeding

```bash
cd /home/jewelry-app/jewelry-inventory/backend

# Generate and run migrations
npm run db:generate
npx drizzle-kit migrate

# Seed database
node -r dotenv/config --import tsx src/db/seed.ts

# Verify tables created
psql -h localhost -U jewelry_user -d jewelry_inventory -c "\dt"
```

### 5. Build Application

```bash
cd /home/jewelry-app/jewelry-inventory

# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build

# Return to root
cd ..
```

## Process Management with PM2

### 1. Create PM2 Configuration

```bash
# Create PM2 ecosystem file
cat > /home/jewelry-app/jewelry-inventory/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'jewelry-api',
      script: './backend/dist/app.js',
      cwd: '/home/jewelry-app/jewelry-inventory',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# Create logs directory
mkdir -p /home/jewelry-app/jewelry-inventory/logs
```

### 2. Start Application with PM2

```bash
cd /home/jewelry-app/jewelry-inventory

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u jewelry-app --hp /home/jewelry-app
```

## Nginx Configuration

### 1. Create Nginx Server Block

```bash
sudo tee /etc/nginx/sites-available/jewelry-inventory << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

# Upstream backend
upstream jewelry_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Frontend static files
    location / {
        root /home/jewelry-app/jewelry-inventory/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://jewelry_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check
    location /health {
        proxy_pass http://jewelry_backend;
        access_log off;
    }

    # Auth endpoints (stricter rate limiting)
    location /api/admin/auth/ {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://jewelry_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ /(\.env|\.git|node_modules|package\.json) {
        deny all;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/jewelry-inventory /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Install and configure UFW
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change 22 to your SSH port if different)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL only from localhost
sudo ufw allow from 127.0.0.1 to any port 5432

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status verbose
```

### 2. PostgreSQL Security

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/17/main/postgresql.conf

# Set these values:
# listen_addresses = 'localhost'
# port = 5432
# max_connections = 100
# shared_buffers = 256MB
# effective_cache_size = 1GB

# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/17/main/pg_hba.conf

# Ensure these lines (remove any less secure entries):
# local   all             postgres                                peer
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5
# host    all             all             ::1/128                 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3. Application Security

```bash
# Generate secure JWT secret (save this!)
openssl rand -hex 64

# Generate secure database password (save this!)
openssl rand -base64 32

# Update environment file with secure values
nano /home/jewelry-app/jewelry-inventory/backend/.env
```

## Monitoring & Logging

### 1. Setup Log Rotation

```bash
sudo tee /etc/logrotate.d/jewelry-inventory << 'EOF'
/home/jewelry-app/jewelry-inventory/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 jewelry-app jewelry-app
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### 2. Setup Basic Monitoring

```bash
# Install htop for system monitoring
sudo apt install -y htop

# Setup disk space monitoring
echo "df -h" > /home/jewelry-app/check-disk.sh
chmod +x /home/jewelry-app/check-disk.sh

# Add to crontab for daily checks
(crontab -l 2>/dev/null; echo "0 9 * * * /home/jewelry-app/check-disk.sh") | crontab -
```

## Backup Strategy

### 1. Database Backup Script

```bash
cat > /home/jewelry-app/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/jewelry-app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="jewelry_inventory"
DB_USER="jewelry_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/jewelry_db_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/jewelry_db_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "jewelry_db_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: jewelry_db_$DATE.sql.gz"
EOF

chmod +x /home/jewelry-app/backup-db.sh

# Setup daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /home/jewelry-app/backup-db.sh") | crontab -
```

### 2. Application Backup Script

```bash
cat > /home/jewelry-app/backup-app.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/jewelry-app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/jewelry-app/jewelry-inventory"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files (excluding node_modules)
tar -czf $BACKUP_DIR/jewelry_app_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='logs' \
    --exclude='.git' \
    -C /home/jewelry-app jewelry-inventory

# Remove backups older than 14 days
find $BACKUP_DIR -name "jewelry_app_*.tar.gz" -mtime +14 -delete

echo "Application backup completed: jewelry_app_$DATE.tar.gz"
EOF

chmod +x /home/jewelry-app/backup-app.sh

# Setup weekly backups on Sunday at 3 AM
(crontab -l 2>/dev/null; echo "0 3 * * 0 /home/jewelry-app/backup-app.sh") | crontab -
```

## Deployment & Update Process

### 1. Deployment Script

```bash
cat > /home/jewelry-app/deploy.sh << 'EOF'
#!/bin/bash
set -e

APP_DIR="/home/jewelry-app/jewelry-inventory"
BRANCH="main"

echo "🚀 Starting deployment..."

# Navigate to app directory
cd $APP_DIR

# Pull latest changes
echo "📦 Pulling latest changes..."
git fetch origin
git reset --hard origin/$BRANCH

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Run database migrations
echo "🗄️ Running database migrations..."
cd backend
npm run db:generate
npx drizzle-kit migrate
cd ..

# Build application
echo "🔨 Building application..."
cd backend && npm run build
cd ../frontend && npm run build
cd ..

# Restart application
echo "♻️ Restarting application..."
pm2 restart jewelry-api
pm2 save

# Wait for application to start
sleep 10

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:3000/health; then
    echo "✅ Deployment successful!"
else
    echo "❌ Health check failed!"
    exit 1
fi
EOF

chmod +x /home/jewelry-app/deploy.sh
```

### 2. Zero-Downtime Deployment

```bash
# For zero-downtime deployments, use PM2 reload instead of restart
# Update deploy script to use:
pm2 reload jewelry-api
```

## SSL Certificate Auto-Renewal

```bash
# Test automatic renewal
sudo certbot renew --dry-run

# Setup automatic renewal (usually already configured)
sudo systemctl status certbot.timer
```

## Performance Optimization

### 1. PostgreSQL Tuning

```bash
# Edit PostgreSQL configuration for production
sudo nano /etc/postgresql/17/main/postgresql.conf

# Recommended settings for 4GB RAM server:
# shared_buffers = 1GB
# effective_cache_size = 3GB
# maintenance_work_mem = 256MB
# checkpoint_completion_target = 0.9
# wal_buffers = 16MB
# default_statistics_target = 100
# random_page_cost = 1.1
# effective_io_concurrency = 200

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 2. Nginx Optimization

```bash
# Edit Nginx configuration
sudo nano /etc/nginx/nginx.conf

# Optimize worker processes and connections
# worker_processes auto;
# worker_connections 1024;
# keepalive_timeout 65;
# client_max_body_size 10M;

# Reload Nginx
sudo systemctl reload nginx
```

## Troubleshooting

### Common Issues

1. **Application not starting**:
   ```bash
   pm2 logs jewelry-api
   pm2 describe jewelry-api
   ```

2. **Database connection issues**:
   ```bash
   sudo systemctl status postgresql
   psql -h localhost -U jewelry_user -d jewelry_inventory
   ```

3. **SSL certificate issues**:
   ```bash
   sudo certbot certificates
   sudo nginx -t
   ```

4. **High memory usage**:
   ```bash
   pm2 monit
   htop
   ```

### Log Locations

- **Application logs**: `/home/jewelry-app/jewelry-inventory/logs/`
- **Nginx logs**: `/var/log/nginx/`
- **PostgreSQL logs**: `/var/log/postgresql/`
- **PM2 logs**: `pm2 logs`

## Maintenance Tasks

### Daily
- Check application status: `pm2 status`
- Monitor disk space: `df -h`
- Check logs for errors: `pm2 logs --lines 50`

### Weekly
- Update system packages: `sudo apt update && sudo apt upgrade`
- Check backup integrity
- Review security logs

### Monthly
- Update Node.js and npm if needed
- Review and rotate logs
- Performance optimization review
- Security audit

## Security Checklist

- [ ] Strong passwords for all accounts
- [ ] SSH key-based authentication only
- [ ] Firewall properly configured
- [ ] SSL certificates installed and auto-renewing
- [ ] Database access restricted to localhost
- [ ] Regular security updates applied
- [ ] Backup strategy implemented and tested
- [ ] Monitoring and alerting configured
- [ ] Rate limiting enabled
- [ ] Security headers configured in Nginx

## 🔍 PRODUCTION VERSION VERIFICATION

**Run this complete verification on your production server:**

```bash
echo "=== PRODUCTION VERSION AUDIT ==="

echo "System Information:"
lsb_release -a
uname -a

echo "Node.js version:"
node --version  # MUST be: v22.17.0

echo "npm version:"
npm --version   # MUST be: 10.9.2

echo "PostgreSQL version:"
psql --version  # MUST be: psql (PostgreSQL) 17.5

echo "PM2 version:"
pm2 --version   # MUST be: 5.3.0

echo "Nginx version:"
nginx -v        # MUST be: nginx/1.18.0

echo "Certbot version:"
certbot --version # MUST be: certbot 1.21.0

echo "Package holds (should list all locked packages):"
apt-mark showhold

echo "Application status:"
pm2 status

echo "Database connection test:"
psql -h localhost -U jewelry_user -d jewelry_inventory -c "SELECT version();"

echo "SSL certificate status:"
sudo certbot certificates

echo "=== AUDIT COMPLETE ==="
```

**Expected Output for Critical Versions:**
```
Node.js: v22.17.0
npm: 10.9.2
PostgreSQL: 17.5
PM2: 5.3.0
Nginx: nginx/1.18.0
Certbot: 1.21.0
```

**❌ If ANY version doesn't match, investigate immediately. Version mismatches can cause production failures.**

## Support & Maintenance

For ongoing support and maintenance:

1. Monitor application logs regularly
2. Keep system and dependencies updated
3. Test backup and restore procedures
4. Monitor performance metrics
5. Review security best practices periodically

This concludes the production deployment guide. Follow these steps carefully and customize the configurations according to your specific requirements and security policies. 
