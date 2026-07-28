import type { CookieOptions, Request, RequestHandler, Response } from 'express';

import { env } from '../config/env.js';
import { requireUserId } from '../middleware/auth-guard.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.js';
import * as authService from '../services/auth.js';
import { refreshTokenExpiresAt, type SessionMeta } from '../services/tokens.js';

const REFRESH_COOKIE = 'refreshToken';

// path=/auth - браузер шле cookie лише на шляхи з цим префіксом,
function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.NODE_ENV === 'production',
    path: '/auth',
    expires: refreshTokenExpiresAt(new Date()),
  };
}

function sessionMeta(req: Request<unknown, unknown, unknown>): SessionMeta {
  return { ipAddress: req.ip, userAgent: req.get('user-agent') };
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, cookieOptions());
}

export const register: RequestHandler<unknown, unknown, RegisterInput> = async (req, res) => {
  const session = await authService.register(req.body, sessionMeta(req));

  setRefreshCookie(res, session.refreshToken);
  res.status(201).json({ accessToken: session.accessToken, user: session.user });
};

export const login: RequestHandler<unknown, unknown, LoginInput> = async (req, res) => {
  const session = await authService.login(req.body, sessionMeta(req));

  setRefreshCookie(res, session.refreshToken);
  res.json({ accessToken: session.accessToken, user: session.user });
};

export const refresh: RequestHandler = async (req, res) => {
  const rotated = await authService.refresh(req.cookies[REFRESH_COOKIE] ?? '');

  setRefreshCookie(res, rotated.refreshToken);
  res.json({ accessToken: rotated.accessToken });
};

export const logout: RequestHandler = async (req, res) => {
  await authService.logout(req.cookies[REFRESH_COOKIE]);

  res.clearCookie(REFRESH_COOKIE, cookieOptions());
  res.status(204).end();
};

export const me: RequestHandler = async (req, res) => {
  res.json({ user: await authService.getUser(requireUserId(req)) });
};
