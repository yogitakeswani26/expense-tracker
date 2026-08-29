import express, { Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';

const router = express.Router();

router.use(authMiddleware);

router.get('/:familyId/summary', async (req: AuthRequest, res: Response) => {
  try {
    const summary = await analyticsService.getDashboardSummary(req.params.familyId);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/trends', async (req: AuthRequest, res: Response) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string) : 12;
    const trends = await analyticsService.getMonthlyTrends(req.params.familyId, months);
    res.json({ success: true, data: trends });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/budgets/status', async (req: AuthRequest, res: Response) => {
  try {
    const status = await analyticsService.getBudgetStatus(req.params.familyId);
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/spending/comparison', async (req: AuthRequest, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const comparison = await analyticsService.getSpenderComparison(req.params.familyId, startDate, endDate);
    res.json({ success: true, data: comparison });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

export default router;
