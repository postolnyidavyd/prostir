import { prisma } from '../db/client.js';
import { isBookingOverlap, isForeignKeyViolation } from '../db/errors.js';
import { AppError } from '../lib/errors.js';
import { formatDisplayName } from '../lib/names.js';
import { isInFuture, validateBookingInterval, type IntervalIssue } from '../lib/time.js';
import { publishRoomChange } from '../realtime/hub.js';
import type { BookingRange, CreateBookingInput, MyBookingsQuery } from '../schemas/booking.js';

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
  user: { select: { id: true, firstName: true, lastName: true } },
} as const;

type BookingRow = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  user: { id: string; firstName: string; lastName: string };
};

export type PublicBooking = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  user: { id: string; displayName: string };
};

function toPublicBooking(booking: BookingRow): PublicBooking {
  return {
    id: booking.id,
    title: booking.title,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    user: {
      id: booking.user.id,
      displayName: formatDisplayName(booking.user.firstName, booking.user.lastName),
    },
  };
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
  room: { select: { id: true, name: true } },
} as const;

// наступне бронювання показує ще місткість і поверх
const currentBookingFields = {
  id: true,
  title: true,
  startsAt: true,
  endsAt: true,
  room: { select: { id: true, name: true, floor: true, capacity: true } },
} as const;

export type MyBooking = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  room: { id: string; name: string };
};

export type CurrentBooking = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  room: { id: string; name: string; floor: number; capacity: number };
};

export type MyBookingsPage = {
  bookings: MyBooking[];
  nextCursor: string | null;
  total: number;
};

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

    // існування кімнати теж лишається за базою
    if (isForeignKeyViolation(error, 'bookings_room_id_fkey')) {
      throw new AppError(404, 'Кімнату не знайдено');
    }

    // юзера видалили поки його access-токен ще живий (рідскісний випадок але едж кейс)
    if (isForeignKeyViolation(error, 'bookings_user_id_fkey')) {
      throw new AppError(401, 'Сесія недійсна');
    }

    throw error;
  }
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
