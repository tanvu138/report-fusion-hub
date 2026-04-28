# CLAUDE.md
_Last Updated: 2025-07-25_

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📖 Primary Documentation Sources

**🎯 PRIMARY: Notion AI Agent Command Center**  
URL: https://www.notion.so/REPORT-FUSION-22fd118797d980498c16df0eadeb1d47  
- 🎯 AI Task Workflows - Quick action patterns for common development tasks
- 📊 Codebase Map - Critical file locations and architectural patterns  
- 🔧 Development Patterns - Coding conventions and recent patterns
- 📝 Context Library - Tech stack, business logic, and essential knowledge

**💾 SECONDARY: Local Documentation (.labs/ directory)**
- README-DEV.md - Complete technical implementation reference
- README-PRODUCT.md - Business logic and user journey guide  
- LEARN.md - Architecture education for developers
- WORKSTREAM-COORDINATION.md - Work breakdown and sprint tracking
- DESIGN-SYSTEM.md - UI/UX design system documentation
- Additional workstream-specific files for feature development

**📚 DETAILED REFERENCE: /docs/ directory**
- Comprehensive technical specifications and API documentation

> **For AI Agents**: Start with Notion for rapid context, use .labs/ for detailed implementation, reference /docs/ for comprehensive specs.

## Development Commands

### Prerequisites

**PostgreSQL** is required. Use Docker (recommended):
```bash
docker run -d \
  --name report-fusion-hub-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=report_fusion_hub \
  -p 5432:5432 \
  -v report-fusion-hub-pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```
Manage the container:
```bash
docker start report-fusion-hub-pg   # Start (after reboot/stop)
docker stop report-fusion-hub-pg    # Stop
```

After first setup, apply migrations and seed:
```bash
cd server && npx prisma migrate deploy && npm run seed && cd ..
```

### Starting Development

**IMPORTANT: Always check if servers are already running before starting new ones**

#### Standard Development (Recommended)
```bash
# From project root - starts both frontend and backend
npm start

# Stop both servers
npm stop
```
This runs the `start-dev.cjs` script which:
- Automatically installs missing/outdated dependencies (root + server)
- Starts backend server on port **8945** (http://localhost:8945)
- Starts frontend server on port **6234** (http://localhost:6234)

The stop script (`stop-dev.cjs`) cleanly terminates both servers and clears the ports.

#### Alternative Commands
```bash
# Backend only (from server directory)
cd server && npm run dev

# Frontend only (from project root)
npm run dev
```

#### Troubleshooting Server Startup
- If you get "EADDRINUSE" error, servers are already running
- Check running processes: `lsof -i :8945` (backend) or `lsof -i :6234` (frontend)
- Kill processes if needed: `pkill -f nodemon` or `pkill -f vite`
- If backend crashes with `Cannot find module`: dependencies are missing, `npm start` will auto-install them
- If backend crashes with `Can't reach database server`: ensure PostgreSQL is running (`docker start report-fusion-hub-pg`)
- The start-dev.cjs script shows colored output:
  - Blue: Backend messages
  - Green: Frontend messages
- **Always check with user before starting or killing dev servers**

> **🚨 For comprehensive troubleshooting**: See [TROUBLESHOOTING-GUIDE.md](.labs/TROUBLESHOOTING-GUIDE.md) for detailed solutions to common issues, or [TROUBLESHOOTING-QUICK-REFERENCE.md](.labs/TROUBLESHOOTING-QUICK-REFERENCE.md) for emergency fixes.

### Testing
- `npm test` - Run all Vitest unit/integration tests
- `npm run test:coverage` - Run tests with coverage report (70% threshold required)
- `npx playwright test` - Run E2E tests
- `npx playwright test --ui` - Run E2E tests with UI

### Code Quality
- `npm run lint` - ESLint check
- `npm run format` - Prettier formatting
- `npm run type-check` - TypeScript compilation check

### Database Operations
- `npx prisma migrate dev` - Apply database migrations
- `npx prisma generate` - Generate Prisma client
- `cd server && npm run seed` - Seed database with comprehensive data (uses extracted data if available, falls back to defaults)
- `node server/prisma/extract-seed-data.js` - Extract current database data to JSON files for reproduction
- `npm run generate:zod` - Generate Zod schemas from Prisma models (currently disabled)

### Build & Production
- `npm run build` - Build both frontend and backend
- `npm run preview` - Preview production build

## Documentation Structure

> **📖 New Comprehensive Documentation**: See `.labs/` directory for complete system documentation

### Primary Documentation (/.labs/)
- **README-DEV.md** - Complete technical implementation reference for developers and AI agents
- **README-PRODUCT.md** - Business logic, UX guide, and user journeys for product owners
- **LEARN.md** - Architecture education and career development guide for junior developers
- **WORKSTREAM-COORDINATION.md** - Work breakdown, engineer assignments, and sprint tracking
- **DESIGN-SYSTEM.md** - UI/UX design system documentation
- **TROUBLESHOOTING-GUIDE.md** - Comprehensive troubleshooting reference for all system issues
- **TROUBLESHOOTING-QUICK-REFERENCE.md** - Emergency fixes and common solutions at a glance
- **KNOWN-ISSUES-AND-LIMITATIONS.md** - Documented limitations, edge cases, and workarounds
- **WORKSTREAM-*.md** - Feature-specific development workstreams
- **ARCHITECTURE-*.md** - Component architecture documentation

### Supporting Documentation (/docs/)
- `/docs/architecture.md` - Complete system architecture guide
- `/docs/functional-spec.md` - Business requirements and user journeys  
- `/docs/db-models.md` - Database schema documentation

### Tech Stack
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js 18+ Express.js, Prisma ORM, PostgreSQL
- **Editor**: BlockNote rich text editor for report content
- **Authentication**: HTTP-only JWT cookies with role-based access control
- **Security**: AES-256-GCM file encryption, secure image storage
- **Testing**: Vitest (unit/integration), Playwright (E2E), Supertest (API)

### Project Structure
- `/src` - React frontend application
- `/server` - Express.js backend API
- `/prisma` - Database schema, migrations, and seeds
- `/tests/e2e` - Playwright end-to-end tests
- `/.labs` - **NEW**: Comprehensive documentation for AI agents and developers

### Core Domain Models
- **User**: Authentication and role management (secretary/department roles)
- **Department**: Organizational units with hierarchical relationships
- **Report**: Main content entity with workflow states (DRAFT → SUBMITTED → FINAL → PUBLISHED)
- **ReportSection**: Individual sections within reports with independent state management
- **ReportTemplate**: Reusable report structures
- **TemplatePack**: Collections of related templates

### Report Workflow Engine
Reports follow a strict state machine: DRAFT → SUBMITTED → FINAL → PUBLISHED
- Sections can be independently managed within reports
- Role-based permissions control state transitions
- File uploads are handled securely with proper validation

### Authentication & Authorization
- JWT Bearer token authentication
- Role-based access: secretary (admin) vs department (content creator)
- Department-specific content isolation
- Route protection on both frontend and backend

### Database Design
- PostgreSQL with Prisma ORM
- Type-safe database operations with generated Zod schemas
- Comprehensive relationships supporting complex reporting workflows
- Migration-first approach with proper seeding

### Testing Strategy
- Unit/Integration tests colocated with source files
- 70% coverage threshold enforced
- E2E tests cover critical user workflows
- API tests use Supertest for comprehensive endpoint validation

### Development Workflow
- Use `npm start` (runs `start-dev.cjs`) for local development
- Pre-commit hooks enforce code quality (ESLint, Prettier, tests)
- Environment variables managed through separate .env files
- Type generation from Prisma models maintains type safety across the stack

### Import Standards (TypeScript/Vite)
- **Use @/ aliases for src/ imports**: `import { Button } from '@/components/ui/button'`
- **Omit .ts/.tsx extensions**: `import utils from './utils'` (not `./utils.ts`)
- **Use type imports for types only**: `import type { User } from '@/types'`
- **Keep TypeScript config as-is**: `allowImportingTsExtensions: true` is correct for Vite
- **Consistency pattern**: All imports should follow extension-less pattern for cleaner code

### Key Features
- Template-based report creation with reusable template packs
- Rich text editing with BlockNote integration
- Professional PDF export with encrypted image support (Puppeteer-based)
- Shared report links for external stakeholders
- File upload handling with secure storage
- Multi-language support infrastructure (vi-VN, en-US)

### Development Notes
- Always run type generation after Prisma schema changes: `npm run generate:zod`
- Database changes require both migration and potential seed updates
- Frontend uses React Query for server state management
- Backend follows RESTful API conventions with proper error handling
- All new features should include comprehensive tests to maintain coverage threshold

## Current System Status

### ✅ Completed Major Features
- **PDF Export System**: Puppeteer-based PDF generation with encrypted image support (2025-07-25)
- **Enhanced ReportCreate**: Template section management with improved UX (2025-07-25)
- **Comprehensive Internationalization**: 1000+ translation keys, Vietnamese/English runtime switching
- **Vertical Navigation System**: Complete sidebar with admin control, keyboard shortcuts (⌘B/Ctrl+B)
- **Enhanced DocumentPreview**: PDF viewer-style interface with navigation and view modes
- **Global Settings Architecture**: Database-backed configuration with admin control
- **Enhanced Accessibility**: WCAG 2.1 AA compliance with screen reader support
- **Inline Preview Integration**: Unified preview system with no navigation breaks
- **ReportEdit UX Redesign**: Complete tab-based interface with dashboard overview
- **Auto-Save Functionality**: 45s for report details, 30s for section content with visual feedback
- **Enhanced Department UX**: Onboarding guidance, progress tracking, mobile responsiveness  
- **Authentication System**: HTTP-only JWT cookies with role-based access control
- **E2E Testing**: Core authentication flows working, 50%+ test pass rate
- **File Security**: AES-256-GCM encryption for all uploaded files

### 🔧 Development Environment Status
- ✅ Consolidated .env configuration working
- ✅ Backend and frontend starting correctly  
- ✅ Database seeding with test users functional
- ✅ HTTP-only cookie authentication confirmed working
- ✅ API endpoints responding correctly
- ✅ Auto-save functionality working in report editors
- ✅ Vertical navigation system with admin control
- ✅ Comprehensive internationalization (vi-VN/en-US)
- ✅ Enhanced accessibility features (WCAG 2.1 AA)

## Important Instructions for Claude Code

### Testing Commands (Use These!)
```bash
# E2E Testing
npx playwright test                    # Run all E2E tests
npx playwright test tests/e2e/auth.spec.ts --reporter=dot  # Auth tests only
npx playwright test --grep "login"     # Specific test pattern
npx playwright test --ui               # Debug with UI

# Backend Testing  
curl -X POST http://localhost:8945/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'

# Database Operations
cd server && npm run seed              # Seed Vietnamese data (cleans DB first)
```

### Seed Data System
Vietnamese-only seed with rich business report content:
- **8 departments**: Tài chính, Nhân sự, Vận hành, Kinh doanh, Marketing, Kỹ thuật, Hành chính, Pháp chế
- **11 users**: Vietnamese names, secretary + department roles
- **4 templates**: Hàng tháng, Quý, Tuần, Đặc biệt
- **5 reports**: Mixed states (DRAFT, FINAL, PUBLISHED) with rich markdown tables & analysis
- **Content files**: `seed.js` (runner) + `seed-content-vi.js` (markdown content)

### Test User Credentials
```javascript
const SEED_USERS = {
  admin: { username: 'admin', password: 'admin123', name: 'Nguyễn Văn An', role: 'secretary' },
  lead: { username: 'lead', password: '123123', name: 'Trần Thị Bích', role: 'secretary' },
  finance: { username: 'finance', password: '123123', name: 'Lê Hoàng Minh', dept: 'Phòng Tài chính' },
  hr: { username: 'hr', password: '123123', name: 'Phạm Thu Hương', dept: 'Phòng Nhân sự' },
  ops: { username: 'ops', password: '123123', name: 'Võ Đức Thành', dept: 'Phòng Vận hành' },
  sales: { username: 'sales', password: '123123', name: 'Nguyễn Thị Mai', dept: 'Phòng Kinh doanh' },
  marketing: { username: 'marketing', password: '123123', name: 'Đặng Quốc Việt', dept: 'Phòng Marketing' },
  tech: { username: 'tech', password: '123123', name: 'Hoàng Anh Tuấn', dept: 'Phòng Kỹ thuật' },
  admin_dept: { username: 'admin_dept', password: '123123', name: 'Bùi Thị Lan', dept: 'Phòng Hành chính' },
  legal: { username: 'legal', password: '123123', name: 'Trịnh Văn Hải', dept: 'Phòng Pháp chế' },
  department: { username: 'department', password: 'dept123', name: 'Nguyễn Văn Tài', dept: 'Phòng Tài chính' },
};
```

### Documentation Usage Guide

**For AI Agents and Developers:**
1. **Start with README-DEV.md** - Complete technical reference with API docs, database schema, and implementation details
2. **Use README-PRODUCT.md** - For understanding business logic, user journeys, and feature requirements  
3. **Reference LEARN.md** - For architecture education and understanding design decisions

**For Product Owners:**
- Focus on **README-PRODUCT.md** for business requirements, user stories, and feature specifications

**Documentation Update Process:**
- **Always push document updates to main branch**
- When making significant changes, update the relevant documentation in `.labs/` directory to keep AI agents and developers informed.

### Git Workflow
- **Main branch:** `main`
- **Author tag:** twinprime19_mbpclaude
- **Email:** github@lubox.net

### UI Consistency Guidelines

#### Button System
Use semantic button variants for consistent UX across all components:
- **View actions**: `variant="view"` (blue outline)
- **Edit actions**: `variant="edit"` (blue solid)
- **Export/Download**: `variant="export"` (green)
- **Delete actions**: `variant="delete"` (red)
- **Create actions**: `variant="create"` (primary)

**Example:**
```typescript
<Button variant="view" onClick={() => navigate(`/reports/${id}`)}>
  <Eye className="w-4 h-4 mr-2" /> View Report
</Button>
```

**Documentation**: See `.labs/README-DEV.md` > Semantic Button System for complete reference

### PDF Export System

The PDF export system has been refactored to use Puppeteer instead of Pandoc for better deployment compatibility and zero external dependencies.

**Key Files**:
- `/server/controllers/exportController.js` - Main PDF generation logic
- `/server/templates/pdfTemplate.html` - Professional HTML template for PDF styling

**Architecture**:
- **Engine**: Puppeteer (headless Chrome)
- **Template**: HTML/CSS for professional document styling
- **Images**: Base64 data URIs for encrypted image handling
- **Deployment**: Ubuntu-optimized browser flags, no external dependencies

**Usage**:
```bash
# Test PDF export
curl -X GET http://localhost:8945/api/reports/{id}/export/pdf \
  -H "Cookie: token=..." \
  -o test-report.pdf
```

**Troubleshooting**:
- If browser launch fails: Check disk space and verify Puppeteer installation
- If PDF generation times out: Verify Ubuntu flags and check server resources
- If images don't appear: Check file encryption and size limits (500KB per image)

---

## Quick Reference

### Port Configuration
- **Frontend**: 6234 (http://localhost:6234)
- **Backend**: 8945 (http://localhost:8945)

### Essential Commands
```bash
npm start          # Start both servers
npm stop           # Stop both servers
npm test           # Run unit tests
npx playwright test # Run E2E tests
cd server && npm run seed # Seed database
```

### Key Files
- `start-dev.cjs` - Development server startup script
- `stop-dev.cjs` - Development server cleanup script
- `.labs/README-DEV.md` - Primary technical documentation
- `.labs/README-PRODUCT.md` - Business requirements and user journeys
- `server/prisma/seed.js` - Database seeding with intelligent data handling