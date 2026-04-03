import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * validateBody — validates req.body against a Zod schema.
 * Throws ZodError on failure (caught by errorHandler → 422).
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
};

/**
 * validateQuery — validates req.query against a Zod schema.
 * Throws ZodError on failure (caught by errorHandler → 422).
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.query = schema.parse(req.query) as typeof req.query;
    next();
  };
};
