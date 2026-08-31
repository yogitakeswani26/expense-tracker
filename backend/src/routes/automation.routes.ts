import express, { Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';
import { Family } from '../models/Family';
import { scheduledReportService } from '../services/scheduledReportService';
import { smartNotificationService } from '../services/smartNotificationService';

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

// ============================================================================
// SCHEDULED REPORTS (on-demand generation — see scheduledReportService.ts
// header comment for wiring these to an actual cron/scheduler)
// ============================================================================

router.get('/:familyId/reports/weekly', async (req: AuthRequest, res: Response) => {
  try {
    const data = await scheduledReportService.generateReport(req.params.familyId as string, 'weekly');
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

router.get('/:familyId/reports/monthly', async (req: AuthRequest, res: Response) => {
  try {
    const data = await scheduledReportService.generateReport(req.params.familyId as string, 'monthly');
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

// ============================================================================
// SMART NOTIFICATIONS
// ============================================================================

// Runs all AI detectors (savings, anomalies, recurring) and raises notifications.
// Intended to be triggered by a scheduler; safe to call on-demand too.
router.post('/:familyId/checks/run', async (req: AuthRequest, res: Response) => {
  try {
    const data = await smartNotificationService.runSmartChecks(req.params.familyId as string);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

router.get('/:familyId/notifications', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
    const data = smartNotificationService.getForFamily(req.params.familyId as string, limit);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

router.put('/:familyId/notifications/:notificationId/read', async (req: AuthRequest, res: Response) => {
  try {
    const data = smartNotificationService.markAsRead(req.params.notificationId as string);
    if (!data) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    }
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'ERROR', message: error.message } });
  }
});

export default router;
