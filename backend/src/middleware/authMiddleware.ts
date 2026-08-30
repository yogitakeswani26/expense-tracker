import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthRequest, AuthPayload } from '../types';

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: 'No token provided' } });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
    req.user = decoded;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
  }
};

export const optionalAuthMiddleware = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
      req.user = decoded;
    }
  } catch (error) {
    // Token is optional, so we continue
  }
  next();
};
