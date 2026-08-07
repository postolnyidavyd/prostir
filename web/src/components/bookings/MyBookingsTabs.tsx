import { useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import type { BookingScope } from '../../store/api/bookingsApi';

const Nav = styled.div`
  align-self: flex-start;
  position: relative;
  display: inline-flex;
  align-items: stretch;
  gap: 0.25rem;
  padding: 0.3125rem;
  background-color: var(--base-white);
  border: 1px solid var(--base-bright-grey);
  border-radius: 999px;
`;

// плашка активного таба
const Thumb = styled.span<{ $ready: boolean }>`
  position: absolute;
  z-index: 0;
  border-radius: 999px;
  background-color: var(--primary-black);
  opacity: ${({ $ready }) => ($ready ? 1 : 0)};
  transition:
    left 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5625rem 1.25rem;
  border: none;
  background: none;
  cursor: pointer;
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.875rem;
  line-height: 1.3125rem;
  color: ${({ $active }) => ($active ? 'var(--base-white)' : 'var(--secondary-text)')};
  transition: color 0.2s ease;
`;

const Count = styled.span`
  opacity: 0.55;
`;

type MyBookingsTabsProps = {
  value: BookingScope;
  counts: { upcoming: number; past: number };
  onChange: (scope: BookingScope) => void;
};

function MyBookingsTabs({ value, counts, onChange }: MyBookingsTabsProps) {
  const upcomingRef = useRef<HTMLButtonElement>(null);
  const pastRef = useRef<HTMLButtonElement>(null);
  const [thumb, setThumb] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>();

  // позиціюємо плашку під активним табом, бо ширина табів різна через лічильники
  useLayoutEffect(() => {
    const el = value === 'upcoming' ? upcomingRef.current : pastRef.current;
    if (el) {
      setThumb({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    }
  }, [value, counts.upcoming, counts.past]);

  return (
    <Nav role="tablist">
      <Thumb $ready={thumb !== undefined} style={thumb} aria-hidden />
      <Tab
        ref={upcomingRef}
        type="button"
        role="tab"
        aria-selected={value === 'upcoming'}
        $active={value === 'upcoming'}
        onClick={() => onChange('upcoming')}
      >
        Майбутні <Count>{counts.upcoming}</Count>
      </Tab>
      <Tab
        ref={pastRef}
        type="button"
        role="tab"
        aria-selected={value === 'past'}
        $active={value === 'past'}
        onClick={() => onChange('past')}
      >
        Минулі <Count>{counts.past}</Count>
      </Tab>
    </Nav>
  );
}

export default MyBookingsTabs;
