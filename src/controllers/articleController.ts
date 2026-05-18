import { Request, Response } from 'express';
import prisma from '../config/database';
import { CreateArticleInput, UpdateArticleInput, PaginationInput, ArticleFilterInput } from '../utils/validation';
import { ApiResponse, PaginatedResponse, JwtPayload } from '../types';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../utils/asyncHandler';
import { canViewArticle } from '../utils/articleVisibility';
import logger from '../config/logger';

export const createArticle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as JwtPayload;
  const { title, content, category, status }: CreateArticleInput = req.body;

  const article = await prisma.article.create({
    data: {
      title,
      content,
      category,
      status,
      authorId: user.sub,
    },
  });

  res.status(201).json({
    Success: true,
    Message: 'Article created successfully',
    Object: article,
    Errors: null,
  } as ApiResponse);
});

export const getMyArticles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as JwtPayload;
  const { pageNumber, pageSize } = req.query as unknown as PaginationInput;
  const includeDeleted = req.query.includeDeleted === 'true';

  const skip = (pageNumber - 1) * pageSize;

  const whereClause: {
    authorId: string;
    deletedAt?: null;
  } = {
    authorId: user.sub,
  };

  if (!includeDeleted) {
    whereClause.deletedAt = null;
  }

  const [articles, totalSize] = await Promise.all([
    prisma.article.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.article.count({ where: whereClause }),
  ]);

  res.status(200).json({
    Success: true,
    Message: 'Articles retrieved successfully',
    Object: articles,
    PageNumber: pageNumber,
    PageSize: pageSize,
    TotalSize: totalSize,
    Errors: null,
  } as PaginatedResponse);
});

export const updateArticle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as JwtPayload;
  const { id } = req.params;
  const updateData: UpdateArticleInput = req.body;

  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    throw new AppError('Article not found', 404);
  }

  if (article.authorId !== user.sub) {
    throw new AppError('You can only edit your own articles', 403);
  }

  const updatedArticle = await prisma.article.update({
    where: { id },
    data: updateData,
  });

  res.status(200).json({
    Success: true,
    Message: 'Article updated successfully',
    Object: updatedArticle,
    Errors: null,
  } as ApiResponse);
});

export const deleteArticle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as JwtPayload;
  const { id } = req.params;

  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    throw new AppError('Article not found', 404);
  }

  if (article.authorId !== user.sub) {
    throw new AppError('You can only delete your own articles', 403);
  }

  await prisma.article.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.status(200).json({
    Success: true,
    Message: 'Article deleted successfully',
    Object: null,
    Errors: null,
  } as ApiResponse);
});

export const getPublicArticles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { pageNumber, pageSize } = req.query as unknown as PaginationInput;
  const { category, author, q } = req.query as unknown as ArticleFilterInput;

  const skip = (pageNumber - 1) * pageSize;

  const whereClause: {
    status: 'PUBLISHED';
    deletedAt: null;
    category?: string;
    author?: { name: { contains: string; mode: 'insensitive' } };
    title?: { contains: string; mode: 'insensitive' };
  } = {
    status: 'PUBLISHED',
    deletedAt: null,
  };

  if (category) {
    whereClause.category = category;
  }

  if (author) {
    whereClause.author = {
      name: {
        contains: author,
        mode: 'insensitive',
      },
    };
  }

  if (q) {
    whereClause.title = {
      contains: q,
      mode: 'insensitive',
    };
  }

  const [articles, totalSize] = await Promise.all([
    prisma.article.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.article.count({ where: whereClause }),
  ]);

  res.status(200).json({
    Success: true,
    Message: 'Articles retrieved successfully',
    Object: articles,
    PageNumber: pageNumber,
    PageSize: pageSize,
    TotalSize: totalSize,
    Errors: null,
  } as PaginatedResponse);
});

export const getArticleById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user as JwtPayload | undefined;

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!article || !canViewArticle(article, user)) {
    throw new AppError('News article no longer available', 404);
  }

  setImmediate(async () => {
    try {
      await prisma.readLog.create({
        data: {
          articleId: id,
          readerId: user?.sub || null,
          readAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to create read log:', error);
    }
  });

  res.status(200).json({
    Success: true,
    Message: 'Article retrieved successfully',
    Object: article,
    Errors: null,
  } as ApiResponse);
});
