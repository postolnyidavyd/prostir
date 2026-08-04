import { useEffect, useState } from 'react';
import styled from 'styled-components';

import CalendarIcon from '../../assets/icons/Calendar.svg?react';
import ChevronLeftIcon from '../../assets/icons/Chevron_Left.svg?react';
import ChevronRightIcon from '../../assets/icons/Chevron_Right.svg?react';
import { formatDateLabel, formatMonthLabel, isBeforeDay, isSameDay } from '../../lib/time';
import { text } from '../../styles/typography';
import Popover from '../ui/Popover';

const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.5rem;
  border: none;
  background-color: transparent;
  color: var(--primary-black);
  cursor: pointer;
  white-space: nowrap;
  ${text.small};
  transition: background-color 0.15s ease;

  svg {
    width: 1.125rem;
    height: 1.125rem;
    flex-shrink: 0;
  }

  &:hover {
    background-color: var(--primary-grey);
  }
`;

const Cal = styled.div`
  width: 17.5rem;
  padding: 0.875rem;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.625rem;
`;

const MonthLabel = styled.span`
  ${text.h8};
  text-transform: capitalize;
`;

const NavButton = styled.button`
  width: 1.875rem;
  height: 1.875rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--base-bright-grey);
  border-radius: 0.5625rem;
  background-color: var(--base-white);
  color: var(--secondary-text);
  cursor: pointer;

  svg {
    width: 1.125rem;
    height: 1.125rem;
  }

  &:hover {
    background-color: var(--primary-grey);
    color: var(--primary-black);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.125rem;
`;

const Dow = styled.span`
  height: 1.625rem;
  display: grid;
  place-items: center;
  ${text.tiny};
  color: var(--secondary-text);
`;

const Day = styled.button<{ $today: boolean; $selected: boolean; $past: boolean }>`
  height: 2.125rem;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 0.5625rem;
  ${text.small};
  cursor: pointer;
  color: ${({ $selected, $past }) =>
    $selected ? 'var(--base-white)' : $past ? 'var(--grey-60)' : 'var(--primary-black)'};
  background-color: ${({ $selected }) => ($selected ? 'var(--base-black)' : 'transparent')};
  box-shadow: ${({ $today, $selected }) =>
    $today && !$selected ? 'inset 0 0 0 1.5px var(--accent-color-intense)' : 'none'};

  &:hover {
    background-color: ${({ $selected }) =>
      $selected ? 'var(--base-black)' : 'var(--accent-color)'};
  }
`;

const Foot = styled.div`
  margin-top: 0.625rem;
  display: flex;
  justify-content: center;
`;

const TodayButton = styled.button`
  border: none;
  background: none;
  ${text.small};
  color: var(--accent-color-intense);
  cursor: pointer;
  padding: 0.375rem 0.625rem;
  border-radius: 0.5rem;

  &:hover {
    background-color: var(--accent-color);
  }
`;

const DAYS_OF_THE_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

type DatePickerProps = {
  date: Date;
  onChange: (date: Date) => void;
};

function DatePicker({ date, onChange }: DatePickerProps) {
  const [view, setView] = useState({ year: date.getFullYear(), month: date.getMonth() });

  useEffect(() => {
    setView({ year: date.getFullYear(), month: date.getMonth() });
  }, [date]);

  const today = new Date();
  const first = new Date(view.year, view.month, 1);
  const startDow = (first.getDay() + 6) % 7; // Пн = 0
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const shiftMonth = (delta: number) =>
    setView((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  return (
    <Popover
      renderTrigger={(toggle) => (
        <Trigger type="button" onClick={toggle}>
          <CalendarIcon />
          {formatDateLabel(date)}
        </Trigger>
      )}
    >
      {(close) => (
        <Cal>
          <Head>
            <NavButton type="button" onClick={() => shiftMonth(-1)} aria-label="Попередній місяць">
              <ChevronLeftIcon />
            </NavButton>
            <MonthLabel>{formatMonthLabel(first)}</MonthLabel>
            <NavButton type="button" onClick={() => shiftMonth(1)} aria-label="Наступний місяць">
              <ChevronRightIcon />
            </NavButton>
          </Head>
          <Grid>
            {DAYS_OF_THE_WEEK.map((day) => (
              <Dow key={day}>{day}</Dow>
            ))}
            {Array.from({ length: startDow }).map((_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {days.map((day) => {
              const current = new Date(view.year, view.month, day);
              return (
                <Day
                  key={day}
                  type="button"
                  $today={isSameDay(current, today)}
                  $selected={isSameDay(current, date)}
                  $past={isBeforeDay(current, today)}
                  onClick={() => {
                    onChange(current);
                    close();
                  }}
                >
                  {day}
                </Day>
              );
            })}
          </Grid>
          <Foot>
            <TodayButton
              type="button"
              onClick={() => {
                onChange(new Date());
                close();
              }}
            >
              Сьогодні
            </TodayButton>
          </Foot>
        </Cal>
      )}
    </Popover>
  );
}

export default DatePicker;
