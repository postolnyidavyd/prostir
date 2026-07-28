import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';
import morgan from 'morgan';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';

export const app = express();

app.disable('x-powered-by');

const isProduction = env.NODE_ENV === 'production';

app.use(
  morgan(isProduction ? 'combined' : 'dev', {
    skip: (req) => isProduction && req.url === '/health',
  }),
);

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

app.use(notFound);
app.use(errorHandler);
