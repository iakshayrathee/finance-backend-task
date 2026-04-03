import { userRepository } from './user.repository';
import { Role, Status } from '../../types';
import { liveService } from '../live/live.service';
import { hashPassword } from '../../utils/crypto';

export const userService = {
  createUser: async (
    data: { name: string; email: string; password: string; role: Role },
    actorId: string
  ) => {
    const hashedPassword = await hashPassword(data.password);
    const user = await userRepository.create({
      ...data,
      password: hashedPassword,
    });
    liveService.emit({
      type: 'user.registered',
      actor: { id: actorId },
      payload: { userId: user.id, email: user.email, role: user.role },
    });
    return user;
  },

  listUsers: async (filters: {
    role?: Role;
    status?: Status;
    page: number;
    limit: number;
  }) => {
    const [users, total] = await Promise.all([
      userRepository.findMany(filters),
      userRepository.count({ role: filters.role, status: filters.status }),
    ]);

    return {
      users,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  },

  getUserById: async (id: string) => {
    const user = await userRepository.findById(id);
    if (!user) {
      throw Object.assign(new Error('Resource not found'), {
        name: 'NotFoundError',
        statusCode: 404,
      });
    }
    return user;
  },

  updateUser: async (
    id: string,
    data: { name?: string; role?: Role; status?: Status },
    actorId: string
  ) => {
    // Will throw Prisma P2025 if user not found (caught by errorHandler → 404)
    const user = await userRepository.update(id, data);
    liveService.emit({
      type: 'user.roleChanged',
      actor: { id: actorId },
      payload: { targetUserId: id, changes: data },
    });
    return user;
  },

  deleteUser: async (id: string, actorId: string) => {
    const user = await userRepository.softDelete(id);
    liveService.emit({
      type: 'user.deactivated',
      actor: { id: actorId },
      payload: { targetUserId: id },
    });
    return user;
  },
};
