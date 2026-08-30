import express, { Response } from 'express';
import { exportService } from '../services/exportService';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';
import { Family } from '../models/Family';

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

router.get('/:familyId/csv', async (req: AuthRequest, res: Response) => {
  try {
    const { familyId } = req.params as { familyId: string };
    const { startDate, endDate } = req.query;

    // VALIDATION: Date range validation
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      start = new Date(startDate as string);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid startDate format' } });
      }
    }

    if (endDate) {
      end = new Date(endDate as string);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid endDate format' } });
      }
    }

    if (start && end && start >= end) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE_RANGE', message: 'startDate must be before endDate' } });
    }

    const csv = await exportService.exportExpensesCSV(familyId, start, end);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${familyId}-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'EXPORT_ERROR', message: error.message } });
  }
});

router.get('/:familyId/json', async (req: AuthRequest, res: Response) => {
  try {
    const { familyId } = req.params as { familyId: string };
    const { startDate, endDate } = req.query;

    // VALIDATION: Date range validation
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      start = new Date(startDate as string);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid startDate format' } });
      }
    }

    if (endDate) {
      end = new Date(endDate as string);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid endDate format' } });
      }
    }

    if (start && end && start >= end) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE_RANGE', message: 'startDate must be before endDate' } });
    }

    const json = await exportService.exportExpensesJSON(familyId, start, end);

    res.json({ success: true, data: json });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'EXPORT_ERROR', message: error.message } });
  }
});

router.get('/:familyId/monthly-report', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { familyId } = req.params as { familyId: string };
    const { month, year } = req.query;

    if (!month || !year) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'month and year are required' },
      });
      return;
    }

    const report = await exportService.generateMonthlyReport(
      familyId,
      parseInt(month as string),
      parseInt(year as string)
    );

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'REPORT_ERROR', message: error.message } });
  }
});

router.get('/:familyId/yearly-report', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { familyId } = req.params as { familyId: string };
    const { year } = req.query;

    if (!year) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'year is required' },
      });
      return;
    }

    const report = await exportService.generateYearlyReport(familyId, parseInt(year as string));

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'REPORT_ERROR', message: error.message } });
  }
});

export default router;
