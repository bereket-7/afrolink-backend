import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
        res.status(400).json({
          Success: false,
          Message: 'Validation failed',
          Object: null,
          Errors: errors,
        });
        return;
      }
      
      res.status(400).json({
        Success: false,
        Message: 'Validation failed',
        Object: null,
        Errors: ['Invalid request data'],
      });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = { ...req.query, ...schema.parse(req.query) } as Request['query'];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
        res.status(400).json({
          Success: false,
          Message: 'Validation failed',
          Object: null,
          Errors: errors,
        });
        return;
      }
      
      res.status(400).json({
        Success: false,
        Message: 'Validation failed',
        Object: null,
        Errors: ['Invalid query parameters'],
      });
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as Request['params'];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
        res.status(400).json({
          Success: false,
          Message: 'Validation failed',
          Object: null,
          Errors: errors,
        });
        return;
      }
      
      res.status(400).json({
        Success: false,
        Message: 'Validation failed',
        Object: null,
        Errors: ['Invalid parameters'],
      });
    }
  };
};
