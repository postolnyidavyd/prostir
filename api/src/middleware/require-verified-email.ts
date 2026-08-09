import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../db/client.js';
import { AppError } from '../lib/errors.js';
import { requireUserId } from './auth-guard.js';

// бронювати можна лише з підтвердженим email
export async function requireVerifiedEmail(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: requireUserId(req) },
    select: { emailVerifiedAt: true },
  });

  if (!user) {
    throw new AppError(401, 'Сесія недійсна');
  }

  if (!user.emailVerifiedAt) {
    throw new AppError(403, 'Підтвердьте email, щоб бронювати');
  }

  next();
}
