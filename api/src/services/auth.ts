import bcrypt from 'bcryptjs';

import { prisma } from '../db/client.js';
import { isUniqueViolation } from '../db/errors.js';
import { AppError } from '../lib/errors.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.js';
import {
  createRefreshSession,
  issueAccessToken,
  rotateRefreshSession,
  revokeSessionsByToken,
  type SessionMeta,
} from './tokens.js';

const BCRYPT_ROUNDS = 12;

const publicUser = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
} as const;

export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type Session = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export async function register(input: RegisterInput, meta: SessionMeta): Promise<Session> {
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
        firstName: input.firstName,
        lastName: input.lastName,
      },
      select: publicUser,
    });

    return {
      user,
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
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    accessToken: issueAccessToken(user.id),
    refreshToken: await createRefreshSession(user.id, meta),
  };
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

  return user;
}
