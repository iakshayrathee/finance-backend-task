import { prisma } from '../../config/db';
import { Role, Status } from '../../types';

// Prisma select that always omits the password field
const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * User repository — all Prisma calls for user operations.
 * Password is excluded at query level via an explicit select object.
 */
export const userRepository = {
  create: (data: { name: string; email: string; password: string; role: Role }) => {
    return prisma.user.create({
      data,
      select: userSelect,
    });
  },

  findMany: (filters: {
    role?: Role;
    status?: Status;
    page: number;
    limit: number;
  }) => {
    const { role, status, page, limit } = filters;
    return prisma.user.findMany({
      where: {
        ...(role && { role }),
        ...(status && { status }),
      },
      select: userSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  },

  count: (filters: { role?: Role; status?: Status }) => {
    return prisma.user.count({
      where: {
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
      },
    });
  },

  findById: (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  },

  update: (
    id: string,
    data: { name?: string; role?: Role; status?: Status }
  ) => {
    return prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  },

  /**
   * Soft-delete a user by setting status = INACTIVE.
   * The spec says DELETE /users/:id — we treat this as deactivation (INACTIVE).
   */
  softDelete: (id: string) => {
    return prisma.user.update({
      where: { id },
      data: { status: Status.INACTIVE },
      select: userSelect,
    });
  },
};
