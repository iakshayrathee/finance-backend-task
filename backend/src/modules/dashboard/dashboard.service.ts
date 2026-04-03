import { dashboardRepository } from './dashboard.repository';
import { liveService } from '../live/live.service';

export const dashboardService = {
  getSummary: async () => {
    liveService.emit({
      type: 'dashboard.queried',
      actor: 'system',
      payload: { endpoint: '/api/dashboard/summary' },
    });
    return dashboardRepository.getSummary();
  },

  getByCategory: async () => {
    liveService.emit({
      type: 'dashboard.queried',
      actor: 'system',
      payload: { endpoint: '/api/dashboard/by-category' },
    });
    return dashboardRepository.getByCategory();
  },

  getTrends: async (period: 'monthly' | 'weekly') => {
    liveService.emit({
      type: 'dashboard.queried',
      actor: 'system',
      payload: { endpoint: '/api/dashboard/trends', period },
    });
    return dashboardRepository.getTrends(period);
  },

  getRecent: async (limit: number) => {
    liveService.emit({
      type: 'dashboard.queried',
      actor: 'system',
      payload: { endpoint: '/api/dashboard/recent', limit },
    });
    return dashboardRepository.getRecent(limit);
  },
};
