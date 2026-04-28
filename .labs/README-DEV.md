# README-DEV.md - Technical Implementation Reference

> **Complete technical guide for developers and AI agents**  
> Everything needed to work effectively with this codebase  
> Last Updated: 2025-07-18

## TL;DR - System Essentials

**Purpose**: Corporate multi-department report aggregation system with real-time collaboration  
**Stack**: React 18 + TypeScript, Express.js + Prisma, PostgreSQL, JWT cookies, AES-256-GCM encryption  
**Data Flow**: Secretary creates templates → Departments fill sections → Auto-save + state transitions → Export DOCX  
**Entry Points**: `/login` (admin/admin123) → Role-based dashboard → Five editing modes  
**Key Pattern**: HTTP-only cookies, optimistic UI updates, encrypted file storage, section-based workflow  
**🎨 AI Dev Rule**: ALWAYS use semantic button variants (`view`, `edit`, `export`, `delete`, `create`) - never hardcode colors

---

## Quick Navigation

- [Development Setup](#development-setup)
- [API Reference](#api-reference-complete)
- [Database Schema](#database-schema-complete)
- [Authentication System](#authentication-implementation)
- [File System](#file-handling-security)
- [Frontend Architecture](#frontend-implementation)
- [Backend Architecture](#backend-implementation)
- [Design System](#unified-design-system)
- [Testing Guide](#testing-implementation)
- [Performance Optimization](#performance-implementation)
- [Common Tasks](#developer-workflows)

---

## Development Setup

### Prerequisites
```bash
# Required versions
node --version    # v20+
npm --version     # v9+
psql --version    # PostgreSQL 14+
```

### Environment Configuration
```bash
# Root .env file (single environment for monorepo)
DATABASE_URL="postgresql://user:password@localhost:5432/tpg_reports"
JWT_SECRET="your-256-bit-secret-key-here"
FILE_ENCRYPTION_KEY="base64-encoded-32-byte-encryption-key"
FRONTEND_URL="http://localhost:7428"
BACKEND_URL="http://localhost:8945"
NODE_ENV="development"
PORT=8945
```

### Start Development
```bash
# Option 1: Full stack (recommended)
npm start                    # Starts both frontend + backend
# or: node start-dev.cjs

# Option 2: Separate terminals (⚠️ NOT RECOMMENDED)
npm run dev                  # Frontend only (port 7428)
cd server && npm run dev     # Backend only (port 8945)

# Database setup
cd server
npx prisma migrate deploy    # Apply migrations (production)
# OR for development:
npx prisma migrate dev       # Apply migrations (development)
npm run seed                 # Intelligent seeding (uses extracted data if available)
node prisma/extract-seed-data.js  # Extract current database state for reproduction
npx prisma generate          # Generate client
```

### Test Credentials
```javascript
// Available in seeded database (comprehensive seed data system)
const testUsers = {
  // Secretary roles
  admin: { username: 'admin', password: 'admin123', name: 'Admin User' },
  lead: { username: 'lead', password: '123123', name: 'Leadership' },
  
  // Department roles
  finance: { username: 'finance', password: '123123', name: 'Finance Department' },
  hr: { username: 'hr', password: '123123', name: 'HR Department' },
  ops: { username: 'ops', password: '123123', name: 'Operations Department' },
  department: { username: 'department', password: 'dept123', name: 'Department User' }
};
```

### Development Commands
```bash
# Code Quality
npm run type-check          # TypeScript validation
npm run lint               # ESLint check  
npm run format            # Prettier formatting

# Testing
npm test                   # Unit tests (Vitest)
npm run test:coverage     # Coverage report (70% threshold)
npx playwright test       # E2E tests
npx playwright test --ui  # E2E with UI

# Database
npx prisma studio         # Database browser
npx prisma migrate reset  # Reset database
npm run generate:zod      # Generate Zod schemas (currently disabled)
```

---

## API Reference

> **📖 Complete API Documentation**: See [`/docs/openapi.yaml`](../docs/openapi.yaml) for comprehensive OpenAPI v3 specification with all endpoints, schemas, and examples.

### Quick API Overview

**Authentication**: HTTP-only JWT cookies (not Bearer tokens)
- POST `/api/login` - Authenticate with username/password
- GET `/api/me` - Get current user
- POST `/api/logout` - Clear session

**Core Resources**:
- `/api/reports` - Report CRUD operations
- `/api/reports/:id/sections` - Section management
- `/api/report-templates` - Template management
- `/api/template-packs` - Template pack operations
- `/api/users` - User administration (secretary only)
- `/api/departments` - Department management
- `/api/upload/report-images/:reportId` - Encrypted file uploads
- `/api/export/docx/:reportId` - DOCX export
- `/api/shared-reports` - External sharing

**Key Implementation Details**:
- All requests require HTTP-only cookie authentication
- Frontend must use `{ credentials: 'include' }` in fetch requests
- Role-based access control: secretary (admin) vs department (content creator)
- File uploads are encrypted with AES-256-GCM
- External sharing uses 6-digit cryptographic access codes

**For complete details including**:
- Full endpoint specifications with request/response schemas
- Authentication and security schemes
- Error response formats
- Example requests and responses
- Parameter validation rules

**→ See [`/docs/openapi.yaml`](../docs/openapi.yaml)**

### Base Configuration
```typescript
// API client configuration
const API_BASE = 'http://localhost:3001/api';
const defaultOptions = {
  credentials: 'include' as RequestCredentials,  // REQUIRED for cookies
  headers: {
    'Content-Type': 'application/json',
  }
};
```
// Clears HTTP-only cookie
// Always returns 200 (even if no cookie present)
```

### Report Management Endpoints

#### `GET /api/reports`
```typescript
// Query parameters
interface ReportFilters {
  status?: 'DRAFT' | 'FINAL' | 'PUBLISHED';
  cycle?: 'WEEKLY' | 'MONTHLY' | 'ADHOC';
  department?: string;     // Department filter for non-secretary users
  limit?: number;          // Pagination limit (default: 50)
  offset?: number;         // Pagination offset
}

// Response
interface ReportListResponse {
  data: Report[];
  total: number;
  hasMore: boolean;
}

// Role-based filtering: server/controllers/reportController.js:45-120
// Secretary: sees all reports
// Department: sees only reports with their sections
```

#### `POST /api/reports`
```typescript
// Create new report
interface CreateReportRequest {
  title: string;
  description?: string;
  cycle: 'WEEKLY' | 'MONTHLY' | 'ADHOC';
  templateId?: string;     // Optional: create from template
  dueAt?: string;          // ISO date string
}

// Response: Created report object
// Implementation: server/controllers/reportController.js:125-210
// Auto-creates sections if templateId provided
```

#### `GET /api/reports/:id`
```typescript
// Returns complete report with sections
// Includes: report metadata + all active sections + department info
// Implementation: server/controllers/reportController.js:215-280
```

#### `PUT /api/reports/:id`
```typescript
// Update report metadata
interface UpdateReportRequest {
  title?: string;
  description?: string;
  cycle?: 'WEEKLY' | 'MONTHLY' | 'ADHOC';
  state?: 'DRAFT' | 'FINAL' | 'PUBLISHED';  // State transitions
  dueAt?: string;
}

// Business rule: Only forward state transitions allowed
// Implementation: server/controllers/reportController.js:285-350
```

#### `DELETE /api/reports/:id`
```typescript
// Soft delete (sets isDeleted: true)
// Secretary only operation
// Cascades to sections via Prisma onDelete: Cascade
```

### Report Section Endpoints

#### `GET /api/reports/:reportId/sections`
```typescript
// Returns sections with filtering based on user role
// Secretary: all sections
// Department: only their assigned sections
// Implementation: server/controllers/sectionController.js:25-89
```

#### `PUT /api/reports/:reportId/sections/:sectionId`
```typescript
// Update section content and state
interface UpdateSectionRequest {
  contentMarkdown?: string;
  state?: 'DRAFT' | 'SUBMITTED';
  instructions?: string;    // Secretary only
  isActive?: boolean;       // Secretary only
}

// Auto-save endpoint: called every 30 seconds
// Implementation: server/controllers/sectionController.js:95-180
// Includes optimistic concurrency control
```

#### `POST /api/reports/:reportId/sections/:sectionId/upload`
```typescript
// File upload with encryption
// Content-Type: multipart/form-data
// Field name: 'file'
// Supported: images (jpg, png, gif, webp)
// Max size: 10MB per file

// Response
interface UploadResponse {
  message: string;
  fileUrl: string;    // Encrypted file path for markdown inclusion
}

// Implementation: server/routes/upload.js:15-95
// Files stored: secure_uploads/report_images/{reportId}/{encrypted_filename}
```

### Template Management (Secretary Only)

#### `GET /api/templates`
```typescript
// Returns all report templates
// Includes: template metadata + sections + department assignments
```

#### `POST /api/templates`
```typescript
interface CreateTemplateRequest {
  name: string;
  description?: string;
  sections: Array<{
    sectionName: string;
    instructions?: string;
    departmentId: string;
    displayOrder: number;
  }>;
}
```

### User Management (Secretary Only)

#### `GET /api/users`
```typescript
// Returns all users with department information
// Implementation: server/controllers/userController.js:25-65
```

#### `POST /api/users`
```typescript
interface CreateUserRequest {
  username: string;        // Unique identifier for login
  name: string;           // Display name
  email?: string;         // Optional, unique if provided
  password: string;       // Plain text (hashed by bcrypt)
  role: 'secretary' | 'department';
  departmentId?: string;  // Required for department role
}
```

### Department Management (Secretary Only)

#### `GET /api/departments`
#### `POST /api/departments`
#### `PUT /api/departments/:id`
#### `DELETE /api/departments/:id`

### External Sharing

#### `POST /api/reports/:id/share`
```typescript
interface CreateShareRequest {
  accessLevel: 'VIEW' | 'COMMENT';
  expiresAt?: string;     // ISO date, default: 30 days
}

// Response
interface ShareResponse {
  code: string;           // 6-digit alphanumeric code
  accessLevel: string;
  expiresAt: string;
  shareUrl: string;       // Complete URL for external access
}

// Implementation: server/controllers/sharedReportController.js:25-120
// Creates snapshot JSON of report at time of sharing
```

#### `GET /api/shared/:code`
```typescript
// Public endpoint (no authentication required)
// Returns report snapshot based on 6-digit code
// Implementation: server/controllers/sharedReportController.js:125-180
```

### Export Functionality

#### `GET /api/reports/:id/export/pdf`
```typescript
// Generates and returns PDF file using Puppeteer
// Content-Type: application/pdf
// Implementation: server/controllers/exportController.js:114-334
// Architecture: Puppeteer (headless Chrome) + HTML template + base64 images
// Features: Encrypted image handling, size optimization, Ubuntu deployment ready
```

**🎯 PDF Export Architecture**:
- **Engine**: Puppeteer (headless Chrome) - replaced Pandoc for zero dependencies
- **Template**: HTML/CSS template (`server/templates/pdfTemplate.html`) for professional styling
- **Images**: Base64 data URIs for encrypted images (500KB per image limit)
- **Deployment**: Ubuntu-optimized browser flags, no external dependencies
- **Error Handling**: Comprehensive cleanup, size validation, memory management

**📊 Key Features**:
- **Zero Dependencies**: No LaTeX, Pandoc, or external tools required
- **Encrypted Images**: Automatic decryption and base64 embedding
- **Size Limits**: 10MB content limit, 500KB per image for PDF optimization
- **Professional Layout**: A4 format with proper margins and typography
- **Error Recovery**: Browser cleanup, timeout handling, resource management

---

## Database Schema

> **📖 Complete Database Reference**: See [`/docs/db-models.md`](../docs/db-models.md) for comprehensive schema documentation, relationships, and query patterns.

### Intelligent Seed Data System

The database now uses a comprehensive seeding system that preserves development state:

**🔄 How It Works**:
- **Extracted Data**: If `server/prisma/seed-data/` exists, seeds from real development data
- **Default Fallback**: Uses hardcoded defaults if no extracted data found
- **State Preservation**: Captures exact database state including Vietnamese content
- **Team Sync**: Share extracted data for consistent development environments

**📊 Current Data**: 163 records extracted including:
- 14 departments (including multi-language support)
- 16 users with proper credentials
- 11 report templates with 57 sections
- 11 reports with 48 sections
- Multi-language content support (Vietnamese: "Phần chung. Không department nào cả.")

**🛠️ Commands**:
```bash
npm run seed                        # Intelligent seeding (uses extracted data if available)
node server/prisma/extract-seed-data.js  # Extract current DB state to JSON files
```

### Quick Schema Overview

**Core Entities**:
- **User** (authentication + roles) → **Department** (organizational units)
- **ReportTemplate** + **ReportTemplateSection** → **Report** + **ReportSection** (template-instance pattern)
- **TemplatePack** → **TemplatePackItem** (organized template collections)
- **SharedReportLink** (external sharing with snapshots)

**Key Relationships**:
- Template-to-Report instantiation with section generation
- Department-based content ownership and access control
- State machine workflows: Reports (DRAFT→FINAL→PUBLISHED), Sections (DRAFT→SUBMITTED)
- Secure external sharing with cryptographic access codes

**For complete details including**:
- Full entity relationship diagrams
- Detailed field specifications and constraints
- Business rules and cascade behaviors
- Common query patterns and indexes
- Migration history and future considerations

**→ See [`/docs/db-models.md`](../docs/db-models.md)**

#### Reports (`Report`)
```sql
-- Main report instances
id          String      PRIMARY KEY (cuid)
title       String      NOT NULL
description String      NULL
cycle       ReportCycle NOT NULL           -- WEEKLY|MONTHLY|ADHOC
dueAt       DateTime    NULL
state       ReportState DEFAULT 'DRAFT'    -- DRAFT|FINAL|PUBLISHED
finalizedAt DateTime    NULL
isDeleted   Boolean     DEFAULT false
templateId  String      NULL REFERENCES ReportTemplate(id)
createdById String      NULL REFERENCES User(id)
createdAt   DateTime    DEFAULT now()
updatedAt   DateTime    UPDATED
```

#### Report Sections (`ReportSection`)
```sql
-- Individual sections within reports
id                      String      PRIMARY KEY (cuid)
reportId                String      NOT NULL REFERENCES Report(id) CASCADE
sectionName             String      NOT NULL
instructions            Text        NULL
departmentId            String      NOT NULL REFERENCES Department(id)
state                   SectionState DEFAULT 'DRAFT'  -- DRAFT|SUBMITTED
dueAt                   DateTime    NULL
displayOrder            Int         DEFAULT 0
locked                  Boolean     DEFAULT false
isActive                Boolean     DEFAULT true
contentMarkdown         Text        NULL
submittedAt             DateTime    NULL
updatedById             String      NULL REFERENCES User(id)
reportTemplateSectionId String      NULL REFERENCES ReportTemplateSection(id)
updatedAt               DateTime    UPDATED

UNIQUE(reportId, displayOrder)
```

### Enums
```typescript
enum UserRole {
  secretary = 'secretary',     // Full system access
  department = 'department'    // Section editing only
}

enum ReportCycle {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ADHOC = 'ADHOC'
}

enum ReportState {
  DRAFT = 'DRAFT',           // Editable, sections can be modified
  FINAL = 'FINAL',           // Locked, no section changes
  PUBLISHED = 'PUBLISHED'    // Read-only, external sharing enabled
}

enum SectionState {
  DRAFT = 'DRAFT',           // Department can edit
  SUBMITTED = 'SUBMITTED'    // Department submitted, secretary review
}
```

### Critical Business Rules

#### State Transitions (One-Way Only)
```typescript
// Report state machine: server/controllers/reportController.js:calculateReportStatus()
const validTransitions = {
  DRAFT: ['FINAL'],
  FINAL: ['PUBLISHED'],
  PUBLISHED: []  // Terminal state
};

// Section state machine
const sectionTransitions = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: []  // Terminal state (secretary can reset via manual update)
};
```

#### Report Status Calculation
```typescript
// Implementation: server/controllers/reportController.js:450-480
function calculateReportStatus(sections: ReportSection[]): ReportState {
  const activeSections = sections.filter(s => s.isActive);
  
  if (activeSections.some(s => s.state === 'DRAFT')) {
    return 'DRAFT';  // Any draft section = draft report
  }
  
  if (activeSections.every(s => s.state === 'SUBMITTED')) {
    return 'FINAL';  // All submitted = ready for final
  }
  
  return 'DRAFT';  // Default fallback
}
```

### Database Indexes
```sql
-- Performance-critical indexes
CREATE INDEX idx_reports_creator_state ON Report(createdById, state);
CREATE INDEX idx_sections_report_department ON ReportSection(reportId, departmentId);
CREATE INDEX idx_sections_department_state ON ReportSection(departmentId, state);
CREATE INDEX idx_shared_links_code ON SharedReportLink(codeHash);
CREATE INDEX idx_users_username ON User(username);
CREATE INDEX idx_users_department ON User(departmentId);
```

---

## Authentication Implementation

### Cookie-Based JWT Architecture
```typescript
// Why HTTP-only cookies vs localStorage/headers?
// ✅ XSS protection (JavaScript cannot access)
// ✅ Automatic inclusion in requests
// ✅ CSRF protection with SameSite
// ❌ Complicates mobile app development
// ❌ Requires CORS configuration
```

### Login Flow (Step-by-Step)
```typescript
// 1. Client submission: src/pages/Login.tsx:89-120
const loginResponse = await fetch('/api/login', {
  method: 'POST',
  credentials: 'include',  // CRITICAL: sends cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

// 2. Server validation: server/controllers/authController.js:25-89
const user = await prisma.user.findUnique({
  where: { username: username.toLowerCase() }  // Case-insensitive lookup
});

const isValid = await bcrypt.compare(password, user.password);
if (!isValid) throw new Error('Invalid credentials');

// 3. JWT generation and cookie setting
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '12h' }
);

res.cookie('token', token, {
  httpOnly: true,     // XSS protection
  secure: NODE_ENV === 'production',
  sameSite: 'lax',    // CSRF protection
  maxAge: 12 * 60 * 60 * 1000  // 12 hours
});

// 4. Frontend auth context update: src/contexts/AuthContext.tsx:45-89
setUser(response.user);
setIsAuthenticated(true);
```

### Route Protection
```typescript
// Backend middleware: server/middleware/auth.js:15-89
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Frontend route protection: src/components/auth/ProtectedRoute.tsx:15-45
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};
```

### Role-Based Access Control (RBAC)
```typescript
// Middleware implementation: server/middleware/auth.js:95-145
const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Usage in routes: server/routes/users.js:15-25
router.get('/', authenticateToken, requireRole('secretary'), getUserList);
router.post('/', authenticateToken, requireRole('secretary'), createUser);

// Frontend role checking: src/hooks/useAuth.ts:25-45
const useRequireRole = (requiredRole: UserRole) => {
  const { user } = useAuth();
  return user?.role === requiredRole;
};
```

---

## File Handling & Security

### Encryption Implementation
```typescript
// File encryption: server/utils/encryptionUtils.js:15-89
const IV_LENGTH = 16;  // AES-256-GCM IV length
const TAG_LENGTH = 16; // Authentication tag length

const encryptBuffer = (plainBuffer: Buffer): Buffer => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plainBuffer),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Format: [IV][AuthTag][EncryptedData]
  return Buffer.concat([iv, authTag, encrypted]);
};

const decryptBuffer = (encryptedBuffer: Buffer): Buffer => {
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = encryptedBuffer.subarray(IV_LENGTH + TAG_LENGTH);
  
  const decipher = crypto.createDecipherGCM('aes-256-gcm', KEY_BUFFER, iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
};
```

### File Upload Flow
```typescript
// 1. Frontend upload: src/hooks/useFileUpload.ts:25-89
const uploadFile = async (file: File, reportId: string) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`/api/reports/${reportId}/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData  // No Content-Type header - let browser set it
  });
  
  return response.json();
};

// 2. Backend processing: server/routes/upload.js:25-95
const storage = multer.memoryStorage();  // Keep in memory for encryption
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

router.post('/reports/:reportId/upload', 
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    const { reportId } = req.params;
    const { buffer, originalname, mimetype } = req.file;
    
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const filename = `file-${timestamp}-${random}${path.extname(originalname)}`;
    
    // Encrypt and save
    const encryptedBuffer = encryptBuffer(buffer);
    const filePath = path.join(
      __dirname, '..', 'secure_uploads', 'report_images', 
      reportId, filename
    );
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, encryptedBuffer);
    
    res.json({
      message: 'File uploaded successfully',
      fileUrl: `/api/images/${reportId}/${filename}`
    });
  }
);
```

### Secure File Serving
```typescript
// Image serving with decryption: server/routes/reportImages.js:15-89
router.get('/images/:reportId/:filename', 
  authenticateToken,
  async (req, res) => {
    const { reportId, filename } = req.params;
    
    // 1. Verify user has access to this report
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        OR: [
          { createdById: req.user.userId },  // Creator access
          { 
            sections: {
              some: { 
                departmentId: req.user.departmentId  // Department access
              }
            }
          }
        ]
      }
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // 2. Read and decrypt file
    const filePath = path.join(
      __dirname, '..', 'secure_uploads', 'report_images',
      reportId, filename
    );
    
    const encryptedBuffer = await fs.readFile(filePath);
    const decryptedBuffer = decryptBuffer(encryptedBuffer);
    
    // 3. Serve with appropriate headers
    const mimeType = mime.lookup(filename) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(decryptedBuffer);
  }
);
```

### Directory Structure
```
secure_uploads/
└── report_images/
    ├── {reportId1}/
    │   ├── file-1234567890-123456.jpg  (encrypted)
    │   └── file-1234567890-789012.png  (encrypted)
    └── {reportId2}/
        └── file-1234567890-345678.gif  (encrypted)
```

---

## ✅ Report Management System - Current Architecture Status

### **Major Refactoring Successfully Completed** 

**Status Update**: The critical UX/UI issues previously identified have been successfully resolved through comprehensive refactoring. The Report Management system now features a modern, unified architecture.

### **✅ Completed Improvements**

#### **1. Modern Header & Layout System** ✅ **IMPLEMENTED**
*Components: `ReportHeader.tsx`, `CollapsibleReportDetailsPanel.tsx`, `ReportActionToolbar.tsx`*

**Achievements**:
- **Clean visual hierarchy** with proper typography and responsive design
- **Progressive disclosure** for report details (collapsed by default)
- **Organized action toolbar** with primary/secondary button distinction
- **Mobile-first responsive design** with touch-friendly targets

```typescript
// Current implementation: Clean, modern header structure
<ReportHeader
  title={report.title}
  subtitle={user.role === 'secretary' ? 'Manage Report Sections' : 'Edit Your Sections'}
  reportId={id!}
  user={user}
  onBackClick={() => navigate('/dashboard')}
  onShareClick={() => setShareDialogOpen(true)}
/>

<CollapsibleReportDetailsPanel
  defaultExpanded={false}  // Progressive disclosure implemented
  autoSaveStatus={{
    isSaving: reportDetailsAutoSave.isSaving,
    hasUnsavedChanges: reportDetailsAutoSave.hasUnsavedChanges,
    lastSaved: reportDetailsAutoSave.lastSaved
  }}
/>
```

#### **2. Unified Preview System** ✅ **IMPLEMENTED**
*Components: `UnifiedReportPreview.tsx`, `PreviewModeSelector.tsx`, `UnifiedReportPreviewPage.tsx`*

**Achievements**:
- **Single component architecture** replacing fragmented preview system
- **Mode-based rendering** with consistent state management
- **URL state persistence** for mode selection
- **Role-based access control** with proper permission handling

```typescript
// Current implementation: Unified preview with mode switching
export type PreviewMode = 'view' | 'edit' | 'full-edit';

const UnifiedReportPreview: React.FC<UnifiedReportPreviewProps> = ({
  mode = 'view',
  onModeChange,
  showModeSelector = true,
  // ... other props
}) => {
  // Single component handles all preview modes
  // Mode-specific rendering with proper state management
  // Inline editing capabilities with save/cancel functionality
};
```

#### **3. Enhanced User Experience** ✅ **IMPLEMENTED**
*Features: Role-based UI, responsive design, auto-save integration*

**Achievements**:
- **Role-based interface adaptation** for secretary vs department users
- **Responsive tabs interface** for department users with section status badges
- **Auto-save integration** maintained across all interfaces (45s for reports, 30s for sections)
- **Clean separation of concerns** between different user workflows

### **📊 Current System Architecture**

#### **Global Settings System** ✅ **IMPLEMENTED**
*Features: Admin-controlled global settings with database persistence*

**Implementation**:
```typescript
// Global settings management: src/utils/globalSettings.ts
export interface GlobalSetting {
  key: string;
  value: string;
  category: 'navigation' | 'ui' | 'features';
  description?: string;
}

// Context for app-wide settings: src/contexts/GlobalSettingsContext.tsx
export const GlobalSettingsContext = createContext<{
  settings: Record<string, string>;
  updateSetting: (key: string, value: string) => Promise<void>;
  loading: boolean;
}>();

// Admin control interface: src/components/admin/NavigationSettings.tsx
export const NavigationSettings: React.FC = () => {
  // Toggle between 'horizontal' and 'vertical' navigation
  // Real-time updates affect all users immediately
  // Database persistence via /api/admin/settings endpoints
};
```

**Database Schema**:
```sql
-- server/prisma/schema.prisma
model GlobalSetting {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  category    String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### **Vertical Navigation System** ✅ **IMPLEMENTED**
*Features: Collapsible sidebar with keyboard shortcuts and accessibility*

**Implementation**:
```typescript
// Main sidebar component: src/components/layout/AppSidebar.tsx
export const AppSidebar: React.FC = () => {
  // Using shadcn/ui sidebar primitives
  // Keyboard shortcuts: ⌘B/Ctrl+B for toggle
  // ARIA landmarks and screen reader support
  // Responsive mobile behavior with sheet overlay
};

// Layout integration: src/components/layout/MainLayout.tsx
export const MainLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Conditional rendering based on global navigation_type setting
  // Proper overflow handling for sidebar content
  // Accessibility skip links and focus management
};
```

**Features**:
- **Admin Control**: Global toggle via `/admin/navigation-settings`
- **Keyboard Shortcuts**: ⌘B/Ctrl+B to toggle sidebar
- **Accessibility**: WCAG 2.1 AA compliance with proper ARIA labels
- **Responsive Design**: Mobile sheet overlay, desktop collapsible sidebar
- **Persistence**: Database-backed settings with immediate app-wide updates

#### **Enhanced DocumentPreview System** ✅ **IMPLEMENTED**
*Features: PDF viewer-style interface with navigation and view modes*

#### **Dify AI Chatbot Integration** ✅ **IMPLEMENTED**
*Features: AI writing assistance with user session isolation*

**Implementation**:
```typescript
// Chatbot component: src/components/reports/DifyChatbot.tsx
export const DifyChatbot: React.FC<DifyChatbotProps> = ({
  userId,
  reportId,
  conversationId,
  onChatSessionChange
}) => {
  // User session isolation for security
  // Integration with QuickEditPreview for text editing assistance
  // Configuration via environment variables
};

// Test component: src/components/reports/DifyChatbotTest.tsx
export const DifyChatbotTest: React.FC = () => {
  // Testing interface for chatbot functionality
  // Will be removed after testing is complete
};
```

**Environment Configuration**:
```bash
# Dify chatbot configuration
DIFY_API_KEY="your-dify-api-key"
DIFY_API_BASE_URL="https://api.dify.ai"
DIFY_APP_ID="your-app-id"
```

**Features**:
- **User Session Isolation**: Critical security feature preventing chat session cross-contamination
- **Context-Aware Assistance**: Integrated with report editing workflows
- **Secure Configuration**: Environment-based API key management
- **Testing Framework**: Dedicated test component for validation

#### **Enhanced Report Section Management** ✅ **IMPLEMENTED**
*Features: Bulk updates and improved error handling*

**Implementation**:
```typescript
// Enhanced section management with bulk operations
export const SectionManagement: React.FC = () => {
  // Bulk update functionality for multiple sections
  // Improved error handling and validation
  // Progress tracking for bulk operations
};
```

**Features**:
- **Bulk Updates**: Process multiple sections simultaneously
- **Error Recovery**: Robust error handling with retry mechanisms
- **Progress Tracking**: Real-time feedback for bulk operations
- **Validation**: Enhanced data validation before processing

#### **Overdue Alerts System** ✅ **IMPLEMENTED**
*Features: Real-time notifications for late reports*

**Implementation**:
```typescript
// Overdue alert functionality: src/components/reports/OverdueAlerts.tsx
export const OverdueAlerts: React.FC = () => {
  // Real-time monitoring of report deadlines
  // Automated notification system
  // Department-specific alert filtering
};
```

**Features**:
- **Real-time Monitoring**: Continuous deadline tracking
- **Automated Notifications**: Proactive alert system
- **Department Filtering**: Role-based alert visibility
- **Escalation Logic**: Progressive notification intensity

#### **Activity Feed System** ✅ **IMPLEMENTED**
*Features: Mobile-optimized progress tracking*

**Implementation**:
```typescript
// Activity feed: src/components/dashboard/ActivityFeed.tsx
export const ActivityFeed: React.FC = () => {
  // Mobile-optimized interface
  // Real-time activity updates
  // Progress tracking visualization
};
```

**Features**:
- **Mobile Optimization**: Touch-friendly interface design
- **Real-time Updates**: Live activity streaming
- **Progress Visualization**: Clear progress indicators
- **Filtering**: Activity type and date filtering

#### **Analytics Dashboard** ✅ **IMPLEMENTED**
*Features: Export functionality for usage metrics*

**Implementation**:
```typescript
// Analytics section: src/components/dashboard/AnalyticsSection.tsx
export const AnalyticsSection: React.FC = () => {
  // Usage metrics collection and display
  // Export functionality for reports
  // Visual analytics dashboard
};
```

**Features**:
- **Usage Metrics**: Comprehensive system usage tracking
- **Export Functionality**: CSV/PDF export capabilities
- **Visual Dashboard**: Charts and graphs for data visualization
- **Custom Reports**: Configurable analytics reports

#### **Unsaved Changes Handling** ✅ **IMPLEMENTED**
*Features: Improved user experience with data protection*

**Implementation**:
```typescript
// Unsaved changes handling: src/components/reports/QuickEditPreview.tsx
export const QuickEditPreview: React.FC = () => {
  // Automatic detection of unsaved changes
  // User prompts before navigation
  // Data recovery mechanisms
};
```

**Features**:
- **Change Detection**: Automatic tracking of form modifications
- **Navigation Protection**: Prevent accidental data loss
- **Recovery Mechanisms**: Restore unsaved changes on return
- **User Prompts**: Clear warnings before data loss

**Implementation**:
```typescript
// Professional document presentation: src/components/reports/preview/DocumentPreview.tsx
export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  report,
  sections,
  viewMode = 'continuous'
}) => {
  // Multiple view modes: continuous, pages, sections, compact
  // Reading progress indicator with real-time tracking
  // Keyboard navigation (arrow keys, page up/down)
  // Print-optimized styling with professional typography
};

// Navigation component: src/components/reports/preview/DocumentNavigation.tsx
export const DocumentNavigation: React.FC = () => {
  // Table of contents with section jump navigation
  // Collapsible sidebar for mobile support
  // Current section tracking based on scroll position
  // Smooth scrolling between sections
};
```

**Features**:
- **View Modes**: Continuous, pages, sections, compact display
- **Navigation**: Table of contents with jump-to-section functionality
- **Progress Tracking**: Real-time reading progress indicator
- **Keyboard Support**: Arrow keys and page navigation
- **Print Optimization**: Professional document styling

#### **Comprehensive Internationalization** ✅ **IMPLEMENTED**
*Features: Full Vietnamese/English support with runtime switching*

**Implementation**:
```typescript
// Language context: src/contexts/LanguageContext.tsx
export const LanguageContext = createContext<{
  language: 'vi-VN' | 'en-US';
  setLanguage: (lang: 'vi-VN' | 'en-US') => void;
  t: (key: string, params?: Record<string, string>) => string;
}>();

// Translation hook: src/hooks/useLanguage.ts
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  return context; // Provides t() function and language state
};
```

**Coverage**:
- **1000+ Translation Keys**: Complete interface coverage
- **Business Terminology**: Proper Vietnamese business translations
- **Runtime Switching**: No page refresh required
- **Persistence**: User preference stored in localStorage
- **Context-Aware**: Variable substitution and pluralization

#### **Report Management Routes**
```typescript
// Available routes in src/App.tsx
const routes = [
  '/reports/:id',                    // ReportEdit - Management interface
  '/reports/:id/preview',            // ReportPreview - Legacy standard
  '/reports/:id/preview2',           // ReportPreview2 - Legacy enhanced  
  '/reports/:id/unified-preview',    // NEW: UnifiedReportPreviewPage (recommended)
  '/reports/:id/edit-full',          // Full document editing
  '/reports/:id/edit-markdown',      // Section-specific editing
];
```

#### **Component Hierarchy**
```
src/components/reports/
├── ✅ ReportHeader.tsx              # Modern header with responsive design
├── ✅ ReportActionToolbar.tsx       # Organized action buttons with dropdowns
├── ✅ CollapsibleReportDetailsPanel.tsx # Progressive disclosure editing
├── ✅ UnifiedReportPreview.tsx      # Single component for all preview modes
├── ✅ PreviewModeSelector.tsx       # Mode switching interface
├── 📄 FullReportPreview.tsx        # Legacy - can be deprecated
├── 📄 FullReportPreview2.tsx       # Legacy - can be deprecated
└── 🔧 SectionDisplay.tsx           # Shared section rendering
```

#### **Preview Mode System**
```typescript
// Three distinct modes with clear purposes
type PreviewMode = 'view' | 'edit' | 'full-edit';

// Mode capabilities by user role
const modeAccess = {
  secretary: ['view', 'edit', 'full-edit'],     // Full access
  department: ['view', 'edit'],                 // Limited access
  external: ['view']                            // Read-only
};
```

### **🎯 Legacy Component Status**

#### **Can Be Deprecated** 📦
- **FullReportPreview.tsx** and **FullReportPreview2.tsx** - Functionality replaced by UnifiedReportPreview
- Consider gradual migration plan if these components are still in use

#### **Legacy Routes** 🔄
- **ReportPreview.tsx** and **ReportPreview2.tsx** - Could migrate to use UnifiedReportPreview internally
- Maintain backward compatibility while encouraging unified-preview adoption

### **📈 Success Metrics Achieved**

#### **User Experience Improvements**:
- ✅ **Clean visual hierarchy** - Proper typography and spacing implemented
- ✅ **Intuitive mode selection** - PreviewModeSelector provides clear options
- ✅ **Progressive disclosure** - Report details collapsed by default
- ✅ **Responsive design** - Mobile-first approach with touch targets
- ✅ **Vertical navigation** - Maximized screen real estate for content
- ✅ **Enhanced accessibility** - WCAG 2.1 AA compliance with proper ARIA labels
- ✅ **Multilingual support** - Full Vietnamese/English with runtime switching
- ✅ **Professional document viewing** - PDF viewer-style interface
- ✅ **Overdue alerts system** - Real-time notifications for late reports
- ✅ **Activity feed** - Mobile-optimized progress tracking
- ✅ **Analytics dashboard** - Export functionality for usage metrics
- ✅ **AI writing assistance** - Dify chatbot integration for content editing

#### **Developer Experience Improvements**:
- ✅ **Reduced code duplication** - Single UnifiedReportPreview component
- ✅ **Global settings architecture** - Centralized configuration with database persistence
- ✅ **Comprehensive internationalization** - Type-safe translation system
- ✅ **Enhanced component library** - Sidebar primitives and accessibility features
- ✅ **Consistent patterns** - Shared interfaces and component architecture
- ✅ **Better separation of concerns** - Clear component responsibilities
- ✅ **Modern React patterns** - Hooks, proper state management, TypeScript

---

## Frontend Implementation

### Application Architecture
```
src/
├── 📄 pages/                        # Route components
│   ├── Login.tsx                   # Authentication entry
│   ├── Dashboard.tsx               # Role-based dashboard
│   ├── ReportEdit.tsx             # Report management & section editing
│   ├── ReportFullEditPage.tsx     # Full document editor (secretary)
│   ├── 🚀 UnifiedReportPreviewPage.tsx # NEW: Modern unified preview
│   ├── ReportPreview.tsx          # Legacy: Standard preview mode
│   ├── ReportPreview2.tsx         # Legacy: Enhanced preview
│   └── ShareSnapshot.tsx          # External stakeholder view
├── 🧩 components/
│   ├── ui/                        # shadcn/ui + custom components
│   ├── auth/                      # Authentication components
│   ├── reports/                   # Report-specific components
│   │   ├── ✅ ReportHeader.tsx            # Modern responsive header
│   │   ├── ✅ ReportActionToolbar.tsx     # Organized action buttons
│   │   ├── ✅ CollapsibleReportDetailsPanel.tsx # Progressive disclosure
│   │   ├── 🚀 UnifiedReportPreview.tsx   # NEW: Unified preview system
│   │   ├── 🚀 PreviewModeSelector.tsx    # NEW: Mode switching interface
│   │   ├── SectionDisplay.tsx           # Shared section rendering
│   │   ├── SectionEditDialog.tsx        # Dialog-based editing
│   │   ├── 📄 FullReportPreview.tsx     # Legacy - can be deprecated
│   │   └── 📄 FullReportPreview2.tsx    # Legacy - can be deprecated
│   └── layout/                    # Application shell
├── 🪝 hooks/                       # Custom hooks
│   ├── useAutoSave.tsx            # Auto-save functionality
│   ├── useAuth.ts                 # Authentication state
│   └── useFileUpload.ts           # File upload handling
├── 🌐 contexts/                   # React contexts
│   ├── AuthContext.tsx            # Global auth state
│   └── LanguageContext.tsx        # Internationalization
└── 📚 lib/
    ├── api/                       # API service layer
    └── utils.ts                   # Utility functions
```

### **🏗️ Modern Report Component Architecture**

#### **Core Components** ✅ **IMPLEMENTED**
```typescript
// ReportHeader.tsx - Responsive header with clean layout
interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  reportId: string;
  user: User;
  onBackClick?: () => void;
  onShareClick?: () => void;
  showActions?: boolean;  // Toggle action toolbar visibility
}

// ReportActionToolbar.tsx - Organized action buttons with dropdowns
interface ReportActionToolbarProps {
  reportId: string;
  reportTitle: string;
  user: User;
  onShareClick?: () => void;
}

// CollapsibleReportDetailsPanel.tsx - Progressive disclosure editing
interface CollapsibleReportDetailsPanelProps {
  // Form fields for report metadata
  // Auto-save status integration
  // Collapsible UI with visual indicators
  defaultExpanded?: boolean;  // False for better UX
}
```

#### **Inline Preview System** 🚀 **IMPLEMENTED 2025-06-26**

**Major architectural improvement**: All preview modes now render inline within the unified report management interface, eliminating navigation breaks and providing seamless UX.

```typescript
// Core Preview Types
export type PreviewMode = 'read-only' | 'interactive' | 'full-edit';

// PreviewModeRenderer.tsx - Smart router for preview components
interface PreviewModeRendererProps {
  mode: PreviewMode;
  reportId: string;
  report: ReportWithSections;
  user: User;
  onModeChange: (mode: PreviewMode) => void;
  onExport: () => void;
  onShare: () => void;
}

// ViewOnlyPreview.tsx - Read-only preview with export/share
interface ViewOnlyPreviewProps {
  reportId: string;
  report: ReportWithSections;
  user: User;
  onExport: () => void;
  onShare: () => void;
}

// QuickEditPreview.tsx - Interactive editing with auto-save
interface QuickEditPreviewProps {
  reportId: string;
  report: ReportWithSections;
  user: User;
  onModeChange: (mode: PreviewMode) => void;
}

// FullEditPreview.tsx - Rich text editor integration
interface FullEditPreviewProps {
  reportId: string;
  report: ReportWithSections;
  user: User;
}
```

**State Management Integration**:
```typescript
// Enhanced ReportManagementState with preview mode
interface ReportManagementState {
  activeTab: TabType;
  activePreviewMode: PreviewMode | null;  // 🆕 New state
  // ... existing state
}

// New actions for preview mode management
interface ReportManagementActions {
  setPreviewMode: (mode: PreviewMode) => void;   // 🆕
  clearPreviewMode: () => void;                  // 🆕
  // ... existing actions
}
```

**Navigation Architecture**:
```
[Back] | [Overview] | [Read-Only] [Interactive] [Full-Edit] | [Sections] | [Share] [Export] [Settings]
         ^Dashboard^  ^-------- Preview Modes --------^     ^Section^  ^-- Actions --^ ^Config^
```

**Key Benefits**:
- ✅ **No navigation breaks**: All modes render in main content area
- ✅ **Unified state management**: Centralized preview mode state
- ✅ **Better performance**: No page reloads or route changes
- ✅ **Consistent UX**: Same navigation, auto-save, and error handling
- ✅ **Role-based access**: Proper permission validation for each mode

**Implementation Details**:
- **Conditional Rendering**: `{activePreviewMode ? <PreviewContent /> : <TabContent />}`
- **State Persistence**: Preview mode stored in centralized state management
- **Component Reuse**: Extracted shared logic into reusable preview components
- **Legacy Compatibility**: Maintained existing functionality while improving architecture

// Mode-specific rendering with consistent state management
const UnifiedReportPreview = ({ mode, onModeChange, ...props }) => {
  // View Mode: Read-only with export capabilities
  // Edit Mode: Inline editing with save/cancel
  // Full Edit Mode: Navigation to dedicated editor
};
```

### State Management Strategy
```typescript
// React Query for server state
// File: src/lib/api/reports.ts:15-89
export const useReports = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportApi.getReports(filters),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: reportApi.updateReport,
    onSuccess: (data) => {
      // Optimistic update
      queryClient.setQueryData(['reports'], (old: any) => 
        old?.map((report: any) => 
          report.id === data.id ? data : report
        )
      );
    },
  });
};

// React Context for UI state
// File: src/contexts/AuthContext.tsx:25-120
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize auth state from cookie
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/me', { credentials: 'include' });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Auto-Save Implementation
```typescript
// File: src/hooks/useAutoSave.tsx:17-116
export const useAutoSave = ({
  onSave,
  delay = 30000,  // 30 seconds default
  enabled = true,
  isDataChanged
}: AutoSaveOptions): AutoSaveStatus => {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const saveData = useCallback(async () => {
    if (!enabled || isSaving) return;

    // Smart change detection
    if (isDataChanged && !isDataChanged()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave();
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      toast({
        title: 'Auto-saved',
        description: 'Your changes have been automatically saved.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: 'Auto-save failed',
        description: 'Failed to auto-save. Please save manually.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [onSave, enabled, isSaving, isDataChanged, toast]);

  // Debounced scheduling
  const scheduleAutoSave = useCallback(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(saveData, delay);
  }, [enabled, delay, saveData]);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    triggerAutoSave: () => {
      setHasUnsavedChanges(true);
      scheduleAutoSave();
    },
    manualSave: async () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      await saveData();
    }
  };
};
```

### Report Viewing & Editing Modes

#### **🚀 NEW: Unified Preview** (`/reports/:id/unified-preview`) - **RECOMMENDED**
```typescript
// File: src/pages/UnifiedReportPreviewPage.tsx + src/components/reports/UnifiedReportPreview.tsx
// Purpose: Modern unified interface with mode switching capabilities
// Access: All users (mode-specific features based on role)
// Features: Mode selector, inline editing, URL state persistence, responsive design

type PreviewMode = 'view' | 'edit' | 'full-edit';

// Three distinct modes in one component:
// - View Mode: Read-only preview with export capabilities  
// - Edit Mode: Inline section editing with save/cancel
// - Full Edit Mode: Redirects to complete document editor

const modeAccess = {
  secretary: ['view', 'edit', 'full-edit'],    // Full access to all modes
  department: ['view', 'edit'],                // Limited to view and edit modes
  external: ['view']                           // Read-only access only
};
```

#### **1. Report Management** (`/reports/:id`) 
```typescript
// File: src/pages/ReportEdit.tsx
// Purpose: Administrative interface for report and section management
// Access: Secretary (full features), Department (section editing only)
// Features: Report details editing, section activation toggles, share links
// Layout: Modern header + collapsible details + role-based content
```

#### **2. Section Editor** (`/reports/:id/edit-markdown`)
```typescript
// File: src/pages/ReportEdit.tsx (route variant)
// Purpose: Focused section editing interface for department users
// Access: Department (primary), Secretary (full access)
// Features: Tabs interface, 30s auto-save, section status tracking
// UI: Responsive tabs with markdown editor and save indicators
```

#### **3. Full Document Editor** (`/reports/:id/edit-full`)
```typescript
// File: src/pages/ReportFullEditPage.tsx
// Purpose: Complete document editing with unified content management
// Access: Secretary only (strict role-based access control)
// Features: BlockNote rich text editor, section markers, advanced formatting
// Use Case: Major content restructuring and comprehensive document review
```

#### **4. Legacy Preview** (`/reports/:id/preview`) 
```typescript
// File: src/pages/ReportPreview.tsx
// Purpose: Traditional read-only preview (maintained for compatibility)
// Access: All users, limited editing via dialogs
// Status: Legacy - consider migrating to unified-preview
// Features: Static preview, DOCX export, dialog-based section editing
```

#### **5. Legacy Enhanced Preview** (`/reports/:id/preview2`)
```typescript
// File: src/pages/ReportPreview2.tsx
// Purpose: Enhanced preview with inline editing (legacy implementation)
// Access: All users with role-based editing capabilities
// Status: Legacy - unified-preview provides better UX
// Features: Inline editing, auto-save, but less modern UI patterns
```

### **🎯 Mode Selection Guide**

**For New Development**: Use **Unified Preview** (`/reports/:id/unified-preview`)
- Modern, responsive interface
- Clear mode switching with URL persistence
- Consistent user experience across all devices
- Better accessibility and touch support

**For Administrative Tasks**: Use **Report Management** (`/reports/:id`)
- Metadata editing and section organization
- Share link management
- Department assignment and section toggles

**For Content Creation**: Use **Section Editor** (`/reports/:id/edit-markdown`)
- Optimized for department users
- Auto-save with visual feedback
- Progress tracking and completion indicators

### Component Patterns
```typescript
// Dialog pattern: src/components/ui/dialogs/
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

// Form pattern with react-hook-form + zod
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

const MyForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // Handle submission
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
};

// Loading pattern with suspense
const AsyncComponent = lazy(() => import('./HeavyComponent'));

const App = () => (
  <Suspense fallback={<LoadingSkeleton />}>
    <AsyncComponent />
  </Suspense>
);
```

### **🎨 Semantic Button System** ✅ **NEW - 2025-06-24**

#### **Consistent Button Variants**
```typescript
// File: src/components/ui/button.tsx
// Semantic button variants for consistent UX across the application

// Action-specific button variants
<Button variant="view">View Report</Button>     // Blue outline - navigation/viewing
<Button variant="edit">Edit</Button>           // Blue solid - editing actions  
<Button variant="export">Export</Button>       // Green - export/download actions
<Button variant="delete">Delete</Button>       // Red - destructive actions
<Button variant="create">New Report</Button>   // Primary - creation actions

// Standard variants (legacy compatibility)
<Button variant="outline">Outline</Button>     // Default outline style
<Button variant="secondary">Secondary</Button>  // Secondary style
<Button variant="ghost">Ghost</Button>         // Minimal style
```

#### **Color Standards**
```css
/* Button color system for consistent branding */
.btn-view    { border: blue-300, text: blue-700, hover: blue-50 }
.btn-edit    { bg: blue-600, text: white, hover: blue-700 }
.btn-export  { bg: green-100, text: green-700, hover: green-200 }
.btn-delete  { text: red-600, hover: red-50 }
.btn-create  { bg: primary, text: primary-foreground, hover: primary/90 }
```

#### **Usage Examples**
```typescript
// Dashboard.tsx - Report cards
<Button variant="view" onClick={() => navigate(`/reports/${id}`)}>
  <Eye className="w-4 h-4 mr-2" /> View Report
</Button>

<Button variant="export" onClick={() => downloadReport(id)}>
  <FileOutput className="w-4 h-4 mr-2" /> Export
</Button>

<Button variant="delete" onClick={() => deleteReport(id)}>
  <Trash2 className="w-4 h-4 mr-2" /> Delete
</Button>

// Benefits: Semantic clarity, consistent colors, maintainable design system
```

### **🎨 Unified Design System** ✅ **IMPLEMENTED**
*Features: Centralized design tokens, semantic components, and consistent patterns*

**Implementation**:
```typescript
// Design system architecture: src/lib/design-tokens.ts
export const colors = {
  brand: {
    primary: '#0A2463',    // TPG Blue
    secondary: '#D90429',  // TPG Red
  },
  semantic: {
    view: { background: 'blue-50', border: 'blue-300', text: 'blue-700' },
    edit: { background: 'blue-600', text: 'white', hover: 'blue-700' },
    export: { background: 'green-100', text: 'green-700', hover: 'green-200' },
    delete: { text: 'red-600', hover: 'red-50' },
    create: { background: 'primary', text: 'primary-foreground' },
  },
  status: {
    draft: { background: 'gray-100', text: 'gray-700', border: 'gray-300' },
    submitted: { background: 'blue-100', text: 'blue-700', border: 'blue-300' },
    final: { background: 'green-100', text: 'green-700', border: 'green-300' },
    published: { background: 'purple-100', text: 'purple-700', border: 'purple-300' },
    overdue: { background: 'red-100', text: 'red-700', border: 'red-300' },
  }
};

// Typography scale
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  }
};

// Spacing system
export const spacing = {
  px: '1px',
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
};
```

**AI Developer Instructions**:
```typescript
// ALWAYS use design tokens instead of hardcoded values
// ❌ DON'T DO THIS:
<Button className="bg-blue-600 text-white hover:bg-blue-700">
  Edit Report
</Button>

// ✅ DO THIS:
<Button variant="edit">
  Edit Report
</Button>

// ❌ DON'T DO THIS:
<div className="p-4 bg-gray-100 border border-gray-300">
  Draft Report
</div>

// ✅ DO THIS:
<StatusBadge status="draft">
  Draft Report
</StatusBadge>

// Component development guidelines:
interface ComponentProps {
  variant?: 'view' | 'edit' | 'export' | 'delete' | 'create';
  status?: 'draft' | 'submitted' | 'final' | 'published' | 'overdue';
  size?: 'sm' | 'md' | 'lg';
}

// Use semantic variants for consistent UX
const Button = ({ variant, ...props }: ButtonProps) => {
  const variantStyles = {
    view: 'border-blue-300 text-blue-700 hover:bg-blue-50',
    edit: 'bg-blue-600 text-white hover:bg-blue-700',
    export: 'bg-green-100 text-green-700 hover:bg-green-200',
    delete: 'text-red-600 hover:bg-red-50',
    create: 'bg-primary text-primary-foreground hover:bg-primary/90',
  };
  
  return (
    <button className={cn(baseStyles, variantStyles[variant])} {...props} />
  );
};
```

**Design System Files**:
- **📄 `.labs/DESIGN-SYSTEM.md`** - Complete design system documentation
- **📄 `.labs/design_system_implementation.md`** - Implementation instructions
- **📄 `src/lib/design-tokens.ts`** - Centralized design tokens
- **📄 `tailwind.config.ts`** - Tailwind configuration with custom tokens

**Key Principles for AI Development**:
1. **Use Semantic Variants**: Always use action-specific button variants (view, edit, export, delete, create)
2. **Consistent Status Colors**: Use predefined status colors for report states
3. **Design Token Integration**: Reference design tokens instead of hardcoded values
4. **Accessibility First**: All components follow WCAG 2.1 AA standards
5. **Mobile Responsive**: All components work across screen sizes
6. **Type Safety**: All design tokens are TypeScript-typed for IntelliSense

### 🆕 Recent Frontend Enhancements (2025-07-13)

#### Internationalization System
```typescript
// Complete multilingual support with runtime language switching
// Location: src/contexts/LanguageContext.tsx

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('vi-VN'); // Default Vietnamese
  
  const changeLanguage = useCallback((newLang: 'vi-VN' | 'en-US') => {
    setLanguage(newLang);
    // Persist language preference
    localStorage.setItem('preferred-language', newLang);
  }, []);
  
  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Translation files structure:
/translations/
├── vi-VN.json    # Primary Vietnamese translations
└── en-US.json    # Secondary English translations

// Usage in components:
const { t } = useTranslation();
return <Button>{t('common.save')}</Button>; // "Lưu" or "Save"
```

#### Enhanced Drag-and-Drop System
```typescript
// Advanced section reordering with @dnd-kit/core
// Location: src/components/reports/SectionsTab.tsx

import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export const SectionsTab = ({ sections, onReorder }) => {
  const [activeId, setActiveId] = useState(null);
  
  // Optimistic UI updates with immediate visual feedback
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // Immediate UI update
    setOptimisticOrder(newOrder);
    
    // Background API call with error recovery
    try {
      await updateSectionOrder(active.id, over.id);
    } catch (error) {
      revertOptimisticOrder();
      showErrorToast('Failed to reorder sections');
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <SortableContext items={sections} strategy={verticalListSortingStrategy}>
        {sections.map(section => (
          <SortableSectionItem key={section.id} section={section} />
        ))}
      </SortableContext>
      <DragOverlay>
        {activeId ? <SectionPreview id={activeId} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
```

#### Advanced Auto-Save & Data Safety
```typescript
// Enhanced auto-save with conflict resolution
// Location: src/hooks/useAutoSave.tsx

export const useAutoSave = (data, saveFunction, options = {}) => {
  const {
    interval = 30000,        // 30s for sections, 45s for reports
    onConflict = 'prompt',   // 'overwrite' | 'prompt' | 'merge'
    enableBeforeUnload = true
  } = options;

  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Debounced save with visual feedback
  const debouncedSave = useCallback(
    debounce(async (currentData) => {
      if (!isDirty) return;
      
      setIsLoading(true);
      try {
        const result = await saveFunction(currentData);
        if (result.conflict) {
          handleConflict(result);
        } else {
          setLastSaved(new Date());
          setIsDirty(false);
        }
      } catch (error) {
        showErrorToast('Auto-save failed');
      } finally {
        setIsLoading(false);
      }
    }, interval),
    [isDirty, saveFunction, interval]
  );

  // Prevent data loss on navigation
  useBeforeUnload(
    isDirty && enableBeforeUnload,
    'You have unsaved changes. Are you sure you want to leave?'
  );
  
  return { isDirty, isLoading, lastSaved, forceSave: () => debouncedSave(data) };
};
```

#### AI Chatbot Integration
```typescript
// Dify AI integration for text editing assistance
// Location: src/components/integrations/DifyChatbot.tsx

export const DifyChatbot = ({ userId, context = 'report-editing' }) => {
  const config = useDifyConfig();
  
  // User session isolation for security
  const chatSession = useMemo(() => ({
    userId: `report-user-${userId}`,
    sessionId: `${context}-${Date.now()}`,
    workspace: 'report-fusion'
  }), [userId, context]);
  
  const sendMessage = async (message) => {
    try {
      const response = await fetch(`${config.apiUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: { text: message, context },
          query: message,
          user: chatSession.userId,
          conversation_id: chatSession.sessionId
        })
      });
      
      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error('Dify chat error:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  };
  
  return (
    <ChatInterface 
      onSendMessage={sendMessage}
      placeholder="Ask me to help improve your report content..."
      context={context}
    />
  );
};

// Configuration setup: src/config/dify.ts
export const difyConfig = {
  apiUrl: process.env.VITE_DIFY_API_URL,
  apiKey: process.env.VITE_DIFY_API_KEY,
  enabled: !!(process.env.VITE_DIFY_API_URL && process.env.VITE_DIFY_API_KEY)
};
```

#### Manual Refetch Capabilities
```typescript
// Enhanced React Query hooks with manual refresh
// Location: src/hooks/useReportManagement.ts

export const useReportManagement = (reportId) => {
  const queryClient = useQueryClient();
  
  const {
    data: report,
    isLoading,
    error,
    refetch: refetchReport,      // Manual refresh capability
  } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => fetchReport(reportId),
    staleTime: 5 * 60 * 1000,    // 5 minutes
    cacheTime: 10 * 60 * 1000,   // 10 minutes
  });
  
  // Bulk section update with progress tracking
  const bulkUpdateSections = useMutation({
    mutationFn: async (updates) => {
      const results = [];
      const total = updates.length;
      
      for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        try {
          const result = await updateSection(update);
          results.push({ success: true, sectionId: update.id, result });
          
          // Progress callback
          onProgress?.(i + 1, total);
        } catch (error) {
          results.push({ success: false, sectionId: update.id, error });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      // Invalidate related queries
      queryClient.invalidateQueries(['report', reportId]);
      
      // Show summary toast
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.length - successCount;
      
      if (errorCount === 0) {
        showSuccessToast(`Updated ${successCount} sections successfully`);
      } else {
        showWarningToast(`Updated ${successCount} sections, ${errorCount} failed`);
      }
    }
  });
  
  return {
    report,
    isLoading,
    error,
    refetch: refetchReport,
    bulkUpdate: bulkUpdateSections.mutate,
    isUpdating: bulkUpdateSections.isLoading
  };
};
```

---

## Backend Implementation

### Express.js Architecture
```
server/
├── 🚀 server.js                # Application entry point
├── 📁 routes/                  # Route definitions
│   ├── auth.js                # Authentication routes
│   ├── reports.js             # Report CRUD operations
│   ├── sections.js            # Section management
│   ├── upload.js              # File upload handling
│   └── sharedReports.js       # External sharing
├── 🎛️ controllers/             # Business logic layer
│   ├── authController.js      # Authentication logic
│   ├── reportController.js    # Report orchestration
│   ├── sectionController.js   # Section workflow
│   └── exportController.js    # PDF export (Puppeteer + HTML template)
├── 🔧 services/               # Domain services
│   ├── reportService.js       # Core report logic
│   ├── userService.js         # User management
│   └── departmentService.js   # Department operations
├── 📄 templates/              # HTML templates for PDF generation
│   └── pdfTemplate.html       # Professional PDF layout with A4 formatting
├── 🛡️ middleware/              # Cross-cutting concerns
│   ├── auth.js                # Authentication & authorization
│   ├── validation.js          # Request validation
│   └── errorHandler.js        # Global error handling
└── 🛠️ utils/                   # Utility functions
    ├── encryptionUtils.js     # File encryption
    ├── responseFormatter.js   # Consistent API responses
    └── logger.js              # Structured logging
```

### Middleware Stack
```typescript
// Application middleware: server/server.js:25-89
app.use(helmet());                    // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL,   // CORS configuration
  credentials: true                   // Allow cookies
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());              // Parse HTTP-only cookies
app.use('/api', routes);              // Mount API routes
app.use(errorHandler);                // Global error handling

// Route-specific middleware: server/routes/reports.js:15-25
router.get('/', authenticateToken, getReports);
router.post('/', authenticateToken, validateCreateReport, createReport);
router.put('/:id', authenticateToken, validateUpdateReport, updateReport);
router.delete('/:id', authenticateToken, requireRole('secretary'), deleteReport);
```

### Controller Pattern
```typescript
// File: server/controllers/reportController.js:25-89
const getReports = async (req, res, next) => {
  try {
    const { status, cycle, department, limit = 50, offset = 0 } = req.query;
    const { userId, role } = req.user;
    
    // Build filter based on user role
    const filters = {
      isDeleted: false,
      ...(status && { state: status }),
      ...(cycle && { cycle }),
    };
    
    // Role-based access control
    if (role === 'department') {
      filters.sections = {
        some: {
          departmentId: req.user.departmentId
        }
      };
    }
    
    const reports = await reportService.findReports(filters, { 
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: {
        sections: {
          include: {
            department: true,
            updatedBy: { select: { id: true, name: true } }
          }
        },
        createdBy: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } }
      }
    });
    
    res.json(formatResponse({
      data: reports,
      total: reports.length,
      hasMore: reports.length === parseInt(limit)
    }));
  } catch (error) {
    next(error);  // Pass to error handler
  }
};
```

### Service Layer Pattern
```typescript
// File: server/services/reportService.js:25-120
class ReportService {
  async findReports(filters, options = {}) {
    const { limit, offset, include = {} } = options;
    
    return await prisma.report.findMany({
      where: filters,
      include: {
        sections: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          ...include.sections
        },
        ...include
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset
    });
  }
  
  async createReport(data, createdById) {
    const { templateId, ...reportData } = data;
    
    // Start transaction for atomic creation
    return await prisma.$transaction(async (tx) => {
      // 1. Create report
      const report = await tx.report.create({
        data: {
          ...reportData,
          createdById,
          templateId
        }
      });
      
      // 2. Create sections from template if provided
      if (templateId) {
        const template = await tx.reportTemplate.findUnique({
          where: { id: templateId },
          include: { sections: true }
        });
        
        if (template) {
          const sectionData = template.sections.map(ts => ({
            reportId: report.id,
            sectionName: ts.sectionName,
            instructions: ts.instructions,
            departmentId: ts.departmentId,
            displayOrder: ts.displayOrder,
            reportTemplateSectionId: ts.id
          }));
          
          await tx.reportSection.createMany({
            data: sectionData
          });
        }
      }
      
      return report;
    });
  }
  
  calculateReportStatus(sections) {
    const activeSections = sections.filter(s => s.isActive);
    
    if (activeSections.some(s => s.state === 'DRAFT')) {
      return 'DRAFT';
    }
    
    if (activeSections.every(s => s.state === 'SUBMITTED')) {
      return 'FINAL';
    }
    
    return 'DRAFT';
  }
}

module.exports = new ReportService();
```

### Error Handling Strategy
```typescript
// Global error handler: server/middleware/errorHandler.js:15-89
const errorHandler = (error, req, res, next) => {
  console.error('Error:', error.message);
  
  // Prisma validation errors
  if (error.code === 'P2002') {
    return res.status(400).json({
      error: 'Duplicate entry',
      message: 'A record with this information already exists'
    });
  }
  
  // Prisma not found errors
  if (error.code === 'P2025') {
    return res.status(404).json({
      error: 'Not found',
      message: 'The requested resource was not found'
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Please log in again'
    });
  }
  
  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: error.message,
      details: error.details
    });
  }
  
  // Default server error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Something went wrong'
  });
};
```

---

## Testing Implementation

### Test Organization
```
tests/
├── 🎭 e2e/                     # Playwright end-to-end tests
│   ├── auth.spec.ts            # Authentication flows
│   ├── report-workflows.spec.ts # Complete user journeys
│   ├── auto-save.spec.ts       # Auto-save functionality
│   └── shared-reports.spec.ts  # External sharing
├── 🔧 helpers/                 # Test utilities
│   ├── auth.ts                 # Authentication helpers
│   └── common.ts               # Common test functions
└── ⚡ unit/                    # Component and utility tests
    ├── hooks/                  # Custom hook tests
    ├── components/             # Component behavior tests
    └── utils/                  # Utility function tests
```

### E2E Testing with Playwright
```typescript
// File: tests/e2e/auth.spec.ts:15-120
import { test, expect } from '@playwright/test';
import { loginAsSecretary, loginAsDepartment } from '../helpers/auth';

test.describe('Authentication System', () => {
  test('secretary login flow', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Verify secretary UI elements
    await expect(page.locator('text=Reports')).toBeVisible();
    await expect(page.locator('text=Templates')).toBeVisible();
    await expect(page.locator('text=Admin')).toBeVisible();
  });
  
  test('department user restrictions', async ({ page }) => {
    await loginAsDepartment(page);
    
    // Should see limited dashboard
    await expect(page.locator('text=My Sections')).toBeVisible();
    await expect(page.locator('text=Templates')).not.toBeVisible();
    
    // Should not access admin routes
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/unauthorized');
  });
  
  test('session persistence', async ({ page }) => {
    await loginAsSecretary(page);
    
    // Refresh page
    await page.reload();
    
    // Should remain logged in
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Admin User')).toBeVisible();
  });
});
```

### Auto-Save Testing
```typescript
// File: tests/e2e/auto-save.spec.ts:25-150
test.describe('Auto-Save Functionality', () => {
  test('report metadata auto-save', async ({ page }) => {
    await loginAsSecretary(page);
    
    // Navigate to report
    await page.goto('/reports/test-report-id');
    
    // Edit title
    await page.fill('input[name="title"]', 'Updated Report Title');
    
    // Wait for auto-save (45 second interval)
    await page.waitForSelector('text=Saving...', { timeout: 2000 });
    await page.waitForSelector('text=Saved at', { timeout: 47000 });
    
    // Verify persistence
    await page.reload();
    await expect(page.locator('input[name="title"]')).toHaveValue('Updated Report Title');
  });
  
  test('section content auto-save', async ({ page }) => {
    await loginAsDepartment(page);
    
    // Navigate to section editor
    await page.goto('/reports/test-report-id/edit-markdown');
    
    // Edit section content
    await page.locator('.blocknote-editor').fill('New section content');
    
    // Wait for auto-save (30 second interval)
    await page.waitForSelector('text=Auto-saved', { timeout: 32000 });
    
    // Verify content saved
    await page.reload();
    await expect(page.locator('.blocknote-editor')).toContainText('New section content');
  });
  
  test('auto-save error handling', async ({ page }) => {
    // Mock network failure
    await page.route('/api/reports/*', route => route.abort());
    
    await loginAsSecretary(page);
    await page.goto('/reports/test-report-id');
    
    // Try to edit
    await page.fill('input[name="title"]', 'This will fail');
    
    // Should show error toast
    await expect(page.locator('text=Auto-save failed')).toBeVisible();
    await expect(page.locator('text=Please save manually')).toBeVisible();
  });
});
```

### Unit Testing with Vitest
```typescript
// File: src/hooks/__tests__/useAutoSave.test.ts:15-120
import { renderHook, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { useAutoSave } from '../useAutoSave';

describe('useAutoSave Hook', () => {
  let mockOnSave: ReturnType<typeof vi.fn>;
  let mockIsDataChanged: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    mockOnSave = vi.fn().mockResolvedValue(undefined);
    mockIsDataChanged = vi.fn().mockReturnValue(true);
    vi.useFakeTimers();
  });
  
  test('triggers auto-save after delay', async () => {
    const { result } = renderHook(() => useAutoSave({
      onSave: mockOnSave,
      delay: 1000,
      isDataChanged: mockIsDataChanged
    }));
    
    // Trigger auto-save
    act(() => {
      result.current.triggerAutoSave();
    });
    
    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // Should have called onSave
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });
  
  test('skips save when no changes detected', async () => {
    mockIsDataChanged.mockReturnValue(false);
    
    const { result } = renderHook(() => useAutoSave({
      onSave: mockOnSave,
      delay: 1000,
      isDataChanged: mockIsDataChanged
    }));
    
    act(() => {
      result.current.triggerAutoSave();
    });
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // Should not have called onSave
    expect(mockOnSave).not.toHaveBeenCalled();
  });
  
  test('handles save errors gracefully', async () => {
    mockOnSave.mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useAutoSave({
      onSave: mockOnSave,
      delay: 100
    }));
    
    act(() => {
      result.current.triggerAutoSave();
    });
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    // Should handle error without crashing
    expect(result.current.isSaving).toBe(false);
  });
});
```

### Testing Commands Reference
```bash
# Unit Tests
npm test                        # Run all unit tests
npm run test:unit:watch        # Watch mode for development
npm run test:coverage          # Coverage report (70% threshold)

# E2E Tests  
npx playwright test            # All E2E tests
npx playwright test --ui       # Interactive UI mode
npx playwright test --headed   # Run with browser UI
npx playwright test --debug    # Debug mode
npx playwright test --grep "auth"  # Run specific tests

# Specific test suites
npx playwright test tests/e2e/auth.spec.ts
npx playwright test --project=chromium
npx playwright test --project="Mobile Chrome"

# CI/CD Testing
npm run test:ci                # Optimized for CI (chromium only)
npm run test:all               # Run both unit and E2E
```

---

## Performance Implementation

### Frontend Optimization
```typescript
// Code splitting by route: src/App.tsx:25-89
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ReportEdit = lazy(() => import('./pages/ReportEdit'));
const AdminPages = lazy(() => import('./pages/admin/AdminPages'));

// Bundle analysis shows:
// - Dashboard chunk: ~150KB (contains charts, tables)
// - Editor chunk: ~250KB (includes BlockNote)
// - Admin chunk: ~100KB (forms, dialogs)

// Image optimization: src/components/OptimizedImage.tsx
const OptimizedImage = ({ src, alt, ...props }) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"                    // Native lazy loading
      decoding="async"                  // Non-blocking decode
      style={{ objectFit: 'cover' }}   // Prevent layout shift
      {...props}
    />
  );
};

// Virtual scrolling for large lists: src/components/VirtualTable.tsx
import { FixedSizeList } from 'react-window';

const VirtualReportList = ({ reports }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ReportCard report={reports[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}                     // Viewport height
      itemCount={reports.length}       // Total items
      itemSize={120}                   // Item height
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### React Query Optimization
```typescript
// Smart caching strategy: src/lib/api/reports.ts:120-180
export const useReports = (filters: ReportFilters) => {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportApi.getReports(filters),
    staleTime: 5 * 60 * 1000,        // 5 minutes before stale
    cacheTime: 10 * 60 * 1000,       // 10 minutes in memory
    refetchOnWindowFocus: false,      // Don't refetch on focus
    refetchOnMount: false,            // Don't refetch if cached
    keepPreviousData: true,           // Smooth transitions
  });
};

// Prefetching strategy
export const usePrefetchReport = () => {
  const queryClient = useQueryClient();
  
  return useCallback((reportId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['report', reportId],
      queryFn: () => reportApi.getReport(reportId),
      staleTime: 2 * 60 * 1000,      // 2 minutes
    });
  }, [queryClient]);
};

// Optimistic updates pattern
export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sectionApi.updateSection,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['sections', variables.reportId]);
      
      // Snapshot previous value
      const previousSections = queryClient.getQueryData(['sections', variables.reportId]);
      
      // Optimistically update
      queryClient.setQueryData(['sections', variables.reportId], (old: any) =>
        old?.map((section: any) =>
          section.id === variables.sectionId
            ? { ...section, ...variables.data }
            : section
        )
      );
      
      return { previousSections };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSections) {
        queryClient.setQueryData(['sections', variables.reportId], context.previousSections);
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(['sections', variables.reportId]);
    },
  });
};
```

### Backend Performance
```typescript
// Database query optimization: server/services/reportService.js:180-250
class ReportService {
  async getReportsOptimized(filters, options = {}) {
    const { limit, offset } = options;
    
    // Strategic include to avoid N+1 queries
    return await prisma.report.findMany({
      where: filters,
      select: {
        id: true,
        title: true,
        state: true,
        updatedAt: true,
        // Only include essential section data
        sections: {
          select: {
            id: true,
            state: true,
            department: {
              select: { id: true, name: true }
            }
          },
          where: { isActive: true }
        },
        // Minimal user data
        createdBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset
    });
  }
  
  // Efficient section count for dashboard
  async getSectionCounts(departmentId?: string) {
    const where = departmentId ? { departmentId } : {};
    
    const [draft, submitted] = await Promise.all([
      prisma.reportSection.count({
        where: { ...where, state: 'DRAFT', isActive: true }
      }),
      prisma.reportSection.count({
        where: { ...where, state: 'SUBMITTED', isActive: true }
      })
    ]);
    
    return { draft, submitted, total: draft + submitted };
  }
}

// Connection pooling: server/config/database.js
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool optimization
  __internal: {
    engine: {
      connection_limit: 10,           // Max connections
      pool_timeout: 10,               // Pool timeout seconds
      socket_timeout: 60,             // Socket timeout seconds
    },
  },
});
```

### File Upload Optimization
```typescript
// Streaming file upload: server/routes/upload.js:120-200
const uploadStream = (buffer, filePath) => {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    const readStream = new PassThrough();
    
    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);
    
    // Pipe through encryption transform
    readStream
      .pipe(createEncryptionTransform())
      .pipe(writeStream);
    
    readStream.end(buffer);
  });
};

// Image compression middleware
const compressImage = async (buffer, mimetype) => {
  if (!mimetype.startsWith('image/')) return buffer;
  
  return await sharp(buffer)
    .resize(1920, 1080, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .jpeg({ quality: 85 })
    .toBuffer();
};
```

### Auto-Save Performance
```typescript
// Debounced auto-save with change detection: src/hooks/useAutoSave.tsx:150-200
const useChangeDetection = (data) => {
  const previousData = useRef(data);
  const hashRef = useRef<string>('');
  
  return useCallback(() => {
    // Fast hash-based change detection
    const currentHash = hashObject(data);
    
    if (currentHash === hashRef.current) {
      return false;  // No changes
    }
    
    hashRef.current = currentHash;
    previousData.current = data;
    return true;  // Changes detected
  }, [data]);
};

// Efficient diff for large content
const useContentDiff = (content: string) => {
  const lastSavedRef = useRef(content);
  
  return useCallback(() => {
    if (content === lastSavedRef.current) {
      return false;
    }
    
    // Only save if substantial changes (>10 characters)
    const diff = content.length - lastSavedRef.current.length;
    if (Math.abs(diff) < 10 && !content.includes('\n')) {
      return false;
    }
    
    lastSavedRef.current = content;
    return true;
  }, [content]);
};
```

---

## Developer Workflows

### Adding New API Endpoint

1. **Define Route** (`server/routes/`)
```typescript
// File: server/routes/newFeature.js
router.post('/new-endpoint', authenticateToken, validateRequest, controller.handleRequest);
```

2. **Create Controller** (`server/controllers/`)
```typescript
// File: server/controllers/newFeatureController.js
const handleRequest = async (req, res, next) => {
  try {
    const result = await service.processRequest(req.body);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};
```

3. **Add Service Logic** (`server/services/`)
```typescript
// File: server/services/newFeatureService.js
class NewFeatureService {
  async processRequest(data) {
    return await prisma.newEntity.create({ data });
  }
}
```

4. **Frontend API Client** (`src/lib/api/`)
```typescript
// File: src/lib/api/newFeature.ts
export const newFeatureApi = {
  create: (data: CreateRequest): Promise<Response> =>
    apiClient.post('/new-endpoint', data),
};

export const useCreateNewFeature = () => {
  return useMutation({
    mutationFn: newFeatureApi.create,
  });
};
```

### Adding New Component

1. **Create Component** (`src/components/`)
```typescript
// File: src/components/NewComponent.tsx
interface NewComponentProps {
  data: SomeType;
  onAction: (id: string) => void;
}

export const NewComponent = ({ data, onAction }: NewComponentProps) => {
  return (
    <div className="p-4 border rounded">
      {/* Component implementation */}
    </div>
  );
};
```

2. **Add Tests** (`src/components/__tests__/`)
```typescript
// File: src/components/__tests__/NewComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { NewComponent } from '../NewComponent';

test('renders correctly', () => {
  render(<NewComponent data={mockData} onAction={vi.fn()} />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

3. **Update Index** (`src/components/index.ts`)
```typescript
export { NewComponent } from './NewComponent';
```

### Database Schema Changes

1. **Update Prisma Schema** (`server/prisma/schema.prisma`)
```prisma
model NewEntity {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

2. **Generate Migration**
```bash
cd server
npx prisma migrate dev --name add_new_entity
```

3. **Update Seed Data** (`server/prisma/seed.js`)
```javascript
// The seed system now intelligently uses extracted data if available
const newEntities = await prisma.newEntity.createMany({
  data: [{ name: 'Test Entity' }]
});
// Then extract the new state for team sharing:
// node prisma/extract-seed-data.js
```

4. **Generate Client**
```bash
npx prisma generate
```

### Adding New Page/Route

1. **Create Page Component** (`src/pages/`)
```typescript
// File: src/pages/NewPage.tsx
export const NewPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        {/* Page content */}
      </div>
    </MainLayout>
  );
};
```

2. **Add Route** (`src/App.tsx`)
```typescript
<Route 
  path="/new-page" 
  element={
    <ProtectedRoute requiredRole="secretary">
      <NewPage />
    </ProtectedRoute>
  } 
/>
```

3. **Update Navigation** (`src/components/layout/AppHeader.tsx`)
```typescript
const navigationItems = [
  { name: 'New Page', href: '/new-page', role: 'secretary' }
];
```

### Performance Debugging

1. **Bundle Analysis**
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Check for unused dependencies
npx depcheck
```

2. **Database Query Analysis**
```sql
-- Enable query logging in PostgreSQL
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM reports WHERE state = 'DRAFT';
```

3. **React DevTools Profiler**
```typescript
// Wrap components for profiling
import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration) => {
  console.log('Render:', id, phase, actualDuration);
};

<Profiler id="ReportList" onRender={onRenderCallback}>
  <ReportList />
</Profiler>
```

### Testing New Features

1. **Unit Tests**
```bash
# Test specific component
npm test NewComponent.test.tsx

# Test with coverage
npm run test:coverage -- NewComponent
```

2. **E2E Tests**
```typescript
// File: tests/e2e/newFeature.spec.ts
test('new feature workflow', async ({ page }) => {
  await loginAsSecretary(page);
  await page.goto('/new-page');
  
  // Test the workflow
  await expect(page.locator('text=New Feature')).toBeVisible();
});
```

3. **Manual Testing Checklist**
```markdown
## New Feature Testing
- [ ] Secretary user access
- [ ] Department user restrictions  
- [ ] Mobile responsiveness
- [ ] Auto-save functionality
- [ ] Error handling
- [ ] Performance (< 2s load time)
- [ ] Accessibility (keyboard navigation)
```

---

## Troubleshooting Guide

### Common Issues

#### Cookie Authentication Problems
```bash
# Symptoms: 401 errors after login
# Check: Browser dev tools > Application > Cookies
# Solution: Ensure credentials: 'include' in all fetch calls

# Debug cookie settings
console.log(document.cookie);  // Should be empty (HTTP-only)

# Backend debug
console.log('Cookies received:', req.cookies);
```

#### Database Connection Issues
```bash
# Check database status
psql $DATABASE_URL -c "SELECT 1;"

# Reset database
cd server
npx prisma migrate reset
npx prisma db seed

# Check connection pool
# In prisma query: include: { _count: true }
```

#### Auto-Save Not Working
```typescript
// Check change detection
const isChanged = useCallback(() => {
  console.log('Change detection:', currentData !== savedData);
  return currentData !== savedData;
}, [currentData, savedData]);

// Verify API calls
console.log('Auto-save triggered:', new Date().toISOString());
```

#### File Upload/Encryption Errors
```bash
# Check file permissions
ls -la server/secure_uploads/

# Verify encryption key
node -e "console.log(Buffer.from(process.env.FILE_ENCRYPTION_KEY, 'base64').length)"
# Should output: 32

# Debug encryption
const testBuffer = Buffer.from('test');
console.log('Encrypted:', encryptBuffer(testBuffer));
```

### Development Server Issues
```bash
# Port conflicts
lsof -i :3001  # Backend port
lsof -i :5173  # Frontend port

# Kill processes
pkill -f nodemon
pkill -f vite

# Clean restart
rm -rf node_modules package-lock.json
npm install
npm start
```

### Performance Issues
```bash
# Check bundle size
npm run build
du -sh dist/

# Database query performance
# Add to query: include: { _count: true }
# Use EXPLAIN ANALYZE in PostgreSQL

# Memory leaks
# Chrome DevTools > Memory > Take heap snapshot
# Look for growing object counts
```

---

## Security Considerations

### Authentication Security
- HTTP-only cookies prevent XSS token theft
- 12-hour token expiry limits exposure window
- CORS configuration restricts origin access
- SameSite cookie attribute prevents CSRF attacks

### File Security
- AES-256-GCM provides authenticated encryption
- Unique IV per file prevents pattern attacks
- Directory isolation per report limits access scope
- Authorization checks before file serving

### API Security
- Role-based access control on all endpoints
- Input validation with Zod schemas
- Parameterized queries prevent SQL injection
- Error messages don't leak sensitive information

### Frontend Security
- No sensitive data in localStorage/sessionStorage
- Content Security Policy headers in production
- Input sanitization in rich text editor
- Secure defaults for all user interactions

---

## Environment Variables Reference

### Required Variables
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:port/db"

# Authentication
JWT_SECRET="256-bit-secret-key"                    # Generate with crypto.randomBytes(32)

# File Encryption  
FILE_ENCRYPTION_KEY="base64-encoded-32-byte-key"   # Generate with crypto.randomBytes(32).toString('base64')

# Application
FRONTEND_URL="http://localhost:5173"               # CORS origin
BACKEND_URL="http://localhost:3001"                # API base URL
NODE_ENV="development"                             # Environment mode
PORT=3001                                          # Server port
```

### Optional Variables
```bash
# Logging
LOG_LEVEL="info"                                   # winston log level
LOG_FILE_PATH="./logs/app.log"                     # Log file location

# External Services
SMTP_URL="smtp://user:pass@host:port"              # Email notifications
ANALYTICS_API_KEY="key"                            # Usage analytics

# Development
DEBUG="prisma:query"                               # Database query logging
DISABLE_AUTO_SAVE="false"                          # Disable auto-save for testing
```

---

## Production Deployment

### Build Process
```bash
# Frontend build
npm run build                    # Creates dist/ folder
npm run preview                  # Test production build

# Backend preparation  
cd server
npm install --production        # Production dependencies only
npx prisma generate             # Generate Prisma client
npx prisma migrate deploy       # Run pending migrations
```

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://prod-connection-string
JWT_SECRET=production-secret-256-bits
FILE_ENCRYPTION_KEY=production-encryption-key-base64
FRONTEND_URL=https://your-domain.com
PORT=3001

# Security headers
CORS_ORIGIN=https://your-domain.com
COOKIE_SECURE=true
COOKIE_SAMESITE=strict
```

### Health Checks
```typescript
// Health check endpoint: server/routes/health.js
router.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

---

> **Last Updated**: 2025-06-24  
> **Next Review**: When adding major features or architectural changes  
> **Maintainer**: Development Team

## Quick Commands Reference
```bash
# Development
npm start                        # Full stack development
npm run type-check               # TypeScript validation
npm test                         # Unit tests
npx playwright test              # E2E tests

# Database
npx prisma studio               # Database browser
npx prisma migrate dev          # Apply migrations
npx prisma db seed             # Seed test data

# Production
npm run build                   # Build for production
npm run preview                 # Test production build
```

**For business requirements and user journeys, see README-PRODUCT.md**  
**For architecture education and patterns, see LEARN.md**