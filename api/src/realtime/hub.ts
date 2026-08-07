import type { Server } from 'node:http';

import type { RawData } from 'ws';
import { WebSocket, WebSocketServer } from 'ws';

import { env } from '../config/env.js';
import { verifyAccessToken } from '../services/tokens.js';

// сигнал несе лише де відбулися зміни
export type RoomChange = {
  roomId: string;
  startsAt: Date;
  endsAt: Date;
};

type ClientState = {
  authed: boolean;
  isAlive: boolean;
  rooms: Set<string>;
};

type ClientMessage =
  | { type: 'auth'; token: string }
  | { type: 'subscribe'; roomId: string }
  | { type: 'unsubscribe'; roomId: string };

const AUTH_TIMEOUT_MS = 10_000;
const HEARTBEAT_MS = 30_000;
// власний код закриття
const CLOSE_UNAUTHORIZED = 4401;

// канал на кімнату roomId -> сокети
const channels = new Map<string, Set<WebSocket>>();
// вебсокет -> його стан
const states = new WeakMap<WebSocket, ClientState>();

let wss: WebSocketServer | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;

export function attachRealtime(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws', verifyClient: allowOrigin });
  wss.on('connection', onConnection);

  // періодично відсіюємо мертві сокети
  heartbeat = setInterval(() => {
    if (!wss) return;
    for (const socket of wss.clients) {
      const state = states.get(socket);
      if (!state) continue;
      if (!state.isAlive) {
        socket.terminate();
        continue;
      }
      state.isAlive = false;
      socket.ping();
    }
  }, HEARTBEAT_MS);
  //не блокує завершення процесу
  heartbeat.unref();
}

// звільняє ресурси використовується для тестів
export function closeRealtime(): Promise<void> {
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
  const server = wss;
  wss = null;
  channels.clear();

  return new Promise((resolve) => {
    if (!server) {
      resolve();
      return;
    }
    for (const socket of server.clients) socket.terminate();
    server.close(() => resolve());
  });
}

// чужий origin відсікаємо
// тести, сервер-сервер Origin не шлють - пропускаємо
function allowOrigin(info: { origin: string }): boolean {
  return !info.origin || info.origin === env.WEB_ORIGIN;
}

function onConnection(socket: WebSocket): void {
  const state: ClientState = { authed: false, isAlive: true, rooms: new Set() };
  states.set(socket, state);

  // не автентифікувався - довго не висить
  const authTimer = setTimeout(() => {
    if (!state.authed) socket.close(CLOSE_UNAUTHORIZED, 'auth timeout');
  }, AUTH_TIMEOUT_MS);
  authTimer.unref();

  socket.on('pong', () => {
    state.isAlive = true;
  });

  socket.on('message', (raw) => {
    const message = parseMessage(raw);
    if (!message) return;

    if (message.type === 'auth') {
      handleAuth(socket, state, authTimer, message.token);
      return;
    }

    // до успішної автентифікації решту команд ігноруємо
    if (!state.authed) return;

    if (message.type === 'subscribe') joinChannel(socket, state, message.roomId);
    else leaveChannel(socket, state, message.roomId);
  });

  socket.on('close', () => {
    clearTimeout(authTimer);
    for (const roomId of state.rooms) removeFromChannel(roomId, socket);
  });
}

function handleAuth(
  socket: WebSocket,
  state: ClientState,
  authTimer: ReturnType<typeof setTimeout>,
  token: string,
): void {
  if (state.authed) return;

  try {
    verifyAccessToken(token);

    state.authed = true;
    clearTimeout(authTimer);

    sendJson(socket, { type: 'ready' });
  } catch {
    socket.close(CLOSE_UNAUTHORIZED, 'invalid token');
  }
}

function joinChannel(socket: WebSocket, state: ClientState, roomId: string): void {
  state.rooms.add(roomId);
  let set = channels.get(roomId);
  if (!set) {
    set = new Set();
    channels.set(roomId, set);
  }
  set.add(socket);
}

function leaveChannel(socket: WebSocket, state: ClientState, roomId: string): void {
  state.rooms.delete(roomId);
  removeFromChannel(roomId, socket);
}

function removeFromChannel(roomId: string, socket: WebSocket): void {
  const set = channels.get(roomId);
  if (!set) return;
  set.delete(socket);
  if (set.size === 0) channels.delete(roomId);
}

// шле сигнал усім, хто дивиться цю кімнату
export function publishRoomChange(change: RoomChange): void {
  const set = channels.get(change.roomId);
  if (!set || set.size === 0) return;

  const message = JSON.stringify({
    type: 'room-changed',
    roomId: change.roomId,
    startsAt: change.startsAt.toISOString(),
    endsAt: change.endsAt.toISOString(),
  });

  for (const socket of set) {
    if (socket.readyState !== WebSocket.OPEN) continue;
    // збій одного сокета не має валити розсилку іншим
    try {
      socket.send(message);
    } catch {
      // ігноруємо
    }
  }
}

function parseMessage(raw: RawData): ClientMessage | null {
  let data: unknown;
  try {
    data = JSON.parse(raw.toString());
  } catch {
    return null;
  }

  if (typeof data !== 'object' || data === null || !('type' in data)) return null;
  const value = data as Record<string, unknown>;

  if (value.type === 'auth' && typeof value.token === 'string') {
    return { type: 'auth', token: value.token };
  }
  if (value.type === 'subscribe' && typeof value.roomId === 'string') {
    return { type: 'subscribe', roomId: value.roomId };
  }
  if (value.type === 'unsubscribe' && typeof value.roomId === 'string') {
    return { type: 'unsubscribe', roomId: value.roomId };
  }
  return null;
}

function sendJson(socket: WebSocket, data: unknown): void {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
}
