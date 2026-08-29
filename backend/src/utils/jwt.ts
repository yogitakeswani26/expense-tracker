import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthPayload } from '../types';

export const generateTokens = (payload: Omit<AuthPayload, never>) => {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
  });

  const refreshToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiry,
  });

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as AuthPayload;
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string): AuthPayload | null => {
  try {
    return jwt.decode(token) as AuthPayload;
  } catch (error) {
    return null;
  }
};
