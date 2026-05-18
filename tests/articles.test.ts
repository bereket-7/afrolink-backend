import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import prisma from '../src/config/database';

jest.mock('../src/config/database');

const app = createApp();

const authorId = '123e4567-e89b-12d3-a456-426614174001';
const articleId = '123e4567-e89b-12d3-a456-426614174000';

const authorToken = `Bearer ${jwt.sign(
  { sub: authorId, role: 'AUTHOR' },
  process.env.JWT_SECRET!
)}`;

describe('Article Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /articles', () => {
    it('should return published articles', async () => {
      const mockArticles = [
        {
          id: articleId,
          title: 'Test Article',
          content: 'Test content',
          category: 'Tech',
          status: 'PUBLISHED',
          deletedAt: null,
          createdAt: new Date(),
          author: { id: authorId, name: 'John Doe' },
        },
      ];

      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (prisma.article.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get('/articles');

      expect(response.status).toBe(200);
      expect(response.body.Success).toBe(true);
      expect(Array.isArray(response.body.Object)).toBe(true);
    });
  });

  describe('GET /articles/me', () => {
    it('should return author articles without matching /:id', async () => {
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.article.count as jest.Mock).mockResolvedValue(0);

      const response = await request(app)
        .get('/articles/me')
        .set('Authorization', authorToken);

      expect(response.status).toBe(200);
      expect(response.body.Success).toBe(true);
    });
  });

  describe('POST /articles', () => {
    it('should create an article with default DRAFT status', async () => {
      const mockArticle = {
        id: articleId,
        title: 'New Article',
        content: 'This is a test article with enough content to meet the minimum requirement.',
        category: 'Tech',
        status: 'DRAFT',
        authorId,
        createdAt: new Date(),
        deletedAt: null,
      };

      (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

      const response = await request(app)
        .post('/articles')
        .set('Authorization', authorToken)
        .send({
          title: 'New Article',
          content: 'This is a test article with enough content to meet the minimum requirement.',
          category: 'Tech',
        });

      expect(response.status).toBe(201);
      expect(prisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'DRAFT' }),
        })
      );
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/articles').send({
        title: 'New Article',
        content: 'This is a test article with enough content to meet the minimum requirement.',
        category: 'Tech',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /articles/:id', () => {
    it('should return published article details', async () => {
      const mockArticle = {
        id: articleId,
        title: 'Test Article',
        content: 'Test content',
        category: 'Tech',
        status: 'PUBLISHED',
        authorId,
        deletedAt: null,
        createdAt: new Date(),
        author: { id: authorId, name: 'John Doe' },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.readLog.create as jest.Mock).mockResolvedValue({});

      const response = await request(app).get(`/articles/${articleId}`);

      expect(response.status).toBe(200);
      expect(response.body.Object.title).toBe('Test Article');
    });

    it('should return 404 for draft article when anonymous', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({
        id: articleId,
        title: 'Draft',
        status: 'DRAFT',
        authorId,
        deletedAt: null,
        author: { id: authorId, name: 'John Doe' },
      });

      const response = await request(app).get(`/articles/${articleId}`);

      expect(response.status).toBe(404);
    });

    it('should allow author to read own draft', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({
        id: articleId,
        title: 'Draft',
        content: 'content',
        status: 'DRAFT',
        authorId,
        deletedAt: null,
        author: { id: authorId, name: 'John Doe' },
      });
      (prisma.readLog.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .get(`/articles/${articleId}`)
        .set('Authorization', authorToken);

      expect(response.status).toBe(200);
    });

    it('should return 404 for deleted article', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({
        id: articleId,
        title: 'Test Article',
        status: 'PUBLISHED',
        authorId,
        deletedAt: new Date(),
        author: { id: authorId, name: 'John Doe' },
      });

      const response = await request(app).get(`/articles/${articleId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /articles/:id', () => {
    it('should soft delete article for author', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({
        id: articleId,
        title: 'Test Article',
        authorId,
        deletedAt: null,
      });
      (prisma.article.update as jest.Mock).mockResolvedValue({
        id: articleId,
        deletedAt: new Date(),
      });

      const response = await request(app)
        .delete(`/articles/${articleId}`)
        .set('Authorization', authorToken);

      expect(response.status).toBe(200);
    });

    it('should return 403 when deleting another author article', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({
        id: articleId,
        authorId: '123e4567-e89b-12d3-a456-426614174099',
        deletedAt: null,
      });

      const response = await request(app)
        .delete(`/articles/${articleId}`)
        .set('Authorization', authorToken);

      expect(response.status).toBe(403);
    });
  });
});
