import express, { Response } from 'express';
import { expenseService } from '../services/expenseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';

const router = express.Router();

router.use(authMiddleware);

router.post('/:familyId', async (req: AuthRequest, res: Response) => {
  try {
    const expense = await expenseService.createExpense(req.params.familyId as string, req.user!.userId, req.body);
    res.status(201).json({ success: true, data: expense });
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
    const expense = await expenseService.getExpenseById(req.params.familyId, req.params.expenseId as string);
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.put('/:familyId/:expenseId', async (req: AuthRequest, res: Response) => {
  try {
    const expense = await expenseService.updateExpense(req.params.familyId, req.params.expenseId as string, req.body);
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.delete('/:familyId/:expenseId', async (req: AuthRequest, res: Response) => {
  try {
    const result = await expenseService.deleteExpense(req.params.familyId, req.params.expenseId as string);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/categories', async (req: AuthRequest, res: Response) => {
  try {
    const categories = await expenseService.getCategories(req.params.familyId);
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

export default router;
