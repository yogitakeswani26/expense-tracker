import express, { Response } from 'express';
import { budgetService } from '../services/budgetService';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';

const router = express.Router();

router.use(authMiddleware);

// Create a budget for a family
router.post('/:familyId', async (req: AuthRequest, res: Response) => {
  try {
    const budget = await budgetService.createBudget(req.params.familyId as string, req.user!.userId, req.body);
    res.status(201).json({ success: true, data: budget });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

// List all budgets for a family (with live spent/remaining/status)
router.get('/:familyId', async (req: AuthRequest, res: Response) => {
  try {
    const budgets = await budgetService.getBudgets(req.params.familyId as string, req.user!.userId);
    res.json({ success: true, data: budgets });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

// Dashboard-friendly summary: totals + budgets that are at/over their alert threshold
router.get('/:familyId/alerts', async (req: AuthRequest, res: Response) => {
  try {
    const summary = await budgetService.getBudgetAlerts(req.params.familyId as string, req.user!.userId);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

// Get a single budget
router.get('/:familyId/:budgetId', async (req: AuthRequest, res: Response) => {
  try {
    const budget = await budgetService.getBudgetById(req.params.familyId as string, req.user!.userId, req.params.budgetId as string);
    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

// Update a budget
router.put('/:familyId/:budgetId', async (req: AuthRequest, res: Response) => {
  try {
    const budget = await budgetService.updateBudget(req.params.familyId as string, req.user!.userId, req.params.budgetId as string, req.body);
    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

// Delete a budget
router.delete('/:familyId/:budgetId', async (req: AuthRequest, res: Response) => {
  try {
    const result = await budgetService.deleteBudget(req.params.familyId as string, req.user!.userId, req.params.budgetId as string);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

export default router;
