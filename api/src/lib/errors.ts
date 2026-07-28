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
