import { Response } from 'express';

interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

interface ErrorEnvelope {
  success: false;
  message: string;
}

interface ValidationErrorEnvelope {
  success: false;
  errors: Array<{ field: string; message: string }>;
}

export const success = <T>(res: Response, data: T, statusCode = 200): Response<SuccessEnvelope<T>> => {
  return res.status(statusCode).json({ success: true, data });
};

export const error = (res: Response, message: string, statusCode = 500): Response<ErrorEnvelope> => {
  return res.status(statusCode).json({ success: false, message });
};

export const validationError = (
  res: Response,
  errors: Array<{ field: string; message: string }>
): Response<ValidationErrorEnvelope> => {
  return res.status(422).json({ success: false, errors });
};
