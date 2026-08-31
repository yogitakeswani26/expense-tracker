import express, { Response } from 'express';
import { authService } from '../services/authService';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';
import { signupRateLimiter, loginRateLimiter, refreshRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.post('/signup', signupRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const result = await authService.signup(email, password, name);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.post('/login', loginRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email and password required' }
      });
    }

    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const code = error.code || 'LOGIN_ERROR';
    const message = error.message || 'Login failed';
    res.status(statusCode).json({ success: false, error: { code, message } });
  }
});

router.post('/refresh', refreshRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.getUserProfile(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Only allow specific fields to be updated
    const allowedFields = ['name', 'currency', 'timezone', 'language'];
    const updates: any = {};

    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: { code: 'NO_UPDATES', message: 'No valid fields to update' } });
    }

    const user = await authService.updateProfile(req.user!.userId, updates);
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

export default router;
