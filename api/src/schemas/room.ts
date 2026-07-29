import { z } from 'zod';

import { emptyToUndefined } from './common.js';

export const roomFilterSchema = z.object({
  floor: z.preprocess(emptyToUndefined, z.coerce.number().int('Поверх має бути цілим').optional()),
  minCapacity: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive('Місткість має бути додатною').optional(),
  ),
});

export type RoomFilter = z.infer<typeof roomFilterSchema>;
