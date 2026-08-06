import styled, { css } from 'styled-components';

import ChevronLeftIcon from '../../assets/icons/Chevron_Left.svg?react';
import ChevronRightIcon from '../../assets/icons/Chevron_Right.svg?react';
import { formatWeekRange } from '../../lib/time';
import { text } from '../../styles/typography';

const chip = css`
  padding: 0.625rem;
  border: 2px solid var(--base-bright-grey);
  border-radius: 0.625rem;
  background-color: var(--base-white);
  color: var(--primary-black);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--primary-grey);
  }
`;

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const ThisWeek = styled.button`
  ${chip};
  ${text.small};
  white-space: nowrap;
`;

const Nav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavButton = styled.button`
  ${chip};

  svg {
    width: 1.125rem;
    height: 1.125rem;
  }
`;

const Range = styled.span`
  ${text.small};
  color: var(--primary-black);
  white-space: nowrap;
`;

type WeekNavProps = {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onThisWeek: () => void;
};

function WeekNav({ weekStart, onPrev, onNext, onThisWeek }: WeekNavProps) {
  return (
    <Wrap>
      <ThisWeek type="button" onClick={onThisWeek}>
        Цей тиждень
      </ThisWeek>
      <Nav>
        <NavButton type="button" onClick={onPrev} aria-label="Попередній тиждень">
          <ChevronLeftIcon />
        </NavButton>
        <Range>{formatWeekRange(weekStart)}</Range>
        <NavButton type="button" onClick={onNext} aria-label="Наступний тиждень">
          <ChevronRightIcon />
        </NavButton>
      </Nav>
    </Wrap>
  );
}

export default WeekNav;
