import {
  kyivDayOf,
  kyivMinutesOfDay,
  minutesToHHMM,
  toDateParam,
  weekParamOf,
} from '../../lib/time';

// лінк у розклад, одразу з прокруткою до цього бронювання
export function scheduleLinkFor(roomId: string, startsAt: string, endsAt: string): string {
  const day = kyivDayOf(startsAt);
  const params = new URLSearchParams({
    room: roomId,
    week: weekParamOf(day),
    date: toDateParam(day),
    from: minutesToHHMM(kyivMinutesOfDay(startsAt)),
    to: minutesToHHMM(kyivMinutesOfDay(endsAt)),
  });
  return `/?${params.toString()}`;
}
