import env from './config/env';
import { createApp } from './app';
import { initAnalyticsQueue, closeAnalyticsQueue } from './jobs/analyticsQueue';
import prisma from './config/database';

const app = createApp();
const PORT = parseInt(env.PORT, 10);

initAnalyticsQueue();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received: shutting down`);
  server.close(async () => {
    await closeAnalyticsQueue();
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
