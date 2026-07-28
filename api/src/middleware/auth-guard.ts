import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../lib/errors.js';
import { verifyAccessToken } from '../services/tokens.js';

const BEARER = 'Bearer ';

export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith(BEARER)) {
    throw new AppError(401, 'Потрібна автентифікація');
  }

  req.user = { id: verifyAccessToken(header.slice(BEARER.length)) };
  next();
}

// щоб контролери не писали req.user! на кожному запиті
export function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError(401, 'Потрібна автентифікація');
  }

  return req.user.id;
}
