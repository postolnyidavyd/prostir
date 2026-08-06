import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';

const OWNER = 'booking-owner@gmail.com';
const STRANGER = 'booking-stranger@gmail.com';
const PASSWORD = 'parol12345';
const ROOM_A = 'booking-test-room-a';
const ROOM_B = 'booking-test-room-b';

let ownerToken: string;
let strangerToken: string;
let ownerId: string;
let roomAId: string;
let roomBId: string;

// найближчий понеділок, щоб тести не залежали від дня прогону
function nextMonday(): Date {
  const date = new Date();
  date.setUTCHours(7, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + ((8 - date.getUTCDay()) % 7 || 7));

  return date;
}

function slot(offsetMinutes: number, durationMinutes = 60) {
  const startsAt = new Date(nextMonday().getTime() + offsetMinutes * 60_000);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

async function registerUser(email: string) {
  const response = await request(app)
    .post('/auth/register')
    .send({ email, password: PASSWORD, firstName: 'Тест', lastName: 'Бронювань' });

  return { token: response.body.accessToken as string, id: response.body.user.id as string };
}

function book(token: string, roomId: string, times: { startsAt: string; endsAt: string }) {
  return request(app)
    .post('/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ roomId, title: 'Синк команди', ...times });
}

const upsertRoom = (name: string, capacity: number, floor: number) =>
  prisma.room.upsert({
    where: { name },
    update: {},
    create: { name, imageUrl: 'https://example.invalid/room.jpg', capacity, floor },
  });

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [OWNER, STRANGER] } } });

  const [roomA, roomB] = await Promise.all([upsertRoom(ROOM_A, 4, 1), upsertRoom(ROOM_B, 12, 2)]);
  roomAId = roomA.id;
  roomBId = roomB.id;

  const owner = await registerUser(OWNER);
  const stranger = await registerUser(STRANGER);

  ownerToken = owner.token;
  ownerId = owner.id;
  strangerToken = stranger.token;
});

beforeEach(async () => {
  await prisma.booking.deleteMany({ where: { roomId: { in: [roomAId, roomBId] } } });
});

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { roomId: { in: [roomAId, roomBId] } } });
  await prisma.user.deleteMany({ where: { email: { in: [OWNER, STRANGER] } } });
  await prisma.room.deleteMany({ where: { name: { in: [ROOM_A, ROOM_B] } } });
  await prisma.$disconnect();
});

describe('GET /rooms', () => {
  it('без токена - 401', async () => {
    const response = await request(app).get('/rooms');

    expect(response.status).toBe(401);
  });

  it('фільтр за поверхами (один і кілька)', async () => {
    const single = await request(app)
      .get('/rooms?floors=2')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(single.status).toBe(200);
    expect(single.body.rooms.every((room: { floor: number }) => room.floor === 2)).toBe(true);

    const multi = await request(app)
      .get('/rooms?floors=1,2')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(multi.status).toBe(200);
    expect(
      multi.body.rooms.every((room: { floor: number }) => room.floor === 1 || room.floor === 2),
    ).toBe(true);
  });

  it('/rooms/filters віддає наявні поверхи й діапазон місткості', async () => {
    const response = await request(app)
      .get('/rooms/filters')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.floors)).toBe(true);
    expect(response.body.floors.length).toBeGreaterThan(0);
    expect(response.body.maxCapacity).toBeGreaterThan(0);
  });

  it('фільтр за місткістю віддає кімнати не менші за задану', async () => {
    const response = await request(app)
      .get('/rooms?minCapacity=10')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.body.rooms.every((room: { capacity: number }) => room.capacity >= 10)).toBe(
      true,
    );
  });

  it('порожній фільтр не вважається заданим', async () => {
    const response = await request(app)
      .get('/rooms?floors=&minCapacity=')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.rooms.length).toBeGreaterThanOrEqual(2);
  });

  it('без вікна поля available немає', async () => {
    const response = await request(app).get('/rooms').set('Authorization', `Bearer ${ownerToken}`);

    expect(response.body.rooms[0]).not.toHaveProperty('available');
  });

  it('з вікном кожна кімната має available; зайнята позначена', async () => {
    const times = slot(0);
    await book(ownerToken, roomAId, times);

    const response = await request(app)
      .get(`/rooms?from=${times.startsAt}&to=${times.endsAt}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    const rooms: { id: string; available: boolean }[] = response.body.rooms;
    expect(rooms.every((room) => typeof room.available === 'boolean')).toBe(true);
    expect(rooms.find((room) => room.id === roomAId)?.available).toBe(false);
    expect(rooms.find((room) => room.id === roomBId)?.available).toBe(true);
  });

  it('впритул до вікна не робить кімнату зайнятою', async () => {
    await book(ownerToken, roomAId, slot(0));

    const next = slot(60);
    const response = await request(app)
      .get(`/rooms?from=${next.startsAt}&to=${next.endsAt}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(
      response.body.rooms.find((room: { id: string }) => room.id === roomAId).available,
    ).toBe(true);
  });

  it('onlyFree приховує зайняті', async () => {
    const times = slot(0);
    await book(ownerToken, roomAId, times);

    const response = await request(app)
      .get(`/rooms?from=${times.startsAt}&to=${times.endsAt}&onlyFree=true`)
      .set('Authorization', `Bearer ${ownerToken}`);

    const ids = response.body.rooms.map((room: { id: string }) => room.id);
    expect(ids).not.toContain(roomAId);
    expect(ids).toContain(roomBId);
  });

  it('from без to - 400', async () => {
    const response = await request(app)
      .get('/rooms?from=2026-08-03T07:00:00.000Z')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(400);
  });
});

describe('POST /bookings', () => {
  it('створює бронювання і віддає власника як Прізвище І.', async () => {
    const response = await book(ownerToken, roomAId, slot(0));

    expect(response.status).toBe(201);
    expect(response.body.booking.user).toEqual({ id: ownerId, displayName: 'Бронювань Т.' });
  });

  it('впритул до наявного - проходить', async () => {
    await book(ownerToken, roomAId, slot(0));
    const response = await book(strangerToken, roomAId, slot(60));

    expect(response.status).toBe(201);
  });

  it('перетин - 409', async () => {
    await book(ownerToken, roomAId, slot(0));
    const response = await book(strangerToken, roomAId, slot(30));

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Цей час щойно зайняли');
  });

  it('той самий час в іншій кімнаті - проходить', async () => {
    await book(ownerToken, roomAId, slot(0));
    const response = await book(strangerToken, roomBId, slot(0));

    expect(response.status).toBe(201);
  });

  it('поза робочими годинами - 400', async () => {
    const response = await book(ownerToken, roomAId, slot(-120));

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('09:00');
  });

  it('не кратно 30 хвилинам - 400', async () => {
    const response = await book(ownerToken, roomAId, slot(15));

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('30 хвилин');
  });

  it('довше за 4 години - 400', async () => {
    const response = await book(ownerToken, roomAId, slot(0, 300));

    expect(response.status).toBe(400);
  });

  it('у минулому - 400', async () => {
    const response = await book(ownerToken, roomAId, {
      startsAt: '2020-08-03T07:00:00.000Z',
      endsAt: '2020-08-03T08:00:00.000Z',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('минулому');
  });

  it('неіснуюча кімната - 404', async () => {
    const response = await book(ownerToken, '00000000-0000-4000-8000-000000000000', slot(0));

    expect(response.status).toBe(404);
  });

  it('видалений юзер із живим токеном - 401, а не кімнату не знайдено', async () => {
    const ghost = await registerUser('booking-ghost@gmail.com');
    await prisma.user.delete({ where: { id: ghost.id } });

    const response = await book(ghost.token, roomAId, slot(0));

    expect(response.status).toBe(401);
  });

  it('порожня назва - 400 з полем', async () => {
    const response = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ roomId: roomAId, title: '   ', ...slot(0) });

    expect(response.status).toBe(400);
    expect(response.body.errors.title).toBeDefined();
  });

  it('два одночасні запити на один слот - проходить рівно один', async () => {
    const times = slot(0);
    const results = await Promise.all([
      book(ownerToken, roomAId, times),
      book(strangerToken, roomAId, times),
    ]);

    expect(results.filter((response) => response.status === 201)).toHaveLength(1);
    expect(results.filter((response) => response.status === 409)).toHaveLength(1);
  });
});

describe('GET /rooms/:id/bookings', () => {
  it('віддає лише бронювання діапазону і без скасованих', async () => {
    const inRange = await book(ownerToken, roomAId, slot(0));
    const outOfRange = await book(ownerToken, roomAId, slot(60 * 24 * 3));
    const canceled = await book(ownerToken, roomAId, slot(120));

    await request(app)
      .delete(`/bookings/${canceled.body.booking.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    const from = nextMonday();
    const to = new Date(from.getTime() + 86_400_000);

    const response = await request(app)
      .get(`/rooms/${roomAId}/bookings?from=${from.toISOString()}&to=${to.toISOString()}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    const ids = response.body.bookings.map((booking: { id: string }) => booking.id);

    expect(ids).toEqual([inRange.body.booking.id]);
    expect(ids).not.toContain(outOfRange.body.booking.id);
  });

  it('кінець діапазону раніше за початок - 400', async () => {
    const response = await request(app)
      .get(`/rooms/${roomAId}/bookings?from=2026-08-05T00:00:00.000Z&to=2026-08-03T00:00:00.000Z`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(400);
  });

  it('діапазон понад 31 день - 400', async () => {
    const response = await request(app)
      .get(`/rooms/${roomAId}/bookings?from=2026-08-01T00:00:00.000Z&to=2026-10-01T00:00:00.000Z`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(400);
  });

  it('неіснуюча кімната - 404, а не порожній розклад', async () => {
    const from = nextMonday();
    const to = new Date(from.getTime() + 86_400_000);

    const response = await request(app)
      .get(
        `/rooms/00000000-0000-4000-8000-000000000000/bookings?from=${from.toISOString()}&to=${to.toISOString()}`,
      )
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(404);
  });

  it('без from і to - 400', async () => {
    const response = await request(app)
      .get(`/rooms/${roomAId}/bookings`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(400);
  });
});

describe('GET /bookings/my', () => {
  const myBookings = (query: string, token = ownerToken) =>
    request(app).get(`/bookings/my?${query}`).set('Authorization', `Bearer ${token}`);


  const pastBooking = (hoursAgo: number) =>
    prisma.booking.create({
      data: {
        roomId: roomAId,
        userId: ownerId,
        title: `Минуле ${hoursAgo}`,
        startsAt: new Date(Date.now() - hoursAgo * 3_600_000),
        endsAt: new Date(Date.now() - (hoursAgo - 1) * 3_600_000),
      },
    });

  it('без токена - 401', async () => {
    const response = await request(app).get('/bookings/my?scope=upcoming');

    expect(response.status).toBe(401);
  });

  it('невідомий scope - 400', async () => {
    const response = await myBookings('scope=усі');

    expect(response.status).toBe(400);
  });

  it('майбутні: найближче зверху, чужі й скасовані не показуються', async () => {
    const later = await book(ownerToken, roomAId, slot(120));
    const sooner = await book(ownerToken, roomAId, slot(0));
    const canceled = await book(ownerToken, roomAId, slot(240));
    await book(strangerToken, roomBId, slot(0));

    await request(app)
      .delete(`/bookings/${canceled.body.booking.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    const response = await myBookings('scope=upcoming');
    const ids = response.body.bookings.map((booking: { id: string }) => booking.id);

    expect(ids).toEqual([sooner.body.booking.id, later.body.booking.id]);
  });

  it('рядок несе кімнату (id для переходу в сітку та назва для показу)', async () => {
    await book(ownerToken, roomAId, slot(0));

    const response = await myBookings('scope=upcoming');

    expect(response.body.bookings[0].room).toEqual({
      id: roomAId,
      name: ROOM_A,
    });
  });

  it('минулі: останнє зверху', async () => {
    await pastBooking(5);
    await pastBooking(50);

    const response = await myBookings('scope=past');
    const titles = response.body.bookings.map((booking: { title: string }) => booking.title);

    expect(titles).toEqual(['Минуле 5', 'Минуле 50']);
  });

  it('пагінація курсором віддає решту без повторів', async () => {
    await pastBooking(5);
    await pastBooking(50);
    await pastBooking(100);

    const first = await myBookings('scope=past&limit=2');
    const second = await myBookings(`scope=past&limit=2&cursor=${first.body.nextCursor}`);

    const firstIds = first.body.bookings.map((booking: { id: string }) => booking.id);
    const secondIds = second.body.bookings.map((booking: { id: string }) => booking.id);

    expect(firstIds).toHaveLength(2);
    expect(secondIds).toHaveLength(1);
    expect(firstIds).not.toContain(secondIds[0]);
    expect(second.body.nextCursor).toBeNull();
  });

  it('коли сторінка остання, курсора немає', async () => {
    await pastBooking(5);

    const response = await myBookings('scope=past&limit=20');

    expect(response.body.nextCursor).toBeNull();
  });

  it('total рахує всі записи секції, а не сторінку', async () => {
    await pastBooking(5);
    await pastBooking(50);
    await pastBooking(100);

    const response = await myBookings('scope=past&limit=2');

    expect(response.body.bookings).toHaveLength(2);
    expect(response.body.total).toBe(3);
  });
});

describe('GET /bookings/my/current', () => {
  const myCurrent = (token = ownerToken) =>
    request(app).get('/bookings/my/current').set('Authorization', `Bearer ${token}`);

  const runningBooking = () =>
    prisma.booking.create({
      data: {
        roomId: roomAId,
        userId: ownerId,
        title: 'Триває',
        startsAt: new Date(Date.now() - 30 * 60_000),
        endsAt: new Date(Date.now() + 30 * 60_000),
      },
    });

  it('без бронювань - null', async () => {
    const response = await myCurrent();

    expect(response.status).toBe(200);
    expect(response.body.booking).toBeNull();
  });

  it('найближче майбутнє з місткістю й поверхом', async () => {
    await book(ownerToken, roomAId, slot(120));
    const sooner = await book(ownerToken, roomAId, slot(0));

    const response = await myCurrent();

    expect(response.body.booking.id).toBe(sooner.body.booking.id);
    expect(response.body.booking.room).toEqual({
      id: roomAId,
      name: ROOM_A,
      floor: 1,
      capacity: 4,
    });
  });

  it('те, що триває зараз, має пріоритет над майбутнім', async () => {
    await book(ownerToken, roomAId, slot(0));
    const running = await runningBooking();

    const response = await myCurrent();

    expect(response.body.booking.id).toBe(running.id);
  });

  it('чуже бронювання не показується', async () => {
    await book(strangerToken, roomBId, slot(0));

    const response = await myCurrent();

    expect(response.body.booking).toBeNull();
  });
});

describe('DELETE /bookings/:id', () => {
  it('своє бронювання скасовується', async () => {
    const created = await book(ownerToken, roomAId, slot(0));
    const response = await request(app)
      .delete(`/bookings/${created.body.booking.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(204);
  });

  it('чуже бронювання не скасовується навіть прямим запитом до API', async () => {
    const created = await book(ownerToken, roomAId, slot(0));
    const response = await request(app)
      .delete(`/bookings/${created.body.booking.id}`)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Це не ваше бронювання');

    const stillActive = await prisma.booking.findFirst({
      where: { id: created.body.booking.id, canceledAt: null },
    });
    expect(stillActive).not.toBeNull();
  });

  it('скасоване звільняє слот', async () => {
    const times = slot(0);
    const created = await book(ownerToken, roomAId, times);

    await request(app)
      .delete(`/bookings/${created.body.booking.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    const response = await book(strangerToken, roomAId, times);

    expect(response.status).toBe(201);
  });

  it('повторне скасування - 404', async () => {
    const created = await book(ownerToken, roomAId, slot(0));
    const url = `/bookings/${created.body.booking.id}`;

    await request(app).delete(url).set('Authorization', `Bearer ${ownerToken}`);
    const response = await request(app).delete(url).set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(404);
  });

  it('бронювання, що вже почалося не скасувати', async () => {
    const startsAt = new Date(Date.now() - 60 * 60_000);
    const booking = await prisma.booking.create({
      data: {
        roomId: roomAId,
        userId: ownerId,
        title: 'Уже триває',
        startsAt,
        endsAt: new Date(startsAt.getTime() + 2 * 60 * 60_000),
      },
    });

    const response = await request(app)
      .delete(`/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Бронювання вже почалося');
  });

  it('неіснуючий id - 404', async () => {
    const response = await request(app)
      .delete('/bookings/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(404);
  });

  it('битий id - 400', async () => {
    const response = await request(app)
      .delete('/bookings/не-uuid')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(400);
  });
});
