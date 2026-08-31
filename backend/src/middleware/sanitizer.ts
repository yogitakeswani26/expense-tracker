import { Request, Response, NextFunction } from 'express';

// Enhanced XSS prevention - sanitize input by removing dangerous characters and HTML
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return value
      .replace(/[<>'"&]/g, (char) => {
        // HTML encode dangerous characters
        const htmlEncode: any = {
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;',
          '&': '&amp;',
        };
        return htmlEncode[char] || char;
      })
      // Remove script-like patterns
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    const sanitized: any = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }
  return value;
}

export const sanitizer = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  // Sanitize query parameters in-place since req.query is read-only
  if (req.query) {
    for (const [key, val] of Object.entries(req.query)) {
      req.query[key] = sanitizeValue(val);
    }
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
};
