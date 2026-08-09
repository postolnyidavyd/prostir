import { useEffect, useRef, useState } from 'react';

import { SLOT_MIN } from '../../lib/time';
import type { BookingDraft } from './BookingModal';
import { MAX_SLOTS, SLOT_COUNT, SLOTS } from './weekGrid.constants';

export type Selection = { dayIndex: number; r1: number; r2: number; anchor: number };

type UseSlotSelectionArgs = {
  days: Date[];
  isFree: (dayIndex: number, slotIndex: number) => boolean;
  // зміна значення скидає активний вибір
  resetToken?: number;
  onCreate?: (draft: BookingDraft) => void;
};

export function useSlotSelection({ days, isFree, resetToken, onCreate }: UseSlotSelectionArgs) {
  const [sel, setSel] = useState<Selection | null>(null);
  const draggingRef = useRef(false);

  //завершення перетягування
  useEffect(() => {
    const up = () => {
      draggingRef.current = false;
    };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  //ресетимо селектіон на зміну днів або на інкремент resetToken
  useEffect(() => setSel(null), [days, resetToken]);

  // найдальший суміжний вільний слот від anchor у бік target (4 год / кінець дня / зайнятий слот)
  const reachableSlot = (dayIndex: number, anchor: number, target: number): number => {
    const dir = Math.sign(target - anchor) || 1;
    let last = anchor;
    for (let r = anchor; r >= 0 && r < SLOT_COUNT; r += dir) {
      if (!isFree(dayIndex, r)) break;
      if (Math.abs(r - anchor) + 1 > MAX_SLOTS) break;
      last = r;
      if (r === target) break;
    }
    return last;
  };

  const handleDown = (dayIndex: number, slotIndex: number, free: boolean) => {
    // зайнятий слот - скинули вибір
    if (!free) {
      setSel(null);
      return;
    }
    // перевірка чи буде розширення наявного селектіона чи починаємо новий
    //1 - існує, 2 - той самий день, 3 - на 1 менше чи більше поточного вибору, 4 - не більше 4 годин
    if (
      sel &&
      sel.dayIndex === dayIndex &&
      (slotIndex === sel.r1 - 1 || slotIndex === sel.r2 + 1) &&
      sel.r2 - sel.r1 + 2 <= MAX_SLOTS
    ) {
      const r1 = Math.min(sel.r1, slotIndex);
      const r2 = Math.max(sel.r2, slotIndex);
      //ставимо anchor на протилежний кінець щоб якщо захочу реалізувати логіку з низу reachebleSlot не ламався
      setSel({ dayIndex, r1, r2, anchor: slotIndex === r1 ? r2 : r1 });
      // МОЖЛИВО ДОДАТИ ЩО ПРИ РОЗШИРЕННІ ДАТИ МОЖЛИВІСТЬ ДРАГУ АЛЕ ТОЧНО ТРЕБА ВИРІШИТИ
      draggingRef.current = true;
      return;
    }
    // починаємо новий вибір
    setSel({ dayIndex, r1: slotIndex, r2: slotIndex, anchor: slotIndex });
    draggingRef.current = true;
  };

  // збільшення селекту на драг
  const handleEnter = (dayIndex: number, slotIndex: number) => {
    if (!draggingRef.current || !sel || sel.dayIndex !== dayIndex) return;
    const reached = reachableSlot(dayIndex, sel.anchor, slotIndex);
    setSel({ ...sel, r1: Math.min(sel.anchor, reached), r2: Math.max(sel.anchor, reached) });
  };

  const selDay = sel ? days[sel.dayIndex] : undefined;
  const selStartMin = sel ? SLOTS[sel.r1]! : 0;
  const selEndMin = sel ? SLOTS[sel.r2]! + SLOT_MIN : 0;

  const startCreate = () => {
    if (!sel || !selDay || !onCreate) return;
    const maxReach = reachableSlot(sel.dayIndex, sel.r1, SLOT_COUNT - 1);
    onCreate({
      day: selDay,
      startMin: selStartMin,
      endMin: selEndMin,
      maxEndMin: SLOTS[maxReach]! + SLOT_MIN,
    });
  };

  const clear = () => setSel(null);

  return { sel, selDay, selStartMin, selEndMin, handleDown, handleEnter, startCreate, clear };
}
