import { useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';

import AddIcon from '../../assets/icons/Add_Plus.svg?react';
import InfoIcon from '../../assets/icons/Info.svg?react';
import {
  MAX_DURATION_MIN,
  SLOT_MIN,
  WORK_END_MIN,
  WORK_START_MIN,
  browserGmtLabel,
  formatDuration,
  formatWeekday,
  isKyivTimeZone,
  isSameDay,
  isSameKyivDay,
  kyivMinutesOfDay,
  kyivMinutesToUtc,
  slotLabel,
} from '../../lib/time';
import type { RoomBooking } from '../../store/api/bookingsApi';
import { text } from '../../styles/typography';
import Button from '../ui/Button';
import BookingBlock from './BookingBlock';
import type { BookingDraft } from './BookingModal';

const SLOT_COUNT = (WORK_END_MIN - WORK_START_MIN) / SLOT_MIN; // 20
const MAX_SLOTS = MAX_DURATION_MIN / SLOT_MIN; // 8
const ROW_H = 3.25; // rem на 30хв слот
const AXIS_W = '2.75rem';
// всі слоти від 9 до 19
const SLOTS = Array.from({ length: SLOT_COUNT }, (_, i) => WORK_START_MIN + i * SLOT_MIN);
const COLUMNS = `${AXIS_W} repeat(7, minmax(0, 1fr))`;

type Selection = { dayIndex: number; r1: number; r2: number; anchor: number };
type DayEvent = { booking: RoomBooking; startMin: number; endMin: number };
type DayInfo = { past: boolean[]; occupied: boolean[]; events: DayEvent[] };

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: var(--base-white);
  border-radius: 0.625rem;
  overflow: hidden;
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: ${COLUMNS};
  border-bottom: 1px solid var(--base-bright-grey);
`;

const Corner = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.5rem 0.25rem;
`;

const Gmt = styled.span<{ $warn: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0 0.25rem;
  border-radius: 0.3125rem;
  ${text.tiny};
  cursor: help;
  background-color: ${({ $warn }) => ($warn ? 'var(--gorse-100)' : 'var(--primary-grey)')};
  color: var(--primary-black);

  svg {
    width: 0.75rem;
    height: 0.75rem;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0.25rem;
  z-index: 60;
  width: 15rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.625rem;
  background-color: var(--primary-black);
  color: var(--base-white);
  ${text.tiny};
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease;
  pointer-events: none;

  ${Corner}:hover & {
    opacity: 1;
    visibility: visible;
  }
`;

const DayHead = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.875rem 0;
`;

const DayNum = styled.span<{ $mark: boolean }>`
  display: grid;
  place-items: center;
  padding: 0 0.25rem;
  min-width: 1.5rem;
  border-radius: 0.25rem;
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.5rem;
  letter-spacing: -0.32px;
  color: ${({ $mark }) => ($mark ? 'var(--base-white)' : 'var(--primary-black)')};
  background-color: ${({ $mark }) => ($mark ? 'var(--accent-color-intense)' : 'transparent')};
`;

const Weekday = styled.span`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 400;
  font-size: 0.625rem;
  line-height: 0.875rem;
  color: var(--secondary-text);
`;

const Body = styled.div`
  overflow-y: auto;
  max-height: calc(100dvh - 15rem);
`;

const Cols = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: ${COLUMNS};
  user-select: none;
`;

const Axis = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const TimeCell = styled.span<{ $highlight: boolean }>`
  height: ${ROW_H}rem;
  display: flex;
  justify-content: flex-end;
  padding: 0.25rem 0.375rem 0 0;
  ${text.tiny};
  color: var(--secondary-text);
  background-color: ${({ $highlight }) => ($highlight ? 'var(--accent-color)' : 'transparent')};
`;

// підпис 19:00 на власному рядку — позначає кінець робочого дня
const EndTimeCell = styled.span`
  height: ${ROW_H}rem;
  display: flex;
  justify-content: flex-end;
  padding: 0.25rem 0.375rem 0 0;
  ${text.tiny};
  color: var(--secondary-text);
`;

const EndRow = styled.div`
  height: ${ROW_H}rem;
  border-top: 1px solid var(--base-bright-grey);
`;

const DayCol = styled.div`
  position: relative;
`;

const Cell = styled.div<{ $past: boolean; $free: boolean; $highlight: boolean }>`
  position: relative;
  height: ${ROW_H}rem;
  border-top: 1px solid var(--grey-border);
  border-right: 1px solid var(--grey-border);
  cursor: ${({ $free }) => ($free ? 'pointer' : 'default')};
  background-color: ${({ $highlight }) => ($highlight ? 'var(--accent-color)' : 'transparent')};
  transition: background-color 0.12s ease;

  ${({ $past }) =>
    $past &&
    `
    background-color: var(--secondary-grey);
    background-image: repeating-linear-gradient(
      135deg,
      transparent 0,
      transparent 5px,
      rgba(13, 13, 13, 0.05) 5px,
      rgba(13, 13, 13, 0.05) 6px
    );
  `}

  ${({ $free }) =>
    $free &&
    `
    &:hover {
      background-color: var(--accent-color);
    }
  `}
`;

const CellHint = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  ${text.tiny};
  color: var(--accent-color-intense);
  opacity: 0;
  transition: opacity 0.12s ease;
  pointer-events: none;

  svg {
    width: 0.875rem;
    height: 0.875rem;
  }

  ${Cell}:hover & {
    opacity: 1;
  }
`;

const selPop = keyframes`
  from { opacity: 0.5; }
  to { opacity: 1; }
`;

const SelBand = styled.div`
  position: absolute;
  left: 0.375rem;
  right: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  background-color: var(--accent-color-intense);
  color: var(--primary-black);
  ${text.tiny};
  pointer-events: none;
  box-shadow: 0 0 0 2px rgba(132, 161, 155, 0.35);
  animation: ${selPop} 0.12s ease-out;
  /* плавний ріст при перетягуванні */
  transition:
    top 0.09s ease,
    height 0.09s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
  }
`;

const Now = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transform: translateY(-50%);
  pointer-events: none;
`;

const NowLabel = styled.span`
  flex-shrink: 0;
  padding: 0 0.25rem;
  border-radius: 0.3125rem;
  background-color: var(--brick-red-100);
  color: var(--base-white);
  ${text.tiny};
`;

const NowRule = styled.div`
  flex: 1;
  height: 0;
  border-top: 2px solid var(--brick-red-100);
`;

const SelBar = styled.div`
  position: fixed;
  left: 50%;
  bottom: 1.5rem;
  transform: translateX(-50%);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0.75rem;
  background-color: var(--base-white);
  border: 1px solid var(--grey-border);
  border-radius: 1.25rem;
  box-shadow: var(--shadow);
`;

const SelInfo = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 0.5rem;
`;

const SelTime = styled.span`
  ${text.h4};
  color: var(--primary-black);
`;

const SelDur = styled.span`
  ${text.tiny};
  color: var(--secondary-text);
`;

const SelActions = styled.div`
  display: flex;
  gap: 0.625rem;
`;

type WeekGridProps = {
  days: Date[];
  bookings: RoomBooking[];
  currentUserId?: string;
  onCreate?: (draft: BookingDraft) => void;
  onCancel?: (booking: RoomBooking) => void;
  // день і час із фільтрів
  highlightDay?: Date;
  highlightFrom?: number;
  highlightTo?: number;
  // зміна значення скидає активний вибір
  resetToken?: number;
};

function WeekGrid({
  days,
  bookings,
  currentUserId,
  onCreate,
  onCancel,
  highlightDay,
  highlightFrom,
  highlightTo,
  resetToken,
}: WeekGridProps) {
  const [sel, setSel] = useState<Selection | null>(null);
  const draggingRef = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);

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

  // автопрокрутка до часу з фільтрів
  useEffect(() => {
    if (highlightFrom === undefined || !bodyRef.current) return;
    const top = ((highlightFrom - WORK_START_MIN) / SLOT_MIN) * ROW_H * 16;
    bodyRef.current.scrollTop = Math.max(0, top - 40);
  }, [highlightFrom, days]);

  const inHighlight = (min: number) =>
    highlightFrom !== undefined &&
    highlightTo !== undefined &&
    min >= highlightFrom &&
    min < highlightTo;

  // Стан кожного дня рахуємо раз на зміну даних, а не на кожен ререндер під час drag
  const dayInfos = useMemo<DayInfo[]>(() => {
    const now = Date.now();
    return days.map((day) => {
      const past = SLOTS.map((min) => kyivMinutesToUtc(day, min).getTime() <= now);

      const occupied = new Array<boolean>(SLOT_COUNT).fill(false);
      const events: DayEvent[] = [];

      for (const booking of bookings) {
        // якщо не наш день ігнорим
        if (!isSameKyivDay(booking.startsAt, day)) continue;

        const startMin = kyivMinutesOfDay(booking.startsAt);
        const endMin = kyivMinutesOfDay(booking.endsAt);
        events.push({ booking, startMin, endMin });

        for (let i = 0; i < SLOT_COUNT; i += 1) {
          const min = SLOTS[i]!;
          if (startMin < min + SLOT_MIN && endMin > min) occupied[i] = true;
        }
      }
      return { past, occupied, events };
    });
  }, [days, bookings]);

  // підписи осі
  const axisLabels = useMemo(() => {
    const ref = days[0] ?? new Date();
    return {
      slots: SLOTS.map((min) => slotLabel(ref, min)),
      end: slotLabel(ref, WORK_END_MIN),
    };
  }, [days]);

  const isFree = (dayIndex: number, slotIndex: number): boolean => {
    const info = dayInfos[dayIndex];
    return !!info && !info.past[slotIndex] && !info.occupied[slotIndex];
  };

  // найдальший суміжний вільний слот від anchor у бік target (тобто 4 год або якщо кінець робочого дня раніше то менше)
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
      // draggingRef.current = true;
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

  const nowIso = new Date().toISOString();
  const nowMin = kyivMinutesOfDay(nowIso);
  const todayInWeek = days.some((day) => isSameKyivDay(nowIso, day));
  const showNow = todayInWeek && nowMin >= WORK_START_MIN && nowMin <= WORK_END_MIN;
  const nowTop = ((nowMin - WORK_START_MIN) / SLOT_MIN) * ROW_H;

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

  return (
    <Wrap>
      <HeaderRow>
        <Corner>
          <Gmt $warn={!isKyivTimeZone()}>
            <InfoIcon />
            {browserGmtLabel()}
          </Gmt>
          <Tooltip>
            {isKyivTimeZone()
              ? 'Ваш пояс збігається з київським. Слоти показані за Києвом, робочі години 09:00–19:00.'
              : `Ваш час — ${browserGmtLabel()}, він відрізняється від київського. Слоти показані у вашому поясі, але робочі години рахуються за Києвом (09:00–19:00).`}
          </Tooltip>
        </Corner>
        {days.map((day) => {
          const weekday = formatWeekday(day);
          return (
            <DayHead key={day.toISOString()}>
              <DayNum $mark={!!highlightDay && isSameDay(day, highlightDay)}>
                {day.getDate()}
              </DayNum>
              <Weekday>{weekday.charAt(0).toUpperCase() + weekday.slice(1)}</Weekday>
            </DayHead>
          );
        })}
      </HeaderRow>

      <Body ref={bodyRef}>
        <Cols>
          <Axis>
            {SLOTS.map((min, i) => (
              <TimeCell key={min} $highlight={inHighlight(min)}>
                {axisLabels.slots[i]}
              </TimeCell>
            ))}
            <EndTimeCell>{axisLabels.end}</EndTimeCell>
          </Axis>

          {days.map((day, dayIndex) => {
            const info = dayInfos[dayIndex];
            const dayHighlighted = !!highlightDay && isSameDay(day, highlightDay);
            return (
              <DayCol key={day.toISOString()}>
                {SLOTS.map((min, slotIndex) => {
                  const past = info?.past[slotIndex] ?? false;
                  const free = isFree(dayIndex, slotIndex);
                  return (
                    <Cell
                      key={min}
                      $past={past}
                      $free={free}
                      $highlight={!past && dayHighlighted && inHighlight(min)}
                      onPointerDown={() => handleDown(dayIndex, slotIndex, free)}
                      onPointerEnter={() => handleEnter(dayIndex, slotIndex)}
                    >
                      {free && !sel && (
                        <CellHint>
                          <AddIcon />
                          Забронювати
                        </CellHint>
                      )}
                    </Cell>
                  );
                })}
                <EndRow />

                {sel && sel.dayIndex === dayIndex && (
                  <SelBand
                    style={{
                      top: `calc(${sel.r1 * ROW_H}rem + 0.25rem)`,
                      height: `calc(${(sel.r2 - sel.r1 + 1) * ROW_H}rem - 0.5rem)`,
                    }}
                  >
                    {slotLabel(day, selStartMin)} – {slotLabel(day, selEndMin)}
                  </SelBand>
                )}

                {(info?.events ?? []).map(({ booking, startMin, endMin }) => {
                  const top = ((startMin - WORK_START_MIN) / SLOT_MIN) * ROW_H;
                  const height = ((Math.min(endMin, WORK_END_MIN) - startMin) / SLOT_MIN) * ROW_H;
                  const mine = booking.user.id === currentUserId;
                  const cancellable =
                    mine && onCancel && new Date(booking.endsAt).getTime() > Date.now();
                  return (
                    <BookingBlock
                      key={booking.id}
                      title={booking.title}
                      timeLabel={`${slotLabel(day, startMin)} – ${slotLabel(day, endMin)}`}
                      person={booking.user.displayName}
                      mine={mine}
                      top={top}
                      height={height}
                      onCancel={cancellable ? () => onCancel(booking) : undefined}
                    />
                  );
                })}
              </DayCol>
            );
          })}

          {showNow && (
            <Now style={{ top: `${nowTop}rem` }}>
              <NowLabel>зараз</NowLabel>
              <NowRule />
            </Now>
          )}
        </Cols>
      </Body>

      {sel && selDay && (
        <SelBar>
          <SelInfo>
            <SelTime>
              {slotLabel(selDay, selStartMin)} – {slotLabel(selDay, selEndMin)}
            </SelTime>
            <SelDur>Тривалість · {formatDuration(selEndMin - selStartMin)}</SelDur>
          </SelInfo>
          <SelActions>
            <Button size="sm" onClick={startCreate}>
              Продовжити бронювання
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setSel(null)}>
              Скасувати
            </Button>
          </SelActions>
        </SelBar>
      )}
    </Wrap>
  );
}

export default WeekGrid;
