/**
 * Canonical error codes for the structured error response format used by
 * every endpoint (see middleware/errorHandler.ts):
 *
 *   { "success": false, "error": { "code": "...", "message": "...", "details"?: ... } }
 *
 * Route handlers/services already throw `AppError(code, message, statusCode)`
 * with ad-hoc string codes today (e.g. 'EXPENSE_NOT_FOUND', 'FORBIDDEN').
 * This file centralizes the codes that recur across multiple resources so
 * new endpoints reuse them instead of inventing near-duplicates
 * (`'NOT_FOUND'` vs `'NOTFOUND'` vs `'RESOURCE_NOT_FOUND'`), and adds small
 * factory helpers for the most common shapes.
 */
import { AppError } from '../middleware/errorHandler';

export enum ErrorCode {
  // 400 - client sent something structurally or semantically invalid
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_ID = 'INVALID_ID',
  INVALID_PAGINATION = 'INVALID_PAGINATION',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',

  // 401 - missing/invalid/expired credentials
  NO_TOKEN = 'NO_TOKEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // 403 - authenticated, but not allowed to do this
  FORBIDDEN = 'FORBIDDEN',
  UNAUTHORIZED = 'UNAUTHORIZED', // kept for backward compatibility with existing usages meaning "forbidden"

  // 404
  NOT_FOUND = 'NOT_FOUND',

  // 409 - conflicts with current state
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  DUPLICATE_BUDGET = 'DUPLICATE_BUDGET',

  // 429
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // 5xx
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE', // circuit breaker open / dependency down
}

export const NotFoundError = (resource: string) =>
  new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404);

export const ForbiddenError = (message = 'You do not have access to this resource') =>
  new AppError(ErrorCode.FORBIDDEN, message, 403);

export const ValidationError = (message: string, details?: any) =>
  new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);

export const ServiceUnavailableError = (service: string) =>
  new AppError(ErrorCode.SERVICE_UNAVAILABLE, `${service} is temporarily unavailable, please retry shortly`, 503);
