/**
 * Response Formatter Utility
 * 
 * This module provides consistent formatting for API responses.
 * It helps maintain a uniform structure across all endpoints.
 * 
 * Standard response format:
 * - Success: { data, meta? }
 * - Error: { error: { message, details?, stack? } }
 */

/**
 * Format a successful response
 * 
 * @param {any} data - Response data
 * @param {Object} [meta] - Optional metadata (pagination, etc.)
 * @returns {Object} Formatted response object
 */
const formatSuccess = (data, meta = null) => {
  const response = { data };
  if (meta) {
    response.meta = meta;
  }
  return response;
};

/**
 * Format an error response
 * 
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {Object} [details] - Additional error details
 * @param {string} [stack] - Error stack trace (only in development)
 * @returns {Object} Formatted error response
 */
const formatError = (message, status = 500, details = null, stack = null) => {
  const error = {
    message,
    status
  };

  if (details) {
    error.details = details;
  }

  // Only include stack trace in development
  if (stack && process.env.NODE_ENV !== 'production') {
    error.stack = stack;
  }

  return { error };
};

/**
 * Express middleware to add response formatting methods to res object
 */
const addFormatters = (req, res, next) => {
  // Add success formatter
  res.success = (data, meta) => {
    return res.json(formatSuccess(data, meta));
  };

  // Add error formatter
  res.error = (message, status = 500, details = null) => {
    return res.status(status).json(formatError(message, status, details));
  };

  next();
};

module.exports = {
  formatSuccess,
  formatError,
  addFormatters
};
