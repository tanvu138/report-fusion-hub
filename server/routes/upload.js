const express = require('express');
const multer = require('multer');
const { encryptBuffer } = require('../utils/encryptionUtils');
const { authenticate } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');
const { t } = require('../utils/i18n');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure the uploads directory exists
// Base directory for secure uploads
const secureUploadsBaseDir = path.join(__dirname, '..', 'secure_uploads', 'report_images');
// Subdirectories will be created dynamically per reportId during upload

// Configure multer to keep files in memory so we can encrypt before persisting
const storage = multer.memoryStorage();


// File filter to accept only images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    // File rejected by filter
    cb(new Error(t('file.typeNotAllowed', req.language || 'en')), false);
  }
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
    files: 1 // Only allow 1 file per request
  }
});

// POST /api/upload - Requires authentication
router.post('/', authenticate, (req, res, next) => {
  // Process file upload request first, then validate
  upload.single('file')(req, res, async function (err) {
    if (err) {
      if (err.message === 'Report ID is required for upload.') {
        return res.status(400).json({ error: t('validation.requiredField', req.language) });
      }
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: t('file.tooLarge', req.language) });
        }
        return res.status(400).json({ error: t('file.uploadFailed', req.language) });
      } 
      // Other errors (e.g., from fileFilter or fs operations)
      return res.status(500).json({ error: t('file.uploadFailed', req.language) });
    }

    // Everything went fine, and req.file is populated.
    // req.file should be populated if upload was successful
    // req.body.reportId was necessary for destination logic
    if (!req.file) {
      // This error might be redundant if multer already caught it, but good as a fallback.
      return res.status(400).json({ error: t('file.noFileProvided', req.language) });
    }
    // Manual validation after multer processes FormData
    if (!req.body.reportId || typeof req.body.reportId !== 'string' || req.body.reportId.trim().length === 0) {
        return res.status(400).json({ 
          error: t('validation.requiredField', req.language)
        });
    }

    // Determine destination directory & ensure it exists
    const reportUploadDir = path.join(secureUploadsBaseDir, req.body.reportId);
    fs.mkdirSync(reportUploadDir, { recursive: true });

    // Security: Verify user has access to this report
    try {
      const report = await req.prisma.report.findFirst({
        where: {
          id: req.body.reportId,
          isDeleted: false
        },
        include: {
          sections: {
            where: { isActive: true },
            select: { departmentId: true }
          }
        }
      });

      if (!report) {
        return res.status(404).json({ error: t('report.notFound', req.language) });
      }

      // Check if user has access to this report
      if (req.user.role === 'department') {
        const hasAccess = report.sections.some(section => section.departmentId === req.user.departmentId);
        if (!hasAccess) {
          return res.status(403).json({ error: t('file.accessDenied', req.language) });
        }
      }
    } catch (dbError) {
      return res.status(500).json({ error: t('general.serverError', req.language) });
    }

    // Generate a secure filename with limited extension whitelist
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const originalExt = path.extname(req.file.originalname).toLowerCase();
    if (!allowedExtensions.includes(originalExt)) {
      return res.status(400).json({ error: t('file.typeNotAllowed', req.language) });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const finalFilename = `${req.file.fieldname}-${uniqueSuffix}${originalExt}`;

    const encryptedBuffer = encryptBuffer(req.file.buffer);
    const fileDiskPath = path.join(reportUploadDir, finalFilename);

    try {
      fs.writeFileSync(fileDiskPath, encryptedBuffer);
    } catch (writeErr) {
      return res.status(500).json({ error: t('file.uploadFailed', req.language) });
    }

    // Create ReportImage record in database
    try {
      await req.prisma.reportImage.create({
        data: {
          reportId: req.body.reportId,
          filename: finalFilename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          uploadedById: req.user.id,
          isActive: true
        }
      });
    } catch (dbError) {
      // If database operation fails, clean up the uploaded file
      try {
        fs.unlinkSync(fileDiskPath);
      } catch (cleanupError) {
        console.error('Failed to cleanup file after database error:', cleanupError);
      }
      console.error('Database error while creating ReportImage record:', dbError);
      return res.status(500).json({ error: t('file.uploadFailed', req.language) });
    }

    // Return the relative URL path (no hardcoded server URL)
    const fileUrlPath = `/api/report-images/${req.body.reportId}/${finalFilename}`;
    res.status(201).json({ url: fileUrlPath });
  });
});

module.exports = router;
