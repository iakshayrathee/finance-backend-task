import { Request, Response, NextFunction } from 'express';
import { Role } from '../types';

/**
 * Custom error class for RBAC failures.
 * errorHandler maps RoleError → 403 { success: false, message: "Insufficient permissions" }
 */
export class RoleError extends Error {
  constructor() {
    super('Insufficient permissions');
    this.name = 'RoleError';
  }
}

/**
 * authorize factory — returns a middleware that enforces the given roles.
 * Must be used AFTER authenticate middleware.
 * Throws RoleError if req.user.role is not in the allowed list.
 */
export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new RoleError());
    }
    next();
  };
};
