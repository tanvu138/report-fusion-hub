/**
 * Admin Settings Routes
 * 
 * Handles global application settings that can only be modified by admin users (secretary role).
 * This includes navigation preferences, feature flags, and other app-wide configurations.
 * 
 * Routes:
 * - GET /api/admin/settings/:key - Get a specific global setting
 * - PUT /api/admin/settings/:key - Update a specific global setting  
 * - GET /api/admin/settings - List all global settings
 * 
 * All routes require authentication and secretary role.
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../../middleware/auth');

// Apply authentication and secretary role requirement to all routes
router.use(authenticate);
router.use(authorizeRole('secretary'));

/**
 * GET /api/admin/settings/:key
 * Fetch a specific global setting by key
 */
router.get('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ 
        error: 'Setting key is required and must be a string' 
      });
    }
    
    const setting = await req.prisma.globalSetting.findUnique({
      where: { key },
      select: {
        key: true,
        value: true,
        updatedAt: true,
        updatedBy: true
      }
    });
    
    if (!setting) {
      return res.status(404).json({ 
        error: 'Setting not found',
        key 
      });
    }
    
    res.json({ 
      key: setting.key, 
      value: setting.value,
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy
    });
  } catch (error) {
    console.error('Error fetching global setting:', error);
    next(error);
  }
});

/**
 * PUT /api/admin/settings/:key
 * Update or create a specific global setting
 */
router.put('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    // Validation
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ 
        error: 'Setting key is required and must be a string' 
      });
    }
    
    if (value === undefined || value === null || typeof value !== 'string') {
      return res.status(400).json({ 
        error: 'Value is required and must be a string' 
      });
    }
    
    // Additional validation for specific settings
    if (key === 'navigation_type') {
      if (!['horizontal', 'vertical'].includes(value)) {
        return res.status(400).json({
          error: 'Invalid navigation type. Must be "horizontal" or "vertical"'
        });
      }
    }
    
    const setting = await req.prisma.globalSetting.upsert({
      where: { key },
      update: { 
        value,
        updatedAt: new Date(),
        updatedBy: req.user.id
      },
      create: { 
        key, 
        value,
        createdBy: req.user.id,
        updatedBy: req.user.id
      },
      select: {
        key: true,
        value: true,
        updatedAt: true,
        updatedBy: true
      }
    });
    
    res.json({ 
      key: setting.key, 
      value: setting.value,
      updatedAt: setting.updatedAt,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Error updating global setting:', error);
    next(error);
  }
});

/**
 * GET /api/admin/settings
 * List all global settings (admin overview)
 */
router.get('/', async (req, res, next) => {
  try {
    const settings = await req.prisma.globalSetting.findMany({
      select: {
        key: true,
        value: true,
        updatedAt: true,
        updatedBy: true
      },
      orderBy: {
        key: 'asc'
      }
    });
    
    res.json({
      settings,
      count: settings.length
    });
  } catch (error) {
    console.error('Error fetching global settings:', error);
    next(error);
  }
});

module.exports = router;