import { useEffect, useRef } from 'react';

import { useGetEndReminderQuery } from '../store/api/bookingsApi';
import { toast } from './toast';

const POLL_INTERVAL_MS = 180_000;
// останнє показане бронювання - щоб не нагадувати двічі навіть після перезавантаження
const SHOWN_KEY = 'end-reminder-last';

// нагадує звільнити кімнату рівно за N хв до кінця бронювання, якщо наступний слот зайнятий
// сервер повертає чи є близько бронювання для якого треба нагадування
// ставимо таймер на момент (endsAt - N) і показуємо
export function useEndReminder(): void {
  const { data: reminder } = useGetEndReminderQuery(undefined, {
    pollingInterval: POLL_INTERVAL_MS,
    skipPollingIfUnfocused: true,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clear = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    // якщо скасували бронювання після нашого щоб якщо вже запланували показувати прибрати
    if (!reminder) {
      clear();
      return;
    }

    const show = () => {
      // за час таймера бронювання могло змінитись - звіряємось ще раз
      if (localStorage.getItem(SHOWN_KEY) === reminder.bookingId) return;

      const leftMin = Math.max(
        1,
        Math.round((new Date(reminder.endsAt).getTime() - Date.now()) / 60_000),
      );
      toast.warning(
        'Бронювання завершується',
        `«${reminder.title}» у «${reminder.roomName}» - звільніть кімнату за ${leftMin} хв`,
      );
      localStorage.setItem(SHOWN_KEY, reminder.bookingId);
    };

    if (localStorage.getItem(SHOWN_KEY) === reminder.bookingId) return clear;

    const fireAt = new Date(reminder.endsAt).getTime() - reminder.minutes * 60_000;
    const delay = fireAt - Date.now();

    //якщо запізнилися всеодно показуємо
    if (delay <= 0) show();
    else timerRef.current = setTimeout(show, delay);

    return clear;
  }, [reminder]);
}
