import { Router } from 'express';
import { validateQuery } from '../middleware/validation';
import { paginationSchema } from '../utils/validation';
import { authenticate, requireAuthor } from '../middleware/auth';
import { getAuthorDashboard } from '../controllers/authorController';

const router = Router();

router.get('/dashboard', authenticate, requireAuthor, validateQuery(paginationSchema), getAuthorDashboard);

export default router;
