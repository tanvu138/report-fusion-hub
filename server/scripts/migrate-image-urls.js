/**
 * Migration script to convert hardcoded image URLs to resource identifiers
 * and create corresponding ReportImage records
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

/**
 * Convert a hardcoded URL to a resource identifier
 * @param {string} url - The hardcoded URL to convert
 * @returns {string|null} The resource identifier or null if not convertible
 */
function convertUrlToResourceId(url) {
  // Match URLs like: http://localhost:8945/api/report-images/reportId/filename.png
  // or /api/report-images/reportId/filename.png
  const match = url.match(/(?:https?:\/\/[^\/]+)?\/api\/report-images\/([^\/]+)\/([^?\s)]+)/);
  
  if (!match) return null;
  
  const [, reportId, filename] = match;
  return `@resource:report-image:${reportId}:${filename}`;
}

/**
 * Extract image URLs from markdown content
 * @param {string} content - Markdown content
 * @returns {Array} Array of image URLs found
 */
function extractImageUrls(content) {
  if (!content) return [];
  
  const urls = [];
  
  // Match markdown image syntax: ![alt](url)
  const markdownRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = markdownRegex.exec(content)) !== null) {
    const url = match[2];
    if (url.includes('/api/report-images/')) {
      urls.push(url);
    }
  }
  
  return urls;
}

/**
 * Get file information from disk
 * @param {string} reportId - Report ID
 * @param {string} filename - Filename
 * @returns {Object|null} File information or null if file not found
 */
function getFileInfo(reportId, filename) {
  const filePath = path.join(__dirname, '..', 'secure_uploads', 'report_images', reportId, filename);
  
  try {
    const stats = fs.statSync(filePath);
    
    // Try to determine mime type from extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp'
    };
    
    return {
      exists: true,
      size: stats.size,
      mimeType: mimeTypeMap[ext] || 'application/octet-stream'
    };
  } catch (error) {
    console.warn(`File not found: ${filePath}`);
    return null;
  }
}

/**
 * Create ReportImage record for existing file
 * @param {string} reportId - Report ID
 * @param {string} filename - Filename
 * @param {string} originalName - Original filename (fallback to filename)
 * @param {string} uploadedById - User ID who uploaded (fallback to admin)
 * @returns {Promise<Object|null>} Created record or null if failed
 */
async function createReportImageRecord(reportId, filename, originalName, uploadedById) {
  const fileInfo = getFileInfo(reportId, filename);
  
  if (!fileInfo) {
    console.warn(`Cannot create record for missing file: ${reportId}/${filename}`);
    return null;
  }
  
  try {
    // Check if record already exists
    const existing = await prisma.reportImage.findFirst({
      where: {
        reportId,
        filename
      }
    });
    
    if (existing) {
      console.log(`Record already exists for ${reportId}/${filename}`);
      return existing;
    }
    
    // Find admin user as fallback uploader
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'secretary'
      }
    });
    
    if (!adminUser) {
      console.error('No admin user found for fallback uploader');
      return null;
    }
    
    const record = await prisma.reportImage.create({
      data: {
        reportId,
        filename,
        originalName: originalName || filename,
        mimeType: fileInfo.mimeType,
        fileSize: fileInfo.size,
        uploadedById: uploadedById || adminUser.id,
        isActive: true
      }
    });
    
    console.log(`Created ReportImage record for ${reportId}/${filename}`);
    return record;
  } catch (error) {
    console.error(`Failed to create ReportImage record for ${reportId}/${filename}:`, error);
    return null;
  }
}

/**
 * Process a single report section
 * @param {Object} section - Report section object
 * @returns {Promise<boolean>} True if updated, false otherwise
 */
async function processSectionContent(section) {
  if (!section.contentMarkdown) {
    return false;
  }
  
  const imageUrls = extractImageUrls(section.contentMarkdown);
  
  if (imageUrls.length === 0) {
    return false;
  }
  
  console.log(`Processing section ${section.id} with ${imageUrls.length} images`);
  
  let updatedContent = section.contentMarkdown;
  let hasChanges = false;
  
  for (const url of imageUrls) {
    const resourceId = convertUrlToResourceId(url);
    
    if (!resourceId) {
      console.warn(`Cannot convert URL to resource ID: ${url}`);
      continue;
    }
    
    // Extract reportId and filename from resource ID
    const parts = resourceId.split(':');
    if (parts.length !== 4) {
      console.warn(`Invalid resource ID format: ${resourceId}`);
      continue;
    }
    
    const [, , reportId, filename] = parts;
    
    // Create ReportImage record if it doesn't exist
    await createReportImageRecord(reportId, filename, filename, null);
    
    // Replace URL with resource identifier
    updatedContent = updatedContent.replace(url, resourceId);
    hasChanges = true;
    
    console.log(`Converted: ${url} -> ${resourceId}`);
  }
  
  if (hasChanges) {
    try {
      await prisma.reportSection.update({
        where: { id: section.id },
        data: { contentMarkdown: updatedContent }
      });
      
      console.log(`Updated section ${section.id} content`);
      return true;
    } catch (error) {
      console.error(`Failed to update section ${section.id}:`, error);
      return false;
    }
  }
  
  return false;
}

/**
 * Main migration function
 */
async function migrateImageUrls() {
  console.log('Starting image URL migration...');
  
  try {
    // Get all report sections with content
    const sections = await prisma.reportSection.findMany({
      where: {
        contentMarkdown: {
          not: null
        },
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
    
    console.log(`Found ${sections.length} sections to process`);
    
    let processedCount = 0;
    let updatedCount = 0;
    
    for (const section of sections) {
      if (section.report.isDeleted) {
        console.log(`Skipping deleted report section ${section.id}`);
        continue;
      }
      
      processedCount++;
      
      const wasUpdated = await processSectionContent(section);
      if (wasUpdated) {
        updatedCount++;
      }
      
      // Add small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\nMigration completed:`);
    console.log(`- Processed: ${processedCount} sections`);
    console.log(`- Updated: ${updatedCount} sections`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateImageUrls();
}

module.exports = {
  migrateImageUrls,
  convertUrlToResourceId,
  extractImageUrls,
  createReportImageRecord,
  processSectionContent
};