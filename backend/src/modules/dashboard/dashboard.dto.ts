import { z } from 'zod';

export const TrendsQueryDto = z.object({
  period: z.enum(['monthly', 'weekly']).default('monthly'),
});
export type TrendsQueryDto = z.infer<typeof TrendsQueryDto>;

export const RecentQueryDto = z.object({
  limit: z.coerce.number().int().positive().max(50).default(5),
});
export type RecentQueryDto = z.infer<typeof RecentQueryDto>;
