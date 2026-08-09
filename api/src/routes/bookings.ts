import { Router } from 'express';

import * as bookingsController from '../controllers/bookings.js';
import { authGuard } from '../middleware/auth-guard.js';
import { requireVerifiedEmail } from '../middleware/require-verified-email.js';
import { validate } from '../middleware/validate.js';
import { createBookingSchema, createSeriesSchema, myBookingsQuerySchema } from '../schemas/booking.js';
import { idParamSchema } from '../schemas/common.js';

export const bookingsRouter = Router();

bookingsRouter.use(authGuard);

bookingsRouter.get('/my/current', bookingsController.currentMine);

bookingsRouter.get('/my/end-reminder', bookingsController.endReminderMine);

bookingsRouter.get('/my/series', bookingsController.listMySeries);

bookingsRouter.get('/my', validate({ query: myBookingsQuerySchema }), bookingsController.listMine);

bookingsRouter.post(
  '/',
  requireVerifiedEmail,
  validate({ body: createBookingSchema }),
  bookingsController.create,
);

bookingsRouter.post(
  '/series',
  requireVerifiedEmail,
  validate({ body: createSeriesSchema }),
  bookingsController.createSeries,
);

bookingsRouter.delete(
  '/series/:id',
  validate({ params: idParamSchema }),
  bookingsController.cancelSeries,
);

bookingsRouter.delete('/:id', validate({ params: idParamSchema }), bookingsController.cancel);
