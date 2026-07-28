import type { Request, RequestHandler } from 'express';
import { z } from 'zod';

import { ValidationError } from '../lib/errors.js';

export type RequestSchemas = {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
};

const PARTS = ['body', 'query', 'params'] as const;

type RequestPart = (typeof PARTS)[number];

// перезапис vs своє поле на req.query

// Express 5 зробив req.query гетером без сетера - звичайне присвоєння кидає TypeError.
// альтернатива була б не чіпати запит узагалі й скласти розібране в req.validated або подібне
// обрав перезапис із бо:
// 1)контролери читають звичні req.body, req.query, req.params і працюють дженерики express
// 2) defineProperty не чіпає ні код express, ні його прототип,
// власна властивість перекриває гетер лише на цьому екземплярі запиту
function writeBack(req: Request, part: RequestPart, data: unknown): void {
  if (part === 'query') {
    Object.defineProperty(req, 'query', { value: data, writable: true, configurable: true });
    return;
  }

  if (part === 'body') {
    req.body = data;
    return;
  }

  req.params = data as Request['params'];
}

// розібрані дані повертаються в запит, бо zod їх перетворює. Якщо помилка передає мідлварці
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    const fieldErrors: Record<string, string[]> = {};

    for (const part of PARTS) {
      const schema = schemas[part];

      if (!schema) {
        continue;
      }

      const result = schema.safeParse(req[part]);

      if (!result.success) {
        for (const issue of result.error.issues) {
          // порожній path означає проблему з частиною запиту, а не з конкретним полем
          const field = issue.path.map(String).join('.') || part;
          (fieldErrors[field] ??= []).push(issue.message);
        }
        continue;
      }

      writeBack(req, part, result.data);
    }

    if (Object.keys(fieldErrors).length > 0) {
      next(new ValidationError(fieldErrors));
      return;
    }

    next();
  };
}
