const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middleware/auth');
const { 
  getReportTemplates,
  getReportTemplateById,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
  duplicateReportTemplate
} = require('../controllers/reportTemplateController');

// @route   GET /api/report-templates
// @desc    Get all report templates
// @access  Private (secretary)
router.get('/', authenticate, authorizeRole(['secretary']), getReportTemplates);

// @route   GET /api/report-templates/:id
// @desc    Get a single report template by ID
// @access  Private (secretary)
router.get('/:id', authenticate, authorizeRole(['secretary']), getReportTemplateById);

// @route   POST /api/report-templates
// @desc    Create a new report template
// @access  Private (secretary)
router.post('/', authenticate, authorizeRole(['secretary']), createReportTemplate);

// @route   PUT /api/report-templates/:id
// @desc    Update a report template
// @access  Private (secretary)
router.put('/:id', authenticate, authorizeRole(['secretary']), updateReportTemplate);

// @route   POST /api/report-templates/:id/duplicate
// @desc    Duplicate a report template
// @access  Private (secretary)
router.post('/:id/duplicate', authenticate, authorizeRole(['secretary']), duplicateReportTemplate);

// @route   DELETE /api/report-templates/:id
// @desc    Delete a report template
// @access  Private (secretary)
router.delete('/:id', authenticate, authorizeRole(['secretary']), deleteReportTemplate);

module.exports = router;
