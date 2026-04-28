/**
 * Authentication Routes
 * 
 * This module defines the authentication-related routes:
 * - POST /api/login: User login
 * - GET /api/me: Get current user profile
 * 
 * The login route is public, while the profile route requires authentication.
 */

const express = require('express');
const { login, getCurrentUser, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

/**
 * @route POST /api/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post('/login', validateRequest(schemas.login), login);

/**
 * @route GET /api/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route POST /api/logout
 * @desc Logout user and clear authentication cookie
 * @access Private (requires user to be authenticated to logout)
 */
router.post('/logout', authenticate, logout);

module.exports = router;
