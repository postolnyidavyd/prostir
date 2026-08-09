import {
  MAX_DURATION_MIN,
  SLOT_MIN,
  WORK_END_MIN,
  WORK_START_MIN,
  slotLabel,
} from '../../lib/time';
import type { TimeOption } from './TimePicker';

// Опції пікера початку
export function fromTimeOptions(date: Date): TimeOption[] {
  const options: TimeOption[] = [];
  for (let m = WORK_START_MIN; m <= WORK_END_MIN - SLOT_MIN; m += SLOT_MIN) {
    options.push({ value: m, label: slotLabel(date, m) });
  }
  return options;
}

// Опції пікера кінця
export function toTimeOptions(date: Date, fromMin: number): TimeOption[] {
  const options: TimeOption[] = [];
  const max = Math.min(WORK_END_MIN, fromMin + MAX_DURATION_MIN);
  for (let m = fromMin + SLOT_MIN; m <= max; m += SLOT_MIN) {
    options.push({ value: m, label: slotLabel(date, m) });
  }
  return options;
}

// Затискає кінець у валідний діапазон для заданого початку
export function clampToMin(fromMin: number, toMin: number): number {
  const min = fromMin + SLOT_MIN;
  const max = Math.min(WORK_END_MIN, fromMin + MAX_DURATION_MIN);
  return Math.min(Math.max(toMin, min), max);
}
