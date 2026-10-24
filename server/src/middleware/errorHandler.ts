import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/apiResponse.js';

export class AppError extends Error {
  statusCode: number;
  errors?: any;

  constructor(message: string, statusCode = 500, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`❌ [${req.method} ${req.url}] Error:`, err);

  if (err instanceof ZodError) {
    return sendError(
      res,
      'Validation Error: Invalid input parameters',
      400,
      err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    );
  }

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    return sendError(res, `Upload Error: ${err.message}`, 400);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal Server Error'
    : err.message || 'An unexpected error occurred';

  return sendError(res, message, statusCode);
}
