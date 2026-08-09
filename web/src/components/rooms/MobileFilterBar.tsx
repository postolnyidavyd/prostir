import styled from 'styled-components';

import FilterIcon from '../../assets/icons/Filter.svg?react';
import { formatDateLabel, slotLabel } from '../../lib/time';
import { media } from '../../styles/media';
import { text } from '../../styles/typography';

const Field = styled.button`
  display: none;

  ${media.phone} {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
    padding: 0.5rem 0.875rem;
    border: 1px solid var(--grey-80);
    border-radius: 0.625rem;
    background-color: var(--base-white);
    box-shadow: var(--shadow-sm);
    color: var(--primary-black);
    cursor: pointer;
    text-align: left;
  }
`;

const Summary = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

const Primary = styled.span`
  ${text.h8};
  color: var(--primary-black);
`;

const Secondary = styled.span`
  ${text.small};
  color: var(--secondary-text);
`;

const IconWrap = styled.span`
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  color: var(--primary-black);

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -0.375rem;
  right: -0.375rem;
  display: inline-grid;
  place-items: center;
  min-width: 1.0625rem;
  height: 1.0625rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  background-color: var(--base-black);
  color: var(--base-white);
  ${text.tiny};
`;

type MobileFilterBarProps = {
  date: Date;
  fromMin: number;
  toMin: number;
  count: number;
  onOpen: () => void;
};

function MobileFilterBar({ date, fromMin, toMin, count, onOpen }: MobileFilterBarProps) {
  return (
    <Field type="button" onClick={onOpen} aria-label="Відкрити фільтри">
      <Summary>
        <Primary>{formatDateLabel(date)}</Primary>
        <Secondary>
          {slotLabel(date, fromMin)}–{slotLabel(date, toMin)}
        </Secondary>
      </Summary>
      <IconWrap>
        <FilterIcon />
        {count > 0 && <Badge>{count}</Badge>}
      </IconWrap>
    </Field>
  );
}

export default MobileFilterBar;
