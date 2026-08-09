import { formatInTimeZone } from 'date-fns-tz';
import { describe, expect, it } from 'vitest';

import { addWeeksKyiv, expiresAt, isInFuture, validateBookingInterval } from '../../src/lib/time.js';

const NOW = new Date('2026-07-28T00:00:00Z');

const check = (startsAt: string, endsAt: string, now: Date = NOW) =>
  validateBookingInterval(new Date(startsAt), new Date(endsAt), now);

describe('робочі години 09:00-19:00 Києва', () => {
  it('о 09:00 - можна', () => {
    expect(check('2026-08-03T06:00:00Z', '2026-08-03T07:00:00Z')).toEqual({ ok: true });
  });

  it('08:30 - зарано', () => {
    expect(check('2026-08-03T05:30:00Z', '2026-08-03T06:30:00Z')).toEqual({
      ok: false,
      reason: 'OUTSIDE_WORKING_HOURS',
    });
  });

  it('о 19:00 - можна', () => {
    expect(check('2026-08-03T15:00:00Z', '2026-08-03T16:00:00Z')).toEqual({ ok: true });
  });

  it('о 19:30 - запізно', () => {
    expect(check('2026-08-03T15:30:00Z', '2026-08-03T16:30:00Z')).toEqual({
      ok: false,
      reason: 'OUTSIDE_WORKING_HOURS',
    });
  });

  // Той самий час utc дає різні години на київському годинику залежно від пори року\сезону
  it('узимку 07:00Z це 09:00 Києва - можна', () => {
    expect(check('2026-12-07T07:00:00Z', '2026-12-07T08:00:00Z')).toEqual({ ok: true });
  });

  it('узимку 06:00Z це 08:00 Києва - зарано', () => {
    expect(check('2026-12-07T06:00:00Z', '2026-12-07T07:00:00Z')).toEqual({
      ok: false,
      reason: 'OUTSIDE_WORKING_HOURS',
    });
  });

  it('кінець опівночі не проходить не зважаючи на 00:00 <= 19:00', () => {
    expect(check('2026-08-03T18:00:00Z', '2026-08-03T21:00:00Z')).toEqual({
      ok: false,
      reason: 'OUTSIDE_WORKING_HOURS',
    });
  });
});

describe('кратність 30 хвилин', () => {
  it('початок о 10:15 - не можна', () => {
    expect(check('2026-08-03T07:15:00Z', '2026-08-03T08:15:00Z')).toEqual({
      ok: false,
      reason: 'NOT_ALIGNED',
    });
  });

  it('непорожні секунди - не можна', () => {
    expect(check('2026-08-03T07:00:30Z', '2026-08-03T08:00:00Z')).toEqual({
      ok: false,
      reason: 'NOT_ALIGNED',
    });
  });
});

describe('тривалість 30 хв - 4 год', () => {
  it('рівно 30 хвилин - можна', () => {
    expect(check('2026-08-03T07:00:00Z', '2026-08-03T07:30:00Z')).toEqual({ ok: true });
  });

  it('рівно 4 години - можна', () => {
    expect(check('2026-08-03T07:00:00Z', '2026-08-03T11:00:00Z')).toEqual({ ok: true });
  });

  it('4 години 30 хвилин - задовго', () => {
    expect(check('2026-08-03T07:00:00Z', '2026-08-03T11:30:00Z')).toEqual({
      ok: false,
      reason: 'BAD_DURATION',
    });
  });

  it('нульова тривалість - закоротко', () => {
    expect(check('2026-08-03T07:00:00Z', '2026-08-03T07:00:00Z')).toEqual({
      ok: false,
      reason: 'BAD_DURATION',
    });
  });

  it('кінець раніше за початок', () => {
    expect(check('2026-08-03T08:00:00Z', '2026-08-03T07:00:00Z')).toEqual({
      ok: false,
      reason: 'BAD_DURATION',
    });
  });
});

describe('лише майбутнє', () => {
  it('минулий день', () => {
    expect(check('2026-07-27T07:00:00Z', '2026-07-27T08:00:00Z')).toEqual({
      ok: false,
      reason: 'IN_PAST',
    });
  });

  it('початок рівно зараз уже не майбутнє', () => {
    const now = new Date('2026-08-03T07:00:00Z');

    expect(check('2026-08-03T07:00:00Z', '2026-08-03T08:00:00Z', now)).toEqual({
      ok: false,
      reason: 'IN_PAST',
    });
  });

  it('початок через 30 хвилин', () => {
    const now = new Date('2026-08-03T07:00:00Z');

    expect(check('2026-08-03T07:30:00Z', '2026-08-03T08:30:00Z', now)).toEqual({ ok: true });
  });
});

// структурні правила перевіряються першими потім потім вже робочі години, чи в минулому і тд
it('при кількох порушеннях повертається структурне', () => {
  expect(check('2026-07-27T22:15:00Z', '2026-07-27T23:15:00Z')).toEqual({
    ok: false,
    reason: 'NOT_ALIGNED',
  });
});

describe('expiresAt', () => {
  const now = new Date('2026-08-03T07:00:00Z');

  it('хвилини, години, дні', () => {
    expect(expiresAt(now, '15m').toISOString()).toBe('2026-08-03T07:15:00.000Z');
    expect(expiresAt(now, '24h').toISOString()).toBe('2026-08-04T07:00:00.000Z');
    expect(expiresAt(now, '7d').toISOString()).toBe('2026-08-10T07:00:00.000Z');
  });

  it('невідомий формат - помилка', () => {
    expect(() => expiresAt(now, 'тиждень')).toThrow();
    expect(() => expiresAt(now, '7')).toThrow();
  });
});

describe('addWeeksKyiv - зсув у стінному часі Києва', () => {
  const kyivHm = (date: Date) => formatInTimeZone(date, 'Europe/Kyiv', 'HH:mm');

  it('через осінній перехід DST зберігає локальний час', () => {
    const before = new Date('2026-10-20T08:00:00Z');
    const after = addWeeksKyiv(before, 1);

    expect(kyivHm(before)).toBe('11:00');
    expect(kyivHm(after)).toBe('11:00');
    // utc б було 10:00
    expect(after.toISOString()).toBe('2026-10-27T09:00:00.000Z');
  });

  it('нуль тижнів - той самий момент', () => {
    const date = new Date('2026-08-03T07:00:00Z');
    expect(addWeeksKyiv(date, 0).toISOString()).toBe(date.toISOString());
  });

  it('поза переходом - рівно +7 днів', () => {
    expect(addWeeksKyiv(new Date('2026-08-03T07:00:00Z'), 2).toISOString()).toBe(
      '2026-08-17T07:00:00.000Z',
    );
  });
});

describe('isInFuture функція', () => {
  const now = new Date('2026-08-03T07:00:00Z');

  it('момент рівно зараз', () => {
    expect(isInFuture(new Date('2026-08-03T07:00:00Z'), now)).toBe(false);
  });

  it('мілісекунда після зараз', () => {
    expect(isInFuture(new Date('2026-08-03T07:00:00.001Z'), now)).toBe(true);
  });
});
