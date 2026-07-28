import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { router } from './routes/index.js';

export const app = express();

app.disable('x-powered-by');

const isProduction = env.NODE_ENV === 'production';

if (env.NODE_ENV !== 'test') {
  app.use(
    morgan(isProduction ? 'combined' : 'dev', {
      skip: (req) => isProduction && req.url === '/health',
    }),
  );
}

app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use(router);

app.use(notFound);
app.use(errorHandler);
