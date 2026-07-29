import type { RequestHandler } from 'express';

import { requireUserId } from '../middleware/auth-guard.js';
import type { BookingRange, CreateBookingInput, MyBookingsQuery } from '../schemas/booking.js';
import type { IdParam } from '../schemas/common.js';
import * as bookingsService from '../services/bookings.js';

export const listByRoom: RequestHandler<IdParam, unknown, unknown, BookingRange> = async (
  req,
  res,
) => {
  res.json({ bookings: await bookingsService.listRoomBookings(req.params.id, req.query) });
};

export const listMine: RequestHandler<unknown, unknown, unknown, MyBookingsQuery> = async (
  req,
  res,
) => {
  res.json(await bookingsService.listMyBookings(requireUserId(req), req.query));
};

export const create: RequestHandler<unknown, unknown, CreateBookingInput> = async (req, res) => {
  const booking = await bookingsService.createBooking(requireUserId(req), req.body);

  res.status(201).json({ booking });
};

export const cancel: RequestHandler<IdParam> = async (req, res) => {
  await bookingsService.cancelBooking(requireUserId(req), req.params.id);

  res.status(204).end();
};
