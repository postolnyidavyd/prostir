import { useEffect, useMemo, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

import AddIcon from '../../assets/icons/Add_Plus.svg?react';
import ChevronLeftIcon from '../../assets/icons/Chevron_Left.svg?react';
import ChevronRightIcon from '../../assets/icons/Chevron_Right.svg?react';
import InfoIcon from '../../assets/icons/Info.svg?react';
import {
  SLOT_MIN,
  WORK_END_MIN,
  WORK_START_MIN,
  browserGmtLabel,
  formatDateLabel,
  formatDuration,
  formatWeekday,
  isKyivTimeZone,
  isSameDay,
  isSameKyivDay,
  kyivMinutesOfDay,
  kyivMinutesToUtc,
  slotLabel,
} from '../../lib/time';
import { useIsMobile } from '../../lib/useIsMobile';
import type { RoomBooking } from '../../store/api/bookingsApi';
import { media } from '../../styles/media';
import { text } from '../../styles/typography';
import Button from '../ui/Button';
import BookingBlock from './BookingBlock';
import type { BookingDraft } from './BookingModal';
import { useSlotSelection } from './useSlotSelection';
import { SLOT_COUNT, SLOTS } from './weekGrid.constants';

const ROW_H = 3.25; // rem на 30хв слот
const AXIS_W = '2.75rem';
const COLUMNS = `${AXIS_W} repeat(7, minmax(0, 1fr))`;

type DayEvent = { booking: RoomBooking; startMin: number; endMin: number };
type DayInfo = { past: boolean[]; occupied: boolean[]; events: DayEvent[] };

type NowLine = { show: boolean; top: number };


function computeNowLine(days: Date[], activeDay: Date | undefined, isMobile: boolean): NowLine {
  const nowIso = new Date().toISOString();
  const nowMin = kyivMinutesOfDay(nowIso);
  const todayVisible = isMobile
    ? !!activeDay && isSameKyivDay(nowIso, activeDay)
    : days.some((day) => isSameKyivDay(nowIso, day));
  return {
    show: todayVisible && nowMin >= WORK_START_MIN && nowMin <= WORK_END_MIN,
    top: ((nowMin - WORK_START_MIN) / SLOT_MIN) * ROW_H,
  };
}

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

const MobileHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--base-bright-grey);
`;

const DaySwitch = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const SwitchBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
  border: 1px solid var(--base-bright-grey);
  border-radius: 0.5rem;
  background-color: var(--base-white);
  color: var(--primary-black);
  cursor: pointer;
  transition: background-color 0.15s ease;

  svg {
    width: 1.125rem;
    height: 1.125rem;
  }

  &:hover {
    background-color: var(--primary-grey);
  }
`;

const DayLabel = styled.span`
  min-width: 6.5rem;
  text-align: center;
  text-transform: capitalize;
  ${text.h7};
  color: var(--primary-black);
`;

const Body = styled.div`
  overflow-y: auto;
  max-height: calc(100dvh - 15rem);

  ${media.phone} {
    /* запас під фіксовану панель вибору, щоб нижні слоти можна було доскролити над нею */
    padding-bottom: 6rem;
  }
`;

const Cols = styled.div<{ $columns: string }>`
  position: relative;
  display: grid;
  grid-template-columns: ${({ $columns }) => $columns};
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

  ${media.phone} {
    left: 0.75rem;
    right: 0.75rem;
    bottom: 0.75rem;
    transform: none;
    flex-wrap: wrap;
    gap: 0.5rem 0.75rem;
    padding: 0.75rem;
  }
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

  ${media.phone} {
    flex: 1;

    & > * {
      flex: 1;
    }
  }
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
  // мобільний режим лише з одним днем
  activeDayIndex?: number;
  onPrevDay?: () => void;
  onNextDay?: () => void;
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
  activeDayIndex,
  onPrevDay,
  onNextDay,
}: WeekGridProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // на мобілці показуємо лише активний день, на десктопі весь тиждень
  //нормалізація індексу
  const safeActiveIndex = Math.min(Math.max(activeDayIndex ?? 0, 0), days.length - 1);
  //індекси які видно
  const visibleDayIndices = isMobile ? [safeActiveIndex] : days.map((_, index) => index);
  // шаблон колонок
  const columns = `${AXIS_W} repeat(${visibleDayIndices.length}, minmax(0, 1fr))`;
  const activeDay = days[safeActiveIndex];

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

  const { sel, selDay, selStartMin, selEndMin, handleDown, handleEnter, startCreate, clear } =
    useSlotSelection({ days, isFree, resetToken, onCreate });

  const nowLine = computeNowLine(days, activeDay, isMobile);

  return (
    <Wrap>
      {isMobile ? (
        <MobileHeader>
          <DaySwitch>
            <SwitchBtn type="button" onClick={onPrevDay} aria-label="Попередній день">
              <ChevronLeftIcon />
            </SwitchBtn>
            <DayLabel>{activeDay ? formatDateLabel(activeDay) : ''}</DayLabel>
            <SwitchBtn type="button" onClick={onNextDay} aria-label="Наступний день">
              <ChevronRightIcon />
            </SwitchBtn>
          </DaySwitch>
          <Gmt $warn={!isKyivTimeZone()}>
            <InfoIcon />
            {browserGmtLabel()}
          </Gmt>
        </MobileHeader>
      ) : (
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
      )}

      <Body ref={bodyRef}>
        <Cols $columns={columns}>
          <Axis>
            {SLOTS.map((min, i) => (
              <TimeCell key={min} $highlight={inHighlight(min)}>
                {axisLabels.slots[i]}
              </TimeCell>
            ))}
            <EndTimeCell>{axisLabels.end}</EndTimeCell>
          </Axis>

          {visibleDayIndices.map((dayIndex) => {
            const day = days[dayIndex];
            if (!day) return null;
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
                      onPointerDown={
                        isMobile ? undefined : () => handleDown(dayIndex, slotIndex, free)
                      }
                      onPointerEnter={isMobile ? undefined : () => handleEnter(dayIndex, slotIndex)}
                      onClick={isMobile ? () => handleDown(dayIndex, slotIndex, free) : undefined}
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

          {nowLine.show && (
            <Now style={{ top: `${nowLine.top}rem` }}>
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
            <Button variant="secondary" size="sm" onClick={clear}>
              Скасувати
            </Button>
          </SelActions>
        </SelBar>
      )}
    </Wrap>
  );
}

export default WeekGrid;
