import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { fromZonedTime } from 'date-fns-tz';

// робочі години в київському часі, а конвертуємо при показі в пояс браузера
export const KYIV_TZ = 'Europe/Kyiv';
export const WORK_START_MIN = 9 * 60;
export const WORK_END_MIN = 19 * 60;
export const SLOT_MIN = 30;
export const MAX_DURATION_MIN = 4 * 60;

const pad = (n: number) => String(n).padStart(2, '0');

// київський час до Utc
export function kyivMinutesToUtc(date: Date, minutes: number): Date {
  const wall =
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`;
  return fromZonedTime(wall, KYIV_TZ);
}

// підпис слота у поясі браузера
export function slotLabel(date: Date, minutes: number): string {
  return format(kyivMinutesToUtc(date, minutes), 'HH:mm');
}

// ISO для запиту
export function slotToIso(date: Date, minutes: number): string {
  return kyivMinutesToUtc(date, minutes).toISOString();
}

export function formatDateLabel(date: Date): string {
  return format(date, 'EEEEEE, dd.MM.yyyy', { locale: uk });
}

export function formatMonthLabel(date: Date): string {
  return format(date, 'LLLL yyyy', { locale: uk });
}

// зсув пояса браузера - "GMT+3" і тд
export function browserGmtLabel(): string {
  return format(new Date(), 'OOO');
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// для приглушення минулих дат у календарі
export function isBeforeDay(target: Date, ref: Date): boolean {
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const r = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  return t.getTime() < r.getTime();
}


export function isSlotPast(date: Date, minutes: number, now: Date = new Date()): boolean {
  return kyivMinutesToUtc(date, minutes).getTime() <= now.getTime();
}

// стартові фільтри: перший ще не минулий слот від «зараз» (кінець +30 хв);
// якщо робочий день сьогодні вже завершився — завтра з початку робочого дня
// стартові фільтри 2 варіанти
// 1) перший слот сьогодні що ще не в минулому
// 2) наступний день перший найперший слот
export function defaultRange(now: Date = new Date()): {
  date: Date;
  fromMin: number;
  toMin: number;
} {
  const today = new Date(now);
  for (let m = WORK_START_MIN; m <= WORK_END_MIN - SLOT_MIN; m += SLOT_MIN) {
    if (!isSlotPast(today, m, now)) {
      return { date: today, fromMin: m, toMin: m + SLOT_MIN };
    }
  }
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { date: tomorrow, fromMin: WORK_START_MIN, toMin: WORK_START_MIN + SLOT_MIN };
}
