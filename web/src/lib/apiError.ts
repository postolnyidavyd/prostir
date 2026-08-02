import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

// форма помилки api
type ApiErrorBody = {
  message: string;
  errors?: Record<string, string[]>;
};

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return typeof data === 'object' && data !== null && 'message' in data;
}

// людське повідомлення з помилки
export function apiErrorMessage(error: unknown, fallback = 'Щось пішло не так'): string {
  const data = (error as FetchBaseQueryError | undefined)?.data;
  return isApiErrorBody(data) ? data.message : fallback;
}

// для форм
export function apiFieldErrors(error: unknown): Record<string, string> {
  const data = (error as FetchBaseQueryError | undefined)?.data;

  if (!isApiErrorBody(data) || !data.errors) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(data.errors).map(([field, messages]) => [field, messages[0] ?? '']),
  );
}
