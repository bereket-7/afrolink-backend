import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { SignupInput, LoginInput } from '../utils/validation';
import { ApiResponse } from '../types';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role }: SignupInput = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        Success: false,
        Message: 'Conflict',
        Object: null,
        Errors: ['Email already registered'],
      } as ApiResponse);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
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
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      Success: false,
      Message: 'Internal server error',
      Object: null,
      Errors: ['Failed to create user'],
    } as ApiResponse);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginInput = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        Success: false,
        Message: 'Unauthorized',
        Object: null,
        Errors: ['Invalid credentials'],
      } as ApiResponse);
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({
        Success: false,
        Message: 'Unauthorized',
        Object: null,
        Errors: ['Invalid credentials'],
      } as ApiResponse);
      return;
    }

    // Generate token
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      Success: false,
      Message: 'Internal server error',
      Object: null,
      Errors: ['Failed to login'],
    } as ApiResponse);
  }
};
