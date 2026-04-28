/**
 * Export Routes
 * 
 * This module defines routes for exporting reports:
 * - GET /api/reports/:id/export/pdf: Export a report as PDF
 * 
 * All export routes require authentication.
 */

const express = require('express');
const { exportReportPdf } = require('../controllers/exportController');
const { authenticate, blockPersonalReports } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Block PERSONAL reports — workspace has its own routes
router.param('id', blockPersonalReports);

/**
 * @route GET /api/reports/:id/export/pdf
 * @desc Export a report as PDF file
 * @access Private
 */
router.get('/:id/export/pdf', exportReportPdf);

module.exports = router;
