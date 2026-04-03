import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { RoleError } from './authorize';
import logger from '../config/logger';
import { liveService } from '../modules/live/live.service';

/**
 * Global error handler — maps error types to HTTP responses.
 * All errors in the application flow here via next(err) / asyncHandler.
 * Stack traces are logged via Winston, never exposed in the response body.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // ZodError → 422 Unprocessable Entity
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(422).json({ success: false, errors });
    return;
  }

  // RoleError → 403 Forbidden
  if (err instanceof RoleError) {
    res.status(403).json({ success: false, message: 'Insufficient permissions' });
    return;
  }

  // JWT errors → 401
  if (err instanceof TokenExpiredError) {
    res.status(401).json({ success: false, message: 'Token expired' });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  // InvalidCredentialsError — bad email/password
  if (err.name === 'InvalidCredentialsError' || (err as { statusCode?: number }).statusCode === 401) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  // NotFoundError (thrown by service layer when record is null)
  if (err.name === 'NotFoundError' || (err as { statusCode?: number }).statusCode === 404) {
    res.status(404).json({ success: false, message: 'Resource not found' });
    return;
  }

  // InactiveUserError — account disabled
  if (err.name === 'InactiveUserError' || (err as { statusCode?: number }).statusCode === 403) {
    res.status(403).json({ success: false, message: err.message });
    return;
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2025':
        res.status(404).json({ success: false, message: 'Resource not found' });
        return;
      case 'P2002':
        res.status(409).json({ success: false, message: 'Already exists' });
        return;
      case 'P2003':
        res.status(400).json({ success: false, message: 'Invalid reference' });
        return;
    }
  }

  // Fallback → 500 Internal Server Error
  logger.error('Unhandled error', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  liveService.emit({
    type: 'api.error',
    actor: 'system',
    payload: { name: err.name, message: err.message },
  });
  res.status(500).json({ success: false, message: 'Internal server error' });
};
