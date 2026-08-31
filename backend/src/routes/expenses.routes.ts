import express, { Response } from 'express';
import { expenseService } from '../services/expenseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';
import { Family } from '../models/Family';
import { AppError } from '../middleware/errorHandler';

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

router.post('/:familyId', async (req: AuthRequest, res: Response) => {
  try {
    const expense = await expenseService.createExpense(req.params.familyId as string, req.user!.userId, req.body);
    res.status(201).json({ success: true, data: expense });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/categories', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 100));
    const skip = Math.max(0, parseInt(req.query.skip as string) || 0);
    const categories = await expenseService.getCategories(req.params.familyId as string, limit, skip);
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId', async (req: AuthRequest, res: Response) => {
  try {
    const result = await expenseService.getExpenses(req.params.familyId as string, req.query);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/:expenseId', async (req: AuthRequest, res: Response) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.familyId as string, req.params.expenseId as string);
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.put('/:familyId/:expenseId', async (req: AuthRequest, res: Response) => {
  try {
    const expense = await expenseService.updateExpense(req.params.familyId as string, req.params.expenseId as string, req.user!.userId, req.body);
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.delete('/:familyId/:expenseId', async (req: AuthRequest, res: Response) => {
  try {
    const result = await expenseService.deleteExpense(req.params.familyId as string, req.params.expenseId as string, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

export default router;
