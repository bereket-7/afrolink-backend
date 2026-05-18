import Queue from 'bull';
import env from '../config/env';
import prisma from '../config/database';

const analyticsQueue = new Queue('analytics', {
  redis: {
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT),
    password: env.REDIS_PASSWORD || undefined,
  },
});

// Process analytics aggregation job
analyticsQueue.process(async (job) => {
  console.log('Processing analytics job:', job.id);
  
  try {
    // Get the date to process (default to yesterday in GMT)
    const processDate = job.data.date 
      ? new Date(job.data.date)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

    // Set to start of day in GMT
    const startOfDay = new Date(processDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(processDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Get all articles
    const articles = await prisma.article.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    // Aggregate reads for each article
    for (const article of articles) {
      const readCount = await prisma.readLog.count({
        where: {
          articleId: article.id,
          readAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (readCount > 0) {
        // Upsert into DailyAnalytics
        await prisma.dailyAnalytics.upsert({
          where: {
            articleId_date: {
              articleId: article.id,
              date: startOfDay,
            },
          },
          update: {
            viewCount: readCount,
          },
          create: {
            articleId: article.id,
            viewCount: readCount,
            date: startOfDay,
          },
        });
      }
    }

    console.log('Analytics job completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Analytics job failed:', error);
    throw error;
  }
});

// Schedule daily job at midnight GMT
analyticsQueue.add(
  {},
  {
    repeat: {
      pattern: '0 0 * * *', // Cron pattern: every day at midnight
      tz: 'GMT',
    },
  }
);

export default analyticsQueue;
