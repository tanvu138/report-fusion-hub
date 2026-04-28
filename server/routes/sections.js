/**
 * Section Routes
 * 
 * This module defines routes for managing report sections:
 * - GET /api/reports/:id/sections: Get all sections for a report
 * - PUT /api/reports/:id/sections/:sectionId: Update section content
 * - PATCH /api/reports/:id/sections/:sectionId/active: Toggle section activation
 * - PUT /api/reports/:id/sections/:sectionId/submit: Submit a section
 * 
 * All routes require authentication, and some require specific roles or department authorization.
 */

const express = require('express');
const {
  getReportSections,
  updateSectionContent,
  toggleSectionActive,
  submitSection
} = require('../controllers/sectionController');
const { authenticate, authorizeRole, authorizeDepartmentForSection, blockPersonalReports } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Block PERSONAL reports — workspace has its own routes
router.param('id', blockPersonalReports);

/**
 * @route GET /api/reports/:id/sections
 * @desc Get all sections for a report
 * @access Private
 */
router.get('/:id/sections', getReportSections);

/**
 * @route PUT /api/reports/:id/sections/:sectionId
 * @desc Update section content
 * @access Private - Department authorized only
 * 
 * The authorizeDepartmentForSection middleware ensures that:
 * - secretary users can update any section
 * - department users can only update sections for their department
 */
router.put(
  '/:id/sections/:sectionId',
  validateRequest(schemas.updateSection),
  authorizeDepartmentForSection,
  updateSectionContent
);

/**
 * @route PATCH /api/reports/:id/sections/:sectionId/active
 * @desc Toggle section activation status
 * @access Private - secretary only
 */
router.patch(
  '/:id/sections/:sectionId/active',
  authorizeRole('secretary'),
  validateRequest(schemas.toggleSection),
  toggleSectionActive
);

/**
 * @route PUT /api/reports/:id/sections/:sectionId/submit
 * @desc Submit a section
 * @access Private - Department authorized only
 */
router.put(
  '/:id/sections/:sectionId/submit',
  authorizeDepartmentForSection,
  submitSection
);

module.exports = router;
