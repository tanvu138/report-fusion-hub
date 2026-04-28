/**
 * Authentication Controller
 * 
 * This controller handles user authentication operations:
 * - Login with email and password
 * - Get current user information
 * 
 * It utilizes bcrypt for password comparison and JWT for token generation.
 * No registration endpoint is provided as users are created via database seeding.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, JWT_EXPIRY } = require('../config/env');
const { t } = require('../utils/i18n');

/**
 * Convert time string to milliseconds
 * Supports: 1d, 12h, 30m, 60s, or plain number (treated as seconds)
 */
const parseTimeToMs = (timeStr) => {
  if (typeof timeStr === 'number') {
    return timeStr * 1000; // Treat as seconds
  }
  
  const str = String(timeStr).toLowerCase();
  const num = parseInt(str);
  
  if (str.endsWith('d')) {
    return num * 24 * 60 * 60 * 1000; // days to ms
  } else if (str.endsWith('h')) {
    return num * 60 * 60 * 1000; // hours to ms
  } else if (str.endsWith('m')) {
    return num * 60 * 1000; // minutes to ms
  } else if (str.endsWith('s')) {
    return num * 1000; // seconds to ms
  } else {
    // If no unit, treat as seconds
    return num * 1000;
  }
};

/**
 * Login user with username and password
 * 
 * @route POST /api/login
 * @param {object} req.body - Request body
 * @param {string} req.body.username - User username
 * @param {string} req.body.password - User password
 * @returns {object} User data and JWT token
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    // Login attempt for username (password not logged for security)
    
    // Find user by username (case insensitive)
    const user = await req.prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive' // Case insensitive search
        }
      },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: t('user.invalidCredentials', req.language) });
    }
    
    // Compare provided password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: t('user.invalidCredentials', req.language) });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    // Prepare user data (exclude password)
    const { password: _, ...userData } = user;
    
    // Calculate cookie maxAge
    const cookieMaxAge = parseTimeToMs(JWT_EXPIRY);
    // Cookie configuration complete
    
    // Set token in HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true, // Client-side JS cannot access the cookie
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
      sameSite: 'Lax', // CSRF protection
      maxAge: cookieMaxAge, // ms
      path: '/' // Cookie available for all paths
    });

    // Return user data (without token in body)
    res.json({ user: userData });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user information
 * 
 * @route GET /api/me
 * @requires authentication
 * @returns {object} User profile data
 */
const getCurrentUser = async (req, res) => {
  // User data is already attached to request by auth middleware
  res.json({
    user: req.user
  });
};

/**
 * Logout user by clearing the auth_token cookie
 * 
 * @route POST /api/logout
 * @returns {object} Success message
 */
const logout = (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/' // Ensure it matches the path used when setting the cookie
  });
  res.status(200).json({ message: t('auth.logoutSuccessful', req.language) });
};

module.exports = {
  login,
  getCurrentUser,
  logout
};
