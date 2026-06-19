import { Router } from 'express';
import { loginSchema, registerSchema } from '@watchlink/shared';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { login, me, register } from '../controllers/auth.controller';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', authenticate, me);

export default router;
