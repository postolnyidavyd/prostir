import styled, { keyframes } from 'styled-components';

import { SLOT_MIN, WORK_END_MIN, WORK_START_MIN, slotLabel } from '../../lib/time';
import { text } from '../../styles/typography';

const SLOT_COUNT = (WORK_END_MIN - WORK_START_MIN) / SLOT_MIN;
const ROW_H = 3.25;
const AXIS_W = '2.75rem';
const SLOTS = Array.from({ length: SLOT_COUNT }, (_, i) => WORK_START_MIN + i * SLOT_MIN);
const COLUMNS = `${AXIS_W} repeat(7, minmax(0, 1fr))`;

const GHOSTS: Record<number, Array<[number, number]>> = {
  0: [[2, 4]],
  1: [[6, 8]],
  3: [[1, 3]],
  5: [[9, 11]],
};

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
`;

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
  padding: 0.875rem 0.25rem;
`;

const DayHead = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.875rem 0;
`;

const Bar = styled.span`
  background-color: var(--grey-20);
  border-radius: 0.25rem;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const NumBar = styled(Bar)`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
`;

const WeekdayBar = styled(Bar)`
  width: 3rem;
  height: 0.625rem;
`;

const Body = styled.div`
  overflow: hidden;
  max-height: calc(100dvh - 15rem);
`;

const Cols = styled.div`
  display: grid;
  grid-template-columns: ${COLUMNS};
`;

const Axis = styled.div`
  display: flex;
  flex-direction: column;
`;

const TimeCell = styled.span`
  height: ${ROW_H}rem;
  display: flex;
  justify-content: flex-end;
  padding: 0.25rem 0.375rem 0 0;
  ${text.tiny};
  color: var(--grey-40);
`;

const DayCol = styled.div`
  position: relative;
`;

const Cell = styled.div`
  height: ${ROW_H}rem;
  border-top: 1px solid var(--grey-border);
  border-right: 1px solid var(--grey-border);
`;

const Ghost = styled.div`
  position: absolute;
  left: 0.375rem;
  right: 0.375rem;
  border-radius: 0.25rem;
  background-color: var(--grey-20);
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

function WeekGridSkeleton() {
  return (
    <Wrap aria-busy="true">
      <HeaderRow>
        <Corner />
        {Array.from({ length: 7 }).map((_, i) => (
          <DayHead key={i}>
            <NumBar />
            <WeekdayBar />
          </DayHead>
        ))}
      </HeaderRow>

      <Body>
        <Cols>
          <Axis>
            {SLOTS.map((min) => (
              <TimeCell key={min}>{slotLabel(new Date(), min)}</TimeCell>
            ))}
          </Axis>

          {Array.from({ length: 7 }).map((_, col) => (
            <DayCol key={col}>
              {SLOTS.map((min) => (
                <Cell key={min} />
              ))}
              {(GHOSTS[col] ?? []).map(([r1, r2], gi) => (
                <Ghost
                  key={gi}
                  style={{ top: `${r1 * ROW_H}rem`, height: `${(r2 - r1) * ROW_H}rem` }}
                />
              ))}
            </DayCol>
          ))}
        </Cols>
      </Body>
    </Wrap>
  );
}

export default WeekGridSkeleton;
