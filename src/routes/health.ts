import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { checkRedisHealth } from '../jobs/analyticsQueue';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const checks: Record<string, string> = {
    database: 'unknown',
    redis: 'unknown',
  };

  let healthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
    healthy = false;
  }

  const redisStatus = await checkRedisHealth();
  checks.redis = redisStatus;
  if (redisStatus === 'unavailable') {
    healthy = false;
  }

  const statusCode = healthy ? 200 : 503;

  res.status(statusCode).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
});

export default router;
