import { Request, Response, NextFunction } from 'express';

// Simple sanitization - remove potential XSS/injection characters from strings
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return value
      .replace(/[<>]/g, '') // Remove angle brackets
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
