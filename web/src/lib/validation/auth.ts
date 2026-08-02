import { z } from 'zod';

// те саме що і на беку

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Некоректний email').max(255, 'Email задовгий'));

const name = (field: string) =>
  z.string().trim().min(1, `${field} не може бути порожнім`).max(50, 'Максимум 50 символів');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Введіть пароль'),
});

export const registerSchema = z.object({
  firstName: name("Ім'я"),
  lastName: name('Прізвище'),
  email,
  // 72 це межа bcrypt
  password: z
    .string()
    .min(8, 'Пароль має бути щонайменше 8 символів')
    .max(72, 'Пароль має бути щонайбільше 72 символи'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
