import { describe, expect, it } from 'vitest';

import { intervalsOverlap, type Interval } from '../../src/lib/overlaps.js';

const interval = (startsAt: string, endsAt: string): Interval => ({
  startsAt: new Date(startsAt),
  endsAt: new Date(endsAt),
});

describe('intervalsOverlap', () => {
  it('впритул — не конфлікт', () => {
    const a = interval('2026-08-03T10:00:00Z', '2026-08-03T11:00:00Z');
    const b = interval('2026-08-03T11:00:00Z', '2026-08-03T12:00:00Z');

    expect(intervalsOverlap(a, b)).toBe(false);
    expect(intervalsOverlap(b, a)).toBe(false);
  });

  it('часткове перекриття - конфлікт', () => {
    const a = interval('2026-08-03T10:00:00Z', '2026-08-03T11:00:00Z');
    const b = interval('2026-08-03T10:30:00Z', '2026-08-03T11:30:00Z');

    expect(intervalsOverlap(a, b)).toBe(true);
    expect(intervalsOverlap(b, a)).toBe(true);
  });

  it('повний збіг - конфлікт', () => {
    const a = interval('2026-08-03T10:00:00Z', '2026-08-03T11:00:00Z');

    expect(intervalsOverlap(a, a)).toBe(true);
  });

  it('вкладений інтервал - конфлікт', () => {
    const a = interval('2026-08-03T10:00:00Z', '2026-08-03T13:00:00Z');
    const b = interval('2026-08-03T11:00:00Z', '2026-08-03T11:30:00Z');

    expect(intervalsOverlap(a, b)).toBe(true);
    expect(intervalsOverlap(b, a)).toBe(true);
  });

  it('сусідні дні, той самий час - не конфлікт', () => {
    const a = interval('2026-08-03T10:00:00Z', '2026-08-03T11:00:00Z');
    const b = interval('2026-08-04T10:00:00Z', '2026-08-04T11:00:00Z');

    expect(intervalsOverlap(a, b)).toBe(false);
  });

  it('розрив між інтервалами - не конфлікт', () => {
    const a = interval('2026-08-03T10:00:00Z', '2026-08-03T11:00:00Z');
    const b = interval('2026-08-03T14:00:00Z', '2026-08-03T15:00:00Z');

    expect(intervalsOverlap(a, b)).toBe(false);
  });

  it('перехід через добу - конфлікт з інтервалом наступного дня', () => {
    const a = interval('2026-08-03T23:00:00Z', '2026-08-04T01:00:00Z');
    const b = interval('2026-08-04T00:30:00Z', '2026-08-04T01:30:00Z');

    expect(intervalsOverlap(a, b)).toBe(true);
  });
});
