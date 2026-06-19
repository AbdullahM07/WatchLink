import { Router } from 'express';
import { createRoomSchema, joinRoomSchema, updateRoomSchema } from '@watchlink/shared';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { checkJoin, create, getOne, mine, patch, remove } from '../controllers/room.controller';

const router = Router();

router.post('/', authenticate, validate(createRoomSchema), create);
router.get('/mine', authenticate, mine);

// Guests may inspect/join a room, so these are not auth-gated.
router.get('/:roomCode', getOne);
router.post('/:roomCode/join', validate(joinRoomSchema), checkJoin);

router.patch('/:roomCode', authenticate, validate(updateRoomSchema), patch);
router.delete('/:roomCode', authenticate, remove);

export default router;
