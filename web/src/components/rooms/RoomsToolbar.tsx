import { useMemo } from 'react';
import styled from 'styled-components';

import ArrowRightIcon from '../../assets/icons/Arrow_Right_MD.svg?react';
import ChevronLeftIcon from '../../assets/icons/Chevron_Left.svg?react';
import ChevronRightIcon from '../../assets/icons/Chevron_Right.svg?react';
import FilterIcon from '../../assets/icons/Filter.svg?react';
import {
  MAX_DURATION_MIN,
  SLOT_MIN,
  WORK_END_MIN,
  WORK_START_MIN,
  browserGmtLabel,
  slotLabel,
} from '../../lib/time';
import { text } from '../../styles/typography';
import Switch from '../ui/Switch';
import DatePicker from './DatePicker';
import TimePicker, { type TimeOption } from './TimePicker';
import { chipStyle } from './chipStyle';

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 0.625rem;
  background-color: var(--base-white);
  box-shadow: var(--shadow-sm);
  color: var(--primary-black);
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const Chip = styled.button`
  ${chipStyle};
`;

const DateNav = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid var(--grey-80);
  border-radius: 0.625rem;
  overflow: hidden;
`;

const NavButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
  border: none;
  background-color: var(--base-white);
  color: var(--primary-black);
  cursor: pointer;
  transition: background-color 0.15s ease;

  svg {
    width: 1.125rem;
    height: 1.125rem;
  }

  &:first-child {
    border-right: 1px solid var(--grey-80);
  }

  &:last-child {
    border-left: 1px solid var(--grey-80);
  }

  &:hover {
    background-color: var(--primary-grey);
  }
`;

const Toggle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  ${text.small};
  color: var(--primary-black);
  white-space: nowrap;
`;

const ToggleLabel = styled.span`
  cursor: pointer;
`;

const Gmt = styled.span`
  ${text.small};
  color: var(--secondary-text);
  white-space: nowrap;
`;

const FilterBadge = styled.span`
  display: inline-grid;
  place-items: center;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.3125rem;
  border-radius: 999px;
  background-color: var(--base-black);
  color: var(--base-white);
  ${text.tiny};
`;

type RoomsToolbarProps = {
  date: Date;
  onDateChange: (date: Date) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  fromMin: number;
  toMin: number;
  onFromMin: (minutes: number) => void;
  onToMin: (minutes: number) => void;
  onlyFree: boolean;
  onOnlyFree: (value: boolean) => void;
  onMoreFilters: () => void;
  filterCount: number;
};

function RoomsToolbar({
  date,
  onDateChange,
  onPrevDay,
  onNextDay,
  fromMin,
  toMin,
  onFromMin,
  onToMin,
  onlyFree,
  onOnlyFree,
  onMoreFilters,
  filterCount,
}: RoomsToolbarProps) {
  const fromOptions = useMemo<TimeOption[]>(() => {
    const options: TimeOption[] = [];
    for (let m = WORK_START_MIN; m <= WORK_END_MIN - SLOT_MIN; m += SLOT_MIN) {
      options.push({ value: m, label: slotLabel(date, m) });
    }
    return options;
  }, [date]);

  const toOptions = useMemo<TimeOption[]>(() => {
    const options: TimeOption[] = [];
    const hi = Math.min(WORK_END_MIN, fromMin + MAX_DURATION_MIN);
    for (let m = fromMin + SLOT_MIN; m <= hi; m += SLOT_MIN) {
      options.push({ value: m, label: slotLabel(date, m) });
    }
    return options;
  }, [date, fromMin]);

  return (
    <Bar>
      <Left>
        <Group>
          <Chip type="button" onClick={() => onDateChange(new Date())}>
            Сьогодні
          </Chip>
          <DateNav>
            <NavButton type="button" onClick={onPrevDay} aria-label="Попередній день">
              <ChevronLeftIcon />
            </NavButton>
            <DatePicker date={date} onChange={onDateChange} />
            <NavButton type="button" onClick={onNextDay} aria-label="Наступний день">
              <ChevronRightIcon />
            </NavButton>
          </DateNav>
        </Group>
        <Group>
          <TimePicker value={fromMin} options={fromOptions} onChange={onFromMin} />
          <ArrowRightIcon width={18} height={18} />
          <TimePicker value={toMin} options={toOptions} onChange={onToMin} />
          <Toggle>
            <Switch checked={onlyFree} onChange={onOnlyFree} aria-label="Тільки вільні" />
            <ToggleLabel onClick={() => onOnlyFree(!onlyFree)}>Тільки вільні</ToggleLabel>
          </Toggle>
        </Group>
      </Left>
      <Right>
        <Gmt>{browserGmtLabel()}</Gmt>
        <Chip type="button" onClick={onMoreFilters}>
          <FilterIcon />
          Більше фільтрів
          {filterCount > 0 && <FilterBadge>{filterCount}</FilterBadge>}
        </Chip>
      </Right>
    </Bar>
  );
}

export default RoomsToolbar;
