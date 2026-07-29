type PrismaErrorShape = {
  code?: string;
  meta?: {
    driverAdapterError?: {
      cause?: { code?: string; message?: string; constraint?: { index?: string } };
    };
  };
};

function cause(error: unknown) {
  return (error as PrismaErrorShape).meta?.driverAdapterError?.cause;
}

export function isUniqueViolation(error: unknown): boolean {
  return (error as PrismaErrorShape).code === 'P2002';
}

// у bookings два зовнішні ключі й однаковий код помилки на обидва,
// тож розрізняємо за іменем констрейнта
export function isForeignKeyViolation(error: unknown, constraint: string): boolean {
  return (
    (error as PrismaErrorShape).code === 'P2003' &&
    cause(error)?.constraint?.index === constraint
  );
}

// prisma загортає помилку, справжній код postgres лежить у cause
// ім'я констрейнта відрізняє перетин від інших порушень(на даному етапі поки що не має але на майбутнє хай буде)
export function isBookingOverlap(error: unknown): boolean {
  const overlap = cause(error);

  return overlap?.code === '23P01' && (overlap.message ?? '').includes('bookings_no_overlap');
}
