import { z } from 'zod';

import { emptyToUndefined } from './common.js';

const MAX_RANGE_DAYS = 31;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const utcDateTime = z.iso
  .datetime('Очікується дата в ISO з Z')
  .transform((value) => new Date(value));

export const createBookingSchema = z.object({
  roomId: z.uuid('Некоректний ідентифікатор кімнати'),
  title: z.string().trim().min(1, 'Назва не може бути порожньою').max(100, 'Максимум 100 символів'),
  startsAt: utcDateTime,
  endsAt: utcDateTime,
});

export const bookingRangeSchema = z
  .object({
    from: utcDateTime,
    to: utcDateTime,
  })
  .refine((range) => range.to > range.from, {
    message: 'Кінець діапазону має бути пізніше за початок',
    path: ['to'],
  })

  .refine((range) => range.to.getTime() - range.from.getTime() <= MAX_RANGE_DAYS * 86_400_000, {
    message: `Діапазон не може перевищувати ${MAX_RANGE_DAYS} днів`,
    path: ['to'],
  });


export const myBookingsQuerySchema = z.object({
  scope: z.enum(['upcoming', 'past'], { error: 'scope має бути upcoming або past' }),
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  ),
  cursor: z.preprocess(emptyToUndefined, z.uuid('Некоректний курсор').optional()),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingRange = z.infer<typeof bookingRangeSchema>;
export type MyBookingsQuery = z.infer<typeof myBookingsQuerySchema>;
