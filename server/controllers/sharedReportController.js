const { createShareLink, listShareLinks, revokeShareLink, getSnapshot, regenerateShareCode } = require('../services/sharedReportService');
const { t } = require('../utils/i18n');
const { FRONTEND_URL } = require('../config/env');

/**
 * POST /api/reports/:reportId/share
 */
async function createShare(req, res, next) {
  try {
    const { reportId } = req.params;
    const { accessLevel, expiresAt } = req.body;
    const { id: userId } = req.user;

    const parsedExpiry = expiresAt ? new Date(expiresAt) : null;

    const { shareLink, plainCode } = await createShareLink(reportId, userId, accessLevel, parsedExpiry);

    const url = `${FRONTEND_URL}/share/${shareLink.id}`;

    res.status(201).json({ shareId: shareLink.id, url, code: plainCode });
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ message: t('sharedReport.notFound', req.language) });
    }
    next(err);
  }
}

/**
 * GET /api/reports/:reportId/shared-links
 */
async function listShares(req, res, next) {
  try {
    const { reportId } = req.params;
    const shares = await listShareLinks(reportId);
    res.json(shares);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/shared-reports/:shareId
 */
async function revokeShare(req, res, next) {
  try {
    const { shareId } = req.params;
    await revokeShareLink(shareId);
    res.status(204).send();
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ message: t('sharedReport.notFound', req.language) });
    }
    next(err);
  }
}

/**
 * PUT /api/reports/shared-reports/:shareId/regenerate-code
 */
async function regenerateCode(req, res, next) {
  try {
    const { shareId } = req.params;
    const { shareLink, plainCode } = await regenerateShareCode(shareId);
    res.json({ shareId: shareLink.id, code: plainCode });
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ message: t('sharedReport.notFound', req.language) });
    }
    next(err);
  }
}

/**
 * GET /public/shared-reports/:shareId (no auth)
 */
async function viewSharedReport(req, res, next) {
  try {
    const { shareId } = req.params;
    const code = req.header('X-Code') || '';
    const snapshot = await getSnapshot(shareId, code);
    res.json(snapshot);
  } catch (err) {
    switch (err.code) {
      case 'NOT_FOUND':
        return res.status(404).json({ message: t('sharedReport.notFound', req.language) });
      case 'EXPIRED':
        return res.status(410).json({ message: t('sharedReport.expired', req.language) });
      case 'INVALID_CODE':
        return res.status(401).json({ message: t('sharedReport.accessDenied', req.language) });
      default:
        return next(err);
    }
  }
}

module.exports = {
  createShare,
  listShares,
  revokeShare,
  regenerateCode,
  viewSharedReport,
};
