import { formatInTimeZone } from 'date-fns-tz';

const KYIV_TIME_ZONE = 'Europe/Kyiv';
const SLOT_MINUTES = 30;
const MIN_DURATION_MINUTES = 30;
const MAX_DURATION_MINUTES = 240;
const WORK_START_MINUTES = 9 * 60;
const WORK_END_MINUTES = 19 * 60;

const MS_IN_MINUTE = 60_000;

const DURATION_UNITS = {
  ms: 1,
  s: 1_000,
  m: MS_IN_MINUTE,
  h: 60 * MS_IN_MINUTE,
  d: 24 * 60 * MS_IN_MINUTE,
} as const;

type DurationUnit = keyof typeof DURATION_UNITS;

// формат той самий що і jwt - 15m, 24h, 7d
export function expiresAt(now: Date, duration: string): Date {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration);
  const amount = Number(match?.[1]);
  const unit = match?.[2] as DurationUnit | undefined;

  if (!unit || Number.isNaN(amount)) {
    throw new Error(`Некоректний формат тривалості: ${duration}`);
  }

  return new Date(now.getTime() + amount * DURATION_UNITS[unit]);
}

export type IntervalIssue = 'NOT_ALIGNED' | 'BAD_DURATION' | 'OUTSIDE_WORKING_HOURS' | 'IN_PAST';

export type IntervalCheck = { ok: true } | { ok: false; reason: IntervalIssue };


function isAlignedToSlot(date: Date): boolean {
  return date.getTime() % (SLOT_MINUTES * MS_IN_MINUTE) === 0;
}

function hasAllowedDuration(startsAt: Date, endsAt: Date): boolean {
  const minutes = (endsAt.getTime() - startsAt.getTime()) / MS_IN_MINUTE;
  return minutes >= MIN_DURATION_MINUTES && minutes <= MAX_DURATION_MINUTES;
}

function toKyivDayAndMinutes(date: Date): { day: string; minutes: number } {
  // yyyy-MM-dd HH:mm є фіксованим тому використання slice це мікро оптимізація(вау зекономив кілька байт пам'яті)
  const stamp = formatInTimeZone(date, KYIV_TIME_ZONE, 'yyyy-MM-dd HH:mm');

  return {
    day: stamp.slice(0, 10),
    minutes: Number(stamp.slice(11, 13)) * 60 + Number(stamp.slice(14, 16)),
  };
}

// Звірка дня обов'язкова потрібно щоб не проходили кейси по типу 00:00 < 19:00
function isWithinWorkingHours(startsAt: Date, endsAt: Date): boolean {
  const start = toKyivDayAndMinutes(startsAt);
  const end = toKyivDayAndMinutes(endsAt);

  return (
    start.day === end.day &&
    start.minutes >= WORK_START_MINUTES &&
    end.minutes <= WORK_END_MINUTES
  );
}

export function isInFuture(date: Date, now: Date): boolean {
  return date.getTime() > now.getTime();
}



export function validateBookingInterval(startsAt: Date, endsAt: Date, now: Date): IntervalCheck {
  if (!isAlignedToSlot(startsAt) || !isAlignedToSlot(endsAt)) {
    return { ok: false, reason: 'NOT_ALIGNED' };
  }

  if (!hasAllowedDuration(startsAt, endsAt)) {
    return { ok: false, reason: 'BAD_DURATION' };
  }

  if (!isWithinWorkingHours(startsAt, endsAt)) {
    return { ok: false, reason: 'OUTSIDE_WORKING_HOURS' };
  }

  if (!isInFuture(startsAt, now)) {
    return { ok: false, reason: 'IN_PAST' };
  }

  return { ok: true };
}
