import { Request, Response } from 'express';
import prisma from '../config/database';
import { PaginationInput } from '../utils/validation';
import { PaginatedResponse, JwtPayload } from '../types';

export const getAuthorDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as JwtPayload;
    const { pageNumber = 1, pageSize = 10 }: PaginationInput = req.query as any;

    const skip = (pageNumber - 1) * pageSize;

    // Get author's articles (excluding soft-deleted)
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

    // Calculate total views for each article
    const articlesWithViews = articles.map((article) => ({
      id: article.id,
      title: article.title,
      createdAt: article.createdAt,
      totalViews: article.dailyAnalytics.reduce((sum, analytics) => sum + analytics.viewCount, 0),
    }));

    // Get total count
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
  } catch (error) {
    console.error('Get author dashboard error:', error);
    res.status(500).json({
      Success: false,
      Message: 'Internal server error',
      Object: null,
      Errors: ['Failed to retrieve dashboard data'],
    } as any);
  }
};
