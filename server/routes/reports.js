/**
 * Report Routes
 * 
 * This module defines routes for managing reports:
 * - GET /api/reports: List all reports (filtered by user role)
 * - POST /api/reports/custom: Create a custom report without a template (secretary only)
 * - POST /api/reports/from-template/:templateId: Create report from a template (secretary only)
 * - GET /api/reports/:id: Get report details
 * - PUT /api/reports/:id: Update report details (secretary only)
 * - POST /api/reports/:id/sections: Add a section to an existing report (secretary only)
 * - PUT /api/reports/:id/finalize: Finalize a report (secretary only)
 * - GET /api/reports/:id/export: Export report as DOCX
 * - POST /api/reports: DEPRECATED - Create a new report (secretary only)
 * 
 * All routes require authentication, and some require specific roles.
 */

const express = require('express');
const {
  getReports,
  createReport, // Kept for now, but should be deprecated
  getReportById,
  updateReport,
  finalizeReport,
  createReportFromTemplate,
  createCustomReport,
  addSectionToReport,
  deleteReport,
  updateFullReportContentHandler,
  getDepartmentProgress
} = require('../controllers/reportController');
const { authenticate, authorizeRole } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// No blockPersonalReports needed — controller queries already filter type: 'OFFICIAL'

/**
 * @route GET /api/reports
 * @desc Get all reports (filtered by user role)
 * @access Private
 */
router.get('/', validateRequest(schemas.pagination), getReports);

/**
 * @route POST /api/reports/custom
 * @desc Create a new custom report (without template)
 * @access Private - secretary only
 */
router.post(
  '/custom',
  authorizeRole(['secretary']),
  validateRequest(schemas.createCustomReport), // Assuming a schema exists or will be created
  createCustomReport
);

/**
 * @route POST /api/reports/from-template/:templateId
 * @desc Create report from a specific template
 * @access Private - secretary only
 */
router.post(
  '/from-template/:templateId',
  authorizeRole(['secretary']),
  validateRequest(schemas.createReportFromTemplate), // Assuming a schema exists or will be created
  createReportFromTemplate
);

/**
 * @route GET /api/reports/:id
 * @desc Get report details
 * @access Private
 */
router.get('/:id', getReportById);

/**
 * @route GET /api/reports/:id/department-progress
 * @desc Get department progress for a specific report
 * @access Private
 */
router.get('/:id/department-progress', getDepartmentProgress);

/**
 * @route PUT /api/reports/:id
 * @desc Update report details
 * @access Private - secretary only
 */
router.put(
  '/:id',
  authorizeRole(['secretary']),
  validateRequest(schemas.updateReport),
  updateReport
);

/**
 * @route POST /api/reports/:id/sections
 * @desc Add a section to an existing report
 * @access Private - secretary only
 */
router.post(
  '/:id/sections',
  authorizeRole(['secretary']),
  validateRequest(schemas.addSectionToReport), // Assuming a schema exists or will be created
  addSectionToReport
);

/**
 * @route PUT /api/reports/:id/finalize
 * @desc Finalize a report
 * @access Private - secretary only
 */
router.put(
  '/:id/finalize',
  authorizeRole(['secretary']),
  finalizeReport
);


/**
 * @route DELETE /api/reports/:id
 * @desc Delete a report
 * @access Private - secretary only
 */
router.delete(
  '/:id',
  authorizeRole(['secretary']),
  deleteReport
);

/**
 * @route PUT /api/reports/:id/full-content
 * @desc Update all sections of a report at once
 * @access Private - secretary only
 */
router.put(
  '/:id/full-content',
  authorizeRole(['secretary']),
  validateRequest(schemas.updateFullReportContent), // Schema to be defined
  updateFullReportContentHandler
);

// DEPRECATED: This route will be removed in a future version. 
// Use /custom or /from-template instead.
/**
 * @route POST /api/reports
 * @desc Create a new report (OLD - prefer /custom or /from-template)
 * @access Private - secretary only
 * @deprecated
 */
router.post(
  '/',
  authorizeRole(['secretary']),
  validateRequest(schemas.createReport), // This schema might need to be adjusted or removed
  createReport
 );

module.exports = router;
