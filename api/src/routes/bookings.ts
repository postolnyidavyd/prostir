import { Router } from 'express';

import * as bookingsController from '../controllers/bookings.js';
import { authGuard } from '../middleware/auth-guard.js';
import { validate } from '../middleware/validate.js';
import { createBookingSchema, myBookingsQuerySchema } from '../schemas/booking.js';
import { idParamSchema } from '../schemas/common.js';

export const bookingsRouter = Router();

bookingsRouter.use(authGuard);

bookingsRouter.get('/my', validate({ query: myBookingsQuerySchema }), bookingsController.listMine);

bookingsRouter.post('/', validate({ body: createBookingSchema }), bookingsController.create);

bookingsRouter.delete('/:id', validate({ params: idParamSchema }), bookingsController.cancel);
