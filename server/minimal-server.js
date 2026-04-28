/**
 * Minimal server to help debug startup issues
 */
require('dotenv-safe').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Create minimal express app
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(express.json());

// More permissive CORS setup for debugging
app.use(cors({
  origin: '*', // Allow all origins during debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

// Make Prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Simple login route for testing
app.post('/api/login', async (req, res) => {
  try {
    console.log('Login attempt with:', req.body);
    
    // Simplified authentication for testing
    const { email, password } = req.body;
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true
      }
    });
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }
    
    // For testing, accept any password
    console.log('User authenticated:', user.email);
    
    // Generate a simple token (not secure, just for testing)
    const token = Buffer.from(JSON.stringify(user)).toString('base64');
    
    res.json({
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
});

// Get current user
app.get('/api/me', (req, res) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Decode token (our simple base64 encoding for testing)
    const token = authHeader.split(' ')[1];
    const user = JSON.parse(Buffer.from(token, 'base64').toString());
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Simple reports route
app.get('/api/reports', async (req, res) => {
  try {
    console.log('GET /api/reports called');
    
    // Check auth header but don't require it for testing
    const authHeader = req.headers.authorization;
    let userRole = 'secretary'; // Default for testing
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const user = JSON.parse(Buffer.from(token, 'base64').toString());
        userRole = user.role;
        console.log(`Authenticated user: ${user.email}, role: ${userRole}`);
      } catch (error) {
        console.log('Invalid token, using default role');
      }
    } else {
      console.log('No auth header, using default role');
    }
    
    const reports = await prisma.report.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        sections: {
          where: { isActive: true }
        }
      }
    });
    
    console.log(`Found ${reports.length} reports`);
    
    res.json({
      reports: reports.map(r => ({
        ...r,
        sectionCount: r.sections.length
      })),
      pagination: {
        total: reports.length,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error.message);
    res.status(500).json({
      error: 'Failed to load reports'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log(`Reports API available at http://localhost:${PORT}/api/reports`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
