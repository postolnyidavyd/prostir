import styled from 'styled-components';

import ClockIcon from '../../assets/icons/Clock.svg?react';
import { text } from '../../styles/typography';
import Popover from '../ui/Popover';
import { chipStyle } from './chipStyle';

const Chip = styled.button`
  ${chipStyle};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
  width: 17.25rem;
  padding: 0.625rem;
`;

const Slot = styled.button<{ $on: boolean }>`
  padding: 0.5625rem 0;
  border: none;
  border-radius: 0.5rem;
  ${text.small};
  color: ${({ $on }) => ($on ? 'var(--base-white)' : 'var(--primary-black)')};
  background-color: ${({ $on }) => ($on ? 'var(--base-black)' : 'transparent')};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${({ $on }) => ($on ? 'var(--base-black)' : 'var(--primary-grey)')};
  }
`;

export type TimeOption = { value: number; label: string };

type TimePickerProps = {
  value: number;
  options: TimeOption[];
  onChange: (minutes: number) => void;
};

function TimePicker({ value, options, onChange }: TimePickerProps) {
  const current = options.find((option) => option.value === value);

  return (
    <Popover
      renderTrigger={(toggle) => (
        <Chip type="button" onClick={toggle}>
          {current?.label ?? ''}
          <ClockIcon />
        </Chip>
      )}
    >
      {(close) => (
        <Grid>
          {options.map((option) => (
            <Slot
              key={option.value}
              type="button"
              $on={option.value === value}
              onClick={() => {
                onChange(option.value);
                close();
              }}
            >
              {option.label}
            </Slot>
          ))}
        </Grid>
      )}
    </Popover>
  );
}

export default TimePicker;
