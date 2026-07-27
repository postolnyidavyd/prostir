import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().positive(),
  // z.url() вважає валідним localhost:5173 без протокол, додатковий захист
  WEB_ORIGIN: z
    .url({ protocol: /^https?$/ })
      //зрізаємо слеш вкінці
    .transform((origin) => origin.replace(/\/$/, '')),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

// не піднімаємо з фіговим конфігом
if (!parsed.success) {
  throw new Error(`Некоректні змінні оточення:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
