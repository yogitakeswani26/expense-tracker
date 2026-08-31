import express, { Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';
import { Family } from '../models/Family';
import { settlementService, SettlementMode } from '../services/settlementService';
import { validateObjectId } from '../utils/idValidator';

const router = express.Router();

router.use(authMiddleware);

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

// Net balance per member (who's owed, who owes)
router.get('/:familyId/balances', async (req: AuthRequest, res: Response) => {
  try {
    const data = await settlementService.calculateNetBalances(req.params.familyId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

// Raw pairwise "who owes whom" (pre-simplification)
router.get('/:familyId/who-owes-whom', async (req: AuthRequest, res: Response) => {
  try {
    const data = await settlementService.getWhoOwesWhom(req.params.familyId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

// Minimal-transaction settlement plan. ?mode=auto|exact|fast
router.get('/:familyId/optimize', async (req: AuthRequest, res: Response) => {
  try {
    const mode = ((req.query.mode as string) || 'auto') as SettlementMode;
    const data = await settlementService.suggestSettlementPlan(req.params.familyId as string, mode);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

// Record an actual settlement payment
router.post('/:familyId/settle', async (req: AuthRequest, res: Response) => {
  try {
    const { fromUserId, toUserId, amount } = req.body;
    validateObjectId(fromUserId, 'fromUserId');
    validateObjectId(toUserId, 'toUserId');
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'amount must be a positive number' } });
    }

    const data = await settlementService.recordSettlement(
      req.params.familyId as string,
      fromUserId,
      toUserId,
      amount,
      req.user!.userId
    );
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

router.get('/:familyId/history', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
    const data = await settlementService.getSettlementHistory(req.params.familyId as string, limit);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

export default router;
