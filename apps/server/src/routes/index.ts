import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import roomRoutes from './room.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'WatchLink API is healthy', data: { uptime: process.uptime() } });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rooms', roomRoutes);

export default router;
