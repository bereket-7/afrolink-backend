import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { SignupInput, LoginInput } from '../utils/validation';
import { ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../utils/asyncHandler';

export const signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role }: SignupInput = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Generate token
    const token = generateToken({
      sub: user.id,
      role: user.role,
    });

    res.status(201).json({
      Success: true,
      Message: 'User created successfully',
      Object: {
        user,
        token,
      },
      Errors: null,
    } as ApiResponse);
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password }: LoginInput = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken({
      sub: user.id,
      role: user.role,
    });

    res.status(200).json({
      Success: true,
      Message: 'Login successful',
      Object: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
      Errors: null,
    } as ApiResponse);
});
