/**
 * Environment configuration
 * 
 * This module centralizes all environment variable access and provides
 * validation and defaults. It's used throughout the application to
 * ensure consistent configuration access.
 * 
 * Required environment variables in production:
 * - JWT_SECRET: Secret for signing JWTs
 * - DATABASE_URL: PostgreSQL connection string
 */

module.exports = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8945', 10),
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '12h', // Token expiry time
  
  // Database configuration is handled by Prisma through DATABASE_URL env var
  
  // Frontend URL for CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:6234',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Validation function to ensure required values in production
  validateEnv: () => {
    if (process.env.NODE_ENV === 'production') {
      const requiredVars = ['JWT_SECRET', 'DATABASE_URL', 'FILE_ENCRYPTION_KEY'];
      const missing = requiredVars.filter(key => !process.env[key]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
      
      // In production, JWT_SECRET should not be the default value
      if (process.env.JWT_SECRET === 'dev-jwt-secret-change-in-production') {
        throw new Error('Production environment detected but using default JWT_SECRET. Please set a secure value.');
      }
    }
    
    return true;
  }
};
