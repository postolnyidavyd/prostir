import styled from 'styled-components';

type Status = 'planned' | 'done';

const Badge = styled.span<{ $status: Status }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3125rem 0.75rem;
  border-radius: 999px;
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.75rem;
  line-height: 1.125rem;
  white-space: nowrap;
  background-color: ${({ $status }) => ($status === 'planned' ? 'var(--accent-color)' : 'var(--grey-20)')};
  color: ${({ $status }) => ($status === 'planned' ? '#4f6a64' : 'var(--grey-100)')};

  &::before {
    content: '';
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 0.1875rem;
    background-color: ${({ $status }) =>
      $status === 'planned' ? 'var(--accent-color-intense)' : 'var(--grey-60)'};
  }
`;

const LABELS: Record<Status, string> = {
  planned: 'Заплановано',
  done: 'Завершено',
};

function StatusBadge({ status }: { status: Status }) {
  return <Badge $status={status}>{LABELS[status]}</Badge>;
}

export default StatusBadge;
