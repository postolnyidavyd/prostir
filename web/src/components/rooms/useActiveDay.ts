import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { addDays, isSameDay, startOfWeek, toDateParam } from '../../lib/time';

function parseDayParam(value: string): Date | null {
  const [y, m, d] = value.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

// активний день сітки для мобілки
export function useActiveDay(days: Date[], filterDate: Date) {
  const [searchParams, setSearchParams] = useSearchParams();
  const dayParam = searchParams.get('day');

  const activeDayIndex = useMemo(() => {
    const inWeek = (date: Date) => days.some((day) => isSameDay(day, date));
    const fromParams = dayParam ? parseDayParam(dayParam) : null;
    const today = new Date();

    let active = days[0]!; // фолбек понеділок тижня
    if (fromParams && inWeek(fromParams)) active = fromParams;
    else if (inWeek(today)) active = today;
    else if (inWeek(filterDate)) active = filterDate;

    return Math.max(
      0,
      days.findIndex((day) => isSameDay(day, active)),
    );
  }, [dayParam, days, filterDate]);

  const goDay = (delta: number) =>
    setSearchParams(
      (prev) => {
        const next = addDays(days[activeDayIndex] ?? days[0]!, delta);
        const params = new URLSearchParams(prev);
        params.set('day', toDateParam(next));
        // перейшли в інший тиждень тоді оновлюємо і ?week
        const nextWeekStart = startOfWeek(next);
        if (!isSameDay(nextWeekStart, days[0]!)) params.set('week', toDateParam(nextWeekStart));
        return params;
      },
      { replace: true },
    );

  return { activeDayIndex, goPrevDay: () => goDay(-1), goNextDay: () => goDay(1) };
}
