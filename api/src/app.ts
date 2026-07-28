import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';

import { env } from './config/env.js';

export const app = express();

app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ message: 'Внутрішня помилка сервера' });
});
