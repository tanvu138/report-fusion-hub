/**
 * Global Error Handler Middleware
 * 
 * This middleware catches all errors thrown in the application and formats them
 * into a consistent JSON response. It also handles specific error types from
 * Prisma and other libraries to provide meaningful error messages.
 * 
 * In production, detailed error information is not sent to the client to avoid
 * leaking sensitive information.
 */

const { NODE_ENV } = require('../config/env');

/**
 * Format and send error responses
 */
const errorHandler = (err, req, res, next) => {
  // Log the full error in development or for severe errors
  if (NODE_ENV !== 'production' || err.status >= 500) {
    console.error(err);
  }

  // Default error status and message
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  
  // Handle specific error types
  
  // Prisma Client errors
  if (err.name === 'PrismaClientKnownRequestError') {
    // Handle common Prisma errors
    switch (err.code) {
      case 'P2002': // Unique constraint failed
        status = 409; // Conflict
        message = 'A record with this information already exists';
        break;
      case 'P2025': // Record not found
        status = 404;
        message = 'Record not found';
        break;
      default:
        status = 400; // Bad Request for other Prisma errors
        message = 'Database operation failed';
    }
  }
  
  // JWT errors from authentication middleware
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    status = 400;
    if (err.details && Array.isArray(err.details)) {
      message = 'Validation failed: ' + err.details.map(d => `${d.path}: ${d.message}`).join(', ');
    } else {
      message = err.message;
    }
  }
  
  // In production, don't send detailed error information
  const error = {
    message,
    ...(NODE_ENV !== 'production' && { 
      stack: err.stack,
      details: err.details || err.data
    })
  };

  // Send the error response
  res.status(status).json({ error });
};

/**
 * Catch-all middleware for handling 404 errors
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: `Not Found: ${req.method} ${req.originalUrl}`
    }
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
