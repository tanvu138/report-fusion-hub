# Known Issues and Limitations

> **Documented limitations, edge cases, and workarounds for Report Fusion**  
> Last Updated: 2025-07-25

## 🐛 Active Known Issues

### High Priority

#### 1. Playwright Test Configuration Mismatch
**Issue**: E2E tests use incorrect ports in configuration
- **Symptoms**: Tests fail with "ECONNREFUSED" or timeout errors
- **Root Cause**: `playwright.config.ts` expects frontend on port 5173 but system uses 7428
- **Workaround**: Update `playwright.config.ts` baseURL to match actual ports
- **Status**: Needs configuration update
- **Impact**: E2E tests unreliable

```typescript
// Current (incorrect)
baseURL: 'http://localhost:5173'

// Should be
baseURL: 'http://localhost:7428'
```

#### 2. PDF Export Memory Leaks
**Issue**: Puppeteer browser instances not always cleaned up properly
- **Symptoms**: High memory usage, system slowdown after multiple PDF exports
- **Root Cause**: Browser instances remain open if PDF generation fails
- **Workaround**: Restart server periodically, monitor memory usage
- **Status**: Partial fix implemented (finally blocks), needs improvement
- **Impact**: Server instability under load

#### 3. Large Image Upload Performance
**Issue**: Images >2MB cause slow upload and PDF generation
- **Symptoms**: Upload timeouts, PDF generation >60 seconds
- **Root Cause**: No image compression, base64 encoding overhead
- **Workaround**: Resize images before upload, limit to <1MB
- **Status**: Needs image optimization implementation
- **Impact**: Poor user experience with large images

### Medium Priority

#### 4. Cross-Browser Cookie Inconsistencies
**Issue**: Authentication cookies behave differently across browsers
- **Symptoms**: Login works in Chrome but fails in Firefox/Safari
- **Root Cause**: Different cookie handling, SameSite attribute issues
- **Workaround**: Test with Chrome, clear cookies if issues persist
- **Status**: Needs cross-browser testing and cookie configuration review
- **Impact**: Limited browser compatibility

#### 5. Database Connection Pool Exhaustion
**Issue**: High concurrent usage can exhaust Prisma connection pool
- **Symptoms**: "Too many connections" errors, API timeouts
- **Root Cause**: Default connection pool too small for concurrent users
- **Workaround**: Restart server, limit concurrent operations
- **Status**: Needs connection pool tuning
- **Impact**: Poor scalability

#### 6. File Upload Error Handling
**Issue**: Unclear error messages for failed file uploads
- **Symptoms**: Generic "Upload failed" messages, no specific guidance
- **Root Cause**: Error handling doesn't distinguish between different failure types
- **Workaround**: Check file size, type, and permissions manually
- **Status**: Needs improved error messages
- **Impact**: Poor user experience for upload failures

### Low Priority

#### 7. Dark Mode Toggle Persistence
**Issue**: Dark mode preference not saved across sessions
- **Symptoms**: Always defaults to light mode on page refresh
- **Root Cause**: Theme preference not stored in persistent storage
- **Workaround**: Manually toggle dark mode each session
- **Status**: Enhancement needed
- **Impact**: Minor UX inconvenience

#### 8. Long Report Titles Truncation
**Issue**: Very long report titles get truncated in UI without indication
- **Symptoms**: Title appears cut off, no tooltip or expansion option
- **Root Cause**: CSS overflow handling without user feedback
- **Workaround**: Keep report titles under 50 characters
- **Status**: UI enhancement needed
- **Impact**: Minor display issue

## 🚧 System Limitations

### Technical Constraints

#### 1. PDF Generation Limitations
- **Maximum report size**: ~50 sections efficiently
- **Image limit**: 20 images per report for optimal performance
- **Concurrent PDF generation**: 3 simultaneous exports maximum
- **Memory requirement**: 512MB RAM per PDF generation process
- **Timeout**: 120 seconds for PDF generation

#### 2. File Upload Constraints
- **Maximum file size**: 5MB per image
- **Supported formats**: JPG, PNG, GIF, WebP only
- **Storage encryption**: AES-256-GCM (CPU intensive for large files)
- **Concurrent uploads**: 5 simultaneous uploads per user

#### 3. Database Scalability
- **User limit**: ~1000 concurrent users (with default connection pool)
- **Report limit**: No hard limit, but performance degrades after 10,000 reports
- **Section limit**: 100 sections per report recommended maximum
- **File storage**: Limited by disk space, no automatic cleanup

#### 4. Browser Compatibility
- **Minimum versions**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile support**: Limited, desktop-optimized interface
- **JavaScript required**: No graceful degradation for disabled JS
- **Cookie support**: Required, no alternative authentication method

### Business Logic Limitations

#### 1. User Management
- **Role system**: Only two roles (secretary/department), no granular permissions
- **Department hierarchy**: Single level only, no nested departments
- **User deletion**: Cascades to reports, no soft delete option
- **Bulk operations**: No bulk user import/export functionality

#### 2. Report Workflow
- **State transitions**: Linear workflow only (DRAFT → SUBMITTED → FINAL → PUBLISHED)
- **Rollback**: No way to revert from FINAL back to DRAFT
- **Approval process**: No multi-level approval workflow
- **Comments**: Basic commenting only, no threaded discussions

#### 3. Template System
- **Template inheritance**: No template versioning or inheritance
- **Dynamic templates**: No conditional sections based on data
- **Template sharing**: No cross-department template sharing
- **Template validation**: Limited schema validation

## 🔧 Workarounds and Best Practices

### Development Environment

#### 1. Port Conflict Resolution
```bash
# Always use proper startup/shutdown
npm stop    # Clean shutdown
npm start   # Proper startup

# If ports still conflict
lsof -ti :8945 :7428 | xargs kill -9
```

#### 2. Database Reset Procedure
```bash
# Safe reset for development
cd server
npx prisma migrate reset --force
npm run seed
npx prisma generate
```

#### 3. Memory Management for PDF Generation
```javascript
// Always use try/finally for browser cleanup
let browser = null;
try {
  browser = await puppeteer.launch(options);
  // PDF generation
} finally {
  if (browser) {
    await browser.close();  // Critical: Always close
  }
}
```

### Production Deployment

#### 1. Environment Configuration
```bash
# Required environment variables
DATABASE_URL="postgresql://..."
JWT_SECRET="32+character-secret"
FILE_ENCRYPTION_KEY="base64-encoded-32-byte-key"
NODE_ENV="production"

# Optional performance tuning
DATABASE_CONNECTION_LIMIT=10
PDF_GENERATION_TIMEOUT=120000
MAX_CONCURRENT_UPLOADS=5
```

#### 2. Resource Monitoring
```bash
# Monitor critical resources
df -h /path/to/uploads        # Disk space
ps aux | grep node           # Memory usage
netstat -an | grep :8945     # Connection count
```

#### 3. Backup Strategy
```bash
# Critical data to backup
pg_dump $DATABASE_URL > backup.sql                    # Database
tar -czf uploads.tar.gz secure_uploads/               # Encrypted files
cp .env env_backup                                     # Configuration
```

## 🔍 Debugging Edge Cases

### 1. Authentication Edge Cases

#### Silent Login Failures
**Symptoms**: Login appears successful but user not authenticated
**Debug steps**:
```bash
# Check cookie setting
curl -c cookies.txt -X POST http://localhost:8945/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Verify cookie content
cat cookies.txt

# Test cookie usage
curl -b cookies.txt http://localhost:8945/api/me
```

#### Cross-Site Cookie Issues
**Symptoms**: Cookies not sent in cross-origin requests
**Debug steps**:
1. Check browser network tab for missing Cookie header
2. Verify CORS configuration includes `credentials: true`
3. Ensure frontend uses `credentials: 'include'`
4. Check SameSite attribute in production

### 2. PDF Generation Edge Cases

#### Corrupted PDF Output
**Symptoms**: PDF file generated but cannot be opened
**Debug steps**:
```bash
# Check PDF file validity
file report.pdf                    # Should show "PDF document"
pdfinfo report.pdf                 # Check PDF metadata

# Check Puppeteer logs
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: false});
  // Test PDF generation manually
})();
"
```

#### Memory Exhaustion During PDF Generation
**Symptoms**: PDF generation fails with out-of-memory errors
**Debug steps**:
```bash
# Monitor memory during generation
top -p $(pgrep -f node)

# Check available memory
free -m

# Generate PDF with memory profiling
node --max-old-space-size=2048 server.js
```

### 3. Database Edge Cases

#### Connection Pool Exhaustion
**Symptoms**: "Too many clients" or connection timeout errors
**Debug queries**:
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check connection details
SELECT client_addr, state, query FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';
```

#### Migration Conflicts
**Symptoms**: Migration fails with constraint violations
**Resolution**:
```bash
# Check migration status
npx prisma migrate status

# Manually resolve conflicts
npx prisma db execute --stdin <<< "ALTER TABLE ..."

# Reset if necessary (development only)
npx prisma migrate reset --force
```

## 📈 Performance Optimization Guidelines

### 1. Database Query Optimization
```typescript
// Use select to limit data
const reports = await prisma.report.findMany({
  select: {
    id: true,
    title: true,
    status: true,
    // Avoid large content fields
  },
  where: {
    status: 'PUBLISHED'
  },
  orderBy: {
    updatedAt: 'desc'
  },
  take: 20  // Pagination
});

// Use includes carefully
const reportWithSections = await prisma.report.findUnique({
  where: { id: reportId },
  include: {
    sections: {
      where: { status: 'ACTIVE' },  // Filter at DB level
      orderBy: { order: 'asc' }
    }
  }
});
```

### 2. Image Optimization Recommendations
```typescript
// Client-side image compression before upload
function compressImage(file: File, maxWidth: number = 1920): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', 0.8);  // 80% quality
    };
    
    img.src = URL.createObjectURL(file);
  });
}
```

### 3. Memory Management Best Practices
```javascript
// PDF generation with memory optimization
const generatePDF = async (reportData) => {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',      // Use disk instead of /dev/shm
      '--disable-gpu',
      '--max_old_space_size=1024',    // Limit V8 heap
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set memory limits
    await page.setViewport({ width: 1200, height: 800 });
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF in chunks for large documents
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1in', bottom: '1in', left: '1in', right: '1in' }
    });
    
    return pdf;
  } finally {
    await browser.close();  // Always cleanup
  }
};
```

## 🔄 Update Process

This document should be updated when:
1. New issues are discovered and documented
2. Workarounds are found for existing issues
3. Issues are resolved and can be moved to resolved section
4. System limitations change due to upgrades
5. New performance optimization techniques are discovered

**Responsible parties**:
- Developers: Update when fixing bugs or discovering issues
- AI Agents: Update when encountering new patterns
- System Administrators: Update operational limitations and constraints

---

*This is a living document. Please contribute new findings and solutions.*