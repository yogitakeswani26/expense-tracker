import express, { Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';
import { Family } from '../models/Family';
import { cacheService, CacheTTL } from '../services/cacheService';
import { analyticsRateLimiter } from '../middleware/rateLimiter';

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

// SCALABILITY: analytics endpoints run aggregation pipelines over the whole
// expenses collection - throttle them more tightly than plain CRUD reads so
// a runaway dashboard poll loop can't monopolize the DB connection pool.
router.use('/:familyId', analyticsRateLimiter);

router.get('/:familyId/summary', async (req: AuthRequest, res: Response) => {
  try {
    const familyId = req.params.familyId as string;
    const summary = await analyticsService.getDashboardSummary(familyId, req.user!.userId);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/trends', async (req: AuthRequest, res: Response) => {
  try {
    let months = req.query.months ? parseInt(req.query.months as string) : 12;

    if (isNaN(months) || months < 1 || months > 120) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_MONTHS', message: 'months must be between 1 and 120' } });
    }

    const familyId = req.params.familyId as string;
    const trends = await analyticsService.getMonthlyTrends(familyId, req.user!.userId, months);
    res.json({ success: true, data: trends });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/budgets/status', async (req: AuthRequest, res: Response) => {
  try {
    const familyId = req.params.familyId as string;
    const status = await analyticsService.getBudgetStatus(familyId, req.user!.userId);
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/spending/comparison', async (req: AuthRequest, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    // VALIDATION: Ensure startDate < endDate
    if (startDate >= endDate) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE_RANGE', message: 'startDate must be before endDate' } });
    }

    // Not cached: arbitrary date ranges would create unbounded cache key cardinality.
    const comparison = await analyticsService.getSpenderComparison(req.params.familyId as string, req.user!.userId, startDate, endDate);
    res.json({ success: true, data: comparison });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

export default router;
