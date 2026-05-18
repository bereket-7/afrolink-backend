import { Router } from 'express';
import { validate } from '../middleware/validation';
import { signupSchema, loginSchema } from '../utils/validation';
import { signup, login } from '../controllers/authController';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);

export default router;
