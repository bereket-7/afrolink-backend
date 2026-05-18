import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import * as authUtils from '../src/utils/auth';

const app = createApp();

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/signup', () => {
    it('should create a new user as READER by default', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'READER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/signup')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          role: 'AUTHOR',
        });

      expect(response.status).toBe(201);
      expect(response.body.Success).toBe(true);
      expect(response.body.Object.user.role).toBe('READER');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'READER' }),
        })
      );
    });

    it('should return 409 if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'john@example.com',
      });

      const response = await request(app)
        .post('/auth/signup')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(409);
      expect(response.body.Success).toBe(false);
    });

    it('should return 400 for invalid password', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.Success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed',
        role: 'AUTHOR',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(authUtils, 'comparePassword').mockResolvedValue(true);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.Success).toBe(true);
      expect(response.body.Object.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.Success).toBe(false);
    });
  });
});
