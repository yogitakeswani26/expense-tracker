import express, { Response } from 'express';
import { familyService } from '../services/familyService';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { validateObjectId } from '../utils/idValidator';

const router = express.Router();

router.use(authMiddleware);

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, currency = 'INR', timezone = 'Asia/Kolkata' } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Family name is required' } });
    }
    const family = await familyService.createFamily(req.user!.userId, name, currency, timezone);
    res.status(201).json({ success: true, data: family });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const families = await familyService.getUserFamilies(req.user!.userId);
    res.json({ success: true, data: families });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId', async (req: AuthRequest, res: Response) => {
  try {
    // ISSUE #7: Validate ObjectId before querying
    validateObjectId(req.params.familyId, 'familyId');

    const family = await familyService.getFamily(req.params.familyId as string);
    if (!family) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Family not found' } });
    }

    // Fix: Properly handle userId which could be ObjectId or string
    const isMember = family.members && family.members.some((m: any) => {
      const memberId = m.userId?._id?.toString() || m.userId?.toString() || m.userId;
      return memberId === req.user!.userId;
    });

    if (!isMember) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not a member of this family' } });
    }
    res.json({ success: true, data: family });
  } catch (error: any) {
    console.error('Family get error:', error);
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

router.put('/:familyId', async (req: AuthRequest, res: Response) => {
  try {
    // ISSUE #7: Validate ObjectId before querying
    validateObjectId(req.params.familyId, 'familyId');

    const family = await familyService.updateFamily(req.params.familyId as string, req.user!.userId, req.body);
    res.json({ success: true, data: family });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/members', async (req: AuthRequest, res: Response) => {
  try {
    // ISSUE #7: Validate ObjectId before querying
    validateObjectId(req.params.familyId, 'familyId');

    const family = await familyService.getFamily(req.params.familyId as string);
    if (!family) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Family not found' } });
    }

    // Fix: Properly handle userId which could be ObjectId or string
    const isMember = family.members && family.members.some((m: any) => {
      const memberId = m.userId?._id?.toString() || m.userId?.toString() || m.userId;
      return memberId === req.user!.userId;
    });

    if (!isMember) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not a member of this family' } });
    }
    res.json({ success: true, data: family.members || [] });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.post('/:familyId/members', async (req: AuthRequest, res: Response) => {
  try {
    // ISSUE #7: Validate ObjectId before querying
    validateObjectId(req.params.familyId, 'familyId');

    const { email, userId, role = 'member' } = req.body;

    // Support both email and userId for adding members
    let memberUserId = userId;

    if (email && !userId) {
      // Look up user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User with this email not found' } });
      }
      memberUserId = user._id.toString();
    }

    if (!memberUserId) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Either email or userId is required' } });
    }

    // ISSUE #7: Validate userId if provided directly
    if (userId) {
      validateObjectId(userId, 'userId');
    }

    const family = await familyService.addMember(req.params.familyId as string, req.user!.userId, memberUserId, role);
    res.status(201).json({ success: true, data: family });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.delete('/:familyId/members/:userId', async (req: AuthRequest, res: Response) => {
  try {
    // ISSUE #7: Validate ObjectIds before querying
    validateObjectId(req.params.familyId, 'familyId');
    validateObjectId(req.params.userId, 'userId');

    const family = await familyService.removeMember(req.params.familyId as string, req.user!.userId, req.params.userId as string);
    res.json({ success: true, data: family });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.put('/:familyId/members/:userId/role', async (req: AuthRequest, res: Response) => {
  try {
    // ISSUE #7: Validate ObjectIds before querying
    validateObjectId(req.params.familyId, 'familyId');
    validateObjectId(req.params.userId, 'userId');

    const { role } = req.body;
    if (!role || !['owner', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ROLE', message: 'Invalid role' } });
    }
    const family = await familyService.updateMemberRole(req.params.familyId as string, req.user!.userId, req.params.userId as string, role);
    res.json({ success: true, data: family });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code, message: error.message } });
  }
});

router.get('/:familyId/settlements', async (req: AuthRequest, res: Response) => {
  try {
    // ISSUE #7: Validate ObjectId before querying
    validateObjectId(req.params.familyId, 'familyId');

    const family = await familyService.getFamily(req.params.familyId as string);
    if (!family) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Family not found' } });
    }

    // Fix: Properly handle userId which could be ObjectId or string
    const isMember = family.members && family.members.some((m: any) => {
      const memberId = m.userId?._id?.toString() || m.userId?.toString() || m.userId;
      return memberId === req.user!.userId;
    });

    if (!isMember) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not a member of this family' } });
    }
    // ISSUE #4: Pass userId to service method for authorization check
    const settlements = await familyService.getWhoOwesWho(req.params.familyId as string, req.user!.userId);
    res.json({ success: true, data: settlements });
  } catch (error: any) {
    console.error('Settlements error:', error);
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

export default router;
