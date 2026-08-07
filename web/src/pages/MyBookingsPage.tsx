import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

import CalendarIcon from '../assets/icons/Calendar_Days.svg?react';
import WarningIcon from '../assets/icons/Triangle_Warning.svg?react';
import BookingRow from '../components/bookings/BookingRow';
import MyBookingsTabs from '../components/bookings/MyBookingsTabs';
import NextBookingCard from '../components/bookings/NextBookingCard';
import { useCancelBooking } from '../components/bookings/useCancelBooking';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { isSameDay } from '../lib/time';
import { useNow } from '../lib/useNow';
import {
  useGetCurrentBookingQuery,
  useGetMyBookingsInfiniteQuery,
  type BookingScope,
  type MyBooking,
} from '../store/api/bookingsApi';
import { text } from '../styles/typography';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
`;

const Title = styled.h1`
  ${text.h5};
  color: var(--primary-black);
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SectionHeader = styled.h2`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.6875rem;
  line-height: 1.125rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--grey-100);
`;

const LoadMore = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 0.25rem;
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
`;

const Skeleton = styled.div`
  height: 5.5rem;
  border-radius: 1rem;
  background-color: var(--grey-20);
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

function MyBookingsPage() {
  const [scope, setScope] = useState<BookingScope>('upcoming');
  const now = useNow();
  const navigate = useNavigate();
  const { requestCancel, dialog } = useCancelBooking();

  const { data: current } = useGetCurrentBookingQuery();
  const upcoming = useGetMyBookingsInfiniteQuery('upcoming');
  const past = useGetMyBookingsInfiniteQuery('past');

  const active = scope === 'upcoming' ? upcoming : past;
  const all = (active.data?.pages ?? []).flatMap((page) => page.bookings);

  // хайлайт не дублюємо в списку майбутніх
  const bookings =
    scope === 'upcoming' && current ? all.filter((booking) => booking.id !== current.id) : all;

  const counts = {
    upcoming: upcoming.data?.pages[0]?.total ?? 0,
    past: past.data?.pages[0]?.total ?? 0,
  };

  const cancel = (booking: MyBooking) => requestCancel({ id: booking.id, roomId: booking.room.id });

  const renderRows = (items: MyBooking[]) =>
    items.map((booking) => (
      <BookingRow
        key={booking.id}
        booking={booking}
        scope={scope}
        onCancel={() => cancel(booking)}
      />
    ));

  let content;
  if (active.isError) {
    content = (
      <EmptyState
        tone="error"
        icon={<WarningIcon />}
        title="Не вдалося завантажити"
        description="Щось пішло не так. Перевір зʼєднання та спробуй ще раз."
      >
        <Button onClick={() => active.refetch()}>Спробувати ще раз</Button>
      </EmptyState>
    );
  } else if (active.isLoading) {
    content = (
      <Section>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </Section>
    );
  } else if (bookings.length === 0) {
    content =
      scope === 'upcoming' ? (
        <EmptyState
          icon={<CalendarIcon />}
          title="Немає майбутніх бронювань"
          description="Заброньуй переговорну — і вона зʼявиться тут."
        >
          <Button onClick={() => navigate('/')}>До бронювання</Button>
        </EmptyState>
      ) : (
        <EmptyState
          icon={<CalendarIcon />}
          title="Тут поки порожньо"
          description="Завершені бронювання зʼявляться тут після зустрічей."
        />
      );
  } else if (scope === 'upcoming') {
    const today = bookings.filter((booking) =>
      isSameDay(new Date(booking.startsAt), new Date(now)),
    );
    const later = bookings.filter(
      (booking) => !isSameDay(new Date(booking.startsAt), new Date(now)),
    );
    content = (
      <Sections>
        {today.length > 0 && (
          <Section>
            <SectionHeader>Далі сьогодні</SectionHeader>
            {renderRows(today)}
          </Section>
        )}
        {later.length > 0 && (
          <Section>
            <SectionHeader>Наступні</SectionHeader>
            {renderRows(later)}
          </Section>
        )}
      </Sections>
    );
  } else {
    content = (
      <Section>
        <SectionHeader>Минулі</SectionHeader>
        {renderRows(bookings)}
      </Section>
    );
  }

  return (
    <Wrap>
      <Title>Мої бронювання</Title>

      {current && (
        <NextBookingCard
          booking={current}
          now={now}
          onCancel={() => requestCancel({ id: current.id, roomId: current.room.id })}
        />
      )}

      <MyBookingsTabs value={scope} counts={counts} onChange={setScope} />

      {content}

      {active.hasNextPage && (
        <LoadMore>
          <Button
            variant="secondary"
            isLoading={active.isFetchingNextPage}
            onClick={() => active.fetchNextPage()}
          >
            Завантажити ще
          </Button>
        </LoadMore>
      )}

      {dialog}
    </Wrap>
  );
}

export default MyBookingsPage;
