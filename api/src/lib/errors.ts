// сервіси кидають помилку з готовим текстом для користувача,
// error-handler віддає як є
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(readonly fieldErrors: Record<string, string[]>) {
    super(400, 'Некоректні дані запиту');
    this.name = 'ValidationError';
  }
}

// частина повторень серії зайнята
// конфлікти віддаємо клієнту для підтвердження
export class SeriesConflictError extends AppError {
  constructor(readonly conflicts: { startsAt: Date; endsAt: Date }[]) {
    super(409, 'Частина тижнів уже зайнята');
    this.name = 'SeriesConflictError';
  }
}
