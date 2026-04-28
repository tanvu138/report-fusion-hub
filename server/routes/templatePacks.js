/**
 * Template Pack Routes
 * 
 * This module defines routes for managing template packs:
 * - GET /api/template-packs: List all template packs
 * - POST /api/template-packs: Create new template pack (secretary only)
 * - POST /api/reports/from-pack/:packId: Create report from template pack (secretary only)
 * - PUT /api/template-packs/:id/items: Update template pack items (secretary only)
 */

const express = require('express');
const { authenticate, authorizeRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { 
  getTemplatePacks, 
  createTemplatePack, 
  createReportFromPack,
  updateTemplatePackItems 
} = require('../controllers/templatePackController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/template-packs
 * @desc Get all template packs
 * @access Private
 */
router.get('/', getTemplatePacks);

/**
 * @route POST /api/template-packs
 * @desc Create a new template pack
 * @access Private - secretary only
 */
router.post(
  '/',
  authorizeRole('secretary'),
  createTemplatePack
);

/**
 * @route PUT /api/template-packs/:id/items
 * @desc Update template pack items
 * @access Private - secretary only
 */
router.put(
  '/:id/items',
  authorizeRole('secretary'),
  updateTemplatePackItems
);

module.exports = router;
