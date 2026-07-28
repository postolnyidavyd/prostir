import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535),
  // z.url() вважає валідним localhost:5173 без протокол, додатковий захист
  WEB_ORIGIN: z
    .url({ protocol: /^https?$/ })
      //зрізаємо слеш вкінці
    .transform((origin) => origin.replace(/\/$/, '')),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'має починатися з postgresql://'),
  JWT_ACCESS_SECRET: z.string().min(32),
  // формат 15m, 24h, 7d
  JWT_ACCESS_EXPIRES_IN: z.string().regex(/^\d+(ms|s|m|h|d)$/),
  REFRESH_TOKEN_EXPIRES_IN: z.string().regex(/^\d+(ms|s|m|h|d)$/),
});

const parsed = envSchema.safeParse(process.env);

// не піднімаємо з фіговим конфігом
if (!parsed.success) {
  throw new Error(`Некоректні змінні оточення:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
