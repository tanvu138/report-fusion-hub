const express = require('express');
const router = express.Router();

const { authenticate, authorizeRole } = require('../middleware/auth');
const { createShare, listShares, revokeShare, regenerateCode, viewSharedReport } = require('../controllers/sharedReportController');

// Secretary-only secured endpoints
router.post('/:reportId/share', authenticate, authorizeRole('secretary'), createShare);
router.get('/:reportId/shared-links', authenticate, authorizeRole('secretary'), listShares);

// revoke and regenerate
router.delete('/shared-reports/:shareId', authenticate, authorizeRole('secretary'), revokeShare);
router.put('/shared-reports/:shareId/regenerate-code', authenticate, authorizeRole('secretary'), regenerateCode);

// Public access (no auth)
router.get('/public/shared-reports/:shareId', viewSharedReport);

module.exports = router;
