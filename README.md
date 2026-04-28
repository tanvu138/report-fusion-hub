# Report Fusion Hub

Comprehensive web application for board-level report management with template-based generation, role-based workflows, rich text editing, PDF export, and external sharing.

## 📖 Documentation

**🎯 For Developers & AI Agents:**
- **[.labs/README-DEV.md](.labs/README-DEV.md)** - Complete technical reference (API docs, database schema, implementation details)
- **[docs/codebase-summary.md](docs/codebase-summary.md)** - Comprehensive codebase organization (334 files, 755K tokens analyzed)
- **[docs/code-standards.md](docs/code-standards.md)** - Coding conventions and patterns
- **[docs/system-architecture.md](docs/system-architecture.md)** - System architecture and design decisions

**📊 For Product Owners:**
- **[.labs/README-PRODUCT.md](.labs/README-PRODUCT.md)** - Business logic, user journeys, feature specifications
- **[docs/project-overview-pdr.md](docs/project-overview-pdr.md)** - Product Development Requirements
- **[docs/functional-spec.md](docs/functional-spec.md)** - Business requirements

**🎓 For Learning:**
- **[.labs/LEARN.md](.labs/LEARN.md)** - Architecture education and design decisions

## ✨ Key Features

- **Template-Based Reports:** Create reports from reusable templates with predefined sections
- **Role-Based Workflows:** Secretary (admin) and Department (content creator) roles with distinct permissions
- **Rich Text Editing:** BlockNote editor with markdown storage and image uploads (encrypted)
- **Auto-Save:** 45s for report details, 30s for section content with visual feedback
- **PDF Export:** Professional PDF generation via Puppeteer with encrypted image support
- **External Sharing:** Shareable links with access codes for stakeholders (no login required)
- **Multi-Language:** 2700+ translation keys (Vietnamese + English) with runtime switching
- **Accessibility:** WCAG 2.1 AA compliant with keyboard navigation and screen reader support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (tested with Node 20)
- Docker (for PostgreSQL)
- npm 9+ or yarn

### Installation

1. **Clone repository:**
   ```bash
   git clone <YOUR_GIT_URL>
   cd report-fusion-hub
   ```

2. **Start PostgreSQL with Docker:**
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
   This creates a persistent container. Manage it with:
   ```bash
   docker start report-fusion-hub-pg   # Start (after reboot/stop)
   docker stop report-fusion-hub-pg    # Stop
   docker logs report-fusion-hub-pg    # View logs
   ```
   > **Already have PostgreSQL running?** Skip this step and update `DATABASE_URL` in `.env` to point to your instance.

3. **Install dependencies:**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```
   > **Note:** `npm start` automatically installs missing or outdated dependencies, so this step is optional after the first setup.

4. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your values. The defaults work for the Docker setup above.

   Generate a file encryption key:
   ```bash
   openssl rand -base64 32
   ```

5. **Setup database (apply migrations + seed):**
   ```bash
   cd server
   npx prisma migrate deploy
   npm run seed
   cd ..
   ```

6. **Start development servers:**
   ```bash
   npm start
   ```
   - Backend: http://localhost:8945
   - Frontend: http://localhost:6234

### Default Users (After Seeding)

| Username    | Password  | Role       | Department |
|-------------|-----------|------------|------------|
| admin       | admin123  | secretary  | -          |
| lead        | 123123    | secretary  | Leadership |
| finance     | 123123    | department | Finance    |
| hr          | 123123    | department | HR         |
| ops         | 123123    | department | Operations |
| department  | dept123   | department | General    |

## 🛠️ Tech Stack

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + React Query
**Backend:** Node.js + Express + Prisma ORM + PostgreSQL
**Security:** JWT (HTTP-only cookies) + bcrypt + AES-256-GCM encryption
**Testing:** Vitest (unit/integration, 70% threshold) + Playwright (E2E)
**PDF Export:** Puppeteer (headless Chrome)

## 📚 Development Commands

### Development
```bash
node start-dev.cjs              # Start both frontend + backend
node stop-dev.cjs               # Stop dev servers (cleanup ports)
npm run dev                     # Frontend only
cd server && npm run dev        # Backend only
```

### Testing
```bash
npm test                        # Unit/integration tests
npm run test:coverage           # With coverage report (70% threshold)
npx playwright test             # E2E tests
npx playwright test --ui        # E2E with UI
```

### Code Quality
```bash
npm run lint                    # ESLint check
npm run format                  # Prettier formatting
npm run type-check              # TypeScript compilation check
```

### Database
```bash
cd server
npx prisma migrate dev          # Apply migrations
npx prisma generate             # Generate Prisma client
npm run seed                    # Seed database (163 records)
node prisma/extract-seed-data.js # Extract current DB state
npx prisma studio               # Database GUI
```

### Build
```bash
npm run build                   # Build frontend (dist/)
npm run preview                 # Preview production build
cd server && npm run build      # Build backend (if using TypeScript)
```

## 🏗️ Project Structure

```
report-fusion-hub/
├── src/                      # Frontend (202 files, ~36K LOC)
│   ├── components/           # 134 React components
│   │   ├── ui/               # 45+ shadcn/ui components
│   │   ├── reports/          # Report-specific (22 files)
│   │   ├── layout/           # MainLayout, AppHeader, AppSidebar
│   │   └── admin/            # Admin components
│   ├── pages/                # 16 route pages
│   ├── contexts/             # Auth, Language, GlobalSettings
│   ├── hooks/                # 11 custom hooks
│   ├── lib/api/              # 8 API service modules
│   └── types/                # TypeScript definitions
│
├── server/                   # Backend (44 files, ~9K LOC)
│   ├── controllers/          # 10 request handlers
│   ├── routes/               # 12 API route definitions
│   ├── services/             # 4 business logic services
│   ├── middleware/           # Auth, validation, error handling
│   ├── prisma/               # Database (10 models, 13 migrations)
│   │   └── seed-data/        # 163 extracted records
│   ├── utils/                # Encryption, passwords, logging
│   └── templates/            # PDF HTML template
│
├── tests/e2e/                # 17 Playwright test suites
├── docs/                     # Technical documentation
├── .labs/                    # Developer documentation (14 files)
└── .claude/                  # AI agent configurations
```

## 🔒 Security

- **Authentication:** JWT tokens in HTTP-only cookies (XSS protection)
- **Authorization:** Role-based access control (secretary vs department)
- **Encryption:** AES-256-GCM for uploaded files
- **Passwords:** bcrypt hashing (10 rounds)
- **Validation:** Zod schemas on all endpoints
- **CSRF Protection:** SameSite: Lax cookies
- **Input Sanitization:** SQL injection prevention via Prisma
- **File Upload:** Extension whitelist, 5MB limit, secure storage

## 🧪 Testing

**Coverage:** 70% threshold enforced (lines, branches, functions, statements)

**Test Suites:**
- Unit/Integration: Vitest with co-located specs
- E2E: 17 Playwright suites (auth, workflows, mobile, error handling)
- API: Supertest for endpoint validation

**Run Tests:**
```bash
npm test                      # All unit/integration tests
npm run test:e2e              # All E2E tests
npm run test:e2e:chromium     # E2E Chromium only (faster)
npm run test:e2e:ui           # E2E with UI debugger
```

## 📦 Database Schema

**10 Prisma Models:**
- User, Department (organizational structure)
- Report, ReportSection (main content entities)
- ReportTemplate, ReportTemplateSection (template system)
- TemplatePack, TemplatePackItem (template organization)
- SharedReportLink (external sharing)
- ReportImage (encrypted file uploads)
- GlobalSetting (admin-controlled config)

**Workflow States:**
- Report: DRAFT → FINAL → PUBLISHED
- Section: DRAFT → SUBMITTED

See [docs/db-models.md](docs/db-models.md) for detailed schema documentation.

## 🔌 API Endpoints

**Authentication:** `/api/login`, `/api/me`, `/api/logout`
**Reports:** `/api/reports/*` (CRUD, finalization, progress tracking)
**Sections:** `/api/reports/:id/sections/*` (content updates, submission)
**Files:** `/api/upload`, `/api/report-images/:reportId/:filename`
**Sharing:** `/api/reports/:reportId/share`, `/public/shared-reports/:shareId`
**Admin:** `/api/departments/*`, `/api/users/*`, `/api/templates/*`, `/api/admin/settings/*`

**API Spec:** [docs/openapi.yaml](docs/openapi.yaml) (OpenAPI 3.0)

## 🚢 Deployment

### Environment Variables (Production)

```bash
# Backend
NODE_ENV=production
PORT=8945
JWT_SECRET=<generated-secret>              # MUST change from default
JWT_EXPIRY=12h
DATABASE_URL=postgresql://...              # PostgreSQL connection string
FILE_ENCRYPTION_KEY=<openssl rand -base64 32>
FRONTEND_URL=https://yourdomain.com

# Frontend
VITE_API_URL=https://api.yourdomain.com
VITE_FRONTEND_PORT=6234
```

### Docker

```bash
docker-compose up -d                       # Start all services
docker-compose logs -f                     # View logs
docker-compose down                        # Stop services
```

### Health Check

```bash
curl http://localhost:8945/health
# Response: {"status":"ok","timestamp":"2026-01-19T..."}
```

## 🤝 Contributing

1. Read [.labs/README-DEV.md](.labs/README-DEV.md) for technical context
2. Check [docs/code-standards.md](docs/code-standards.md) for conventions
3. Run tests before committing (pre-commit hook enforces this)
4. Follow conventional commits format
5. Ensure 70% test coverage maintained

**Pre-commit checks:**
- ESLint passes
- TypeScript compiles
- Tests pass (unit + E2E Chromium)

## 📝 License

See LICENSE file for details.

## 📞 Support

- **Technical Docs:** [.labs/README-DEV.md](.labs/README-DEV.md)
- **Business Docs:** [.labs/README-PRODUCT.md](.labs/README-PRODUCT.md)
- **Architecture:** [docs/system-architecture.md](docs/system-architecture.md)
- **API Spec:** [docs/openapi.yaml](docs/openapi.yaml)

---

**Version:** 0.0.0 (Initial Development)
**Last Updated:** 2026-01-19
**Status:** Production-Ready (minor config fixes needed)
#   r e p o r t - f u s i o n - h u b  
 #   r e p o r t - f u s i o n - h u b  
 