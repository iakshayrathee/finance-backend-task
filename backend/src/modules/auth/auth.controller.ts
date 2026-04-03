import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { authService } from './auth.service';

/**
 * Auth controller — request parsing and response only. No business logic.
 */
export const authController = {
  register: async (req: Request, res: Response): Promise<void> => {
    const user = await authService.register(req.body);
    success(res, { user }, 201);
  },

  login: async (req: Request, res: Response): Promise<void> => {
    const result = await authService.login(req.body);
    success(res, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  },

  refresh: async (req: Request, res: Response): Promise<void> => {
    const tokens = await authService.refresh(req.body.refreshToken);
    success(res, tokens);
  },

  logout: async (req: Request, res: Response): Promise<void> => {
    await authService.logout(req.body.refreshToken);
    res.status(204).send();
  },
};
