import { Router } from 'express';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { createArticleSchema, updateArticleSchema, idParamSchema, paginationSchema, articleFilterSchema } from '../utils/validation';
import { authenticate, requireAuthor } from '../middleware/auth';
import { articleReadRateLimiter } from '../middleware/rateLimit';
import { createArticle, getMyArticles, updateArticle, deleteArticle, getPublicArticles, getArticleById } from '../controllers/articleController';

const router = Router();

// Public feed
router.get('/', validateQuery(paginationSchema), validateQuery(articleFilterSchema), getPublicArticles);

// Article detail (with read tracking and rate limiting)
router.get('/:id', validateParams(idParamSchema), articleReadRateLimiter, getArticleById);

// Author-only routes
router.post('/', authenticate, requireAuthor, validate(createArticleSchema), createArticle);
router.get('/me', authenticate, requireAuthor, validateQuery(paginationSchema), getMyArticles);
router.put('/:id', authenticate, requireAuthor, validateParams(idParamSchema), validate(updateArticleSchema), updateArticle);
router.delete('/:id', authenticate, requireAuthor, validateParams(idParamSchema), deleteArticle);

export default router;
