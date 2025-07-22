# Jewelry Inventory Management - Development Setup Guide

## Prerequisites & Version Requirements

### Required Software Versions (FIXED VERSIONS)
- **Node.js**: v22.17.0 (EXACT VERSION REQUIRED)
- **npm**: 10.9.2 (EXACT VERSION REQUIRED)
- **PostgreSQL**: 17.5 (EXACT VERSION REQUIRED)
- **Git**: 2.34.1 or higher

### System Requirements
- **macOS**: 10.15+ / **Linux**: Ubuntu 18.04+ / **Windows**: 10+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: 2GB free space

## 🔒 LOCKED VERSION SUMMARY (DO NOT DEVIATE)

| Component | EXACT Version Required | Command to Verify |
|-----------|----------------------|-------------------|
| **Node.js** | `22.17.0` | `node --version` |
| **npm** | `10.9.2` | `npm --version` |
| **PostgreSQL** | `17.5` | `psql --version` |
| **React** | `18.3.1` | Check package.json |
| **Express** | `4.19.2` | Check package.json |
| **TypeScript** | `5.5.4` | Check package.json |
| **Vite** | `5.3.4` | Check package.json |
| **Tailwind CSS** | `3.4.6` | Check package.json |
| **Drizzle ORM** | `0.32.2` | Check package.json |

**⚠️ CRITICAL: Use ONLY these exact versions. Any deviation may cause compatibility issues.**

## Initial Setup

### 1. Check Prerequisites

```bash
# Check Node.js version (MUST BE EXACT)
node --version
# MUST output: v22.17.0

# Check npm version (MUST BE EXACT)
npm --version
# MUST output: 10.9.2

# Check PostgreSQL version (MUST BE EXACT)
psql --version
# MUST output: psql (PostgreSQL) 17.5
```

### 1.1. Install Exact Node.js Version (if needed)

**If you don't have the exact versions, install them:**

**Using Node Version Manager (NVM) - RECOMMENDED:**
```bash
# Install NVM (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
source ~/.bashrc

# Install exact Node.js version
nvm install 22.17.0
nvm use 22.17.0
nvm alias default 22.17.0

# Verify versions
node --version  # MUST be v22.17.0
npm --version   # MUST be 10.9.2
```

**macOS (using Homebrew):**
```bash
# Remove any existing Node.js
brew uninstall --ignore-dependencies node

# Install specific version
brew install node@22.17.0

# Verify versions
node --version  # MUST be v22.17.0
npm --version   # Should be 10.9.2
```

**Ubuntu/Linux:**
```bash
# Remove existing Node.js
sudo apt remove nodejs npm

# Install exact version via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs=22.17.0*

# Verify versions
node --version  # MUST be v22.17.0
npm --version   # Should be 10.9.2
```

### 2. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd inventory-management-app

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### 3. PostgreSQL Setup

#### Install PostgreSQL 17 (if not already installed)

**macOS (using Homebrew):**
```bash
# Install PostgreSQL 17.5 (EXACT VERSION)
brew install postgresql@17

# Verify exact version
/usr/local/opt/postgresql@17/bin/psql --version
# MUST show: psql (PostgreSQL) 17.5 (Homebrew)

# Add to PATH
echo 'export PATH="/usr/local/opt/postgresql@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Start PostgreSQL service
brew services start postgresql@17
```

**Ubuntu/Linux:**
```bash
# Add PostgreSQL APT repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update

# Install PostgreSQL 17.5 (EXACT VERSION)
sudo apt-get install postgresql-17=17.5* postgresql-client-17=17.5*

# Verify exact version
psql --version
# MUST show: psql (PostgreSQL) 17.5

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Create Database
```bash
# Create the jewelry inventory database
createdb jewelry_inventory

# Test connection
psql -d jewelry_inventory -c "SELECT version();"
```

### 4. Environment Configuration

Create environment file for backend:

```bash
cd backend
cat > .env << 'EOF'
# Environment
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://localhost:5432/jewelry_inventory

# Database Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10

# Authentication (IMPORTANT: Change in production!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-for-security-purposes
JWT_EXPIRATION=24h

# WhatsApp Business API
WHATSAPP_BUSINESS_PHONE=+1234567890

# File Upload Settings
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring (Optional)
ENABLE_TRACING=false
EOF
```

### 4.1. Lock Package Versions (CRITICAL FOR REPRODUCIBILITY)

**Update package.json files to use EXACT versions (no ^ or ~ ranges):**

```bash
cd backend

# Create exact version package.json
cat > package.json << 'EOF'
{
  "name": "jewelry-inventory-backend",
  "version": "1.0.0",
  "description": "Backend API for jewelry inventory management system",
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
    "test": "vitest",
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
    "dotenv": "16.4.5",
    "multer": "1.4.5-lts.1",
    "ioredis": "5.4.1",
    "sharp": "0.33.4"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "tsx": "4.16.2",
    "tsc-alias": "1.8.10",
    "@types/node": "20.14.12",
    "drizzle-kit": "0.23.2",
    "vitest": "2.0.4"
  }
}
EOF

cd ../frontend

# Create exact version package.json for frontend
cat > package.json << 'EOF'
{
  "name": "jewelry-inventory-frontend",
  "version": "1.0.0",
  "description": "Frontend React application for jewelry inventory management",
  "type": "module",
  "engines": {
    "node": "22.17.0",
    "npm": "10.9.2"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-router-dom": "6.24.1",
    "zustand": "4.5.4",
    "@tanstack/react-query": "5.51.1",
    "@tanstack/react-query-devtools": "5.51.1",
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
    "vite": "5.3.4",
    "eslint": "9.7.0"
  }
}
EOF

cd ..

# Clean install with exact versions
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf node_modules package-lock.json

npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 5. Database Migration and Seeding

```bash
cd backend

# Generate database migrations
npm run db:generate

# Run migrations to create tables
npx drizzle-kit migrate

# Seed database with initial data
node -r dotenv/config --import tsx src/db/seed.ts
```

## Running the Application

### Method 1: Run Both Servers Simultaneously (Recommended)

```bash
# From project root
npm run dev
```

This starts both backend (port 3000) and frontend (port 5173) concurrently.

### Method 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Documentation**: http://localhost:3000/api/themes

## Default Admin Credentials

```
Email: admin@jewelrystore.com
Password: admin123!@#
```

**⚠️ IMPORTANT: Change these credentials immediately in production!**

## Troubleshooting Common Issues

### Port Conflicts

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Kill processes using port 3000
lsof -ti:3000 | xargs kill -9

# Kill processes using port 5173
lsof -ti:5173 | xargs kill -9

# Then restart servers
npm run dev
```

### Database Connection Issues

**Problem**: `DATABASE_URL is required` or connection errors

**Solutions**:
1. Ensure PostgreSQL is running:
   ```bash
   brew services list | grep postgresql  # macOS
   sudo systemctl status postgresql      # Linux
   ```

2. Check database exists:
   ```bash
   psql -l | grep jewelry_inventory
   ```

3. Verify `.env` file exists in `backend/` directory

### Frontend Styling Issues

**Problem**: Unstyled appearance, Tailwind CSS not working

**Solutions**:
1. Ensure `postcss.config.js` exists in frontend directory
2. Install missing dependencies:
   ```bash
   cd frontend
   npm install tailwindcss-animate
   ```
3. Restart frontend server:
   ```bash
   pkill -f "vite"
   npm run dev
   ```

### Module Resolution Errors

**Problem**: Cannot find module errors

**Solutions**:
1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check Node.js version compatibility:
   ```bash
   node --version  # MUST be v22.17.0 EXACTLY
   npm --version   # MUST be 10.9.2 EXACTLY
   ```

## Development Commands

### Backend
```bash
cd backend

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Run built application
npm start

# Database operations
npm run db:generate    # Generate migrations
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database

# Code quality
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
npm test              # Run tests
```

### Frontend
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Code quality
npm run lint           # Run ESLint
npm run type-check     # TypeScript checking
npm test              # Run tests
```

## Development Workflow

1. **Start Development**:
   ```bash
   npm run dev
   ```

2. **Make Changes**: Edit files in `frontend/src/` or `backend/src/`

3. **Hot Reload**: Changes automatically reload in browser

4. **Database Changes**:
   ```bash
   cd backend
   # Edit schema in src/db/schema.ts
   npm run db:generate  # Generate new migration
   npm run db:migrate   # Apply migration
   ```

5. **Testing**:
   ```bash
   npm test  # Run all tests
   ```

## File Structure

```
inventory-management-app/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── db/             # Database schema & migrations
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic
│   ├── .env               # Environment variables
│   └── package.json
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── stores/        # Zustand stores
│   └── package.json
└── package.json           # Root package.json
```

## 🔍 FINAL VERSION VERIFICATION

**Run this complete verification before starting development:**

```bash
echo "=== VERIFYING ALL EXACT VERSIONS ==="

echo "Node.js version:"
node --version  # MUST show: v22.17.0

echo "npm version:"
npm --version   # MUST show: 10.9.2

echo "PostgreSQL version:"
psql --version  # MUST show: psql (PostgreSQL) 17.5

echo "Database connection test:"
psql -d jewelry_inventory -c "SELECT version();"

echo "Backend package versions:"
cd backend
node -e "const pkg = require('./package.json'); console.log('Express:', pkg.dependencies.express); console.log('TypeScript:', pkg.devDependencies.typescript);"

echo "Frontend package versions:"
cd ../frontend
node -e "const pkg = require('./package.json'); console.log('React:', pkg.dependencies.react); console.log('Vite:', pkg.devDependencies.vite);"

cd ..
echo "=== VERIFICATION COMPLETE ==="
```

**Expected Output:**
```
Node.js version:
v22.17.0
npm version:
10.9.2
PostgreSQL version:
psql (PostgreSQL) 17.5 (Homebrew)
Express: 4.19.2
TypeScript: 5.5.4
React: 18.3.1
Vite: 5.3.4
```

**❌ If ANY version doesn't match exactly, DO NOT PROCEED. Fix the versions first.**

## Need Help?

1. Check the console logs for error messages
2. Verify all prerequisites are installed with correct versions
3. Ensure PostgreSQL is running and database exists
4. Check that environment variables are properly configured
5. Try restarting both servers if issues persist 
