import express, { Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';
import { Family } from '../models/Family';
import { expenseOptimizationService } from '../services/expenseOptimizationService';
import { smartRecommendationService } from '../services/smartRecommendationService';
import { autoCategorizationService } from '../services/autoCategorizationService';

const router = express.Router();

router.use(authMiddleware);

// Middleware to check family membership (matches expenses.routes.ts / analytics.routes.ts convention)
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

// ============================================================================
// EXPENSE OPTIMIZATION AI
// ============================================================================

router.get('/:familyId/spending-patterns', async (req: AuthRequest, res: Response) => {
  try {
    const months = Math.min(24, Math.max(1, parseInt(req.query.months as string) || 6));
    const data = await expenseOptimizationService.analyzeSpendingPatterns(req.params.familyId as string, months);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

router.get('/:familyId/recurring-candidates', async (req: AuthRequest, res: Response) => {
  try {
    const data = await expenseOptimizationService.detectRecurringCandidates(req.params.familyId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

router.get('/:familyId/savings-opportunities', async (req: AuthRequest, res: Response) => {
  try {
    const data = await expenseOptimizationService.identifySavingsOpportunities(req.params.familyId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

router.get('/:familyId/recommendations', async (req: AuthRequest, res: Response) => {
  try {
    const data = await expenseOptimizationService.generateRecommendations(req.params.familyId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

// ============================================================================
// SMART RECOMMENDATIONS
// ============================================================================

router.get('/:familyId/budget-suggestions', async (req: AuthRequest, res: Response) => {
  try {
    const months = Math.min(12, Math.max(1, parseInt(req.query.months as string) || 3));
    const data = await smartRecommendationService.suggestCategoryBudgets(req.params.familyId as string, months);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

router.get('/:familyId/predictions', async (req: AuthRequest, res: Response) => {
  try {
    const data = await smartRecommendationService.predictNextMonthSpending(req.params.familyId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

router.get('/:familyId/category-insights', async (req: AuthRequest, res: Response) => {
  try {
    const data = await smartRecommendationService.getCategoryInsights(req.params.familyId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

router.get('/:familyId/anomalies', async (req: AuthRequest, res: Response) => {
  try {
    const data = await smartRecommendationService.detectAnomalies(req.params.familyId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

router.get('/:familyId/digest', async (req: AuthRequest, res: Response) => {
  try {
    const data = await smartRecommendationService.generateSmartDigest(req.params.familyId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

// ============================================================================
// AUTO-CATEGORIZATION
// ============================================================================

router.post('/:familyId/categorize/suggest', async (req: AuthRequest, res: Response) => {
  try {
    const { description, amount } = req.body;
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'description is required' } });
    }
    const data = await autoCategorizationService.suggestCategory(req.params.familyId as string, description, amount);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

router.post('/:familyId/categorize/bulk-review', async (req: AuthRequest, res: Response) => {
  try {
    const category = (req.body?.category as string) || 'Miscellaneous';
    const apply = req.body?.apply === true;
    const data = await autoCategorizationService.suggestBulkRecategorization(req.params.familyId as string, category, apply);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

export default router;
