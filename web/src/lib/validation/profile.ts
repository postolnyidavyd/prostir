import { z } from 'zod';

// те саме що і на беку

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Некоректний email').max(255, 'Email задовгий'));

const name = (field: string) =>
  z.string().trim().min(1, `${field} не може бути порожнім`).max(50, 'Максимум 50 символів');

export const updateProfileSchema = z.object({
  firstName: name("Ім'я"),
  lastName: name('Прізвище'),
  email,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Введіть поточний пароль'),
  // 72 це межа bcrypt
  newPassword: z
    .string()
    .min(8, 'Пароль має бути щонайменше 8 символів')
    .max(72, 'Пароль має бути щонайбільше 72 символи'),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
