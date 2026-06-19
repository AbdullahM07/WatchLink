import { Router } from 'express';
import { updateProfileSchema } from '@watchlink/shared';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { getMe, updateMe } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);
router.get('/me', getMe);
router.patch('/me', validate(updateProfileSchema), updateMe);

export default router;
