import { z } from 'zod';

// ── Request DTOs ─────────────────────────────────────────────────────────────

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const RegisterDto = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: strongPassword,
});
export type RegisterDto = z.infer<typeof RegisterDto>;

export const LoginDto = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginDto = z.infer<typeof LoginDto>;

export const RefreshDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type RefreshDto = z.infer<typeof RefreshDto>;

export const LogoutDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type LogoutDto = z.infer<typeof LogoutDto>;
