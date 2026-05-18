import { Request, Response } from 'express';
import prisma from '../config/database';
import { CreateArticleInput, UpdateArticleInput, PaginationInput, ArticleFilterInput } from '../utils/validation';
import { ApiResponse, PaginatedResponse, JwtPayload } from '../types';

export const createArticle = async (req: Request, res: Response): Promise<void> => {
  try {
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
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      Success: false,
      Message: 'Internal server error',
      Object: null,
      Errors: ['Failed to create article'],
    } as ApiResponse);
  }
};

export const getMyArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as JwtPayload;
    const { pageNumber = 1, pageSize = 10 }: PaginationInput = req.query as any;
    const includeDeleted = req.query.includeDeleted === 'true';

    const skip = (pageNumber - 1) * pageSize;

    const whereClause: any = {
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
  } catch (error) {
    console.error('Get my articles error:', error);
    res.status(500).json({
      Success: false,
      Message: 'Internal server error',
      Object: null,
      Errors: ['Failed to retrieve articles'],
    } as ApiResponse);
  }
};

export const updateArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as JwtPayload;
    const { id } = req.params;
    const updateData: UpdateArticleInput = req.body;

    // Check if article exists and belongs to user
    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      res.status(404).json({
        Success: false,
        Message: 'Not found',
        Object: null,
        Errors: ['Article not found'],
      } as ApiResponse);
      return;
    }

    if (article.authorId !== user.sub) {
      res.status(403).json({
        Success: false,
        Message: 'Forbidden',
        Object: null,
        Errors: ['You can only edit your own articles'],
      } as ApiResponse);
      return;
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
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      Success: false,
      Message: 'Internal server error',
      Object: null,
      Errors: ['Failed to update article'],
    } as ApiResponse);
  }
};

export const deleteArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as JwtPayload;
    const { id } = req.params;

    // Check if article exists and belongs to user
    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      res.status(404).json({
        Success: false,
        Message: 'Not found',
        Object: null,
        Errors: ['Article not found'],
      } as ApiResponse);
      return;
    }

    if (article.authorId !== user.sub) {
      res.status(403).json({
        Success: false,
        Message: 'Forbidden',
        Object: null,
        Errors: ['You can only delete your own articles'],
      } as ApiResponse);
      return;
    }

    // Soft delete
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
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      Success: false,
      Message: 'Internal server error',
      Object: null,
      Errors: ['Failed to delete article'],
    } as ApiResponse);
  }
};

export const getPublicArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageNumber = 1, pageSize = 10 }: PaginationInput = req.query as any;
    const { category, author, q }: ArticleFilterInput = req.query as any;

    const skip = (pageNumber - 1) * pageSize;

    const whereClause: any = {
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
  } catch (error) {
    console.error('Get public articles error:', error);
    res.status(500).json({
      Success: false,
      Message: 'Internal server error',
      Object: null,
      Errors: ['Failed to retrieve articles'],
    } as ApiResponse);
  }
};

export const getArticleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload | undefined;

    // Check if article exists and is not deleted
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

    if (!article || article.deletedAt !== null) {
      res.status(404).json({
        Success: false,
        Message: 'News article no longer available',
        Object: null,
        Errors: null,
      } as ApiResponse);
      return;
    }

    // Create read log asynchronously (non-blocking)
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
        console.error('Failed to create read log:', error);
      }
    });

    res.status(200).json({
      Success: true,
      Message: 'Article retrieved successfully',
      Object: article,
      Errors: null,
    } as ApiResponse);
  } catch (error) {
    console.error('Get article by id error:', error);
    res.status(500).json({
      Success: false,
      Message: 'Internal server error',
      Object: null,
      Errors: ['Failed to retrieve article'],
    } as ApiResponse);
  }
};
