import { z } from 'zod';
import { TxType } from '../../types';

// ── Request DTOs ─────────────────────────────────────────────────────────────

export const CreateRecordDto = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal with up to 2 decimal places'),
  type: z.nativeEnum(TxType),
  category: z.string().min(1, 'Category is required').max(100),
  date: z.string().datetime({ message: 'Date must be a valid ISO 8601 datetime string' }),
  notes: z.string().max(500).optional(),
});
export type CreateRecordDto = z.infer<typeof CreateRecordDto>;

export const UpdateRecordDto = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal with up to 2 decimal places')
    .optional(),
  type: z.nativeEnum(TxType).optional(),
  category: z.string().min(1).max(100).optional(),
  date: z.string().datetime().optional(),
  notes: z.string().max(500).optional().nullable(),
});
export type UpdateRecordDto = z.infer<typeof UpdateRecordDto>;

// ── Query DTOs ───────────────────────────────────────────────────────────────

export const ListRecordsQueryDto = z.object({
  type: z.nativeEnum(TxType).optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['date', 'amount']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export type ListRecordsQueryDto = z.infer<typeof ListRecordsQueryDto>;
