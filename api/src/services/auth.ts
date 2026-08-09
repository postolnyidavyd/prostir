import { randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';

import { env } from '../config/env.js';
import { prisma } from '../db/client.js';
import { isUniqueViolation } from '../db/errors.js';
import { AppError, ValidationError } from '../lib/errors.js';
import { hashToken } from '../lib/tokens.js';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../schemas/auth.js';
import {
  createRefreshSession,
  issueAccessToken,
  rotateRefreshSession,
  revokeAllSessions,
  revokeSessionsByToken,
  type SessionMeta,
} from './tokens.js';

const BCRYPT_ROUNDS = 12;
const VERIFY_TOKEN_BYTES = 32;

const publicUser = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  emailVerifiedAt: true,
} as const;

type PublicUserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerifiedAt: Date | null;
};

export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
};

// назовні віддаємо булеве emailVerified
function toPublicUser(row: PublicUserRow): PublicUser {
  const { emailVerifiedAt, ...rest } = row;
  return { ...rest, emailVerified: emailVerifiedAt !== null };
}

// замість SMTP кладемо посилання підтвердження в лог сервера
function logVerificationLink(email: string, token: string): void {
  if (env.NODE_ENV === 'test') return;
  console.log(`Підтвердження email для ${email}: ${env.WEB_ORIGIN}/verify-email?token=${token}`);
}

export type Session = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export async function register(input: RegisterInput, meta: SessionMeta): Promise<Session> {
  const verifyToken = randomBytes(VERIFY_TOKEN_BYTES).toString('hex');

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
        firstName: input.firstName,
        lastName: input.lastName,
        emailVerifyTokenHash: hashToken(verifyToken),
      },
      select: publicUser,
    });

    logVerificationLink(user.email, verifyToken);

    return {
      user: toPublicUser(user),
      accessToken: issueAccessToken(user.id),
      refreshToken: await createRefreshSession(user.id, meta),
    };
  } catch (error) {
    // унікальність email лишається за базою, окрема перевірка не працює при  race condition
    if (isUniqueViolation(error)) {
      throw new AppError(409, 'Користувач з таким email уже існує');
    }

    throw error;
  }
}

export async function login(input: LoginInput, meta: SessionMeta): Promise<Session> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, 'Невірний email або пароль');
  }

  return {
    user: toPublicUser(user),
    accessToken: issueAccessToken(user.id),
    refreshToken: await createRefreshSession(user.id, meta),
  };
}

// підтвердження за одноразовим токеном з листа
// чистимо хеш, щоб посилання не спрацювало двічі
export async function verifyEmail(token: string): Promise<void> {
  const verified = await prisma.user.updateMany({
    where: { emailVerifyTokenHash: hashToken(token) },
    data: { emailVerifiedAt: new Date(), emailVerifyTokenHash: null },
  });

  if (verified.count === 0) {
    throw new AppError(400, 'Недійсне або вже використане посилання підтвердження');
  }
}

export async function refresh(
  token: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const rotated = await rotateRefreshSession(token);

  return {
    accessToken: issueAccessToken(rotated.userId),
    refreshToken: rotated.token,
  };
}

export async function logout(token: string | undefined): Promise<void> {
  if (token) {
    await revokeSessionsByToken(token);
  }
}

export async function getUser(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });

  if (!user) {
    throw new AppError(401, 'Сесія недійсна');
  }

  return toPublicUser(user);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<PublicUser> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { email: input.email, firstName: input.firstName, lastName: input.lastName },
      select: publicUser,
    });

    return toPublicUser(user);
  } catch (error) {
    // зайнятий email показуємо інлайн під полем
    if (isUniqueViolation(error)) {
      throw new ValidationError({ email: ['Цей email уже зайнятий'] });
    }

    throw error;
  }
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
  meta: SessionMeta,
): Promise<{ accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throw new AppError(401, 'Сесія недійсна');
  }

  if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    throw new ValidationError({ currentPassword: ['Поточний пароль невірний'] });
  }

  if (await bcrypt.compare(input.newPassword, user.passwordHash)) {
    throw new ValidationError({ newPassword: ['Новий пароль має відрізнятися від поточного'] });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS) },
  });

  // зміна пароля розлоговує всі пристрої, поточному видаємо свіжу сесію
  await revokeAllSessions(userId);

  return {
    accessToken: issueAccessToken(userId),
    refreshToken: await createRefreshSession(userId, meta),
  };
}
