import { Request, Response } from 'express';
import prisma from '../config/database';
import { PaginationInput } from '../utils/validation';
import { PaginatedResponse, JwtPayload } from '../types';
import { asyncHandler } from '../utils/asyncHandler';

export const getAuthorDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as JwtPayload;
  const { pageNumber, pageSize } = req.query as unknown as PaginationInput;

  const skip = (pageNumber - 1) * pageSize;

  const articles = await prisma.article.findMany({
    where: {
      authorId: user.sub,
      deletedAt: null,
    },
    skip,
    take: pageSize,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      dailyAnalytics: {
        select: {
          viewCount: true,
        },
      },
    },
  });

  const articlesWithViews = articles.map((article) => ({
    id: article.id,
    title: article.title,
    createdAt: article.createdAt,
    totalViews: article.dailyAnalytics.reduce((sum, analytics) => sum + analytics.viewCount, 0),
  }));

  const totalSize = await prisma.article.count({
    where: {
      authorId: user.sub,
      deletedAt: null,
    },
  });

  res.status(200).json({
    Success: true,
    Message: 'Dashboard data retrieved successfully',
    Object: articlesWithViews,
    PageNumber: pageNumber,
    PageSize: pageSize,
    TotalSize: totalSize,
    Errors: null,
  } as PaginatedResponse);
});
