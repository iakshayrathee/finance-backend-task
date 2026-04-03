import { recordRepository } from './record.repository';
import { TxType } from '../../types';
import { liveService } from '../live/live.service';

/**
 * Helper: safely convert Prisma.Decimal to string.
 * Decimal amounts from Prisma must NEVER be passed through JSON.stringify without .toString().
 */
const decimalToStr = (val: { toString(): string }): string =>
  parseFloat(val.toString()).toFixed(2);

const serializeRecord = (record: {
  id: string;
  amount: { toString(): string };
  type: string;
  category: string;
  date: Date;
  notes: string | null;
  isDeleted: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  ...record,
  amount: decimalToStr(record.amount),
});

export const recordService = {
  createRecord: async (data: {
    amount: string;
    type: TxType;
    category: string;
    date: string;
    notes?: string;
    createdBy: string;
  }) => {
    const record = await recordRepository.create(data);
    liveService.emit({
      type: 'record.created',
      actor: { id: data.createdBy },
      payload: {
        id: record.id,
        type: record.type,
        amount: record.amount.toString(),
        category: record.category,
        createdBy: data.createdBy,
      },
    });
    return serializeRecord(record);
  },

  listRecords: async (filters: {
    type?: TxType;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    minAmount?: number;
    maxAmount?: number;
    page: number;
    limit: number;
    sortBy: 'date' | 'amount';
    order: 'asc' | 'desc';
  }) => {
    const [records, total] = await Promise.all([
      recordRepository.findMany(filters),
      recordRepository.count(filters),
    ]);

    return {
      records: records.map(serializeRecord),
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  },

  getRecordById: async (id: string) => {
    const record = await recordRepository.findById(id);
    if (!record) {
      throw Object.assign(new Error('Resource not found'), {
        name: 'NotFoundError',
        statusCode: 404,
      });
    }
    return serializeRecord(record);
  },

  updateRecord: async (
    id: string,
    data: {
      amount?: string;
      type?: TxType;
      category?: string;
      date?: string;
      notes?: string | null;
    },
    actorId: string
  ) => {
    // Will throw Prisma P2025 if record not found
    const record = await recordRepository.update(id, data);
    liveService.emit({
      type: 'record.updated',
      actor: { id: actorId },
      payload: { id, changes: data },
    });
    return serializeRecord(record);
  },

  deleteRecord: async (id: string, actorId: string) => {
    const record = await recordRepository.softDelete(id);
    liveService.emit({
      type: 'record.deleted',
      actor: { id: actorId },
      payload: { id },
    });
    return serializeRecord(record);
  },
};
