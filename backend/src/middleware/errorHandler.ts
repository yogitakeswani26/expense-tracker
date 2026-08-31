import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
  ) {
    super(message);
  }
}

/**
 * Sanitize error object to remove sensitive data before logging
 */
function sanitizeErrorForLogging(err: any): any {
  const sanitized: any = {
    code: err.code || 'UNKNOWN',
    message: err.message || 'Unknown error',
    statusCode: err.statusCode || 500,
  };

  // Only include stack in development
  if (process.env.NODE_ENV === 'development') {
    sanitized.stack = err.stack;
  }

  return sanitized;
}

export const errorHandler = (err: any, _req: AuthRequest, res: Response, _next: NextFunction) => {
  // SECURITY: Sanitize error before logging to prevent sensitive data leaks
  const sanitizedError = sanitizeErrorForLogging(err);
  console.error('ERROR:', sanitizedError);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.message },
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: { code: 'DUPLICATE_ENTRY', message: 'This entry already exists' },
    });
  }

  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
};

export { AppError };
