/**
 * Content transformation utilities for resource identifier resolution
 * This module handles the conversion between resource identifiers and actual URLs
 */

import { API_URL } from '@/lib/api';

export interface ResourceContext {
  shareId?: string;
  shareCode?: string;
  apiUrl?: string;
}

/**
 * Resolve a resource identifier to an actual URL
 * @param resourceId - The resource identifier (e.g., "@resource:report-image:reportId:filename")
 * @param context - Additional context for URL resolution
 * @returns The resolved URL
 */
export function resolveResourceUrl(resourceId: string, context: ResourceContext = {}): string {
  const parts = resourceId.split(':');
  
  if (parts.length !== 4 || parts[0] !== '@resource') {
    throw new Error(`Invalid resource identifier: ${resourceId}`);
  }

  const [, type, reportId, filename] = parts;

  // Validate resource type
  const allowedResourceTypes = ['report-image'];
  if (!allowedResourceTypes.includes(type)) {
    throw new Error(`Invalid resource type: ${type}`);
  }

  // Validate filename format (basic security check)
  if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
    throw new Error(`Invalid filename format: ${filename}`);
  }

  // Construct the base URL
  const baseUrl = context.apiUrl || API_URL;
  let url = `${baseUrl}/api/report-images/${reportId}/${filename}`;

  // Add shareId parameter if in shared context
  // Note: shareCode will be passed via X-Code header by the fetch interceptor
  if (context.shareId) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}shareId=${context.shareId}`;
  }

  return url;
}

/**
 * Transform content for display by resolving resource identifiers to URLs
 * @param content - Markdown content that may contain resource identifiers
 * @param context - Additional context for URL resolution
 * @returns Transformed content with resolved URLs
 */
export function transformContentForDisplay(content: string, context: ResourceContext = {}): string {
  if (!content) return content;

  return content.replace(
    /@resource:([^:]+):([^:]+):([^)\s]+)/g,
    (match, type, reportId, filename) => {
      try {
        const resourceId = `@resource:${type}:${reportId}:${filename}`;
        return resolveResourceUrl(resourceId, context);
      } catch (error) {
        console.warn(`Failed to resolve resource identifier: ${match}`, error);
        return '[Invalid resource]';
      }
    }
  );
}

/**
 * Transform content for export by resolving resources to local file paths
 * @param content - Markdown content that may contain resource identifiers
 * @param reportId - The report ID for validation
 * @param getLocalImagePath - Function to get local file path for export
 * @returns Transformed content with local file paths
 */
export function transformContentForExport(
  content: string,
  reportId: string,
  getLocalImagePath: (reportId: string, filename: string) => string
): string {
  if (!content) return content;

  return content.replace(
    /@resource:report-image:([^:]+):([^)\s]+)/g,
    (match, rId, filename) => {
      try {
        if (rId === reportId) {
          return getLocalImagePath(reportId, filename);
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
 * Convert a hardcoded URL to a resource identifier
 * @param url - The hardcoded URL to convert
 * @returns The resource identifier or null if not convertible
 */
export function convertUrlToResourceId(url: string): string | null {
  // Match URLs like: http://localhost:8945/api/report-images/reportId/filename.png
  // or /api/report-images/reportId/filename.png
  const match = url.match(/(?:https?:\/\/[^\/]+)?\/api\/report-images\/([^\/]+)\/([^?\s)]+)/);
  
  if (!match) return null;
  
  const [, reportId, filename] = match;
  return `@resource:report-image:${reportId}:${filename}`;
}

/**
 * Convert markdown content URLs to resource identifiers
 * @param content - Markdown content containing image URLs
 * @returns Content with URLs converted to resource identifiers
 */
export function convertMarkdownUrlsToResourceIds(content: string): string {
  if (!content) return content;
  
  // Convert URLs like /api/report-images/reportId/filename to @resource:report-image:reportId:filename
  return content.replace(
    /!\[([^\]]*)\]\(([^)]*\/api\/report-images\/([^\/]+)\/([^)?]+))([^)]*)\)/g,
    (match, alt, fullUrl, reportId, filename) => {
      return `![${alt}](@resource:report-image:${reportId}:${filename})`;
    }
  );
}

/**
 * Sanitize content to only allow approved resource types
 * @param content - Content to sanitize
 * @returns Sanitized content
 */
export function sanitizeContent(content: string): string {
  if (!content) return content;

  const allowedResourceTypes = ['report-image'];

  return content.replace(
    /@resource:([^:]+):([^:]+):([^)\s]+)/g,
    (match, type, reportId, filename) => {
      if (!allowedResourceTypes.includes(type)) {
        return '[Invalid resource type]';
      }

      // Validate filename format
      if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
        return '[Invalid resource identifier]';
      }

      return match;
    }
  );
}

/**
 * Extract all resource identifiers from content
 * @param content - Content to parse
 * @returns Array of resource identifiers found
 */
export function extractResourceIds(content: string): string[] {
  if (!content) return [];

  const resourceIds: string[] = [];
  const regex = /@resource:([^:]+):([^:]+):([^)\s]+)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    resourceIds.push(match[0]);
  }

  return resourceIds;
}