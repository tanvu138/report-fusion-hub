// Utility functions for handling and formatting errors

export interface FormattedError {
  title: string;
  message: string;
  technical?: string;
  code?: string;
  retryable?: boolean;
}

/**
 * Format an error into a user-friendly message
 */
export const formatError = (error: unknown, context?: string): FormattedError => {
  // Handle different error types
  if (error instanceof Error) {
    return formatJSError(error, context);
  }
  
  if (typeof error === 'string') {
    return formatStringError(error, context);
  }
  
  if (typeof error === 'object' && error !== null) {
    return formatObjectError(error, context);
  }
  
  return {
    title: 'Unknown Error',
    message: 'An unexpected error occurred. Please try again.',
    technical: String(error),
    retryable: true
  };
};

/**
 * Format JavaScript Error objects
 */
const formatJSError = (error: Error, context?: string): FormattedError => {
  const message = error.message.toLowerCase();
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      technical: error.message,
      retryable: true
    };
  }
  
  // Timeout errors
  if (message.includes('timeout')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete. Please try again.',
      technical: error.message,
      retryable: true
    };
  }
  
  // Permission errors
  if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('access denied')) {
    return {
      title: 'Access Denied',
      message: 'You do not have permission to perform this action. Please contact your administrator.',
      technical: error.message,
      retryable: false
    };
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid')) {
    return {
      title: 'Invalid Input',
      message: error.message.replace(/^error:?\s*/i, ''),
      technical: error.message,
      retryable: false
    };
  }
  
  return {
    title: context ? `${context} Error` : 'Error',
    message: error.message.replace(/^error:?\s*/i, '') || 'An unexpected error occurred.',
    technical: error.message,
    retryable: true
  };
};

/**
 * Format string errors
 */
const formatStringError = (error: string, context?: string): FormattedError => {
  const lowerError = error.toLowerCase();
  
  if (lowerError.includes('network') || lowerError.includes('connection')) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      technical: error,
      retryable: true
    };
  }
  
  if (lowerError.includes('not found')) {
    return {
      title: 'Not Found',
      message: 'The requested resource could not be found.',
      technical: error,
      retryable: false
    };
  }
  
  return {
    title: context ? `${context} Error` : 'Error',
    message: error.replace(/^error:?\s*/i, ''),
    technical: error,
    retryable: true
  };
};

/**
 * Format object errors (e.g., from API responses)
 */
const formatObjectError = (error: any, context?: string): FormattedError => {
  // Handle common API error structures
  if (error.response?.data?.message) {
    return formatStringError(error.response.data.message, context);
  }
  
  if (error.response?.data?.error) {
    return formatStringError(error.response.data.error, context);
  }
  
  if (error.message) {
    return formatStringError(error.message, context);
  }
  
  if (error.status) {
    return formatHTTPError(error.status, error.statusText, context);
  }
  
  return {
    title: context ? `${context} Error` : 'Error',
    message: 'An unexpected error occurred. Please try again.',
    technical: JSON.stringify(error),
    retryable: true
  };
};

/**
 * Format HTTP status errors
 */
const formatHTTPError = (status: number, statusText?: string, context?: string): FormattedError => {
  switch (status) {
    case 400:
      return {
        title: 'Invalid Request',
        message: 'The request contains invalid data. Please check your input and try again.',
        code: '400',
        retryable: false
      };
    
    case 401:
      return {
        title: 'Authentication Required',
        message: 'You need to log in to access this resource.',
        code: '401',
        retryable: false
      };
    
    case 403:
      return {
        title: 'Access Forbidden',
        message: 'You do not have permission to access this resource.',
        code: '403',
        retryable: false
      };
    
    case 404:
      return {
        title: 'Not Found',
        message: 'The requested resource could not be found.',
        code: '404',
        retryable: false
      };
    
    case 429:
      return {
        title: 'Too Many Requests',
        message: 'Too many requests have been made. Please wait a moment and try again.',
        code: '429',
        retryable: true
      };
    
    case 500:
      return {
        title: 'Server Error',
        message: 'An internal server error occurred. Please try again later.',
        code: '500',
        retryable: true
      };
    
    case 502:
    case 503:
    case 504:
      return {
        title: 'Service Unavailable',
        message: 'The service is temporarily unavailable. Please try again later.',
        code: String(status),
        retryable: true
      };
    
    default:
      return {
        title: context ? `${context} Error` : 'Error',
        message: statusText || `An error occurred (${status}). Please try again.`,
        code: String(status),
        retryable: status >= 500
      };
  }
};

/**
 * Check if an error is considered retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  const formatted = formatError(error);
  return formatted.retryable ?? true;
};

/**
 * Get a simple error message for toasts
 */
export const getSimpleErrorMessage = (error: unknown): string => {
  const formatted = formatError(error);
  return formatted.message;
};