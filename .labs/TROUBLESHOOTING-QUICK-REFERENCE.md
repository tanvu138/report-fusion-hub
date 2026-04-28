# Quick Troubleshooting Reference Card

> **Emergency fixes and common solutions at a glance**  
> Print this page for quick desk reference

## 🚨 Emergency Commands

```bash
# Stop everything and restart clean
npm stop && npm start

# Kill all Node processes (nuclear option)
pkill -f node && npm start

# Check what's using our ports
lsof -i :8945 -i :7428

# Database emergency reset
cd server && npx prisma migrate reset && npm run seed

# Clear all browser cookies (in dev console)
document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));
```

## 🔧 5-Second Fixes

| Problem | Quick Fix |
|---------|-----------|
| Port in use | `npm stop && npm start` |
| Can't login | Clear cookies + `credentials: 'include'` |
| No data showing | Check CORS + cookie auth |
| PDF fails | Check disk space + Puppeteer |
| Tests fail | Check ports match config |
| DB errors | `cd server && npm run seed` |
| White screen | Check browser console |
| Styles broken | Check Tailwind content paths |

## 🎯 Most Common Issues (90% of problems)

### 1. Port Conflicts
```bash
# Always use these commands
npm stop    # Stop properly
npm start   # Start both servers
```

### 2. Authentication Not Working
```typescript
// Must include in ALL API calls
fetch('/api/endpoint', {
  credentials: 'include'  // REQUIRED
})
```

### 3. Database Connection Issues
```bash
# Quick database check
psql "$DATABASE_URL" -c "SELECT 1;"

# Reset if needed
cd server && npx prisma migrate reset && npm run seed
```

### 4. PDF Export Failures
```bash
# Check these in order:
df -h                    # Disk space
npm ls puppeteer         # Puppeteer installed
echo $FILE_ENCRYPTION_KEY # Encryption key set
```

## 📋 Environment Checklist

**Required .env variables:**
- ✅ `DATABASE_URL` (PostgreSQL connection)
- ✅ `JWT_SECRET` (32+ characters)
- ✅ `FILE_ENCRYPTION_KEY` (base64 32-byte key)
- ✅ `FRONTEND_URL=http://localhost:7428`
- ✅ `BACKEND_URL=http://localhost:8945`

**Quick validation:**
```bash
node -e "require('dotenv').config(); console.log(['DATABASE_URL', 'JWT_SECRET', 'FILE_ENCRYPTION_KEY'].every(k => process.env[k]) ? '✅ All set' : '❌ Missing vars')"
```

## 🧪 Test Commands

```bash
# Test suite (run in order)
npm test                    # Unit tests
npx playwright test        # E2E tests
curl http://localhost:8945/api/health  # Backend health
curl http://localhost:7428             # Frontend health

# Database tests
cd server
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.count().then(c => console.log('Users:', c)).finally(() => prisma.$disconnect())"
```

## 🔍 Debug Commands

```bash
# Memory usage
ps aux | grep node | grep -v grep

# Port usage
netstat -tulpn | grep -E ':(7428|8945)'

# Process tree
pstree -p $(pgrep -f nodemon)

# Environment loaded
node -e "require('dotenv').config(); console.log(Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('JWT')))"
```

## ⚠️ Known Gotchas

1. **Playwright config uses wrong ports**: Update `playwright.config.ts` baseURL to `http://localhost:7428`
2. **Cookie auth requires HTTPS in production**: Set secure flags properly
3. **Puppeteer needs Ubuntu dependencies**: Install system packages for Docker
4. **Large PDFs consume memory**: Always close browser in finally block
5. **CORS issues**: Must set `credentials: true` on server AND `credentials: 'include'` on client

## 📞 When to Ask for Help

**Escalate immediately if:**
- Database corruption (can't seed)
- Security vulnerabilities discovered
- Production deployment failures
- Data loss incidents

**Debug first if:**
- Development environment issues
- Authentication problems
- PDF export failures
- Test failures
- UI/styling issues

---

*Keep this handy! Most issues are solved within these patterns.*