import { Link } from 'react-router-dom';
import styled from 'styled-components';

import ClockIcon from '../../assets/icons/Clock.svg?react';
import { humanizeDuration } from '../../lib/relativeTime';
import { formatBookingDay, formatTime, isSameDay } from '../../lib/time';
import type { CurrentBooking } from '../../store/api/bookingsApi';
import { CancelButton } from './CancelButton';
import { scheduleLinkFor } from './scheduleLink';

const Card = styled.article<{ $running: boolean }>`
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  overflow: hidden;
  padding: 1.5625rem 1.8125rem 1.5625rem 1.9375rem;
  background-color: var(--base-white);
  border: 1px solid var(--base-bright-grey);
  border-radius: 1.75rem;
  box-shadow: 0 0.5rem 1.5rem -0.75rem rgba(13, 13, 13, 0.22);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 1.1875rem;
    background-color: ${({ $running }) =>
      $running ? 'var(--malachite-100)' : 'var(--accent-color-intense)'};
  }
`;

const Left = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
`;

const Label = styled.div<{ $running: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.6875rem;
  line-height: 1.03rem;
  letter-spacing: 1.54px;
  text-transform: uppercase;
  color: ${({ $running }) => ($running ? 'var(--malachite-100)' : 'var(--accent-color-intense)')};

  &::before {
    content: '';
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 0.1875rem;
    background-color: currentColor;
  }
`;

const Title = styled.h2`
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 400;
  font-size: 1.6rem;
  line-height: 1.76rem;
  color: var(--primary-black);
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 0.5rem;
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.875rem;
  line-height: 1.3125rem;
  color: var(--secondary-text);
`;

const Clock = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.875rem;
  line-height: 1.3125rem;
  color: var(--primary-black);

  svg {
    width: 1rem;
    height: 1rem;
    color: var(--secondary-text);
    flex-shrink: 0;
  }
`;

const Right = styled.div`
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
`;

const Countdown = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const Big = styled.span`
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 300;
  font-size: 1.5rem;
  line-height: 2.25rem;
  color: var(--primary-black);
  white-space: nowrap;
`;

const Small = styled.span`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.75rem;
  line-height: 1.125rem;
  letter-spacing: 0.24px;
  color: var(--grey-100);
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const OpenLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  padding: 0 1.3125rem;
  border: 1px solid var(--primary-black);
  border-radius: 0.75rem;
  background-color: var(--base-white);
  font-family: 'e-Ukraine', sans-serif;
  font-size: 0.8125rem;
  letter-spacing: -0.26px;
  color: var(--primary-black);
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--primary-grey);
  }
`;

type NextBookingCardProps = {
  booking: CurrentBooking;
  now: number;
  onCancel: () => void;
};

function NextBookingCard({ booking, now, onCancel }: NextBookingCardProps) {
  const start = new Date(booking.startsAt).getTime();
  const end = new Date(booking.endsAt).getTime();
  const running = start <= now && now < end;

  const dayLabel = isSameDay(new Date(booking.startsAt), new Date(now))
    ? 'Сьогодні'
    : formatBookingDay(booking.startsAt);
  const scheduleLink = scheduleLinkFor(booking.room.id, booking.startsAt, booking.endsAt);

  return (
    <Card $running={running}>
      <Left>
        <Label $running={running}>Наступне бронювання</Label>
        <Title>{booking.title}</Title>
        <Meta>
          <span>{booking.room.name}</span>
          <span>•</span>
          <span>{booking.room.capacity} місць</span>
          <span>•</span>
          <span>{booking.room.floor} поверх</span>
        </Meta>
        <Clock>
          <ClockIcon />
          {dayLabel}, {formatTime(booking.startsAt)} – {formatTime(booking.endsAt)}
        </Clock>
      </Left>

      <Right>
        <Countdown>
          <Big>
            {running
              ? `залишилося ${humanizeDuration(end - now)}`
              : `за ${humanizeDuration(start - now)}`}
          </Big>
          <Small>{running ? 'до кінця' : 'до початку'}</Small>
        </Countdown>
        <Actions>
          <OpenLink to={scheduleLink}>Відкрити розклад</OpenLink>
          {!running && (
            <CancelButton type="button" onClick={onCancel}>
              Скасувати
            </CancelButton>
          )}
        </Actions>
      </Right>
    </Card>
  );
}

export default NextBookingCard;
