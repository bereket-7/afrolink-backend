import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      Success: false,
      Message: err.message,
      Object: null,
      Errors: [err.message],
    });
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code?: string };
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        Success: false,
        Message: 'Conflict',
        Object: null,
        Errors: ['A record with this value already exists'],
      });
      return;
    }
  }

  logger.error('Unexpected error:', err);

  res.status(500).json({
    Success: false,
    Message: 'Internal server error',
    Object: null,
    Errors: ['An unexpected error occurred'],
  });
};

export const notFoundHandler = (
  _req: Request,
  res: Response
): void => {
  res.status(404).json({
    Success: false,
    Message: 'Not found',
    Object: null,
    Errors: ['Route not found'],
  });
};
