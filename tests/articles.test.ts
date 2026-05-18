import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

// Mock Prisma
jest.mock('../src/config/database');

describe('Article Endpoints', () => {
  let authToken: string;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock JWT token (in real tests, you'd use a test JWT secret)
    authToken = 'Bearer mock-jwt-token';
  });

  describe('GET /articles', () => {
    it('should return published articles', async () => {
      const mockArticles = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Article',
          content: 'Test content',
          category: 'Tech',
          status: 'PUBLISHED',
          deletedAt: null,
          createdAt: new Date(),
          author: { id: 'author-id', name: 'John Doe' },
        },
      ];

      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (prisma.article.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get('/articles');

      expect(response.status).toBe(200);
      expect(response.body.Success).toBe(true);
      expect(Array.isArray(response.body.Object)).toBe(true);
    });

    it('should filter by category', async () => {
      const mockArticles = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Tech Article',
          content: 'Test content',
          category: 'Tech',
          status: 'PUBLISHED',
          deletedAt: null,
          createdAt: new Date(),
          author: { id: 'author-id', name: 'John Doe' },
        },
      ];

      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (prisma.article.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get('/articles?category=Tech');

      expect(response.status).toBe(200);
      expect(response.body.Success).toBe(true);
    });
  });

  describe('POST /articles', () => {
    it('should create an article for authenticated author', async () => {
      const mockArticle = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'New Article',
        content: 'This is a test article with enough content to meet the minimum requirement.',
        category: 'Tech',
        status: 'DRAFT',
        authorId: 'author-id',
        createdAt: new Date(),
        deletedAt: null,
      };

      (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

      const response = await request(app)
        .post('/articles')
        .set('Authorization', authToken)
        .send({
          title: 'New Article',
          content: 'This is a test article with enough content to meet the minimum requirement.',
          category: 'Tech',
          status: 'DRAFT',
        });

      expect(response.status).toBe(201);
      expect(response.body.Success).toBe(true);
      expect(response.body.Object.title).toBe('New Article');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/articles').send({
        title: 'New Article',
        content: 'Test content',
        category: 'Tech',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /articles/:id', () => {
    it('should return article details', async () => {
      const mockArticle = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Article',
        content: 'Test content',
        category: 'Tech',
        status: 'PUBLISHED',
        deletedAt: null,
        createdAt: new Date(),
        author: { id: 'author-id', name: 'John Doe' },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.readLog.create as jest.Mock).mockResolvedValue({});

      const response = await request(app).get('/articles/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(200);
      expect(response.body.Success).toBe(true);
      expect(response.body.Object.title).toBe('Test Article');
    });

    it('should return 404 for deleted article', async () => {
      const mockArticle = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Article',
        deletedAt: new Date(),
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);

      const response = await request(app).get('/articles/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(404);
      expect(response.body.Message).toBe('News article no longer available');
    });
  });

  describe('DELETE /articles/:id', () => {
    it('should soft delete article for author', async () => {
      const mockArticle = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Article',
        authorId: 'author-id',
        deletedAt: null,
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.article.update as jest.Mock).mockResolvedValue({
        ...mockArticle,
        deletedAt: new Date(),
      });

      const response = await request(app)
        .delete('/articles/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.Success).toBe(true);
    });

    it('should return 403 when trying to delete another author\'s article', async () => {
      const mockArticle = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Article',
        authorId: 'different-author-id',
        deletedAt: null,
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);

      const response = await request(app)
        .delete('/articles/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', authToken);

      expect(response.status).toBe(403);
      expect(response.body.Message).toBe('Forbidden');
    });
  });
});
