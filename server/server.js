/**
 * Main server entry point for Report Fusion Hub
 * 
 * This file initializes the Express server, applies middleware,
 * connects to the database via Prisma, and sets up all API routes.
 * 
 * Environment variables:
 * - PORT: Server port (defaults to 8945)
 * - JWT_SECRET: Secret key for JWT signing
 * - DATABASE_URL: PostgreSQL connection string
 */

// Load environment variables from root .env file (use __dirname for Docker compatibility)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const sectionRoutes = require('./routes/sections');
const exportRoutes = require('./routes/export');
const templateRoutes = require('./routes/templates'); // Updated from templatePacks
const departmentRoutes = require('./routes/departments');
const reportTemplateRoutes = require('./routes/reportTemplates');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload'); // Import upload routes
const reportImagesRoutes = require('./routes/reportImages'); // Import secure image serving routes
const sharedReportRoutes = require('./routes/sharedReports');
const workspaceRoutes = require('./routes/workspace');
const adminSettingsRoutes = require('./routes/admin/settings'); // Import admin settings routes
const { errorHandler } = require('./middleware/errorHandler');
const { detectLanguage, setLanguageHeaders } = require('./middleware/language'); // Import language middleware
const { validateEnv } = require('./config/env');

// Validate environment variables (throws in production if critical vars missing)
validateEnv();

// Initialize Express app
const app = express();

// Ensure base secure upload directory exists
const secureUploadsBaseDir = path.join(__dirname, 'secure_uploads', 'report_images');
if (!fs.existsSync(secureUploadsBaseDir)) {
  try {
    fs.mkdirSync(secureUploadsBaseDir, { recursive: true });
    console.log(`Created secure upload directory: ${secureUploadsBaseDir}`);
  } catch (error) {
    console.error(`Failed to create secure upload directory ${secureUploadsBaseDir}:`, error);
    // Depending on requirements, you might want to exit if this fails
    // process.exit(1);
  }
}
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8945;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : function(origin, callback) {
        // Allow localhost and LAN origins in development
        if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://192.168.') || origin.startsWith('http://10.') || origin.startsWith('http://172.')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
  credentials: true
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Make Prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Language detection middleware (before routes)
app.use(detectLanguage);
app.use(setLanguageHeaders);

// API Routes
app.use('/api', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reports', sectionRoutes);
app.use('/api/reports', exportRoutes);
app.use('/api/templates', templateRoutes); // Updated from /api/template-packs
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/report-templates', reportTemplateRoutes);
app.use('/api/upload', uploadRoutes); // Register upload routes
app.use('/api/report-images', reportImagesRoutes); // Register secure image serving routes
app.use('/api/reports', sharedReportRoutes); // share routes share same base
app.use('/api/workspace', workspaceRoutes);
app.use('/api/admin/settings', adminSettingsRoutes); // Register admin settings routes

// Public route for shared snapshot (not under /api)
app.use('/', sharedReportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Start server only if not in test environment
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✓ Database connected');
  } catch (error) {
    console.error('\n❌ Failed to connect to database!\n');
    console.error('Possible causes:');
    console.error('  1. Docker Desktop is not running → Start Docker Desktop');
    console.error('  2. PostgreSQL container is stopped → Run: docker start report-fusion-hub-pg');
    console.error('  3. DATABASE_URL is misconfigured → Check .env file\n');
    console.error('Technical details:', error.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
