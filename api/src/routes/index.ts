import { Router } from 'express';

import { authRouter } from './auth.js';
import { bookingsRouter } from './bookings.js';
import { roomsRouter } from './rooms.js';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRouter);
router.use('/rooms', roomsRouter);
router.use('/bookings', bookingsRouter);
