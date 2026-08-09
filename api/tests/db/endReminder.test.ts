import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';

const OWNER = 'end-reminder-owner@gmail.com';
const NEIGHBOUR = 'end-reminder-neighbour@gmail.com';
const PASSWORD = 'parol12345';
const ROOM = 'end-reminder-room';

let ownerToken: string;
let ownerId: string;
let neighbourId: string;
let roomId: string;

async function registerUser(email: string) {
  const response = await request(app)
    .post('/auth/register')
    .send({ email, password: PASSWORD, firstName: 'Тест', lastName: 'Нагадувань' });

  return { token: response.body.accessToken as string, id: response.body.user.id as string };
}

function create(opts: { userId: string; startsAt: Date; endsAt: Date; canceled?: boolean }) {
  return prisma.booking.create({
    data: {
      roomId,
      userId: opts.userId,
      title: 'Зустріч',
      startsAt: opts.startsAt,
      endsAt: opts.endsAt,
      canceledAt: opts.canceled ? new Date() : null,
    },
  });
}

const minutes = (base: number, offset: number) => new Date(base + offset * 60_000);

function endReminder() {
  return request(app).get('/bookings/my/end-reminder').set('Authorization', `Bearer ${ownerToken}`);
}

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [OWNER, NEIGHBOUR] } } });

  const room = await prisma.room.upsert({
    where: { name: ROOM },
    update: {},
    create: { name: ROOM, imageUrl: 'https://example.invalid/room.jpg', capacity: 6, floor: 1 },
  });
  roomId = room.id;

  const owner = await registerUser(OWNER);
  const neighbour = await registerUser(NEIGHBOUR);
  ownerToken = owner.token;
  ownerId = owner.id;
  neighbourId = neighbour.id;
});

beforeEach(async () => {
  await prisma.booking.deleteMany({ where: { roomId } });
});

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { roomId } });
  await prisma.user.deleteMany({ where: { email: { in: [OWNER, NEIGHBOUR] } } });
  await prisma.room.deleteMany({ where: { name: ROOM } });
  await prisma.$disconnect();
});

describe('GET /bookings/my/end-reminder', () => {
  it('поточне бронювання із зайнятим сусіднім слотом - віддає нагадування', async () => {
    const now = Date.now();
    const current = await create({
      userId: ownerId,
      startsAt: minutes(now, -30),
      endsAt: minutes(now, 30),
    });

    await create({ userId: neighbourId, startsAt: minutes(now, 30), endsAt: minutes(now, 90) });

    const response = await endReminder();

    expect(response.status).toBe(200);
    expect(response.body.reminder.bookingId).toBe(current.id);
    expect(response.body.reminder.roomName).toBe(ROOM);
    // minutes береться з NOTIFY_BEFORE_MINUTES (дефолт 10)
    expect(response.body.reminder.minutes).toBe(10);
  });

  it('без сусіднього бронювання - null', async () => {
    const now = Date.now();
    await create({ userId: ownerId, startsAt: minutes(now, -30), endsAt: minutes(now, 30) });

    expect((await endReminder()).body.reminder).toBeNull();
  });

  it('проміжок замість сусіда впритул - null', async () => {
    const now = Date.now();
    await create({ userId: ownerId, startsAt: minutes(now, -30), endsAt: minutes(now, 30) });
    // наступний слот вільний, зайнято лише через 30 хв
    await create({ userId: neighbourId, startsAt: minutes(now, 60), endsAt: minutes(now, 120) });

    expect((await endReminder()).body.reminder).toBeNull();
  });

  it('сусіднє бронювання скасоване - null', async () => {
    const now = Date.now();
    await create({ userId: ownerId, startsAt: minutes(now, -30), endsAt: minutes(now, 30) });
    await create({
      userId: neighbourId,
      startsAt: minutes(now, 30),
      endsAt: minutes(now, 90),
      canceled: true,
    });

    expect((await endReminder()).body.reminder).toBeNull();
  });

  it('поточне бронювання скасоване - null', async () => {
    const now = Date.now();
    await create({
      userId: ownerId,
      startsAt: minutes(now, -30),
      endsAt: minutes(now, 30),
      canceled: true,
    });
    await create({ userId: neighbourId, startsAt: minutes(now, 30), endsAt: minutes(now, 90) });

    expect((await endReminder()).body.reminder).toBeNull();
  });

  it('бронювання ще не почалося - null', async () => {
    const now = Date.now();
    await create({ userId: ownerId, startsAt: minutes(now, 30), endsAt: minutes(now, 90) });
    await create({ userId: neighbourId, startsAt: minutes(now, 90), endsAt: minutes(now, 150) });

    expect((await endReminder()).body.reminder).toBeNull();
  });

  it('бронювання вже закінчилось - null', async () => {
    const now = Date.now();
    await create({ userId: ownerId, startsAt: minutes(now, -90), endsAt: minutes(now, -30) });
    await create({ userId: neighbourId, startsAt: minutes(now, -30), endsAt: minutes(now, 30) });

    expect((await endReminder()).body.reminder).toBeNull();
  });

  it('чуже поточне бронювання не нагадує власнику розкладу', async () => {
    const now = Date.now();
    await create({ userId: neighbourId, startsAt: minutes(now, -30), endsAt: minutes(now, 30) });
    await create({ userId: neighbourId, startsAt: minutes(now, 30), endsAt: minutes(now, 90) });

    expect((await endReminder()).body.reminder).toBeNull();
  });
});
