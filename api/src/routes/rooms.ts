import { Router } from 'express';

import * as bookingsController from '../controllers/bookings.js';
import * as roomsController from '../controllers/rooms.js';
import { authGuard } from '../middleware/auth-guard.js';
import { validate } from '../middleware/validate.js';
import { bookingRangeSchema } from '../schemas/booking.js';
import { idParamSchema } from '../schemas/common.js';
import { roomFilterSchema } from '../schemas/room.js';

export const roomsRouter = Router();

roomsRouter.use(authGuard);

roomsRouter.get('/', validate({ query: roomFilterSchema }), roomsController.list);

roomsRouter.get(
  '/:id/bookings',
  validate({ params: idParamSchema, query: bookingRangeSchema }),
  bookingsController.listByRoom,
);
