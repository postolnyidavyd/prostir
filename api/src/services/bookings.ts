import { randomUUID } from 'node:crypto';

import { prisma } from '../db/client.js';
import { isBookingOverlap, isForeignKeyViolation } from '../db/errors.js';
import { AppError, SeriesConflictError } from '../lib/errors.js';
import { formatDisplayName } from '../lib/names.js';
import {
  addWeeksKyiv,
  isInFuture,
  validateBookingInterval,
  type IntervalIssue,
} from '../lib/time.js';
import { publishRoomChange } from '../realtime/hub.js';
import type {
  BookingRange,
  CreateBookingInput,
  CreateSeriesInput,
  MyBookingsQuery,
} from '../schemas/booking.js';

const INTERVAL_MESSAGES: Record<IntervalIssue, string> = {
  NOT_ALIGNED: 'Час має бути кратним 30 хвилинам',
  BAD_DURATION: 'Тривалість має бути від 30 хвилин до 4 годин',
  OUTSIDE_WORKING_HOURS: 'Бронювати можна лише з 09:00 до 19:00 за Києвом',
  IN_PAST: 'Не можна бронювати час у минулому',
};

const bookingFields = {
  id: true,
  title: true,
  startsAt: true,
  endsAt: true,
  seriesId: true,
  user: { select: { id: true, firstName: true, lastName: true } },
} as const;

type BookingRow = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  seriesId: string | null;
  user: { id: string; firstName: string; lastName: string };
};

export type PublicBooking = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  seriesId: string | null;
  user: { id: string; displayName: string };
};

function toPublicBooking(booking: BookingRow): PublicBooking {
  return {
    id: booking.id,
    title: booking.title,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    seriesId: booking.seriesId,
    user: {
      id: booking.user.id,
      displayName: formatDisplayName(booking.user.firstName, booking.user.lastName),
    },
  };
}

type Occurrence = { startsAt: Date; endsAt: Date };

// повторення серії
function generateOccurrences(startsAt: Date, endsAt: Date, weeks: number): Occurrence[] {
  return Array.from({ length: weeks }, (_, i) => ({
    startsAt: addWeeksKyiv(startsAt, i),
    endsAt: addWeeksKyiv(endsAt, i),
  }));
}

// зайняті повторення - лише для користувачу при створені істина, при вставці лишається за констрейнтом
async function findBusyOccurrences(
  roomId: string,
  occurrences: Occurrence[],
  windowStart: Date,
  windowEnd: Date,
): Promise<Occurrence[]> {
  const existing = await prisma.booking.findMany({
    where: { roomId, canceledAt: null, startsAt: { lt: windowEnd }, endsAt: { gt: windowStart } },
    select: { startsAt: true, endsAt: true },
  });

  return occurrences.filter((occ) =>
    existing.some((busy) => busy.startsAt < occ.endsAt && busy.endsAt > occ.startsAt),
  );
}

// помилки запису бронювання, спільні для одиночного і серії
function rethrowBookingWriteError(error: unknown): never {
  // існування кімнати лишається за базою
  if (isForeignKeyViolation(error, 'bookings_room_id_fkey')) {
    throw new AppError(404, 'Кімнату не знайдено');
  }

  // юзера видалили поки його access-токен ще живий (рідкісний кейс)
  if (isForeignKeyViolation(error, 'bookings_user_id_fkey')) {
    throw new AppError(401, 'Сесія недійсна');
  }

  throw error;
}

export async function listRoomBookings(
  roomId: string,
  range: BookingRange,
): Promise<PublicBooking[]> {
  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { id: true } });

  if (!room) {
    throw new AppError(404, 'Кімнату не знайдено');
  }

  // беремо все що заходить у вікно навіть якщо частково
  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      canceledAt: null,
      startsAt: { lt: range.to },
      endsAt: { gt: range.from },
    },
    orderBy: { startsAt: 'asc' },
    select: bookingFields,
  });

  return bookings.map(toPublicBooking);
}

// у списку показуємо лише назву кімнати
const myBookingFields = {
  id: true,
  title: true,
  startsAt: true,
  endsAt: true,
  seriesId: true,
  room: { select: { id: true, name: true } },
} as const;

// наступне бронювання показує ще місткість і поверх
const currentBookingFields = {
  id: true,
  title: true,
  startsAt: true,
  endsAt: true,
  seriesId: true,
  room: { select: { id: true, name: true, floor: true, capacity: true } },
} as const;

export type MyBooking = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  seriesId: string | null;
  room: { id: string; name: string };
};

export type CurrentBooking = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  seriesId: string | null;
  room: { id: string; name: string; floor: number; capacity: number };
};

export type MyBookingsPage = {
  bookings: MyBooking[];
  nextCursor: string | null;
  total: number;
};

export type EndReminder = {
  bookingId: string;
  title: string;
  roomName: string;
  endsAt: Date;
  minutes: number;
};

// нагадування звільнити кімнату користувачу чиє бронювання триває,
// і у тій же кімнаті в когось інше активне, ми повертаємо для якого бронювання треба
// фронт сам показує нагадування
export async function getEndReminder(
  userId: string,
  beforeMinutes: number,
  now: Date,
): Promise<EndReminder | null> {
  const running = await prisma.booking.findMany({
    where: { userId, canceledAt: null, startsAt: { lte: now }, endsAt: { gt: now } },
    orderBy: { endsAt: 'asc' },
    select: { id: true, title: true, endsAt: true, roomId: true, room: { select: { name: true } } },
  });

  for (const booking of running) {
    // сусід впритул
    const next = await prisma.booking.findFirst({
      where: { roomId: booking.roomId, canceledAt: null, startsAt: booking.endsAt },
      select: { id: true },
    });

    if (next) {
      return {
        bookingId: booking.id,
        title: booking.title,
        roomName: booking.room.name,
        endsAt: booking.endsAt,
        minutes: beforeMinutes,
      };
    }
  }

  return null;
}

// поточне, що триває зараз або найближче майбутнє бронювання
export async function getCurrentBooking(userId: string): Promise<CurrentBooking | null> {
  return prisma.booking.findFirst({
    where: { userId, canceledAt: null, endsAt: { gt: new Date() } },
    orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
    select: currentBookingFields,
  });
}

// пагінація через курсор - id останнього бронювання з попередньої сторінки
// поки користувач гортає сторінку минулих бронювань, якесь інше стає минулим і зсуває список униз,
// тож звичайний offset показав би один запис двічі коли курсор продовжує рівно з місця зупинки
export async function listMyBookings(
  userId: string,
  query: MyBookingsQuery,
): Promise<MyBookingsPage> {
  const upcoming = query.scope === 'upcoming';
  const now = new Date();

  const where = {
    userId,
    canceledAt: null,
    ...(upcoming ? { startsAt: { gt: now } } : { endsAt: { lte: now } }),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: upcoming
        ? [{ startsAt: 'asc' }, { id: 'asc' }]
        : [{ startsAt: 'desc' }, { id: 'desc' }],
      // на один більше за сторінку - так дізнаємось, чи є що вантажити далі
      take: query.limit + 1,
      ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
      select: myBookingFields,
    }),
    prisma.booking.count({ where }),
  ]);

  const page = bookings.slice(0, query.limit);

  return {
    bookings: page,
    nextCursor: bookings.length > query.limit ? (page.at(-1)?.id ?? null) : null,
    total,
  };
}

export async function createBooking(
  userId: string,
  input: CreateBookingInput,
): Promise<PublicBooking> {
  const check = validateBookingInterval(input.startsAt, input.endsAt, new Date());

  if (!check.ok) {
    throw new AppError(400, INTERVAL_MESSAGES[check.reason]);
  }

  try {
    const booking = await prisma.booking.create({
      data: {
        roomId: input.roomId,
        userId,
        title: input.title,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      },
      select: bookingFields,
    });

    // розклад цієї кімнати змінився - надсилаємо сигнал
    publishRoomChange({ roomId: input.roomId, startsAt: booking.startsAt, endsAt: booking.endsAt });

    return toPublicBooking(booking);
  } catch (error) {
    // перетини забороняє констрейнт, додаткова перевірка не допомогає при гонці
    if (isBookingOverlap(error)) {
      throw new AppError(409, 'Цей час щойно зайняли');
    }

    rethrowBookingWriteError(error);
  }
}

export type SeriesResult = {
  seriesId: string;
  created: PublicBooking[];
  skipped: Occurrence[];
};

// повторюване бронювання, усі букінги однієї серії ділять seriesId.
// без allowSkips - усе або нічого, з allowSkips - бронюємо доступні, зайняті пропускаємо
export async function createSeries(userId: string, input: CreateSeriesInput): Promise<SeriesResult> {
  const now = new Date();
  const occurrences = generateOccurrences(input.startsAt, input.endsAt, input.weeks);

  for (const occ of occurrences) {
    const check = validateBookingInterval(occ.startsAt, occ.endsAt, now);
    if (!check.ok) {
      throw new AppError(400, INTERVAL_MESSAGES[check.reason]);
    }
  }

  const windowEnd = addWeeksKyiv(input.endsAt, input.weeks - 1);
  const busy = await findBusyOccurrences(input.roomId, occurrences, input.startsAt, windowEnd);

  // віддаємо конфлікти на підтвердження, нічого не створюємо
  if (busy.length > 0 && !input.allowSkips) {
    throw new SeriesConflictError(busy);
  }

  const seriesId = randomUUID();
  const data = (occ: Occurrence) => ({
    roomId: input.roomId,
    userId,
    title: input.title,
    startsAt: occ.startsAt,
    endsAt: occ.endsAt,
    seriesId,
  });

  // конфліктів нема - атомарно все або нічого
  if (!input.allowSkips) {
    try {
      const created = await prisma.$transaction(
        occurrences.map((occ) => prisma.booking.create({ data: data(occ), select: bookingFields })),
      );
      for (const booking of created) {
        publishRoomChange({ roomId: input.roomId, startsAt: booking.startsAt, endsAt: booking.endsAt });
      }

      return { seriesId, created: created.map(toPublicBooking), skipped: [] };
    } catch (error) {
      if (isBookingOverlap(error)) {
        throw new AppError(409, 'Цей час щойно зайняли');
      }
      rethrowBookingWriteError(error);
    }
  }

  // allowSkips - бронюємо по одному, зайняті пропускаємо
  const created: PublicBooking[] = [];
  const skipped: Occurrence[] = [];

  for (const occ of occurrences) {
    try {
      const booking = await prisma.booking.create({ data: data(occ), select: bookingFields });
      publishRoomChange({ roomId: input.roomId, startsAt: booking.startsAt, endsAt: booking.endsAt });
      created.push(toPublicBooking(booking));
    } catch (error) {
      if (isBookingOverlap(error)) {
        skipped.push({ startsAt: occ.startsAt, endsAt: occ.endsAt });
        continue;
      }
      rethrowBookingWriteError(error);
    }
  }

  return { seriesId, created, skipped };
}

export async function cancelBooking(userId: string, bookingId: string): Promise<void> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, canceledAt: null },
    select: { id: true, userId: true, roomId: true, startsAt: true, endsAt: true },
  });

  if (!booking) {
    throw new AppError(404, 'Бронювання не знайдено');
  }

  // правило власника саме тут
  if (booking.userId !== userId) {
    throw new AppError(403, 'Це не ваше бронювання');
  }

  if (!isInFuture(booking.startsAt, new Date())) {
    throw new AppError(409, 'Бронювання вже почалося');
  }

  const canceled = await prisma.booking.updateMany({
    where: { id: bookingId, canceledAt: null },
    data: { canceledAt: new Date() },
  });

  if (canceled.count === 0) {
    throw new AppError(404, 'Бронювання не знайдено');
  }

  // слот звільнився - надсилаємо сигнал
  publishRoomChange({ roomId: booking.roomId, startsAt: booking.startsAt, endsAt: booking.endsAt });
}

// скасовує всі майбутні нескасовані повторення серії
export async function cancelSeries(userId: string, seriesId: string): Promise<number> {
  const owner = await prisma.booking.findFirst({ where: { seriesId }, select: { userId: true } });

  if (!owner) {
    throw new AppError(404, 'Серію не знайдено');
  }

  if (owner.userId !== userId) {
    throw new AppError(403, 'Це не ваша серія');
  }

  const now = new Date();
  const upcoming = await prisma.booking.findMany({
    where: { seriesId, canceledAt: null, startsAt: { gt: now } },
    select: { id: true, roomId: true, startsAt: true, endsAt: true },
  });

  if (upcoming.length === 0) {
    throw new AppError(409, 'Немає майбутніх бронювань серії для скасування');
  }

  await prisma.booking.updateMany({
    where: { id: { in: upcoming.map((booking) => booking.id) }, canceledAt: null },
    data: { canceledAt: now },
  });

  for (const booking of upcoming) {
    publishRoomChange({ roomId: booking.roomId, startsAt: booking.startsAt, endsAt: booking.endsAt });
  }

  return upcoming.length;
}

export type SeriesSummary = {
  seriesId: string;
  title: string;
  room: { id: string; name: string };
  // для показу дня тижня й часу серії
  startsAt: Date;
  endsAt: Date;
  total: number;
  upcomingCount: number;
  nextStartsAt: Date | null;
};

// зводить бронювання користувача в серії
export async function listMySeries(userId: string): Promise<SeriesSummary[]> {
  const now = new Date();
  const rows = await prisma.booking.findMany({
    where: { userId, seriesId: { not: null }, canceledAt: null },
    orderBy: { startsAt: 'asc' },
    select: {
      seriesId: true,
      title: true,
      startsAt: true,
      endsAt: true,
      room: { select: { id: true, name: true } },
    },
  });

  const bySeries = new Map<string, SeriesSummary>();

  for (const row of rows) {
    if (row.seriesId === null) continue;

    let summary = bySeries.get(row.seriesId);
    if (!summary) {
      summary = {
        seriesId: row.seriesId,
        title: row.title,
        room: row.room,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        total: 0,
        upcomingCount: 0,
        nextStartsAt: null,
      };
      bySeries.set(row.seriesId, summary);
    }

    summary.total += 1;
    if (row.startsAt > now) {
      summary.upcomingCount += 1;
      summary.nextStartsAt ??= row.startsAt;
    }
  }

  // серії майбутні - зверху, минулі- в кінцеь
  return [...bySeries.values()].sort((a, b) => {
    if (a.nextStartsAt && b.nextStartsAt) return a.nextStartsAt.getTime() - b.nextStartsAt.getTime();
    if (a.nextStartsAt) return -1;
    if (b.nextStartsAt) return 1;
    return b.startsAt.getTime() - a.startsAt.getTime();
  });
}
