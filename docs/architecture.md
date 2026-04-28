# Report Fusion Hub - Architecture Guide

> **🟢 CURRENT DOCUMENTATION** - This is the official, up-to-date architecture reference.

**Version:** 1.0.0
**Last Updated:** 2026-01-22
**Status:** Production-Ready

> Comprehensive technical reference for developers and AI agents. Based on codebase analysis of 202 frontend files (36K LOC) and 44 backend files (9K LOC).

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Data Flow Patterns](#data-flow-patterns)
6. [Authentication & Authorization](#authentication--authorization)
7. [Database Design](#database-design)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Architecture Decision Records](#architecture-decision-records)

## System Overview

Report Fusion Hub follows **Clean Architecture + Domain-Driven Design** principles with clear separation of concerns across presentation, business logic, and data persistence layers.

```mermaid
flowchart TB
    subgraph Client["🌐 Client Layer"]
        Browser["End-User Browser"]
    end

    subgraph Frontend["⚛️ Frontend (React 18 + TypeScript)"]
        UI["shadcn/ui Components"]
        Pages["Page Components (16 routes)"]
        Hooks["Custom Hooks (11 hooks)"]
        Context["React Context (Auth/Language/Settings)"]
        RQ["React Query Cache"]
        BlockNote["BlockNote Editor"]
    end

    subgraph API["🚀 API Layer (Express.js)"]
        Routes["Route Handlers (12 files)"]
        Controllers["Controllers (10 files)"]
        Middleware["Auth & Validation Middleware"]
        Services["Business Services (4 files)"]
    end

    subgraph Security["🔒 Security Layer"]
        JWT["HTTP-only JWT Cookies"]
        RBAC["Role-Based Access Control"]
        FileEnc["AES-256-GCM File Encryption"]
        Validation["Zod Schema Validation"]
    end

    subgraph Data["💾 Data Layer"]
        Prisma["Prisma ORM"]
        PG[("PostgreSQL Database<br/>10 models | 13 migrations")]
        FileStore["Encrypted File Storage"]
    end

    subgraph External["🌍 External Services"]
        PDF["Puppeteer PDF Export"]
    end

    Browser <--> UI
    UI <--> Pages
    Pages <--> Hooks
    Hooks <--> Context
    Context <--> RQ
    Pages <--> BlockNote

    RQ <--> Routes
    Routes <--> Controllers
    Controllers <--> Middleware
    Controllers <--> Services
    Middleware <--> JWT
    Middleware <--> RBAC

    Services <--> Prisma
    Services <--> FileEnc
    Controllers <--> Validation
    Prisma <--> PG
    Services <--> FileStore

    Services <--> PDF
```

**Architecture Stats:**
- **Frontend**: 202 files, 36K LOC, 2700+ i18n translation keys
- **Backend**: 44 files, 9K LOC, 12 REST API route files
- **Database**: 10 Prisma models, 13 migrations, 163 seed records
- **Testing**: 17 E2E test suites, 70% coverage threshold

## Architecture Principles

### Clean Architecture Implementation
- **Dependency Inversion**: Business logic independent of frameworks
- **Separation of Concerns**: Each layer has single responsibility
- **Domain Isolation**: Business rules are framework-agnostic
- **Testable Design**: Easy dependency mocking for testing

### Domain-Driven Design Elements
- **Bounded Contexts**: Reports, Templates, Users, Departments
- **Aggregates**: Report contains ReportSections, TemplatePack contains Templates
- **Value Objects**: ReportState, UserRole, AccessLevel enums
- **Domain Services**: Workflow state management, auto-save coordination

## Frontend Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                   Frontend Layer (React 18)                     │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Presentation: shadcn/ui (45+ components) + Tailwind CSS  │  │
│ │ State: Context API + React Query + Custom Hooks          │  │
│ │ API: 8 service modules with typed endpoints              │  │
│ └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Organization

```
src/
├── pages/              # 16 route-level containers
├── components/         # 134 component files
│   ├── ui/             # 45+ shadcn/ui + custom components
│   │   ├── skeletons/  # Loading states (Dashboard, ReportEdit, Table, Form)
│   │   └── __tests__/  # Component unit tests
│   ├── layout/         # MainLayout, AppHeader, AppSidebar, Breadcrumbs
│   ├── auth/           # ProtectedRoute
│   ├── reports/        # 22 report-specific components
│   ├── admin/          # NavigationSettings
│   └── logic/          # DepartmentManager, SectionOperationsManager
├── contexts/           # 3 global providers (Auth, Language, GlobalSettings)
├── hooks/              # 11 custom React hooks
├── lib/api/            # 8 API service modules
├── types/              # 3 TypeScript definition files (489 LOC)
├── services/           # Shared report API service
└── routes/             # Route configuration
```

### State Management Flow

1. **Global Auth** (AuthContext) → User authentication, role-based access
2. **Global Language** (LanguageContext) → 2700+ i18n keys, vi-VN/en-US switching
3. **Global Settings** (GlobalSettingsContext) → Database-backed admin configuration
4. **Server State** (React Query) → API data caching, optimistic updates
5. **Local State** (useState/useReducer) → Component-specific state

**State Hierarchy:**
```typescript
<AuthProvider>              // Layer 1: Authentication
  <LanguageProvider>        // Layer 2: Internationalization
    <GlobalSettingsProvider> // Layer 3: Admin settings
      <QueryClientProvider>  // Layer 4: Server state
        <App />
      </QueryClientProvider>
    </GlobalSettingsProvider>
  </LanguageProvider>
</AuthProvider>
```

### API Service Layer

8 domain-specific service modules:
- `auth.ts` - Authentication operations
- `reports.ts` - Report CRUD operations
- `reportSectionApiService.ts` - Section-specific operations
- `userApiService.ts` - User management
- `departmentApiService.ts` - Department operations
- `templates.ts` - Template management
- `sharedReportApiService.ts` - External sharing
- `reportManagement.ts` - Unified report operations

**Base Client Features:**
- HTTP-only cookie authentication
- Automatic 401 redirect to login
- Error handling and transformation
- Download file handling
- Type-safe request/response

## Backend Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                Backend Layer (Express.js + Node.js 20)          │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Routes: 12 route files organizing API endpoints          │  │
│ │ Controllers: 10 business logic handlers                  │  │
│ │ Middleware: Auth (JWT), Validation (Zod), Error Handler  │  │
│ │ Services: 4 domain business logic services               │  │
│ │ Security: Role-based access, file encryption             │  │
│ └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Organization

```
server/
├── server.js                    # Entry point (121 LOC)
├── config/env.js                # Environment configuration
├── routes/                      # 12 route files
│   ├── auth.js                  # POST /api/login, GET /api/me, POST /api/logout
│   ├── reports.js               # Report CRUD
│   ├── sections.js              # Section operations
│   ├── export.js                # PDF generation
│   ├── upload.js                # File uploads
│   ├── reportImages.js          # Secure image serving
│   └── sharedReports.js         # Public sharing
├── controllers/                 # 10 controller files
│   ├── authController.js        # Authentication logic
│   ├── reportController.js      # Report orchestration (1023 LOC)
│   ├── sectionController.js     # Section workflow
│   ├── exportController.js      # PDF generation (432 LOC, Puppeteer)
│   └── sharedReportController.js # External sharing
├── services/                    # 4 service files
│   ├── reportService.js         # Core report business logic
│   ├── userService.js           # User management
│   ├── departmentService.js     # Department relationships
│   └── sharedReportService.js   # Sharing coordination
├── middleware/                  # 4 middleware files
│   ├── auth.js                  # JWT authentication & RBAC
│   ├── validation.js            # Zod schema validation
│   └── errorHandler.js          # Centralized error handling
├── prisma/
│   ├── schema.prisma            # Database schema (10 models)
│   ├── migrations/              # 13 migration files
│   └── seed.js                  # Intelligent seeding (163 records)
└── utils/                       # 6 utility files (encryption, validation)
```

### Middleware Stack (4 layers)

Request flow through middleware:
1. **Authentication** (`auth.js`) → Verify JWT from HTTP-only cookie
2. **Authorization** (RBAC) → Check user role and permissions
3. **Validation** (`validation.js`) → Zod schema validation
4. **Error Handling** (`errorHandler.js`) → Catch and format errors

## Data Flow Patterns

### Report Creation Flow

```mermaid
flowchart LR
    A[Template Selection] --> B[Report Creation]
    B --> C[Section Generation]
    C --> D[Department Assignment]
    D --> E[Workflow State: DRAFT]
    E --> F[Notification]
```

### Section Editing with Auto-Save

```mermaid
flowchart TB
    A[User Types] --> B{Change Detected?}
    B -->|Yes| C[Debounce 30s]
    B -->|No| A
    C --> D[Optimistic UI Update]
    D --> E[API Call PATCH /sections/:id]
    E -->|Success| F[Update Timestamp]
    E -->|Error| G[Retry with Exponential Backoff]
    G --> H[Show Error Toast]
    F --> I[Show "Saved" Indicator]
```

**Auto-Save Configuration:**
- Report details: 45 seconds
- Section content: 30 seconds
- Visual feedback: Timestamp + saved indicator
- Conflict resolution: Optimistic updates with rollback

### PDF Export Flow

```mermaid
flowchart LR
    A[Export Request] --> B[Fetch Report + Sections]
    B --> C[Decrypt Images]
    C --> D[Generate HTML Template]
    D --> E[Puppeteer Render]
    E --> F[Generate PDF]
    F --> G[Stream to Client]
```

**PDF Export Details:**
- Engine: Puppeteer (headless Chrome)
- Template: Professional HTML/CSS (`server/templates/pdfTemplate.html`)
- Images: Base64 data URIs (decrypted on-the-fly)
- Deployment: Ubuntu-optimized browser flags

## Authentication & Authorization

### Authentication Flow (JWT + HTTP-Only Cookies)

```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant API
    participant Database

    Client->>Frontend: Enter credentials
    Frontend->>API: POST /api/login
    API->>Database: Validate user (bcrypt)
    Database-->>API: User data
    API->>API: Generate JWT
    API-->>Frontend: Set HTTP-only cookie
    Frontend->>Frontend: Update AuthContext

    Note over Frontend,API: Subsequent requests
    Frontend->>API: API call (cookie auto-sent)
    API->>API: Verify JWT from cookie
    API->>API: Check role (RBAC)
    API-->>Frontend: Authorized response
```

### Role-Based Access Control Matrix

| Resource | Secretary (Admin) | Department (Creator) | External (Guest) |
|----------|-------------------|----------------------|------------------|
| **Reports** | CRUD all | Read own sections | Read shared only |
| **Templates** | CRUD all | Read only | None |
| **Users** | CRUD all | Read own profile | None |
| **Departments** | CRUD all | Read own | None |
| **Files** | Access all | Access own reports | None |
| **PDF Export** | All reports | Own sections | Shared content |

### Authorization Implementation

```javascript
// Middleware: server/middleware/auth.js
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// Role checking
const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};
```

## Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Report : creates
    User }|--|| Department : belongs_to
    Department ||--o{ ReportSection : owns

    Report ||--o{ ReportSection : contains
    Report }o--o| ReportTemplate : based_on

    ReportTemplate ||--o{ ReportTemplateSection : defines
    ReportTemplateSection }|--|| Department : assigned_to

    TemplatePack ||--o{ TemplatePackItem : contains
    TemplatePackItem }|--|| ReportTemplate : references

    Report ||--o{ SharedReportLink : shares
    SharedReportLink }|--|| User : created_by

    ReportSection ||--o{ ReportTemplateSection : instantiates
```

### 10 Core Prisma Models

1. **User** - Authentication and role management
2. **Department** - Organizational units with hierarchical relationships
3. **Report** - Main content entity with workflow states
4. **ReportSection** - Individual sections within reports
5. **ReportTemplate** - Reusable report structures
6. **ReportTemplateSection** - Sections within templates
7. **TemplatePack** - Collections of related templates
8. **TemplatePackItem** - Links templates to packs
9. **SharedReportLink** - Public sharing with access codes
10. **GlobalSetting** - Database-backed admin configuration

### Report Workflow State Machine

```
DRAFT → SUBMITTED → FINAL → PUBLISHED
  ↓         ↓         ↓         ↓
Delete   Reopen    Reopen    Archive
```

**State Transitions:**
- `DRAFT`: Secretary/Department can edit
- `SUBMITTED`: Awaiting review, no department edits
- `FINAL`: Review complete, ready for publishing
- `PUBLISHED`: Public/external access enabled

### Key Database Constraints

- **Foreign Keys**: Cascade delete for report sections
- **Unique Constraints**: Report template names, shared link access codes
- **Indexes**: Foreign keys, search fields (title, createdAt)
- **Soft Deletes**: `isDeleted` flags for audit trails
- **Timestamps**: `createdAt`, `updatedAt`, `submittedAt`

## Security Architecture

### 5-Layer Security Model

1. **Network Layer** - HTTPS, CORS, rate limiting
2. **Authentication Layer** - JWT with HTTP-only cookies
3. **Authorization Layer** - Role-based access control (RBAC)
4. **Application Layer** - Zod validation, SQL injection prevention
5. **Data Layer** - AES-256-GCM file encryption, bcrypt password hashing

### File Encryption System (AES-256-GCM)

```javascript
// Encryption: server/utils/encryption.js
const encryptBuffer = (plainBuffer) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
  const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]); // IV + AuthTag + Encrypted
};

// Decryption
const decryptBuffer = (encryptedBuffer) => {
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUFFER, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};
```

**File Security Features:**
- All uploads encrypted at rest (AES-256-GCM)
- Report-specific directory isolation
- MIME type validation (images only)
- 5MB file size limit
- Secure serving with department authorization
- Automatic deletion on report deletion (cascade)

### Security Best Practices

- ✅ HTTP-only cookies prevent XSS token theft
- ✅ Bcrypt password hashing (10 rounds)
- ✅ JWT expiration and refresh strategy
- ✅ Rate limiting on authentication endpoints
- ✅ CORS configuration for frontend origin
- ✅ Zod validation on all API inputs
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ File encryption at rest (AES-256-GCM)

## Deployment Architecture

### Local Development Setup

```bash
# Ports
Frontend: http://localhost:6234 (VITE_FRONTEND_PORT)
Backend:  http://localhost:8945 (PORT in server/.env)

# Start servers
node start-dev.cjs  # Starts both frontend and backend

# Database
PostgreSQL: Local or remote connection (DATABASE_URL)
```

### Production Setup (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                      CDN / Edge Network                         │
│                    (Static Assets Cache)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Frontend (Vite Build)                        │
│              Vercel / Netlify / Cloudflare Pages                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────────┐
│              Backend API (Node.js + Express)                    │
│                Railway / Render / Fly.io                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              PostgreSQL Database + File Storage                 │
│                     Supabase / Railway                          │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Variables

**Frontend (root .env):**
```bash
VITE_API_URL=http://localhost:8945
VITE_FRONTEND_PORT=6234
```

**Backend (server/.env):**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=256-bit-secret-key
FILE_ENCRYPTION_KEY=base64-encoded-32-byte-key
PORT=8945
FRONTEND_URL=http://localhost:6234
NODE_ENV=development
```

**Security Configuration:**
```bash
COOKIE_SECURE=true          # HTTPS-only cookies (production)
COOKIE_SAMESITE=strict      # CSRF protection
CORS_ORIGIN=https://app.com # Frontend origin
```

## Architecture Decision Records

### ADR-001: HTTP-Only Cookies for Authentication
**Decision**: Use HTTP-only cookies instead of localStorage for JWT storage
**Rationale**: Prevents XSS token theft, automatic CSRF protection with SameSite attribute, simpler client-side code
**Consequences**: Requires CORS configuration, complicates mobile app development (if needed)
**Status**: Implemented ✅

### ADR-002: AES-256-GCM for File Encryption
**Decision**: Encrypt all uploaded files at rest using AES-256-GCM
**Rationale**: Regulatory compliance (GDPR/data privacy), data protection, defense in depth
**Consequences**: Performance overhead on upload/download, key management complexity, backup considerations
**Status**: Implemented ✅

### ADR-003: React Query for Server State
**Decision**: Use React Query instead of Redux for server state management
**Rationale**: Built-in caching, automatic refetching, optimistic updates, smaller bundle size, better DX
**Consequences**: Learning curve for team, potential over-fetching, cache invalidation complexity
**Status**: Implemented ✅

### ADR-004: Prisma ORM with Code-First Migrations
**Decision**: Use Prisma with schema-first development and versioned migration files
**Rationale**: Type safety across stack, excellent DX, migration versioning, database-agnostic SQL generation
**Consequences**: Lock-in to Prisma ecosystem, migration management complexity in production
**Status**: Implemented ✅

### ADR-005: Puppeteer for PDF Export
**Decision**: Use Puppeteer (headless Chrome) instead of Pandoc for PDF generation
**Rationale**: Better deployment compatibility, zero external dependencies, professional styling with HTML/CSS, handles encrypted images
**Consequences**: Larger memory footprint, slower than native PDF libraries, requires Ubuntu browser flags
**Status**: Implemented ✅ (Replaced Pandoc on 2025-07-18)

### ADR-006: shadcn/ui Component Library
**Decision**: Use shadcn/ui (Radix UI primitives + Tailwind CSS) instead of Material-UI or Ant Design
**Rationale**: Copy-paste components (no npm bloat), full customization control, accessibility (Radix primitives), modern design
**Consequences**: Manual component updates, no pre-built complex components, setup overhead
**Status**: Implemented ✅

---

> **Status**: Architecture v1.0.0 complete with comprehensive auto-save, security, PDF export, and external sharing.
> **For AI Developers**: This document serves as the definitive technical specification. Reference `/docs/code-standards.md` for coding conventions and `/docs/functional-spec.md` for business requirements.
