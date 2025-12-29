# 🚀 AI-powered Leukemia Screening System - Deployment Guide

## 📋 **Overview**

This guide provides comprehensive instructions for deploying the AI-powered Acute Lymphoblastic Leukemia Screening System to production environments. The system is designed for hospital and clinical use with enterprise-grade security and scalability.

---

## 🏗️ **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React PWA)   │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Static    │    │   Load Balancer │    │   File Storage  │
│   Assets        │    │   (Nginx)       │    │   (AWS S3)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔧 **Prerequisites**

### **System Requirements:**
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **RAM**: Minimum 8GB, Recommended 16GB+
- **CPU**: Minimum 4 cores, Recommended 8+ cores
- **Storage**: Minimum 100GB SSD
- **Network**: Stable internet connection for AI processing

### **Software Dependencies:**
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **MongoDB**: v5.0.0 or higher
- **Nginx**: v1.18.0 or higher (for production)
- **PM2**: v5.0.0 or higher (process management)
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)

---

## 🐳 **Docker Deployment (Recommended)**

### **1. Create Docker Compose Configuration**

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:5.0
    container_name: all-screening-db
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: all_screening
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - all-screening-network
    ports:
      - "27017:27017"

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: all-screening-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGODB_URI: mongodb://mongodb:27017/all_screening
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      ROBOFLOW_API_KEY: ${ROBOFLOW_API_KEY}
      ROBOFLOW_PROJECT: ${ROBOFLOW_PROJECT}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_S3_BUCKET: ${AWS_S3_BUCKET}
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - mongodb
    networks:
      - all-screening-network
    ports:
      - "5000:5000"

  # Frontend Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: all-screening-frontend
    restart: unless-stopped
    environment:
      REACT_APP_API_URL: https://your-domain.com/api
      REACT_APP_VERSION: 1.0.0
    networks:
      - all-screening-network
    ports:
      - "3000:80"

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: all-screening-nginx
    restart: unless-stopped
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - all-screening-network
    ports:
      - "80:80"
      - "443:443"

  # Redis for Session Management (Optional)
  redis:
    image: redis:7-alpine
    container_name: all-screening-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - all-screening-network
    ports:
      - "6379:6379"

volumes:
  mongodb_data:
  redis_data:

networks:
  all-screening-network:
    driver: bridge
```

### **2. Environment Configuration**

Create `.env.prod`:

```bash
# Database Configuration
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your_secure_mongo_password
MONGODB_URI=mongodb://admin:your_secure_mongo_password@mongodb:27017/all_screening?authSource=admin

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Roboflow AI Configuration
ROBOFLOW_API_KEY=your_roboflow_api_key
ROBOFLOW_PROJECT=your_roboflow_project_id

# AWS S3 Configuration (for file storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your-medical-images-bucket
AWS_REGION=us-east-1

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Application Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com
```

### **3. Deploy with Docker**

```bash
# Clone the repository
git clone https://github.com/your-org/all-screening-system.git
cd all-screening-system

# Set up environment
cp .env.example .env.prod
# Edit .env.prod with your configuration

# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🖥️ **Manual Deployment**

### **1. Server Setup**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2
```

### **2. Application Deployment**

```bash
# Create application directory
sudo mkdir -p /var/www/all-screening
cd /var/www/all-screening

# Clone repository
git clone https://github.com/your-org/all-screening-system.git .

# Backend setup
cd backend
npm install --production
cp .env.example .env
# Edit .env with production values

# Frontend setup
cd ../frontend
npm install
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'all-screening-backend',
    script: './backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### **3. Nginx Configuration**

Create `/etc/nginx/sites-available/all-screening`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:";

    # Frontend
    location / {
        root /var/www/all-screening/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for AI processing
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # File uploads
    location /uploads/ {
        alias /var/www/all-screening/uploads/;
        expires 1d;
        add_header Cache-Control "private";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/all-screening /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 **SSL Certificate Setup**

### **Using Let's Encrypt (Recommended):**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🗄️ **Database Setup**

### **MongoDB Configuration:**

```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo
> use all_screening
> db.createUser({
    user: "all_screening_user",
    pwd: "secure_password_here",
    roles: [
      { role: "readWrite", db: "all_screening" }
    ]
  })
> exit

# Create initial admin user
node backend/scripts/create-admin.js
```

---

## 📊 **Monitoring & Logging**

### **1. Application Monitoring**

```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-server-monit

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### **2. System Monitoring**

Create `/etc/systemd/system/all-screening-monitor.service`:

```ini
[Unit]
Description=ALL Screening System Monitor
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/all-screening
ExecStart=/usr/bin/node monitoring/health-check.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 🔄 **Backup Strategy**

### **1. Database Backup**

Create backup script `/opt/backup-all-screening.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/all-screening"
DATE=$(date +%Y%m%d_%H%M%S)
MONGO_DB="all_screening"

# Create backup directory
mkdir -p $BACKUP_DIR

# MongoDB backup
mongodump --db $MONGO_DB --out $BACKUP_DIR/mongo_$DATE

# Compress backup
tar -czf $BACKUP_DIR/mongo_$DATE.tar.gz -C $BACKUP_DIR mongo_$DATE
rm -rf $BACKUP_DIR/mongo_$DATE

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/mongo_$DATE.tar.gz s3://your-backup-bucket/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: mongo_$DATE.tar.gz"
```

Set up cron job:
```bash
sudo crontab -e
# Add: 0 2 * * * /opt/backup-all-screening.sh
```

---

## 🚀 **Performance Optimization**

### **1. Application Optimization**

```bash
# Enable Node.js production optimizations
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"

# Configure PM2 for optimal performance
pm2 start ecosystem.config.js --node-args="--max-old-space-size=4096"
```

### **2. Database Optimization**

```javascript
// MongoDB indexes for better performance
db.analyses.createIndex({ "userId": 1, "timestamp": -1 })
db.analyses.createIndex({ "patientId": 1 })
db.analyses.createIndex({ "classification": 1, "timestamp": -1 })
db.users.createIndex({ "email": 1 }, { unique: true })
```

---

## 🔧 **Maintenance**

### **Regular Maintenance Tasks:**

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
cd /var/www/all-screening
npm audit fix

# Restart services
pm2 restart all
sudo systemctl reload nginx

# Check disk space
df -h

# Monitor logs
pm2 logs --lines 100
tail -f /var/log/nginx/access.log
```

---

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **Service not starting:**
   ```bash
   pm2 logs all-screening-backend
   sudo systemctl status nginx
   sudo systemctl status mongod
   ```

2. **Database connection issues:**
   ```bash
   mongo --eval "db.adminCommand('ismaster')"
   ```

3. **SSL certificate issues:**
   ```bash
   sudo certbot certificates
   sudo nginx -t
   ```

4. **High memory usage:**
   ```bash
   pm2 monit
   free -h
   ```

---

## 📞 **Support & Maintenance**

### **Production Checklist:**
- ✅ SSL certificate installed and auto-renewal configured
- ✅ Database backups automated
- ✅ Monitoring and alerting set up
- ✅ Log rotation configured
- ✅ Security headers implemented
- ✅ Rate limiting enabled
- ✅ Error tracking configured
- ✅ Performance monitoring active

### **Emergency Contacts:**
- **System Administrator**: admin@your-hospital.com
- **Technical Support**: tech-support@your-hospital.com
- **On-call Engineer**: +1-XXX-XXX-XXXX

**This deployment guide ensures a production-ready, secure, and scalable medical screening system.**