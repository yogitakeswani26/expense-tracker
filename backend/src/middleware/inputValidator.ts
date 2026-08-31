// ISSUE #14: Comprehensive input validation middleware
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler';

/**
 * Middleware factory for validating request body against Zod schema
 * ISSUE #14: Add Zod schema validation for all inputs
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        const errors = validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors,
          },
        });
      }
      // Replace req.body with validated data
      req.body = validation.data;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation error' },
      });
    }
  };
};

/**
 * Middleware factory for validating query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = schema.safeParse(req.query);
      if (!validation.success) {
        const errors = validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query validation failed',
            details: errors,
          },
        });
      }
      // Replace req.query with validated data (Zod's coerced/defaulted types
      // don't structurally satisfy Express's ParsedQs - safe by construction
      // since it's this same middleware's own schema output).
      req.query = validation.data as any;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation error' },
      });
    }
  };
};

/**
 * ISSUE #12: Validate pagination parameters
 * Ensures page and limit are valid positive integers within reasonable ranges
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  try {
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 20;

    // Validate page
    if (isNaN(page) || page < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAGINATION',
          message: 'Page must be a positive integer',
        },
      });
    }

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAGINATION',
          message: 'Limit must be between 1 and 100',
        },
      });
    }

    // Attach validated values to request
    (req as any).pagination = { page, limit };
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PAGINATION',
        message: 'Invalid pagination parameters',
      },
    });
  }
};
