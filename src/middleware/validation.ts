import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
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
      schema.parse(req.query);
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
      schema.parse(req.params);
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
