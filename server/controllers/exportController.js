/**
 * Export Controller
 * 
 * This controller handles exporting reports to downloadable formats:
 * - Export report as PDF file
 * 
 * The process:
 * 1. Fetches all active sections for a report
 * 2. Aggregates report title, metadata, and section markdown
 * 3. Converts markdown to HTML using marked library
 * 4. Resolves resource identifiers to base64 data URIs for embedded images
 * 5. Generates PDF using Puppeteer (headless Chrome)
 * 6. Returns the PDF as a downloadable attachment
 * 
 * Recent refactoring:
 * - Replaced Pandoc with Puppeteer for better deployment compatibility
 * - Uses modern HTML/CSS for styling instead of LaTeX
 * - Handles images as base64 data URIs for embedded content
 * - Optimized for Ubuntu/Docker deployment
 * - No external dependencies required
 */

const puppeteer = require('puppeteer');
const { marked } = require('marked');
const path = require('path');
const { decryptBuffer } = require('../utils/encryptionUtils');
const fs = require('fs');
const { t } = require('../utils/i18n');

/**
 * Clean up temporary files for a specific report
 * Note: With Puppeteer + base64 images, we no longer create temporary files
 * This function is kept for backward compatibility but does nothing
 * @param {string} reportId - The report ID to clean up files for
 * @param {boolean} verbose - Whether to log cleanup actions
 */
function cleanupTempFiles(reportId, verbose = false) {
  // No-op: Puppeteer implementation uses base64 data URIs
  // No temporary files are created that need cleanup
  if (verbose) {
    console.log(`No temporary files to clean up for report ${reportId} (using Puppeteer)`);
  }
}

/**
 * Transform content for export by replacing image references with text placeholders
 * This prevents PDF bloat from base64 image embedding while maintaining readability
 * @param {string} content - Markdown content that may contain resource identifiers
 * @param {string} reportId - The report ID for validation
 * @returns {string} Transformed content with image placeholders
 */
function transformContentForExport(content, reportId) {
  if (!content) return content;

  return content.replace(
    /@resource:report-image:([^:]+):([^)\s]+)/g,
    (match, rId, filename) => {
      try {
        if (rId === reportId) {
          // Get the encrypted file path to verify existence
          const encryptedPath = path.join(__dirname, '..', 'secure_uploads', 'report_images', reportId, filename);
          
          if (fs.existsSync(encryptedPath)) {
            // Instead of embedding, create a text placeholder
            return `[📷 Image: ${filename}]`;
          } else {
            console.warn(`Image file not found for export: ${encryptedPath}`);
            return `[Image not found: ${filename}]`;
          }
        }
        // Cross-report references are not supported in export
        return '[Cross-report image reference not supported in export]';
      } catch (error) {
        console.warn(`Failed to resolve resource for export: ${match}`, error);
        return '[Resource not found]';
      }
    }
  );
}

/**
 * Export report as PDF file using Puppeteer
 * 
 * @route GET /api/reports/:id/export/pdf
 * @query ?filename=custom_name.pdf (optional filename hint)
 * @requires authentication
 * @param {string} req.params.id - Report ID
 * @param {string} req.query.filename - Optional filename override
 * @returns {Buffer} PDF file as download attachment
 */
const exportReportPdf = async (req, res, next) => {
  let reportId = null;
  let browser = null;
  
  try {
    const { id } = req.params;
    const { filename: queryFilename } = req.query;
    reportId = id;
    
    console.log(`PDF Export: Starting export for report ${reportId}`);
    if (queryFilename) {
      console.log(`PDF Export: Query filename provided: ${queryFilename}`);
    }
    
    // Get report with active sections
    const report = await req.prisma.report.findUnique({
      where: { id },
      include: {
        sections: {
          where: {
            isActive: true
          },
          include: {
            department: true,
            reportTemplateSection: {
              select: {
                sectionName: true
              }
            }
          },
          orderBy: [
            {
              department: {
                name: 'asc'
              }
            },
            {
              displayOrder: 'asc'
            }
          ]
        }
      }
    });
    
    // Report not found
    if (!report) {
      console.log(`PDF Export: Report ${reportId} not found`);
      return res.status(404).json({ message: t('report.notFound', req.language) });
    }
    
    // No active sections
    if (report.sections.length === 0) {
      console.log(`PDF Export: No active sections for report ${reportId}`);
      return res.status(400).json({ message: t('report.sectionsRequired', req.language) });
    }
    
    console.log(`PDF Export: Found ${report.sections.length} active sections for report ${reportId}`);
    
    // Prepare Markdown content with base64 images
    let markdownContent = `# ${report.title}\n\n`;
    markdownContent += `Report cycle: ${report.cycle.charAt(0) + report.cycle.slice(1).toLowerCase()}\n\n`;
    markdownContent += '---\n\n';

    // Group sections by department
    const sectionsByDept = report.sections.reduce((acc, section) => {
      const deptName = section.department.name;
      if (!acc[deptName]) {
        acc[deptName] = [];
      }
      acc[deptName].push(section);
      return acc;
    }, {});

    console.log(`PDF Export: Grouped sections into ${Object.keys(sectionsByDept).length} departments`);

    // Generate Markdown for each department and its sections
    Object.entries(sectionsByDept).forEach(([deptName, sections]) => {
      markdownContent += `## ${deptName} Department\n\n`;
      sections.forEach(section => {
        if (section.contentMarkdown) {
          // Transform resource identifiers to base64 data URIs
          const exportContent = transformContentForExport(section.contentMarkdown, id);
          markdownContent += `${exportContent}\n\n`;
          markdownContent += '---\n\n';
        }
      });
    });

    // Check content size before processing
    const contentSizeKB = Buffer.byteLength(markdownContent, 'utf8') / 1024;
    console.log(`PDF Export: Content size is ${contentSizeKB.toFixed(1)}KB for report ${reportId}`);
    
    if (contentSizeKB > 1024) { // 1MB limit for content
      console.warn(`Content too large for PDF export: ${contentSizeKB.toFixed(1)}KB`);
      return res.status(413).json({ 
        message: t('export.generationFailed', req.language),
        sizeKB: contentSizeKB.toFixed(1),
        maxSizeKB: 1024
      });
    }

    // Convert Markdown to HTML
    const htmlContent = marked(markdownContent);
    
    // Read HTML template
    const templatePath = path.join(__dirname, '..', 'templates', 'pdfTemplate.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Replace template variables with proper escaping
    htmlTemplate = htmlTemplate
      .replace(/\{\{title\}\}/g, report.title.replace(/[<>&"']/g, (char) => {
        const escapeMap = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
        return escapeMap[char];
      }))
      .replace(/\{\{cycle\}\}/g, report.cycle.charAt(0) + report.cycle.slice(1).toLowerCase())
      .replace(/\{\{generatedDate\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{content\}\}/g, htmlContent);

    // Enhanced filename generation with query parameter support
    let fileName;
    
    // Priority 1: Use query parameter if provided and valid
    if (queryFilename) {
      const sanitizedQueryFilename = sanitizeFilename(queryFilename);
      if (sanitizedQueryFilename && sanitizedQueryFilename !== 'download') {
        fileName = sanitizedQueryFilename;
        console.log(`PDF Export: Using query filename: "${fileName}"`);
      }
    }
    
    // Priority 2: Generate from report title (original logic)
    if (!fileName) {
      const sanitizedTitle = sanitizeReportTitle(report.title);
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      fileName = `${sanitizedTitle}_${timestamp}.pdf`;
      console.log(`PDF Export: Generated filename from report title: "${fileName}"`);
    }
    
    // Final safety check
    if (!fileName || fileName === 'download' || fileName === '.pdf') {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_');
      fileName = `report_export_${timestamp}.pdf`;
      console.log(`PDF Export: Using fallback timestamp filename: "${fileName}"`);
    }
    
    console.log(`PDF Export: Final filename: "${fileName}"`);

    // Launch Puppeteer with optimized settings for PDF generation
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--no-default-browser-check',
        '--no-pings',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-component-extensions-with-background-pages',
        '--disable-blink-features=AutomationControlled',
        '--memory-pressure-off'
      ],
      timeout: 30000
    });

    const page = await browser.newPage();
    
    // Set viewport and optimize for PDF
    await page.setViewport({ width: 794, height: 1123 }); // A4 size in pixels
    
    // Set content with memory-efficient loading
    await page.setContent(htmlTemplate, {
      waitUntil: 'domcontentloaded', // Changed from networkidle0 to be more efficient
      timeout: 30000
    });

    console.log(`PDF Export: Generating PDF with Puppeteer...`);

    // Generate PDF with professional document margins (wider content area)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0.5in',
        right: '0.5in', 
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: false, // Disable background to reduce size
      displayHeaderFooter: false,
      preferCSSPageSize: false,
      timeout: 30000,
      omitBackground: true, // Reduce file size
      tagged: false, // Disable accessibility tags to reduce size
      outline: false // Disable outline to reduce size
    });

    // Close browser
    await browser.close();
    browser = null;

    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF generation failed: empty buffer');
    }

    // Validate PDF header to ensure buffer integrity
    const header = String.fromCharCode(...pdfBuffer.slice(0, 4));
    if (header !== '%PDF') {
      throw new Error(`Invalid PDF header: expected '%PDF', got '${header}'`);
    }

    const pdfSizeKB = pdfBuffer.length / 1024;
    console.log(`PDF Export: Generated PDF size is ${pdfSizeKB.toFixed(1)}KB for report ${reportId}`);
    console.log(`PDF Export: Buffer header validation passed: ${header}`);

    // Warn if PDF is unusually large
    if (pdfSizeKB > 512) { // 512KB warning threshold
      console.warn(`Generated PDF is large: ${pdfSizeKB.toFixed(1)}KB`);
    }

    // Set response headers for file download with enhanced RFC 6266 compliant filename
    // Using multiple encoding strategies for maximum browser compatibility
    const encodedFileName = encodeURIComponent(fileName);
    const asciiFileName = fileName.replace(/[^\x00-\x7F]/g, '_'); // ASCII fallback
    
    const contentDisposition = [
      'attachment',
      `filename="${asciiFileName}"`, // ASCII version for old browsers
      `filename*=UTF-8''${encodedFileName}` // UTF-8 encoded version (RFC 6266)
    ].join('; ');
    
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Add custom headers for frontend debugging
    res.setHeader('X-Export-Filename', fileName);
    res.setHeader('X-Export-Source', 'puppeteer');
    
    console.log(`PDF Export: Set response headers for ${fileName} (${pdfSizeKB.toFixed(1)}KB)`);
    console.log(`PDF Export: Content-Disposition: ${contentDisposition}`);
    console.log(`PDF Export: Content-Length set to ${pdfBuffer.length} bytes`);
    console.log(`PDF Export: X-Export-Filename header set to: ${fileName}`);
    
    // Write buffer to temporary file for debugging (optional)
    try {
      const tempPath = `/tmp/debug_${reportId}_${Date.now()}.pdf`;
      require('fs').writeFileSync(tempPath, pdfBuffer);
      console.log(`PDF Export: Debug copy written to ${tempPath}`);
    } catch (debugError) {
      console.warn('Failed to write debug PDF copy:', debugError.message);
    }
    
    // Send the buffer using res.end() for better binary handling
    res.end(pdfBuffer, 'binary');
    
    console.log(`PDF Export: Successfully completed for report ${reportId}`);
    
  } catch (error) {
    // Clean up browser if it exists
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Failed to close browser:', closeError);
      }
    }
    
    console.error('PDF export failed for report:', reportId, error);
    next(error);
  }
};

/**
 * Sanitize a general filename with comprehensive validation
 * @param {string} filename - Raw filename to sanitize
 * @returns {string} Sanitized filename or null if invalid
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return null;
  
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove filesystem unsafe characters
    .replace(/[^\w\s\-_.]/g, '') // Keep only safe characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/^[.\s]+|[.\s]+$/g, '') // Remove leading/trailing dots and spaces
    .substring(0, 200) // Limit length
    .trim() || null;
}

/**
 * Sanitize report title for filename generation (existing logic)
 * @param {string} title - Report title to sanitize
 * @returns {string} Sanitized title for filename use
 */
function sanitizeReportTitle(title) {
  const sanitized = title
    // Step 1: Remove all potentially dangerous characters and path separators
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove filesystem unsafe characters
    .replace(/[^\w\s\-_.]/g, '') // Keep only alphanumeric, spaces, hyphens, underscores, dots
    // Step 2: Replace multiple spaces/whitespace with single underscore
    .replace(/\s+/g, '_')
    // Step 3: Remove leading/trailing dots and spaces (Windows reserved)
    .replace(/^[.\s]+|[.\s]+$/g, '')
    // Step 4: Limit length for filesystem compatibility
    .substring(0, 80) // Reduced from 100 to leave room for timestamp if needed
    // Step 5: Ensure not empty and not reserved names
    .trim() || 'untitled_report';
  
  // Additional security: Check for Windows reserved names
  const windowsReserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  return windowsReserved.includes(sanitized.toUpperCase()) 
    ? `${sanitized}_report` 
    : sanitized;
}

module.exports = {
  exportReportPdf
};
