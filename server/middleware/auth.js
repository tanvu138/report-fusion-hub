/**
 * Authentication Middleware
 * 
 * This middleware verifies JWT tokens and attaches the authenticated user
 * to the request object. It's used to protect routes that require authentication.
 * 
 * Flow:
 * 1. Extract token from Authorization header
 * 2. Verify token using JWT_SECRET
 * 3. Fetch complete user object from database (excluding password)
 * 4. Attach user to request object
 * 
 * Usage:
 * - Require authentication: router.get('/protected', authenticate, handler)
 * - Require secretary role: router.post('/reports', authenticate, authorizeRole('secretary'), handler)
 * - Require department role: router.post('/reports', authenticate, authorizeRole('department'), handler)
 */

const jwt = require('jsonwebtoken');
const { t } = require('../utils/i18n');
// Ensure JWT_SECRET is loaded, typically from process.env
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to authenticate requests using JWT
 * Attaches user object to request if authentication succeeds
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from httpOnly cookie
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ message: t('auth.noToken', req.language) });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get complete user data (excluding password)
    const user = await req.prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: t('auth.userNotFound', req.language) });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: t('auth.tokenExpired', req.language) });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: t('auth.invalidToken', req.language) });
    }
    
    next(error);
  }
};

/**
 * Middleware to restrict access based on user role
 * Must be used after authenticate middleware
 * 
 * @param {string|string[]} roles - Required role(s) to access the route
 */
const authorizeRole = (roles) => {
  // Convert single role to array for consistent handling
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: t('auth.required', req.language) });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: t('auth.insufficientPermissions', req.language) });
    }

    next();
  };
};

/**
 * Middleware to check if user belongs to the department associated with a section
 * Used to protect section editing routes
 * Must be used after authenticate middleware
 */
const authorizeDepartmentForSection = async (req, res, next) => {
  try {
    // secretary role can access any section
    if (req.user.role === 'secretary') {
      return next();
    }
    
    // For department users, check if they belong to the section's department
    const { sectionId } = req.params; // sectionId is already declared here
    
    // Get the section to check its assigned departmentId
    const section = await req.prisma.reportSection.findUnique({
      where: { id: sectionId }
      // No need to include template or department here for this specific check,
      // as ReportSection directly has departmentId.
      // If other parts of the section object are needed by the controller,
      // they can be included or fetched there.
    });
    
    if (!section) {
      return res.status(404).json({ message: t('auth.sectionNotFound', req.language) });
    }
    
    // Check if user belongs to the department assigned to the section
    if (section.departmentId !== req.user.departmentId) {
      return res.status(403).json({ message: t('auth.departmentAccessOnly', req.language) });
    }
    
    // Add section info to request for downstream handlers
    req.section = section;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to verify the user owns a personal workspace report
 * Checks: exists, not deleted, type=PERSONAL, createdById matches user
 */
const authorizeWorkspaceOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await req.prisma.report.findUnique({
      where: { id },
      select: { id: true, type: true, createdById: true, isDeleted: true }
    });

    if (!report || report.isDeleted) {
      return res.status(404).json({ message: t('workspace.reportNotFound', req.language) });
    }
    if (report.type !== 'PERSONAL') {
      return res.status(403).json({ message: t('workspace.notPersonalReport', req.language) });
    }
    if (report.createdById !== req.user.id) {
      return res.status(403).json({ message: t('workspace.accessDenied', req.language) });
    }

    req.workspaceReport = report;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * router.param handler that blocks PERSONAL reports from official endpoints.
 * Usage: router.param('id', blockPersonalReports);
 */
const blockPersonalReports = async (req, res, next, id) => {
  try {
    const report = await req.prisma.report.findUnique({
      where: { id },
      select: { type: true }
    });
    if (report && report.type === 'PERSONAL') {
      return res.status(404).json({ message: t('general.notFound', req.language) });
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authorizeRole,
  authorizeDepartmentForSection,
  authorizeWorkspaceOwner,
  blockPersonalReports
};
