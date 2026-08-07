import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/db/client.js';

const TEST_EMAIL = 'constraint-test@gmail.com';
const ROOM_A = 'constraint-test-room-a';
const ROOM_B = 'constraint-test-room-b';

let userId: string;
let roomAId: string;
let roomBId: string;

// prisma загортає помилку, справжній код postgres лежить у cause
// ім'я створеного констрейнта в повідомленні відрізняє перетин від інших можливих порушень
function isOverlapError(error: unknown): boolean {
  const cause = (
    error as { meta?: { driverAdapterError?: { cause?: { code?: string; message?: string } } } }
  ).meta?.driverAdapterError?.cause;

  return cause?.code === '23P01' && (cause.message ?? '').includes('bookings_no_overlap');
}

const book = (roomId: string, startsAt: string, endsAt: string) =>
  prisma.booking.create({
    data: {
      roomId,
      userId,
      title: 'тест констрейнта',
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
    },
  });

beforeAll(async () => {
  const user = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: {},
    create: {
      email: TEST_EMAIL,
      firstName: 'Тест',
      lastName: 'Констрейнтів',
      passwordHash: 'не використовується',
    },
  });
  userId = user.id;

  const upsertRoom = (name: string) =>
    prisma.room.upsert({
      where: { name },
      update: {},
      create: { name, imageUrl: 'https://example.invalid/room.jpg', capacity: 4, floor: 1 },
    });

  const [roomA, roomB] = await Promise.all([upsertRoom(ROOM_A), upsertRoom(ROOM_B)]);
  roomAId = roomA.id;
  roomBId = roomB.id;
});

beforeEach(async () => {
  await prisma.booking.deleteMany({ where: { roomId: { in: [roomAId, roomBId] } } });
});

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { roomId: { in: [roomAId, roomBId] } } });
  await prisma.room.deleteMany({ where: { name: { in: [ROOM_A, ROOM_B] } } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

describe('EXCLUDE констрейнт bookings_no_overlap', () => {
  it('впритул - обидва бронювання проходять', async () => {
    await book(roomAId, '2026-08-03T07:00:00Z', '2026-08-03T08:00:00Z');
    await book(roomAId, '2026-08-03T08:00:00Z', '2026-08-03T09:00:00Z');

    const count = await prisma.booking.count({ where: { roomId: roomAId } });
    expect(count).toBe(2);
  });

  it('часткове перекриття - база відхиляє', async () => {
    await book(roomAId, '2026-08-03T07:00:00Z', '2026-08-03T08:00:00Z');
    const error = await book(roomAId, '2026-08-03T07:30:00Z', '2026-08-03T08:30:00Z').catch(
      (e: unknown) => e,
    );

    expect(isOverlapError(error)).toBe(true);
  });

  it('повний збіг - база відхиляє', async () => {
    await book(roomAId, '2026-08-03T07:00:00Z', '2026-08-03T08:00:00Z');
    const error = await book(roomAId, '2026-08-03T07:00:00Z', '2026-08-03T08:00:00Z').catch(
      (e: unknown) => e,
    );

    expect(isOverlapError(error)).toBe(true);
  });

  it('сусідні дні в той самий час - проходять', async () => {
    await book(roomAId, '2026-08-03T07:00:00Z', '2026-08-03T08:00:00Z');
    await book(roomAId, '2026-08-04T07:00:00Z', '2026-08-04T08:00:00Z');

    const count = await prisma.booking.count({ where: { roomId: roomAId } });
    expect(count).toBe(2);
  });

  it('той самий час в іншій кімнаті - проходить', async () => {
    await book(roomAId, '2026-08-03T07:00:00Z', '2026-08-03T08:00:00Z');
    await book(roomBId, '2026-08-03T07:00:00Z', '2026-08-03T08:00:00Z');

    const count = await prisma.booking.count({ where: { roomId: { in: [roomAId, roomBId] } } });
    expect(count).toBe(2);
  });

  it('скасоване бронювання звільняє слот', async () => {
    const first = await book(roomAId, '2026-08-03T07:00:00Z', '2026-08-03T08:00:00Z');
    await prisma.booking.update({
      where: { id: first.id },
      data: { canceledAt: new Date() },
    });

    await expect(
      book(roomAId, '2026-08-03T07:00:00Z', '2026-08-03T08:00:00Z'),
    ).resolves.toBeDefined();
  });

  it('два одночасні бронювання на один слот - проходить рівно одне', async () => {
    const results = await Promise.allSettled([
      book(roomAId, '2026-08-03T07:00:00Z', '2026-08-03T08:00:00Z'),
      book(roomAId, '2026-08-03T07:00:00Z', '2026-08-03T08:00:00Z'),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);

    const rejected = results.find((result) => result.status === 'rejected');
    expect(isOverlapError(rejected?.reason)).toBe(true);
  });
});
