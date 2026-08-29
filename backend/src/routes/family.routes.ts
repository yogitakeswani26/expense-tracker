import express, { Response } from 'express';
import { familyService } from '../services/familyService';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';

const router = express.Router();

router.use(authMiddleware);

router.get('/:familyId', async (req: AuthRequest, res: Response) => {
  try {
    const family = await familyService.getFamily(req.params.familyId);
    res.json({ success: true, data: family });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.put('/:familyId', async (req: AuthRequest, res: Response) => {
  try {
    const family = await familyService.updateFamily(req.params.familyId, req.body);
    res.json({ success: true, data: family });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.post('/:familyId/members', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, role } = req.body;
    const family = await familyService.addMember(req.params.familyId, userId, role);
    res.status(201).json({ success: true, data: family });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.delete('/:familyId/members/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const family = await familyService.removeMember(req.params.familyId, req.params.userId);
    res.json({ success: true, data: family });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.put('/:familyId/members/:userId/role', async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    const family = await familyService.updateMemberRole(req.params.familyId, req.params.userId, role);
    res.json({ success: true, data: family });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/settlements', async (req: AuthRequest, res: Response) => {
  try {
    const settlements = await familyService.getWhoOwesWho(req.params.familyId);
    res.json({ success: true, data: settlements });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

export default router;
