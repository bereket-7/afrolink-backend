import express from 'express';
import env from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalRateLimiter } from './middleware/rateLimit';
import authRoutes from './routes/auth';
import articleRoutes from './routes/articles';
import authorRoutes from './routes/author';
import analyticsQueue from './jobs/analyticsQueue';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalRateLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/articles', articleRoutes);
app.use('/author', authorRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = parseInt(env.PORT);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await analyticsQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await analyticsQueue.close();
  process.exit(0);
});

export default app;
