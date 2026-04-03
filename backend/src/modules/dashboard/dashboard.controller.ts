import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { dashboardService } from './dashboard.service';

/**
 * Dashboard controller — request parsing and response only. No business logic.
 */
export const dashboardController = {
  getSummary: async (_req: Request, res: Response): Promise<void> => {
    const data = await dashboardService.getSummary();
    success(res, data);
  },

  getByCategory: async (_req: Request, res: Response): Promise<void> => {
    const data = await dashboardService.getByCategory();
    success(res, data);
  },

  getTrends: async (req: Request, res: Response): Promise<void> => {
    const { period } = req.query as { period: 'monthly' | 'weekly' };
    const data = await dashboardService.getTrends(period ?? 'monthly');
    success(res, data);
  },

  getRecent: async (req: Request, res: Response): Promise<void> => {
    const limit = req.query.limit as unknown as number;
    const data = await dashboardService.getRecent(Number(limit) || 5);
    success(res, data);
  },
};
