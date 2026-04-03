import { prisma } from '../../config/db';
import { Role } from '../../types';

/**
 * Auth repository — all Prisma calls for auth operations.
 * Password field is excluded at this level using Prisma select/omit.
 */
export const authRepository = {
  /**
   * Count total users — used to determine if first registrant should be ADMIN.
   */
  countUsers: (): Promise<number> => {
    return prisma.user.count();
  },

  /**
   * Create a new user. Password must already be hashed before calling this.
   * Returns the user without the password field.
   */
  createUser: (data: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) => {
    return prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Find a user by email including the password field (only for login verification).
   */
  findUserByEmailWithPassword: (email: string) => {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Store a hashed refresh token record.
   */
  createRefreshToken: (data: {
    tokenHash: string;
    userId: string;
    expiresAt: Date;
  }) => {
    return prisma.refreshToken.create({ data });
  },

  /**
   * Find a refresh token record by its SHA-256 hash.
   */
  findRefreshTokenByHash: (tokenHash: string) => {
    return prisma.refreshToken.findFirst({
      where: { tokenHash },
    });
  },

  /**
   * Delete a refresh token record by its ID.
   */
  deleteRefreshTokenById: (id: string) => {
    return prisma.refreshToken.delete({ where: { id } });
  },

  /**
   * Delete a refresh token by its hash (used for logout).
   */
  deleteRefreshTokenByHash: (tokenHash: string) => {
    return prisma.refreshToken.deleteMany({ where: { tokenHash } });
  },

  /**
   * Find a user by their ID (used during token refresh to re-sign the access token).
   */
  findUserById: (id: string) => {
    return prisma.user.findUnique({ where: { id } });
  },
};
