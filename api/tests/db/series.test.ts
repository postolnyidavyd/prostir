import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { addWeeksKyiv } from '../../src/lib/time.js';

const OWNER = 'series-owner@gmail.com';
const STRANGER = 'series-stranger@gmail.com';
const PASSWORD = 'parol12345';
const ROOM = 'series-test-room';

let ownerToken: string;
let ownerId: string;
let strangerToken: string;
let roomId: string;

function nextMonday(): Date {
  const date = new Date();
  date.setUTCHours(7, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + ((8 - date.getUTCDay()) % 7 || 7));

  return date;
}

// базовий слот першого повторення (безпечно в межах робочих годин Києва)
function slot(durationMinutes = 60) {
  const startsAt = nextMonday();
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

// той самий слот через i тижнів
function week(base: { startsAt: string; endsAt: string }, i: number) {
  return {
    startsAt: addWeeksKyiv(new Date(base.startsAt), i).toISOString(),
    endsAt: addWeeksKyiv(new Date(base.endsAt), i).toISOString(),
  };
}

async function registerUser(email: string) {
  const response = await request(app)
    .post('/auth/register')
    .send({ email, password: PASSWORD, firstName: 'Тест', lastName: 'Серій' });

  const id = response.body.user.id as string;
  await prisma.user.update({ where: { id }, data: { emailVerifiedAt: new Date() } });

  return { token: response.body.accessToken as string, id };
}

function createSeries(
  token: string,
  body: { startsAt: string; endsAt: string; weeks: number; allowSkips?: boolean },
) {
  return request(app)
    .post('/bookings/series')
    .set('Authorization', `Bearer ${token}`)
    .send({ roomId, title: 'Щотижневий синк', ...body });
}

function book(token: string, times: { startsAt: string; endsAt: string }) {
  return request(app)
    .post('/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ roomId, title: 'Одиночне', ...times });
}

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [OWNER, STRANGER] } } });

  const room = await prisma.room.upsert({
    where: { name: ROOM },
    update: {},
    create: { name: ROOM, imageUrl: 'https://example.invalid/room.jpg', capacity: 6, floor: 1 },
  });
  roomId = room.id;

  const owner = await registerUser(OWNER);
  const stranger = await registerUser(STRANGER);
  ownerToken = owner.token;
  ownerId = owner.id;
  strangerToken = stranger.token;
});

beforeEach(async () => {
  await prisma.booking.deleteMany({ where: { roomId } });
});

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { roomId } });
  await prisma.user.deleteMany({ where: { email: { in: [OWNER, STRANGER] } } });
  await prisma.room.deleteMany({ where: { name: ROOM } });
  await prisma.$disconnect();
});

describe('POST /bookings/series', () => {
  it('створює N повторень зі спільним seriesId і кроком тиждень', async () => {
    const base = slot();
    const response = await createSeries(ownerToken, { ...base, weeks: 3 });

    expect(response.status).toBe(201);
    expect(response.body.created).toHaveLength(3);
    expect(response.body.skipped).toHaveLength(0);

    const ids = new Set(response.body.created.map((b: { seriesId: string }) => b.seriesId));
    expect(ids.size).toBe(1);
    expect(response.body.created[1].startsAt).toBe(week(base, 1).startsAt);
    expect(response.body.created[2].startsAt).toBe(week(base, 2).startsAt);
  });

  it('weeks поза 2-13 - 400', async () => {
    const base = slot();
    expect((await createSeries(ownerToken, { ...base, weeks: 1 })).status).toBe(400);
    expect((await createSeries(ownerToken, { ...base, weeks: 14 })).status).toBe(400);
  });

  it('зайнятий тиждень без allowSkips - 409 зі списком, нічого не створено', async () => {
    const base = slot();
    await book(strangerToken, week(base, 1)); // займаємо друге повторення

    const response = await createSeries(ownerToken, { ...base, weeks: 3 });

    expect(response.status).toBe(409);
    expect(response.body.conflicts).toHaveLength(1);
    expect(response.body.conflicts[0].startsAt).toBe(week(base, 1).startsAt);

    // серія не створена
    const mine = await request(app)
      .get('/bookings/my/series')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(mine.body.series).toHaveLength(0);
  });

  it('з allowSkips бронює доступні, зайняте пропускає', async () => {
    const base = slot();
    await book(strangerToken, week(base, 1));

    const response = await createSeries(ownerToken, { ...base, weeks: 3, allowSkips: true });

    expect(response.status).toBe(201);
    expect(response.body.created).toHaveLength(2);
    expect(response.body.skipped).toHaveLength(1);
    expect(response.body.skipped[0].startsAt).toBe(week(base, 1).startsAt);
  });

  it('неверифікований email - 403', async () => {
    const unverified = 'series-unverified@gmail.com';
    const reg = await request(app)
      .post('/auth/register')
      .send({ email: unverified, password: PASSWORD, firstName: 'Тест', lastName: 'Гейт' });

    const response = await createSeries(reg.body.accessToken, { ...slot(), weeks: 3 });

    expect(response.status).toBe(403);
    await prisma.user.deleteMany({ where: { email: unverified } });
  });
});

describe('GET /bookings/my/series', () => {
  it('зводить повторення в одну картку', async () => {
    const base = slot();
    await createSeries(ownerToken, { ...base, weeks: 3 });

    const response = await request(app)
      .get('/bookings/my/series')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.series).toHaveLength(1);
    expect(response.body.series[0]).toMatchObject({
      total: 3,
      upcomingCount: 3,
      room: { name: ROOM },
    });
  });
});

describe('DELETE /bookings/series/:id', () => {
  it('скасовує всі майбутні повторення і повертає кількість', async () => {
    const created = await createSeries(ownerToken, { ...slot(), weeks: 3 });
    const seriesId = created.body.created[0].seriesId;

    const response = await request(app)
      .delete(`/bookings/series/${seriesId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.canceled).toBe(3);

    const active = await prisma.booking.count({ where: { seriesId, canceledAt: null } });
    expect(active).toBe(0);
  });

  it('минулі повторення не чіпає', async () => {
    const seriesId = randomUUID();
    const now = Date.now();
    await prisma.booking.createMany({
      data: [
        {
          roomId,
          userId: ownerId,
          title: 'Серія',
          seriesId,
          startsAt: new Date(now - 3 * 3_600_000),
          endsAt: new Date(now - 2 * 3_600_000),
        },
        {
          roomId,
          userId: ownerId,
          title: 'Серія',
          seriesId,
          startsAt: new Date(now + 2 * 3_600_000),
          endsAt: new Date(now + 3 * 3_600_000),
        },
      ],
    });

    const response = await request(app)
      .delete(`/bookings/series/${seriesId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.body.canceled).toBe(1);
    const past = await prisma.booking.findFirst({
      where: { seriesId, startsAt: { lt: new Date() } },
      select: { canceledAt: true },
    });
    expect(past?.canceledAt).toBeNull();
  });

  it('чужу серію не скасувати - 403', async () => {
    const created = await createSeries(ownerToken, { ...slot(), weeks: 2 });
    const seriesId = created.body.created[0].seriesId;

    const response = await request(app)
      .delete(`/bookings/series/${seriesId}`)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(response.status).toBe(403);
  });

  it('невідома серія - 404', async () => {
    const response = await request(app)
      .delete(`/bookings/series/${randomUUID()}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(404);
  });
});
