/**
 * API Client Module
 * 
 * This module provides a centralized interface for making API calls to the backend.
 * It handles authentication, request formatting, and response parsing.
 */

import { toast } from '@/hooks/use-toast';

// API base URL - use environment variable if available or default to localhost
export const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("CRITICAL: VITE_API_URL is not defined in your .env file. API calls will fail.");
  // Optionally, you could throw an error here to halt execution if the API_URL is essential for the app to start
  // throw new Error("CRITICAL: VITE_API_URL is not defined. Please set it in your .env file.");
}

// Extend RequestInit to include withCredentials
export interface ApiRequestInit extends RequestInit {
  withCredentials?: boolean;
}

/**
 * Error class for API-specific errors
 */
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Default request options with authentication and JSON headers
 */
const getDefaultOptions = (options: ApiRequestInit = {}): RequestInit => {
  const { withCredentials = true, ...restOptions } = options;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      // Authorization header is no longer needed, browser sends HttpOnly cookie
      ...(options.headers || {})
    },
    // Ensure credentials (cookies) are included in requests
    // This is crucial for HttpOnly cookie-based authentication
    credentials: 'include', // Explicitly set to 'include'
    ...restOptions
  };
  
  return defaultOptions;
};

/**
 * Make an API request with error handling and automatic JSON parsing
 */
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    // Clean endpoint URL construction
    let url;
    if (endpoint.startsWith('http')) {
      // If it's already a full URL, use it as is
      url = endpoint;
    } else {
      // Make sure we don't end up with /api/api/ in the URL
      url = `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    }
    
    // Get default options with authentication headers
    const requestOptions = getDefaultOptions(options);
    
    // Make API request
    
    const response = await fetch(url, requestOptions);
    
    // Handle non-JSON responses (like file downloads)
    const contentType = response.headers.get('content-type');
    
    // Process response
    
    if (contentType && contentType.indexOf('application/json') !== -1) {
      const data = await response.json();
      
      // Parse JSON response
      
      // Check for error responses
      if (!response.ok) {
        const message = data.error?.message || data.error || 'An error occurred';
        console.error(`API DEBUG: Error response from ${url}`, {
          status: response.status,
          message: message,
          details: data.error?.details || data.details
        });
        throw new ApiError(message, response.status, data.error?.details || data.details);
      }
      
      return data;
    } else {
      // For non-JSON responses (like file downloads)
      if (!response.ok) {
        const text = await response.text();
        console.error(`API DEBUG: Non-JSON error from ${url}`, {
          status: response.status,
          text: text.substring(0, 200) + (text.length > 200 ? '...' : '')
        });
        throw new ApiError(text || 'An error occurred', response.status);
      }
      
      return response as unknown as T;
    }
  } catch (error) {
    // Format and rethrow API errors
    if (error instanceof ApiError) {
      // Show toast for 401 errors
      if (error.status === 401) {
        // If token expired or invalid, redirect to login,
        // unless we are already on the login page.
        // The HttpOnly cookie cannot be removed by client-side JS.
        // The backend should invalidate the session/cookie or it will expire naturally.
        // A logout endpoint should be used to explicitly clear the cookie on the server-side.
        
        // Don't redirect if we're on login page or public share pages
        const isPublicPage = window.location.pathname === '/login' || 
                            window.location.pathname.startsWith('/share/');
        
        if (!isPublicPage) {
          toast({
            title: 'Session expired',
            description: 'Please login again.',
            variant: 'destructive'
          });
          
          // Redirect to login after a short delay to allow toast to be seen
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        } else {
          // On public pages (login or share), a 401 from /api/me is expected if not logged in.
          // The AuthContext handles this initial check gracefully.
          // A login *attempt* failing with 401 will be handled by the Login page's handleSubmit.
          // So, we can suppress the generic "Session expired" toast here.
          console.warn('API Error 401 on public page, redirect suppressed. Original error message:', error.message);
        }
      }
      
      throw error;
    }
    
    // Handle network errors
    if (error instanceof Error) {
      throw new ApiError(error.message || 'Network error', 0);
    }
    
    // Handle unknown errors
    throw new ApiError('Unknown error', 0);
  }
};

/**
 * Common HTTP method wrappers
 */
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) => 
    apiRequest<T>(endpoint, { method: 'GET', ...options }),
    
  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) => 
    apiRequest<T>(endpoint, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined,
      ...options 
    }),
    
  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) => 
    apiRequest<T>(endpoint, { 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined,
      ...options 
    }),
    
  patch: <T = any>(endpoint: string, data?: any, options?: RequestInit) => 
    apiRequest<T>(endpoint, { 
      method: 'PATCH', 
      body: data ? JSON.stringify(data) : undefined,
      ...options 
    }),
    
  delete: <T = any>(endpoint: string, options?: RequestInit) => 
    apiRequest<T>(endpoint, { method: 'DELETE', ...options }),
    
  // Special method for file downloads
  download: async (endpoint: string, filename?: string) => {
    console.log('🔽 Starting download from:', endpoint);
    
    // Make direct fetch call to preserve headers (bypass apiRequest for downloads)
    const url = `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
      credentials: 'include' // Include cookies for auth
    });
    
    console.log('📦 Got direct response, status:', response.status);
    
    if (!response.ok) {
      throw new ApiError(`Download failed: ${response.statusText}`, response.status);
    }
    
    // Extract headers before processing blob
    const contentDisposition = response.headers.get('content-disposition');
    const exportFilename = response.headers.get('x-export-filename'); // Custom header fallback
    console.log('🔍 Raw content-disposition:', contentDisposition);
    console.log('🔍 X-Export-Filename header:', exportFilename);
    
    // Process as a blob for download
    const blob = await response.blob();
    const url_blob = window.URL.createObjectURL(blob);
    
    console.log('🔗 Created blob URL:', url_blob);
    
    // Create invisible download link and click it
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url_blob;
    
    // Enhanced filename extraction with multiple fallback strategies
    let finalFilename = 'download';
    
    // Strategy 1: Extract from Content-Disposition header (most reliable)
    if (contentDisposition) {
      const extractedFilename = parseContentDisposition(contentDisposition);
      if (extractedFilename) {
        finalFilename = extractedFilename;
        console.log('✓ Extracted filename from Content-Disposition:', finalFilename);
      }
    }
    
    // Strategy 2: Use custom X-Export-Filename header (backend-provided fallback)
    if (finalFilename === 'download' && exportFilename) {
      finalFilename = exportFilename;
      console.log('✓ Using X-Export-Filename header:', finalFilename);
    }
    
    // Strategy 3: Use provided filename parameter
    if (finalFilename === 'download' && filename) {
      finalFilename = filename;
      console.log('✓ Using provided filename parameter:', finalFilename);
    }
    
    // Strategy 4: Extract from URL path (if endpoint contains filename)
    if (finalFilename === 'download') {
      const urlFilename = extractFilenameFromUrl(endpoint);
      if (urlFilename) {
        finalFilename = urlFilename;
        console.log('✓ Extracted filename from URL:', finalFilename);
      }
    }
    
    // Strategy 5: Generate timestamp-based filename for PDF exports
    if (finalFilename === 'download' || finalFilename === 'download.pdf') {
      if (endpoint.includes('/export/pdf')) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_');
        finalFilename = `export_${timestamp}.pdf`;
        console.log('✓ Generated timestamp-based filename:', finalFilename);
      } else {
        // Add file extension based on content type if missing
        const contentType = response.headers.get('content-type');
        const extension = getExtensionFromContentType(contentType);
        if (extension && !finalFilename.includes('.')) {
          finalFilename = `download.${extension}`;
        }
        console.log('✓ Added extension based on content type:', finalFilename);
      }
    }
    
    // Browser-specific handling for better compatibility
    const browserInfo = detectBrowser();
    console.log('🌐 Detected browser:', browserInfo);
    
    if (browserInfo.isMacOSChrome || browserInfo.isMacOSBrave) {
      // For problematic browsers on MacOS, ensure clean filename
      finalFilename = sanitizeFilenameForMacOS(finalFilename);
      console.log('🍎 Sanitized filename for MacOS Chrome/Brave:', finalFilename);
    }
    
    a.download = finalFilename;
    
    console.log('→ Final download filename:', finalFilename);
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url_blob);
    document.body.removeChild(a);
  }
};

/**
 * Parse Content-Disposition header to extract filename
 * Handles multiple RFC formats with priority order
 */
function parseContentDisposition(contentDisposition: string): string | null {
  if (!contentDisposition) return null;
  
  console.log('🔍 Parsing Content-Disposition:', JSON.stringify(contentDisposition));
  
  // Priority 1: filename*=UTF-8''name (RFC 6266 encoded)
  const encodedMatch = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;\s]+)/i);
  if (encodedMatch) {
    try {
      const decoded = decodeURIComponent(encodedMatch[1]);
      console.log('✓ Parsed filename*=UTF-8:', decoded);
      return decoded;
    } catch (e) {
      console.warn('⚠️ Failed to decode filename*:', encodedMatch[1], e);
    }
  }
  
  // Priority 2: filename="name" (quoted)
  const quotedMatch = contentDisposition.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch) {
    console.log('✓ Parsed filename (quoted):', quotedMatch[1]);
    return quotedMatch[1];
  }
  
  // Priority 3: filename=name (unquoted, avoid UTF-8 prefixed values)
  const unquotedMatch = contentDisposition.match(/filename\s*=\s*([^;\s]+)/i);
  if (unquotedMatch && !unquotedMatch[1].toLowerCase().includes('utf-8')) {
    console.log('✓ Parsed filename (unquoted):', unquotedMatch[1]);
    return unquotedMatch[1];
  }
  
  console.log('❌ No valid filename found in Content-Disposition header');
  return null;
}

/**
 * Extract filename from URL path
 */
function extractFilenameFromUrl(url: string): string | null {
  try {
    // Remove query parameters and extract last path segment
    const cleanUrl = url.split('?')[0];
    const segments = cleanUrl.split('/');
    const lastSegment = segments[segments.length - 1];
    
    // If it looks like a filename (has extension), return it
    if (lastSegment && lastSegment.includes('.')) {
      return lastSegment;
    }
  } catch (e) {
    console.warn('Failed to extract filename from URL:', url, e);
  }
  
  return null;
}

/**
 * Get file extension based on content type
 */
function getExtensionFromContentType(contentType: string | null): string | null {
  if (!contentType) return null;
  
  const mimeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'text/html': 'html',
    'application/json': 'json',
    'text/csv': 'csv',
    'application/zip': 'zip'
  };
  
  const cleanType = contentType.split(';')[0].trim().toLowerCase();
  return mimeMap[cleanType] || null;
}

/**
 * Detect browser type and version for compatibility handling
 */
function detectBrowser() {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  
  const isMacOS = /Mac|iPhone|iPod|iPad/.test(platform);
  const isChrome = /Chrome\//.test(ua) && !/Edg\//.test(ua);
  const isBrave = (navigator as any).brave?.isBrave;
  const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua);
  const isFirefox = /Firefox\//.test(ua);
  
  return {
    isMacOS,
    isChrome,
    isBrave: !!isBrave,
    isSafari,
    isFirefox,
    isMacOSChrome: isMacOS && isChrome,
    isMacOSBrave: isMacOS && !!isBrave,
    userAgent: ua
  };
}

/**
 * Sanitize filename for MacOS compatibility
 */
function sanitizeFilenameForMacOS(filename: string): string {
  // Remove problematic characters that may cause issues on MacOS
  return filename
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove filesystem unsafe characters
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 200) // Limit length
    .trim() || 'download'; // Ensure not empty
}
