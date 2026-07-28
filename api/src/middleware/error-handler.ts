import type { NextFunction, Request, Response } from 'express';

import { AppError, ValidationError } from '../lib/errors.js';

// express.json() кидає SyntaxError із власним полем типу, ловимо щоб не летіло в 500
function isJsonParseError(error: unknown): boolean {
  return error instanceof SyntaxError && (error as { type?: string }).type === 'entity.parse.failed';
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // перевірка чи пішла уже відповідь, бо дописати до неї не можна
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ValidationError) {
    res.status(error.statusCode).json({ message: error.message, errors: error.fieldErrors });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (isJsonParseError(error)) {
    res.status(400).json({ message: 'Тіло запиту не є валідним JSON' });
    return;
  }

  // логуємо 500
  console.error(`[${req.method} ${req.originalUrl}]`, error);

  res.status(500).json({ message: 'Внутрішня помилка сервера' });
}
