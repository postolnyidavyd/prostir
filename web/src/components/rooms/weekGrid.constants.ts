import { MAX_DURATION_MIN, SLOT_MIN, WORK_END_MIN, WORK_START_MIN } from '../../lib/time';

export const SLOT_COUNT = (WORK_END_MIN - WORK_START_MIN) / SLOT_MIN; // 20
export const MAX_SLOTS = MAX_DURATION_MIN / SLOT_MIN; // 8
// всі слоти від 9 до 19
export const SLOTS = Array.from({ length: SLOT_COUNT }, (_, i) => WORK_START_MIN + i * SLOT_MIN);
