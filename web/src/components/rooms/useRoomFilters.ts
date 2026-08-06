import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  MAX_DURATION_MIN,
  SLOT_MIN,
  WORK_END_MIN,
  WORK_START_MIN,
  defaultRange,
} from '../../lib/time';

// Стан фільтрів кімнат живе URL
// посилання можна поділитися
export type RoomFilters = {
  date: Date;
  fromMin: number;
  toMin: number;
  onlyFree: boolean;
  floors: number[];
  minCapacity: number;
};

const pad = (n: number) => String(n).padStart(2, '0');
const minToHHMM = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const restrictRange = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const snapToSlot = (m: number) => Math.round(m / SLOT_MIN) * SLOT_MIN;

function parseHHMM(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const total = Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  return Number.isFinite(total) ? total : fallback;
}

function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  if (y && m && d) return new Date(y, m - 1, d);
  return new Date();
}

function parse(params: URLSearchParams): RoomFilters {
  // без параметрів - від поточного часу
  const def = defaultRange();
  const dateParam = params.get('date');

  // нормалізуємо from/to до робочого часу і 30 хв
  const fromMin = restrictRange(
    snapToSlot(parseHHMM(params.get('from'), def.fromMin)),
    WORK_START_MIN,
    WORK_END_MIN - SLOT_MIN,
  );
  const toMin = restrictRange(
    snapToSlot(parseHHMM(params.get('to'), def.toMin)),
    fromMin + SLOT_MIN,
    Math.min(WORK_END_MIN, fromMin + MAX_DURATION_MIN),
  );

  return {
    date: dateParam ? parseDate(dateParam) : def.date,
    fromMin,
    toMin,
    onlyFree: params.get('free') === '1',
    floors: (params.get('floors') ?? '')
      .split(',')
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0),
    minCapacity: Number(params.get('cap')) || 0,
  };
}

function toUrl(filters: RoomFilters): URLSearchParams {
  const params = new URLSearchParams();
  const { date } = filters;
  params.set('date', `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);
  params.set('from', minToHHMM(filters.fromMin));
  params.set('to', minToHHMM(filters.toMin));
  if (filters.onlyFree) params.set('free', '1');
  if (filters.floors.length > 0) params.set('floors', filters.floors.join(','));
  if (filters.minCapacity > 0) params.set('cap', String(filters.minCapacity));
  return params;
}

type Patch = Partial<RoomFilters> | ((prev: RoomFilters) => Partial<RoomFilters>);

export function useRoomFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // мемо за рядком URL
  const key = searchParams.toString();
  const filters = useMemo(() => parse(new URLSearchParams(key)), [key]);

  const update = (patch: Patch) => {
    // рахуємо від актуального URL, а не від filters що уникнути випадків замикання
    setSearchParams(
      (prevParams) => {
        const prev = parse(prevParams);
        const changed = typeof patch === 'function' ? patch(prev) : patch;
        return toUrl({ ...prev, ...changed });
      },
      // щоб кожна зміна фільтра не засмічувало історію браузера
      { replace: true },
    );
  };

  return { filters, update };
}
