/**
 * Language Detection Middleware
 * Detects client language preference and attaches it to request object
 */

/**
 * Middleware to detect and set the client's preferred language
 * Priority order:
 * 1. Query parameter (?lang=vi or ?lang=en)
 * 2. Accept-Language header
 * 3. Default to English
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next middleware function
 */
const detectLanguage = (req, res, next) => {
  let language = 'en'; // Default language
  
  // Priority 1: Check query parameter
  if (req.query.lang) {
    const queryLang = req.query.lang.toLowerCase();
    if (queryLang === 'vi' || queryLang === 'en') {
      language = queryLang;
    }
  }
  // Priority 2: Check Accept-Language header
  else if (req.headers['accept-language']) {
    const acceptLanguage = req.headers['accept-language'].toLowerCase();
    
    // Check if Vietnamese is preferred
    if (acceptLanguage.includes('vi-VN') || acceptLanguage.includes('vi')) {
      language = 'vi';
    }
    // Check if English is explicitly preferred (default anyway)
    else if (acceptLanguage.includes('en-US') || acceptLanguage.includes('en')) {
      language = 'en';
    }
    
    // Handle more complex Accept-Language headers with quality values
    // Example: "vi-VN,vi;q=0.9,en;q=0.8,en-US;q=0.7"
    const languages = acceptLanguage.split(',').map(lang => {
      const parts = lang.trim().split(';');
      const code = parts[0].trim();
      const quality = parts[1] ? parseFloat(parts[1].split('=')[1]) : 1.0;
      return { code, quality };
    }).sort((a, b) => b.quality - a.quality);
    
    // Find the highest quality supported language
    for (const lang of languages) {
      if (lang.code.startsWith('vi') && lang.quality > 0) {
        language = 'vi';
        break;
      } else if (lang.code.startsWith('en') && lang.quality > 0) {
        language = 'en';
        break;
      }
    }
  }
  
  // Attach language to request object for use in controllers
  req.language = language;
  
  // Also attach to response locals for potential template use
  res.locals.language = language;
  
  next();
};

/**
 * Middleware to validate language parameter in requests
 * Ensures only supported languages are accepted
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateLanguage = (req, res, next) => {
  const supportedLanguages = ['en', 'vi'];
  
  if (req.query.lang && !supportedLanguages.includes(req.query.lang.toLowerCase())) {
    return res.status(400).json({
      error: 'Unsupported language. Supported languages: en, vi',
      supportedLanguages
    });
  }
  
  next();
};

/**
 * Utility function to get language from request
 * Can be used in controllers that don't use the middleware
 * 
 * @param {Object} req - Express request object
 * @returns {string} Language code ('en' or 'vi')
 */
const getLanguageFromRequest = (req) => {
  // If middleware has already set it, use that
  if (req.language) {
    return req.language;
  }
  
  // Otherwise, detect it manually
  if (req.query.lang) {
    const queryLang = req.query.lang.toLowerCase();
    if (queryLang === 'vi' || queryLang === 'en') {
      return queryLang;
    }
  }
  
  if (req.headers['accept-language']) {
    const acceptLanguage = req.headers['accept-language'].toLowerCase();
    if (acceptLanguage.includes('vi')) {
      return 'vi';
    }
  }
  
  return 'en'; // Default
};

/**
 * Set response headers for language-aware APIs
 * Helps clients understand what language was used for the response
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const setLanguageHeaders = (req, res, next) => {
  const language = req.language || 'en';
  
  // Set Content-Language header
  res.set('Content-Language', language);
  
  // Set Vary header to indicate response varies by Accept-Language
  res.set('Vary', 'Accept-Language');
  
  next();
};

module.exports = {
  detectLanguage,
  validateLanguage,
  getLanguageFromRequest,
  setLanguageHeaders
};