// мідлварка auth-guard кладе в req.user id користувача.
// Так як немає в express такого поля то ми оголошуємо власний інтерфейс який компілятор склеює з інтерфейсом оголошеного express
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export {};
