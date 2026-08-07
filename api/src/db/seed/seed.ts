import bcrypt from 'bcryptjs';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import { prisma } from '../client.js';
import { bookings, rooms, SEED_PASSWORD, users } from './data.js';

const KYIV_TIME_ZONE = 'Europe/Kyiv';
const BCRYPT_ROUNDS = 12;
const DAY_MS = 86_400_000;

function kyivDay(dayOffset: number): string {
  const now = new Date();
  const isoWeekday = Number(formatInTimeZone(now, KYIV_TIME_ZONE, 'i'));
  const monday = now.getTime() - (isoWeekday - 1) * DAY_MS;
  const anchor = new Date(monday + dayOffset * DAY_MS);

  return formatInTimeZone(anchor, KYIV_TIME_ZONE, 'yyyy-MM-dd');
}

function kyivInstant(dayOffset: number, time: string): Date {
  return fromZonedTime(`${kyivDay(dayOffset)} ${time}`, KYIV_TIME_ZONE);
}

async function seed(): Promise<void> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);

  const seededRooms = await Promise.all(
    rooms.map((room) =>
      prisma.room.upsert({ where: { name: room.name }, update: room, create: room }),
    ),
  );

  const seededUsers = await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: { firstName: user.firstName, lastName: user.lastName, passwordHash },
        create: { ...user, passwordHash },
      }),
    ),
  );

  const roomIdByName = new Map(seededRooms.map((room) => [room.name, room.id]));

  const existing = await prisma.booking.count();

  if (existing > 0) {
    console.log(`Сіди: ${seededRooms.length} кімнат, ${seededUsers.length} юзерів;`);
    console.log(`бронювання пропущені - у базі вже є ${existing}`);
    return;
  }

  for (const booking of bookings) {
    const roomId = roomIdByName.get(booking.room);
    const user = seededUsers[booking.user];

    if (!roomId || !user) {
      throw new Error(`Сіди: не знайдено кімнату «${booking.room}» або юзера ${booking.user}`);
    }

    await prisma.booking.create({
      data: {
        roomId,
        userId: user.id,
        title: booking.title,
        startsAt: kyivInstant(booking.dayOffset, booking.from),
        endsAt: kyivInstant(booking.dayOffset, booking.to),
        canceledAt: booking.canceled ? new Date() : null,
      },
    });
  }

  console.log(
    `Сіди: ${seededRooms.length} кімнат, ${seededUsers.length} юзерів, ${bookings.length} бронювань`,
  );
}

try {
  await seed();
} finally {
  await prisma.$disconnect();
}
