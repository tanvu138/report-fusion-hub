# Report Fusion Hub - Backend

This directory contains the Express.js backend for the Report Fusion Hub application. It provides APIs for authentication, report management, section editing, and document export.

## Architecture

The backend follows a modular architecture with clear separation of concerns:

- **Controllers**: Handle request processing and response generation
- **Middleware**: Provide cross-cutting concerns like authentication, validation, and error handling
- **Routes**: Define API endpoints and connect them to controllers
- **Utils**: Contain helper functions and utilities
- **Config**: Manage environment-specific configuration

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Prisma CLI (installed as a dev dependency)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Copy the environment variables template:
   ```
   cp .env.example .env
   ```

3. Update the `.env` file with your database credentials and JWT secret.

4. Generate Prisma client:
   ```
   npm run prisma:generate
   ```

5. Run database migrations:
   ```
   npm run prisma:migrate
   ```

6. Seed the database with initial data:
   ```
   npm run seed
   ```

### Running the Server

Development mode with auto-reload:
```
npm run dev
```

Production mode:
```
npm start
```

## start the postgres server
docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=report_fusion_hub -p 5432:5432 -d postgres:14

## Run the seed & migration scripts
```
npx prisma migrate reset --force && npx prisma db seed
```

## API Endpoints

### Authentication

- `POST /api/login` - Login with email/password
- `GET /api/me` - Get current user profile

### Reports

- `GET /api/reports` - List reports (filtered by user role)
- `POST /api/reports` - Create a new report (LEAD only)
- `GET /api/reports/:id` - Get report details
- `PUT /api/reports/:id` - Update report details (LEAD only)

### Sections

- `GET /api/reports/:id/sections` - List sections for a report
- `PUT /api/reports/:id/sections/:sectionId` - Update section content
- `PATCH /api/reports/:id/sections/:sectionId/active` - Toggle section activation (LEAD only)

### Export

- `GET /api/reports/:id/export` - Export report as a DOCX file

## Security

- JWT-based authentication
- Role-based access control (LEAD vs DEPT users)
- Input validation with Zod
- HTTPS required in production
- Password hashing with bcrypt

## Default Users

The seeded database includes the following users (password for all: 123123):

- Lead Manager: `lead@example.com` (LEAD role)
- Finance Manager: `finance@example.com` (DEPT role - Finance)
- HR Manager: `hr@example.com` (DEPT role - HR)
- Operations Manager: `ops@example.com` (DEPT role - Operations)


