import express, { Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';
import { Family } from '../models/Family';

const router = express.Router();

router.use(authMiddleware);

// Middleware to check family membership
const checkFamilyMembership = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const familyId = req.params.familyId;
    const family = await Family.findById(familyId);

    if (!family) {
      return res.status(404).json({ success: false, error: { code: 'FAMILY_NOT_FOUND', message: 'Family not found' } });
    }

    const isMember = family.members.some(m => m.userId.toString() === req.user!.userId);
    if (!isMember) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not a member of this family' } });
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'ERROR', message: error.message } });
  }
};

router.use('/:familyId', checkFamilyMembership);

router.get('/:familyId/summary', async (req: AuthRequest, res: Response) => {
  try {
    const summary = await analyticsService.getDashboardSummary(req.params.familyId as string);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/trends', async (req: AuthRequest, res: Response) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string) : 12;
    const trends = await analyticsService.getMonthlyTrends(req.params.familyId as string, months);
    res.json({ success: true, data: trends });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/budgets/status', async (req: AuthRequest, res: Response) => {
  try {
    const status = await analyticsService.getBudgetStatus(req.params.familyId as string);
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/spending/comparison', async (req: AuthRequest, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const comparison = await analyticsService.getSpenderComparison(req.params.familyId as string, startDate, endDate);
    res.json({ success: true, data: comparison });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

export default router;
