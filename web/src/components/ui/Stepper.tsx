import styled from 'styled-components';

import AddIcon from '../../assets/icons/Add_Plus.svg?react';
import RemoveIcon from '../../assets/icons/Remove_Minus.svg?react';
import { text } from '../../styles/typography';

const Group = styled.div`
  display: inline-flex;
  align-items: stretch;
  align-self: flex-start;
  border: 1px solid var(--grey-80);
  border-radius: 0.625rem;
  overflow: hidden;
`;

const Button = styled.button`
  display: grid;
  place-items: center;
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

  &:hover:not(:disabled) {
    background-color: var(--primary-grey);
  }

  &:disabled {
    color: var(--grey-40);
    cursor: not-allowed;
  }
`;

const Value = styled.span`
  display: grid;
  place-items: center;
  padding: 0 0.625rem;
  min-width: 6rem;
  ${text.small};
  color: var(--primary-black);
`;

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  format: (value: number) => string;
};

function Stepper({ value, onChange, min = 0, max = 99, format }: StepperProps) {
  return (
    <Group>
      <Button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Менше"
      >
        <RemoveIcon />
      </Button>
      <Value>{format(value)}</Value>
      <Button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Більше"
      >
        <AddIcon />
      </Button>
    </Group>
  );
}

export default Stepper;
