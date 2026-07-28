import { z } from 'zod';


const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Некоректний email').max(255, 'Email задовгий'));

const name = (field: string) =>
  z.string().trim().min(1, `${field} не може бути порожнім`).max(50, 'Максимум 50 символів');

export const registerSchema = z.object({
  email,
  // 72 це межа bcrypt
  password: z
    .string()
    .min(8, 'Пароль має бути щонайменше 8 символів')
    .max(72, 'Пароль має бути щонайбільше 72 символи'),
  firstName: name("Ім'я"),
  lastName: name('Прізвище'),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Введіть пароль'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
