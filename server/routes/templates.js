const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticate, authorizeRole } = require('../middleware/auth');

// All template routes require authentication
router.use(authenticate);

// List active templates (all authenticated users)
router.get('/', templateController.listTemplates);

// Preview template structure (all authenticated users)
router.get('/:id/preview', templateController.previewTemplate);

// Secretary-only routes
router.post('/', authorizeRole(['secretary']), templateController.createTemplate);
router.put('/:id', authorizeRole(['secretary']), templateController.updateTemplate);
router.delete('/:id', authorizeRole(['secretary']), templateController.deleteTemplate);

module.exports = router;
