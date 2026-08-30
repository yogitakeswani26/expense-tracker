import express, { Response } from 'express';
import { exportService } from '../services/exportService';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';

const router = express.Router();

router.use(authMiddleware);

router.get('/:familyId/csv', async (req: AuthRequest, res: Response) => {
  try {
    const { familyId } = req.params as { familyId: string };
    const { startDate, endDate } = req.query;

    const csv = await exportService.exportExpensesCSV(
      familyId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

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

    const json = await exportService.exportExpensesJSON(
      familyId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

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
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'month and year are required' },
      });
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
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'year is required' },
      });
    }

    const report = await exportService.generateYearlyReport(familyId, parseInt(year as string));

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'REPORT_ERROR', message: error.message } });
  }
});

export default router;
