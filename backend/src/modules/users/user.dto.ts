import { z } from 'zod';
import { Role, Status } from '../../types';

// ── Request DTOs ─────────────────────────────────────────────────────────────

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const CreateUserDto = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: strongPassword,
  role: z.nativeEnum(Role).default(Role.VIEWER),
});
export type CreateUserDto = z.infer<typeof CreateUserDto>;

export const UpdateUserDto = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(Status).optional(),
});
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;

// ── Query DTOs ───────────────────────────────────────────────────────────────

export const ListUsersQueryDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(Status).optional(),
});
export type ListUsersQueryDto = z.infer<typeof ListUsersQueryDto>;
