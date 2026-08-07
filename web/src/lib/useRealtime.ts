import { useEffect, useRef } from 'react';

import apiSlice from '../store/api/apiSlice';
import { selectAccessToken } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import store from '../store/store';
import { startRealtime, stopRealtime, subscribeRoom } from './realtime';

// піднімає одне WebSocket-зʼєднання, поки користувач залогінений
export function useRealtimeConnection(): void {
  const isAuthed = useAppSelector((state) => Boolean(selectAccessToken(state)));

  useEffect(() => {
    if (!isAuthed) return;
    // зʼєднання переживає ротацію токена
    startRealtime(() => selectAccessToken(store.getState()));
    return () => stopRealtime();
  }, [isAuthed]);
}

// підписує видиму сітку кімнати на живі оновлення розкладу
export function useRoomChannel(roomId: string, from: string, to: string): void {
  const dispatch = useAppDispatch();

  // вікно тижня тримаємо в ref, щоб не перепідсуватися на беку, бо from і to в хендлері чисто клієнтське рішення
  const windowRef = useRef({ from, to });
  windowRef.current = { from, to };

  useEffect(() => {
    const invalidate = () =>
      dispatch(apiSlice.util.invalidateTags([{ type: 'RoomBookings', id: roomId }, 'Rooms']));


    // на unmount викликаємо функцію що повертає subscribeRoom - ф-ія відписки
    return subscribeRoom(roomId, {
      // реагуємо лише якщо потрапляє у вікно яке дивиться користувач
      onChange: (change) => {
        const { from, to } = windowRef.current;
        if (change.startsAt < to && change.endsAt > from) invalidate();
      },
      // після реконекту видиме вікно могло застаріти - оновлюємо його
      onResume: invalidate,
    });
  }, [roomId, dispatch]);
}
