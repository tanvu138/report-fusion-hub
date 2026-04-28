# Report Fusion Troubleshooting Guide

> **Comprehensive troubleshooting reference for developers, administrators, and AI agents**  
> Last Updated: 2025-07-25

## Quick Reference

**🚨 Emergency Commands**
```bash
npm stop                    # Stop all development servers
pkill -f nodemon           # Kill backend processes
pkill -f vite              # Kill frontend processes
lsof -i :8945 -i :7428     # Check what's using our ports
```

**🔧 Common Quick Fixes**
- Port conflicts → Use `npm stop` then `npm start`
- Database issues → `cd server && npm run seed`
- Authentication problems → Clear browser cookies + restart
- PDF export fails → Check disk space and Puppeteer installation

---

## Table of Contents

1. [Development Environment Issues](#development-environment-issues)
2. [Authentication & JWT Troubleshooting](#authentication--jwt-troubleshooting)
3. [Database & Prisma Issues](#database--prisma-issues)
4. [PDF Export Problems](#pdf-export-problems)
5. [Frontend & UI Issues](#frontend--ui-issues)
6. [File Upload & Encryption Issues](#file-upload--encryption-issues)
7. [Testing Problems](#testing-problems)
8. [Performance & Memory Issues](#performance--memory-issues)
9. [Deployment Issues](#deployment-issues)
10. [FAQ by User Type](#faq-by-user-type)

---

## Development Environment Issues

### Port Conflicts (EADDRINUSE)

**🎯 Most Common Issue**: Backend (8945) or Frontend (7428) ports already in use

**Symptoms:**
```bash
Error: listen EADDRINUSE: address already in use :::8945
Error: listen EADDRINUSE: address already in use :::7428
```

**Solutions:**

1. **Quick Fix (Recommended):**
   ```bash
   npm stop    # Uses stop-dev.cjs to kill processes properly
   npm start   # Restart both servers
   ```

2. **Manual Process Killing:**
   ```bash
   # Find processes using our ports
   lsof -i :8945  # Backend
   lsof -i :7428  # Frontend
   
   # Kill specific processes
   kill -9 <PID>
   
   # Or kill by process name
   pkill -f nodemon  # Backend
   pkill -f vite     # Frontend
   ```

3. **Verify Ports Are Clear:**
   ```bash
   lsof -i :8945 -i :7428  # Should return nothing
   ```

**Prevention:**
- Always use `npm stop` before closing terminals
- Don't manually kill terminal windows with Ctrl+C repeatedly
- Use the provided start-dev.cjs and stop-dev.cjs scripts

### Environment Configuration Issues

**Symptoms:**
- "Environment variables not found" errors
- Database connection failures
- JWT secret errors
- CORS issues between frontend/backend

**Solutions:**

1. **Check .env File Exists:**
   ```bash
   ls -la .env  # Should exist in project root
   ```

2. **Validate Required Variables:**
   ```bash
   # Required in root .env:
   DATABASE_URL="postgresql://user:password@localhost:5432/tpg_reports"
   JWT_SECRET="your-256-bit-secret-key-here"
   FILE_ENCRYPTION_KEY="base64-encoded-32-byte-encryption-key"
   FRONTEND_URL="http://localhost:7428"
   BACKEND_URL="http://localhost:8945"
   NODE_ENV="development"
   PORT=8945
   ```

3. **Generate Missing Secrets:**
   ```bash
   # Generate JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Generate encryption key
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

4. **Environment Loading Issues:**
   ```bash
   # Test environment loading
   node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? 'OK' : 'MISSING')"
   ```

### Node.js Version Issues

**Symptoms:**
- Syntax errors in modern JavaScript
- Package installation failures
- Crypto API not available

**Requirements:**
- Node.js v20+ (v18 minimum)
- npm v9+
- PostgreSQL 14+

**Solutions:**
```bash
# Check versions
node --version    # Should be v20+
npm --version     # Should be v9+
psql --version    # Should be PostgreSQL 14+

# Update Node.js (using nvm)
nvm install --lts
nvm use --lts

# Update npm
npm install -g npm@latest
```

### Package Installation Issues

**Symptoms:**
- "Module not found" errors
- Version conflicts
- Build failures

**Solutions:**

1. **Clean Installation:**
   ```bash
   # Clean caches
   npm cache clean --force
   rm -rf node_modules package-lock.json
   rm -rf server/node_modules server/package-lock.json
   
   # Reinstall
   npm install
   cd server && npm install
   ```

2. **Check Package Overrides:**
   ```bash
   # Verify overrides in package.json are working
   npm ls cross-spawn  # Should be ^7.0.5
   npm ls esbuild      # Should be ^0.25.0
   ```

3. **TypeScript Issues:**
   ```bash
   # Regenerate types
   npm run type-check
   cd server && npx prisma generate
   ```

---

## Authentication & JWT Troubleshooting

### Cookie Authentication Not Working

**🎯 Core Issue**: HTTP-only cookies require specific configuration

**Symptoms:**
- Login appears successful but redirects to login
- "Unauthorized" errors on protected routes
- User info not persisting across page refreshes

**Root Causes & Solutions:**

1. **Frontend Missing Credentials:**
   ```typescript
   // ❌ WRONG - Won't send cookies
   fetch('/api/reports')
   
   // ✅ CORRECT - Sends HTTP-only cookies
   fetch('/api/reports', {
     credentials: 'include'  // REQUIRED for cookies
   })
   ```

2. **CORS Configuration Issues:**
   ```javascript
   // server/server.js - Verify CORS settings
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:7428',
     credentials: true  // REQUIRED for cookies
   }));
   ```

3. **JWT Secret Issues:**
   ```bash
   # Check JWT secret is set
   echo $JWT_SECRET
   
   # Must be at least 32 characters
   node -e "console.log(process.env.JWT_SECRET?.length || 0)"
   ```

### Login Successful But No Redirect

**Symptoms:**
- Login request returns 200
- User data returned correctly
- Browser stays on login page

**Debug Steps:**

1. **Check Browser Network Tab:**
   - POST `/api/auth/login` should return Set-Cookie header
   - Cookie should be HttpOnly, Secure (in production)

2. **Verify React Router Navigation:**
   ```typescript
   // Check navigation logic in login component
   const navigate = useNavigate();
   
   // Should navigate after successful login
   if (loginResponse.ok) {
     navigate('/dashboard');  // or appropriate route
   }
   ```

3. **Check for JavaScript Errors:**
   - Open browser console during login
   - Look for unhandled promise rejections
   - Verify no TypeScript errors in development

### Token Expired Errors

**Symptoms:**
- "Token expired" messages
- Automatic logout after short periods
- Inconsistent authentication state

**Solutions:**

1. **Check Token Expiration Setting:**
   ```javascript
   // server/controllers/authController.js
   const token = jwt.sign(
     { userId: user.id, role: user.role },
     process.env.JWT_SECRET,
     { expiresIn: '24h' }  // Verify this duration
   );
   ```

2. **Clock Synchronization:**
   ```bash
   # Check system time
   date
   
   # Sync time if needed (macOS)
   sudo sntp -sS time.apple.com
   
   # Sync time (Linux)
   sudo ntpdate -s time.nist.gov
   ```

3. **Clear Stale Cookies:**
   ```javascript
   // Development: Clear all cookies
   document.cookie.split(";").forEach(c => {
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   ```

### Role-Based Access Issues

**Symptoms:**
- Secretary users can't access admin features
- Department users see content they shouldn't
- "Insufficient permissions" errors

**Debug Process:**

1. **Check User Role in Database:**
   ```sql
   -- Connect to database
   psql postgresql://user:password@localhost:5432/tpg_reports
   
   -- Check user roles
   SELECT id, username, role, "departmentId" FROM "User";
   ```

2. **Verify JWT Payload:**
   ```javascript
   // In browser console after login
   // Decode JWT token (development only)
   const token = document.cookie.match(/token=([^;]+)/)?.[1];
   if (token) {
     console.log(JSON.parse(atob(token.split('.')[1])));
   }
   ```

3. **Check Route Protection:**
   ```typescript
   // Verify route guards are properly implemented
   // src/components/ProtectedRoute.tsx should check user.role
   ```

---

## Database & Prisma Issues

### Database Connection Failures

**Symptoms:**
- "Can't reach database server" errors
- Connection timeouts
- "Password authentication failed" errors

**Solutions:**

1. **Check PostgreSQL Service:**
   ```bash
   # macOS (Homebrew)
   brew services list | grep postgresql
   brew services start postgresql@14
   
   # Linux (systemctl)
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   
   # Windows
   net start postgresql-x64-14
   ```

2. **Verify Database Exists:**
   ```bash
   # Connect to PostgreSQL
   psql postgres
   
   # List databases
   \l
   
   # Create database if missing
   CREATE DATABASE tpg_reports;
   
   # Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE tpg_reports TO your_user;
   ```

3. **Test Connection String:**
   ```bash
   # Test DATABASE_URL directly
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

### Prisma Migration Issues

**Symptoms:**
- "Migration failed" errors
- Schema drift warnings
- "Database is out of sync" messages

**Solutions:**

1. **Check Migration Status:**
   ```bash
   cd server
   npx prisma migrate status
   ```

2. **Reset Database (Development Only):**
   ```bash
   cd server
   npx prisma migrate reset  # ⚠️ DESTROYS ALL DATA
   npm run seed               # Restore test data
   ```

3. **Apply Pending Migrations:**
   ```bash
   cd server
   npx prisma migrate deploy  # Production safe
   # OR for development:
   npx prisma migrate dev      # Creates new migration if needed
   ```

4. **Schema Drift Resolution:**
   ```bash
   cd server
   npx prisma db push  # Push schema changes without migration
   npx prisma generate # Regenerate client
   ```

### Seeding Problems

**Symptoms:**
- "Seed script failed" errors
- Empty database after seeding
- Missing test users

**Solutions:**

1. **Check Seed Script:**
   ```bash
   cd server
   node prisma/seed.js  # Run seed directly
   ```

2. **Intelligent Seed System:**
   ```bash
   # Extract current data for reproduction
   node server/prisma/extract-seed-data.js
   
   # Check if extracted data exists
   ls -la server/prisma/seed-data/
   
   # Seed will use extracted data if available, defaults otherwise
   npm run seed
   ```

3. **Manual Seed Data Verification:**
   ```sql
   -- Check if seed data loaded
   SELECT COUNT(*) FROM "User";      -- Should have 6 users
   SELECT COUNT(*) FROM "Department"; -- Should have departments
   SELECT COUNT(*) FROM "Report";     -- Should have sample reports
   ```

4. **Clear and Re-seed:**
   ```bash
   cd server
   # Clear all data
   npx prisma db execute --stdin <<< "TRUNCATE TABLE \"User\" CASCADE;"
   
   # Re-run seed
   npm run seed
   ```

### Prisma Client Generation Issues

**Symptoms:**
- "Prisma client not found" errors
- Type errors in database queries
- Missing generated types

**Solutions:**

1. **Regenerate Client:**
   ```bash
   cd server
   npx prisma generate
   ```

2. **Check Client Installation:**
   ```bash
   cd server
   npm ls @prisma/client  # Should be installed
   ```

3. **Clear Generated Files:**
   ```bash
   cd server
   rm -rf node_modules/.prisma
   rm -rf node_modules/@prisma/client
   npm install
   npx prisma generate
   ```

---

## PDF Export Problems

### Puppeteer Launch Failures

**Symptoms:**
- "Failed to launch browser" errors
- "No usable sandbox" warnings
- PDF export timeouts

**Solutions:**

1. **Check Puppeteer Installation:**
   ```bash
   cd server
   npm ls puppeteer  # Should be installed
   
   # Reinstall if needed
   npm uninstall puppeteer
   npm install puppeteer
   ```

2. **Ubuntu/Linux Sandbox Issues:**
   ```bash
   # Install required dependencies
   sudo apt-get update
   sudo apt-get install -y \
     gconf-service libasound2 libatk1.0-0 libcairo-gobject2 \
     libdrm2 libgtk-3-0 libnspr4 libnss3 libx11-xcb1 libxss1 \
     libxtst6 fonts-liberation libappindicator1 libnss3 \
     lsb-release xdg-utils
   ```

3. **Memory Issues:**
   ```bash
   # Check available memory
   free -m
   
   # Increase swap if needed
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

4. **Docker/Container Issues:**
   ```dockerfile
   # Add to Dockerfile
   RUN apt-get update && apt-get install -y \
       fonts-liberation \
       libappindicator3-1 \
       libasound2 \
       libatk-bridge2.0-0 \
       libdrm2 \
       libgtk-3-0 \
       libnspr4 \
       libnss3 \
       libx11-xcb1 \
       libxcomposite1 \
       libxdamage1 \
       libxrandr2 \
       xdg-utils
   ```

### PDF Generation Errors

**Symptoms:**
- Empty PDF files
- Missing images in PDF
- PDF generation timeouts
- "Template not found" errors

**Solutions:**

1. **Check PDF Template:**
   ```bash
   # Verify template exists
   ls -la server/templates/pdfTemplate.html
   
   # Test template manually
   node server/test_export.cjs  # If exists
   ```

2. **Image Resolution Issues:**
   ```bash
   # Check image upload directory
   ls -la server/secure_uploads/report_images/
   
   # Verify encryption key
   echo $FILE_ENCRYPTION_KEY
   ```

3. **Debug PDF Generation:**
   ```javascript
   // Add debug logging in server/controllers/exportController.js
   console.log('PDF Export: Starting export for report', reportId);
   console.log('Browser launched successfully');
   console.log('PDF generated, size:', pdfBuffer.length);
   ```

4. **Memory Optimization:**
   ```javascript
   // In exportController.js, optimize Puppeteer launch
   const browser = await puppeteer.launch({
     headless: 'new',
     args: [
       '--no-sandbox',
       '--disable-setuid-sandbox',
       '--disable-dev-shm-usage',  // Overcome limited resource problems
       '--disable-accelerated-2d-canvas',
       '--no-first-run',
       '--disable-gpu'
     ]
   });
   ```

### File Encryption/Decryption Issues

**Symptoms:**
- "Failed to decrypt image" errors
- Corrupted images in PDFs
- Base64 encoding errors

**Solutions:**

1. **Verify Encryption Key:**
   ```bash
   # Check key is base64 encoded 32-byte key
   echo $FILE_ENCRYPTION_KEY | base64 -d | wc -c  # Should output 32
   ```

2. **Test Encryption/Decryption:**
   ```javascript
   // Test encryption utilities
   const { encryptBuffer, decryptBuffer } = require('./server/utils/encryptionUtils');
   const testData = Buffer.from('test data');
   const encrypted = encryptBuffer(testData);
   const decrypted = decryptBuffer(encrypted);
   console.log(decrypted.toString() === 'test data');  // Should be true
   ```

3. **Check File Permissions:**
   ```bash
   # Verify upload directory permissions
   ls -la server/secure_uploads/report_images/
   chmod -R 755 server/secure_uploads/
   ```

---

## Frontend & UI Issues

### White Screen of Death

**Symptoms:**
- Blank white page after navigation
- No React component rendering
- Console shows JavaScript errors

**Solutions:**

1. **Check Browser Console:**
   - Look for React errors
   - Check for failed API calls
   - Verify no TypeScript compilation errors

2. **React Error Boundaries:**
   ```typescript
   // Add error boundary to catch React errors
   // Check if ErrorBoundary component exists and is used
   ```

3. **API Connection Issues:**
   ```bash
   # Test API connectivity
   curl http://localhost:8945/api/health
   
   # Check CORS configuration
   curl -H "Origin: http://localhost:7428" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: X-Requested-With" \
        -X OPTIONS \
        http://localhost:8945/api/reports
   ```

### React Query Issues

**Symptoms:**
- Infinite loading states
- Failed data fetching
- Stale data persistence

**Solutions:**

1. **Check Query Configuration:**
   ```typescript
   // Verify React Query client setup
   // Check for proper error handling in useQuery hooks
   ```

2. **Clear React Query Cache:**
   ```typescript
   // In browser dev tools
   queryClient.clear();  // Clear all cached data
   ```

3. **Debug Query States:**
   ```typescript
   // Add debug logging to queries
   const { data, error, isLoading, isError } = useQuery({
     queryKey: ['reports'],
     queryFn: fetchReports,
     onError: (error) => console.error('Query error:', error),
     onSuccess: (data) => console.log('Query success:', data)
   });
   ```

### Styling & CSS Issues

**Symptoms:**
- Components not styled correctly
- Tailwind classes not applying
- Dark mode not working

**Solutions:**

1. **Check Tailwind Configuration:**
   ```bash
   # Verify Tailwind CSS is building
   npm run build
   
   # Check tailwind.config.js for content paths
   ```

2. **Purge/Content Issues:**
   ```javascript
   // tailwind.config.js - verify content paths
   module.exports = {
     content: [
       "./src/**/*.{js,ts,jsx,tsx}",  // Should match your file structure
       "./index.html"
     ]
   }
   ```

3. **CSS Import Order:**
   ```css
   /* Verify in src/index.css or main CSS file */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

---

## File Upload & Encryption Issues

### Upload Failures

**Symptoms:**
- "File upload failed" errors
- Large files timing out
- Unsupported file type errors

**Solutions:**

1. **Check File Size Limits:**
   ```javascript
   // server/routes/upload.js - verify multer configuration
   const upload = multer({
     limits: {
       fileSize: 5 * 1024 * 1024  // 5MB limit
     }
   });
   ```

2. **File Type Validation:**
   ```javascript
   // Check MIME type validation
   const allowedMimeTypes = [
     'image/jpeg', 'image/png', 'image/gif', 'image/webp'
   ];
   ```

3. **Upload Directory Permissions:**
   ```bash
   # Check upload directory exists and is writable
   mkdir -p server/secure_uploads/report_images
   chmod 755 server/secure_uploads/report_images
   ```

### Encryption Problems

**Symptoms:**
- "Encryption failed" errors
- Corrupted uploaded files
- Cannot decrypt stored files

**Solutions:**

1. **Verify Encryption Key Format:**
   ```bash
   # Key should be 32 bytes, base64 encoded
   node -e "
   const key = process.env.FILE_ENCRYPTION_KEY;
   console.log('Key length:', Buffer.from(key, 'base64').length);
   console.log('Should be 32');
   "
   ```

2. **Test Encryption Functions:**
   ```bash
   # Test encryption utilities
   cd server
   node -e "
   const { encryptBuffer, decryptBuffer } = require('./utils/encryptionUtils');
   const test = Buffer.from('test');
   const enc = encryptBuffer(test);
   const dec = decryptBuffer(enc);
   console.log('Success:', dec.toString() === 'test');
   "
   ```

---

## Testing Problems

### E2E Test Failures

**Symptoms:**
- Playwright tests timing out
- "Page not found" errors in tests
- Authentication tests failing

**Solutions:**

1. **Check Test Configuration:**
   ```typescript
   // playwright.config.ts - verify base URLs
   use: {
     baseURL: 'http://localhost:5173',  // Should match actual port
   }
   ```

2. **Server Startup Issues:**
   ```bash
   # Check if test servers are starting
   npm run dev:backend &
   npm run dev:frontend &
   
   # Wait for servers to be ready
   curl -f http://localhost:3001/health
   curl -f http://localhost:5173
   ```

3. **Fix Port Mismatches:**
   ```bash
   # Current system uses:
   # Backend: 8945
   # Frontend: 7428
   # But playwright.config.ts expects different ports
   
   # Update playwright.config.ts baseURL to match actual ports
   ```

4. **Database State Issues:**
   ```bash
   # Reset database before tests
   cd server
   npx prisma migrate reset --force
   npm run seed
   ```

### Unit Test Issues

**Symptoms:**
- Vitest tests failing
- Import errors in tests
- Mocking issues

**Solutions:**

1. **Check Test Configuration:**
   ```javascript
   // vite.config.ts - verify test setup
   test: {
     environment: 'jsdom',  // For React component tests
     setupFiles: ['./src/test-setup.ts']
   }
   ```

2. **Mock External Dependencies:**
   ```typescript
   // Mock React Query in tests
   vi.mock('@tanstack/react-query', () => ({
     useQuery: vi.fn(),
     useQueryClient: vi.fn()
   }));
   ```

---

## Performance & Memory Issues

### High Memory Usage

**Symptoms:**
- Node.js processes consuming excessive RAM
- Browser tabs crashing
- System becomes unresponsive

**Solutions:**

1. **Check Memory Usage:**
   ```bash
   # Monitor Node.js memory
   ps aux | grep node
   
   # Monitor system memory
   top -o %MEM
   ```

2. **Optimize PDF Generation:**
   ```javascript
   // In exportController.js - ensure browser cleanup
   try {
     // PDF generation code
   } finally {
     if (browser) {
       await browser.close();  // CRITICAL: Always close browser
     }
   }
   ```

3. **Database Connection Pooling:**
   ```javascript
   // Check Prisma connection pool settings
   // In schema.prisma datasource block:
   // connection_limit = 5
   ```

### Slow API Responses

**Symptoms:**
- API calls taking > 5 seconds
- Frontend showing loading states indefinitely
- Database query timeouts

**Solutions:**

1. **Check Database Indexes:**
   ```sql
   -- Add indexes for common queries
   CREATE INDEX IF NOT EXISTS idx_reports_status ON "Report"(status);
   CREATE INDEX IF NOT EXISTS idx_sections_report_id ON "ReportSection"("reportId");
   ```

2. **Optimize Database Queries:**
   ```typescript
   // Use include/select to limit data fetching
   const reports = await prisma.report.findMany({
     select: {
       id: true,
       title: true,
       status: true,
       // Don't fetch large content fields unnecessarily
     }
   });
   ```

3. **Enable Query Logging:**
   ```bash
   # Add to .env for debugging
   DATABASE_LOG_QUERIES="true"
   ```

---

## Deployment Issues

### Docker Build Failures

**Symptoms:**
- "Failed to build image" errors
- Missing dependencies in container
- Puppeteer installation issues

**Solutions:**

1. **Puppeteer Dependencies:**
   ```dockerfile
   # Add required system packages for Puppeteer
   RUN apt-get update && apt-get install -y \
       fonts-liberation \
       libappindicator3-1 \
       libasound2 \
       libatk-bridge2.0-0 \
       libdrm2 \
       libgtk-3-0 \
       libnspr4 \
       libnss3 \
       libx11-xcb1 \
       libxcomposite1 \
       libxdamage1 \
       libxrandr2 \
       xdg-utils
   ```

2. **Multi-stage Build Optimization:**
   ```dockerfile
   # Use multi-stage build to reduce image size
   FROM node:20-alpine AS builder
   # ... build steps
   
   FROM node:20-alpine AS production
   # ... copy built artifacts
   ```

### Environment Variable Issues

**Symptoms:**
- "Environment variable not found" in production
- Different behavior between development and production
- CORS errors in production

**Solutions:**

1. **Check Production Environment:**
   ```bash
   # Verify all required variables are set
   printenv | grep -E "(DATABASE_URL|JWT_SECRET|FILE_ENCRYPTION_KEY)"
   ```

2. **Production vs Development Differences:**
   ```javascript
   // Check NODE_ENV specific configuration
   const isProduction = process.env.NODE_ENV === 'production';
   
   // CORS origins for production
   const allowedOrigins = isProduction 
     ? ['https://yourdomain.com']
     : ['http://localhost:7428'];
   ```

---

## FAQ by User Type

### FAQ for Developers

**Q: Why can't I see data after logging in?**
A: Most likely a CORS or credentials issue. Ensure all API calls include `credentials: 'include'` and CORS is configured with `credentials: true`.

**Q: How do I add a new API endpoint?**
A: 1) Create route handler in `/server/routes/`, 2) Add route to `server/server.js`, 3) Update frontend API client, 4) Add TypeScript types if needed.

**Q: Why is my PDF export failing?**
A: Check disk space, verify Puppeteer installation, and ensure FILE_ENCRYPTION_KEY is properly set. Enable debug logging in exportController.js.

**Q: How do I reset the database?**
A: `cd server && npx prisma migrate reset && npm run seed`. ⚠️ This destroys all data.

**Q: Why are my Tailwind styles not working?**
A: Check that your component files are included in `tailwind.config.js` content paths and that you're using the correct class names.

**Q: How do I debug authentication issues?**
A: Check browser network tab for Set-Cookie headers, verify JWT_SECRET is set, and ensure all API calls use `credentials: 'include'`.

### FAQ for AI Agents

**Q: What's the quickest way to understand the codebase structure?**
A: Start with `.labs/README-DEV.md` for technical details, then check the Notion AI Agent Command Center for architectural patterns.

**Q: How do I safely make database changes?**
A: 1) Modify `prisma/schema.prisma`, 2) Run `npx prisma migrate dev`, 3) Run `npx prisma generate`, 4) Update seed data if needed.

**Q: What are the most common issues I should watch for?**
A: Port conflicts (use `npm stop` then `npm start`), authentication cookies (`credentials: 'include'`), and Puppeteer memory leaks (always close browser).

**Q: How do I test my changes thoroughly?**
A: Run `npm test`, `npx playwright test`, check that seeding works (`npm run seed`), and test PDF export with a sample report.

**Q: What coding patterns should I follow?**
A: Use semantic button variants, HTTP-only cookies for auth, encrypted file storage, and comprehensive error handling with proper HTTP status codes.

### FAQ for System Administrators

**Q: How do I monitor system health?**
A: Check `/api/health` endpoint, monitor database connections, watch for memory usage spikes during PDF generation.

**Q: What are the security considerations?**
A: HTTP-only cookies, encrypted file storage (AES-256-GCM), input validation, CORS configuration, and SQL injection protection via Prisma.

**Q: How do I backup the system?**
A: Backup PostgreSQL database, secure_uploads directory (encrypted files), and environment variables. Use `extract-seed-data.js` for development data.

**Q: What resources does the system require?**
A: Node.js 20+, PostgreSQL 14+, 2GB+ RAM (for Puppeteer), SSD storage recommended for database and file uploads.

**Q: How do I scale the system?**
A: Use database connection pooling, optimize Puppeteer browser reuse, implement Redis for session storage, and load balance multiple Node.js instances.

### FAQ for End Users

**Q: Why can't I log in?**
A: Verify your username and password, ensure cookies are enabled, try clearing browser cache, or contact your administrator.

**Q: Why is my report export slow?**
A: Large reports with many images take time to generate. PDFs with 10+ images may take 30-60 seconds. Consider reducing image sizes.

**Q: Can I recover a deleted report?**
A: No, deletions are permanent. Always use "Save as Draft" frequently and consider exporting important reports as PDFs.

**Q: Why can't I upload my file?**
A: Check file size (max 5MB), ensure it's a supported image type (JPG, PNG, GIF, WebP), and verify you have edit permissions for the report.

**Q: How do I share a report with external users?**
A: Use the "Share" feature to generate a 6-digit access code. The link works for 7 days by default and doesn't require login.

---

## Integration Strategy

### Where to Place These Guides

1. **Primary Location**: `.labs/TROUBLESHOOTING-GUIDE.md` (this file)
   - Central reference for all troubleshooting
   - Easily accessible to AI agents and developers

2. **Cross-References**:
   - Add troubleshooting links to `README-DEV.md`
   - Include quick fixes in `CLAUDE.md`
   - Reference in Notion AI Agent Command Center

3. **User-Specific Guides**:
   - Link developer FAQ from development documentation
   - Include admin FAQ in deployment documentation
   - Provide end-user FAQ in user guide (when created)

### Maintenance Strategy

1. **Regular Updates**: Update after each major feature or bug fix
2. **Issue Tracking**: Add new troubleshooting entries when issues are reported
3. **User Feedback**: Incorporate common questions from support tickets
4. **Testing Integration**: Update test failure troubleshooting after CI/CD changes

### Quick Access References

Add these to your bookmarks or documentation index:
- Development Issues: [#development-environment-issues](#development-environment-issues)
- Auth Problems: [#authentication--jwt-troubleshooting](#authentication--jwt-troubleshooting)
- Database Issues: [#database--prisma-issues](#database--prisma-issues)
- PDF Export: [#pdf-export-problems](#pdf-export-problems)
- Emergency Commands: [Quick Reference](#quick-reference)

---

*This troubleshooting guide is a living document. Please update it when you encounter and solve new issues.*