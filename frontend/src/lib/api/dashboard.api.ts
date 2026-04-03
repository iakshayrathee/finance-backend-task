import apiClient from './client';
import type {
  DashboardSummary,
  CategoryBreakdown,
  TrendPoint,
  FinancialRecord,
} from '@/types/api.types';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const { data } = await apiClient.get<{ success: true; data: DashboardSummary }>(
      '/dashboard/summary'
    );
    return data.data;
  },

  getByCategory: async (): Promise<CategoryBreakdown[]> => {
    const { data } = await apiClient.get<{ success: true; data: CategoryBreakdown[] }>(
      '/dashboard/by-category'
    );
    return data.data;
  },

  getTrends: async (period: 'monthly' | 'weekly' = 'monthly'): Promise<TrendPoint[]> => {
    const { data } = await apiClient.get<{ success: true; data: TrendPoint[] }>(
      '/dashboard/trends',
      { params: { period } }
    );
    return data.data;
  },

  getRecent: async (limit = 5): Promise<FinancialRecord[]> => {
    const { data } = await apiClient.get<{ success: true; data: FinancialRecord[] }>(
      '/dashboard/recent',
      { params: { limit } }
    );
    return data.data;
  },
};
