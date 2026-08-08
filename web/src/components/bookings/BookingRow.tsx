import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { formatBookingDay, formatDuration, formatTime } from '../../lib/time';
import type { BookingScope, MyBooking } from '../../store/api/bookingsApi';
import { media } from '../../styles/media';
import Button from '../ui/Button';
import { scheduleLinkFor } from './scheduleLink';
import StatusBadge from './StatusBadge';

const Row = styled.article`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  overflow: hidden;
  padding: 1.125rem 1.4375rem 1.1875rem 1.6875rem;
  background-color: var(--base-white);
  border: 1px solid var(--base-bright-grey);
  border-radius: 1rem;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;

  &:hover {
    border-color: var(--accent-color-border-hover);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08);
    transform: translateY(-0.125rem);
  }

  ${media.phone} {
    flex-direction: column;
    align-items: stretch;
    gap: 0.875rem;
    padding: 1rem 1.125rem;
  }
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  min-width: 0;

  ${media.phone} {
    gap: 1rem;
  }
`;

const TimeCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
  width: 5.5rem;
  flex-shrink: 0;
`;

const Time = styled.span<{ $muted: boolean }>`
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 300;
  font-size: 1.1rem;
  line-height: 1.65rem;
  color: ${({ $muted }) => ($muted ? 'var(--grey-100)' : 'var(--primary-black)')};
`;

const EndLabel = styled.span`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.75rem;
  line-height: 1.125rem;
  color: var(--grey-100);
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  min-width: 0;
`;

const Title = styled.span<{ $muted: boolean }>`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 1.1rem;
  line-height: 1.65rem;
  color: ${({ $muted }) => ($muted ? 'var(--grey-100)' : 'var(--primary-black)')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 0.5rem;
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.8125rem;
  line-height: 1.21875rem;
  color: var(--secondary-text);
`;

const Dot = styled.span`
  color: var(--base-bright-grey);
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;

  ${media.phone} {
    justify-content: space-between;
  }
`;

type BookingRowProps = {
  booking: MyBooking;
  scope: BookingScope;
  onCancel?: () => void;
};

function BookingRow({ booking, scope, onCancel }: BookingRowProps) {
  const navigate = useNavigate();
  const past = scope === 'past';
  const durationMin =
    (new Date(booking.endsAt).getTime() - new Date(booking.startsAt).getTime()) / 60_000;

  const open = () => navigate(scheduleLinkFor(booking.room.id, booking.startsAt, booking.endsAt));

  return (
    <Row
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter') open();
      }}
      title="Відкрити в розкладі"
    >
      <Left>
        <TimeCol>
          <Time $muted={past}>{formatTime(booking.startsAt)}</Time>
          <EndLabel>до {formatTime(booking.endsAt)}</EndLabel>
        </TimeCol>
        <Info>
          <Title $muted={past}>{booking.title}</Title>
          <Meta>
            <span>{booking.room.name}</span>
            <Dot>•</Dot>
            <span>{formatBookingDay(booking.startsAt)}</span>
            <Dot>•</Dot>
            <span>{formatDuration(durationMin)}</span>
          </Meta>
        </Info>
      </Left>
      <Right>
        <StatusBadge status={past ? 'done' : 'planned'} />
        {!past && onCancel && (
          <Button
            variant="dangerSoft"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onCancel();
            }}
          >
            Скасувати
          </Button>
        )}
      </Right>
    </Row>
  );
}

export default BookingRow;
