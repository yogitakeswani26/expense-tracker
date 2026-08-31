import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: any,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * ISSUE #11: Sanitize error object to remove sensitive data before logging
 * Consistent error logging with proper format
 */
function sanitizeErrorForLogging(err: any): any {
  const sanitized: any = {
    code: err.code || 'UNKNOWN',
    message: err.message || 'Unknown error',
    statusCode: err.statusCode || 500,
    timestamp: new Date().toISOString(),
  };

  // Only include stack in development
  if (process.env.NODE_ENV === 'development') {
    sanitized.stack = err.stack;
  }

  return sanitized;
}

/**
 * ISSUE #11: Consistent error response format
 * Standard error response with proper error codes
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export const errorHandler = (err: any, req: AuthRequest, res: Response, _next: NextFunction) => {
  // SECURITY: Sanitize error before logging to prevent sensitive data leaks
  const sanitizedError = sanitizeErrorForLogging(err);
  console.error('ERROR:', {
    ...sanitizedError,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (err.details && process.env.NODE_ENV === 'development') {
      response.error.details = err.details;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message || 'Validation failed',
      },
    } as ErrorResponse);
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: `A record with this ${field} already exists`,
      },
    } as ErrorResponse);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    } as ErrorResponse);
  }

  // Handle JWT expiration
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
    } as ErrorResponse);
  }

  // Default error response
  return res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred',
    },
  } as ErrorResponse);
};

export { AppError };
