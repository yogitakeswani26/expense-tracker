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

export const errorHandler = (err: any, _req: AuthRequest, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err);

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
