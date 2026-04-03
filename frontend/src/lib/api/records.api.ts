import apiClient from './client';
import type {
  FinancialRecord,
  CreateRecordDto,
  UpdateRecordDto,
  ListRecordsQuery,
  ListRecordsResponse,
} from '@/types/api.types';

export const recordsApi = {
  list: async (query: ListRecordsQuery = {}): Promise<ListRecordsResponse> => {
    const { data } = await apiClient.get<{ success: true; data: ListRecordsResponse }>(
      '/records',
      { params: query }
    );
    return data.data;
  },

  getById: async (id: string): Promise<FinancialRecord> => {
    const { data } = await apiClient.get<{ success: true; data: { record: FinancialRecord } }>(
      `/records/${id}`
    );
    return data.data.record;
  },

  create: async (dto: CreateRecordDto): Promise<FinancialRecord> => {
    const { data } = await apiClient.post<{ success: true; data: { record: FinancialRecord } }>(
      '/records',
      dto
    );
    return data.data.record;
  },

  update: async (id: string, dto: UpdateRecordDto): Promise<FinancialRecord> => {
    const { data } = await apiClient.patch<{ success: true; data: { record: FinancialRecord } }>(
      `/records/${id}`,
      dto
    );
    return data.data.record;
  },

  delete: async (id: string): Promise<FinancialRecord> => {
    const { data } = await apiClient.delete<{ success: true; data: { record: FinancialRecord } }>(
      `/records/${id}`
    );
    return data.data.record;
  },
};
