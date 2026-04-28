/**
 * Logger Utility
 * 
 * This module provides a consistent logging interface for the application.
 * In production, it would be connected to a proper logging system.
 * For development, it outputs formatted logs to the console.
 * 
 * Features:
 * - Log levels (error, warn, info, debug)
 * - Timestamp on each log
 * - Request logging middleware for Express
 * - Sanitized logging to avoid sensitive data exposure
 */

const { NODE_ENV, LOG_LEVEL } = require('../config/env');

// Define log levels and their priorities
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Set default log level based on environment
const defaultLevel = NODE_ENV === 'production' ? 'info' : 'debug';
const currentLevel = LOG_LEVELS[LOG_LEVEL] !== undefined 
  ? LOG_LEVELS[LOG_LEVEL] 
  : LOG_LEVELS[defaultLevel];

/**
 * Creates a formatted log message
 * 
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [meta] - Additional metadata
 * @returns {string} Formatted log message
 */
const createLogMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Add metadata if provided
  if (Object.keys(meta).length > 0) {
    const sanitizedMeta = sanitizeLogData(meta);
    formattedMessage += ` ${JSON.stringify(sanitizedMeta)}`;
  }
  
  return formattedMessage;
};

/**
 * Sanitizes sensitive data from logs
 * 
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
const sensitiveFields = ['password', 'token', 'authorization', 'secret', 'jwt'];
const sanitizeLogData = (data) => {
  if (typeof data !== 'object' || data === null) return data;
  
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    // Check if key contains any sensitive words
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  });
  
  return sanitized;
};

/**
 * Logger instance with methods for each log level
 */
const logger = {
  error: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(createLogMessage('error', message, meta));
    }
  },
  
  warn: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(createLogMessage('warn', message, meta));
    }
  },
  
  info: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.info) {
      console.info(createLogMessage('info', message, meta));
    }
  },
  
  debug: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.debug(createLogMessage('debug', message, meta));
    }
  },
  
  /**
   * Express middleware for logging HTTP requests
   */
  requestLogger: (req, res, next) => {
    // Skip logging for health checks in production to reduce noise
    if (NODE_ENV === 'production' && req.path === '/health') {
      return next();
    }
    
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    
    // Log request details
    logger.info(`${req.method} ${req.originalUrl}`, {
      requestId,
      ip: req.ip,
      userId: req.user?.id
    });
    
    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 400 ? 'warn' : 'info';
      
      logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
        requestId,
        statusCode: res.statusCode,
        duration
      });
    });
    
    next();
  }
};

module.exports = logger;
