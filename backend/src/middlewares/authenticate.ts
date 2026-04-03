import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload, Role } from '../types';

/**
 * authenticate middleware — verifies the Bearer JWT access token.
 * Attaches decoded payload to req.user.
 * Throws JsonWebTokenError / TokenExpiredError on failure (caught by errorHandler).
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  let token: string | undefined;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (typeof req.query.token === 'string' && req.query.token.length > 0) {
    // SSE fallback: EventSource cannot send custom headers, so token is passed as query param
    token = req.query.token;
  }

  if (!token) {
    return next(new JsonWebTokenError('No token provided'));
  }
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

  req.user = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role as Role,
  };

  next();
};
