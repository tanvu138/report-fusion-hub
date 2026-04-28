/**
 * Resource validation utilities for secure resource access
 */

/**
 * Validate resource access for a user
 * @param {Object} prisma - Prisma client instance
 * @param {string} resourceId - Resource identifier (e.g., "@resource:report-image:reportId:filename")
 * @param {Object} user - User object
 * @param {Object} shareContext - Share context { shareId, shareCode }
 * @returns {Promise<Object>} Validation result with { valid, resource, error }
 */
async function validateResourceAccess(prisma, resourceId, user, shareContext = {}) {
  // Parse resource identifier
  const parts = resourceId.split(':');
  if (parts.length !== 4 || parts[0] !== '@resource') {
    return {
      valid: false,
      error: 'Invalid resource identifier format',
      resource: null
    };
  }

  const [, type, reportId, filename] = parts;

  // Validate resource type
  const allowedResourceTypes = ['report-image'];
  if (!allowedResourceTypes.includes(type)) {
    return {
      valid: false,
      error: `Invalid resource type: ${type}`,
      resource: null
    };
  }

  // Validate filename format (basic security check)
  if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
    return {
      valid: false,
      error: 'Invalid filename format',
      resource: null
    };
  }

  try {
    // Get resource from database
    const resource = await prisma.reportImage.findFirst({
      where: {
        reportId,
        filename,
        isActive: true
      },
      include: {
        report: {
          select: {
            id: true,
            isDeleted: true,
            sections: {
              where: { isActive: true },
              select: { departmentId: true }
            }
          }
        }
      }
    });

    if (!resource) {
      return {
        valid: false,
        error: 'Resource not found or inactive',
        resource: null
      };
    }

    if (resource.report.isDeleted) {
      return {
        valid: false,
        error: 'Resource belongs to deleted report',
        resource: null
      };
    }

    // Check shared access first
    if (shareContext.shareId && shareContext.shareCode) {
      const sharedReport = await prisma.sharedReportLink.findFirst({
        where: {
          id: shareContext.shareId,
          reportId,
          expiresAt: {
            gte: new Date()
          }
        }
      });

      if (!sharedReport) {
        return {
          valid: false,
          error: 'Invalid or expired share access',
          resource: null
        };
      }

      // For shared access, validate the share code
      const bcrypt = require('bcrypt');
      const isValidCode = await bcrypt.compare(shareContext.shareCode, sharedReport.codeHash);
      
      if (!isValidCode) {
        return {
          valid: false,
          error: 'Invalid share code',
          resource: null
        };
      }

      return {
        valid: true,
        resource,
        error: null
      };
    }

    // Check user access
    if (!user) {
      return {
        valid: false,
        error: 'Authentication required',
        resource: null
      };
    }

    // Secretary role has access to all resources
    if (user.role === 'secretary') {
      return {
        valid: true,
        resource,
        error: null
      };
    }

    // Department users can only access resources from reports they have sections in
    if (user.role === 'department') {
      const hasAccess = resource.report.sections.some(section => 
        section.departmentId === user.departmentId
      );

      if (!hasAccess) {
        return {
          valid: false,
          error: 'Access denied to this resource',
          resource: null
        };
      }

      return {
        valid: true,
        resource,
        error: null
      };
    }

    return {
      valid: false,
      error: 'Invalid user role',
      resource: null
    };

  } catch (error) {
    console.error('Resource validation error:', error);
    return {
      valid: false,
      error: 'Internal validation error',
      resource: null
    };
  }
}

/**
 * Validate multiple resource identifiers
 * @param {Object} prisma - Prisma client instance
 * @param {Array} resourceIds - Array of resource identifiers
 * @param {Object} user - User object
 * @param {Object} shareContext - Share context { shareId, shareCode }
 * @returns {Promise<Object>} Validation results { valid, results, errors }
 */
async function validateMultipleResourceAccess(prisma, resourceIds, user, shareContext = {}) {
  const results = {};
  const errors = [];

  for (const resourceId of resourceIds) {
    const result = await validateResourceAccess(prisma, resourceId, user, shareContext);
    results[resourceId] = result;
    
    if (!result.valid) {
      errors.push({
        resourceId,
        error: result.error
      });
    }
  }

  return {
    valid: errors.length === 0,
    results,
    errors
  };
}

/**
 * Sanitize content to remove invalid resource identifiers
 * @param {string} content - Content to sanitize
 * @param {Object} validationResults - Results from validateMultipleResourceAccess
 * @returns {string} Sanitized content
 */
function sanitizeContentWithValidation(content, validationResults) {
  if (!content) return content;

  return content.replace(
    /@resource:([^:]+):([^:]+):([^)\s]+)/g,
    (match, type, reportId, filename) => {
      const resourceId = `@resource:${type}:${reportId}:${filename}`;
      
      if (validationResults.results[resourceId] && validationResults.results[resourceId].valid) {
        return match; // Keep valid resource identifiers
      }
      
      return '[Invalid or inaccessible resource]';
    }
  );
}

module.exports = {
  validateResourceAccess,
  validateMultipleResourceAccess,
  sanitizeContentWithValidation
};