import type { ReactNode } from 'react';
import styled from 'styled-components';

type Status = 'free' | 'busy' | 'unavailable';

const dotColor: Record<Status, string> = {
  free: 'var(--malachite-100)',
  busy: 'var(--grey-40)',
  unavailable: 'var(--grey-60)',
};

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0 0.25rem;
  border-radius: 0.25rem;
  background-color: var(--base-white);
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.625rem;
  line-height: 1rem;
  color: var(--secondary-text);
`;

const Dot = styled.span<{ $status: Status }>`
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background-color: ${({ $status }) => dotColor[$status]};
`;

type BadgeProps = {
  status: Status;
  children: ReactNode;
};

function Badge({ status, children }: BadgeProps) {
  return (
    <Pill>
      <Dot $status={status} />
      {children}
    </Pill>
  );
}

export default Badge;
