export type RoomChange = {
  roomId: string;
  startsAt: string;
  endsAt: string;
};

type RoomHandlers = {
  onChange: (change: RoomChange) => void;
  // виклик після відновлення зʼєднання
  onResume: () => void;
};

const MAX_DELAY_MS = 10_000;

const listeners = new Map<string, Set<RoomHandlers>>();

let socket: WebSocket | null = null;
let getToken: () => string | null = () => null;
let running = false;
let ready = false;
// чи вже було хоч одне успішне зʼєднання
let everReady = false;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function wsUrl(): string {
  return `${import.meta.env.VITE_API_URL.replace(/^http/, 'ws')}/ws`;
}

function send(data: unknown): void {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
}

export function startRealtime(tokenProvider: () => string | null): void {
  getToken = tokenProvider;
  running = true;
  everReady = false;
  connect();
}

export function stopRealtime(): void {
  running = false;
  ready = false;
  everReady = false;
  reconnectAttempts = 0;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    // прибираємо onclose, щоб навмисне закриття не запускало реконект
    socket.onclose = null;
    socket.close();
    socket = null;
  }
}

function connect(): void {
  const token = getToken();
  if (!running || !token) return;

  const ws = new WebSocket(wsUrl());
  socket = ws;

  ws.onopen = () => {
    // автентифікація першим повідомленням, щоб не світити токеном потім
    send({ type: 'auth', token });
  };

  ws.onmessage = (event) => {
    const message = parse(event.data);
    if (!message) return;

    if (message.type === 'ready') {
      ready = true;
      reconnectAttempts = 0;
      const reconnected = everReady;
      everReady = true;
      // підписка\перепідписка на всі активні кімнати
      for (const roomId of listeners.keys()) send({ type: 'subscribe', roomId });

      if (reconnected) {
        for (const set of listeners.values()) {
          for (const handlers of set) handlers.onResume();
        }
      }
      return;
    }

    if (message.type === 'room-changed') {
      const set = listeners.get(message.roomId);
      if (!set) return;
      for (const handlers of set) handlers.onChange(message);
    }
  };

  ws.onclose = () => {
    ready = false;
    socket = null;
    scheduleReconnect();
  };

  ws.onerror = () => {
    // слідом прийде onclose, який і запланує реконект
    ws.close();
  };
}

function scheduleReconnect(): void {
  if (!running) return;
  const delay = Math.min(1000 * 2 ** reconnectAttempts, MAX_DELAY_MS);
  reconnectAttempts += 1;
  reconnectTimer = setTimeout(connect, delay);
}

export function subscribeRoom(roomId: string, handlers: RoomHandlers): () => void {
  let set = listeners.get(roomId);
  const isNewRoom = !set;
  if (!set) {
    set = new Set();
    listeners.set(roomId, set);
  }
  set.add(handlers);

  // канал на сервері потрібен лише раз на кімнату
  if (isNewRoom && ready) send({ type: 'subscribe', roomId });

  return () => {
    const current = listeners.get(roomId);
    if (!current) return;
    current.delete(handlers);
    if (current.size === 0) {
      listeners.delete(roomId);
      if (ready) send({ type: 'unsubscribe', roomId });
    }
  };
}

type ServerMessage = { type: 'ready' } | ({ type: 'room-changed' } & RoomChange);

function parse(raw: unknown): ServerMessage | null {
  if (typeof raw !== 'string') return null;
  try {
    const data = JSON.parse(raw) as ServerMessage;
    if (data.type === 'ready' || data.type === 'room-changed') return data;
    return null;
  } catch {
    return null;
  }
}
