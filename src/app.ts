import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import env from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalRateLimiter } from './middleware/rateLimit';
import { requestId } from './middleware/requestId';
import authRoutes from './routes/auth';
import articleRoutes from './routes/articles';
import authorRoutes from './routes/author';
import healthRoutes from './routes/health';

export const createApp = (): Express => {
  const app = express();

  if (env.TRUST_PROXY) {
    app.set('trust proxy', 1);
  }

  app.use(requestId);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(generalRateLimiter);

  app.use('/health', healthRoutes);
  app.use('/auth', authRoutes);
  app.use('/articles', articleRoutes);
  app.use('/author', authorRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
