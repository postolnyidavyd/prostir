import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.uuid('Некоректний ідентифікатор'),
});

// порожній параметр означає що фільтр не заданий
export const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

export type IdParam = z.infer<typeof idParamSchema>;
