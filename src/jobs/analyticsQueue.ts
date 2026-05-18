import Queue from 'bull';
import env from '../config/env';
import prisma from '../config/database';

let analyticsQueue: Queue.Queue | null = null;

const processAnalyticsJob = async (job: Queue.Job): Promise<{ success: boolean }> => {
  console.log('Processing analytics job:', job.id);

  const processDate = job.data.date
    ? new Date(job.data.date)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const startOfDay = new Date(processDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(processDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const readCounts = await prisma.readLog.groupBy({
    by: ['articleId'],
    where: {
      readAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    _count: {
      articleId: true,
    },
  });

  await Promise.all(
    readCounts.map((row) =>
      prisma.dailyAnalytics.upsert({
        where: {
          articleId_date: {
            articleId: row.articleId,
            date: startOfDay,
          },
        },
        update: {
          viewCount: row._count.articleId,
        },
        create: {
          articleId: row.articleId,
          viewCount: row._count.articleId,
          date: startOfDay,
        },
      })
    )
  );

  console.log('Analytics job completed successfully');
  return { success: true };
};

export const initAnalyticsQueue = (): Queue.Queue => {
  if (analyticsQueue) {
    return analyticsQueue;
  }

  analyticsQueue = new Queue('analytics', {
    redis: {
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT, 10),
      password: env.REDIS_PASSWORD || undefined,
    },
  });

  analyticsQueue.process(processAnalyticsJob);

  analyticsQueue.add(
    {},
    {
      repeat: {
        pattern: '0 0 * * *',
        tz: 'GMT',
      },
    }
  );

  return analyticsQueue;
};

export const getAnalyticsQueue = (): Queue.Queue | null => analyticsQueue;

export const closeAnalyticsQueue = async (): Promise<void> => {
  if (analyticsQueue) {
    await analyticsQueue.close();
    analyticsQueue = null;
  }
};

export const checkRedisHealth = async (): Promise<'ok' | 'unavailable' | 'not_configured'> => {
  const queue = getAnalyticsQueue();
  if (!queue) {
    return 'not_configured';
  }

  try {
    const client = await queue.client;
    const result = await client.ping();
    return result === 'PONG' ? 'ok' : 'unavailable';
  } catch {
    return 'unavailable';
  }
};
