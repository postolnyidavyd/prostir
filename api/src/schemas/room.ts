import { z } from 'zod';

import { emptyToUndefined } from './common.js';

const optionalUtcDateTime = z.preprocess(
  emptyToUndefined,
  z.iso
    .datetime('Очікується дата в ISO з Z')
    .transform((value) => new Date(value))
    .optional(),
);

export const roomFilterSchema = z
  .object({
    floor: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive('Поверх має бути додатним').optional(),
    ),
    minCapacity: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive('Місткість має бути додатною').optional(),
    ),
    // вікно для перевірки доступності; from і to лише разом
    from: optionalUtcDateTime,
    to: optionalUtcDateTime,
    onlyFree: z.preprocess(emptyToUndefined, z.coerce.boolean().optional()),
  })
  .refine((f) => (f.from === undefined) === (f.to === undefined), {
    message: 'from і to задаються лише разом',
    path: ['to'],
  })
  .refine((f) => f.from === undefined || f.to === undefined || f.to > f.from, {
    message: 'Кінець вікна має бути пізніше за початок',
    path: ['to'],
  })
  .refine((f) => !f.onlyFree || f.from !== undefined, {
    message: 'onlyFree потребує from і to',
    path: ['onlyFree'],
  });

export type RoomFilter = z.infer<typeof roomFilterSchema>;
