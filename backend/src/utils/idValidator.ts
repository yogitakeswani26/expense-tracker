// ISSUE #7: ObjectId validation utility
import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler';

export const validateObjectId = (id: string | string[] | undefined, fieldName: string = 'ID'): boolean => {
  const idStr = Array.isArray(id) ? id[0] : id;
  if (!idStr || !Types.ObjectId.isValid(idStr)) {
    throw new AppError('INVALID_ID', `Invalid ${fieldName} format`, 400);
  }
  return true;
};

export const validateObjectIds = (ids: string[], fieldName: string = 'IDs'): boolean => {
  for (const id of ids) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('INVALID_ID', `Invalid ${fieldName} format`, 400);
    }
  }
  return true;
};

export const safeObjectId = (id: string): Types.ObjectId | null => {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }
  return new Types.ObjectId(id);
};
