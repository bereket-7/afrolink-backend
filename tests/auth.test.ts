import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

// Mock Prisma
jest.mock('../src/config/database');

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/signup', () => {
    it('should create a new user successfully', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'AUTHOR',
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
      expect(response.body.Object.user).toEqual(mockUser);
      expect(response.body.Object.token).toBeDefined();
    });

    it('should return 409 if email already exists', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'john@example.com',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/signup')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          role: 'AUTHOR',
        });

      expect(response.status).toBe(409);
      expect(response.body.Success).toBe(false);
      expect(response.body.Errors).toContain('Email already registered');
    });

    it('should return 400 for invalid password', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'weak',
          role: 'AUTHOR',
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
        password: '$2b$10$hashedpassword',
        role: 'AUTHOR',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

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
      expect(response.body.Errors).toContain('Invalid credentials');
    });
  });
});
