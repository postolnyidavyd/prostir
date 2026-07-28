import { randomBytes } from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { prisma } from '../db/client.js';
import { AppError } from '../lib/errors.js';
import { expiresAt } from '../lib/time.js';
import { hashRefreshToken } from '../lib/tokens.js';

export type SessionMeta = {
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
};

const REFRESH_TOKEN_BYTES = 32;

export function issueAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (typeof payload === 'string' || !payload.sub) {
      throw new AppError(401, 'Некоректний токен');
    }

    return payload.sub;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Термін дії токена минув');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, 'Некоректний токен');
    }

    throw error;
  }
}

export function refreshTokenExpiresAt(now: Date): Date {
  return expiresAt(now, env.REFRESH_TOKEN_EXPIRES_IN);
}

export async function createRefreshSession(userId: string, meta: SessionMeta): Promise<string> {
  const token = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(token),
      expiresAt: refreshTokenExpiresAt(new Date()),
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  return token;
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function rotateRefreshSession(
  token: string,
): Promise<{ userId: string; token: string }> {
  const tokenHash = hashRefreshToken(token);
  const session = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  // токена немає серед активних - можливо це вже використана копія, тобто крадіжка
  if (!session) {
    const stolen = await prisma.refreshToken.findFirst({ where: { previousTokenHash: tokenHash } });

    if (stolen) {
      await revokeAllSessions(stolen.userId);
    }

    throw new AppError(401, 'Сесія недійсна');
  }

  if (session.revokedAt || session.expiresAt <= new Date()) {
    throw new AppError(401, 'Сесія недійсна');
  }

  const nextToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');

  // умова на tokenHash робить цю ротанцію атомарною
  const rotated = await prisma.refreshToken.updateMany({
    where: { id: session.id, tokenHash },
    data: { tokenHash: hashRefreshToken(nextToken), previousTokenHash: tokenHash },
  });

  if (rotated.count === 0) {
    throw new AppError(401, 'Сесія недійсна');
  }

  return { userId: session.userId, token: nextToken };
}

export async function revokeSessionsByToken(token: string): Promise<void> {
  const session = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(token) },
    select: { userId: true },
  });

  if (session) {
    await revokeAllSessions(session.userId);
  }
}
