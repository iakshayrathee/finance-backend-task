import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { userService } from './user.service';

/**
 * User controller — request parsing and response only. No business logic.
 */
export const userController = {
  createUser: async (req: Request, res: Response): Promise<void> => {
    const user = await userService.createUser(req.body, req.user!.id);
    success(res, { user }, 201);
  },

  listUsers: async (req: Request, res: Response): Promise<void> => {
    const result = await userService.listUsers(req.query as never);
    success(res, result);
  },

  getUserById: async (req: Request, res: Response): Promise<void> => {
    const user = await userService.getUserById(req.params.id);
    success(res, { user });
  },

  updateUser: async (req: Request, res: Response): Promise<void> => {
    const user = await userService.updateUser(req.params.id, req.body, req.user!.id);
    success(res, { user });
  },

  deleteUser: async (req: Request, res: Response): Promise<void> => {
    const user = await userService.deleteUser(req.params.id, req.user!.id);
    success(res, { user });
  },
};
