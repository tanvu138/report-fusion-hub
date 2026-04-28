/**
 * Temporary authentication middleware fix
 * This is a direct copy of the auth.js middleware with inlined dependencies
 * to bypass the import error
 */

const jwt = require('jsonwebtoken');
const { t } = require('../utils/i18n');

// Inline the JWT_SECRET from config/env.js to avoid the problematic import
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';

/**
 * Middleware to authenticate requests using JWT
 * Attaches user object to request if authentication succeeds
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: t('auth.required', req.language) });
    }

    const token = authHeader.split(' ')[1];
    
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
    const { sectionId } = req.params;
    
    // Get section with its department info
    const section = await req.prisma.reportSection.findUnique({
      where: { id: sectionId },
      include: {
        department: true
      }
    });
    
    if (!section) {
      return res.status(404).json({ message: t('auth.sectionNotFound', req.language) });
    }
    
    // Check if user belongs to the department
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

module.exports = {
  authenticate,
  authorizeRole,
  authorizeDepartmentForSection
};
