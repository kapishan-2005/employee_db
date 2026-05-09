/**
 * Input Sanitizer Middleware
 * Sanitizes user input to prevent XSS and injection attacks
 */

const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Remove potential XSS patterns
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  return value;
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = sanitizeValue(value);
      }
    }
  }

  return sanitized;
};

export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

export default sanitizeInput;
