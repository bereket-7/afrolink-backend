import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import env from '../config/env';

// Rate limiter for article reads to prevent spam
export const articleReadRateLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 1, // Limit each IP to 1 request per windowMs
  skip: () => env.NODE_ENV === 'test',
  message: {
    Success: false,
    Message: 'Too many requests',
    Object: null,
    Errors: ['Please wait before reading this article again'],
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = req.user?.sub ?? req.ip;
    const articleId = req.params.id;
    return `${userId}-${articleId}`;
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      Success: false,
      Message: 'Too many requests',
      Object: null,
      Errors: ['Please wait before reading this article again'],
    });
  },
});

// General rate limiter for all endpoints
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    Success: false,
    Message: 'Too many requests',
    Object: null,
    Errors: ['Too many requests from this IP, please try again later'],
  },
  standardHeaders: true,
  legacyHeaders: false,
});
