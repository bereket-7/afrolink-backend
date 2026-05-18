import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { JwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    req.user = verifyToken(token);
  } catch {
    // Invalid token on optional route — treat as anonymous
  }

  next();
};

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        Success: false,
        Message: 'Unauthorized',
        Object: null,
        Errors: ['Authorization token is required'],
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      Success: false,
      Message: 'Unauthorized',
      Object: null,
      Errors: ['Invalid or expired token'],
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        Success: false,
        Message: 'Unauthorized',
        Object: null,
        Errors: ['Authentication required'],
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        Success: false,
        Message: 'Forbidden',
        Object: null,
        Errors: ['Insufficient permissions'],
      });
      return;
    }

    next();
  };
};

export const requireAuthor = authorize('AUTHOR');
export const requireReader = authorize('READER');
export const requireAuth = authorize('AUTHOR', 'READER');
