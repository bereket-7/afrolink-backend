import { z } from 'zod';

// Password validation: At least 8 characters, one uppercase, one lowercase, one number, and one special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Email validation (standard email regex)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Name validation: Only alphabets and spaces allowed
const nameRegex = /^[A-Za-z\s]+$/;

export const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(nameRegex, 'Name must contain only alphabets and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .regex(
      passwordRegex,
      'Password must be at least 8 characters with one uppercase, one lowercase, one number, and one special character'
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const createArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(1, 'Title must be at least 1 character')
    .max(150, 'Title must be less than 150 characters'),
  content: z
    .string()
    .min(1, 'Content is required')
    .min(50, 'Content must be at least 50 characters'),
  category: z
    .string()
    .min(1, 'Category is required')
    .min(1, 'Category must be at least 1 character'),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

export const updateArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title must be at least 1 character')
    .max(150, 'Title must be less than 150 characters')
    .optional(),
  content: z
    .string()
    .min(50, 'Content must be at least 50 characters')
    .optional(),
  category: z.string().min(1, 'Category must be at least 1 character').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

export const paginationSchema = z.object({
  pageNumber: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export const articleFilterSchema = z.object({
  category: z.string().optional(),
  author: z.string().optional(),
  q: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ArticleFilterInput = z.infer<typeof articleFilterSchema>;
