import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { fromZonedTime, getTimezoneOffset, toZonedTime } from 'date-fns-tz';

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

// компактна дата для модалки  по типу Вт 4.серп
export function formatDayShort(date: Date): string {
  const label = format(date, 'EEEEEE, d MMM', { locale: uk });
  return label.charAt(0).toUpperCase() + label.slice(1);
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

// час у поясі браузера - 17:30
export function formatTime(iso: string): string {
  return format(new Date(iso), 'HH:mm');
}

// пн, 3 серпня
export function formatBookingDay(iso: string): string {
  return format(new Date(iso), 'eee, d MMMM', { locale: uk });
}

// yyyy-MM-dd дати для url параметрів
export function toDateParam(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// yyyy-MM-dd початку тижня
export function weekParamOf(date: Date): string {
  return toDateParam(startOfWeek(date));
}

// локальна дата на київський день моменту
export function kyivDayOf(iso: string): Date {
  const zoned = toZonedTime(new Date(iso), KYIV_TZ);
  return new Date(zoned.getFullYear(), zoned.getMonth(), zoned.getDate());
}

// хвилини від опівночі
export function minutesToHHMM(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

// "1 год 30 хв" / "45 хв"
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} год`);
  if (mins > 0) parts.push(`${mins} хв`);
  return parts.join(' ');
}

// тиждень для сітки розкладу
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// понеділок тижня, що містить дату
export function startOfWeek(date: Date): Date {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = (day.getDay() + 6) % 7; // Пн = 0
  return addDays(day, -dow);
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

// 27 лип. - 2 сер. 2026
export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  return `${format(weekStart, 'd MMM', { locale: uk })} - ${format(end, 'd MMM yyyy', { locale: uk })}`;
}

export function formatWeekday(date: Date): string {
  return format(date, 'EEEE', { locale: uk });
}


function toKyiv(iso: string): Date {
  return toZonedTime(new Date(iso), KYIV_TZ);
}

// хвилини від опівночі за Києвом
export function kyivMinutesOfDay(iso: string): number {
  const zoned = toKyiv(iso);
  return zoned.getHours() * 60 + zoned.getMinutes();
}

// чи припадає момент на цей київський день (для розкладки по колонках)
export function isSameKyivDay(iso: string, day: Date): boolean {
  const zoned = toKyiv(iso);
  return (
    zoned.getFullYear() === day.getFullYear() &&
    zoned.getMonth() === day.getMonth() &&
    zoned.getDate() === day.getDate()
  );
}

// чи пояс браузера збігається з київським
export function isKyivTimeZone(now: Date = new Date()): boolean {
  return getTimezoneOffset(KYIV_TZ, now) === -now.getTimezoneOffset() * 60_000;
}
