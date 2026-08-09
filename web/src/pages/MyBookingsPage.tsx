import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

import CalendarIcon from '../assets/icons/Calendar_Days.svg?react';
import WarningIcon from '../assets/icons/Triangle_Warning.svg?react';
import BookingRow from '../components/bookings/BookingRow';
import MyBookingsTabs from '../components/bookings/MyBookingsTabs';
import NextBookingCard from '../components/bookings/NextBookingCard';
import SeriesCard from '../components/bookings/SeriesCard';
import { useCancelBooking } from '../components/bookings/useCancelBooking';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { isSameDay } from '../lib/time';
import { useNow } from '../lib/useNow';
import {
  useGetCurrentBookingQuery,
  useGetMyBookingsInfiniteQuery,
  useGetMySeriesQuery,
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

type MyTab = 'upcoming' | 'past' | 'series';

function MyBookingsPage() {
  const [tab, setTab] = useState<MyTab>('upcoming');
  const now = useNow();
  const navigate = useNavigate();
  const { requestCancel, requestCancelSeries, dialog } = useCancelBooking();

  const { data: current } = useGetCurrentBookingQuery();
  const upcoming = useGetMyBookingsInfiniteQuery('upcoming');
  const past = useGetMyBookingsInfiniteQuery('past');
  const seriesQuery = useGetMySeriesQuery();
  const series = seriesQuery.data ?? [];

  const scope: BookingScope = tab === 'past' ? 'past' : 'upcoming';
  const active = tab === 'past' ? past : upcoming;
  const all = (active.data?.pages ?? []).flatMap((page) => page.bookings);

  // хайлайт не дублюємо в списку майбутніх
  const bookings =
    scope === 'upcoming' && current ? all.filter((booking) => booking.id !== current.id) : all;

  const tabs = [
    { key: 'upcoming', label: 'Майбутні', count: upcoming.data?.pages[0]?.total ?? 0 },
    { key: 'past', label: 'Минулі', count: past.data?.pages[0]?.total ?? 0 },
    { key: 'series', label: 'Повторювані', count: series.length },
  ];

  const cancel = (booking: MyBooking) =>
    requestCancel({ id: booking.id, roomId: booking.room.id, seriesId: booking.seriesId });

  const renderRows = (items: MyBooking[]) =>
    items.map((booking) => (
      <BookingRow
        key={booking.id}
        booking={booking}
        scope={scope}
        onCancel={() => cancel(booking)}
      />
    ));

  const errorState = (onRetry: () => void) => (
    <EmptyState
      tone="error"
      icon={<WarningIcon />}
      title="Не вдалося завантажити"
      description="Щось пішло не так. Перевір зʼєднання та спробуй ще раз."
    >
      <Button onClick={onRetry}>Спробувати ще раз</Button>
    </EmptyState>
  );

  const renderSeries = () => {
    if (seriesQuery.isError) return errorState(() => seriesQuery.refetch());
    if (seriesQuery.isLoading)
      return (
        <Section>
          <Skeleton />
          <Skeleton />
        </Section>
      );
    if (series.length === 0)
      return (
        <EmptyState
          icon={<CalendarIcon />}
          title="Немає повторюваних бронювань"
          description="Увімкни «Повторювати щотижня» під час бронювання — серія зʼявиться тут."
        >
          <Button onClick={() => navigate('/')}>До бронювання</Button>
        </EmptyState>
      );
    return (
      <Section>
        {series.map((item) => (
          <SeriesCard
            key={item.seriesId}
            series={item}
            onCancel={() => requestCancelSeries({ seriesId: item.seriesId, roomId: item.room.id })}
          />
        ))}
      </Section>
    );
  };

  const renderBookings = () => {
    if (active.isError) return errorState(() => active.refetch());
    if (active.isLoading)
      return (
        <Section>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </Section>
      );
    if (bookings.length === 0)
      return scope === 'upcoming' ? (
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
    if (scope === 'past')
      return (
        <Section>
          <SectionHeader>Минулі</SectionHeader>
          {renderRows(bookings)}
        </Section>
      );

    const isToday = (booking: MyBooking) => isSameDay(new Date(booking.startsAt), new Date(now));
    const today = bookings.filter(isToday);
    const later = bookings.filter((booking) => !isToday(booking));
    return (
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
  };

  return (
    <Wrap>
      <Title>Мої бронювання</Title>

      {current && (
        <NextBookingCard
          booking={current}
          now={now}
          onCancel={() =>
            requestCancel({ id: current.id, roomId: current.room.id, seriesId: current.seriesId })
          }
        />
      )}

      <MyBookingsTabs tabs={tabs} value={tab} onChange={(key) => setTab(key as MyTab)} />

      {tab === 'series' ? renderSeries() : renderBookings()}

      {tab !== 'series' && active.hasNextPage && (
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
