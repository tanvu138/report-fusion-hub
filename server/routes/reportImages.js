const express = require('express');
const path = require('path');
const mime = require('mime-types');
const { decryptBuffer } = require('../utils/encryptionUtils');
const { t } = require('../utils/i18n');
const fs = require('fs');
const { authenticate } = require('../middleware/auth'); // Assuming auth middleware location

const router = express.Router();

// Middleware to ensure Prisma is available
router.use((req, res, next) => {
  if (!req.prisma) {
    const { PrismaClient } = require('@prisma/client');
    req.prisma = new PrismaClient();
  }
  next();
});

// Helper function to serve image file
async function serveImage(reportId, filename, res, language = 'en') {
  const imagePath = path.join(__dirname, '..', 'secure_uploads', 'report_images', reportId, filename);

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: t('file.imageNotFound', language) });
  }

  fs.readFile(imagePath, (readErr, encryptedBuffer) => {
    if (readErr) {
      console.error('Failed to read encrypted image:', readErr);
      return res.status(500).json({ error: t('file.decryptionFailed', language) });
    }

    let decrypted;
    try {
      decrypted = decryptBuffer(encryptedBuffer);
    } catch (decErr) {
      console.error('Failed to decrypt image:', decErr);
      return res.status(500).json({ error: t('file.decryptionFailed', language) });
    }

    // Set appropriate mime type from original filename extension
    const mimeType = mime.lookup(path.extname(filename)) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.send(decrypted);
  });
}

// GET /api/report-images/:reportId/:filename
// Serves an image for a specific report, requires authentication or valid share access.
router.get('/:reportId/:filename', async (req, res, next) => {
  const { reportId, filename } = req.params;
  const { shareId } = req.query;
  const shareCode = req.header('X-Code');

  // Basic validation for filename to prevent directory traversal attacks
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: t('file.invalidFilename', req.language) });
  }

  // Validate resource exists in database
  try {
    const reportImage = await req.prisma.reportImage.findFirst({
      where: {
        reportId,
        filename,
        isActive: true
      },
      include: {
        report: {
          select: {
            id: true,
            isDeleted: true
          }
        }
      }
    });

    if (!reportImage) {
      return res.status(404).json({ error: t('file.imageNotFound', req.language) });
    }

    if (reportImage.report.isDeleted) {
      return res.status(404).json({ error: t('file.imageNotFound', req.language) });
    }
  } catch (dbError) {
    console.error('Database error while validating image access:', dbError);
    return res.status(500).json({ error: 'Failed to validate image access.' });
  }

  // Check if shared access is being used
  if (shareId && shareCode) {
    try {
      // Validate the share access
      const sharedReportLink = await req.prisma.sharedReportLink.findFirst({
        where: {
          id: shareId,
          expiresAt: {
            gte: new Date()
          },
          report: {
            id: reportId,
            isDeleted: false
          }
        }
      });

      if (!sharedReportLink) {
        return res.status(403).json({ error: t('sharedReport.expired', req.language) });
      }

      // Validate the access code against the hash
      const bcrypt = require('bcrypt');
      const isValidCode = await bcrypt.compare(shareCode, sharedReportLink.codeHash);
      
      if (!isValidCode) {
        return res.status(403).json({ error: t('sharedReport.invalidCode', req.language) });
      }

      // Note: Access logging could be added here if needed in the future
      
      // Authorized via share, serve image
      serveImage(reportId, filename, res, req.language);
      return;
    } catch (error) {
      console.error('Error validating share access:', error);
      return res.status(500).json({ error: 'Failed to validate share access.' });
    }
  } else {
    // If no share parameters, require authentication
    authenticate(req, res, (err) => {
      if (err || !req.user) {
        return res.status(401).json({ error: t('auth.required', req.language) });
      }
      // Authorized via authentication, serve image
      serveImage(reportId, filename, res, req.language);
    });
  }
});

module.exports = router;
