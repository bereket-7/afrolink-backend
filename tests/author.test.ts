import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import prisma from '../src/config/database';

const app = createApp();

const authorId = '123e4567-e89b-12d3-a456-426614174001';
const authorToken = `Bearer ${jwt.sign(
  { sub: authorId, role: 'AUTHOR' },
  process.env.JWT_SECRET!
)}`;

describe('Author Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /author/dashboard', () => {
    it('should return dashboard for authenticated author', async () => {
      (prisma.article.findMany as jest.Mock).mockResolvedValue([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Article',
          createdAt: new Date(),
          dailyAnalytics: [{ viewCount: 10 }, { viewCount: 5 }],
        },
      ]);
      (prisma.article.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/author/dashboard')
        .set('Authorization', authorToken);

      expect(response.status).toBe(200);
      expect(response.body.Object[0].totalViews).toBe(15);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/author/dashboard');
      expect(response.status).toBe(401);
    });
  });
});
