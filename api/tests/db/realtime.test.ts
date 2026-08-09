import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import request from 'supertest';
import WebSocket, { type RawData } from 'ws';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { attachRealtime, closeRealtime } from '../../src/realtime/hub.js';

const USER = 'realtime-user@gmail.com';
const PASSWORD = 'parol12345';
const ROOM = 'realtime-test-room';

let server: Server;
let port: number;
let token: string;
let roomId: string;

// сокети, відкриті в тесті - закриваємо після кожного, щоб не текли
const openSockets: WebSocket[] = [];

type RoomChangeMsg = { type: 'room-changed'; roomId: string; startsAt: string; endsAt: string };

function nextMonday(): Date {
  const date = new Date();
  date.setUTCHours(7, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + ((8 - date.getUTCDay()) % 7 || 7));

  return date;
}

function slot(offsetMinutes = 0, durationMinutes = 60) {
  const startsAt = new Date(nextMonday().getTime() + offsetMinutes * 60_000);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function book(times: { startsAt: string; endsAt: string }) {
  return request(app)
    .post('/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ roomId, title: 'Синк', ...times });
}

function cancel(id: string) {
  return request(app).delete(`/bookings/${id}`).set('Authorization', `Bearer ${token}`);
}

// підключається і резолвиться після успішної автентифікації (сигнал ready)
function connect(authToken = token): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    openSockets.push(ws);

    ws.on('open', () => ws.send(JSON.stringify({ type: 'auth', token: authToken })));
    ws.on('message', (raw) => {
      if (parse(raw)?.type === 'ready') resolve(ws);
    });
    ws.on('error', reject);
    setTimeout(() => reject(new Error('ready не прийшов')), 3000);
  });
}

function subscribe(ws: WebSocket, id: string) {
  ws.send(JSON.stringify({ type: 'subscribe', roomId: id }));
}

// чекає на наступний сигнал room-changed; null, якщо за відведений час не прийшов
function waitChange(ws: WebSocket, ms = 2000): Promise<RoomChangeMsg | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      ws.off('message', onMessage);
      resolve(null);
    }, ms);

    function onMessage(raw: RawData) {
      const message = parse(raw);
      if (message?.type === 'room-changed') {
        clearTimeout(timer);
        ws.off('message', onMessage);
        resolve(message as unknown as RoomChangeMsg);
      }
    }

    ws.on('message', onMessage);
  });
}

function parse(raw: RawData): { type: string } & Record<string, unknown> {
  return JSON.parse(raw.toString());
}

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: USER } });

  const room = await prisma.room.upsert({
    where: { name: ROOM },
    update: {},
    create: { name: ROOM, imageUrl: 'https://example.invalid/room.jpg', capacity: 6, floor: 1 },
  });
  roomId = room.id;

  const registered = await request(app)
    .post('/auth/register')
    .send({ email: USER, password: PASSWORD, firstName: 'Тест', lastName: 'Реалтайм' });
  token = registered.body.accessToken;
  // гейт бронювання вимагає підтвердженого email
  await prisma.user.update({
    where: { id: registered.body.user.id },
    data: { emailVerifiedAt: new Date() },
  });

  server = createServer(app);
  attachRealtime(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  port = (server.address() as AddressInfo).port;
});

beforeEach(async () => {
  await prisma.booking.deleteMany({ where: { roomId } });
});

afterEach(() => {
  while (openSockets.length) openSockets.pop()?.close();
});

afterAll(async () => {
  await closeRealtime();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.booking.deleteMany({ where: { roomId } });
  await prisma.user.deleteMany({ where: { email: USER } });
  await prisma.room.deleteMany({ where: { name: ROOM } });
  await prisma.$disconnect();
});

describe('WebSocket realtime', () => {
  it('створення бронювання шле сигнал підписникам кімнати', async () => {
    const ws = await connect();
    subscribe(ws, roomId);
    await delay(50);

    const times = slot(0);
    const pending = waitChange(ws);
    await book(times);
    const change = await pending;

    expect(change).not.toBeNull();
    expect(change?.roomId).toBe(roomId);
    expect(change?.startsAt).toBe(times.startsAt);
  });

  it('скасування бронювання теж шле сигнал', async () => {
    const created = await book(slot(0));
    const ws = await connect();
    subscribe(ws, roomId);
    await delay(50);

    const pending = waitChange(ws);
    await cancel(created.body.booking.id);
    const change = await pending;

    expect(change?.roomId).toBe(roomId);
  });

  it('після відписки сигнал не приходить', async () => {
    const ws = await connect();
    subscribe(ws, roomId);
    await delay(50);
    ws.send(JSON.stringify({ type: 'unsubscribe', roomId }));
    await delay(50);

    const pending = waitChange(ws, 500);
    await book(slot(0));

    expect(await pending).toBeNull();
  });

  it('підписник іншої кімнати не отримує чужих сигналів', async () => {
    const ws = await connect();
    subscribe(ws, '00000000-0000-4000-8000-000000000000');
    await delay(50);

    const pending = waitChange(ws, 500);
    await book(slot(0));

    expect(await pending).toBeNull();
  });

  it('невалідний токен закриває сокет кодом 4401', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    openSockets.push(ws);

    const code = await new Promise<number>((resolve, reject) => {
      ws.on('open', () => ws.send(JSON.stringify({ type: 'auth', token: 'bad.token.value' })));
      ws.on('close', (closeCode) => resolve(closeCode));
      setTimeout(() => reject(new Error('сокет не закрився')), 3000);
    });

    expect(code).toBe(4401);
  });
});
