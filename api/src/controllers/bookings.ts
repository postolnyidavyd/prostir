import type { RequestHandler } from 'express';

import { env } from '../config/env.js';
import { requireUserId } from '../middleware/auth-guard.js';
import type {
  BookingRange,
  CreateBookingInput,
  CreateSeriesInput,
  MyBookingsQuery,
} from '../schemas/booking.js';
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

export const currentMine: RequestHandler = async (req, res) => {
  res.json({ booking: await bookingsService.getCurrentBooking(requireUserId(req)) });
};

export const endReminderMine: RequestHandler = async (req, res) => {
  const reminder = await bookingsService.getEndReminder(
    requireUserId(req),
    env.NOTIFY_BEFORE_MINUTES,
    new Date(),
  );

  res.json({ reminder });
};

export const create: RequestHandler<unknown, unknown, CreateBookingInput> = async (req, res) => {
  const booking = await bookingsService.createBooking(requireUserId(req), req.body);

  res.status(201).json({ booking });
};

export const listMySeries: RequestHandler = async (req, res) => {
  res.json({ series: await bookingsService.listMySeries(requireUserId(req)) });
};

export const createSeries: RequestHandler<unknown, unknown, CreateSeriesInput> = async (
  req,
  res,
) => {
  const result = await bookingsService.createSeries(requireUserId(req), req.body);

  res.status(201).json(result);
};

export const cancelSeries: RequestHandler<IdParam> = async (req, res) => {
  const canceled = await bookingsService.cancelSeries(requireUserId(req), req.params.id);

  res.json({ canceled });
};

export const cancel: RequestHandler<IdParam> = async (req, res) => {
  await bookingsService.cancelBooking(requireUserId(req), req.params.id);

  res.status(204).end();
};
