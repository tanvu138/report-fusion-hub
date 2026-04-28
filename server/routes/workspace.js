/**
 * Workspace Routes
 *
 * Personal workspace note endpoints for all authenticated users.
 * No role restriction — both secretary and department users can use workspace.
 */
const express = require('express');
const { authenticate, authorizeWorkspaceOwner } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');
const ctrl = require('../controllers/workspace-controller');

const router = express.Router();

router.use(authenticate);

router.get('/reports', ctrl.listReports);
router.post('/reports', validateRequest(schemas.createWorkspaceReport), ctrl.createReport);
router.get('/reports/:id', authorizeWorkspaceOwner, ctrl.getReport);
router.put('/reports/:id', authorizeWorkspaceOwner, validateRequest(schemas.updateWorkspaceReport), ctrl.updateReport);
router.put('/reports/:id/content', authorizeWorkspaceOwner, validateRequest(schemas.updateWorkspaceContent), ctrl.updateContent);
router.delete('/reports/:id', authorizeWorkspaceOwner, ctrl.deleteReport);

module.exports = router;
