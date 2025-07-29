# Developer Setup and Deployment Guide

## Prerequisites

### Required Software
1. **Node.js** (>= 12.8.3)
   - Download from: https://nodejs.org/en/
   - Verify installation: `node --version`

2. **npm** (~6.14.6)
   - Usually included with Node.js
   - Verify installation: `npm --version`

3. **MongoDB** (>= 4.0)
   - **Option A - Local Installation:**
     - Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
     - Follow platform-specific installation instructions
   - **Option B - MongoDB Atlas (Cloud):**
     - Create free account at: https://www.mongodb.com/cloud/atlas
     - Set up cluster and get connection string

4. **Git**
   - Download from: https://git-scm.com/
   - Required for cloning repository

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 500MB free space
- **OS**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd chess-application
```

### 2. Install Dependencies
```bash
npm install
```

This will install all dependencies listed in `package.json`:
- **Production dependencies**: Express, MongoDB, Socket.io, authentication libraries
- **Development dependencies**: Nodemon for auto-restart during development

### 3. Environment Configuration

#### Create Environment File
```bash
cp .env.example .env
```

#### Configure Environment Variables
Edit `.env` file with your settings:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=27017
DB_USER=chess_db

# Security
HASH_SALT=10
SESSION_SECRET=your-secret-key-here

# Game Settings
RATING=1200  # Default starting rating for new users

# SSL Certificate Paths (for HTTPS)
SSL_KEY_PATH=certificates/server.key
SSL_CERT_PATH=certificates/server.crt
```

### 4. Database Setup

#### Option A: Local MongoDB
```bash
# Start MongoDB service
# Windows:
net start MongoDB

# macOS (with Homebrew):
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Create database (will be created automatically on first connection)
# No additional setup required
```

#### Option B: MongoDB Atlas
```bash
# Update .env file with Atlas connection string
DB_HOST=cluster0.xxxxx.mongodb.net
DB_PORT=27017
DB_USER=chess_production
DB_PASSWORD=your-atlas-password
```

### 5. SSL Certificate Generation (Development)

#### Generate Self-Signed Certificates
```bash
# Create certificates directory
mkdir certificates

# Generate private key
openssl genrsa -out certificates/server.key 2048

# Generate certificate signing request
openssl req -new -key certificates/server.key -out certificates/server.csr

# Generate self-signed certificate
openssl x509 -req -in certificates/server.csr -signkey certificates/server.key -out certificates/server.crt -days 365

# Clean up CSR file
rm certificates/server.csr
```

**Note**: For production, use certificates from a trusted Certificate Authority.

## Running the Application

### Development Mode
```bash
# Using npm script (recommended)
npm run app

# Or directly with nodemon
npx nodemon app.js

# Or with node (no auto-restart)
node app.js
```

### Production Mode
```bash
# Set environment
export NODE_ENV=production

# Start application
node app.js

# Or use PM2 for process management
npm install -g pm2
pm2 start app.js --name "chess-app"
```

### Accessing the Application
- **Local development**: https://localhost:3000
- **Production**: https://your-domain.com

**Important**: Application uses HTTPS by default. Accept the security warning for self-signed certificates in development.

## Development Workflow

### File Structure Overview
```
chess-application/
├── app.js                 # Main application entry point
├── package.json          # Dependencies and scripts
├── .env                  # Environment configuration
├── README.md            # Basic project information
├── app/                 # Core application logic
│   ├── passport.js      # Authentication configuration
│   ├── socket.js        # Socket.io event handlers
│   └── util.js          # Utility functions
├── config/              # Configuration files
│   └── database.js      # Database connection setup
├── models/              # Database models
│   └── user.js          # User schema and methods
├── routes/              # Express route handlers
│   ├── home.js          # Home and game routes
│   ├── login.js         # Authentication routes
│   ├── register.js      # User registration
│   ├── profile.js       # User profile management
│   └── play.js          # Game lobby routes
├── views/               # Handlebars templates
├── public/              # Static assets
│   ├── css/            # Stylesheets
│   ├── js/             # Client-side JavaScript
│   ├── img/            # Images and icons
│   └── lib/            # Third-party libraries
├── certificates/        # SSL certificates
└── docs/               # Documentation files
```

### Development Commands
```bash
# Install new dependency
npm install package-name

# Install development dependency
npm install --save-dev package-name

# Update dependencies
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Run linting (if configured)
npm run lint

# Run tests (when available)
npm test
```

### Environment-Specific Configuration

#### Development (.env.development)
```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DEBUG=true
```

#### Production (.env.production)
```bash
NODE_ENV=production
PORT=443
DB_HOST=production-db.company.com
DEBUG=false
```

## Database Management

### Initial Setup
```bash
# Connect to MongoDB
mongo

# Create database
use chess_db

# Create user (if authentication enabled)
db.createUser({
  user: "chess_user",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

### Common Database Operations
```bash
# View all users
db.users.find()

# Create database backup
mongodump --db chess_db --out backup/

# Restore database
mongorestore --db chess_db backup/chess_db/

# Create indexes for performance
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "rating": -1 })
```

## Testing

### Manual Testing Checklist
- [ ] User registration works
- [ ] User login/logout functions
- [ ] Game creation and joining
- [ ] Chess moves validation
- [ ] Real-time multiplayer functionality
- [ ] Rating updates after games
- [ ] Profile page displays correctly

### Automated Testing Setup (Future Enhancement)
```bash
# Install testing frameworks
npm install --save-dev mocha chai supertest

# Create test scripts in package.json
"scripts": {
  "test": "mocha test/*.js",
  "test:watch": "mocha test/*.js --watch"
}
```

## Deployment

### Production Server Setup

#### Server Requirements
- **Ubuntu 18.04+ / CentOS 7+**
- **Node.js 12.8.3+**
- **MongoDB 4.0+**
- **Nginx** (for reverse proxy)
- **PM2** (for process management)

#### Deployment Steps

1. **Server Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
sudo apt-get install -y mongodb

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx
```

2. **Application Deployment**
```bash
# Clone repository
git clone <repository-url> /var/www/chess-app
cd /var/www/chess-app

# Install dependencies
npm install --production

# Create production environment file
sudo nano .env

# Start application with PM2
pm2 start app.js --name "chess-app"
pm2 startup
pm2 save
```

3. **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/chess-app
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass https://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **SSL Certificate (Let's Encrypt)**
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

### Docker Deployment (Alternative)

#### Dockerfile
```dockerfile
FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mongodb
    depends_on:
      - mongodb
    
  mongodb:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

## Monitoring and Maintenance

### Application Monitoring
```bash
# PM2 monitoring
pm2 status
pm2 logs chess-app
pm2 monit

# System monitoring
htop
df -h
free -m
```

### Database Monitoring
```bash
# MongoDB status
sudo systemctl status mongod

# Database size
mongo --eval "db.stats()"

# Active connections
mongo --eval "db.serverStatus().connections"
```

### Log Management
```bash
# Application logs
tail -f ~/.pm2/logs/chess-app-error.log
tail -f ~/.pm2/logs/chess-app-out.log

# System logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/mongodb/mongod.log
```

### Backup Strategy
```bash
# Automated database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db chess_db --out /backup/mongodb_$DATE/
tar -czf /backup/mongodb_$DATE.tar.gz /backup/mongodb_$DATE/
rm -rf /backup/mongodb_$DATE/

# Add to crontab for daily backups
0 2 * * * /path/to/backup-script.sh
```

## Troubleshooting

### Common Issues

#### MongoDB Connection Errors
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

#### SSL Certificate Issues
```bash
# Verify certificate validity
openssl x509 -in certificates/server.crt -text -noout

# Check certificate expiration
openssl x509 -in certificates/server.crt -dates -noout
```

#### Node.js Application Errors
```bash
# Check application logs
pm2 logs chess-app

# Restart application
pm2 restart chess-app

# Check Node.js version
node --version
```

#### Port Conflicts
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill process using port
sudo kill -9 <PID>
```

### Performance Optimization

#### Database Optimization
```javascript
// Add to database.js
mongoose.set('useCreateIndex', true);
mongoose.set('bufferMaxEntries', 0);
mongoose.set('bufferCommands', false);
```

#### Application Optimization
```javascript
// Add to app.js
app.use(compression());
app.use(helmet());
app.set('trust proxy', 1);
```

## Security Considerations

### Production Security Checklist
- [ ] Use environment variables for sensitive data
- [ ] Enable MongoDB authentication
- [ ] Use strong SSL certificates
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Use firewall configuration
- [ ] Regular backup verification

### Security Headers
```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    }
}));
```